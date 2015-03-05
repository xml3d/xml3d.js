Xflow.registerOperator("xflow.add6", {
    outputs: [  {type: 'float3', name: 'result'}],
    params:  [  {type: 'float3', source: 'value1'},
                {type: 'float3', source: 'value2'}],
    evaluate: function(result, value1, value2, info) {
        throw new Error("Not used!");
    },
    evaluate_core: function(result, value1, value2){
        result[0] = value1[0] + value2[0];
        result[1] = value1[1] + value2[1];
        result[2] = value1[2] + value2[2];
    }
});
