Xflow.registerOperator("xflow.createTransform", {
    outputs: [  {type: 'float4x4', name: 'result'}],
    params:  [  {type: 'float3', source: 'translation', optional: true},
                {type: 'float4', source: 'rotation', optional: true},
                {type: 'float3', source: 'scale', optional: true},
                {type: 'float3', source: 'center', optional: true},
                {type: 'float4', source: 'scaleOrientation', optional: true}],
    evaluate: function(result, translation,rotation,scale,center,scaleOrientation, info) {
        for(var i = 0; i < info.iterateCount; i++) {
            XML3D.math.mat4.makeTransformXflow(
                translation ? translation.subarray(info.iterFlag[0] ? i*3 : 0) : null,
                rotation ? rotation.subarray(info.iterFlag[1] ? i*4 : 0) : null,
                scale ? scale.subarray(info.iterFlag[2] ? i*3 : 0) : null,
                center ? center.subarray(info.iterFlag[3] ? i*3 : 0) : null,
                scaleOrientation ? scaleOrientation.subarray(info.iterFlag[4] ? i*4 : 0) : null,
                result.subarray(i*16)
            )
        }
        return true;
    }
});
