var Xflow = require("../operator.js");

Xflow.registerOperator("xflow.skinDirection", {
    outputs: [  {type: 'float3', name: 'result' }],
    params:  [  {type: 'float3', source: 'dir' },
                {type: 'int4', source: 'boneIdx' },
                {type: 'float4', source: 'boneWeight' },
                {type: 'float4x4', source: 'boneXform', array: true } ],
    evaluate: function(result, dir,boneIdx,boneWeight,boneXform, info) {
        var vec3 = XML3D.math.vec3,
            mat4 = XML3D.math.mat4;
        var r = vec3.create();
        var tmp =  vec3.create();

        for(var i = 0; i< info.iterateCount;++i) {
            var offset = i*3;
            r[0] = r[1] = r[2] = +0;
            for(var j = 0; j < 4; j++) {
                var weight = boneWeight[info.iterFlag[2] ? i*4+j : j];
                if (weight) {
                    var mo = boneIdx[info.iterFlag[1] ? i*4+j : j]*16;

                    mat4.multiplyOffsetDirection(boneXform, mo, dir, offset, tmp);
                    vec3.scale(tmp, tmp, weight);
                    vec3.add(r, r, tmp);
                }
            }
            vec3.normalize(r, r);
            result[offset] = r[0];
            result[offset+1] = r[1];
            result[offset+2] = r[2];
        }
    }
});