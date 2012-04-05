XML3D.xflow.register("sub3", {
    outputs: [{name: 'result', tupleSize: '3'}],
    params:  ['value1','value2'],
    evaluate: function(value1, value2) {
        if(!(value1 && value2))
            throw "Xflow::sub3: Not all parameters are set";
        
        if(value1.length != value1.length)
            throw "Xflow::sub3: Input arrays differ in size";
        
        this.result = new Float32Array(value1.length);
        for(var i = 0; i<value1.length; i++)
            this.result[i] = value1[i] - value2[i];
        return true;
    }
});