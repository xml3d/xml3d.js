// XML3DVec3

/** @constructor * */
new (function() {

    /*
     * Configure array properties @private @param {number} index Array index
     */
    function prop(index) {
        return {
            get : function() {
                return this._data[index];
            },
            set : function(val) {
                this._data[index] = val;
                // TODO: notify owner
        },
        configurable : false,
        enumerable : false
        };
    }
    ;

    /**
     * Creates an instance of XML3DVec3. XML3DVec3 represents a
     * three-dimensional vector as a 3-tuple floating point values.
     * @constructor
     * @this {XML3DVec3}
     * @param {number=} x The x value (optional). Default: 0.
     * @param {number=} y The y value (optional). Default: 0.
     * @param {number=} z The z value (optional). Default: 0.
     */
    var XML3DVec3 = function(x, y, z) {
        /** @private */
        this._data = new Float32Array(3);
        this._data[0] = x || 0;
        this._data[1] = y || 0;
        this._data[2] = z || 0;

    };

    /** @type {number} */
    Object.defineProperty(XML3DVec3.prototype, "x", prop(0));
    /** @type {number} */
    Object.defineProperty(XML3DVec3.prototype, "y", prop(1));
    /** @type {number} */
    Object.defineProperty(XML3DVec3.prototype, "z", prop(2));

    /**
     * String representation of the XML3DVec3.
     * @override
     * @this {XML3DVec3}
     * @return {string} Human-readable representation of this XML3DVec3.
     */
    XML3DVec3.prototype.toString = function() {
        return "XML3DVec3(" + this._data[0] + " " + this._data[1] + " "
                + this._data[2] + ")";
    };

    /**
     * Returns the component-wise addition of this vector with a second vector
     * passed as parameter. Result is a newly created vector. This is not
     * modified.
     * @param {XML3DVec3} that The vector to add
     * @return {XML3DVec3} The new vector with the result of the addition
     */
    XML3DVec3.prototype.add = function(that) {
        if (that._data)
            return new XML3DVec3(this._data[0] + that._data[0], this._data[1]
                    + that._data[1], this._data[2] + that._data[2]);
        return new XML3DVec3(this._data[0] + that.x, this._data[1] + that.y,
                this._data[2] + that.z);
    };

    /**
     * Returns the component-wise subtraction of this vector with a second
     * vector passed as parameter. Result is a newly created vector. This is not
     * modified.
     * @param {XML3DVec3} that The vector to subtract
     * @return {XML3DVec3} The new vector with the result of the subtraction
     */
    XML3DVec3.prototype.subtract = function(that) {
        if (that._data)
            return new XML3DVec3(this._data[0] - that._data[0], this._data[1]
                    - that._data[1], this._data[2] - that._data[2]);
        return new XML3DVec3(this._data[0] - that.x, this._data[1] - that.y,
                this._data[2] - that.z);
    };

    /**
     * Returns the length of this vector.
     * @return {number} The length of this vector
     */
    XML3DVec3.prototype.length = function() {
        return Math.sqrt((this._data[0] * this._data[0])
                + (this._data[1] * this._data[1])
                + (this._data[2] * this._data[2]));
    };

    /**
     * The setVec3Value method replaces the existing matrix with one computed
     * from parsing the passed string.
     * @param {XML3DVec3} str The string to parse
     * @throws {Error} If passed string can not be parsed
     */
    XML3DVec3.prototype.setVec3Value = function(str) {
        var m = /^\s*(\S+)\s+(\S+)\s+(\S+)\s*$/.exec(str);
        if (!m) // TODO Throw DOMException
            throw Error("Wrong format for XML3DVec3::setVec3Value");
        this._data[0] = +m[1];
        this._data[1] = +m[2];
        this._data[2] = +m[3];
        // TODO: notify owner
    };

    /**
     * Returns the component-wise multiplication of this vector with a second
     * vector passed as parameter. Result is a newly created vector. This is not
     * modified.
     * @param {XML3DVec3} that The vector to multiply
     * @return {XML3DVec3} The new vector with the result of the multiplication
     */
    XML3DVec3.prototype.multiply = function(that) {
        if (that._data)
            return new XML3DVec3(this._data[0] * that._data[0], this._data[1]
                    * that._data[1], this._data[2] * that._data[2]);
        return new XML3DVec3(this._data[0] * that.x, this._data[1] * that.y,
                this._data[2] * that.z);
    };

    /**
     * Returns the component-wise multiplication of this vector with a factor
     * passed as parameter. Result is a newly created vector. This is not
     * modified.
     * @param {number} fac The factor for the multiplication
     * @return {XML3DVec3} The new and scaled vector
     */
    XML3DVec3.prototype.scale = function(fac) {
        return new XML3DVec3(this._data[0] * n, this._data[1] * n,
                this._data[2] * n);
    };

    /**
     * Returns the cross product of this vector with a second vector passed as
     * parameter. Result is a newly created vector. This is not modified.
     * @param {XML3DVec3} that The second vector
     * @return {XML3DVec3} The new vector with the result of the cross product
     */
    XML3DVec3.prototype.cross = function(that) {
        if (that._data)
            return new XML3DVec3(this._data[1] * that._data[2] - this._data[2]
                    * that._data[1], this._data[2] * that._data[0]
                    - this._data[0] * that._data[2], this._data[0]
                    * that._data[1] - this._data[1] * that._data[0]);

        return new XML3DVec3(this._data[1] * that.z - this._data[2] * that.y,
                this._data[2] * that.x - this._data[0] * that.z, this._data[0]
                        * that.y - this._data[1] * that.x);
    };

    /**
     * Returns the component wise multiplication by -1 of this vector. Result is
     * a newly created vector. This is not modified.
     * @return {XML3DVec3} The new and negated vector
     */
    XML3DVec3.prototype.negate = function() {
        return new XML3DVec3(-this._data[0], -this._data[1], -this._data[2]);
    };

    /**
     * Returns the dot product of this vector with a second vector passed as
     * parameter. This is not modified.
     * @param {XML3DVec3} that The second vector
     * @return {number} The result of the dot product
     */
    XML3DVec3.prototype.dot = function(that) {
        return (this._data[0] * that.x + this._data[1] * that.y + this._data[2]
                * that.z);
    };

    /**
     * Returns the normalized version of this vector. Result is a newly created
     * vector. This is not modified.
     * @return {XML3DVec3} The new and normalized vector
     * @throws {Error} If length of this vector is zero
     */
    XML3DVec3.prototype.normalize = function() {
        var n = this.length();
        if (n)
            n = 1.0 / n;
        else
            throw new Error();

        return new XML3DVec3(this._data[0] * n, this._data[1] * n,
                this._data[2] * n);
    };

    /*
     * XML3DVec3.prototype.toGL = function() { return [ this._data[0],
     * this._data[1], this._data[2] ]; };
     */

    if (!window.XML3DVec3)
        window.XML3DVec3 = XML3DVec3;
});
