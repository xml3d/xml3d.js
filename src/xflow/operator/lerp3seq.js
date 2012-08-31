Xflow.registerOperator("lerpSeq", {
    outputs: [{name: 'result', tupleSize: '3'}],
    params:  ['sequence','weight'],
    evaluate: function(sequence, weight) {
        var me = this;
        this.result.result = sequence.interpolate(weight[0], function(v1,v2,t) {
            if (!me.tmp || me.tmp.length != v1.length)
                me.tmp = new Float32Array(v1.length);
            var result = me.tmp;
            var it = 1.0 - t;
            for(var i = 0; i < v1.length; i++) {
                result[i] = v1[i] * it + v2[i] * t;
            };
            return result;
        });
        return true;
    },

    evaluate_parallel: function(sequence, weight) {
        var me = this;
        this.result.result = sequence.interpolate(weight[0], function(v1,v2,t) {
            if (!me.tmp || me.tmp.length != v1.length)
                me.tmp = new Float32Array(v1.length);
            var result = me.tmp;
            var it = 1.0 - t;

            for(var i = 0; i < v1.length; i++) {
                result[i] = v1[i] * it + v2[i] * t;
            };
            return result;
        });
        return true;
    }
});