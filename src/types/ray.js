// ray.js
(function($) {
    // Is native?
    if($) return;

    /** returns an XML3DRay that has an origin and a direction.
    * 
    * If the arguments are not given, the ray's origin is (0,0,0) and 
    * points down the negative z-axis.  
    *   
    *  @param {XML3DVec3=} origin (optional) the origin of the ray
    *  @param {XML3DVec3=} direction (optional) the direction of the ray   
    */
    var XML3DRay = function(origin, direction, cb) {
        var that = this;

        var vec_cb = function() {
            if (that._callback)
                that._callback(that);
        };

        /** @private */
        this._origin = new XML3DVec3(0, 0, 0, vec_cb);
        this._direction = new XML3DVec3(0, 0, -1, vec_cb);

        if (origin && origin.origin) {
            this.set(origin, direction);
        } else {
            if (origin) {
                this._origin.set(origin);
            }
            if (direction) {
                this._direction.set(direction);
            }
        }
        /** @private * */
        this._callback = typeof cb == 'function' ? cb : 0;

    }, p = XML3DRay.prototype;
    
    /** @type {XML3DVec3} */
    Object.defineProperty(p, "origin", {
        /** @this {XML3DRay} * */
        get : function() { return this._origin; },
        set : function() { throw Error("Can't set axis. XML3DRay::origin is readonly."); },
        configurable : false,
        enumerable : false
    });

    /** @type {XML3DVec3} */
    Object.defineProperty(p, "direction", {
        /** @this {XML3DRay} * */
        get : function() { return this._direction; },
        set : function() { throw Error("Can't set axis. XML3DRay::origin is readonly."); },
        configurable : false,
        enumerable : false
    });
    
    /**
     * The set method copies the values from other.
     * @param {XML3DRay} other The other ray
     */
    p.set = function(other) {
        this._origin.set(other.origin);
        this._direction.set(other.direction);
        if (this._callback)
            this._callback(this);
    };

    /**
     * String representation of the XML3DRay.
     * @override
     * @return {string} Human-readable representation of this XML3DRay.
     */
    p.toString = function() {
        return "[object XML3DRay]";
    };

    // Export
    XML3D.XML3DRay = XML3DRay;
    if (!window.XML3DRay)
        window.XML3DRay = XML3DRay;

}(XML3D._native));
