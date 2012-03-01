// Create global symbol xml3d.webgl
xml3d.webgl = xml3d.webgl || {};
xml3d.webgl.MAXFPS = 30;

// Since this object is used quite often XML3D_InternalMutationEvent is supposed
// to be a shortcut to
// increase performance by avoiding all the nested objects
xml3d.webgl.InternalMutationEvent = function() {
    this.source = ""; // The 'current' source node type (shader | group | transform | mesh)
    this.type = ""; // The type of this event as -> shader|transform|mesh
    this.parameter = ""; // The parameter that was changed (eg. uniform variable, translation, meshtype etc)
    this.newValue = null; // The new value of the changed parameter/target
};

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

    /**
     * CanvasHandler class.
     * Own the GL context. Registers and handles the events that happen on the canvas element.
     * This includes context lost events.
     *
     * @param canvas
     *            the HTML Canvas element that this handler will be responsible
     *            for
     * @param xml3dElem
     *            the root xml3d node, containing the XML3D scene structure
     */
    function CanvasHandler(canvas, xml3dElem) {
        this.canvas = canvas;
        this.xml3dElem = xml3dElem;

        // TODO: Safe creation and what happens if this fails?
        this.gl = canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});

        this.needDraw = true;
        this.needPickingDraw = true;
        this._pickingDisabled = false;
        this._lastPickedObj = null;
        this.mouseMovePickingEnabled = false;
        this.isDragging = false;
        this.timeNow = Date.now() / 1000.0;
        this.postProcessShaders = [];

        // TODO: Do we need this?
        this.events = {
            "mousedown" : [],
            "mouseup" : [],
            "click" : [],
            "framedrawn" : [],
            "mousemove" : [],
            "mouseout" : [],
            "update" : [],
            "mousewheel" : []
        };
        // TODO: Do we need this?
        this.canvasInfo = {
            id : canvas.id,
            mouseButtonsDown : [ false, false ]
        };

        // Register listeners on canvas
        this.registerCanvasListeners();

        // This function is called at regular intervals by requestAnimFrame to
        // determine if a redraw
        // is needed
        var handler = this;
        this._tick = function() {
            if (handler.update())
                handler.draw();

            requestAnimFrame(handler._tick, xml3d.webgl.MAXFPS);
        };

        this.redraw = function(reason, forcePickingRedraw) {
            if (this.needDraw !== undefined) {
                this.needDraw = true;
                this.needPickingDraw = forcePickingRedraw !== undefined ? forcePickingRedraw : true;
            } else {
                // This is a callback from a texture, don't need to redraw the
                // picking buffers
                handler.needDraw = true;
            }
        };

        // Create renderer
        this.renderer = new xml3d.webgl.Renderer(this, canvas.clientWidth, canvas.clientHeight);
    }

    CanvasHandler.prototype.registerCanvasListeners = function() {
        var handler = this;
        var canvas = this.canvas;
        canvas.addEventListener("mousedown", function(e) {
            handler.mouseDown(e);
        }, false);
        canvas.addEventListener("mouseup", function(e) {
            handler.mouseUp(e);
        }, false);
        canvas.addEventListener("mousemove", function(e) {
            handler.mouseMove(e);
        }, false);
        canvas.addEventListener("click", function(e) {
            handler.click(e);
        }, false);
        canvas.addEventListener("mousewheel", function(e) {
            handler.mouseWheel(e);
        }, false);
        canvas.addEventListener("DOMMouseScroll", function(e) {
            handler.mouseWheel(e);
        }, false);
        canvas.addEventListener("mouseout", function(e) {
            handler.mouseOut(e);
        }, false);
    };

    // Initializes the SpiderGL canvas manager and renders the scene
    // TODO: Should move to renderer, but is triggered from here
    CanvasHandler.prototype.start = function() {
        var gl = this.gl;

        gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL);

        this._tick();
    };

    // TODO: Connect resize listener with this function
    CanvasHandler.prototype.resize = function(gl, width, height) {
        if (width < 1 || height < 1)
            return false;

        this.renderer.resize(width, height);

        return true;
    };

    // Binds the picking buffer and passes the request for a picking pass to the
    // renderer
    CanvasHandler.prototype.renderPick = function(screenX, screenY) {
        if (this._pickingDisabled)
            return;
        this.renderer.renderPickingPass(screenX, this.canvas.height - screenY, this.needPickingDraw);
        this.needPickingDraw = false;
    };

    // Binds the normal picking buffer and passes the request for picked object
    // normals to the renderer
    CanvasHandler.prototype.renderPickedNormals = function(pickedObj, screenX, screenY) {
        if (!pickedObj || this._pickingDisabled)
            return;
        this.renderer.renderPickedNormals(pickedObj, screenX, this.canvas.height - screenY);
    };

    // Uses gluUnProject() to transform the 2D screen point to a 3D ray
    // returns an XML3DRay
    // TODO: Move this to Renderer and/or XML3DAdapter
    CanvasHandler.prototype.generateRay = function(screenX, screenY) {

        // setup input to unproject
        var viewport = new Array();
        viewport[0] = 0;
        viewport[1] = 0;
        viewport[2] = this.renderer.width;
        viewport[3] = this.renderer.height;

        // get view and projection matrix arrays
        var viewMat = this.renderer.getViewMatrix().toGL();
        var projMat = this.renderer.getProjectionMatrix().toGL();

        var ray = new XML3DRay();

        var nearHit = new Array();
        var farHit = new Array();

        // do unprojections
        if (false === GLU.unProject(screenX, screenY, 0, viewMat, projMat, viewport, nearHit)) {
            return ray;
        }

        if (false === GLU.unProject(screenX, screenY, 1, viewMat, projMat, viewport, farHit)) {
            return ray;
        }

        // calculate ray

        ray.origin = this.renderer.currentView.position;
        ray.direction = new XML3DVec3(farHit[0] - nearHit[0], farHit[1] - nearHit[1], farHit[2] - nearHit[2]);
        ray.direction = ray.direction.normalize();

        return ray;
    };

    // This function is called by _tick() at regular intervals to determine if a
    // redraw of the
    // scene is required
    CanvasHandler.prototype.update = function() {
        for ( var i = 0; i < this.events.update.length; i++) {
            if (this.events.update[i].listener.call(this.events.update[i].node) == true)
                this.needDraw = true;
        }

        return this.needDraw;
    };

    /**
     * Called by _tick() to redraw the scene if needed
     *
     * @param gl
     * @return
     */
    CanvasHandler.prototype.draw = function() {
        try {

            var start = Date.now();
            var stats = this.renderer.render(this.gl);
            var end = Date.now();

            this.dispatchFrameDrawnEvent(start, end, stats);
            this.needDraw = false;

        } catch (e) {
            xml3d.debug.logException(e);
            throw e;
        }

    };

    /**
     * Initalizes an DOM MouseEvent, picks the scene and sends the event to the
     * hit object, if one was hit.
     *
     * It dispatches it on two ways: calling dispatchEvent() on the target
     * element and going through the tree up to the root xml3d element invoking
     * all on[type] attribute code.
     *
     * @param type
     *            the type string according to the W3 DOM MouseEvent
     * @param button
     *            which mouse button is pressed, if any
     * @param x
     *            the screen x-coordinate
     * @param y
     *            the screen y-coordinate
     * @param (optional)
     *            event the W3 DOM MouseEvent, if present (currently not when
     *            SpiderGL's blur event occurs)
     * @param (optional)
     *            target the element to which the event is to be dispatched. If
     *            this is not given, the currentPickObj will be taken or the
     *            xml3d element, if no hit occured.
     *
     */
    CanvasHandler.prototype.dispatchMouseEvent = function(type, button, x, y, event, target) {
        // init event
        if (event === null || event === undefined) {
            event = document.createEvent("MouseEvents");
            event.initMouseEvent(type,
            // canBubble, cancelable, view, detail
            true, true, window, 0,
            // screenX, screenY, clientX, clientY
            0, 0, x, y,
            // ctrl, alt, shift, meta, button
            false, false, false, false, button,
            // relatedTarget
            null);
        }

        // Copy event to avoid DOM dispatch errors (cannot dispatch event more
        // than once)
        var evt = this.copyMouseEvent(event);
        this.initExtendedMouseEvent(evt, x, y);

        // find event target
        var tar = null;
        if (target !== undefined && target !== null)
            tar = target;
        else if (this.xml3dElem.currentPickObj)
            tar = this.xml3dElem.currentPickObj;
        else
            tar = this.xml3dElem;

        tar.dispatchEvent(evt);

        // Dispatch a copy to the XML3D node (canvas)
        tar = this.xml3dElem;
        tar.dispatchEvent(evt);
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

        return evt;
    };

    /**
     * Adds position and normal attributes to the given event.
     *
     * @param event
     * @param x
     * @param y
     * @return
     */
    CanvasHandler.prototype.initExtendedMouseEvent = function(event, x, y) {

        var handler = this;
        var xml3dElem = this.xml3dElem;

        event.__defineGetter__("normal", function() {
            handler.renderPickedNormals(xml3dElem.currentPickObj, x, y);
            var v = scene.xml3d.currentPickNormal.v;
            return new XML3DVec3(v[0], v[1], v[2]);
        });
        event.__defineGetter__("position", function() {
            return scene.xml3d.currentPickPos;
        });
    };

    /**
     * This method is called each time a mouseUp event is triggered on the
     * canvas
     *
     * @param gl
     * @param button
     * @param x
     * @param y
     * @return
     */
    CanvasHandler.prototype.mouseUp = function(evt) {
        this.canvasInfo.mouseButtonsDown[evt.button] = false;
        var pos = this.getMousePosition(evt);

        if (this.isDragging) {
            this.needPickingDraw = true;
            this.isDragging = false;
        }

        this.renderPick(pos.x, pos.y);
        this.dispatchMouseEvent("mouseup", evt.button, pos.x, pos.y, evt);

        return false; // don't redraw
    };

    /**
     * This method is called each time a mouseDown event is triggered on the
     * canvas
     *
     * @param gl
     * @param button
     * @param x
     * @param y
     * @return
     */
    CanvasHandler.prototype.mouseDown = function(evt) {
        this.canvasInfo.mouseButtonsDown[evt.button] = true;
        var pos = this.getMousePosition(evt);
        this.renderPick(pos.x, pos.y);

        this.dispatchMouseEvent("mousedown", evt.button, pos.x, pos.y, evt);

        return false; // don't redraw
    };

    /**
     * This method is called each time a click event is triggered on the canvas
     *
     * @param gl
     * @param button
     * @param x
     * @param y
     * @return
     */
    CanvasHandler.prototype.click = function(evt) {
        var pos = this.getMousePosition(evt);
        if (this.isDragging) {
            this.needPickingDraw = true;
            return;
        }

        this.dispatchMouseEvent("click", evt.button, pos.x, pos.y, evt);

        return false; // don't redraw
    };

    /**
     * This method is called each time a mouseMove event is triggered on the
     * canvas.
     *
     * This method also triggers mouseover and mouseout events of objects in the
     * scene.
     *
     * @param gl
     * @param x
     * @param y
     * @return
     */
    CanvasHandler.prototype.mouseMove = function(evt) {
        var pos = this.getMousePosition(evt);

        if (this.canvasInfo.mouseButtonsDown[0]) {
            this.isDragging = true;
        }

        // Call any global mousemove methods
        this.dispatchMouseEvent("mousemove", 0, pos.x, pos.y, evt, this.xml3dElem);

        if (!this.mouseMovePickingEnabled)
            return;

        this.renderPick(pos.x, pos.y);
        var curObj = null;
        if (this.xml3dElem.currentPickObj)
            curObj = this.xml3dElem.currentPickObj;

        // trigger mouseover and mouseout
        if (curObj !== this._lastPickedObj) {
            if (this._lastPickedObj) {
                // The mouse has left the last object
                this.dispatchMouseEvent("mouseout", 0, pos.x, pos.y, null, this._lastPickedObj);
            }
            if (curObj) {
                // The mouse is now over a different object, so call the new
                // object's
                // mouseover method
                this.dispatchMouseEvent("mouseover", 0, pos.x, pos.y);
            }

            this._lastPickedObj = curObj;
        }

        return false; // don't redraw
    };

    /**
     * This method is called each time the mouse leaves the canvas
     *
     * @param gl
     * @return
     */
    CanvasHandler.prototype.mouseOut = function(evt) {
        var pos = this.getMousePosition(evt);
        this.dispatchMouseEvent("mouseout", 0, pos.x, pos.y, evt, this.xml3dElem);

        return false; // don't redraw
    };

    CanvasHandler.prototype.mouseWheel = function(evt) {
        var pos = this.getMousePosition(evt);
        // note: mousewheel type not defined in DOM!
        this.dispatchMouseEvent("mousewheel", 0, pos.x, pos.y, evt, this.xml3dElem);

        return false; // don't redraw
    };

    /**
     * Dispatches a FrameDrawnEvent to listeners
     *
     * @param start
     * @param end
     * @param numObjDrawn
     * @return
     */
    CanvasHandler.prototype.dispatchFrameDrawnEvent = function(start, end, stats) {
        var event = {};
        event.timeStart = start;
        event.timeEnd = end;
        event.renderTimeInMilliseconds = end - start;
        event.numberOfObjectsDrawn = stats[0];
        event.numberOfTrianglesDrawn = Math.floor(stats[1]);

        for ( var i in this.events.framedrawn) {
            this.events.framedrawn[i].listener.call(this.events.framedrawn[i].node, event);
        }

    };

    // Destroys the renderer associated with this Handler
    CanvasHandler.prototype.shutdown = function(scene) {
        var gl = this.gl;

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
        this.mouseMovePickingEnabled = isEnabled;
    };

    xml3d.webgl.CanvasHandler = CanvasHandler;
})();

// TODO: Move to a good place
xml3d.webgl.createCanvas = function(xml3dElement, index) {

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
    // First set the computed for some important attributes, they might be
    // overwritten
    // by class attribute later
    var sides = [ "top", "right", "bottom", "left" ];
    var colorStr = "";
    var styleStr = "";
    var widthStr = "";
    var paddingStr = "";
    var marginStr = "";
    for (var i in sides) {
        colorStr += style.getPropertyValue("border-" + sides[i] + "-color") + " ";
        styleStr += style.getPropertyValue("border-" + sides[i] + "-style") + " ";
        widthStr += style.getPropertyValue("border-" + sides[i] + "-width") + " ";
        paddingStr += style.getPropertyValue("padding-" + sides[i]) + " ";
        marginStr += style.getPropertyValue("margin-" + sides[i]) + " ";
    }
    canvas.style.borderColor = colorStr;
    canvas.style.borderStyle = styleStr;
    canvas.style.borderWidth = widthStr;
    canvas.style.padding = paddingStr;
    canvas.style.margin = marginStr;
    canvas.style.float = style.getPropertyValue("float");

    // Need to be set for correct canvas size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    return canvas;
};


xml3d.webgl.stopEvent = function(ev) {
	if (ev.preventDefault)
		ev.preventDefault();
	if (ev.stopPropagation)
		ev.stopPropagation();
	ev.returnValue = false;
};
