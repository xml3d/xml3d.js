// Create global symbol XML3D.webgl
XML3D.webgl.MAXFPS = 30;

(function() {

    var canvas = document.createElement("canvas");
    XML3D.webgl.supported = function() {
        try {
            return !!(window.WebGLRenderingContext && (canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
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
            canvasHandler.tick();
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
        this.id = ++globalCanvasId; // global canvas id starts at 1
        XML3D.webgl.handlers[this.id] = this;

        this.needDraw = true;
        this.needPickingDraw = true;
        this._pickingDisabled = false;
        /** @type {Drawable} */
        this.currentPickObj = null;
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
            var args = {preserveDrawingBuffer: true};
            return canvas.getContext('experimental-webgl', args);
        } catch (e) {
            return null;
        }
    }

    /**
     *
     * @param {WebGLRenderingContext!} context
     */
    CanvasHandler.prototype.initialize = function(context) {
        // Register listeners on canvas
        this.registerCanvasListeners();

        // This function is called at regular intervals by requestAnimFrame to
        // determine if a redraw
        // is needed
        var handler = this;
        this.tick = function() {

            XML3D.updateXflowObserver();

            if (handler.canvasSizeChanged() || handler.needDraw) {
                handler.dispatchUpdateEvent();
                handler.draw();
            }

            window.requestAnimFrame(handler.tick, XML3D.webgl.MAXFPS);
        };

        this.redraw = function(reason, forcePickingRedraw) {
            //XML3D.debug.logDebug("Request redraw:", reason);
            forcePickingRedraw = forcePickingRedraw === undefined ? true : forcePickingRedraw;
            if (this.needDraw !== undefined) {
                this.needDraw = true;
                this.needPickingDraw = this.needPickingDraw || forcePickingRedraw;
            } else {
                // This is a callback from a texture, don't need to redraw the
                // picking buffers
                handler.needDraw = true;
            }
        };

        // Create renderer
        this.renderer = new XML3D.webgl.Renderer(this, context, { width: this.canvas.clientWidth, height: this.canvas.clientHeight });
    }


    /**
     * Convert the given y-coordinate on the canvas to a y-coordinate appropriate in
     * the GL context. The y-coordinate gets turned upside-down. The lowest possible
     * canvas coordinate is 0, so we need to subtract 1 from the height, too.
     *
     * @param {number} canvasY
     * @return {number} the converted y-coordinate
     */
    CanvasHandler.prototype.canvasToGlY = function(canvasY) {

        return this.canvas.height - canvasY - 1;
    };

    /**
     * Binds the picking buffer and passes the request for a picking pass to the
     * renderer
     *
     * @param {number} canvasX
     * @param {number} canvasY
     * @return {Drawable|null} newly picked object
     */
    CanvasHandler.prototype.updatePickObjectByPoint = function(canvasX, canvasY) {
        if (this._pickingDisabled)
            return null;
        if(this.needPickingDraw) {
            this.renderer.prepareRendering();
            this.renderer.renderSceneToPickingBuffer();
        }

        /** Temporary workaround: this function is called when drawable objects are not yet
         *  updated. Thus, the renderer.render() updates the objects after the picking buffer
         *  has been updated. In that case, the picking buffer needs to be updated again.
         *  Thus, we only set needPickingDraw to false when we are sure that objects don't
         *  need any updates, i.e. when needDraw is false.
         *  A better solution would be to separate drawable objects updating from rendering
         *  and to update the objects either during render() or renderSceneToPickingBuffer().
         */
        if(!this.needDraw)
            this.needPickingDraw = false;

        var glY = this.canvasToGlY(canvasY);

        this.currentPickObj = this.renderer.getRenderObjectFromPickingBuffer(canvasX, glY);


        return this.currentPickObj;
    };

    /**
     * @param {Object} pickedObj
     * @param {number} canvasX
     * @param {number} canvasY
     * @return {vec3|null} The world space normal on the object's surface at the given coordinates
     */
    CanvasHandler.prototype.getWorldSpaceNormalByPoint = function(pickedObj, canvasX, canvasY) {
        if (!pickedObj || this._pickingDisabled)
            return null;

        var glY = this.canvasToGlY(canvasY);

        this.renderer.renderPickedNormals(pickedObj);
        return this.renderer.readNormalFromPickingBuffer(canvasX, glY);
    };

    /**
     * @param {Object} pickedObj
     * @param {number} canvasX
     * @param {number} canvasY
     * @return {vec3|null} The world space position on the object's surface at the given coordinates
     */
    CanvasHandler.prototype.getWorldSpacePositionByPoint = function(pickedObj, canvasX, canvasY) {
    	if (!pickedObj)
    		return null;

        var glY = this.canvasToGlY(canvasY);

        this.renderer.renderPickedPosition(pickedObj);
        return this.renderer.readPositionFromPickingBuffer(canvasX, glY);
    };

    CanvasHandler.prototype.getCanvasHeight = function() {

    	return this.canvas.height;
    };

    CanvasHandler.prototype.getCanvasWidth = function() {

    	return this.canvas.width;
    };

    CanvasHandler.prototype.canvasSizeChanged = function() {
        var canvas = this.canvas;
        if (canvas.clientWidth !== this.lastKnownDimensions.width ||
            canvas.clientHeight !== this.lastKnownDimensions.height) {

            this.lastKnownDimensions.width = canvas.width = canvas.clientWidth;
            this.lastKnownDimensions.height = canvas.height = canvas.clientHeight;
            this.renderer.resizeCanvas(canvas.width, canvas.height);

            this.needDraw = this.needPickingDraw = true;
            return true;
        }
        return false;
    };

    /**
     * Uses gluUnProject() to transform the 2D screen point to a 3D ray.
     * Not tested!!
     *
     * @param {number} canvasX
     * @param {number} canvasY
     */
    CanvasHandler.prototype.generateRay = function(canvasX, canvasY) {

        var glY = this.canvasToGlY(canvasY);

        // setup input to unproject
        var viewport = new Array();
        viewport[0] = 0;
        viewport[1] = 0;
        viewport[2] = this.renderer.width;
        viewport[3] = this.renderer.height;

        // get view and projection matrix arrays
        var viewMat = this.renderer.camera.viewMatrix;
        var projMat = this.renderer.camera.getProjectionMatrix(viewport[2] / viewport[3]);

        var ray = new window.XML3DRay();

        var nearHit = new Array();
        var farHit = new Array();

        // do unprojections
        if (false === GLU.unProject(canvasX, glY, 0, viewMat, projMat, viewport, nearHit)) {
            return ray;
        }

        if (false === GLU.unProject(canvasX, glY, 1, viewMat, projMat, viewport, farHit)) {
            return ray;
        }

        // calculate ray
        var worldToViewMat = this.renderer.currentView.getViewMatrix().inverse();
        var viewPos = new window.XML3DVec3(worldToViewMat.m41, worldToViewMat.m42, worldToViewMat.m43);

        ray.origin.set(viewPos);
        ray.direction.set(farHit[0] - nearHit[0], farHit[1] - nearHit[1], farHit[2] - nearHit[2]);
        ray.direction.set(ray.direction.normalize());

        return ray;
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
            this.renderer.prepareRendering();
            var stats = this.renderer.renderToCanvas();
            var end = Date.now();

            this.needDraw = false;
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
        var event = document.createEvent('CustomEvent');
        var data = {
                timeStart : start,
                timeEnd : end,
                renderTimeInMilliseconds : end - start,
                numberOfObjectsDrawn : stats[0],
                numberOfTrianglesDrawn : Math.floor(stats[1])
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
