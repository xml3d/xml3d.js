XML3D.xflow.register("merge3", {
    outputs: [{name: 'result', tupleSize: '16'}],
    params:  ['value1','value2','value3'],
    evaluate: function(value1, value2, value3) {
        if(!(value1 && value2 && value3))
            throw "Xflow::morph3: Not all parameters are set";
        
        var overallLength = value1.length + value2.length + value3.length;
        if (!this.tmp || this.tmp.length != overallLength)
            this.tmp = new Float32Array(overallLength);
            
        this.tmp.set(value1);
        this.tmp.set(value2, value1.length);
        this.tmp.set(value3, value1.length + value2.length);
        this.result.result = this.tmp;
        return true;
    },
});