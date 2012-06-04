XML3D.xflow.register("lerp3Seq", {
    outputs: [{name: 'result', tupleSize: '3'}],
    params:  ['sequence','weight'],
    evaluate: function(sequence, weight) {
        this.result = sequence.interpolate(weight[0], function(v1,v2,t) {
            var result = new Float32Array(v1.length);
            var it = 1.0 - t;
            for(var i = 0; i < v1.length; i++) {
                result[i] = v1[i] * it + v2[i] * t;
            };
            return result;
        });
        return true;
    },
    
    evaluate_parallel: function(sequence, weight) {
        var result = sequence.interpolate(weight[0], function(v1,v2,t) {
            var result = new Float32Array(v1.length);
            var it = 1.0 - t;
            //var v2d = v2.data;
            //var v1d = v1.data;
            for(var i = 0; i < v1.length; i++) {
                result[i] = v1[i] * it + v2[i] * t;
            };
            return result;
        });
        this.result = new ParallelArray(result);
        return true;
    }
});