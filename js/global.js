/******************** global function ****************/
function drawPoint(context, x, y, color = '#f00', width = 1) {
    context.beginPath();
    context.lineCap = 'round';
    context.moveTo(x, y);
    context.lineTo(x, y);
    context.closePath();
    context.lineWidth = width;
    context.strokeStyle = color;
    context.stroke();
}

function drawPoly(context, xs, ys, borderColor = null, fillColor = null, borderWidth = 1) {
    context.beginPath()
    context.moveTo(xs[0], ys[0]);
    for(var i = 1; i < 4; i++) {
        context.lineTo(xs[i], ys[i]);
    }
    context.closePath();
    if (fillColor != null) {
        context.fillStyle = fillColor;
        context.fill();
    }
    if (borderColor != null) {
        context.lineWidth = borderWidth;
        context.strokeStyle = borderColor;
        context.stroke();
    }
}

function drawRect(context, x, y, width, height, borderColor = null, fillColor = null, borderWidth = 1) {
    var xs = [x, x + width, x + width, x];
    var ys = [y, y, y + height, y + height];
    drawPoly(context, xs, ys, borderColor, fillColor, borderWidth);
}

// https://stackoverflow.com/questions/14744717/how-to-edit-and-update-td-value-when-double-click-jquery
function updateVal(currentEle, value) {
    $(document).off('click');
    $(currentEle).html('<input class="thVal" type="text" value="' + value + '" />');
    $(".thVal").focus();
    $(".thVal").keyup(function (event) {
        if (event.keyCode == 13) {
            $(currentEle).html($(".thVal").val());
        }
        else if(event.keyCode == 27) {
            $(currentEle).html(value);
        }
    });

    $(document).click(function () {

            if($(event.target).attr('class')!="thVal")
            {
                $(currentEle).html($(".thVal").val());
                $(document).off('click');
            }

    });
  }

/******************** global class ****************/

var cursors = ['default', 'n-resize', 'e-resize', 's-resize', 'w-resize', 'move'];

class Box {
    static type = 'Box';
    constructor(sx = 0, sy = 0, ex = 0, ey = 0) {
        this.sx = sx;
        this.sy = sy;
        this.ex = ex;
        this.ey = ey;
    }
    set(sx, sy, ex, ey) {
        this.sx = sx;
        this.sy = sy;
        this.ex = ex;
        this.ey = ey;
    }
    get() {
        return [this.sx, this.sy, this.ex, this.ey]
    }

    clone() {
        return new Box(this.sx, this.sy, this.ex, this.ey);
    }
    cloneFrom(_box) {
        this.sx = _box.sx;
        this.sy = _box.sy;
        this.ex = _box.ex;
        this.ey = _box.ey;
    }
    draw(ctx, labelLineColor='red', labelLineWidth=5) {
        var dattr = LabelBoard.drawAttr;
        var posx = Math.min(this.sx, this.ex);
        var posy = Math.min(this.sy, this.ey);
        var boxw = Math.abs(this.sx - this.ex);
        var boxh = Math.abs(this.sy - this.ey);
        drawRect(ctx, posx, posy, boxw, boxh, labelLineColor, null, labelLineWidth);
    }
    normalize(ix, iy, iw, ih) {
        var box = new Box((this.sx - ix) / iw, (this.sy - iy) / ih, (this.ex - ix) / iw, (this.ey - iy) / ih);
        return box;
    }
    unnormalize(ix, iy, iw, ih) {
        var box = new Box(this.sx * iw + ix, this.sy * ih + iy, this.ex * iw + ix, this.ey * ih + iy);
        return box;
    }
    distance(x, y, w, returnIndex = false) {
        // the order of pd is the same as margin in css.
        var pds = [
            (x > this.sx && x < this.ex) ? Math.abs(this.sy - y) : w,
            (y > this.sy && y < this.ey) ? Math.abs(this.ex - x) : w,
            (x > this.sx && x < this.ex) ? Math.abs(this.ey - y) : w,
            (y > this.sy && y < this.ey) ? Math.abs(this.sx - x) : w
        ];
        var minval = Math.min(...pds);
        var mindex = pds.indexOf(minval);
        if (returnIndex)
            return [mindex, minval];
        else
            return minval;
    }
    nearby(x, y, w) {
        var dist = this.distance(x, y, w, true);
        var mindex = dist[0], minval = dist[1];
        return minval < w ? mindex + 1 : 0;
    }

    rectify(x, y, idx) {
        switch(idx) {
            case 0: this.sy = y; break;
            case 1: this.ex = x; break;
            case 2: this.ey = y; break;
            case 3: this.sx = x; break;
        }
    }
}

class PolyBox {
    static type = 'PolyBox';

    constructor(xs, ys) {
        this.xs = xs;
        this.ys = ys;
    }
    set(x, y, idx) {
        this.xs[idx] = x;
        this.ys[idx] = y;
    }
    get() {
        return [this.xs, this.ys]
    }

    clone() {
        return new Box(this.xs.slice(), this.ys.slice());
    }
    cloneFrom(_box) {
        this.ctx = _box.ctx;
        this.xs = _box.sx.slice();
        this.sy = _box.ys.slice();
    }
    draw(ctx, labelLineColor='red', labelLineWidth=5, polyPoint) {
        if(polyPoint) {
            for(var i = 0; i < this.xs.length; i++) {
                drawPoint(ctx, this.xs[i], this.ys[i], labelLineColor, labelLineWidth);
            }
        } else {
            drawPoly(ctx, this.xs, this.ys, labelLineColor, null, labelLineWidth);   
        }
    }
    normalize(ix, iy, iw, ih) {
        var nxs = [], nys = [];
        for(var i = 0; i < 4; i++) {
            nxs.push((this.xs[i] - ix) / iw);
            nys.push((this.ys[i] - ix) / ih)
        }
        var box = new PolyBox(nxs, nys);
        return box;
    }
    unnormalize(ix, iy, iw, ih) {
        var nxs = [], nys = [];
        for(var i = 0; i < 4; i++) {
            nxs.push(this.xs[i] * iw + ix);
            nys.push(this.ys[i] * ih + iy);
        }
        var box = new PolyBox(nxs, nys);
        return box;
    }

    nearby(x, y, w) {
        for(var i = 0; i < this.xs.length; i++) {
            var dx = x - this.xs[i], dy = y - this.ys[i];
            if(dx * dx + dy * dy <= w * w) return 5 + i;
        }
        return 0;
    }
    rectify(x, y, idx) {
        if(idx < 4) {
            this.xs[idx] = x;
            this.ys[idx] = y;
        }
    }
}

class Car {

    constructor(pos=null) {
        this.idx = Car.createIdx++;
        this.carBox = new Box();
        if(pos != null) this.carBox.set(pos.x, pos.y, pos.x, pos.y);

        this.license = null;
        this.ctrlUnit = -1;
        this.wall = 'baord';
    }
    
    setCarBox(sx, sy, ex, ey)
    {
        this.carBox.set(sx, sy, ex, ey);
    }
    getCarBox() {
        return this.carBox.get();
    }
    initLicense() {
        var posx = Math.min(this.carBox.sx, this.carBox.ex);
        var posy = Math.min(this.carBox.sy, this.carBox.ey);
        var boxw = Math.abs(this.carBox.sx - this.carBox.ex);
        var boxh = Math.abs(this.carBox.sy - this.carBox.ey);

        var fracDw = 3;
        var fracUp = parseInt(fracDw / 2);
        var sx = posx + boxw * fracUp / fracDw, ex = posx + boxw * (fracUp + 1) / fracDw;
        var sy = posy + boxh * fracUp / fracDw, ey = posy + boxh * (fracUp + 1) / fracDw;

        this.license = new PolyBox([sx, ex, ex, sx], [sy, sy, ey, ey]);

        this.wall = 'wall_' + Car.boardIdx++;
        var wall = '<div class="alert alert-danger" '
            + 'carid="car_' + this.idx + '" id="'
            + this.wall + '">'
            + '##-#####' + '</div>';
        $('#right').prepend(wall);

        $('#' + this.wall).click(function(e) {
            //console.log(this);
            var wallId = $(this).attr('id'), carId = $(this).attr('carid');
            if(wallId != LabelBoard.control.wall) {
                var idx = carId.replace('car_', '');
                LabelBoard.changeCtrl(idx);
                LabelBoard.draw();
            }
        });
        $('#' + this.wall).dblclick(function(e) {
            if($(event.target).attr('class')!="thVal") {
                e.stopPropagation();
                var currentEle = $(this);
                var value = $(this).html();
                updateVal(currentEle, value);
            }
        });
    }

    draw(ctx, boardercolor='red', borderWidth=1, rectify=false) {
        if(rectify) {
            ctx.save();
            ctx.setLineDash([5, 10]);
        }
        this.carBox.draw(ctx, boardercolor, borderWidth);
        if(this.license != null) {
            this.license.draw(ctx, boardercolor, borderWidth * (rectify ? 2.5 : 1), rectify);
        }
        if(rectify) {
            ctx.restore();
        }
    }
    
    nearby(canvas, mousePos, testW) {
        var closeType = this.carBox.nearby(mousePos.x, mousePos.y, testW);
        if(!closeType) {
            closeType = this.license.nearby(mousePos.x, mousePos.y, testW);
        }
        canvas.style.cursor = cursors[closeType > 5 ? 5: closeType];
        this.ctrlUnit = closeType;
        return closeType;
    }

    rectify(pos) {
        //console.log("rectify unit:", this.ctrlUnit);
        if(this.ctrlUnit <= 0 || this.ctrlUnit > 8) return ;
        else if (this.ctrlUnit < 5) this.carBox.rectify(pos.x, pos.y, this.ctrlUnit - 1);
        else this.license.rectify(pos.x, pos.y, this.ctrlUnit % 5);
    }

    posInCar(pos) {
        return (pos.x >= this.carBox.sx
                && pos.x <= this.carBox.ex
                && pos.y >= this.carBox.sy
                && pos.y <= this.carBox.ey
            );
    }
    genInfo() {
        var carbox = [
            [
                (Math.min(this.carBox.sx, this.carBox.ex)) / Car.shW,
                (Math.min(this.carBox.sy, this.carBox.ey)) / Car.shH,
            ], [
                (Math.max(this.carBox.sx, this.carBox.ex)) / Car.shW,
                (Math.max(this.carBox.sy, this.carBox.ey)) / Car.shH,
        ]];
        var licbox = [];
        for(var i = 0; i < this.license.xs.length; i++) {
            licbox.push({
                x: (this.license.xs[i]) / Car.shW,
                y: (this.license.ys[i]) / Car.shH
            });
        }
        // licbox.sort(function(a, b) {
        //     return (a.x < b.x) ? -1 : ((a.x == b.x) ? 0 : 1);
        // })
        // if(licbox[0].y > licbox[1].y) licbox[0] = [licbox[1], licbox[1] = licbox[0]][0];
        // if(licbox[2].y < licbox[3].y) licbox[2] = [licbox[3], licbox[3] = licbox[2]][0];
        for(var i = 0; i < licbox.length; i++) {
            licbox[i] = [licbox[i].x, licbox[i].y];
        }

        return {
            //idx: this.idx,
            carBox: carbox,
            licPoly: licbox,
            licNumber: $('#' + this.wall).text()
        }
    }

    setInfo(idx, label) {
        //console.log(idx, label);
        var carBox = label.carBox,
            licPoly = label.licPoly,
            licNumber = label.licNumber;
        
        this.idx = idx;
        this.carBox.set(
            carBox[0][0] * Car.shW, carBox[0][1] * Car.shH,
            carBox[1][0] * Car.shW, carBox[1][1] * Car.shH
        );

        this.initLicense();
        for(var i = 0; i < licPoly.length; i++) {
            this.license.set(
                licPoly[i][0] * Car.shW,
                licPoly[i][1] * Car.shH,
                i
            );
        }
        $('#' + this.wall).text(licNumber);
    }

    static resetIdx(idx) {
        var a = 0;
        for(var key in GTLabels.saveType) {
            a = Math.max(key, a);
        }
        console.log('max:', a);
        Car.createIdx = Car.boardIdx = a + 1;
    }
}
Car.offx = 40;
Car.offy = 22.5;
Car.createIdx = 0;
Car.boardIdx = 0;
Car.shW = 1200;
Car.shH = 675;
/******************** load frames ****************/

VideoClips = {
    // video source
    videofold: videofold,
    videoLen: videoLen,

    // canvas attribute
    clips: [],
    clipsload: 0,
    canvas: document.getElementById("videoclips"),
    ctx: document.getElementById("videoclips").getContext('2d'),
    labelIdx: 0,
    sdp: { // single Draw Para
        gap: 45 / 4,
        width: 240,
        height: 135
    },

    loadOneImg: function(fpath) {
        VideoClips.clipsload ++;
        console.log(VideoClips.clipsload, fpath);
        frame = new Image();
        frame.src = fpath;
        frame.onload = this.finishLoadOneImg;
        return frame;
    },

    finishLoadOneImg: function() {
        VideoClips.clipsload --;
    },

    getImage: function() {
        return this.clips[Math.min(VideoClips.labelIdx, VideoClips.clips.length)].image;
    },
    push: function(load=true) {
        var idx = 1;
        if(this.clips.length > 0) idx = this.clips[this.clips.length - 1].idx + 1;
        if(idx > this.videoLen) return false;

        var frame = this.videofold + '/frame' + idx.toString() + '.jpg';
        if (load) frame = this.loadOneImg(frame);
        this.clips.push({
            idx: idx,
            image: frame
        });
        return true;
    },
    pop: function() {
        if(this.clips.length <= 0) return false;
        this.clips.pop();
        return true;
    },
    shift: function() {
        if(this.clips.length <= 0) return false;
        this.clips.shift();
        return true;
    },
    unshift: function(load=true) {
        var idx = 1;
        if(this.clips.length > 0) idx = this.clips[0].idx - 1;
        if(idx < 1) return false;
        var frame = this.videofold + '/frame' + idx.toString() + '.jpg';
        if (load) frame = this.loadOneImg(frame);
        this.clips.unshift({
            idx: idx,
            image: frame
        });
        return true;
    },
    indexMove: function(moveUp=true, load=true) {
        if(moveUp) {
            if(this.labelIdx > 0) this.labelIdx --;
            else if(this.unshift(load)) this.pop();
        } else {
            if(this.labelIdx < this.clips.length - 1) this.labelIdx ++;
            else if(this.push(load)) this.shift();
        }
        //console.log("index Move:", this.labelIdx);
    },
    emphasize: function() {
        var epid = this.labelIdx;
        drawRect(this.ctx, 0, epid * (this.sdp.gap + this.sdp.height), this.sdp.width, this.sdp.height, 'red', null, 4);
    },

    draw: function() {
        frames = this.clips;
        if(frames != null) {
            if(this.clipsload == 0) {
                var frame;
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                // draw Image
                var offx = 0, offy = 0;
                for(var i = 0; i < frames.length; i++) {
                    frame = frames[i].image;
                    this.ctx.drawImage(frame, 0, 0, frame.width, frame.height, offx, offy, this.sdp.width, this.sdp.height);
                    offy += this.sdp.height + this.sdp.gap;
                }
                //draw box
                this.emphasize();
                // draw Index
                offx = 20, offy = 0;
                for(var i = 0; i < frames.length; i++) {
                    var fontSize = 40, idxStr = frames[i].idx.toString();
                    this.ctx.font = "bold " + (fontSize).toString() + "px Arial";
                    this.ctx.fillStyle = 'red';
                    this.ctx.fillText(idxStr, offx, offy + this.sdp.height / 2);
                    offy += this.sdp.height + this.sdp.gap;
                }
            } else {
                console.log('wait 500 ms,', this.clipsload, 'do not show.');
                setTimeout("VideoClips.draw()", 500);
            }
        }
    }
}

LabelBoard = {
    canvas: document.getElementById("labelboard"),
    ctx: document.getElementById("labelboard").getContext('2d'),
    cars: [],
    opType: 'rectify',
    opStatus: false,
    control: null,
    drawAttr: {
        color: 'red',
        atomW: 5,
        width: 5,

        rectifyColor: '#fff',
        atomRW: 3,
        rectifyWidth: 3,

        imx: 0,
        imy: 0,
        imr: 1
    },
    patchmove: function(dir) {
        var img = VideoClips.getImage(), imr =  this.drawAttr.imr, arate = 1 / 4;
        var imw = Car.shW, imh = Car.shH,
            imx = this.drawAttr.imx, imy = this.drawAttr.imy,
            awd = imw * imr * arate,
            ahd = imh * imr * arate;
        //console.log('imdata =', imw, imh, imx, imy);
        if(dir == 'left') {
            imx = Math.max(0, imx - awd);
        } else if(dir == 'right') {
            imx = Math.min(imw * (1 - imr), imx + awd);
        } else if(dir == 'up') {
            imy = Math.max(0, imy - ahd);
        } else if(dir == 'down') {
            imy = Math.min(imh * (1 - imr), imy + ahd);
        }
        console.log('imdata =', imw, imh, imx, imy, imr);
        this.drawAttr.imx = imx;
        this.drawAttr.imy = imy;
    },
    zoom: function(inout) {
        var img = img = VideoClips.getImage();
        var imr = this.drawAttr.imr, imx = this.drawAttr.imx, imy = this.drawAttr.imy;
        if(inout == 'in') {
            imr = imr / 2;
        } else if(inout == 'out') {
            imr = imr * 2;
        }
        imr = Math.max(Math.min(1, imr), 1 / 16);
        imx = Math.min(Car.shW * (1 - imr), imx);
        imy = Math.min(Car.shH * (1 - imr), imy);
        this.drawAttr.imr = imr;
        this.drawAttr.imx = imx;
        this.drawAttr.imy = imy;

        this.drawAttr.width = this.drawAttr.atomW * imr;
        this.drawAttr.rectifyWidth = this.drawAttr.atomRW * imr;
    },
    posTrans: function(pos) {
        return {
            x: (pos.x - Car.offx) * this.drawAttr.imr + this.drawAttr.imx,
            y: (pos.y - Car.offy) * this.drawAttr.imr + this.drawAttr.imy
        }
    },
    draw: function() {
        if(VideoClips.clips != null && VideoClips.clips.length > 0) {
            var image = VideoClips.getImage();
            if(VideoClips.clipsload == 0) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                var shW = Car.shW, shH = Car.shH;
                //var offx = (this.canvas.width - shW) / 2, offy = (this.canvas.height - shH) / 2;

                this.ctx.save();
                this.ctx.translate(Car.offx, Car.offy);
                this.ctx.scale(1 / this.drawAttr.imr, 1 / this.drawAttr.imr);
                this.ctx.translate(-this.drawAttr.imx, -this.drawAttr.imy);
                this.ctx.drawImage(image, 
                    0, 0, image.width, image.height,
                    //this.drawAttr.imx, this.drawAttr.imy, image.width * this.drawAttr.imr, image.height * this.drawAttr.imr,
                    0, 0, shW, shH);
                this.ctx.restore();
                
                this.ctx.save();
                var notmain = 'rgba(52, 73, 94, 0.6)';
                drawRect(this.ctx, 0, 0, Car.offx, this.canvas.height - Car.offy, null, notmain, 1);
                drawRect(this.ctx, Car.offx, 0,  this.canvas.width - Car.offx, Car.offy, null, notmain, 1);
                drawRect(this.ctx, this.canvas.width - Car.offx, Car.offy, Car.offx, this.canvas.height - Car.offy, null, notmain, 1);
                drawRect(this.ctx, 0, this.canvas.height - Car.offy, this.canvas.width - Car.offx, Car.offy, null, notmain, 0);
                this.ctx.restore();
                
                this.ctx.save();
                this.ctx.translate(Car.offx, Car.offy);
                this.ctx.scale(1 / this.drawAttr.imr, 1 / this.drawAttr.imr);
                this.ctx.translate(-this.drawAttr.imx, -this.drawAttr.imy);
                for(var i = 0; i < this.cars.length; i++) {
                    this.cars[i].draw(this.ctx, this.drawAttr.color, this.drawAttr.width);
                }
                if(this.control != null && this.opType == 'rectify') {
                    this.control.draw(this.ctx, this.drawAttr.rectifyColor, this.drawAttr.rectifyWidth, true);
                }
                this.ctx.restore();

                if(this.control != null && this.control.license != null) {
                    $('#right .well-lg').html(
                        "<p>x1=" + this.control.license.xs[0].toFixed(2) + ", y1=" + this.control.license.ys[0].toFixed(2) + "</p>" +
                        "<p>x2=" + this.control.license.xs[1].toFixed(2) + ", y2=" + this.control.license.ys[1].toFixed(2) + "</p>" +
                        "<p>x3=" + this.control.license.xs[2].toFixed(2) + ", y3=" + this.control.license.ys[2].toFixed(2) + "</p>" +
                        "<p>x4=" + this.control.license.xs[3].toFixed(2) + ", y4=" + this.control.license.ys[3].toFixed(2) + "</p>"
                    );
                } else {
                    $('#right .well-lg').html("no label");
                }
            } else {
                setTimeout("LabelBoard.draw()", 500);
            }
        }
    },
    changeCtrl: function(idx) {
        var aidx = 0;
        for(aidx = 0; aidx < this.cars.length; aidx++) {
            if(this.cars[aidx].idx == idx) break;
        }
        if(aidx >= this.cars.length) {
            this.control = null;
            this.opType = 'new';
            return ;
        }
        this.control = this.cars[aidx];
        
        this.cars.forEach(function(car) {
            var wall = $('#' + car.wall);
            if(wall.hasClass('alert-danger')) wall.removeClass('alert-danger');
            if(!wall.hasClass('alert-info')) wall.addClass('alert-info');
        });

        var wall = $('#' + this.control.wall);
        if(wall.length) {
            wall.removeClass('alert-info');
            wall.addClass('alert-danger');
        }
    },
    labelMouseBind: function() {
        this.canvas.onmousedown = function (e) {
            var loc = LabelBoard.posTrans(MousePos(e, this));
            switch(LabelBoard.opType) {
                case 'new':
                    LabelBoard.addCar(loc);
                    //console.log("cars len =", LabelBoard.cars.length);
                    LabelBoard.changeCtrl(LabelBoard.cars[LabelBoard.cars.length - 1].idx);
                    LabelBoard.opStatus = true;
                    break;
                case 'rectify':
                    if(LabelBoard.control == null) break;
                    var mouseType = 0;
                    if(LabelBoard.control != null) {
                        mouseType = LabelBoard.control.nearby(LabelBoard.canvas, loc, 5);
                    }
                    //console.log('mousetype:', mouseType);
                    if(mouseType > 0) {
                        LabelBoard.opStatus = true;
                    } else {
                        // test in which car
                        for(var i = LabelBoard.cars.length - 1; i >= 0; i--) {
                            if (LabelBoard.cars[i].posInCar(loc)) {
                                LabelBoard.changeCtrl(LabelBoard.cars[i].idx);
                                break;
                            }
                        }
                    }
                    break;
            }
            LabelBoard.draw();
        };

        this.canvas.onmousemove = function (e) {
            var loc = LabelBoard.posTrans(MousePos(e, this));
            switch(LabelBoard.opType) {
                case 'new':
                    if(!LabelBoard.opStatus) return ;
                    var carloc = LabelBoard.control.getCarBox();
                    carloc[2] = loc.x;
                    carloc[3] = loc.y;
                    LabelBoard.control.setCarBox(...carloc);
                    LabelBoard.draw();
                    break;
                case 'rectify':
                    if(LabelBoard.opStatus) {
                        //console.log("status", LabelBoard.opStatus);
                        LabelBoard.control.rectify(loc);
                        LabelBoard.draw();
                    } else {
                        if(LabelBoard.control != null) {
                            LabelBoard.control.nearby(LabelBoard.canvas, loc, LabelBoard.drawAttr.width);
                        }
                    }
                    break;
            }
        };

        this.canvas.onmouseup = function(e) {
            var loc = LabelBoard.posTrans(MousePos(e, this));
            //if(!LabelBoard.opStatus) return ;
            
            switch(LabelBoard.opType) {
                case 'new':
                    var carloc = LabelBoard.control.getCarBox();
                    carloc[2] = loc.x;
                    carloc[3] = loc.y;
                    LabelBoard.control.setCarBox(...carloc);
                    LabelBoard.opStatus = false;

                    LabelBoard.control.initLicense();

                    LabelBoard.opType = 'rectify';
                    break;
                case 'rectify':
                    if(LabelBoard.opStatus) {

                        LabelBoard.control.rectify(loc);
                        LabelBoard.opStatus = false;
                    }
                    break;
            }
            
            LabelBoard.draw();
        };
    },
    addCar: function(loc=null) {
        this.cars.push(new Car(loc));
        Car.createIdx ++;
    },
    delCar: function(idx) {
        $('#'+this.cars[idx].wall).remove();
        this.cars.splice(idx, 1);
        if(this.cars.length > 0) {
            this.changeCtrl(this.cars[0].idx);
        }  else {
            this.control = null;
        }
        //Car.createIdx --;
    },
    getLabelInfo: function() {
        var carsLabel = {};
        this.cars.forEach(function(car) {
            var info = car.genInfo();
            //console.log(info);
            carsLabel[car.idx] = info;
        });
        return carsLabel;
    },
    setLabelInfo: function(labels) {
        while (this.cars.length > 0) this.delCar(0);
        //console.log('delete to', this.cars.length);
        //console.log(labels);
        for(var key in labels) {
            this.addCar();
            //console.log(key);
            this.cars[this.cars.length-1].setInfo(key, labels[key]);
        }

        if(this.cars.length > 0) {
            this.changeCtrl(this.cars[0].idx);
            this.opType = 'rectify';
        }
    }
}

window.onload = function () {
    for (var i = 0; i < clipStack; i++) VideoClips.push();
    VideoClips.draw(); 
    LabelBoard.draw();
    GTLabels.requireServer();
};