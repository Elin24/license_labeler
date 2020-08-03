/******************** button function ****************/

function MousePos(event, _canvas = canvas) {
    //event.preventDefault();
    var event = (event ? event : window.event);
    var loc = {
        x: event.pageX - _canvas.offsetLeft,
        y: event.pageY - _canvas.offsetTop
    }
    return loc;
}

function changeLineWidth() {
    LabelBoard.drawAttr.width = wslider.getValue();
    LabelBoard.draw();
}

var wslider = $("#wslider").slider({tooltip: 'hide'})
    .on('slide', changeLineWidth)
    .data('slider');

function changeFrame() {
    var idx = fmslider.getValue();
    while (true) {
        var vidx = VideoClips.clips[VideoClips.labelIdx].idx;
        if(vidx == idx) break;
        VideoClips.indexMove(vidx > idx, Math.abs(vidx - idx) <= 4);
    }
    requireLabel();
    refreshpage();
}

var fmslider = new Slider("#ex12a", {
    id: "frameSlider",
    min: 1,
    max: videoLen,
    value: 1,
    tooltip: 'always',
}).on('change', changeFrame);

function drawSchedule(done, data) {
    fmslider.setValue(done);

    var proele = $("#body .progress"), finele = $('#body #endconfirm');
    if(done == data) {
        if(!proele.hasClass('hide')) proele.addClass('hide');
        if(finele.hasClass('hide')) finele.removeClass('hide');
    } else {
        if(proele.hasClass('hide')) proele.removeClass('hide');
        if(!finele.hasClass('hide')) finele.addClass('hide');
    }

}

function requireLabel() {
    var fidx = VideoClips.clips[VideoClips.labelIdx].idx;

    drawSchedule(fidx, GTLabels.frameNum);

    var label = GTLabels.getLabel(fidx);
    if(label != null) {
        Car.resetIdx();
        LabelBoard.setLabelInfo(label);
        refreshpage();
        return true;
    }
    return false;
}

function saveLabel(progress='half') {
    // save to GTLabels
    var frameIdx = VideoClips.clips[VideoClips.labelIdx].idx,
        labelInfo = LabelBoard.getLabelInfo();
    GTLabels.saveLabel(frameIdx, labelInfo);

    var sendInfo = {
        name: user,
        progress: progress,
        videoName: VideoClips.videofold.replace('static/', ''),
        labelInfo: JSON.stringify(GTLabels.labels),
        saveType: JSON.stringify(GTLabels.saveType)
    };
    
    $.post('/saveAll', sendInfo, function (result) {
        if (result.success) {
            var savediv = $('#saveshow');
            //drawSchedule(result.donelen, result.halflen, result.datalen);
            savediv.removeClass('hide');
            setTimeout(() => { savediv.addClass('hide');}, 1000);
            if(progress == 'done') {
                // https://www.cnblogs.com/zyjfire/p/11550172.html
                var temp_form = document.createElement("form");
                temp_form.action = '/table';
                temp_form.target = "_self";
                temp_form.method = "post";
                temp_form.style.display = "none";
                var paras = {
                    user: result.user,
                    password: result.password
                }
                for (var item in paras) {
                    var opt = document.createElement("input");
                    //设置 name 参数
                    opt.name = item;
                    opt.value = paras[item];
                    temp_form.appendChild(opt);
                }
                //提交数据
                document.body.appendChild(temp_form);
                temp_form.submit();
            }
        }
    });
}

function refreshpage() {
    VideoClips.draw();
    LabelBoard.draw();
}

function new2rec(nres=0) {
    var idnames = ['newcar', 'rectify'];
    for(var i in idnames) {
        var idname = idnames[i];
        var ele = $('#' + idname);
        if(ele.hasClass('btn-success')) {
            ele.removeClass('btn-success');
        }
        if(!ele.hasClass('btn-primary')) {
            ele.addClass('btn-primary');
        }
    }
    $('#' + idnames[nres]).removeClass('btn-primary');
    $('#' + idnames[nres]).addClass('btn-success');
}

function deleteWarning() {
    for(var i = 0; i < LabelBoard.cars.length; i++) {
        if(LabelBoard.cars[i] == LabelBoard.control) {
            LabelBoard.delCar(i);
            break;
        }
    }
    refreshpage();
}


$(document).keydown(function (e) {
    //https://stackoverflow.com/questions/28062737/javascript-keydown-shortcut-function-but-ignore-if-in-text-box
    var event = document.all ? window.event : e;
    if(event.ctrlKey) {
        if(event.keyCode == 83) {
            event.preventDefault();
            saveLabel();
        }
        return ;
    }
    if (!/^(?:input|textarea|select|button)$/i.test(e.target.tagName)) {
        event.preventDefault();
        console.log(event.keyCode);
        if(event.keyCode == 75) { // 'J'
            VideoClips.indexMove(true);
            requireLabel();
        } else if(event.keyCode == 74) { //'K'
            VideoClips.indexMove(false);
            requireLabel();
        }
        else if(event.keyCode == 46) {
            deleteWarning();
        }
        // zoom move
        else if(event.keyCode == 87) { // W = up
            LabelBoard.patchmove('up');
        }
        else if(event.keyCode == 83) { // S = down
            LabelBoard.patchmove('down');
        }
        else if(event.keyCode == 65) { // A = left
            LabelBoard.patchmove('left');
        }
        else if(event.keyCode == 68) { // D = right
            LabelBoard.patchmove('right');
        }
        refreshpage();
    }
});

// $.ctrl = function (key, callback, args) {
//     var isCtrl = false;
//     $(document).keydown(function (e) {
//         if (!args) args = [];

//         if (e.ctrlKey) isCtrl = true;
//         if (e.keyCode == key.charCodeAt(0) && isCtrl) {
//             console.log('aaaaaaaaaaa');
//             callback.apply(this, args);
//             return false; //you can remove this line if you need bookamrk
//         }
//     }).keyup(function (e) {
//         if (e.ctrlKey) isCtrl = false;
//     });
// };

// $.ctrl('S', function () {
//     console.log('push ctrl + S');
//     saveLabel();
// });

$(document).ready(function () {
    $('#newcar').click(function(){
        LabelBoard.opType = 'new';
        LabelBoard.draw();
        new2rec();
    });
    $('#rectify').click(function(){
        LabelBoard.opType = 'rectify';
        LabelBoard.draw();
        new2rec(1);
    });
    $('#savebtn').click(function() {
        saveLabel();
    });
    $('#videoclips').on('mousewheel', function (event) {
        event.preventDefault();
        VideoClips.indexMove(event.originalEvent.wheelDelta > 0);
        requireLabel();
        refreshpage();
        console.log('show', VideoClips.clips[VideoClips.labelIdx].idx);
    });
    $('#videoclips').on('click', function (event) {
        var pos = MousePos(event, this);
        var y = Math.floor(pos.y / VideoClips.sdp.height);
        if (y < VideoClips.clips.length) {
            VideoClips.labelIdx = y;
            requireLabel();
            refreshpage();
        }
    });
    LabelBoard.labelMouseBind();

    $('#deletecar').click(function(){
        deleteWarning();
    });

    $('#pc-red').click(()=>{
        LabelBoard.drawAttr.color = 'red';
        LabelBoard.draw();
    });
    $('#pc-green').click(()=>{
        LabelBoard.drawAttr.color = '#00CC99';
        LabelBoard.draw();
    });
    $('#pc-orange').click(()=>{
        LabelBoard.drawAttr.color = '#FF6600';
        LabelBoard.draw();
    });
    $('#endconfirm button').click(function() {
        saveLabel('done');
    });

    $('#labelboard').on('mousewheel', function (event) {
        event.preventDefault();
        if (event.ctrlKey) {
            if (event.originalEvent.wheelDelta > 0) {
                LabelBoard.zoom('in'); // zoom in
                console.log('zoom in');
            } else {
                LabelBoard.zoom('out'); // zoom out
                console.log('zoom out');
            }
        } else if (event.shiftKey) {
            if (event.originalEvent.wheelDelta > 0) {
                LabelBoard.patchmove('left'); // left
            } else {
                LabelBoard.patchmove('right');// right
            }
        } else {
            if (event.originalEvent.wheelDelta > 0) {
                LabelBoard.patchmove('up'); // up
            } else {
                LabelBoard.patchmove('down');// down
            }
        }
        console.log('delta =', event.originalEvent.wheelDelta);
        LabelBoard.draw();
        //refreshpage();
    });

    $('#frameSlider').width(1280);
});