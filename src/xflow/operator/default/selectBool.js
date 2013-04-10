Xflow.registerOperator("selectBool", {
    outputs: [ {type: 'bool', name : 'result', customAlloc: true} ],
    params:  [ {type: 'int', source : 'index'},
               {type: 'bool', source: 'value'} ],
    alloc: function(sizes, index, value) {
        sizes['result'] = 1;
    },
    evaluate: function(result, index, value) {
        var i = index[0];
        if (i < value.length) {
            result[0] = value[i];
        } else {
            result[0] = false;
        }
    }
});
