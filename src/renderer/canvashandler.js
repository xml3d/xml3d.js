// Create global symbol XML3D.webgl
XML3D.webgl.MAXFPS = 30;

(function() {

    var CONTEXT_OPTIONS = {
        alpha: true,
        premultipliedAlpha: false,
        antialias: true,
        stencil: true,
        preserveDrawingBuffer: true
    };

    /**
     *
     * @param {Element|Array.<Element>} xml3ds
     */
    XML3D.webgl.configure = function(xml3ds) {

        if(!(xml3ds instanceof Array))
            xml3ds = [xml3ds];

        var handlers = {};
        for(var i in xml3ds) {
            // Creates a HTML <canvas> using the style of the <xml3d> Element
            var canvas = XML3D.webgl.createCanvas(xml3ds[i], i);
            // Creates the CanvasHandler for the <canvas>  Element
            var canvasHandler = new XML3D.webgl.CanvasHandler(canvas, xml3ds[i]);
            handlers[i] = canvasHandler;
            window.requestAnimFrame(canvasHandler.tick, XML3D.webgl.MAXFPS);
        }
    };

    var globalCanvasId = 0;

    XML3D.webgl.handlers = [];

    // Events
    XML3D.webgl.events =  {
        available : []
    };

    /**
     * CanvasHandler class.
     * Registers and handles the events that happen on the canvas element.
     * This includes context lost events.
     *
     * @param {HTMLCanvasElement} canvas
     *            the HTML Canvas element that this handler will be responsible
     *            for
     * @param xml3dElem
     *            the root xml3d node, containing the XML3D scene structure
     */
    function CanvasHandler(canvas, xml3dElem) {
        this.canvas = canvas;
        this.xml3dElem = xml3dElem;
        this.renderInterface = {};

        this.id = ++globalCanvasId; // global canvas id starts at 1
        XML3D.webgl.handlers[this.id] = this;

        this._pickingDisabled = false;
        this.lastPickObj = null;
        this.timeNow = Date.now() / 1000.0;

        this.lastKnownDimensions = {width : canvas.width, height : canvas.height};

        var context = this.getContextForCanvas(canvas);
        if (context) {
            this.initialize(context);
        }

    }

    /**
     *
     * @param {HTMLCanvasElement!} canvas
     */
    CanvasHandler.prototype.getContextForCanvas = function(canvas) {
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
    CanvasHandler.prototype.initialize = function(renderingContext) {
        // Register listeners on canvas
        this.registerCanvasListeners();

        // This function is called at regular intervals by requestAnimFrame to
        // determine if a redraw
        // is needed
        var that = this;
        this.tick = function() {

            XML3D.updateXflowObserver();

            if (that.canvasSizeChanged() || that.renderer.needsRedraw()) {
                that.dispatchUpdateEvent();
                that.draw();
            }

            window.requestAnimFrame(that.tick, XML3D.webgl.MAXFPS);
        };

        var context = new XML3D.webgl.GLContext(renderingContext, this.id, this.canvas.clientWidth, this.canvas.clientHeight);
        var scene = new XML3D.webgl.GLScene(context);
        var factory = XML3D.base.xml3dFormatHandler.getFactory(XML3D.webgl, this.id);
        factory.setScene(scene);
        // Create renderer
        /** @type XML3D.webgl.IRenderer */
        this.renderer = XML3D.webgl.rendererFactory.createRenderer(context, scene, this.canvas);
        this.renderOptions = this.renderer.renderInterface.options;
        factory.setRenderer(this.renderer);

        var xml3dAdapter = factory.getAdapter(this.xml3dElem);
        xml3dAdapter.traverse(function(){});

        scene.rootNode.setVisible(true);
    };

    /*
    CanvasHandler.prototype.redraw = function(reason, forcePickingRedraw) {
        //XML3D.debug.logDebug("Request redraw:", reason);
        forcePickingRedraw = (forcePickingRedraw === undefined) ? true : forcePickingRedraw;
        if (this.needDraw !== undefined) {
            this.needDraw = true;
            this.needPickingDraw = this.needPickingDraw || forcePickingRedraw;
        } else {
            // This is a callback from a texture, don't need to redraw the
            // picking buffers
            handler.needDraw = true;
        }
    };   */

    /**
     * Binds the picking buffer and passes the request for a picking pass to the
     * renderer
     *
     * @param {number} canvasX
     * @param {number} canvasY
     * @return {Drawable|null} newly picked object
     */
    CanvasHandler.prototype.getPickObjectByPoint = function(canvasX, canvasY) {
        if (!this.renderOptions.pickingEnabled)
            return null;
        return this.renderer.getRenderObjectFromPickingBuffer(canvasX, canvasY);
    };

    /**
     * @param {number} canvasX
     * @param {number} canvasY
     * @return {vec3|null} The world space normal on the object's surface at the given coordinates
     */
    CanvasHandler.prototype.getWorldSpaceNormalByPoint = function(canvasX, canvasY) {
        return this.renderer.getWorldSpaceNormalByPoint(canvasX, canvasY);
    };

    /**
     * @param {number} canvasX
     * @param {number} canvasY
     * @return {vec3|null} The world space position on the object's surface at the given coordinates
     */
    CanvasHandler.prototype.getWorldSpacePositionByPoint = function(canvasX, canvasY) {
	    return this.renderer.getWorldSpacePositionByPoint(canvasX, canvasY);
    };

    CanvasHandler.prototype.canvasSizeChanged = function() {
        var canvas = this.canvas;
        if (canvas.clientWidth !== this.lastKnownDimensions.width ||
            canvas.clientHeight !== this.lastKnownDimensions.height) {

            this.lastKnownDimensions.width = canvas.width = canvas.clientWidth;
            this.lastKnownDimensions.height = canvas.height = canvas.clientHeight;
            this.renderer.handleResizeEvent(canvas.width, canvas.height);
            return true;
        }
        return false;
    };

    /**
     * The update event can be used by user to sync actions
     * with rendering
     */
    CanvasHandler.prototype.dispatchUpdateEvent = function() {
        var event = document.createEvent('CustomEvent');
        event.initCustomEvent('update', true, true, null);
        this.xml3dElem.dispatchEvent(event);
    };

    /**
     * Called by tick() to redraw the scene if needed
     */
    CanvasHandler.prototype.draw = function() {
        try {
            var start = Date.now();

            var stats = this.renderer.renderToCanvas();
            var end = Date.now();
            this.dispatchFrameDrawnEvent(start, end, stats);

        } catch (e) {
            XML3D.debug.logException(e);
        }

    };


    CanvasHandler.prototype.registerCanvasListeners = function() {
        var handler = this;

        XML3D.webgl.events.available.forEach( function(name) {
            handler.canvas.addEventListener(name, function(e) {
                handler[name] && handler[name].call(handler, e);
                e.stopPropagation();
            });
        });

        // Block the right-click context menu on the canvas unless it's explicitly toggled
        var cm = this.xml3dElem.getAttribute("contextmenu");
        if (!cm || cm == "false") {
            this.canvas.addEventListener("contextmenu", function(e) {XML3D.webgl.stopEvent(e);}, false);
        }
    };


    /**
     * Dispatches a FrameDrawnEvent to listeners
     *
     * @param start
     * @param end
     * @param stats
     * @return
     */
    CanvasHandler.prototype.dispatchFrameDrawnEvent = function(start, end, stats) {
        stats = stats || {
            count: {
                primitives: 0,
                objects: 0
            }
        };

        var event = document.createEvent('CustomEvent');

        var data = {
                timeStart : start,
                timeEnd : end,
                renderTimeInMilliseconds : end - start,
                count : stats.count
        };
        event.initCustomEvent('framedrawn', true, true, data);

        this.xml3dElem.dispatchEvent(event);
    };

    // Destroys the renderer associated with this Handler
    CanvasHandler.prototype.shutdown = function(scene) {
        if (this.renderer) {
            this.renderer.dispose();
        }
    };

    XML3D.webgl.CanvasHandler = CanvasHandler;
})();

XML3D.webgl.createCanvas = function(xml3dElement, index) {

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
};


XML3D.webgl.stopEvent = function(ev) {
    if (ev.preventDefault)
        ev.preventDefault();
    if (ev.stopPropagation)
        ev.stopPropagation();
    ev.returnValue = false;
};
