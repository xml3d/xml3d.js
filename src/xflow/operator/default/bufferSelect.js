Xflow.registerOperator("xflow.bufferSelect", {
    outputs: [  {type: 'float3', name: 'result', noAlloc: true}],
    params:  [  {type: 'float3', source: 'trueOption', array: true},
                {type: 'float3', source: 'falseOption', array: true},
                {type: 'bool', source: 'value', array: true}],
    evaluate: function(result, falseOption, trueOption, value) {
        result.assign = value[0] ? trueOption : falseOption;

        return true;
    }
});