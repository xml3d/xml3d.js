XML3D.xflow.register("flattenBoneTransform", {
    outputs: [{name: 'result', tupleSize: '16'}],
    params:  ['parent','xform'],
    evaluate: function(parent,xform) {

        var boneCount = xform.length / 16;
        var result = new Float32Array(boneCount*16);
        var computed = [];



        for(var i = 0; i < boneCount;){
            if(!computed[i]) {
                var p = parent[i];
                if(p >= 0){
                    if(!computed[p]){
                        while(parent[p] >= 0 && !computed[parent[p]])
                            p = parent[p];

                        if(parent[p] >= 0)
                            mat4.multiplyOffset(result, p*16, xform, p*16, result, parent[p]*16);
                        else
                            for(var j = 0; j < 16; j++) {
                                result[p*16+j] = xform[p*16+j];
                            }
                        computed[p] = true;
                        continue;
                    }
                    else{
                        mat4.multiplyOffset(result, i*16, xform, i*16, result,  p*16);
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

        this.result = result;
        return true;
    }
});