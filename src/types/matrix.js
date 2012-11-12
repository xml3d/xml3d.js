// matrix.js
(function(isNative) {
    
    if(isNative) return;

    /**
     * Configure array properties
     * @private
     * @this {XML3DMatrix}
     * @param {number} index Array index
     */
    function prop(index) {
        return {
            get : function() {
                return this._data[index];
            },
            set : function(val) {
                this._data[index] = val;
                if (this._callback)
                    this._callback(this);
            },
            configurable : false,
            enumerable : false
        };
    }
    ;

    /**
     * Creates an instance of XML3DMatrix. XML3DMatrix represents a represents a
     * 4x4 homogeneous matrix.
     * @constructor
     * @param {number=} m11 Represents the value in the 1st column of the 1st
     *            row.
     * @param {number=} m12 Represents the value in the 2st column of the 1st
     *            row.
     * @param {number=} m13 Represents the value in the 3st column of the 1st
     *            row.
     * @param {number=} m14 Represents the value in the 4st column of the 1st
     *            row.
     * @param {number=} m21 Represents the value in the 1st column of the 2st
     *            row.
     * @param {number=} m22 Represents the value in the 2st column of the 2st
     *            row.
     * @param {number=} m23 Represents the value in the 3st column of the 2st
     *            row.
     * @param {number=} m24 Represents the value in the 4st column of the 2st
     *            row.
     * @param {number=} m31 Represents the value in the 1st column of the 3st
     *            row.
     * @param {number=} m32 Represents the value in the 2st column of the 3st
     *            row.
     * @param {number=} m33 Represents the value in the 3st column of the 3st
     *            row.
     * @param {number=} m34 Represents the value in the 4st column of the 3st
     *            row.
     * @param {number=} m41 Represents the value in the 1st column of the 4st
     *            row.
     * @param {number=} m42 Represents the value in the 2st column of the 4st
     *            row.
     * @param {number=} m43 Represents the value in the 3st column of the 4st
     *            row.
     * @param {number=} m44 Represents the value in the 4st column of the 4st
     *            row.
     */
    var XML3DMatrix = function(m11, m12, m13, m14, m21, m22, m23, m24, m31,
            m32, m33, m34, m41, m42, m43, m44, cb) {
        /** @private */
        if (typeof m11 == 'number' && arguments.length >= 16) {
            this._data = new Float32Array(arguments);
            this._callback = typeof cb == 'function' ? cb : 0;
        } else if (typeof m11 == 'object' && arguments.length == 1) {
            this._data = new Float32Array(m11._data);
        } else{
            this._data = new Float32Array( [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
                    0, 0, 0, 0, 1 ]);
            this._callback = typeof m11 == 'function' ? m11 : 0;
        }
    };
    var p = XML3DMatrix.prototype;

    /** @type {number} */
    Object.defineProperty(p, "m11", prop(0));
    /** @type {number} */
    Object.defineProperty(p, "m12", prop(1));
    /** @type {number} */
    Object.defineProperty(p, "m13", prop(2));
    /** @type {number} */
    Object.defineProperty(p, "m14", prop(3));
    /** @type {number} */
    Object.defineProperty(p, "m21", prop(4));
    /** @type {number} */
    Object.defineProperty(p, "m22", prop(5));
    /** @type {number} */
    Object.defineProperty(p, "m23", prop(6));
    /** @type {number} */
    Object.defineProperty(p, "m24", prop(7));
    /** @type {number} */
    Object.defineProperty(p, "m31", prop(8));
    /** @type {number} */
    Object.defineProperty(p, "m32", prop(9));
    /** @type {number} */
    Object.defineProperty(p, "m33", prop(10));
    /** @type {number} */
    Object.defineProperty(p, "m34", prop(11));
    /** @type {number} */
    Object.defineProperty(p, "m41", prop(12));
    /** @type {number} */
    Object.defineProperty(p, "m42", prop(13));
    /** @type {number} */
    Object.defineProperty(p, "m43", prop(14));
    /** @type {number} */
    Object.defineProperty(p, "m44", prop(15));

    /**
     * String representation of the XML3DBox.
     * @override
     * @return {string} Human-readable representation of this XML3DBox.
     */
    p.toString = function() {
        return "[object XML3DMatrix]";
    };

    p.setMatrixValue = function(str) {
        var m = /^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)$/
                .exec(str);

        if (!m)
            throw {
                code : DOMException.SYNTAX_ERR,
                message : "SYNTAX_ERR: DOM Exception 12"
            };

        if (m.length != 17) // m[0] is the whole string, the rest is the actual
            // result
            throw {
                code : DOMException.SYNTAX_ERR,
                message : "Illegal number of elements: " + (m.length - 1)
                        + "expected: 16"
            };

        this._data = new Float32Array(m.slice(1));
        if (this._callback)
            this._callback(this);
    };

    /**
     * Multiply returns a new construct which is the result of this matrix
     * multiplied by the argument which can be any of: XML3DMatrix, XML3DVec3,
     * XML3DRotation. This matrix is not modified.
     * @param {XML3DMatrix} secondMatrix Matrix to multiply with
     * @return {XML3DMatrix} New matrix with the result
     */
    p.multiply = function(secondMatrix) {
        var result = new XML3DMatrix();
        mat4.multiply(this._data, secondMatrix._data, result._data);
        return result;
    };

    /**
     * Inverse returns a new matrix which is the inverse of this matrix. This
     * matrix is not modified.
     * @return {XML3DMatrix} Inverted matrix
     * @throws DOMException when the matrix cannot be inverted.
     */
    p.inverse = function() {
        var result = new XML3DMatrix();
        mat4.inverse(this._data, result._data);
        if (isNaN(result._data[0]))
            throw new Error("Trying to invert matrix that is not invertable.");
        return result;
    };

    /**
     * This method returns a new matrix which is this matrix multiplied by each
     * of 3 rotations about the major axes. If the y and z components are
     * undefined, the x value is used to rotate the object about the z axis.
     * Rotation values are in RADIANS. This matrix is not modified.
     *
     * @returns {XML3DMatrix} new rotated matrix
     */
    p.rotate = function(rotX, rotY, rotZ) {
        var r = new XML3DMatrix();
        if(rotY === undefined && rotZ === undefined) {
            mat4.rotateZ(this._data, rotX, r._data);
            return r;    
        }
        mat4.rotateZ(this._data, rotZ, r._data);
        mat4.rotateY(r._data, rotY);
        mat4.rotateX(r._data, rotX);
        return r;
    };

    /**
     * RotateAxisAngle returns a new matrix which is this matrix multiplied by a
     * rotation matrix with the given XML3DRotation. This matrix is not
     * modified.
     *
     * @param {number} x x-component of the rotation axis
     * @param {number} y y-component of the rotation axis
     * @param {number} z z-component of the rotation axis
     * @param {number} angle angle in radians
     * @returns {XML3DMatrix} The result of the rotation in a new matrix
     */
    p.rotateAxisAngle = function(x, y, z, angle) {
        var result = new XML3DMatrix();
        mat4.rotate(this._data, angle, [ x, y, z ], result._data);
        return result;
    };

    /**
     * Scale returns a new matrix which is this matrix multiplied by a scale
     * matrix containing the passed values. If the z component is undefined a 1
     * is used in its place. If the y component is undefined the x component
     * value is used in its place. This matrix is not modified.
     *
     * @param {number} scaleX scale factor in x direction
     * @param {number=} scaleY scale factor in y direction. Optional. If
     *            undefined the scaleX value is used in its place
     * @param {number=} scaleZ scale factor in z direction. Optional. If
     *            undefined 1 is used.
     * @returns {XML3DMatrix} The result of the rotation in a new matrix
     */
    p.scale = function(scaleX, scaleY, scaleZ) {
        var result = new XML3DMatrix();
        if (!scaleZ)
            scaleZ = 1;
        if (!scaleY)
            scaleY = scaleX;
        mat4.scale(this._data, [ scaleX, scaleY, scaleZ ], result._data);
        return result;
    };

    /**
     * Translate returns a new matrix which is this matrix multiplied by a
     * translation matrix containing the passed values. This matrix is not
     * modified.
     * @param {number} x Translation in x direction
     * @param {number} y Translation in y direction
     * @param {number} z Translation in z direction
     * @returns {XML3DMatrix} The (new) resulting matrix
      */
    p.translate = function(x, y, z) {
        var result = new XML3DMatrix();
        mat4.translate(this._data, [x,y,z], result._data);
        return result;
    };

    XML3D.XML3DMatrix = XML3DMatrix;
    if (!window.XML3DMatrix)
        window.XML3DMatrix = XML3DMatrix;

}(XML3D._native));
