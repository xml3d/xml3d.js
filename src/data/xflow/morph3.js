XML3D.xflow.register("morph3", {
    outputs: [{name: 'result', tupleSize: '3'}],
    params:  ['value','valueAdd','weight'],
    evaluate: function(value, valueAdd, weight) {
        if(!(value && valueAdd && weight))
            throw "Xflow::morph3: Not all parameters are set";
        
        if(value.length != valueAdd.length)
            throw "Xflow::morph3: Input arrays differ in size";
        if (!this.tmp || this.tmp.length != value.length)
            this.tmp = new Float32Array(value.length);
            
        var result = this.tmp;
        for(var i = 0; i<value.length; i++)
            result[i] = value[i] + weight[0] * valueAdd[i];
        
        this.result.result = result;
        return true;
    },
    
    evaluate_parallel: function(value, valueAdd, weight) {
        if(!(value && valueAdd && weight))
            throw "Xflow::morph3: Not all parameters are set";
        
        if(value.length != valueAdd.length)
            throw "Xflow::morph3: Input arrays differ in size";
        if (!this.tmp || this.tmp.length != value.length)
            this.tmp = new Float32Array(value.length);
            
        var result = this.tmp;
        for(var i = 0; i<value.length; i++)
            result[i] = value[i] + weight[0] * valueAdd[i];
        
        this.result.result = result;
        return true;
    }
});