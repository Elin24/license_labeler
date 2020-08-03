/******************** gt labels ****************/
class GTCar {
    constructor(label=null) {
        this.car = Array(4);
        this.lic = Array(4);

        this.number = 'xx-xxxxx';
        if(label != null) {
            for(var i = 0; i < 4; i ++) {
                this.car[i] = label.carBox[parseInt(i / 2)][i % 2];
                this.lic[i] = label.licPoly[i];
            }
            this.number = label.licNumber;
        }
    }

    fakeLabel(head, tail, segnum, segid) {
        for(var i = 0; i < 4; i++) {
            this.car[i] = head.car[i] + (tail.car[i] - head.car[i]) * segid / segnum;
            this.lic[i] = [
                head.lic[i][0] + (tail.lic[i][0] - head.lic[i][0]) * segid / segnum,
                head.lic[i][1] + (tail.lic[i][1] - head.lic[i][1]) * segid / segnum
            ]
        }
    }

    diff(obj) {
        for(var i = 0; i < 4; i ++) {
            if(this.car[i] != obj.car[i] 
            || this.lic[i][0] != obj.lic[i][0]
            || this.lic[i][1] != obj.lic[i][1]) return true;
        }
        return false;
    }

    todict() {
        return {
            carBox: [[this.car[0], this.car[1]], [this.car[2], this.car[3]]],
            licPoly: this.lic,
            licNumber: this.number
        }
    }
}

/******************** gt labels ****************/
GTLabels = {
    labels: {},
    saveType: {},
    frameNum: videoLen,
    requireServer: function() {
        var sendInfo = {
            videoName: VideoClips.videofold.replace('static/', '')
        };
        for(var i = 1; i <= this.frameNum; i++) {
            this.labels[i] = {};
        }
        $.post('/requireAll', sendInfo, function (result) {
            for(idx in result.labels) {
                GTLabels.labels[idx] = result.labels[idx];
            }
            GTLabels.saveType = result.labelTypes;
            //Car.resetIdx(result.labelTypes.length + 1);

            // in button.js
            requireLabel();
        });
    },
    finetuning: function(idx, hid, tid) {
        var sec = tid - hid;
        var hcar = new GTCar(this.labels[hid][idx]),
            tcar = new GTCar(this.labels[tid][idx]);
        for(var fid = hid + 1; fid < tid; fid++) {
            var fcar = new GTCar();
            fcar.fakeLabel(hcar, tcar, sec, fid - hid);
            this.labels[fid][idx] = fcar.todict();
        }
    },
    writeLicNum: function(idx){
        for(var i = 1; i <= this.frameNum; i++) {
            for(carId in this.labels[i]) {
                if(carId in this.labels[idx]) {
                    this.labels[i][carId].licNumber = this.labels[idx][carId].licNumber;
                }
            }
        }
    },
    testDelAdd: function(fid, oldInfo, newInfo) {
        // test
        var delIds = [], addIds = [];
        for(var cid in oldInfo) {
            if(!(cid in newInfo)) delIds.push(cid);
        }
        for(var cid in newInfo) {
            if(!(cid in oldInfo)) addIds.push(cid);
        }
        for(var i = fid + 1; i <= this.frameNum; i++) {
            for(var d in delIds) {
                var dId = delIds[d];
                delete this.labels[i][dId];
                this.saveType[dId][fid] = false;
            }
            for(var a in addIds) {
                var aId = addIds[a];
                this.labels[i][aId] = {};
                Object.assign(this.labels[i][aId], newInfo[aId]);
            }
        }
        for(var a in addIds) {
            var aId = addIds[a];
            this.saveType[aId] = new Array(this.frameNum + 1);
            //console.log(this.saveType);
            for(var i = 0; i <= this.frameNum; i++) {
                this.saveType[aId][i] = false;
            }
            this.saveType[aId][fid] = true;
        }
    },
    carChange: function(car1, car2) {
        var car1 = new GTCar(car1), car2 = new GTCar(car2);
        return car1.diff(car2);
    },
    saveLabel: function(idx, labelInfo) {
        var i, tempInfo = this.labels[idx];
        this.labels[idx] = labelInfo;
        //this.saveType[idx] = true;

        for(var cid in labelInfo) {
            if((cid in tempInfo) && this.carChange(labelInfo[cid], tempInfo[cid])) {
                this.saveType[cid][idx] = true;
                var svSeq = this.saveType[cid];
                for(i = idx - 1; i > 0; i--) {
                    if(svSeq[i]) break;
                }
                if(i > 0) this.finetuning(cid, i, idx);

                for(i = idx + 1; i <= this.frameNum; i++) {
                    if(svSeq[i]) break;
                }
                if(i <= this.frameNum) this.finetuning(cid, idx, i);
                else {
                    for(var j = idx + 1; j <= this.frameNum; j++) {
                        this.labels[j][cid] = {};
                        Object.assign(this.labels[j][cid], labelInfo[cid]);
                    }
                }
            }
        }
        
        //this.labels[idx] = tempInfo;
        this.testDelAdd(idx, tempInfo, labelInfo);
        //this.labels[idx] = labelInfo;
        
        this.writeLicNum(idx);

        //this.normalize();
    },
    getLabel: function(idx) {
        if(idx in this.labels) {
            return this.labels[idx];
        } else {
            return null;
        }
    }
}
