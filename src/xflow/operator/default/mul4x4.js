Xflow.registerOperator("xflow.mul", {
    outputs: [  {type: 'float4x4', name: 'result'}],
    params:  [  {type: 'float4x4', source: 'value1'},
                {type: 'float4x4', source: 'value2'}],
    evaluate: function(result, value1, value2, info) {
        for(var i = 0; i < info.iterateCount; i++)
        {
            XML3D.math.mat4.multiplyOffset(result, i*16,
                value1,  info.iterFlag[0] ? i*16 : 0,
                value2, info.iterFlag[1] ? i*16 : 0);
        }
    }
});
