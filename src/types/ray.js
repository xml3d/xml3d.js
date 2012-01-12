// XML3DRay

new (function() {
    /** returns an XML3DRay that has an origin and a direction.
    * 
    * If the arguments are not given, the ray's origin is (0,0,0) and 
    * points down the negative z-axis.  
    *   
    *  @param {XML3DVec3=} origin (optional) the origin of the ray
    *  @param {XML3DVec3=} direction (optional) the direction of the ray   
    */
    var XML3DRay = function(origin, direction,cb) 
    {
        var that = this;

        /** @private **/
        this._callback = typeof cb == 'function' ? cb : 0;

        var vec_cb = function() { if(that._callback) that._callback(that); };
        /** @private */
        this._origin = origin ? new XML3DVec3(origin.x, origin.y, origin.z, vec_cb)
                : new XML3DVec3(0, 0, 0, vec_cb);
        /** @private */
        this._direction = direction ? new XML3DVec3(direction.x, direction.y, direction.z, vec_cb)
                : new XML3DVec3(0, 0, -1, vec_cb);
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

    // Export
    org.xml3d.XML3DRay = XML3DRay;
    if (!window.XML3DRay)
        window.XML3DRay = XML3DRay;

})();
