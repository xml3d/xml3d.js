(function(){

function simulatedClick(target, options) {

    var event = target.ownerDocument.createEvent('MouseEvents'),
        options = options || {};

    //Set your default options to the right of ||
    var opts = {
        type: options.type                  || 'click',
        canBubble:options.canBubble             || true,
        cancelable:options.cancelable           || true,
        view:options.view                       || target.ownerDocument.defaultView,
        detail:options.detail                   || 1,
        screenX:options.screenX                 || 0, //The coordinates within the entire page
        screenY:options.screenY                 || 0,
        clientX:options.clientX                 || 0, //The coordinates within the viewport
        clientY:options.clientY                 || 0,
        ctrlKey:options.ctrlKey                 || false,
        altKey:options.altKey                   || false,
        shiftKey:options.shiftKey               || false,
        metaKey:options.metaKey                 || false, //I *think* 'meta' is 'Cmd/Apple' on Mac, and 'Windows key' on Win. Not sure, though!
        button:options.button                   || 0, //0 = left, 1 = middle, 2 = right
        relatedTarget:options.relatedTarget     || null,
    }

    //Pass in the options
    event.initMouseEvent(
        opts.type,
        opts.canBubble,
        opts.cancelable,
        opts.view,
        opts.detail,
        opts.screenX,
        opts.screenY,
        opts.clientX,
        opts.clientY,
        opts.ctrlKey,
        opts.altKey,
        opts.shiftKey,
        opts.metaKey,
        opts.button,
        opts.relatedTarget
    );

    //Fire the event
    target.dispatchEvent(event);
}

function simulatedMouseEvent(xml3dElement, type, x, y){
    var canvas = xml3dElement._configured.canvas;
    simulatedClick(canvas, {type: type, clientX: x, clientY: y});
}

module("Event tests", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            that.xml3dEl = that.doc.getElementById("myXml3d");
            start();
        };
        loadDocument("scenes/basic-event.xhtml", this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

function trippleMouseEventCheck(eventType){
    var counter = 0;
    function counterIncrease(){
        if(++counter == 3)
            start();
    }
    var mesh01 = this.doc.getElementById("myMesh01"),
        mesh02 = this.doc.getElementById("myMesh02"),
        mesh03 = this.doc.getElementById("myMesh03");

    mesh01.addEventListener(eventType, function(evt){
        ok(true, "#myMesh02 mesh " + eventType + " event received");
        equal(evt.target, mesh01, "Event target is #myMesh01");
        counterIncrease();
    });
    mesh02.addEventListener(eventType, function(evt){
        ok(true, "#myMesh02 mesh " + eventType + " event received");
        equal(evt.target, mesh02, "Event target is #myMesh02");
        counterIncrease();
    });
    mesh03.addEventListener(eventType, function(evt){
        ok(true, "#myMesh03 mesh " + eventType + " event received");
        equal(evt.target, mesh03, "Event target is #myMesh03");
        counterIncrease();
    });
    stop();
    simulatedMouseEvent(this.xml3dEl, eventType, 76, 101);
    simulatedMouseEvent(this.xml3dEl, eventType, 157, 104);
    simulatedMouseEvent(this.xml3dEl, eventType, 227, 99);
}


test("Click Event", function() {
    trippleMouseEventCheck.call(this, 'click');
});
test("Dblclick Event", function() {
    trippleMouseEventCheck.call(this, 'dblclick');
});
test("Mousemove Event", function() {
    trippleMouseEventCheck.call(this, 'mousemove');
});
test("Mousedown Event", function() {
    trippleMouseEventCheck.call(this, 'mousedown');
});
test("Mouseup Event", function() {
    trippleMouseEventCheck.call(this, 'mouseup');
});

}());