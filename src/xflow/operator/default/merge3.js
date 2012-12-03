Xflow.registerOperator("merge3", {
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
    }
});
Xflow.registerOperator("merge8", {
    outputs: [{name: 'result', tupleSize: '16'}],
    params:  ['value1','value2','value3','value4','value5','value6','value7','value8'],
    evaluate: function(value1, value2, value3,value4,value5,value6,value7,value8) {
        if(!(value1 && value2 && value3 && value4 && value5 && value6 && value7 && value8))
            throw "Xflow::morph3: Not all parameters are set";

        var overallLength = value1.length + value2.length + value3.length + value4.length + value5.length + value6.length + value7.length + value8.length;
        if (!this.tmp || this.tmp.length != overallLength)
            this.tmp = new Float32Array(overallLength);

        var offset = 0;
        this.tmp.set(value1, offset);
        this.tmp.set(value2, (offset+=value1.length));
        this.tmp.set(value3, (offset+=value2.length));
        this.tmp.set(value4, (offset+=value3.length));
        this.tmp.set(value5, (offset+=value4.length));
        this.tmp.set(value6, (offset+=value5.length));
        this.tmp.set(value7, (offset+=value6.length));
        this.tmp.set(value8, (offset+=value7.length));
        this.result.result = this.tmp;
        return true;
    }
});