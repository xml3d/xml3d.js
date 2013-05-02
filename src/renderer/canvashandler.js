// Create global symbol XML3D.webgl
XML3D.webgl.MAXFPS = 30;

/**
 * Creates the CanvasHandler.
 *
 * The Handler is the interface between the renderer, canvas and SpiderGL
 * elements. It responds to user interaction with the scene and manages
 * redrawing of the canvas.
 * The canvas handler also manages the rendering loop including triggering
 * of redraws.
 */
(function() {

    var canvas = document.createElement("canvas");
    XML3D.webgl.supported = function() {
        try {
            return !!(window.WebGLRenderingContext && (canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    };


    XML3D.webgl.configure = function(xml3ds) {
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

    var hasTouchEvents = 'ontouchstart' in window;
    var events = {
        mouse : [ "click", "dblclick", "mousedown", "mouseup", "mouseover", "mousemove", "mouseout", "mousewheel" ],
        drag  : [  ],
        touch : [ "touchstart", "touchmove", "touchend", "touchcancel"]
    };

    events.available = events.mouse.concat(events.drag, hasTouchEvents ? events.touch : [] );

    XML3D.webgl.events = events;

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
            var stats = this.renderer.render();
            var end = Date.now();

            this.needDraw = false;
            this.dispatchFrameDrawnEvent(start, end, stats);

        } catch (e) {
            XML3D.debug.logException(e);
        }

    };

    /**
     * @param {MouseEvent} event  The original event
     * @param {object}     opt    Options
     */
    CanvasHandler.prototype.dispatchMouseEvent = function(event, target, opt) {
        opt = opt || {};
        target = target || this.xml3dElem;
        var x = opt.x !== undefined ? opt.x : event.clientX;
        var y = opt.y !== undefined ? opt.y : event.clientY;
        var noCopy = opt.noCopy || false;

        // Copy event to avoid DOM dispatch errors (cannot dispatch event more
        // than once)
        event = noCopy ? event : this.copyMouseEvent(event);
        this.initExtendedMouseEvent(event, x, y);

        // find event target
        /*var tar = this.xml3dElem; // Default is to dispace on xml3d element
        if (target !== undefined && target !== null)
            tar = target;
        else if (this.currentPickObj)
            tar = this.currentPickObj.meshAdapter.node;*/

        target.dispatchEvent(event);
    };

    /**
     * Creates an DOM mouse event based on the given event and returns it
     *
     * @param event
     *            the event to copy
     * @return the new event
     */
    CanvasHandler.prototype.copyMouseEvent = function(event) {
        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent(event.type,
        // canBubble, cancelable, view, detail
        event.bubbles, event.cancelable, event.view, event.detail,
        // screenX, screenY, clientX, clientY
        event.screenX, event.screenY, event.clientX, event.clientY,
        // ctrl, alt, shift, meta, button
        event.ctrlKey, event.altKey, event.shiftKey, event.metaKey, event.button,
        // relatedTarget
        event.relatedTarget);
        if (event.dataTransfer)
        	evt.data = {url: event.dataTransfer.getData("URL"), text: event.dataTransfer.getData("Text")};
        return evt;
    };

    CanvasHandler.prototype.createMouseEvent = function(type, opts) {
        opts = opts || {};
        var event = document.createEvent("MouseEvents");
        event.initMouseEvent(type,
            opts.canBubble !== undefined ? opts.canBubble : true,
            opts.cancelable !== undefined ? opts.cancelable : true,
            opts.view || window,
            opts.detail != undefined ? opts.detail : 0,
            opts.screenX != undefined ? opts.screenX : 0,
            opts.screenY != undefined ? opts.screenY : 0,
            opts.clientX != undefined ? opts.clientX : 0,
            opts.clientY != undefined ? opts.clientY : 0,
            opts.ctrl != undefined ? opts.ctrl : false,
            opts.alt != undefined ? opts.alt : false,
            opts.shift != undefined ? opts.shift : false,
            opts.meta != undefined ? opts.meta : false,
            opts.button != undefined ? opts.button : 0,
            opts.relatedTarget);
            return event;
    }

        /**
     * Adds position and normal attributes to the given event.
     *
     * @param {Event} event
     * @param {number} x
     * @param {number} y
     * @return {XML3DVec3}
     */
    CanvasHandler.prototype.initExtendedMouseEvent = function(event, x, y) {

        var handler = this;
        var xml3dElem = this.xml3dElem;

        (function(){
            var cachedPosition = undefined;
            var cachedNormal = undefined;

            event.__defineGetter__("normal", function(){
                if(cachedNormal !== undefined) return cachedNormal;
                var norm = (handler.getWorldSpaceNormalByPoint(handler.currentPickObj, x, y));
                cachedNormal = norm ? new window.XML3DVec3(norm[0], norm[1], norm[2]) : null;
                return cachedNormal;
            });
            event.__defineGetter__("position", function() {
                if (!cachedPosition) {
                    var pos = handler.getWorldSpacePositionByPoint(handler.currentPickObj, x, y);
                    cachedPosition = pos ? new window.XML3DVec3(pos[0], pos[1], pos[2]) : null;
                }
                return cachedPosition;
            });

        })();


    };

    CanvasHandler.prototype.registerCanvasListeners = function() {
        var handler = this;

        events.available.forEach( function(name) {
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
     * @param {MouseEvent} evt
     * @param {object} opt
     */
    CanvasHandler.prototype.dispatchEventOnPickedObject = function(evt, opt) {
        opt = opt || {};
        var pos = this.getMousePosition(evt);

        if(!opt.omitUpdate)
            this.updatePickObjectByPoint(pos.x, pos.y);

        var picked = this.currentPickObj;
        this.dispatchMouseEvent(evt, picked && picked.meshAdapter.node, pos);
    }

    /**
     * @param {MouseEvent} evt
     */
    CanvasHandler.prototype.drop = function(evt) {
        this.dispatchEventOnPickedObject(evt);
        evt.preventDefault();
    };

    /**
     *
     * @param evt
     */
    CanvasHandler.prototype.dragover = function(evt) {
    	evt.preventDefault();
    };

    /**
     * @param {MouseEvent} evt
     */
    CanvasHandler.prototype.mouseup = function(evt) {
        this.dispatchEventOnPickedObject(evt);
    };

    /**
     * @param {MouseEvent} evt
     */
    CanvasHandler.prototype.mousedown = function(evt) {
        this.dispatchEventOnPickedObject(evt);
    };

    /**
     * @param {MouseEvent} evt
     */
    CanvasHandler.prototype.click = function(evt) {
        // Click follows always 'mouseup' => no update of pick object needed
        this.dispatchEventOnPickedObject(evt, { omitUpdate: true });
    };

    /**
     * @param {MouseEvent} evt
     */
    CanvasHandler.prototype.dblclick = function(evt) {
        // Click follows always 'mouseup' => no update of pick object needed
        this.dispatchEventOnPickedObject(evt, { omitUpdate: true });
    };

    /**
     * This method is called each time a mouseMove event is triggered on the
     * canvas.
     *
     * This method also triggers mouseover and mouseout events of objects in the
     * scene.
     *
     * @param {MouseEvent} evt
     */
    CanvasHandler.prototype.mousemove = function (evt) {
        var pos = this.getMousePosition(evt);

        this.dispatchEventOnPickedObject(evt);

        var curObj = this.currentPickObj ? this.currentPickObj.meshAdapter.node : null;

        // trigger mouseover and mouseout
        if (curObj !== this.lastPickObj) {
            if (this.lastPickObj) {
                // The mouse has left the last object
                this.dispatchMouseEvent(this.createMouseEvent("mouseout", {
                    clientX:pos.x,
                    clientY:pos.y,
                    button:evt.button
                }), this.lastPickObj);
                if (!curObj) { // Nothing picked, this means we enter the xml3d canvas
                    this.dispatchMouseEvent(this.createMouseEvent("mouseover", {
                        clientX:pos.x,
                        clientY:pos.y,
                        button:evt.button
                    }), this.xml3dElem);
                }
            }
            if (curObj) {
                // The mouse is now over a different object, so call the new
                // object's mouseover method
                this.dispatchMouseEvent(this.createMouseEvent("mouseover", {
                    clientX:pos.x,
                    clientY:pos.y,
                    button:evt.button
                }), curObj);
                if (!this.lastPickObj) { // Nothing was picked before, this means we leave the xml3d canvas
                    this.dispatchMouseEvent(this.createMouseEvent("mouseout", {
                        clientX:pos.x,
                        clientY:pos.y,
                        button:evt.button
                    }), this.xml3dElem);
                }
            }

            this.lastPickObj = curObj;
        }
    };

    /**
     * @param {MouseEvent} evt
     */
    CanvasHandler.prototype.mouseout = function(evt) {
        var pos = this.getMousePosition(evt);
        this.dispatchMouseEvent(evt, this.lastPickObj, pos);
    };

    /**
     * @param {MouseEvent} evt
     */
    CanvasHandler.prototype.mouseover = function(evt) {
        var pos = this.getMousePosition(evt);
        this.dispatchEventOnPickedObject(evt);
    };

    /**
     * @param {MouseEvent} evt
     */
    CanvasHandler.prototype.mousewheel = function(evt) {
        var pos = this.getMousePosition(evt);
        // note: mousewheel type is not W3C standard, used in WebKit!
        this.dispatchEventOnPickedObject(evt);
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

    CanvasHandler.prototype.getMousePosition = function(evt) {
        var rct = this.canvas.getBoundingClientRect();
        return {
            x : (evt.clientX - rct.left),
            y : (evt.clientY - rct.top)
        };
    };

    CanvasHandler.prototype.setMouseMovePicking = function(isEnabled) {
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
