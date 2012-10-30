Xflow.registerOperator("skinDirection", {
    outputs: [  {type: 'float3', name: 'result' }],
    params:  [  {type: 'float3', source: 'dir' },
                {type: 'int4', source: 'boneIdx' },
                {type: 'float4', source: 'boneWeight' },
                {type: 'float4x4', source: 'boneXform', array: true } ],
    evaluate: function(result, dir,boneIdx,boneWeight,boneXform) {
        var r = vec3.create();
        var tmp =  vec3.create();

        for(var i = 0; i< this.iterateCount;++i) {
            var offset = i*3;
            r[0] = r[1] = r[2] = +0;
            for(var j = 0; j < 4; j++) {
                var weight = boneWeight[this.iterFlag[2] ? i*4+j : j];
                if (weight) {
                    var mo = boneIdx[this.iterFlag[1] ? i*4+j : j]*16;

                    mat4.multiplyOffsetDirection(boneXform, mo, dir, offset, tmp);
                    vec3.scale(tmp, weight);
                    vec3.add(r, tmp);
                }
            }
            vec3.normalize(r);
            result[offset] = r[0];
            result[offset+1] = r[1];
            result[offset+2] = r[2];
        }
    },

    evaluate_parallel: function(dir, boneIndex, boneWeight, boneXform) {
        if (!this.elementalFunc) {
            this.elementalFunc = function(index, direction, boneIndex, boneWeight, boneXform) {
                var r = [0,0,0];
                var off4 = index*4;
                var off3 = index*3;

                var x = direction[off3], y = direction[off3+1], z = direction[off3+2];

                for (var j=0; j < 4; j++) {
                    var weight = boneWeight[off4+j];
                    if (weight > 0) {
                        var mo = boneIndex[off4+j] * 16;

                        //Multiply dir with boneXform
                        r[0] += (boneXform[mo+0]*x + boneXform[mo+4]*y + boneXform[mo+8]*z) * weight;
                        r[1] += (boneXform[mo+1]*x + boneXform[mo+5]*y + boneXform[mo+9]*z) * weight;
                        r[2] += (boneXform[mo+2]*x + boneXform[mo+6]*y + boneXform[mo+10]*z) * weight;
                    }
                }
                return r;
            };
        }
        var numVertices = dir.length / 3;
        var result = new ParallelArray(
                numVertices,
                this.elementalFunc,
                dir,
                boneIndex,
                boneWeight,
                boneXform
        );

        this.result.result = result;
        return true;
    }
});