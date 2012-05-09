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
    }
});