(function() {
    var TMP_MATRIX = XML3D.math.mat4.create();
    var TMP_VEC = XML3D.math.vec3.create();
    var TMP_QUAT = XML3D.math.quat.create();
    var mat4 = XML3D.math.mat4;
    var quat = XML3D.math.quat;

    Xflow.registerOperator("xflow.createTransform", {
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
                translation && mat4.translate(dest, dest, info.iterFlag[0] ? translation.subarray(i*3) : translation);
                center && mat4.translate(dest, dest, info.iterFlag[3] ? center.subarray(i*3) : center);
                if (rotation) {
                    mat4.fromQuat(TMP_MATRIX, info.iterFlag[1] ? rotation.subarray(i*4) : rotation);
                    mat4.multiply(dest, dest, TMP_MATRIX);
                }
                if (scale) {
                    if (scaleOrientation) {
                        quat.copy(TMP_QUAT, info.iterFlag[4] ? scaleOrientation.subarray(i*4) : scaleOrientation)
                        mat4.fromQuat(TMP_MATRIX, TMP_QUAT);
                        mat4.multiply(dest, dest, TMP_MATRIX);
                    }
                    mat4.scale(dest, dest, info.iterFlag[2] ? scale.subarray(i * 3) : scale);
                    if (scaleOrientation) {
                        quat.invert(TMP_QUAT, TMP_QUAT);
                        mat4.fromQuat(TMP_MATRIX, TMP_QUAT);
                        mat4.multiply(dest, dest, TMP_MATRIX);
                    }
                }

                center && mat4.translate(dest, dest, XML3D.math.vec3.negate(TMP_VEC, info.iterFlag[3] ? center.subarray(i*3) : center));

            }
            return true;
        }
    });

})();