XML3D.xflow.register("flipNormal", {
    outputs: [{name: 'result', tupleSize: '3'}],
    params:  ['value'],
    evaluate: function(value) {
        if(!value)
            throw "Xflow::flipNormal: Not all parameters are set";
        
        if (!this.tmp || this.tmp.length != value.length)
            this.tmp = new Float32Array(value.length);
        
        var result = this.tmp;
        for(var i = 0; i<value.length; i++)
            result[i] = -value[i];
        
        this.result.result = result;
        return true;
    }
});