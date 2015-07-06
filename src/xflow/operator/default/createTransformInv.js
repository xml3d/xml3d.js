(function() {
    var TMP_MATRIX = XML3D.math.mat4.create();
    var TMP_VEC = XML3D.math.vec3.create();
    var TMP_QUAT = XML3D.math.quat.create();
    var mat4 = XML3D.math.mat4;

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
                mat4.identity(dest);
                center && mat4.translate(dest, dest, info.iterFlag[3] ? center.subarray(i*3) : center);

                if (scaleOrientation) {
                    mat4.fromRotationTranslation(TMP_MATRIX, info.iterFlag[4] ? scaleOrientation.subarray(i*4) : scaleOrientation, [0, 0, 0]);
                    mat4.multiply(dest, dest, TMP_MATRIX);
                }
                scale && mat4.scale(dest, dest, XML3D.math.vec3.reciprocal(TMP_VEC, info.iterFlag[2] ? scale.subarray(i*3) : scale));
                if (scaleOrientation) {
                    XML3D.math.quat.copy(TMP_QUAT, info.iterFlag[4] ? scaleOrientation.subarray(i*4) : scaleOrientation);
                    mat4.fromRotationTranslation(TMP_MATRIX, XML3D.math.quat.invert(TMP_QUAT, TMP_QUAT), [0, 0, 0]);
                    mat4.multiply(dest, dest, TMP_MATRIX);
                }
                if (rotation) {
                    XML3D.math.quat.copy(TMP_QUAT, info.iterFlag[1] ? rotation.subarray(i*4) : rotation);
                    mat4.fromRotationTranslation(TMP_MATRIX, XML3D.math.quat.invert(TMP_QUAT, TMP_QUAT), [0, 0, 0]);
                    mat4.multiply(dest, dest, TMP_MATRIX);
                }
                center && mat4.translate(dest, dest, XML3D.math.vec3.negate(TMP_VEC, info.iterFlag[3] ? center.subarray(i*3) : center));
                translation && mat4.translate(dest, dest, XML3D.math.vec3.negate(TMP_VEC, info.iterFlag[0] ? translation.subarray(i*3) : translation));

            }
        }
    });
})();
