XML3D.xflow.register("flipNormal", {
    outputs: [{name: 'result', tupleSize: '3'}],
    params:  ['value'],
    evaluate: function(value) {
        if(!value)
            throw "Xflow::flipNormal: Not all parameters are set";
        
        this.result = new Float32Array(value.length);
        for(var i = 0; i<value.length; i++)
            this.result[i] = -value[i];
        return true;
    }
});