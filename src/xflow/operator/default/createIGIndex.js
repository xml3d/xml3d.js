Xflow.registerOperator("createIGIndex", {
    outputs: [  {type: 'int', name: 'index', customAlloc: true },
                {type: 'float2', name: 'igTexCoord'}
             ],
    params:  [  {type: 'int', source: 'vertexCount', optional: false},
                {type: 'texture', source: 'tex'}],
    evaluate: function(index, vertexCount, image, info) {
        console.log(arguments);
        return true;
    }
});