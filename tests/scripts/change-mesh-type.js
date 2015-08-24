Xflow.registerOperator("xflow.selectMeshType", {
    outputs: [  {type: 'string', name: 'result'}],
    params:  [  {type: 'int', source: 'selector'},
                {type: 'string', source: 'value1'},
                {type: 'string', source: 'value2'}],
    evaluate: function(result, selector, value1, value2, info) {
        throw new Error("Not used!");
    },
    evaluate_core: function(result, selector, value1, value2){
        if (selector[0] == 0) {
            result[0] = value1[0];
        } else {
            result[0] = value2[0];
        }
    }
});
