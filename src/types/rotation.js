// rotation.js
(function(isNative) {

    if(isNative) return;

    function orthogonal(v) {
        if ((Math.abs(v._data[1]) >= 0.9*Math.abs(v._data[0])) && (Math.abs(v._data[2]) >= 0.9*Math.abs(v._data[0])))
            return new window.XML3DVec3(0.0, -v._data[2], v._data[1]);
          else
            if ((Math.abs(v._data[0]) >= 0.9*Math.abs(v._data[1])) && (Math.abs(v._data[2]) >= 0.9*Math.abs(v._data[1])))
              return new window.XML3DVec3(-v._data[2], 0.0, v._data[0]);
            else
              return new window.XML3DVec3(-v._data[1], v._data[0], 0.0);
    }

    /**
     * Creates an instance of XML3DRotation. XML3DRotation represents a
     * three-dimensional vector as a 3-tuple floating point values.
     * @constructor
     * @this {XML3DRotation}
     * @param {XML3DVec3=} axis
     * @param {number=} angle
     * @param {function(XML3DVec3=)=} cb Called, if value has changed.
     *                                   Has this as first parameter.
     */
    var XML3DRotation = function(axis, angle, cb) {
        var that = this;
        this._data = new Float32Array(4);

        var vec_cb = function() {
            that._updateQuaternion();
            if (that._callback)
                that._callback(that);
        };

        /** @private */
        this._axis = new window.XML3DVec3(0, 0, 1, vec_cb);
        /** @private */
        this._angle = 0;

        this._updateQuaternion();

        if(axis !== undefined && axis !== null) {
            this.set(axis, angle);
        }

        /** @private */
        this._callback = typeof cb == 'function' ? cb : 0;
    };

    var p = XML3DRotation.prototype;

    /**
     * The set method copies the values from other.
     * @param {Object} other another XML3DRotation, Float32Array or XML3DVec3. In the last case the 2nd argument is considered.
     * @param {number=} angle
     */
    p.set = function(other, angle) {
        if(other.constructor === window.XML3DRotation) {
            this.setAxisAngle(other.axis, other.angle);
        } else if(other.constructor === Float32Array) {
            this._setQuaternion(other);
        } else if(other.constructor === window.XML3DVec3) {
            this.setAxisAngle(other, angle);
        } else {
            XML3D.debug.logError("XML3DRotation.set(): invalid argument given. Expect XML3DRotation or Float32Array.");
        }
    };

    /** @type {number} */
    Object.defineProperty(p, "axis", {
        /** @this {XML3DRotation} * */
        get : function() {
            return this._axis;
        },
        set : function() {
            throw Error("Can't set axis. XML3DRotation::axis is readonly.");
        },
        configurable : false,
        enumerable : false
    });

    /** @type {number} */
    Object.defineProperty(p, "angle", {
        /** @this {XML3DRotation} * */
        get : function() {
            return this._angle;
        },
        set : function(angle) {
            this._angle = angle;
            this._updateQuaternion();
            if (this._callback)
                this._callback(this);
    },
    configurable : false,
    enumerable : false
    });

    /**
     * String representation of the XML3DRotation.
     * @override
     * @this {XML3DRotation}
     * @return {string} Human-readable representation of this XML3DRotation.
     */
    p.toString = function() {
        return "[object XML3DRotation]";
    };

    /**
     * Replaces the existing rotation with the axis-angle representation passed
     * as argument
     */
    p.setAxisAngle = function(axis, angle) {
        if (typeof axis != 'object' || isNaN(angle)) {
            throw new Error("Illegal axis and/or angle values: " + "( axis="
                    + axis + " angle=" + angle + " )");
        }

        // TODO: slice?
        this._axis._data[0] = axis._data[0];
        this._axis._data[1] = axis._data[1];
        this._axis._data[2] = axis._data[2];
        this._angle = angle;
        this._updateQuaternion();
        if (this._callback)
            this._callback(this);
    };

    /**
     * Replaces the existing rotation with one computed from the two vectors
     * passed as arguments. {XML3DVec} from First vector {XML3DVec} from Second
     * vector
     */
    p.setRotation = function(from, to) {
        var a = from.normalize();
        var b = to.normalize();

        var axis = a.cross(b);
        if (!axis.length()) {
            // from and to are parallel
            axis = orthogonal(a);
        };
        // This function will also callback
        this.setAxisAngle(axis, Math.acos(a.dot(b)));
    };

    p._updateQuaternion = function() {
        var l = this._axis.length();
        if (l > 0.00001) {
            var s = Math.sin(this._angle / 2) / l;
            this._data[0] = this._axis.x * s;
            this._data[1] = this._axis.y * s;
            this._data[2] = this._axis.z * s;
            this._data[3] = Math.cos(this._angle / 2);
        } else {
            XML3D.math.quat.set(this._data, 0, 0, 0, 1);
        }
    };

    /**
     * Replaces the existing matrix with one computed from parsing the passed
     * string.
     * @param str String to parse
     */
    p.setAxisAngleValue = function(str) {
        var m = /^\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s*$/.exec(str);
        if (!m)
            throw new Error("Could not parse AxisAngle string: " + str);

        // This function will also callback
        this.setAxisAngle(new window.XML3DVec3(+m[1], +m[2], +m[3]), +m[4]);
    };

    /**
     * Linear interpolation of this rotation rot0 with the passed rotation rot1
     * with factor t. The result is (1-t)rot0 + t rot1. Typically realized with
     * a spherical linear interpolation based on quaternions.
     * @param {XML3DRotation} rot1 the passed rotation
     * @param {number} t the factor
     */
    p.interpolate = function(rot1, t) {
        var dest = XML3D.math.quat.create(), result = new XML3DRotation();
        XML3D.math.quat.slerp(dest, this._data, rot1._data, t);
        result._setQuaternion(dest);
        return result;
    };

    /**
     * Replaces the existing rotation with the quaternion representation passed
     * as argument
     * @param {XML3DVec3} vector
     * @param {number} w
     */
    p.setQuaternion = function(vector, scalar) {
        this._setQuaternion( [ vector.x, vector.y, vector.z, scalar ]);
    };

    /**
     * Returns a XML3DMatrix that describes this 3D rotation in a
     * 4x4 matrix representation.
     * @return {XML3DMatrix} Rotation matrix
     */
    p.toMatrix = function() {
        var q = XML3D.math.quat.copy(XML3D.math.quat.create(), this._data);
        var m = new window.XML3DMatrix();
        XML3D.math.mat4.fromRotationTranslation(m._data, q, [0, 0, 0]);
        return m;
    };

    /**
     * Rotates the vector passed as parameter with this rotation
     * representation. The result is returned as new vector instance.
     * Neither this nor the inputVector are changed.
     * 4x4 matrix representation.
     * @param {XML3DVec3} inputVector
     * @return {XML3DVec3} The rotated vector
     */
    p.rotateVec3 = function(inputVector) {
        var result = new window.XML3DVec3();
        XML3D.math.vec3.transformQuat(result._data, inputVector._data, this._data)
        return result;
    };

    /**
     * Replaces the existing rotation with the quaternion representation passed
     * as argument
     * @private
     * @param {Array} quat
     */
    p._setQuaternion = function(q) {
        var s = Math.sqrt(1 - q[3] * q[3]);
        if (s < 0.001 || isNaN(s)) {
            this._axis._data[0] = 0;
            this._axis._data[1] = 0;
            this._axis._data[2] = 1;
            this._angle = 0;
        } else {
            s = 1 / s;
            this._axis._data[0] = q[0] * s;
            this._axis._data[1] = q[1] * s;
            this._axis._data[2] = q[2] * s;
            this._angle = 2 * Math.acos(q[3]);
        }
        this._data = XML3D.math.quat.copy(XML3D.math.quat.create(), q);
        if (this._callback)
            this._callback(this);
    };

    /**
     * Multiplies this rotation with the passed rotation. This rotation is not
     * changed.
     *
     * @param {XML3DRotation} rot1
     * @return {XML3DVec3} The result
     */
    p.multiply = function(rot1) {
        var result = new XML3DRotation(), q = XML3D.math.quat.create();
        XML3D.math.quat.multiply(q, this._data, rot1._data);
        result._setQuaternion(q);
        return result;
    };

    /**
     * Returns the normalized version of this rotation. Result is a newly
     * created vector. This is not modified.
     */
    p.normalize = function(that) {
        var na = this._axis.normalize();
        return new XML3DRotation(na, this._angle);
    };

    /**
     * Returns the quaternion, that underlies this rotation.
     *
     * @return {Float32Array}
     */
    p.getQuaternion = function() {
        return XML3D.math.quat.copy(XML3D.math.quat.create(), this._data);
    };

    /**
     * Set this rotation based on the given base vectors.
     *
     * @param {XML3DVec3} xAxis
     * @param {XML3DVec3} yAxis
     * @param {XML3DVec3} zAxis
     */
    p.setFromBasis = function(xAxis, yAxis, zAxis) {
        var q = XML3D.math.quat.create();
        XML3D.math.quat.setFromBasis(xAxis._data, yAxis._data, zAxis._data, q);
        this._setQuaternion(q);
    };

    XML3D.XML3DRotation = XML3DRotation;
    window.XML3DRotation = XML3DRotation;

}(XML3D._native));
