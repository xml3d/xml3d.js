XML3D.xflow.register("skinning", {
    outputs: [{name: 'result', tupleSize: '3', interleaved: {position:'0', normal:'3'}}],
    params:  ['pos','dir','boneIdx','boneWeight','boneXform'],
    evaluate: function(pos,dir,boneIdx,boneWeight,boneXform) {
        var count = pos.length / 3;
        var result = new Float32Array(pos.length);

        var m = mat4.create();
        var r = vec3.create();
        var tmp =  vec3.create();

        for(var i = 0; i<count;i++) {
            var offset = i*3;
            r[0] = r[1] = r[2] = +0;
            for(var j = 0; j < 4; j++) {
                var weight = boneWeight[i*4+j];
                if (weight) {
                    var mo = boneIdx[i*4+j]*16;

                    mat4.multiplyOffsetVec3(boneXform, mo, pos, offset, tmp);
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
    
    //pos, dir - 3
    //boneindex, boneweight - 4
    //bonexform - 16
    
    evaluate_parallel: function(pos, dir, boneIndex, boneWeight, boneXform) {
        this.elementalFunc =  function(index, pos, dir, boneIndex, boneWeight, boneXform) {
            var r = [0,0,0,0,0,0];
            var off4 = index*4;
            var off3 = index*3;
            
            //var bw = boneWeight.get(off4);
           // var bi = boneIndex.get(off4);
            var tmpPos = [0,0,0];
            var tmpDir = [0,0,0];
            for (var j=0; j < 4; j++) {
                var weight = boneWeight.get(off4+j);
                if (weight > 0) {
                    var mo = boneIndex.get(off4+j) * 16;
                   // var bxform = boneXform.get(mo);
                    
                    //Multiply pos with boneXform
                    var x = pos.get(off3), y = pos.get(off3+1), z = pos.get(off3+2); 
                    tmpPos[0] = boneXform.get(mo+0)*x + boneXform.get(mo+4)*y + boneXform.get(mo+8)*z + boneXform.get(mo+12);
                    tmpPos[1] = boneXform.get(mo+1)*x + boneXform.get(mo+5)*y + boneXform.get(mo+9)*z + boneXform.get(mo+13); 
                    tmpPos[2] = boneXform.get(mo+2)*x + boneXform.get(mo+6)*y + boneXform.get(mo+10)*z + boneXform.get(mo+14);

                    x = dir.get(off3), y = dir.get(off3+1), z = dir.get(off3+2);
                    tmpDir[0] = boneXform.get(mo+0)*x + boneXform.get(mo+4)*y + boneXform.get(mo+8)*z;
                    tmpDir[1] = boneXform.get(mo+1)*x + boneXform.get(mo+5)*y + boneXform.get(mo+9)*z; //is this offsetting right?
                    tmpDir[2] = boneXform.get(mo+2)*x + boneXform.get(mo+6)*y + boneXform.get(mo+10)*z;
                    
                    r[0] += tmpPos[0]*weight;
                    r[1] += tmpPos[1]*weight;
                    r[2] += tmpPos[2]*weight;
                    r[3] += tmpDir[0]*weight;
                    r[4] += tmpDir[1]*weight;
                    r[5] += tmpDir[2]*weight;
                }
            }
            
            return r;
        };

        var numVertices = pos.length / 3;
        
        var result = new ParallelArray(
                numVertices,
                this.elementalFunc,
                pos,
                dir,
                boneIndex,
                boneWeight,
                boneXform
        );
        this.result = result.flatten();
        return true;
    }
});