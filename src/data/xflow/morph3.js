XML3D.xflow.register("morph3", {
    outputs: [{name: 'result', tupleSize: '3'}],
    params:  ['value','valueAdd','weight'],
    evaluate: function(value, valueAdd, weight) {
        if(!(value && valueAdd && weight))
            throw "Xflow::morph3: Not all parameters are set";
        
        if(value.length != valueAdd.length)
            throw "Xflow::morph3: Input arrays differ in size";
        
        this.result = new Float32Array(value.length);
        for(var i = 0; i<value.length; i++)
            this.result[i] = value[i] + weight[0] * valueAdd[i];
        return true;
    }
});