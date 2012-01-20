//Check, if basics have already been defined
var org;
if (!org || !org.xml3d)
  throw new Error("xml3d.js has to be included first");


// Create global symbol org.xml3d.webgl
if (!org.xml3d.webgl)
	org.xml3d.webgl = {};
else if (typeof org.xml3d.webgl != "object")
	throw new Error("org.xml3d.webgl already exists and is not an object");

org.xml3d.webgl.MAXFPS = 30;

/**
 * Creates the XML3DHandler.
 * 
 * The Handler is the interface between the renderer, canvas and SpiderGL elements. It responds to
 * user interaction with the scene and manages redrawing of the canvas.
 */
org.xml3d.webgl.createXML3DHandler = (function() {

	function Scene(xml3dElement) {
		this.xml3d = xml3dElement;

		this.getActiveView = function() {
		var av = this.xml3d.getActiveViewNode();
			if (av == null)
			{
				av = document.evaluate('//xml3d:xml3d/xml3d:view[1]', document, function() {
					return org.xml3d.xml3dNS;
				}, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
				if (av == null)
					org.xml3d.debug.logError("No view defined.");
			}
			if (typeof av == typeof "") {
				av = this.xml3d.xml3ddocument.resolve(av);
				if (av == null)
					org.xml3d.debug.logError("Could not find view");
			}
			return av;
		};
	}
	
	/**
	 * Constructor for the XML3DHandler
	 * 
	 * @param canvas
	 * 		the HTML Canvas element that this handler will be responsible for
	 * @param gl
	 * 		the WebGL Context associated with this canvas
	 * @param scene
	 * 		the root xml3d node, containing the XML3D scene structure
	 */
	function XML3DHandler(gl, canvas, scene) {
		//Set up local variables
		this.gl = gl;
		this.scene = scene;
		this.canvas = canvas;
		this.needDraw = true;
		this.needPickingDraw = true;
		this._pickingDisabled = false; 
		this._lastPickedObj = null; 
		this._mouseMovePickingEnabled = false;
		this.isDragging = false;
		this.timeNow   = Date.now() / 1000.0;
		this.postProcessShaders = [];
		this.events = { "mousedown":[], "mouseup":[], "click":[], "framedrawn":[], "mousemove":[], 
				"mouseout":[], "update":[], "mousewheel":[] };
		this.canvasInfo = {
				width 				: canvas.width,
				height 				: canvas.height,
				id					: canvas.id,	
				mouseButtonsDown 	: [false, false]
		};
		
		//Register listeners on canvas
		this.registerCanvasListeners(canvas);
		
		//This function is called at regular intervals by requestAnimFrame to determine if a redraw
		//is needed
		var handler = this;
		this._tick = function() {
			if (handler.update())
				handler.draw();
			
			requestAnimFrame(handler._tick);
		};
		
		this.redraw = function(reason, forcePickingRedraw) {
			if (this.needDraw !== undefined) {
				this.needDraw = true;
				this.needPickingDraw = forcePickingRedraw !== undefined ? forcePickingRedraw : true;
			} else {
				//This is a callback from a texture, don't need to redraw the picking buffers
				handler.needDraw = true;
			}
		};
		
		//Create renderer
		this.renderer = new org.xml3d.webgl.Renderer(this, canvas.clientWidth, canvas.clientHeight);
	}
	
	//Requests a WebGL context for the canvas and returns an XML3DHander for it
	function setupXML3DHandler(canvas, xml3dElement) {
		org.xml3d.debug.logInfo("setupXML3DHandler: canvas=" + canvas);
		var context = null;
		//try {
			context = canvas.getContext("experimental-webgl");
			if (context) {
				return new XML3DHandler(context, canvas, new Scene(xml3dElement));
			}
		//} catch (ef) {
		//	org.xml3d.debug.logError(ef);
		//	return null;
		//}
	}
	
	XML3DHandler.prototype.registerCanvasListeners = function(canvas) {
		var handler = this;
		canvas.addEventListener("mousedown",       function(e) { handler.mouseDown   (e); }, false);
		canvas.addEventListener("mouseup",         function(e) { handler.mouseUp     (e); }, false);
		canvas.addEventListener("mousemove",       function(e) { handler.mouseMove   (e); }, false);
		canvas.addEventListener("click",           function(e) { handler.click       (e); }, false);
		canvas.addEventListener("mousewheel",      function(e) { handler.mouseWheel  (e); }, false);
		canvas.addEventListener("DOMMouseScroll",  function(e) { handler.mouseWheel  (e); }, false);
		canvas.addEventListener("mouseout",        function(e) { handler.mouseOut    (e); }, false);
	};

	//Initializes the SpiderGL canvas manager and renders the scene
	XML3DHandler.prototype.start = function() {
		var gl = this.gl;
		
		gl.pixelStorei(gl.PACK_ALIGNMENT,                     1);
		gl.pixelStorei(gl.UNPACK_ALIGNMENT,                   1);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,                true);
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,     true);
		gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL);
		
		this._tick();
	};
	
	//Returns the HTML ID of the canvas associated with this Handler
	XML3DHandler.prototype.getCanvasId = function() {
		return this.canvas.id;
	};

	//Returns the width of the canvas associated with this Handler
	XML3DHandler.prototype.getCanvasWidth = function() {
		return this.canvas.width;
	};

	//Returns the height of the canvas associated with this Handler
	XML3DHandler.prototype.getCanvasHeight = function() {
		return this.canvas.height;
	};

	XML3DHandler.prototype.resize = function(gl, width, height) {
		if (width < 1 || height < 1)
			return false;
		
		this.renderer.resize(width, height);
		
		return true;
	};
	
	//Binds the picking buffer and passes the request for a picking pass to the renderer
	XML3DHandler.prototype.renderPick = function(screenX, screenY) {
		if (this._pickingDisabled)
			return;
		this.renderer.renderPickingPass(screenX, this.canvas.height - screenY, this.needPickingDraw);
		this.needPickingDraw = false;
	};
	
	//Binds the normal picking buffer and passes the request for picked object normals to the renderer
	XML3DHandler.prototype.renderPickedNormals = function(pickedObj, screenX, screenY) {
		if (!pickedObj || this._pickingDisabled)
			return;	
		this.renderer.renderPickedNormals(pickedObj, screenX, this.canvas.height - screenY);
	};
	
	//Uses gluUnProject() to transform the 2D screen point to a 3D ray 
	// returns an XML3DRay
	XML3DHandler.prototype.generateRay = function(screenX, screenY) { 
		
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
		if(false === GLU.unProject(screenX, screenY, 0, 
											 viewMat, projMat, viewport, nearHit))
		{
			return ray; 
		}

		if(false === GLU.unProject(screenX, screenY, 1,
				 							 viewMat, projMat, viewport, farHit))
		{
			return ray; 
		}
		
		// calculate ray 
		
		ray.origin = this.renderer.currentView.position;  
		ray.direction = new XML3DVec3(farHit[0] - nearHit[0], 
									  farHit[1] - nearHit[1],
									  farHit[2] - nearHit[2]);
		ray.direction = ray.direction.normalize(); 
		
		return ray;
	}; 
	
	//This function is called by _tick() at regular intervals to determine if a redraw of the 
	//scene is required
	XML3DHandler.prototype.update = function() {
		for (var i=0; i<this.events.update.length; i++) {		
			if (this.events.update[i].listener.call(this.events.update[i].node) == true)
				this.needDraw = true;
		}	
		
		return this.needDraw;
	};	
	
	/**
	 * Called by _tick() to redraw the scene if needed
	 * @param gl
	 * @return
	 */
	XML3DHandler.prototype.draw = function() {
		try {
								
			var start = Date.now();		
			var stats = this.renderer.render(this.gl);
			var end = Date.now();				
			
			this.dispatchFrameDrawnEvent(start, end, stats);
			this.needDraw = false;	
            
		} catch (e) {
			org.xml3d.debug.logException(e);
			throw e;
		}

	};
	
	
	/**
     * Initalizes an DOM MouseEvent, picks the scene and sends the event to
     * the hit object, if one was hit.
     *
     *  It dispatches it on two ways: calling dispatchEvent() on the target element
     *  and going through the tree up to the root xml3d element invoking all
     *  on[type] attribute code.
     *
     * @param type the type string according to the W3 DOM MouseEvent
     * @param button which mouse button is pressed, if any
     * @param x the screen x-coordinate
     * @param y the screen y-coordinate
     * @param (optional) event the W3 DOM MouseEvent, if present (currently not when SpiderGL's blur event occurs)
     * @param (optional) target the element to which the event is to be dispatched. If this is
     *             not given, the currentPickObj will be taken or the xml3d element, if no hit occured.
     *
     */
    XML3DHandler.prototype.dispatchMouseEvent = function(type, button, x, y, event, target) {
        // init event
        if(event === null || evt === undefined)
        {
            evt = document.createEvent("MouseEvents");
            evt.initMouseEvent(    type,
                            // canBubble, cancelable, view, detail
                               true, true, window, 0,
                               // screenX, screenY, clientX, clientY
                               0, 0, x, y,
                               // ctrl, alt, shift, meta, button
                               false, false, false, false, button,
                               // relatedTarget
                               null);
        }

        // Copy event to avoid DOM dispatch errors (cannot dispatch event more than once)
        var evt = this.copyMouseEvent(event);
        this.initExtendedMouseEvent(evt, x, y);

        // find event target
        var tar = null;
        if(target !== undefined && target !== null)
            tar = target;
        else if(this.scene.xml3d.currentPickObj)
            tar = this.scene.xml3d.currentPickObj.node;
        else
            tar = this.scene.xml3d;

        // FIXME dispatch
        /*for (var i = 0; i < tar.adapters.length; i++) {
            if (tar.adapters[i].dispatchEvent) {
                tar.adapters[i].dispatchEvent(evt);
            }
        }*/

        // FIXME dispatch an extra copy to the canvas element
        // TODO: is this needed? do we 'eat' the initial event or is it passed on already?
        tar = this.scene.xml3d;
        /*for (var i = 0; i < tar.adapters.length; i++) {
            if (tar.adapters[i].dispatchEvent) {
                tar.adapters[i].dispatchEvent(evt);
            }
        }*/
    };
	
	/** 
	 * Creates an DOM mouse event based on the given event and returns it
	 * 
	 * @param event the event to copy
	 * @return the new event 
	 */
	XML3DHandler.prototype.copyMouseEvent = function(event)
	{
		evt = document.createEvent("MouseEvents");
		evt.initMouseEvent(	event.type,
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
	XML3DHandler.prototype.initExtendedMouseEvent = function(event, x, y) { 
				
		var handler = this;
		var scene = this.scene;
		
		event.__defineGetter__("normal", function() {
			handler.renderPickedNormals(scene.xml3d.currentPickObj, x, y); 
			var v = scene.xml3d.currentPickNormal.v;
			return new XML3DVec3(v[0], v[1], v[2]);
		});
		event.__defineGetter__("position", function() {return scene.xml3d.currentPickPos;});
	}; 
	
	 /**
     * This method is called each time a mouseUp event is triggered on the canvas
     *
     * @param gl
     * @param button
     * @param x
     * @param y
     * @return
     */
    XML3DHandler.prototype.mouseUp = function(evt) {
        this.canvasInfo.mouseButtonsDown[evt.button] = false;
        var pos = this.getMousePosition(evt);

        if (this.isDragging) {
            this.needPickingDraw = true;
            this.isDragging = false;
        }

        this.renderPick(pos.x, pos.y);
        this.dispatchMouseEvent("mouseup", event.button, pos.x, pos.y, event);

        return false; // don't redraw
    };

    /**
     * This method is called each time a mouseDown event is triggered on the canvas
     *
     * @param gl
     * @param button
     * @param x
     * @param y
     * @return
     */
    XML3DHandler.prototype.mouseDown = function(evt) {
        this.canvasInfo.mouseButtonsDown[evt.button] = true;
        var pos = this.getMousePosition(evt);
        this.renderPick(pos.x, pos.y);

        this.dispatchMouseEvent("mousedown", event.button, pos.x, pos.y, event);

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
    XML3DHandler.prototype.click = function(evt) {
        var pos = this.getMousePosition(evt);
        if (this.isDragging) {
            this.needPickingDraw = true;
            return;
        }

        this.dispatchMouseEvent("click", event.button, pos.x, pos.y, event);

        return false; // don't redraw
    };

    /**
     * This method is called each time a mouseMove event is triggered on the canvas.
     *
     * This method also triggers mouseover and mouseout events of objects in the scene.
     *
     * @param gl
     * @param x
     * @param y
     * @return
     */
    XML3DHandler.prototype.mouseMove = function(evt) {
        var pos = this.getMousePosition(evt);

        if (this.canvasInfo.mouseButtonsDown[0]) {
            this.isDragging = true;
        }

        //Call any global mousemove methods
        this.dispatchMouseEvent("mousemove", 0, pos.x, pos.y, evt, this.scene.xml3d);

        if (!this._mouseMovePickingEnabled)
            return;

        this.renderPick(pos.x, pos.y);
        var curObj = null;
        if(this.scene.xml3d.currentPickObj)
            curObj = this.scene.xml3d.currentPickObj.node;

        // trigger mouseover and mouseout
        if(curObj !== this._lastPickedObj)
        {
            if (this._lastPickedObj)
            {
                //The mouse has left the last object
                this.dispatchMouseEvent("mouseout", 0, pos.x, pos.y, null, this._lastPickedObj);
            }
            if (curObj)
            {
                //The mouse is now over a different object, so call the new object's
                //mouseover method
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
    XML3DHandler.prototype.mouseOut = function(evt) {
        var pos = this.getMousePosition(evt);
        this.dispatchMouseEvent("mouseout", 0, pos.x, pos.y, evt, this.scene.xml3d);

        return false; // don't redraw
    };

    XML3DHandler.prototype.mouseWheel = function(evt) {
        var pos = this.getMousePosition(evt);
        // note: mousewheel type not defined in DOM!
        this.dispatchMouseEvent("mousewheel", 0, pos.x, pos.y, evt, this.scene.xml3d);

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
	XML3DHandler.prototype.dispatchFrameDrawnEvent = function(start, end, stats) {
		var event = {};
		event.timeStart = start;
		event.timeEnd = end;
		event.renderTimeInMilliseconds = end - start;
		event.numberOfObjectsDrawn = stats[0];
		event.numberOfTrianglesDrawn = Math.floor(stats[1]);
		
		for (var i in this.events.framedrawn) {
			this.events.framedrawn[i].listener.call(this.events.framedrawn[i].node, event);
		}
		
	};
	
	//Destroys the renderer associated with this Handler
	XML3DHandler.prototype.shutdown = function(scene) {
		var gl = this.gl;

		if (this.renderer) {
			this.renderer.dispose();
		}
	};
	
	XML3DHandler.prototype.getMousePosition = function(evt) {
		var rct = this.canvas.getBoundingClientRect();
		return {
			x : (evt.clientX - rct.left),
			y : (evt.clientY - rct.top )
		};
	};
	
	XML3DHandler.prototype.setMouseMovePicking = function(isEnabled) {
		this._mouseMovePickingEnabled = isEnabled;
	};

	window.requestAnimFrame = (function(){
	    return  window.requestAnimationFrame       || 
	    		window.webkitRequestAnimationFrame || 
	            window.mozRequestAnimationFrame    || 
	            window.oRequestAnimationFrame      || 
	            window.msRequestAnimationFrame     || 
	            function(){
	              window.setTimeout(_tick, 1000 / org.xml3d.webgl.MAXFPS);
	            };
	  })();
	
	return setupXML3DHandler;
})();
