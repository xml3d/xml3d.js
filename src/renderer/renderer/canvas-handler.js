var MouseEvents = require("./events/mouse.js");
var TouchEvents = require("./events/touch.js");

var c_globalCanvasId = 0;

/**
 * @param {Element} xml3dElement
 * @constructor
 */
function AbstractCanvasHandler(xml3dElement, canvas) {
    this._xml3dElement = xml3dElement;
    this._canvas = canvas;
    this.id = ++c_globalCanvasId; // global canvas id starts at 1

    this._mouseHandler = new MouseEvents.MouseEventHandler(xml3dElement, this);
    this._registerCanvasListeners(this._mouseHandler, MouseEvents.EVENTS);
    if(this.hasTouchEvents()) {
        this._touchHandler = new TouchEvents.TouchEventHandler(xml3dElement, this);
        this._registerCanvasListeners(this._touchHandler, TouchEvents.EVENTS);
    }
}

/**
 * @returns {boolean}
 */
AbstractCanvasHandler.prototype.hasTouchEvents = function() {
    return 'ontouchstart' in window;
};

AbstractCanvasHandler.prototype.getCanvas = function() {
   return this._canvas;
};

AbstractCanvasHandler.prototype.dispatchEvent = function(event) {
    this._xml3dElement.dispatchEvent(event);
};

AbstractCanvasHandler.prototype._registerCanvasListeners = function (handler, events) {
    var canvas = this._canvas;
    events.forEach(function (name) {
        canvas.addEventListener(name, function (e) {
            handler[name] && handler[name].call(handler, e);
            e.stopPropagation();
        });
    });
};

AbstractCanvasHandler.prototype.dispatchCustomEvent = function(type, detail) {
    detail = detail || null;
    var event = document.createEvent('CustomEvent');
    event.initCustomEvent(type, true, true, detail);
    this._xml3dElement.dispatchEvent(event);
};

AbstractCanvasHandler.prototype.dispatchResizeEvent = function (dimensions) {
    this.dispatchCustomEvent("resize", dimensions);
};

/**
 * Dispatches a FrameDrawnEvent to listeners
 *
 * @param start
 * @param end
 * @param stats
 * @return
 */
AbstractCanvasHandler.prototype.dispatchFrameDrawnEvent = function (start, end, stats) {
    stats = stats || {
        count: {
            primitives: 0, objects: 0
        }
    };
    var data = {
        timeStart: start, timeEnd: end, renderTimeInMilliseconds: end - start, count: stats.count
    };
    this.dispatchCustomEvent("framedrawn", data);
};

module.exports = AbstractCanvasHandler;
