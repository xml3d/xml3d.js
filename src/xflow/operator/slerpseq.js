Xflow.registerOperator("slerpSeq", {
    outputs: [  {type: 'float4', name: 'result'}],
    params:  [  {type: 'float4', source: 'sequence'},
                {type: 'float', source: 'key'}],
    mapping: [  {source: 'sequence', sequence: Xflow.SEQUENCE.PREV_BUFFER, keySource: 'key'},
                {source: 'sequence', sequence: Xflow.SEQUENCE.NEXT_BUFFER, keySource: 'key'},
                {source: 'sequence', sequence: Xflow.SEQUENCE.LINEAR_WEIGHT, keySource: 'key'}],
    evaluate: function(result, value1, value2, weight, info) {
        for(var i = 0; i < info.iterateCount; ++i){
            quat4.slerpOffset(  value1,info.iterFlag[0] ? i*4 : 0,
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
                quat4.slerpOffset(v1,v2,offset,t,result, true);
            };
            return result;
        });
        */
        return true;
    }
});