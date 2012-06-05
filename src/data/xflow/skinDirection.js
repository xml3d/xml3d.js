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
        var elementalFunc = function(index, direction, boneIndex, boneWeight, boneXform) {
            var r = [0,0,0];
            var bw = boneWeight.get(index);
            var bi = boneIndex.get(index);
            var dir = direction.get(index);

            var tmp = [0,0,0];
            var x = dir.get(0), y = dir.get(1), z = dir.get(2);
            
            for (var j=0; j < 4; j++) {
                var weight = bw.get(j);
                if (weight > 0) {
                    var mo = bi.get(j);
                    var xform = boneXform.get(mo);
                    
                    //Multiply dir with boneXform
                    tmp[0] = xform.get(0)*x + xform.get(4)*y + xform.get(8)*z;
                    tmp[1] = xform.get(1)*x + xform.get(5)*y + xform.get(9)*z; 
                    tmp[2] = xform.get(2)*x + xform.get(6)*y + xform.get(10)*z;
                    
                    r[0] += tmp[0]*weight;
                    r[1] += tmp[1]*weight;
                    r[2] += tmp[2]*weight;
                }
            }
            return r;
        };
        
        if (!this.parallel_data) {
        	this.parallel_data = new ParallelArray(dir.data).partition(3);
        }

        this.parallel_data = this.parallel_data.combine(
                1,
                low_precision(elementalFunc),
                dir,
                boneIndex,
                boneWeight,
                boneXform
        );
        this.result.result = this.parallel_data;
        return true;
    }
});