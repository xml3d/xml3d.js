(function(){

function fetch(result, value, index, components){
    for(var i = 0; i < index.length; ++i) {
        var offset = index[i] * components;
        var j = components;
        while(j--) {
            result[i*components + j] = value[offset + j];
        }
    }
}

Xflow.registerOperator("xflow.get", {
    outputs: [  {type: 'float', name: 'result'}],
    params:  [  {type: 'float', source: 'value', array: true},
                {type: 'int', source: 'index'}],
    evaluate: function(result, value, index, info) {
        fetch(result, value, index, 1);
    }
});

Xflow.registerOperator("xflow.get", {
    outputs: [  {type: 'float2', name: 'result'}],
    params:  [  {type: 'float2', source: 'value', array: true},
                {type: 'int', source: 'index'}],
    evaluate: function(result, value, index, info) {
        fetch(result, value, index, 2);
    }
});

Xflow.registerOperator("xflow.get", {
    outputs: [  {type: 'float3', name: 'result'}],
    params:  [  {type: 'float3', source: 'value', array: true},
                {type: 'int', source: 'index'}],
    evaluate: function(result, value, index, info) {
        fetch(result, value, index, 4);
    }
});


Xflow.registerOperator("xflow.get", {
    outputs: [  {type: 'float4', name: 'result'}],
    params:  [  {type: 'float4', source: 'value', array: true},
                {type: 'int', source: 'index'}],
    evaluate: function(result, value, index, info) {
        fetch(result, value, index, 4);
    }
});

Xflow.registerOperator("xflow.get", {
    outputs: [  {type: 'float4x4', name: 'result'}],
    params:  [  {type: 'float4x4', source: 'value', array: true},
                {type: 'int', source: 'index'}],
    evaluate: function(result, value, index, info) {
        fetch(result, value, index, 16);
    }
});


Xflow.registerOperator("xflow.get", {
    outputs: [  {type: 'int', name: 'result'}],
    params:  [  {type: 'int', source: 'value', array: true},
                {type: 'int', source: 'index'}],
    evaluate: function(result, value, index, info) {
        fetch(result, value, index, 1);
    }
});

Xflow.registerOperator("xflow.get", {
    outputs: [  {type: 'bool', name: 'result'}],
    params:  [  {type: 'bool', source: 'value', array: true},
                {type: 'int', source: 'index'}],
    evaluate: function(result, value, index, info) {
        fetch(result, value, index, 1);
    }
});

Xflow.registerOperator("xflow.get", {
    outputs: [  {type: 'byte', name: 'result'}],
    params:  [  {type: 'byte', source: 'value', array: true},
                {type: 'int', source: 'index'}],
    evaluate: function(result, value, index, info) {
        fetch(result, value, index, 1);
    }
});



Xflow.registerOperator("xflow.get", {
    outputs: [  {type: 'ubyte', name: 'result'}],
    params:  [  {type: 'ubyte', source: 'value', array: true},
                {type: 'int', source: 'index'}],
    evaluate: function(result, value, index, info) {
        fetch(result, value, index, 1);
    }
});



})()

