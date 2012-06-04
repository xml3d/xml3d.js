XML3D.xflow.register("createTransform", {
    outputs: [{name: 'result', tupleSize: '16'}],
    params:  ['translation','rotation','scale','center','scaleOrientation'],
    evaluate: function(translation,rotation,scale,center,scaleOrientation) {
        rotation = rotation.data ? rotation.data[0].getValue() : rotation;
        var count = translation ? translation.length / 3 :
                    rotation ? rotation.length / 4 :
                    scale ? scale.length / 3 :
                    center ? center.length / 3 :
                    scaleOrientation ? scaleOrientation / 4 : 0;
        if(!count)
            throw ("createTransform: No input found");
        this.result = this.result || new Float32Array(count*16);
        for(var i = 0; i < count; i++) {
            mat4.makeTransformOffset(translation,rotation,scale,center,scaleOrientation,i,this.result);
        }
        return true;
    },
    evaluate_parallel: function( translation,rotation,scale,center,scaleOrientation) {
        var elementalFunc = function(index, translation,rotation) {
            //Translation
            var off3 = index*3;
            var off4 = index*4;
            
            //var t = translation.get(index);
            var dest = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
            dest[12] = translation[off3];
            dest[13] = translation[off3+1];
            dest[14] = translation[off3+2];
            
            //Rotation to matrix
            //var rot = rotation[index];
            var x = rotation[off4+1], y = rotation[off4+2], z = rotation[off4+3], w = -rotation[off4];
    
            var x2 = x + x;
            var y2 = y + y;
            var z2 = z + z;
    
            var xx = x*x2;
            var xy = x*y2;
            var xz = x*z2;
    
            var yy = y*y2;
            var yz = y*z2;
            var zz = z*z2;
    
            var wx = w*x2;
            var wy = w*y2;
            var wz = w*z2;
            
            var rotMat = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1];
            rotMat[0] = 1 - (yy + zz);
            rotMat[1] = xy - wz;
            rotMat[2] = xz + wy;
            rotMat[3] = 0;
    
            rotMat[4] = xy + wz;
            rotMat[5] = 1 - (xx + zz);
            rotMat[6] = yz - wx;
            rotMat[7] = 0;
    
            rotMat[8] = xz - wy;
            rotMat[9] = yz + wx;
            rotMat[10] = 1 - (xx + yy);
            rotMat[11] = 0;
            
            //Combine translation and rotation (is the kernel faster if we cache the matrix values?)
            var a00 = dest[0], a01 = dest[1], a02 = dest[2], a03 = dest[3];
            var a10 = dest[4], a11 = dest[5], a12 = dest[6], a13 = dest[7];
            var a20 = dest[8], a21 = dest[9], a22 = dest[10], a23 = dest[11];
            var a30 = dest[12], a31 = dest[13], a32 = dest[14], a33 = dest[15];
    
            var b00 = rotMat[0], b01 = rotMat[1], b02 = rotMat[2], b03 = rotMat[3];
            var b10 = rotMat[4], b11 = rotMat[5], b12 = rotMat[6], b13 = rotMat[7];
            var b20 = rotMat[8], b21 = rotMat[9], b22 = rotMat[10], b23 = rotMat[11];
            var b30 = rotMat[12], b31 = rotMat[13], b32 = rotMat[14], b33 = rotMat[15];
    
            dest[0] = b00*a00 + b01*a10 + b02*a20 + b03*a30;
            dest[1] = b00*a01 + b01*a11 + b02*a21 + b03*a31;
            dest[2] = b00*a02 + b01*a12 + b02*a22 + b03*a32;
            dest[3] = b00*a03 + b01*a13 + b02*a23 + b03*a33;
            dest[4] = b10*a00 + b11*a10 + b12*a20 + b13*a30;
            dest[5] = b10*a01 + b11*a11 + b12*a21 + b13*a31;
            dest[6] = b10*a02 + b11*a12 + b12*a22 + b13*a32;
            dest[7] = b10*a03 + b11*a13 + b12*a23 + b13*a33;
            dest[8] = b20*a00 + b21*a10 + b22*a20 + b23*a30;
            dest[9] = b20*a01 + b21*a11 + b22*a21 + b23*a31;
            dest[10] = b20*a02 + b21*a12 + b22*a22 + b23*a32;
            dest[11] = b20*a03 + b21*a13 + b22*a23 + b23*a33;
            dest[12] = b30*a00 + b31*a10 + b32*a20 + b33*a30;
            dest[13] = b30*a01 + b31*a11 + b32*a21 + b33*a31;
            dest[14] = b30*a02 + b31*a12 + b32*a22 + b33*a32;
            dest[15] = b30*a03 + b31*a13 + b32*a23 + b33*a33;
            
            return dest;
        };
        
        var numVertices = translation.length / 3;
        var result = new ParallelArray(
                numVertices,
                elementalFunc,
                translation,
                rotation
        );
        this.result = result.flatten();
        return true;
    }
});