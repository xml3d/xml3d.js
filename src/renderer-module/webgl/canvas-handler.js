var AbstractCanvasHandler = require("../renderer/canvas-handler.js");
var GLContext = require("./base/context");
var GLScene = require("./scene/glscene");

var MAXFPS = 30;

var OPTION_CONTINUOUS = "renderer-continuous";
XML3D.options.register(OPTION_CONTINUOUS, false);

var CONTEXT_OPTIONS = {
    alpha: true, premultipliedAlpha: false, antialias: true, stencil: true, preserveDrawingBuffer: true
};

/**
 *
 * @param {Element|Array.<Element>} xml3ds
 */
var configure = function (xml3ds) {

    if (!(xml3ds instanceof Array))
        xml3ds = [xml3ds];

    var handlers = {};
    for (var i in xml3ds) {
        // Creates a HTML <canvas> using the style of the <xml3d> Element
        var canvas = createCanvas(xml3ds[i], i);
        // Creates the WebGLCanvasHandler for the <canvas>  Element
        var canvasHandler = new WebGLCanvasHandler(canvas, xml3ds[i]);
        handlers[i] = canvasHandler;
        window.requestAnimFrame(canvasHandler.tick, MAXFPS);
    }
};



/**
 * WebGLCanvasHandler class.
 * Registers and handles the events that happen on the canvas element.
 *
 * @param {HTMLCanvasElement} canvas
 *            the HTML Canvas element that this handler will be responsible
 *            for
 * @param xml3dElem
 *            the root xml3d node, containing the XML3D scene structure
 */
function WebGLCanvasHandler(canvas, xml3dElem) {
    AbstractCanvasHandler.call(this, xml3dElem, canvas);
    this.renderInterface = {};

    this.lastPickObj = null;

    this.lastKnownDimensions = {width: canvas.width, height: canvas.height};


    var context = this.getContextForCanvas(canvas);
    if (context) {
        this.initialize(context);
    }

}

XML3D.createClass(WebGLCanvasHandler, AbstractCanvasHandler);

/**
 *
 * @param {HTMLCanvasElement!} canvas
 */
WebGLCanvasHandler.prototype.getContextForCanvas = function (canvas) {
    try {
        return canvas.getContext('experimental-webgl', CONTEXT_OPTIONS);
    } catch (e) {
        return null;
    }
};

/**
 *
 * @param {WebGLRenderingContext!} renderingContext
 */
WebGLCanvasHandler.prototype.initialize = function (renderingContext) {
    // Register listeners on canvas

    // This function is called at regular intervals by requestAnimFrame to
    // determine if a redraw
    // is needed
    var that = this;
    this.tick = function () {

        XML3D.updateXflowObserver();
        XML3D._flushDOMChanges();

        if (that.canvasSizeChanged() || that.renderer.needsRedraw() || XML3D.options.getValue(OPTION_CONTINUOUS)) {
            that.dispatchUpdateEvent();
            that.draw();
        }

        window.requestAnimFrame(that.tick, MAXFPS);
    };

    var context = new GLContext(renderingContext, this.id, this._canvas.clientWidth, this._canvas.clientHeight);
    var scene = new GLScene(context);
    var factory = XML3D.base.xml3dFormatHandler.getFactory(XML3D.webgl, this.id);
    factory.setScene(scene);
    // Create renderer
    /** @type XML3D.webgl.IRenderer */
    this.renderer = XML3D.renderer.factory.createRenderer(context, scene, this._canvas);
    this.renderOptions = this.renderer.renderInterface.options;
    factory.setRenderer(this.renderer);

    var xml3dAdapter = factory.getAdapter(this._xml3dElement);
    xml3dAdapter.traverse(function () {
    });

    scene.rootNode.setVisible(true);

      // Block the right-click context menu on the canvas unless it's explicitly toggled
    var cm = this._xml3dElement.getAttribute("contextmenu");
    if (!cm || cm == "false") {
        this._canvas.addEventListener("contextmenu", function (e) {
            e.preventDefault && e.preventDefault();
            e.stopPropagation && e.stopPropagation();
        }, false);
    }
};


/**
 * Binds the picking buffer and passes the request for a picking pass to the
 * renderer
 *
 * @param {number} canvasX
 * @param {number} canvasY
 * @return {Drawable|null} newly picked object
 */
WebGLCanvasHandler.prototype.getPickObjectByPoint = function (canvasX, canvasY) {
    if (!this.renderOptions.pickingEnabled)
        return null;
    return this.renderer.getRenderObjectFromPickingBuffer(canvasX, canvasY);
};

/**
 *
 * @returns {HTMLElement}
 */
WebGLCanvasHandler.prototype.getPickedObject = function() {
    return this.renderer.pickedObject ? this.renderer.pickedObject.node : null;
};

/**
 * @param {number} canvasX
 * @param {number} canvasY
 * @return {vec3|null} The world space normal on the object's surface at the given coordinates
 */
WebGLCanvasHandler.prototype.getWorldSpaceNormalByPoint = function (canvasX, canvasY) {
    return this.renderer.getWorldSpaceNormalByPoint(canvasX, canvasY);
};

/**
 * @param {number} canvasX
 * @param {number} canvasY
 * @return {vec3|null} The world space position on the object's surface at the given coordinates
 */
WebGLCanvasHandler.prototype.getWorldSpacePositionByPoint = function (canvasX, canvasY) {
    return this.renderer.getWorldSpacePositionByPoint(canvasX, canvasY);
};

WebGLCanvasHandler.prototype.canvasSizeChanged = function () {
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
WebGLCanvasHandler.prototype.draw = function () {
    XML3D._flushDOMChanges();
    try {
        var start = c_timer.now();
        var stats = this.renderer.renderToCanvas();
        var end = c_timer.now();


        var factory = XML3D.base.xml3dFormatHandler.getFactory(XML3D.webgl, this.id);
        var xml3dAdapter = factory.getAdapter(this._xml3dElement);
        xml3dAdapter.onFrameDrawn();
        this.dispatchFrameDrawnEvent(start, end, stats);

    } catch (e) {
        XML3D.debug.logException(e);
    }

};



// Destroys the renderer associated with this Handler
WebGLCanvasHandler.prototype.shutdown = function (scene) {
    if (this.renderer) {
        this.renderer.dispose();
    }
};

WebGLCanvasHandler.prototype.getMousePosition = function (evt) {
    var rct = this._canvas.getBoundingClientRect();
    return {
        x: (evt.clientX - rct.left), y: (evt.clientY - rct.top)
    };
};



function createCanvas(xml3dElement, index) {

    var parent = xml3dElement.parentNode;
    // Place xml3dElement inside an invisble div
    var hideDiv = parent.ownerDocument.createElement('div');
    hideDiv.style.display = "none";
    parent.insertBefore(hideDiv, xml3dElement);
    hideDiv.appendChild(xml3dElement);

    // Create canvas and append it where the xml3d element was before
    var canvas = xml3dElement._configured.canvas;
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
}


module.exports = {
    WebGLCanvasHandler: WebGLCanvasHandler, configure: configure
};

