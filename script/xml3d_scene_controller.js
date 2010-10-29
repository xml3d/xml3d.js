/*************************************************************************/
/*                                                                       */
/*  xml3d_scene_controller.js                                            */
/*  Navigation method for XML3D						                     */
/*                                                                       */
/*  Copyright (C) 2010                                                   */
/*  DFKI - German Research Center for Artificial Intelligence            */
/*                                                                       */
/*  This file is part of xml3d.js                                        */
/*                                                                       */
/*  xml3d.js is free software; you can redistribute it and/or modify     */
/*  under the terms of the GNU General Public License as                 */
/*  published by the Free Software Foundation; either version 2 of       */
/*  the License, or (at your option) any later version.                  */
/*                                                                       */
/*  xml3d.js is distributed in the hope that it will be useful, but      */
/*  WITHOUT ANY WARRANTY; without even the implied warranty of           */
/*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.                 */
/*  See the GNU General Public License                                   */
/*  (http://www.fsf.org/licensing/licenses/gpl.html) for more details.   */
/*                                                                       */
/*************************************************************************/

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
org.xml3d.Camera.prototype.__defineGetter__("upVector", function() { return this.view.getUpVector(); });
org.xml3d.Camera.prototype.__defineGetter__("fieldOfView", function() { return this.view.fieldOfView; });

org.xml3d.Camera.prototype.rotateAroundPoint = function(q0, p0) {
	//org.xml3d.debug.logError("Orientation: " + this.orientation.multiply(q0).normalize());
	var tmp = this.orientation.multiply(q0);
	tmp.normalize();
	this.orientation = tmp;
	var trans = new XML3DRotation(this.inverseTransformOf(q0.axis), q0.angle).rotateVec3(this.position.subtract(p0));
	this.position = p0.add(trans);
};

org.xml3d.Camera.prototype.lookAround = function(rotSide, rotUp, upVector) {
	//org.xml3d.debug.logError("Orientation: " + this.orientation.multiply(q0).normalize());
	var check = rotUp.multiply(this.orientation);
	var tmp;
	if( Math.abs(upVector.dot(check.rotateVec3(new XML3DVec3(0,0,-1)))) > 0.95 )
		tmp = rotSide;
    else
	    tmp = rotSide.multiply(rotUp);
	tmp.normalize();
	tmp = tmp.multiply(this.orientation);
	tmp.normalize();
	this.orientation = tmp;
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
	this.webgl = !xml3d.style;

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
	
	this.mode = "examine";
	this.revolveAroundPoint = new XML3DVec3(0, 0, 0);
	this.rotateSpeed = 1;
	this.zoomSpeed = 20;
	this.spinningSensitivity = 0.3;
	this.isSpinning = false;
	
	this.upVector = this.camera.upVector;
	
	this.moveSpeedElement = document.getElementById("moveSpeed");
	this.useKeys = document.getElementById("useKeys");
	
	var navigations = xml3d.getElementsByTagName("navigation");
	
	if(navigations.length > 0)
	{
		var config = navigations[0];
		this.mode = config.getAttribute("mode");
		if(this.mode != "walk" && this.mode != "examine" )
			this.mode = "examine";
		
		if(config.getAttribute("resolveAround")){
			this.revolveAroundPoint.setVec3Value(config.getAttribute("resolveAround"));
		}
		if(config.getAttribute("speed"))
		{
			this.zoomSpeed *= config.getAttribute("speed");
		}
	}

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
	//var activeView = null;
	var activeView = this.xml3d.activeView; //? this.xml3d.activeView : this.xml3d.getAttribute("activeView");
	org.xml3d.debug.logWarning("Active View: " + activeView);
	
	if (typeof activeView=="string")
	{
		if (activeView.indexOf('#') == 0)
			activeView = activeView.replace('#', '');
		org.xml3d.debug.logWarning("Trying to resolve view '" + activeView +"'");
		activeView = document.getElementById(activeView);
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

org.xml3d.Xml3dSceneController.prototype.stopEvent = function(ev) {
	if (ev.preventDefault)
		ev.preventDefault();
	if (ev.stopPropagation) 
		ev.stopPropagation();
	ev.returnValue = false;
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
org.xml3d.Xml3dSceneController.prototype.DOLLY = 2;
org.xml3d.Xml3dSceneController.prototype.ROTATE = 3;
org.xml3d.Xml3dSceneController.prototype.LOOKAROUND = 4;

org.xml3d.Xml3dSceneController.prototype.mousePressEvent = function(event) {

	ev = event || window.event;

	var button = (ev.which || ev.button);
	switch (button) {
		case 1:
			if(this.mode == "examine")
				this.action = this.ROTATE;
			else
				this.action = this.LOOKAROUND;
			break;
		case 2:
			this.action = this.TRANSLATE;
			break;
		case 3:
			this.action = this.DOLLY;
			break;
		default:
			this.action = this.NO_MOUSE_ACTION;
	}
	
	this.prevPos.x = ev.pageX;
	this.prevPos.y = ev.pageY;

	this.stopEvent(event);
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

	ev = event || window.event;

	switch(this.action) {
		case(this.TRANSLATE):
			var f = 2.0* Math.tan(this.camera.fieldOfView/2.0) / this.height;
			var dx = f*(ev.pageX - this.prevPos.x);
			var dy = f*(ev.pageY - this.prevPos.y);
			var trans = new XML3DVec3(dx, dy, 0.0);
			this.camera.translate(this.camera.inverseTransformOf(trans));
			break;
		case(this.DOLLY):
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
		case(this.LOOKAROUND):
			var dx = -this.rotateSpeed * (ev.pageX - this.prevPos.x) * 2.0 * Math.PI / this.width;
			var dy = this.rotateSpeed * (ev.pageY - this.prevPos.y) * 2.0 * Math.PI / this.height;
			var cross = this.upVector.cross(this.camera.direction);

			var mx = new XML3DRotation( this.upVector , dx);
			var my = new XML3DRotation( cross , dy);
			
			this.camera.lookAround(mx, my, this.upVector);
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
	this.stopEvent(event);
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
			camera.position = camera.position.add(dir.scale(this.zoomSpeed));
			break;
		case 39: // right
		case 68: // d
			var np = camera.position;
			np.x -= dir.z * this.zoomSpeed;
			np.z += dir.x * this.zoomSpeed;
			camera.position = np;
			break;
		case 37: // left
		case 65: // a
			var np = camera.position;
			np.x += dir.z * this.zoomSpeed;
			np.z -= dir.x * this.zoomSpeed;
			camera.position = np;
			break;
		case 40: // down
		case 83: // s
			camera.position = camera.position.subtract(dir.scale(this.zoomSpeed));
			break;

		default:
			return;
		}
		this.needUpdate = true;
	}
	this.stopEvent(e);
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

/***********************************************************************/