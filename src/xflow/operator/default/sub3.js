Xflow.registerOperator("sub", {
    outputs: [{name: 'result', tupleSize: '3'}],
    params:  ['value1','value2'],
    evaluate: function(value1, value2) {
        if(!(value1 && value2))
            throw "Xflow::sub3: Not all parameters are set";

        if(value1.length != value1.length)
            throw "Xflow::sub3: Input arrays differ in size";

        if (!this.tmp || this.tmp.length != value1.length)
            this.tmp = new Float32Array(value1.length);

        var result = this.tmp;
        for(var i = 0; i<value1.length; i++)
            result[i] = value1[i] - value2[i];

        this.result.result = result;
        return true;
    }
});