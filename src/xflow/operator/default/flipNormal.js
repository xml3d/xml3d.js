var Xflow = require("../operator.js");

Xflow.registerOperator("xflow.flipNormal", {
    outputs: [  {type: 'float3', name: 'result'}],
    params:  [  {type: 'float3', source: 'value'}],
    evaluate: function(result, value, info) {
        for(var i = 0; i<info.iterateCount*3; i++)
            result[i] = -value[i];
    }
});