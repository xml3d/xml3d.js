Xflow.registerOperator("xflow.slerpSeq", {
    outputs: [  {type: 'float4', name: 'result'}],
    params:  [  {type: 'float4', source: 'sequence'},
                {type: 'float', source: 'key'}],
    mapping: [  {source: 'sequence', sequence: Xflow.SEQUENCE.PREV_BUFFER, keySource: 'key'},
                {source: 'sequence', sequence: Xflow.SEQUENCE.NEXT_BUFFER, keySource: 'key'},
                {source: 'sequence', sequence: Xflow.SEQUENCE.LINEAR_WEIGHT, keySource: 'key'}],
    evaluate: function(result, value1, value2, weight, info) {
        for(var i = 0; i < info.iterateCount; ++i){
            XML3D.math.quat.slerpOffset(  value1,info.iterFlag[0] ? i*4 : 0,
                                          value2,info.iterFlag[1] ? i*4 : 0,
                                          weight[0],
                                          result, i*4, true);
        }
    },

    evaluate_parallel: function(sequence, weight) {
        /*
        var me = this;
        this.result.result = sequence.interpolate(weight[0], function(v1,v2,t) {
            var count = v1.length;
            if (!me.tmp || me.tmp.length != count)
                me.tmp = new Float32Array(count);
            var result = me.tmp;
            for(var i = 0; i < count / 4; i++) {
                var offset = i*4;
                XML3D.math.quat.slerpOffset(v1,v2,offset,t,result, true);
            };
            return result;
        });
        */
        return true;
    }
});


Xflow.registerOperator("xflow.slerpKeys", {
    outputs: [  {type: 'float4', name: 'result'}],
    params:  [  {type: 'float', source: 'keys', array: true},
        {type: 'float4', source: 'values', array: true},
        {type: 'float', source: 'key'}],
    alloc: function(sizes, keys, values, key)
    {
        sizes['result'] = 4;
    },
    evaluate: function(result, keys, values, key) {
        var maxIdx = Math.min(keys.length, Math.floor(values.length / 4));
        var idx = Xflow.utils.binarySearch(keys, key[0], maxIdx);

        if(idx < 0 || idx == maxIdx - 1){
            idx = Math.max(0,idx);
            result[0] = values[4*idx];
            result[1] = values[4*idx+1];
            result[2] = values[4*idx+2];
            result[3] = values[4*idx+3];
        }
        else{
            var weight = (key[0] - keys[idx]) / (keys[idx+1] - keys[idx]);
            XML3D.math.quat.slerpOffset(  values, idx*4,
                values,(idx+1)*4, weight,
                result, 0, true);
        }
    }
});