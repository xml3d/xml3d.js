var AbstractCanvasHandler = require("../renderer/canvas-handler.js");
var Options = require("../../utils/options.js");
var xml3dFormatHandler = require("../../base/formathandler.js").xml3dFormatHandler;

var MAXFPS = 30;

var OPTION_CONTINUOUS = "renderer-continuous";
Options.register(OPTION_CONTINUOUS, false);

/**
 * GLCanvasHandler class.
 * Registers and handles the events that happen on the canvas element.
 *
 * @param xml3dElem
 *            the root xml3d node, containing the XML3D scene structure
 * @constructor
 * @extends AbstractCanvasHandler
 */
function GLCanvasHandler(xml3dElem, canvas) {
    AbstractCanvasHandler.call(this, xml3dElem, canvas);
    this.renderInterface = {};

    this.lastPickObj = null;

    this.lastKnownDimensions = {width: canvas.width, height: canvas.height};
    this.initialize();
}

XML3D.createClass(GLCanvasHandler, AbstractCanvasHandler);

GLCanvasHandler.prototype.setRenderer = function (renderer) {
    this.renderer = renderer;
};

GLCanvasHandler.prototype.initialize = function () {
     this.configureCanvas();

    // This function is called at regular intervals by requestAnimFrame to
    // determine if a redraw
    // is needed
    var that = this;
    this.tick = function () {

        if(!that.renderer)
            return;

        XML3D.updateXflowObserver();
        XML3D.flushDOMChanges();

        if (that.canvasSizeChanged() || that.renderer.needsRedraw() || Options.getValue(OPTION_CONTINUOUS)) {
            that.dispatchUpdateEvent();
            that.draw();
        }

        window.requestAnimFrame(that.tick, MAXFPS);
    };

      // Block the right-click context menu on the canvas unless it's explicitly toggled
    var cm = this._xml3dElement.getAttribute("contextmenu");
    if (!cm || cm == "false") {
        this._canvas.addEventListener("contextmenu", function (e) {
            e.preventDefault && e.preventDefault();
            e.stopPropagation && e.stopPropagation();
        }, false);
    }
};

GLCanvasHandler.prototype.configureCanvas = function () {
    var xml3dElement = this._xml3dElement;
    var canvas = this._canvas;

    var parent = xml3dElement.parentNode;
    // Place xml3dElement inside an invisble div
    var hideDiv = parent.ownerDocument.createElement('div');
    hideDiv.style.display = "none";
    parent.insertBefore(hideDiv, xml3dElement);
    hideDiv.appendChild(xml3dElement);

    // Create canvas and append it where the xml3d element was before
    parent.insertBefore(canvas, hideDiv);

    var style = canvas.ownerDocument.defaultView.getComputedStyle(xml3dElement);
    if (!canvas.style.backgroundColor) {
        var bgcolor = style.getPropertyValue("background-color");
        if (bgcolor && bgcolor != "transparent")
            canvas.style.backgroundColor = bgcolor;
    }
    // Need to be set for correct canvas size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    return canvas;
};

/**
 * Binds the picking buffer and passes the request for a picking pass to the
 * renderer
 *
 * @param {number} canvasX
 * @param {number} canvasY
 * @return {Drawable|null} newly picked object
 */
GLCanvasHandler.prototype.getPickObjectByPoint = function (canvasX, canvasY) {
    // TODO
    //if (!this.renderOptions.pickingEnabled)
    //    return null;
    return this.renderer.getRenderObjectFromPickingBuffer(canvasX, canvasY);
};

/**
 *
 * @returns {HTMLElement}
 */
GLCanvasHandler.prototype.getPickedObject = function() {
    return this.renderer.pickedObject ? this.renderer.pickedObject.node : null;
};

/**
 * @param {number} canvasX
 * @param {number} canvasY
 * @return {vec3|null} The world space normal on the object's surface at the given coordinates
 */
GLCanvasHandler.prototype.getWorldSpaceNormalByPoint = function (canvasX, canvasY) {
    return this.renderer.getWorldSpaceNormalByPoint(canvasX, canvasY);
};

/**
 * @param {number} canvasX
 * @param {number} canvasY
 * @return {vec3|null} The world space position on the object's surface at the given coordinates
 */
GLCanvasHandler.prototype.getWorldSpacePositionByPoint = function (canvasX, canvasY) {
    return this.renderer.getWorldSpacePositionByPoint(canvasX, canvasY);
};

GLCanvasHandler.prototype.canvasSizeChanged = function () {
    var canvas = this._canvas;
    if (canvas.clientWidth !== this.lastKnownDimensions.width || canvas.clientHeight !== this.lastKnownDimensions.height) {

        this.lastKnownDimensions.width = canvas.width = canvas.clientWidth;
        this.lastKnownDimensions.height = canvas.height = canvas.clientHeight;
        this.renderer.handleResizeEvent(canvas.width, canvas.height);
        this.dispatchResizeEvent({width: canvas.width, height: canvas.height});
        return true;
    }
    return false;
};

var c_timer = window.performance || Date;

/**
 * Called by tick() to redraw the scene if needed
 */
GLCanvasHandler.prototype.draw = function () {
    XML3D.flushDOMChanges();
    try {
        var start = c_timer.now();
        var stats = this.renderer.renderToCanvas();
        var end = c_timer.now();


        var factory = xml3dFormatHandler.getFactory("webgl", this.id);
        var xml3dAdapter = factory.getAdapter(this._xml3dElement);
        xml3dAdapter.onFrameDrawn();
        this.dispatchFrameDrawnEvent(start, end, stats);

    } catch (e) {
        XML3D.debug.logException(e);
    }

};

GLCanvasHandler.prototype.getMousePosition = function (evt) {
    var rct = this._canvas.getBoundingClientRect();
    return {
        x: (evt.clientX - rct.left), y: (evt.clientY - rct.top)
    };
};

module.exports =  GLCanvasHandler;

