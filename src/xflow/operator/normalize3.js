Xflow.registerOperator("normalize", {
    outputs: [{name: 'result', tupleSize: '3'}],
    params:  ['value'],
    evaluate: function(value) {
        if(!value)
            throw "Xflow::normalize: Not input";

        if (!this.tmp || this.tmp.length != value.length)
            this.tmp = new Float32Array(value.length);

        var result = this.tmp;
        for(var i = 0; i<value.length/3; i++) {
            var offset = 3*i;
            var x = value[offset];
            var y = value[offset+1];
            var z = value[offset+2];
            var l = 1.0/Math.sqrt(x*x+y*y+z*z);
            result[offset] = x*l;
            result[offset+1] = y*l;
            result[offset+2] = z*l;
        }
        this.result.result = result;
        return true;
    }
});