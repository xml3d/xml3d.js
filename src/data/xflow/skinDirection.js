XML3D.xflow.register("skinDirection", {
    outputs: [{name: 'result', tupleSize: '3'}],
    params:  ['dir','boneIdx','boneWeight','boneXform'],
    evaluate: function(dir,boneIdx,boneWeight,boneXform) {
        var count = dir.length / 3;
        var result = new Float32Array(dir.length);

        var m = mat4.create();
        var r = vec3.create();
        var tmp = vec3.create();

        for(var i = 0; i<count;i++) {
            var offset = i*3;
            r[0] = r[1] = r[2] = +0;

            for(var j = 0; j < 4; j++) {
                var weight = boneWeight[i*4+j];
                if (weight) {
                    var mo = boneIdx[i*4+j]*16;

                    mat4.multiplyOffsetDirection(boneXform, mo, dir, offset, tmp);
                    vec3.scale(tmp, weight);
                    vec3.add(r, tmp);
                }
            }
            result[offset] = r[0];
            result[offset+1] = r[1];
            result[offset+2] = r[2];
        }
        this.result = result;
        return true;
    },

    evaluate_parallel: function(dir, boneIndex, boneWeight, boneXform) {
        var elementalFunc = function(index, dir, boneIndex, boneWeight, boneXform) {
            var r = [0,0,0];
            var off4 = index*4;
            var off3 = index*3;

            var tmp = [0,0,0];
            for (var j=0; j < 4; j++) {
                var weight = boneWeight[off4+j];
                if (weight > 0) {
                    var mo = boneIndex[off4+j] * 16;
                    //var bxform = boneXform[mo);
                    
                    //Multiply dir with boneXform
                    var x = dir[off3], y = dir[off3+1], z = dir[off3+2];
                    tmp[0] = boneXform[mo+0]*x + boneXform[mo+4]*y + boneXform[mo+8]*z;
                    tmp[1] = boneXform[mo+1]*x + boneXform[mo+5]*y + boneXform[mo+9]*z; //is this offsetting right?
                    tmp[2] = boneXform[mo+2]*x + boneXform[mo+6]*y + boneXform[mo+10]*z;
                    
                    r[0] += tmp[0]*weight;
                    r[1] += tmp[1]*weight;
                    r[2] += tmp[2]*weight;
                }
            }
            return r;
        };

        var numVertices = dir.length / 3;
        var result = new ParallelArray(
                numVertices,
                elementalFunc,
                dir,
                boneIndex,
                boneWeight,
                boneXform
        );
        this.result = new Float32Array(result.data);
        return true;
    }
});