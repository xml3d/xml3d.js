XML3D.xflow.register("normalize3", {
    outputs: [{name: 'result', tupleSize: '3'}],
    params:  ['value'],
    evaluate: function(value) {
        if(!value)
            throw "Xflow::normalize: Not input";
        
        if(!(this.result && this.result.length == value.length))
            this.result = new Float32Array(value.length);
        for(var i = 0; i<value.length/3; i++) {
            var offset = 3*i;
            var x = value[offset];
            var y = value[offset+1];
            var z = value[offset+2];
            var l = 1.0/Math.sqrt(x*x+y*y+z*z);
            this.result[offset] = x*l;
            this.result[offset+1] = y*l;
            this.result[offset+2] = z*l;
        }
        return true;
    }
});