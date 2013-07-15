(function(math){

    /**
     * @class An axis aligned bounding box in the style of glMatrix
     * @name bbox
     */
    var bbox = {};

    /**
     * Creates a new, empty bounding box
     *
     * @returns {bbox} a new empty bounding box
     */
    bbox.create = function() {
        var out = new Float32Array(6);
        out[0] = Number.MAX_VALUE;
        out[1] = Number.MAX_VALUE;
        out[2] = Number.MAX_VALUE;
        out[3] = -Number.MAX_VALUE;
        out[4] = -Number.MAX_VALUE;
        out[5] = -Number.MAX_VALUE;
        return out;
    };

    math.bbox = bbox;


}(XML3D.math));