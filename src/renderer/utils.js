// Utility functions
(function() {

    var minmax = new Float32Array(6);

    xml3d.webgl.calculateBoundingBox = function(tArray) {
        var bbox = new XML3DBox();

        if (!tArray || tArray.length < 3)
            return bbox;

        minmax[0] = tArray[0];
        minmax[1] = tArray[1];
        minmax[2] = tArray[2];
        minmax[3] = tArray[0];
        minmax[4] = tArray[1];
        minmax[5] = tArray[2];

        for (var i = 3; i < tArray.length; i += 3) {
            if (tArray[i] < minmax[0])
                minmax[0] = tArray[i];
            if (tArray[i + 1] < minmax[1])
                minmax[1] = tArray[i + 1];
            if (tArray[i + 2] < minmax[2])
                minmax[2] = tArray[i + 2];
            if (tArray[i] > minmax[3])
                minmax[3] = tArray[i];
            if (tArray[i + 1] > minmax[4])
                minmax[4] = tArray[i + 1];
            if (tArray[i + 2] > minmax[5])
                minmax[5] = tArray[i + 2];
        }

        bbox.min.set(minmax[0], minmax[1], minmax[2]);
        bbox.max.set(minmax[3], minmax[4], minmax[5]);
        return bbox;
    };

    var absMat = mat4.create();

    xml3d.webgl.transformAABB = function(bbox, gmatrix) {
        if (bbox.isEmpty())
            return;

        var min = bbox.min._data;
        var max = bbox.max._data;

        var center = vec3.scale(vec3.add(min, max, vec3.create()), 0.5);
        var extend = vec3.scale(vec3.subtract(max, min, vec3.create()), 0.5);

        mat4.toRotationMat(gmatrix, absMat);
        for (var i = 0; i < 16; i++) {
            absMat[i] = Math.abs(absMat[i]);
        }
        mat4.multiplyVec3(absMat, extend);
        mat4.multiplyVec3(gmatrix, center);

        vec3.add(center, extend, bbox.max._data);
        vec3.subtract(center, extend, bbox.min._data);
    };

})();
