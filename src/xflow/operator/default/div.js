Xflow.registerOperator("xflow.div", {
    outputs: [  {type: 'float', name: 'result'}],
    params:  [  {type: 'float', source: 'value1'},
                {type: 'float', source: 'value2'}],
    evaluate: function(result, value1, value2, info) {
        result[0] = value1[0] / value2[0];
    }

});
