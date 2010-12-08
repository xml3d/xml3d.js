
var org;
if (!org || !org.xml3d)
	throw new Error("xml3d.js has to be included first");

var xml3dPhysics;
if(!xml3dPhysics)
	throw new Error("xml3d_physics.js has to be included first");

function createVec3(x, y, z)
{
	var xml3d = __physicsXml3dElements[0];
	var res = xml3d.createXML3DVec3();
	res.x = x; res.y = y; res.z = z;
	return res;
}

function createRotation(x, y, z, w)
{
	var xml3d = document.getElementById("MyXml3d");
	var res = xml3d.createXML3DRotation();
	res.x = x; res.y = y; res.z = z; res.w = w;
	return res;
}

function multVec3(vec, scalar)
{
	return createVec3(vec.x * scalar, vec.y * scalar, vec.z * scalar);
}

xml3dPhysics.Interactor = function(xml3d) {
	var self = this;
	this.xml3d = xml3d;
	if(!this.xml3d)
		return;
	this.wrapper = xml3d.parentNode;
	this.impulseChargingEnabled = false;
	this.lastTime = 0;
	this.lastObject = null;
	this.interactableObjects = null;
	
	// Interface
	this.enableImpulseCharging = function() {
		this.impulseChargingEnabled = true;
	}
	this.disableImpulseCharging = function() {
		this.impulseChargingEnabled = false;
	}
	
	// If interactable IDs are added the interaction
	// is restricted to the objects with these IDs.
	this.addInteractableId = function(id) {
		if(!this.interactableObjects)
			this.interactableObjects = {};
		this.interactableObjects[id] = true;
	}
	
	this.minImpulse = 20.0;
	this.maxImpulse = 9000.0;
	this.getImpulseIntensity = function(){
		if(!this.lastTime) return this.minImpulse;
		
		var date = new Date();
		var currentTime = date.getTime();
		var diff = parseFloat(currentTime - this.lastTime);
		return Math.min(this.minImpulse + diff*2.4, this.maxImpulse);
	}
	this.getImpulsePercentage = function(){
		return (this.getImpulseIntensity() - this.minImpulse) / 
			(this.maxImpulse - this.minImpulse) * 100.0;
	}
	
	// node offset
	this.getOffsetX = function(node) {
		var offset = node.offsetLeft;
		while(node = node.offsetParent)
			offset += node.offsetLeft;
		return offset;
	}
	this.getOffsetY = function(node) {
		var offset = node.offsetTop;
		while(node = node.offsetParent)
			offset += node.offsetTop;
		return offset;
	}
	
	this.getEventObject = function(event) {
		var x = event.pageX - this.getOffsetX(this.wrapper);
		var y = event.pageY - this.getOffsetY(this.wrapper);
		var node = xml3d.getElementByPoint(x, y);
		if(node == xml3d || !node)
			return null;
			
		// find parent group element that is a physics object
		while(node = node.parentNode)
		{
			var phMat = 
				__physicsEvaluateXPathOnObject1(node, 
				'@physics:material');
			if(phMat.length)
				break;
		}
		if(!node)
			return null;
			
		// check if we have to restrict interaction	
		if(this.interactableObjects) {
			var id = node.getAttribute("id");
			if(!this.interactableObjects[id])
				return null;
		}
		
		// get physics object
		var physicsObject = 
			xml3dPhysics.getPhysicsObjectByElement(node);
		return physicsObject;
	}
	
	this.onMouseDown = function(event) {
		var button = (event.which || event.button);
		if(!this.impulseChargingEnabled || button != 1)
			return;
			
		this.lastObject = this.getEventObject(event);
		if(!this.lastObject)
			return;
			
		this.lastPosition = event.position;
		this.lastNormal = event.normal;
		var date = new Date();
		this.lastTime = date.getTime();
	}
	
	// use 2 versions of mouse up
	// When charging up the event handler has to be global
	// to make sure that the charging process ends.
	this.onMouseUpCharge = function(event) {
		if(!self.impulseChargingEnabled)
			return;
			
		var intensity = self.getImpulseIntensity();
		var physicsObject = self.lastObject;
		self.lastTime = 0;
		if(!physicsObject) return;
			
		// apply impulse
		physicsObject.applyImpulse(
			multVec3(self.lastNormal, -intensity),
			self.lastPosition);
	}
	  
	this.onMouseUpNoCharge = function(event) {
		if(this.impulseChargingEnabled)
			return;
	
		var button = (event.which || event.button);
		if(button != 1)
			return;
				
		var intensity = 40.0;
		var physicsObject = this.getEventObject(event);
		this.lastTime = 0;
		if(!physicsObject) return;
			
		// apply impulse
		physicsObject.applyImpulse(
			multVec3(event.normal, -intensity),
			event.position);
	}
	var xml3da = this.xml3d;
	var selfa = this;
	this.onload = function() {  
		xml3da.addEventListener("mousedown",
			function(event){ selfa.onMouseDown(event) }, false);
		xml3da.addEventListener("mouseup", 
			function(event){ selfa.onMouseUpNoCharge(event) }, false);
		document.onmouseup = selfa.onMouseUpCharge;
	};
	window.addEventListener('load', this.onload, false);
};

xml3dPhysics.interactor = new xml3dPhysics.Interactor(__physicsXml3dElements[0]);
