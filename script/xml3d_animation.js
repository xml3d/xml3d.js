var org;
if (!org)
	org = {};
else if (typeof org != "object")
	throw new Error("org already exists and is not an object");

// Create global symbol org.xml3d
if (!org.xml3d)
	org.xml3d = {};
else if (typeof org.xml3d != "object")
	throw new Error("org.xml3d already exists and is not an object");

//Create global symbol org.xml3d.animation
if (!org.xml3d.animation)
	org.xml3d.animation = {};
else if (typeof org.xml3d.animation != "object")
	throw new Error("org.xml3d.animation already exists and is not an object");

(function() {
	var load = function() {
		if (org.xml3d.document !== undefined);
		{
			org.xml3d.debug.logInfo("Initializing Animation Manager.");
			org.xml3d.document.animationManager = new org.xml3d.animation.XML3DAnimationManager(org.xml3d.document);
			org.xml3d.document.animationManager.init();
		}
	};
	window.addEventListener('load', load, false);
	
})();

org.xml3d.startAnimation = function(aniID, transID, transAttr, duration, loop)
{
	return org.xml3d.document.animationManager.startAnimation(aniID, transID, transAttr, duration, loop);
};

org.xml3d.stopAnimation = function(handle)
{
	org.xml3d.document.animationManager.stopAnimation(handle);
};

/*org.xml3d.startAnimation = function(aniID)
{
	org.xml3d.document.animationManager.startAnimation(aniID);
};*/


org.xml3d.animation.XML3DAnimationManager = function(document) {
	this.document = document;
	this.animations = {};

};

org.xml3d.animation.XML3DAnimationManager.prototype.init = function() {
	var ois = document.getElementsByTagNameNS(org.xml3d.x3dNS, 'OrientationInterpolator');
	for(var i = 0; i < ois.length; i++)
	{
		if (ois[i].hasAttribute('id'))
		{
			this.animations[ois[i].getAttribute('id')] = new org.xml3d.animation.X3DOrientationInterpolation(ois[i]);
		}
	}
};

org.xml3d.animation.XML3DAnimationManager.prototype.startAnimation = function(aniID, transID, transAttr, duration, loop) {
	org.xml3d.debug.logWarning(this);
	if(this.animations[aniID] === undefined)
	{
		org.xml3d.debug.logWarning("Unknown Animation: " + aniID);
		return;
	}
	var animation = this.animations[aniID];
	if (!animation.isValid())
	{
		org.xml3d.debug.logWarning("Could not initialize Animation: " + aniID);
		return;
	}
	var trans = this.document.getElementById(transID);
	if (!trans)
	{
		org.xml3d.debug.logWarning("Could not find animation target: " + transID);
		return;
	}
	
	var field = trans.getAttributeNode(transAttr);
	if (!field)
	{
		field = this.document.parentDocument.createAttribute(transAttr);
		field.nodeValue = animation.getValue(0).join(' ');
		trans.setAttributeNode(field);
	}
	
	if(animation.running[field] !== undefined) {
		if (animation.running[field].timer)
		{
			org.xml3d.debug.logWarning("Animation already running");
		}
		else
		{
			// We start from the beginning when animation is restarted
			animation.running[field].duration = duration;
			animation.running[field].loop = loop;
			animation.running[field].startTime = (new Date()).getTime();
			animation.running[field].timer = window.setInterval(function() { animation.progress(field); }, 50);
		}
		return animation.running[field];
	}
	
	animation.running[field] = {};
	animation.running[field].duration = duration;
	animation.running[field].loop = loop;
	animation.running[field].startTime = (new Date()).getTime();
	animation.running[field].timer = window.setInterval(function() { animation.progress(field); }, 50);
	
	return animation.running[field];
};

org.xml3d.animation.XML3DAnimationManager.prototype.stopAnimation = function(handle) 
{
	if (handle === undefined || handle == null 
			|| handle.timer === undefined)
	{
		org.xml3d.debug.logError("XML3DAnimationManager::stopAnimation: Not a vaild animation handle");
		return;
	}
	if (handle.timer)
	{
		window.clearInterval(handle.timer);
		handle.timer = null;
	}
};

/*org.xml3d.animation.XML3DAnimationManager.prototype.startAnimation = function(aniID) {
	if(this.animations[aniID] === undefined)
	{
		org.xml3d.debug.logWarning("Unknown Animation: " + aniID);
		return;
	}
	if (!this.animations[aniID].inode.hasAttribute("target"))
	{
		org.xml3d.debug.logWarning("No target found for Animation: " + aniID);
		return;
	}
	
	var xpath = this.animations[aniID].inode.getAttribute("target");
	var document = this.document.parentDocument;
	
	org.xml3d.debug.logWarning(xpath);
	
	var node = document.evaluate(xpath, document, function() {
		return org.xml3d.xml3dNS;
	}, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
	
	alert(node);
};*/
org.xml3d.x3dNS = 'http://www.web3d.org/specifications/x3d-namespace';
org.xml3d.xml3dNS = 'http://www.w3.org/2009/xml3d';

/**
 * Class to use X3D OrientationInterpolator nodes in Xml3d
 * 
 * @param inode
 *            node id of OrientationInterpolator element in X3D namespace
 * @param tnode
 *            node id of transform element in Xml3D namespace
 * @param tfield
 *            target field of interpolation, must be 'rotation' or
 *            'scaleOrientation'
 */
org.xml3d.animation.X3DOrientationInterpolation = function(inode) {
	this.inode = inode;
	this.running = {};
//	this.tnodeId = tnode;
//	this.tnode = null;
//	if (tfield != "rotation" && tfield != "scaleOrientation")
//		throw "InvalidFieldException";
//	this.tfield = tfield;
	this.isInit = false;
	this.valid = false;
};

org.xml3d.animation.X3DOrientationInterpolation.prototype.isValid = function() {
	if (!this.isInit)
		this.initialize();
	return this.valid;
};

org.xml3d.animation.X3DOrientationInterpolation.prototype.initialize = function() {
	this.isInit = true;
	this.valid = false;

	this.keyValue = org.xml3d.dataTypes.MFRotation.parse(this.inode.getAttribute('keyValue'));
	var keyStr =  this.inode.getAttribute('key').replace(/^\s\s*/, '').replace(/\s\s*$/, '');
	this.key = Array.map(keyStr.split(/[\s+,]/), function(n) {
		return +n;
	});
	if (this.keyValue.length != this.key.length)
	{
		org.xml3d.debug.logWarning("Key size and Value size differ. Keys: " + this.key.length + " Values: " + this.keyValue.length);
		return;
	}
	this.valid = true;
};

org.xml3d.animation.X3DOrientationInterpolation.prototype.progress = function(field) {
	var anim = this.running[field];
	var time = (new Date()).getTime();
	
	var key = ((time - anim.startTime) % anim.duration ) / (anim.duration * 1.0);
	if(!anim.loop && (time - anim.startTime > anim.duration) )
	{
		key = 1.0
		window.clearInterval(anim.timer);
		anim.timer = null;
	}
	
	field.nodeValue = this.getValue( key ).join(' ');
};

org.xml3d.animation.X3DOrientationInterpolation.prototype.getValue = function(t) {
	var value = this.interpolate(t, function(a, b, t) {
		return a.slerp(b, t);
	});
	//org.xml3d.debug.logWarning(value.toAxisAngle() instanceof Array);
	return value.toAxisAngle();
};

org.xml3d.animation.X3DOrientationInterpolation.prototype.interpolate = function(t,
		interp) {
	if (t <= this.key[0])
		return this.keyValue[0];
	if (t >= this.key[this.key.length - 1])
		return this.keyValue[this.key.length - 1];
	for ( var i = 0; i < this.key.length - 1; ++i)
		if (this.key[i] < t && t <= this.key[i + 1]) {
			return interp(this.keyValue[i], this.keyValue[i + 1],
					(t - this.key[i]) / (this.key[i + 1] - this.key[i]));
		}
};



