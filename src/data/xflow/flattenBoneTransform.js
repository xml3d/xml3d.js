XML3D.xflow.register("flattenBoneTransform", {
    outputs: [{name: 'result', tupleSize: '16'}],
    params:  ['parent','xform'],
    evaluate: function(parent,xform) {

        var boneCount = xform.length / 16;
        var result = new Float32Array(boneCount*16);
        var computed = [];


        //For each bone do:
        for(var i = 0; i < boneCount;){
            if(!computed[i]) {
                var p = parent[i];
                if(p >= 0){
                    //This bone has a parent bone
                    if(!computed[p]){
                        //The parent bone's transformation matrix hasn't been computed yet
                        while(parent[p] >= 0 && !computed[parent[p]]) {
                            //The current bone has a parent and its transform hasn't been computed yet
                            p = parent[p];

                            if(parent[p] >= 0)    
                                mat4.multiplyOffset(result, p*16, xform, p*16, result, parent[p]*16);
                            else
                                for(var j = 0; j < 16; j++) {
                                    result[p*16+j] = xform[p*16+j];
                                }
                            computed[p] = true;
                        }
                    }
                    else {
                        mat4.multiplyOffset(result, i*16, xform, i*16, result,  p*16);
                    }
                }
                else{
                    for(var j = 0; j < 16; j++) {
                        result[i*16+j] = xform[i*16+j];
                    }
                }
                computed[i] = true;
            }
            i++;
        }

        this.result = result;
        return true;
    },
    
    evaluate_parallel: function(parent, xform) {
        var elementalFunc = function(index, parent,xform) {
            var result = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
            var off = index*16;
            
            for(var j = 0; j < 16; j++) {
                result[j] = xform[off+j];
            }
            
            var p = parent[index];
            //var xf = xform.get(index);
            while (p >= 0) {                   
                off = p*16;
                //Multiply the current bone matrix with its parent
                var a00 = xform[off], a01 = xform[off+1], a02 = xform[off+2], a03 = xform[off+3];
                var a10 = xform[off+4], a11 = xform[off+5], a12 = xform[off+6], a13 = xform[off+7];
                var a20 = xform[off+8], a21 = xform[off+9], a22 = xform[off+10], a23 = xform[off+11];
                var a30 = xform[off+12], a31 = xform[off+13], a32 = xform[off+14], a33 = xform[off+15];
                
                var b00 = result[0], b01 = result[1], b02 = result[2], b03 = result[3];
                var b10 = result[4], b11 = result[5], b12 = result[6], b13 = result[7];
                var b20 = result[8], b21 = result[9], b22 = result[10], b23 = result[11];
                var b30 = result[12], b31 = result[13], b32 = result[14], b33 = result[15];
                
                result[0] = b00*a00 + b01*a10 + b02*a20 + b03*a30;
                result[1] = b00*a01 + b01*a11 + b02*a21 + b03*a31;
                result[2] = b00*a02 + b01*a12 + b02*a22 + b03*a32;
                result[3] = b00*a03 + b01*a13 + b02*a23 + b03*a33;
                result[4] = b10*a00 + b11*a10 + b12*a20 + b13*a30;
                result[5] = b10*a01 + b11*a11 + b12*a21 + b13*a31;
                result[6] = b10*a02 + b11*a12 + b12*a22 + b13*a32;
                result[7] = b10*a03 + b11*a13 + b12*a23 + b13*a33;
                result[8] = b20*a00 + b21*a10 + b22*a20 + b23*a30;
                result[9] = b20*a01 + b21*a11 + b22*a21 + b23*a31;
                result[10] = b20*a02 + b21*a12 + b22*a22 + b23*a32;
                result[11] = b20*a03 + b21*a13 + b22*a23 + b23*a33;
                result[12] = b30*a00 + b31*a10 + b32*a20 + b33*a30;
                result[13] = b30*a01 + b31*a11 + b32*a21 + b33*a31;
                result[14] = b30*a02 + b31*a12 + b32*a22 + b33*a32;
                result[15] = b30*a03 + b31*a13 + b32*a23 + b33*a33;
                p = parent[p];                 
            }
            
            return result;        
        };

        var numMatrices = parent.length;
        var result = new ParallelArray(
                numMatrices,
                elementalFunc,
                parent,
                xform
        );
        this.result = result.flatten();
        return true;
    }
});