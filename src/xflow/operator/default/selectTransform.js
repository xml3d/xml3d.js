
Xflow.registerOperator("xflow.selectTransform", {
    outputs: [ {type: 'float4x4', name : 'result', customAlloc: true} ],
    params:  [ {type: 'int', source : 'index'},
               {type: 'float4x4', source: 'transform'} ],
    alloc: function(sizes, index, transform) {
        sizes['result'] = 1;
    },
    evaluate: function(result, index, transform) {
        var i = 16 * index[0];
        if (i < transform.length && i+15 < transform.length) {
            result[0] = transform[i+0];
            result[1] = transform[i+1];
            result[2] = transform[i+2];
            result[3] = transform[i+3];
            result[4] = transform[i+4];
            result[5] = transform[i+5];
            result[6] = transform[i+6];
            result[7] = transform[i+7];
            result[8] = transform[i+8];
            result[9] = transform[i+9];
            result[10] = transform[i+10];
            result[11] = transform[i+11];
            result[12] = transform[i+12];
            result[13] = transform[i+13];
            result[14] = transform[i+14];
            result[15] = transform[i+15];
        } else {
            result[0] = 1;
            result[1] = 0;
            result[2] = 0;
            result[3] = 0;
            result[4] = 0;
            result[5] = 1;
            result[6] = 0;
            result[7] = 0;
            result[8] = 0;
            result[9] = 0;
            result[10] = 1;
            result[11] = 0;
            result[12] = 0;
            result[13] = 0;
            result[14] = 0;
            result[15] = 1;
        }
    }
});
