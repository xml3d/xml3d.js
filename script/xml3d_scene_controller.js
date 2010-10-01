//Check, if basics have already been defined
var org;
if (!org || !org.xml3d)
  throw new Error("xml3d.js has to be included first");

if (!org.xml3d.util)
	org.xml3d.util = {};
else if (typeof org.xml3d.util != "object")
	throw new Error("org.xml3d.util already exists and is not an object");

org.xml3d.util.Timer = function() {
	this.start();
};

org.xml3d.util.Timer.prototype.restart = function() {
	var prevTime = this.time;
	this.start();
	return this.time - prevTime;
};

org.xml3d.util.Timer.prototype.start = function() {
	this.time = new Date().getTime();
};


org.xml3d.Camera = function(view) {
	this.view = view;
};

org.xml3d.Camera.prototype.__defineGetter__("orientation", function() { return this.view.orientation; });
org.xml3d.Camera.prototype.__defineGetter__("position", function() { return this.view.position; });
org.xml3d.Camera.prototype.__defineSetter__("orientation", function(orientation) { /*org.xml3d.debug.logError("Orientation: " + orientation);*/ this.view.orientation = orientation; });
org.xml3d.Camera.prototype.__defineSetter__("position", function(position) { this.view.position = position; });
org.xml3d.Camera.prototype.__defineGetter__("direction", function() { return this.view.getDirection(); });
org.xml3d.Camera.prototype.__defineGetter__("fieldOfView", function() { return this.view.fieldOfView; });

org.xml3d.Camera.prototype.rotateAroundPoint = function(q0, p0) {
	//org.xml3d.debug.logError("Orientation: " + this.orientation.multiply(q0).normalize());
	var tmp = this.orientation.multiply(q0);
	tmp.normalize();
	this.orientation = tmp;
	var trans = new XML3DRotation(this.inverseTransformOf(q0.axis), q0.angle).rotateVec3(this.position.subtract(p0));
	this.position = p0.add(trans);
};

org.xml3d.Camera.prototype.rotate = function(q0) {
	this.orientation = this.orientation.multiply(q0).normalize();
};

org.xml3d.Camera.prototype.translate = function(t0) {
	this.position = this.position.add(t0);
};

org.xml3d.Camera.prototype.inverseTransformOf = function(vec) {
	return this.orientation.rotateVec3(vec);
};

org.xml3d.Xml3dSceneController = function(xml3d) {
	this.webgl = xml3d.style === undefined;

	this.xml3d = xml3d;
	this.canvas = this.webgl ?  xml3d.canvas : xml3d;
	
	var view = this.getView();
	if (!view)
	{
		org.xml3d.debug.logWarning("No view found, rendering disabled!");
		if (xml3d.update)
			xml3d.update(); // TODO: Test
	}
	if (!this.xml3d || !view)
	{
		org.xml3d.debug.logError("Could not initialize Camera Controller.");
		return;
	}
	org.xml3d.debug.logWarning("View: " + view);
	this.camera = new org.xml3d.Camera(view);
	this.timer = new org.xml3d.util.Timer();
	this.prevPos = function() {
		this.x = -1;
		this.y = -1;
	};
	
	this.revolveAroundPoint = new XML3DVec3(0, 0, 0);
	this.rotateSpeed = 1;
	this.zoomSpeed = 20;
	this.spinningSensitivity = 0.3;
	this.isSpinning = false;
	
	this.UPVECTOR = new XML3DVec3(0, 1, 0);
	this.ZVECTOR = new XML3DVec3(0, 0, -1);
	
	this.moveSpeedElement = document.getElementById("moveSpeed");
	this.useKeys = document.getElementById("useKeys");

	this.attach();
};

org.xml3d.Xml3dSceneController.prototype.attach = function() {
	var self = this;
	this._evt_mousedown = function(e) {self.mousePressEvent(e);};
	this._evt_mouseup = function(e) {self.mouseReleaseEvent(e);};
	this._evt_mousemove = function(e) {self.mouseMoveEvent(e);};
	this._evt_contextmenu = function(e) {self.stopEvent(e);};
	this._evt_keydown = function(e) {self.keyHandling(e);};
	
	this.canvas.addEventListener("mousedown", this._evt_mousedown, false);
	document.addEventListener("mouseup", this._evt_mouseup, false);
	document.addEventListener("mousemove",this._evt_mousemove, false);
	this.canvas.addEventListener("contextmenu", this._evt_contextmenu, false);
	if (this.useKeys)
		document.addEventListener("keydown", this._evt_keydown, false);
};

org.xml3d.Xml3dSceneController.prototype.detach = function() {
	this.canvas.removeEventListener("mousedown", this._evt_mousedown, false);
	document.removeEventListener("mouseup", this._evt_mouseup, false);
	document.removeEventListener("mousemove",this._evt_mousemove, false);
	this.canvas.removeEventListener("contextmenu", this._evt_contextmenu, false);
	if (this.useKeys)
		document.removeEventListener("keydown", this._evt_keydown, false);
};

org.xml3d.Xml3dSceneController.prototype.__defineGetter__("width", function() { return this.canvas.width;});
org.xml3d.Xml3dSceneController.prototype.__defineGetter__("height", function() { return this.canvas.height;});

org.xml3d.Xml3dSceneController.prototype.getView = function() {
	var activeView = null;
	var activeViewStr = this.xml3d.activeView ? this.xml3d.activeView : this.xml3d.getAttribute("activeView");
	org.xml3d.debug.logWarning("Active View: " + activeViewStr);
	
	if (activeViewStr)
	{
		if (activeViewStr.indexOf('#') == 0)
			activeViewStr = activeViewStr.replace('#', '');
		org.xml3d.debug.logWarning("Trying to resolve view '" + activeViewStr +"'");
		activeView = document.getElementById(activeViewStr);
	}
	// if activeView is not defined or the reference is not valid
	// use the first view element
	if (!activeView)
	{
		org.xml3d.debug.logWarning("No view referenced. Trying to use first view.");
		activeView =  document.evaluate('//xml3d:xml3d/xml3d:view[1]', document, function() {
			return org.xml3d.xml3dNS;
		}, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
	}
	return activeView;
};

org.xml3d.Xml3dSceneController.prototype.getMoveScale = function() {
	if (this.moveSpeedElement)
		return this.moveSpeedElement.value;
	return 1.0;
};

org.xml3d.Xml3dSceneController.prototype.stopEvent = function(ev) {
	this.stopPropagation(ev);
	this.preventDefault(ev);
};

org.xml3d.Xml3dSceneController.prototype.stopPropagation = function(ev) {
	if (ev.stopPropagation) {
		ev.stopPropagation();
	} else {
		ev.cancelBubble = true;
	}
};

org.xml3d.Xml3dSceneController.prototype.preventDefault = function(ev) {
	if (ev.preventDefault) {
		ev.preventDefault();
	} else {
		ev.returnValue = false;
	}
};

org.xml3d.Xml3dSceneController.prototype.update = function() {
	if (this.animation || this.needUpdate) {
		this.needUpdate = false;
		if (this.xml3d.update)
			this.xml3d.update();
	}
};

org.xml3d.Xml3dSceneController.prototype.NO_MOUSE_ACTION = 0;
org.xml3d.Xml3dSceneController.prototype.TRANSLATE = 1;
org.xml3d.Xml3dSceneController.prototype.ZOOM = 2;
org.xml3d.Xml3dSceneController.prototype.ROTATE = 3;

org.xml3d.Xml3dSceneController.prototype.mousePressEvent = function(event) {

	this.stopEvent(event);
	ev = event || window.event;

	var button = (ev.which || ev.button);
	switch (button) {
		case 1:
			this.action = this.ROTATE;
			break;
		case 2:
			this.action = this.TRANSLATE;
			break;
		case 3:
			this.action = this.ZOOM;
			break;
		default:
			this.action = this.NO_MOUSE_ACTION;
	}
	
	this.prevPos.x = ev.pageX;
	this.prevPos.y = ev.pageY;

	return false;
};

org.xml3d.Xml3dSceneController.prototype.mouseReleaseEvent = function(event) {
	this.stopEvent(event);
	
	//if (this.action == this.ROTATE && this.mouseSpeed > this.spinningSensitivity)
	//	this.startSpinning();
	
	this.action = this.NO_MOUSE_ACTION;
	return false;
};

org.xml3d.Xml3dSceneController.prototype.startSpinning = new function() {
	this.isSpinning = true;
	// TODO
};

org.xml3d.Xml3dSceneController.prototype.computeMouseSpeed = function(event) {
	var dx = (event.pageX - this.prevPos.x);
	var dy = (event.pageY - this.prevPos.y);
	var dist = Math.sqrt(+dx*dx + dy*+dy);
	this.delay = this.timer.restart();
	if (this.delay == 0)
	    this.mouseSpeed = dist;
	  else
	    this.mouseSpeed = dist/this.delay;
	org.xml3d.debug.logWarning("Mouse speed: " + this.mouseSpeed);
};

org.xml3d.Xml3dSceneController.prototype.mouseMoveEvent = function(event, camera) {
	this.stopEvent(event);

	ev = event || window.event;

	switch(this.action) {
		case(this.TRANSLATE):
			var f = 2.0* Math.tan(this.camera.fieldOfView/2.0) / this.height;
			var dx = f*(ev.pageX - this.prevPos.x);
			var dy = f*(ev.pageY - this.prevPos.y);
			var trans = new XML3DVec3(dx, dy, 0.0);
			this.camera.translate(this.camera.inverseTransformOf(trans));
			break;
		case(this.ZOOM):
			var dy = this.zoomSpeed * (ev.pageY - this.prevPos.y) / this.height;
			this.camera.translate(this.camera.inverseTransformOf(new XML3DVec3(0, 0, dy)));
			break;
		case(this.ROTATE):
			
			var dx = -this.rotateSpeed * (ev.pageX - this.prevPos.x) * 2.0 * Math.PI / this.width;
			var dy = -this.rotateSpeed * (ev.pageY - this.prevPos.y) * 2.0 * Math.PI / this.height;

			var mx = new XML3DRotation(new XML3DVec3(0,1,0), dx);
			var my = new XML3DRotation(new XML3DVec3(1,0,0), dy);
			//this.computeMouseSpeed(ev);
			this.camera.rotateAroundPoint(mx.multiply(my), this.revolveAroundPoint);
			break;
	}
	
	if (this.action != this.NO_MOUSE_ACTION)
	{
		this.needUpdate = true;
		this.prevPos.x = ev.pageX;
		this.prevPos.y = ev.pageY;
		event.returnValue = false;
        
		this.update();
	}
	return false;
};



// -----------------------------------------------------
// key movement
// -----------------------------------------------------

org.xml3d.Xml3dSceneController.prototype.keyHandling = function(e) {
	var KeyID = e.keyCode;
	if (KeyID == 0) {
		switch (e.which) {
		case 119:
			KeyID = 87;
			break; // w
		case 100:
			KeyID = 68;
			break; // d
		case 97:
			KeyID = 65;
			break; // a
		case 115:
			KeyID = 83;
			break; // s
		}
	}

	var xml3d = this.xml3d;
	// alert(xml3d);
	var camera = this.camera;
	var dir = camera.getDirection();
	if (xml3d) {
		switch (KeyID) {
		case 38: // up
		case 87: // w
			camera.position = camera.position.add(dir.scale(this.getMoveScale()));
			break;
		case 39: // right
		case 68: // d
			var np = camera.position;
			np.x -= dir.z * this.getMoveScale();
			np.z += dir.x * this.getMoveScale();
			camera.position = np;
			break;
		case 37: // left
		case 65: // a
			var np = camera.position;
			np.x += dir.z * this.getMoveScale();
			np.z -= dir.x * this.getMoveScale();
			camera.position = np;
			break;
		case 40: // down
		case 83: // s
			camera.position = camera.position.subtract(dir.scale(this.getMoveScale()));
			break;

		default:
			return;
		}
		this.needUpdate = true;
	}
	this.preventDefault(e);
};

(function() {

	var onload = function() {
		if (!org.xml3d._rendererFound)
			return;
			
		var xml3dList = Array.prototype.slice.call( document.getElementsByTagNameNS(org.xml3d.xml3dNS, 'xml3d') );

		org.xml3d.Xml3dSceneController.controllers = new Array();
		for(var node in xml3dList) {
			org.xml3d.debug.logInfo("Attaching Controller to xml3d element.");
			org.xml3d.Xml3dSceneController.controllers[node] = new org.xml3d.Xml3dSceneController(xml3dList[node]);
		};
	};
	var onunload = function() {
		for(var i in org.xml3d.Xml3dSceneController.controllers)
		{
			org.xml3d.Xml3dSceneController.controllers[i].detach();
		}
	};
	
	window.addEventListener('load', onload, false);
	window.addEventListener('unload', onunload, false);
	window.addEventListener('reload', onunload, false);

})();


//org.xml3d.Xml3dSceneController.prototype.createInput = function(inputName,
//		panel) {
//	panel.appendChild(document.createTextNode(inputName + ": "));
//	var input = document.createElement("input");
//	input.type = "text";
//	input.style.width = "10em";
//	input.name = inputName;
//	panel.appendChild(input);
//	panel.appendChild(document.createElement("br"));
//	return input;
//};
//
//org.xml3d.Xml3dSceneController.prototype.updateInput = function() {
//	if (this.inputPanel) {
//		this.inputPosX.value = this.camera.position.x;
//		this.inputPosY.value = this.camera.position.y;
//		this.inputPosZ.value = this.camera.position.z;
//		this.inputDirX.value = this.camera.direction.x;
//		this.inputDirY.value = this.camera.direction.y;
//		this.inputDirZ.value = this.camera.direction.z;
//	}
//};
//
//org.xml3d.Xml3dSceneController.prototype.takeInput = function(e) {
//	if (this.inputPanel) {
//		this.camera.position.x = this.inputPosX.value;
//		this.camera.position.y = this.inputPosY.value;
//		this.camera.position.z = this.inputPosZ.value;
//		this.camera.direction.x = this.inputDirX.value;
//		this.camera.direction.y = this.inputDirY.value;
//		this.camera.direction.z = this.inputDirZ.value;
//		this.needUpdate = true;
//		this.update();
//	}
//	this.preventDefault(e);
//};
//
//org.xml3d.Xml3dSceneController.prototype.setAnimation = function(active) {
//	this.animation = active;
//	this.xml3d.setAnimation(active);
//};
//
//org.xml3d.Xml3dSceneController.prototype.reset = function() {
//	this.xml3d.reset();
//	this.needUpdate = true;
//};
