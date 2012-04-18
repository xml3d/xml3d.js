XML3D.xflow.register("flattenBoneTransform", {
    outputs: [{name: 'result', tupleSize: '16'}],
    params:  ['parent','xform'],
    evaluate: function(parent,xform) {
        
        var boneCount = xform.length / 16;
        var result = new Float32Array(boneCount*16);
        var computed = [];
        
        var multiply = function(dest, mat, offset1, mat2, offset2) {
            var a00 = mat2[offset2+0], a01 = mat2[offset2+1], a02 = mat2[offset2+2], a03 = mat2[offset2+3];
            var a10 = mat2[offset2+4], a11 = mat2[offset2+5], a12 = mat2[offset2+6], a13 = mat2[offset2+7];
            var a20 = mat2[offset2+8], a21 = mat2[offset2+9], a22 = mat2[offset2+10], a23 = mat2[offset2+11];
            var a30 = mat2[offset2+12], a31 = mat2[offset2+13], a32 = mat2[offset2+14], a33 = mat2[offset2+15];
            
            var b00 = mat[offset1+0], b01 = mat[offset1+1], b02 = mat[offset1+2], b03 = mat[offset1+3];
            var b10 = mat[offset1+4], b11 = mat[offset1+5], b12 = mat[offset1+6], b13 = mat[offset1+7];
            var b20 = mat[offset1+8], b21 = mat[offset1+9], b22 = mat[offset1+10], b23 = mat[offset1+11];
            var b30 = mat[offset1+12], b31 = mat[offset1+13], b32 = mat[offset1+14], b33 = mat[offset1+15];
            
            dest[offset1+0] = b00*a00 + b01*a10 + b02*a20 + b03*a30;
            dest[offset1+1] = b00*a01 + b01*a11 + b02*a21 + b03*a31;
            dest[offset1+2] = b00*a02 + b01*a12 + b02*a22 + b03*a32;
            dest[offset1+3] = b00*a03 + b01*a13 + b02*a23 + b03*a33;
            dest[offset1+4] = b10*a00 + b11*a10 + b12*a20 + b13*a30;
            dest[offset1+5] = b10*a01 + b11*a11 + b12*a21 + b13*a31;
            dest[offset1+6] = b10*a02 + b11*a12 + b12*a22 + b13*a32;
            dest[offset1+7] = b10*a03 + b11*a13 + b12*a23 + b13*a33;
            dest[offset1+8] = b20*a00 + b21*a10 + b22*a20 + b23*a30;
            dest[offset1+9] = b20*a01 + b21*a11 + b22*a21 + b23*a31;
            dest[offset1+10] = b20*a02 + b21*a12 + b22*a22 + b23*a32;
            dest[offset1+11] = b20*a03 + b21*a13 + b22*a23 + b23*a33;
            dest[offset1+12] = b30*a00 + b31*a10 + b32*a20 + b33*a30;
            dest[offset1+13] = b30*a01 + b31*a11 + b32*a21 + b33*a31;
            dest[offset1+14] = b30*a02 + b31*a12 + b32*a22 + b33*a32;
            dest[offset1+15] = b30*a03 + b31*a13 + b32*a23 + b33*a33;
        };
        
        for(var i = 0; i < boneCount;){
            if(!computed[i]) {
                var p = parent[i];
                if(p >= 0){
                    if(!computed[p]){
                        while(parent[p] >= 0 && !computed[parent[p]])
                            p = parent[p];

                        if(parent[p] >= 0)
                            multiply(result, xform, p*16, result, parent[p]*16);
                        else
                            for(var j = 0; j < 16; j++) {
                                result[p*16+j] = xform[p*16+j];
                            }
                        computed[p] = true;
                        continue;
                    }
                    else{
                        multiply(result, xform, i*16, result,  p*16);
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
        window.console.dir(result);
        return true;
    }
});