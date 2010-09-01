//Check, if basics have already been defined
var org;
if (!org || !org.xml3d)
  throw new Error("xml3d.js has to be included first");

//Create global symbol org.xml3d.animation
if (!org.xml3d.animation)
	org.xml3d.animation = {};
else if (typeof org.xml3d.animation != "object")
	throw new Error("org.xml3d.animation already exists and is not an object");

(function() {
	var load = function() {
			org.xml3d.debug.logInfo("Initializing Animation Manager.");
			org.xml3d.animation.animationManager = new org.xml3d.animation.XML3DAnimationManager();
			org.xml3d.animation.animationManager.init();
	};
	window.addEventListener('load', load, false);
	
})();

org.xml3d.startAnimation = function(aniID, transID, transAttr, duration, loop)
{
	return org.xml3d.animation.animationManager.startAnimation(aniID, transID, transAttr, duration, loop);
};

org.xml3d.stopAnimation = function(handle)
{
	org.xml3d.animation.animationManager.stopAnimation(handle);
};

org.xml3d.stopAllAnimations = function() 
{
	org.xml3d.animation.animationManager.stopAllAnimations();
};

org.xml3d.animation.XML3DAnimationManager = function() {
	this.interpolators = {};
	var xml3d = document.evaluate('//xml3d:xml3d', document, function() {
		return org.xml3d.xml3dNS;
	}, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
	
	if (xml3d && xml3d.update)
		this.updateElement = xml3d;

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
	window.setInterval(function() { a.progress(); }, 30);
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
	var trans = document.getElementById(transID);
	if (!trans)
	{
		org.xml3d.debug.logWarning("Could not find animation target: " + transID);
		return;
	}
	
	var field = trans.getAttributeNode(transAttr);
	if (!field)
	{
		field = document.createAttribute(transAttr);
		field.nodeValue = "";
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
	interpolator.animations[field].node = trans;
	interpolator.animations[field].attribute = transAttr;
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
	if(this.updateElement)
		this.updateElement.update();
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
	anim.node[anim.attribute] = this.getValue( key );
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
		return a.interpolate(b, t);
	});
	return value;
};

org.xml3d.animation.X3DOrientationInterpolation.prototype.initialize = function() {
	this.isInit = true;
	this.valid = false;

	this.keyValue = org.xml3d.animation.RotationArray.parse(this.inode.getAttribute('keyValue'));
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
	return value;
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

org.xml3d.animation.RotationArray = function(rotArray) {
	if (arguments.length == 0) {
	} else {
		rotArray.map(function(v) {
			this.push(v);
		}, this);
	}
};
org.xml3d.animation.RotationArray.prototype = new Array;
org.xml3d.animation.RotationArray.parse = function(str) {
	var mc = str.match(/([+-]?\d*\.?\d*\s*){4},?\s*/g);
	var vecs = [];
	for ( var i = 0; i < mc.length; ++i) {
		for ( var i = 0; i < mc.length; ++i) {
			var c = /^([+-]?\d*\.*\d*)\s*,?\s*([+-]?\d*\.*\d*)\s*,?\s*([+-]?\d*\.*\d*),?\s*([+-]?\d*\.*\d*),?\s*$/
					.exec(mc[i]);
			if (c && c[0])
			{
				var axis = new XML3DVec3(+c[1], +c[2], +c[3]);
				//org.xml3d.debug.logWarning("Axis: " + axis);
				//org.xml3d.debug.logWarning("Angle: " + +c[4]);
				var rot = new XML3DRotation(axis, +c[4]);
				//org.xml3d.debug.logWarning("Axis: " + rot.axis);
				//org.xml3d.debug.logWarning("Angle: " + rot.angle);
				vecs.push(rot);
			}
		}
//		if (mc[i]) {
//			var r = new XML3DRotation();
//			org.xml3d.debug.logWarning(mc[i]);
//			r.setAxisAngleValue(mc[i]);
//			vecs.push(r);
//		}
	}
	
	return new org.xml3d.animation.RotationArray(vecs);
};


if (!XML3DRotation.prototype.slerp) {

	org.xml3d.Quaternion = function(axis, angle) {
		this.x = axis.x * s;
		this.y = axis.y * s;
		this.z = axis.z * s;
		this.w = c;
	};
	
	org.xml3d.Quaternion.prototype.__defineGetter__("axis", function() {
		var s = Math.sqrt(1 - this.w * this.w);
		if (s < 0.001) {
			return new XML3DVec3(0, 0, 1);
		}
		return new XML3DVec3(this.x / s, this.y / s, this.z / s);
	});

	org.xml3d.Quaternion.prototype.__defineGetter__("angle", function() {
		var angle = 2 * Math.acos(this.w);
		var s = Math.sqrt(1 - this.w * this.w);
		if (s < 0.001) {
			return 0.0;
		}
		return angle;
	});
	
	org.xml3d.Quaternion.prototype.slerp = function(that, t) {
		var cosom = this.x * that.x + this.y * that.y + this.z * that.z + this.w * that.w;
		var rot1;
		if (cosom < 0.0) {
			cosom = -cosom;
			rot1 = that.negate();
		} else {
			rot1 = new XML3DRotation(that.x, that.y, that.z,
					that.w);
		}
		var scalerot0, scalerot1;
		if ((1.0 - cosom) > 0.00001) {
			var omega = Math.acos(cosom);
			var sinom = Math.sin(omega);
			scalerot0 = Math.sin((1.0 - t) * omega) / sinom;
			scalerot1 = Math.sin(t * omega) / sinom;
		} else {
			scalerot0 = 1.0 - t;
			scalerot1 = t;
		}
		return this.multScalar(scalerot0).add(rot1.multScalar(scalerot1));	
	};
	
	XML3DRotation.prototype.slerp = function(that, t) {
		var q1 = new org.xml3d.Quaternion(this.axis, this.angle);
		var q2 = new org.xml3d.Quaternion(that.axis, that.angle);
		var q3 = q1.slerp(q2, t);
		return new XML3DRotation(q3.axis, q3.angle);
	};
}

