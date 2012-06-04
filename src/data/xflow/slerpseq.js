XML3D.xflow.register("slerpSeq", {
    outputs: [{name: 'result', tupleSize: '3'}],
    params:  ['sequence','weight'],
    evaluate: function(sequence, weight) {
        this.result = sequence.interpolate(weight[0], function(v1,v2,t) {
            var count = v1.length;
            var result = new Float32Array(count);
            for(var i = 0; i < count / 4; i++) {
                var offset = i*4;
                quat4.slerpOffset(v1,v2,offset,t,result, true);
            };
            return result;
        });
        return true;
    },

    evaluate_parallel: function(sequence, weight) {
        var result = sequence.interpolate(weight[0], function(v1,v2,t) {
            var count = v1.length;
            var result = new Float32Array(count);
            //var v2d = v2.data;
           // var v1d = v1.data;
            for(var i = 0; i < count / 4; i++) {
                var offset = i*4;
                quat4.slerpOffset(v1,v2,offset,t,result, true);
            };
            return result;
        });
        this.result = new ParallelArray(result);
        return true;
    }
});