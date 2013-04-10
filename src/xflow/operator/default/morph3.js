Xflow.registerOperator("xflow.morph", {
    outputs: [{type: 'float3', name: 'result'}],
    params:  [
        { type: 'float3', source: 'value' },
        { type: 'float3', source: 'valueAdd'},
        { type: 'float', source: 'weight'}
    ],
    evaluate: function(result, value, valueAdd, weight, info) {
        for(var i = 0; i < info.iterateCount; i++){
            var w = weight[info.iterFlag[2] ? i : 0];
            result[3*i] = value[ info.iterFlag[0] ? 3*i : 0] + w * valueAdd[info.iterFlag[1] ? 3*i : 0];
            result[3*i+1] = value[ info.iterFlag[0] ? 3*i+1 : 1] + w * valueAdd[info.iterFlag[1] ? 3*i+1 : 1];
            result[3*i+2] = value[ info.iterFlag[0] ? 3*i+2 : 2] + w * valueAdd[info.iterFlag[1] ? 3*i+2 : 2];
        }
        return true;
    },
    evaluate_core: function(result, value, valueAdd, weight){
        result[0] = value[0] + weight[0] * valueAdd[0];
        result[1] = value[1] + weight[0] * valueAdd[1];
        result[2] = value[2] + weight[0] * valueAdd[2];
    }
});