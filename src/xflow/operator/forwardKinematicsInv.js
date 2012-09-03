Xflow.registerOperator("forwardKinematicsInv", {
    outputs: [{name: 'result', tupleSize: '16'}],
    params:  ['parent','xform'],
    evaluate: function(parent,xform) {

        var boneCount = xform.length / 16;
        if (!this.tmp || this.tmp.length != xform.length)
            this.tmp = new Float32Array(xform.length);

        var result = this.tmp;
        var computed = [];

        //For each bone do:
        for(var i = 0; i < boneCount;){
            if(!computed[i]) {
                var p = parent[i];
                if(p >= 0){
                    //This bone has a parent bone
                    if(!computed[p]){
                        //The parent bone's transformation matrix hasn't been computed yet
                        while(parent[p] >= 0 && !computed[parent[p]]) {
                            //The current bone has a parent and its transform hasn't been computed yet
                            p = parent[p];

                            if(parent[p] >= 0)
                                mat4.multiplyOffset(result, p*16, result, parent[p]*16, xform, p*16);
                            else
                                for(var j = 0; j < 16; j++) {
                                    result[p*16+j] = xform[p*16+j];
                                }
                            computed[p] = true;
                        }
                    }
                    else {
                        mat4.multiplyOffset(result, i*16,  result,  p*16, xform, i*16);
                    }
                }
                else{
                    for(var j = 0; j < 16; j++) {
                        result[i*16+j] = xform[i*16+j];
                    }
                }
                computed[i] = true;
            }
            i++;
        }

        this.result.result = result;
        return true;
    }
});