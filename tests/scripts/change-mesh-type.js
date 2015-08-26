Xflow.registerOperator("xflow.selectString", {
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

Xflow.registerOperator("xflow.selectStringInArray", {
    outputs: [  {type: 'string', name: 'result'}],
    params:  [  {type: 'int', source: 'selector'},
        {type: 'string', source: 'strings'}],
    evaluate: function(result, selector, value1, info) {
        throw new Error("Not used!");
    },
    evaluate_core: function(result, selector, strings){
        result[0] = strings[selector[0]];
    }
});
