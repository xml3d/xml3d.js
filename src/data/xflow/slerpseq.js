XML3D.xflow.register("slerpSeq", {
    outputs: [{name: 'result', tupleSize: '3'}],
    params:  ['sequence','weight'],
    evaluate: function(sequence, weight) {
        this.result = sequence.interpolate(weight[0], function(v1,v2,t) {
            var result = new Float32Array(v1.length);
            var it = 1.0 - t;
            for(var i = 0; i < v1.length / 4; i++) {
                var offset = i*4;
                quat4.slerpOffset(v1,v2,offset,t,result);
            };
            return result;
        });
        return true;
    }
});