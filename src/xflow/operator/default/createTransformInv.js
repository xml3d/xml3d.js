(function() {
    var TMP_MATRIX = XML3D.math.mat4.create();
    var TMP_VEC = XML3D.math.vec3.create();

    Xflow.registerOperator("xflow.createTransformInv", {
        outputs: [{type: 'float4x4', name: 'result'}],
        params: [{type: 'float3', source: 'translation', optional: true},
            {type: 'float4', source: 'rotation', optional: true},
            {type: 'float3', source: 'scale', optional: true},
            {type: 'float3', source: 'center', optional: true},
            {type: 'float4', source: 'scaleOrientation', optional: true}],
        evaluate: function (result, translation, rotation, scale, center, scaleOrientation, info) {
            for (var i = 0; i < info.iterateCount; i++) {
                var dest = result.subarray(i * 16);

                center && XML3D.math.mat4.translate(dest, dest, center);

                if (scaleOrientation) {
                    XML3D.math.mat4.fromRotationTranslation(TMP_MATRIX, [scaleOrientation[0], scaleOrientation[1], scaleOrientation[2], scaleOrientation[3]], [0, 0, 0]);
                    XML3D.math.mat4.multiply(dest, dest, TMP_MATRIX);
                }
                scale && XML3D.math.mat4.scale(dest, dest, XML3D.math.vec3.reciprocal(scale, TMP_VEC));
                if (scaleOrientation) {
                    XML3D.math.mat4.fromRotationTranslation(TMP_MATRIX, [scaleOrientation[0], scaleOrientation[1], scaleOrientation[2], -scaleOrientation[3]], [0, 0, 0]);
                    XML3D.math.mat4.multiply(dest, dest, TMP_MATRIX);
                }
                if (rotation) {
                    XML3D.math.mat4.fromRotationTranslation(TMP_MATRIX, [rotation[0], rotation[1], rotation[2], -rotation[3]], [0, 0, 0]);
                    XML3D.math.mat4.multiply(dest, dest, TMP_MATRIX);
                }
                center && XML3D.math.mat4.translate(dest, dest, XML3D.math.vec3.negate(TMP_VEC, center));
                translation && XML3D.math.mat4.translate(dest, dest, XML3D.math.vec3.negate(TMP_VEC, translation));

            }
        }
    });
})();
