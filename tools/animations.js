//Check, if basics have already been defined
var XML3D = XML3D || {};

//Create global symbol XML3D.animation
if (!XML3D.animation)
    XML3D.animation = {};
else if (typeof XML3D.animation != "object")
    throw new Error("XML3D.animation already exists and is not an object");

// This is quirk required  to run animation manager initalization only after full
// document is loaded and all X3D interpolation elements are accesible.

// Browsers  based  on  Gecko 1.9.2 (e.g. Firefox 3.5) will only execute function
// that is set to timeout in 0 milliseconds exactly after document will be loaded
// or  as  soon  as  possible  if  document is already loaded, thus we can safely
// initalize animation manager. Such browsers can  be checked by testing value of
// document.readyState, which must be undefined.

// Other browsers may execute function  even  before loading  of  the webpage  is
// finished, but they define document.readyState,  which allows us to detech such
// state  and  register event handler, which  will  run  the  initalization after
// document is fully loaded.

setTimeout(function() {
    function initAnimationManager() {
        XML3D.debug.logInfo("Initializing Animation Manager.");
        XML3D.animation.animationManager = new XML3D.animation.XML3DAnimationManager();
        XML3D.animation.animationManager.init();
    };

    if (document.readyState == "complete" || // All major browsers except Gecko 1.9.2 or earlier.
        document.readyState == undefined) // Gecko 1.9.2 or earlier version. Document is guaranteed to be loaded when running this code.
        initAnimationManager();
    else
        window.addEventListener('load', initAnimationManager, false);
}, 0);

XML3D.startAnimation = function(aniID, transID, transAttr, duration, loop)
{
    return XML3D.animation.animationManager.startAnimation(aniID, transID, transAttr, duration, loop);
};

XML3D.stopAnimation = function(handle)
{
    XML3D.animation.animationManager.stopAnimation(handle);
};

XML3D.stopAllAnimations = function()
{
    XML3D.animation.animationManager.stopAllAnimations();
};

XML3D.isAnimationRunning = function(aniId, transId, transAttr)
{
    return XML3D.animation.animationManager.isAnimationRunning(aniId, transId, transAttr);
};

XML3D.animation.XML3DAnimationManager = function() {
    this.interpolators = {};
    var xml3d = document.evaluate('//xml3d:xml3d', document, function() {
        return XML3D.xml3dNS;
    }, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

    if (xml3d && xml3d.update)
        this.updateElement = xml3d;
};

XML3D.animation.XML3DAnimationManager.prototype.init = function() {

    this.updateInterpolators();

    var a = this;

    window.addEventListener("DOMNodeInserted",
        function(evt) { a.onNodeInserted(evt); });
    window.addEventListener("DOMNodeRemoved",
        function(evt) { a.onNodeRemoved(evt); });

    window.setInterval(function() { a.progress(); }, 30);
};

XML3D.animation.XML3DAnimationManager.prototype.addInterpolator = function(pol) {

    var cons = null;
    if(pol.localName === 'OrientationInterpolator')
        cons = XML3D.animation.X3DOrientationInterpolation;
    else if(pol.localName === 'PositionInterpolator')
        cons = XML3D.animation.X3DPositionInterpolation;
    else
        return; // don't support others

    if (pol.hasAttribute('id'))
    {
        if (this.interpolators[pol.getAttribute('id')] == undefined)
        {
            this.interpolators[pol.getAttribute('id')] = new cons(pol);
            var a = this;
            pol.addEventListener("DOMAttrModified",
                    function(evt) { a.onAttrModified(evt); });
        }
    }
};

XML3D.animation.XML3DAnimationManager.prototype.onNodeInserted = function(evt) {

    if(evt.target.namespaceURI !== XML3D.x3dNS)
        return;

    this.addInterpolator(evt.target);
};

XML3D.animation.XML3DAnimationManager.prototype.onNodeRemoved = function(evt) {

    var t = evt.target;
    if(t.namespaceURI !== XML3D.x3dNS)
        return;

    if(t.localName !== 'OrientationInterpolator'
    && t.localName !== 'PositionInterpolator')
        return;

    if(t.hasAttribute('id'))
    {
        if(this.interpolators[t.getAttribute('id')])
        {
            this.interpolators[t.getAttribute('id')] = undefined;
        }
    }
};

XML3D.animation.XML3DAnimationManager.prototype.onAttrModified = function(evt) {

    var t = evt.target;

    // note: no checks, we will always have a valid interpolator

    this.interpolators[t.getAttribute('id')].isInit = false;
};


XML3D.animation.XML3DAnimationManager.prototype.updateInterpolators = function() {
    var ois = document.getElementsByTagNameNS(XML3D.x3dNS, 'OrientationInterpolator');
    for(var i = 0; i < ois.length; i++)
    {
        this.addInterpolator(ois[i]);
    }

    var ois = document.getElementsByTagNameNS(XML3D.x3dNS, 'PositionInterpolator');
    for(var i = 0; i < ois.length; i++)
    {
        this.addInterpolator(ois[i]);
    }
};

XML3D.animation.XML3DAnimationManager.prototype.startAnimation = function(aniID, transID, transAttr, duration, loop) {

    if (duration === undefined)
        duration = 3000;

    if (loop === undefined)
        loop = false;

    if(this.interpolators[aniID] === undefined)
    {
        XML3D.debug.logWarning("Unknown Interpolator: " + aniID);
        return;
    }
    var interpolator = this.interpolators[aniID];
    if (!interpolator.isValid())
    {
        XML3D.debug.logWarning("Could not initialize Interpolator: " + aniID);
        return;
    }
    var trans = document.getElementById(transID);
    if (!trans)
    {
        XML3D.debug.logWarning("Could not find animation target: " + transID);
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
            XML3D.debug.logWarning("Animation already running");
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

XML3D.animation.XML3DAnimationManager.prototype.stopAnimation = function(handle)
{
    if (handle === undefined || handle == null
            || handle.running === undefined)
    {
        XML3D.debug.logError("XML3DAnimationManager::stopAnimation: Not a vaild animation handle");
        return;
    }
    handle.running = false;
};

XML3D.animation.XML3DAnimationManager.prototype.stopAllAnimations = function()
{
    for (var i in this.interpolators)
    {
        for(var j in this.interpolators[i].animations)
            this.interpolators[i].animations[j].running = false;
    }
};

XML3D.animation.XML3DAnimationManager.prototype.progress = function()
{
    var time = (new Date()).getTime();
    for (var i in this.interpolators)
    {
        this.interpolators[i].progressAll(time);
    }
    if(this.updateElement)
        this.updateElement.update();
};



XML3D.animation.XML3DAnimationManager.prototype.isAnimationRunning = function(aniId, transId, transAttr)
{
    var interpolator = this.interpolators[aniId];
    if(!interpolator)
        return false;

    var trans = document.getElementById(transId);
    if(!trans)
        return false;

    var field = trans.getAttributeNode(transAttr);
    if(!field)
        return false;

    if(interpolator.animations[field] === undefined)
        return false;

    if(!interpolator.animations[field].running)
        return false;

    return true;
};


XML3D.x3dNS = 'http://www.web3d.org/specifications/x3d-namespace';
XML3D.xml3dNS = XML3D.xml3dNS || 'http://www.xml3d.org/2009/xml3d';

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
XML3D.animation.X3DInterpolation = function(inode) {
    this.inode = inode;
    this.animations = {};
    this.isInit = false;
    this.valid = false;
};

XML3D.animation.X3DInterpolation.prototype.isValid = function() {
    if (!this.isInit)
        this.initialize();
    return this.valid;
};

XML3D.animation.X3DInterpolation.prototype.progressAll = function(time) {


    for(var i in this.animations)
    {
        if (this.animations[i].running)
            this.progress(this.animations[i], time);
    }
};


XML3D.animation.X3DInterpolation.prototype.progress = function(anim, time) {
    var key = ((time - anim.startTime) % anim.duration ) / (anim.duration * 1.0);
    if(!anim.loop && (time - anim.startTime > anim.duration) )
    {
        key = 1.0;
        anim.running = false;
    }
    if (anim.node[anim.attribute] instanceof XML3DRotation)
        anim.node[anim.attribute].set(this.getValue( key ));
    else if (anim.node[anim.attribute] instanceof XML3DVec3)
        anim.node[anim.attribute].set(this.getValue( key ));
    else
        anim.node[anim.attribute] = this.getValue( key );
};

XML3D.animation.X3DInterpolation.prototype.initialize = function() {};


XML3D.animation.X3DInterpolation.prototype.interpolate = function(t,
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
XML3D.animation.X3DOrientationInterpolation = function(factory, node) {
    XML3D.animation.X3DInterpolation.call(this, factory, node);
};
XML3D.animation.X3DOrientationInterpolation.prototype = new XML3D.animation.X3DInterpolation();
XML3D.animation.X3DOrientationInterpolation.prototype.constructor = XML3D.animation.X3DOrientationInterpolation;

XML3D.animation.X3DOrientationInterpolation.prototype.getValue = function(t) {
    var value = this.interpolate(t, function(a, b, t) {
        return a.interpolate(b, t);
    });
    return value;
};

XML3D.animation.X3DOrientationInterpolation.prototype.initialize = function() {
    this.isInit = true;
    this.valid = false;

    this.keyValue = XML3D.animation.RotationArray.parse(this.inode.getAttribute('keyValue'));
    var keyStr =  this.inode.getAttribute('key').replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    this.key = Array.map(keyStr.split(/[\s+,]/), function(n) {
        return +n;
    });
    if (this.keyValue.length != this.key.length)
    {
        XML3D.debug.logWarning("Key size and Value size differ. Keys: " + this.key.length + " Values: " + this.keyValue.length);
        return;
    }
    this.valid = true;
};

// --------------
// Position
// --------------
XML3D.animation.X3DPositionInterpolation = function(factory, node) {
    XML3D.animation.X3DInterpolation.call(this, factory, node);
};
XML3D.animation.X3DPositionInterpolation.prototype = new XML3D.animation.X3DInterpolation();
XML3D.animation.X3DPositionInterpolation.prototype.constructor = XML3D.animation.X3DPositionInterpolation;

XML3D.animation.X3DPositionInterpolation.prototype.getValue = function(t) {
    var value = this.interpolate(t, function(a, b, t) {
        return a.scale(1.0 - t).add(b.scale(t));
    });
    return value;
};

XML3D.animation.X3DPositionInterpolation.prototype.initialize = function() {
    this.isInit = true;
    this.valid = false;

    this.keyValue = XML3D.animation.Vec3Array.parse(this.inode.getAttribute('keyValue'));
    var keyStr =  this.inode.getAttribute('key').replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    this.key = Array.map(keyStr.split(/[\s+,]/), function(n) {
        return +n;
    });
    if (this.keyValue.length != this.key.length)
    {
        XML3D.debug.logWarning("Key size and Value size differ. Keys: " + this.key.length + " Values: " + this.keyValue.length);
        return;
    }
    this.valid = true;
};

XML3D.animation.Vec3Array = function(vec3Array) {
    if (arguments.length == 0) {
    } else {
        vec3Array.map(function(v) {
            this.push(v);
        }, this);
    }
};
XML3D.animation.Vec3Array.prototype = new Array;
XML3D.animation.Vec3Array.parse = function(str) {
    var mc = str.match(/([+-]?\d*\.?\d*\s*){3},?\s*/g);
    var vecs = [];
    for ( var i = 0; i < mc.length; ++i) {
        var c = /^([+-]?\d*\.*\d*)\s*,?\s*([+-]?\d*\.*\d*)\s*,?\s*([+-]?\d*\.*\d*),?\s*$/
                .exec(mc[i]);
        if (c[0])
        {
            var vec = new XML3DVec3(+c[1],+c[2],+c[3]);
            vecs.push(vec);
        }
    }
    return new XML3D.animation.Vec3Array(vecs);
};

XML3D.animation.RotationArray = function(rotArray) {
    if (arguments.length == 0) {
    } else {
        rotArray.map(function(v) {
            this.push(v);
        }, this);
    }
};
XML3D.animation.RotationArray.prototype = new Array;
XML3D.animation.RotationArray.parse = function(str) {
    var mc = str.match(/([+-]?\d*\.?\d*\s*){4},?\s*/g);
    var vecs = [];
    for ( var i = 0; i < mc.length; ++i) {
        for ( var i = 0; i < mc.length; ++i) {
            var c = /^([+-]?\d*\.*\d*)\s*,?\s*([+-]?\d*\.*\d*)\s*,?\s*([+-]?\d*\.*\d*),?\s*([+-]?\d*\.*\d*),?\s*$/
                    .exec(mc[i]);
            if (c && c[0])
            {
                var axis = new XML3DVec3(+c[1], +c[2], +c[3]);
                //XML3D.debug.logWarning("Axis: " + axis);
                //XML3D.debug.logWarning("Angle: " + +c[4]);
                var rot = new XML3DRotation(axis, +c[4]);
                //XML3D.debug.logWarning("Axis: " + rot.axis);
                //XML3D.debug.logWarning("Angle: " + rot.angle);
                vecs.push(rot);
            }
        }
//        if (mc[i]) {
//            var r = new XML3DRotation();
//            XML3D.debug.logWarning(mc[i]);
//            r.setAxisAngleValue(mc[i]);
//            vecs.push(r);
//        }
    }
    var os ="";
    for(var i = 0; i < vecs.length; i++) {
        var q = vecs[i]._data;
        os += q[3] + " " + q[0] + " " + q[1] + " " + q[2] + " ";
    }

    return new XML3D.animation.RotationArray(vecs);
};


if (!XML3DRotation.prototype.slerp) {

    XML3D.Quaternion = function(axis, angle) {
        this.x = axis.x * s;
        this.y = axis.y * s;
        this.z = axis.z * s;
        this.w = c;
    };

    XML3D.Quaternion.prototype.__defineGetter__("axis", function() {
        var s = Math.sqrt(1 - this.w * this.w);
        if (s < 0.001) {
            return new XML3DVec3(0, 0, 1);
        }
        return new XML3DVec3(this.x / s, this.y / s, this.z / s);
    });

    XML3D.Quaternion.prototype.__defineGetter__("angle", function() {
        var angle = 2 * Math.acos(this.w);
        var s = Math.sqrt(1 - this.w * this.w);
        if (s < 0.001) {
            return 0.0;
        }
        return angle;
    });

    XML3D.Quaternion.prototype.slerp = function(that, t) {
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
        var q1 = new XML3D.Quaternion(this.axis, this.angle);
        var q2 = new XML3D.Quaternion(that.axis, that.angle);
        var q3 = q1.slerp(q2, t);
        return new XML3DRotation(q3.axis, q3.angle);
    };
}

