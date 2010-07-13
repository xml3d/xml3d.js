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

org.xml3d.stopAllAnimations = function() 
{
	org.xml3d.document.animationManager.stopAllAnimations();
}

/*org.xml3d.startAnimation = function(aniID)
{
	org.xml3d.document.animationManager.startAnimation(aniID);
};*/


org.xml3d.animation.XML3DAnimationManager = function(document) {
	this.document = document;
	this.interpolators = {};

};

org.xml3d.animation.XML3DAnimationManager.prototype.init = function() {
	var ois = document.getElementsByTagNameNS(org.xml3d.x3dNS, 'OrientationInterpolator');
	for(var i = 0; i < ois.length; i++)
	{
		if (ois[i].hasAttribute('id'))
		{
			this.interpolators[ois[i].getAttribute('id')] = new org.xml3d.animation.X3DOrientationInterpolation(ois[i]);
		}
	}
	var ois = document.getElementsByTagNameNS(org.xml3d.x3dNS, 'PositionInterpolator');
	for(var i = 0; i < ois.length; i++)
	{
		if (ois[i].hasAttribute('id'))
		{
			this.interpolators[ois[i].getAttribute('id')] = new org.xml3d.animation.X3DPositionInterpolation(ois[i]);
		}
	}
	var a = this;
	window.setInterval(function() { a.progress(); }, 20);
};

org.xml3d.animation.XML3DAnimationManager.prototype.startAnimation = function(aniID, transID, transAttr, duration, loop) {
	
	if (duration === undefined)
		duration = 3000;
	
	if (loop === undefined)
		loop = false;
	
	if(this.interpolators[aniID] === undefined)
	{
		org.xml3d.debug.logWarning("Unknown Interpolator: " + aniID);
		return;
	}
	var interpolator = this.interpolators[aniID];
	if (!interpolator.isValid())
	{
		org.xml3d.debug.logWarning("Could not initialize Interpolator: " + aniID);
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
		field.nodeValue = interpolator.getValue(0).join(' ');
		trans.setAttributeNode(field);
	}
	
	if(interpolator.animations[field] !== undefined) {
		if (interpolator.animations[field].running)
		{
			org.xml3d.debug.logWarning("Animation already running");
		}
		else
		{
			// We start from the beginning when animation is restarted
			interpolator.animations[field].duration = duration;
			interpolator.animations[field].loop = loop;
			interpolator.animations[field].startTime = (new Date()).getTime();
			interpolator.animations[field].running = true;
		}
		return interpolator.animations[field];
	}
	
	interpolator.animations[field] = {};
	interpolator.animations[field].field = field;
	interpolator.animations[field].duration = duration;
	interpolator.animations[field].loop = loop;
	interpolator.animations[field].startTime = (new Date()).getTime();
	interpolator.animations[field].running = true;
	
	return interpolator.animations[field];
};

org.xml3d.animation.XML3DAnimationManager.prototype.stopAnimation = function(handle) 
{
	if (handle === undefined || handle == null 
			|| handle.running === undefined)
	{
		org.xml3d.debug.logError("XML3DAnimationManager::stopAnimation: Not a vaild animation handle");
		return;
	}
	handle.running = false;
};

org.xml3d.animation.XML3DAnimationManager.prototype.stopAllAnimations = function() 
{
	for (var i in this.interpolators)
	{
		for(var j in this.interpolators[i].animations)
			this.interpolators[i].animations[j].running = false;
	}
};

org.xml3d.animation.XML3DAnimationManager.prototype.progress = function() 
{
	var time = (new Date()).getTime();
	for (var i in this.interpolators)
	{
		this.interpolators[i].progressAll(time);
	}
};


org.xml3d.x3dNS = 'http://www.web3d.org/specifications/x3d-namespace';
org.xml3d.xml3dNS = 'http://www.xml3d.org/2009/xml3d';

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
org.xml3d.animation.X3DInterpolation = function(inode) {
	this.inode = inode;
	this.animations = {};
	this.isInit = false;
	this.valid = false;
};

org.xml3d.animation.X3DInterpolation.prototype.isValid = function() {
	if (!this.isInit)
		this.initialize();
	return this.valid;
};

org.xml3d.animation.X3DInterpolation.prototype.progressAll = function(time) {
	for(var i in this.animations)
	{
		if (this.animations[i].running)
			this.progress(this.animations[i], time);
	}
};


org.xml3d.animation.X3DInterpolation.prototype.progress = function(anim, time) {
	
	var key = ((time - anim.startTime) % anim.duration ) / (anim.duration * 1.0);
	if(!anim.loop && (time - anim.startTime > anim.duration) )
	{
		key = 1.0;
		anim.running = false;
	}
	
	anim.field.nodeValue = this.getValue( key ).join(' ');
};

org.xml3d.animation.X3DInterpolation.prototype.initialize = function() {};


org.xml3d.animation.X3DInterpolation.prototype.interpolate = function(t,
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

// --------------
// Orientation
// --------------
org.xml3d.animation.X3DOrientationInterpolation = function(factory, node) {
	org.xml3d.animation.X3DInterpolation.call(this, factory, node);
};
org.xml3d.animation.X3DOrientationInterpolation.prototype = new org.xml3d.animation.X3DInterpolation();
org.xml3d.animation.X3DOrientationInterpolation.prototype.constructor = org.xml3d.animation.X3DOrientationInterpolation;

org.xml3d.animation.X3DOrientationInterpolation.prototype.getValue = function(t) {
	var value = this.interpolate(t, function(a, b, t) {
		return a.slerp(b, t);
	});
	//org.xml3d.debug.logWarning(value.toAxisAngle() instanceof Array);
	return value.toAxisAngle();
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

// --------------
// Position
// --------------
org.xml3d.animation.X3DPositionInterpolation = function(factory, node) {
	org.xml3d.animation.X3DInterpolation.call(this, factory, node);
};
org.xml3d.animation.X3DPositionInterpolation.prototype = new org.xml3d.animation.X3DInterpolation();
org.xml3d.animation.X3DPositionInterpolation.prototype.constructor = org.xml3d.animation.X3DPositionInterpolation;

org.xml3d.animation.X3DPositionInterpolation.prototype.getValue = function(t) {
	var value = this.interpolate(t, function(a, b, t) {
		return a.scale(1.0 - t).add(b.scale(t));
	});
	//org.xml3d.debug.logWarning(value.toAxisAngle() instanceof Array);
	return [ value.x, value.y, value.z];
};

org.xml3d.animation.X3DPositionInterpolation.prototype.initialize = function() {
	this.isInit = true;
	this.valid = false;

	this.keyValue = org.xml3d.animation.Vec3Array.parse(this.inode.getAttribute('keyValue'));
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

org.xml3d.animation.Vec3Array = function(vec3Array) {
	if (arguments.length == 0) {
	} else {
		vec3Array.map(function(v) {
			this.push(v);
		}, this);
	}
};
org.xml3d.animation.Vec3Array.prototype = new Array;
org.xml3d.animation.Vec3Array.parse = function(str) {
	var mc = str.match(/([+-]?\d*\.?\d*\s*){3},?\s*/g);
	var vecs = [];
	for ( var i = 0; i < mc.length; ++i) {
		var c = /^([+-]?\d*\.*\d*)\s*,?\s*([+-]?\d*\.*\d*)\s*,?\s*([+-]?\d*\.*\d*),?\s*$/
				.exec(mc[i]);
		if (c[0])
		{
			var vec = createXML3DVec3();
			vec.x = +c[1];
			vec.y = +c[2];
			vec.z = +c[3];
			vecs.push(vec);
		}
	}
	return new org.xml3d.animation.Vec3Array(vecs);
};

