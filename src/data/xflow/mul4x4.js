XML3D.xflow.register("mul4x4", {
    outputs: [{name: 'result', tupleSize: '16'}],
    params:  ['value1','value2'],
    evaluate: function(value1, value2) {
        if(!(value1 && value2))
            throw "Xflow::mul4x4: Not all parameters are set";

        if(value1.length != value1.length)
            throw "Xflow::mul4x4: Input arrays differ in size";

        var result = this.result || new Float32Array(value1.length);
        var count = value1.length / 16;
        for(var i = 0; i < count; i++)
        {
            var offset = i*16;
            mat4.multiplyOffset(result, offset, value1, offset, value2, offset);
        }
        this.result = result;
        return true;
    },
    evaluate_parallel: function(value1, value2) {
            
        var elementalFunc = function(index, value1, value2) {
            var off = index * 16;
            //var value1 = value1.get(index);
           //var mat2 = value2.get(index);
            
            var a00 = value2[off+0], a01 = value2[off+1], a02 = value2[off+2], a03 = value2[off+3];
            var a10 = value2[off+4], a11 = value2[off+5], a12 = value2[off+6], a13 = value2[off+7];
            var a20 = value2[off+8], a21 = value2[off+9], a22 = value2[off+10], a23 = value2[off+11];
            var a30 = value2[off+12], a31 = value2[off+13], a32 = value2[off+14], a33 = value2[off+15];
    
            var b00 = value1[off+0], b01 = value1[off+1], b02 = value1[off+2], b03 = value1[off+3];
            var b10 = value1[off+4], b11 = value1[off+5], b12 = value1[off+6], b13 = value1[off+7];
            var b20 = value1[off+8], b21 = value1[off+9], b22 = value1[off+10], b23 = value1[off+11];
            var b30 = value1[off+12], b31 = value1[off+13], b32 = value1[off+14], b33 = value1[off+15];
            
            var dest = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
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
       // value1 = new ParallelArray(value1);
        var numMatrices = value1.length / 16;
        var result = new ParallelArray(
                numMatrices,
                elementalFunc,
                value1,
                value2
        );
        this.result = result.flatten();
        return true;
    }
});