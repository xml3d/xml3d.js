XML3D.xflow.register("mul4x4", {
    outputs: [{name: 'result', tupleSize: '16'}],
    params:  ['value1','value2'],
    evaluate: function(value2, value1) {
        if(!(value1 && value2))
            throw "Xflow::mul4x4: Not all parameters are set";

        if(value1.length != value1.length)
            throw "Xflow::mul4x4: Input arrays differ in size";

        var result = this.result || new Float32Array(value1.length);
        var count = value1.length / 16;
        for(var i = 0; i<count; i++)
        {
            var offset = i*16;
            // Code taken from glMatrix
            // Cache the matrix values (makes for huge speed increases!)
            var a00 = value1[offset], a01 = value1[offset+1], a02 = value1[offset+2], a03 = value1[offset+3];
            var a10 = value1[offset+4], a11 = value1[offset+5], a12 = value1[offset+6], a13 = value1[offset+7];
            var a20 = value1[offset+8], a21 = value1[offset+9], a22 = value1[offset+10], a23 = value1[offset+11];
            var a30 = value1[offset+12], a31 = value1[offset+13], a32 = value1[offset+14], a33 = value1[offset+15];

            var b00 = value2[offset+0], b01 = value2[offset+1], b02 = value2[offset+2], b03 = value2[offset+3];
            var b10 = value2[offset+4], b11 = value2[offset+5], b12 = value2[offset+6], b13 = value2[offset+7];
            var b20 = value2[offset+8], b21 = value2[offset+9], b22 = value2[offset+10], b23 = value2[offset+11];
            var b30 = value2[offset+12], b31 = value2[offset+13], b32 = value2[offset+14], b33 = value2[offset+15];

            result[offset] = b00*a00 + b01*a10 + b02*a20 + b03*a30;
            result[offset+1] = b00*a01 + b01*a11 + b02*a21 + b03*a31;
            result[offset+2] = b00*a02 + b01*a12 + b02*a22 + b03*a32;
            result[offset+3] = b00*a03 + b01*a13 + b02*a23 + b03*a33;
            result[offset+4] = b10*a00 + b11*a10 + b12*a20 + b13*a30;
            result[offset+5] = b10*a01 + b11*a11 + b12*a21 + b13*a31;
            result[offset+6] = b10*a02 + b11*a12 + b12*a22 + b13*a32;
            result[offset+7] = b10*a03 + b11*a13 + b12*a23 + b13*a33;
            result[offset+8] = b20*a00 + b21*a10 + b22*a20 + b23*a30;
            result[offset+9] = b20*a01 + b21*a11 + b22*a21 + b23*a31;
            result[offset+10] = b20*a02 + b21*a12 + b22*a22 + b23*a32;
            result[offset+11] = b20*a03 + b21*a13 + b22*a23 + b23*a33;
            result[offset+12] = b30*a00 + b31*a10 + b32*a20 + b33*a30;
            result[offset+13] = b30*a01 + b31*a11 + b32*a21 + b33*a31;
            result[offset+14] = b30*a02 + b31*a12 + b32*a22 + b33*a32;
            result[offset+15] = b30*a03 + b31*a13 + b32*a23 + b33*a33;
        }
        this.result = result;
        return true;
    }
});