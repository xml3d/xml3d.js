XML3D.xflow.register("skinPosition", {
    outputs: [{name: 'result', tupleSize: '3'}],
    params:  ['pos','boneIdx','boneWeight','boneXform'],
    evaluate: function(pos,boneIdx,boneWeight,boneXform) {
        var count = pos.length / 3;
        var result = new Float32Array(pos.length);

        var nullVec = vec3.create([0.0,0.0,0.0]);
        var m = mat4.create();
        var r = vec3.create();
        var tmp = vec3.create();
        for(var i = 0; i<count;i++) {
            var offset = i*3;
            r.set(nullVec);
            for(var j = 0; j < 4; j++) {
                var mo = boneIdx[i*4+j]*16;
                m[0] = boneXform[mo];
                m[1] = boneXform[mo+1];
                m[2] = boneXform[mo+2];
                m[3] = boneXform[mo+3];
                m[4] = boneXform[mo+4];
                m[5] = boneXform[mo+5];
                m[6] = boneXform[mo+6];
                m[7] = boneXform[mo+7];
                m[8] = boneXform[mo+8];
                m[9] = boneXform[mo+9];
                m[10] = boneXform[mo+10];
                m[11] = boneXform[mo+11];
                m[12] = boneXform[mo+12];
                m[13] = boneXform[mo+13];
                m[14] = boneXform[mo+14];
                m[15] = boneXform[mo+15];

                tmp[0] = pos[offset];
                tmp[1] = pos[offset+1];
                tmp[2] = pos[offset+2];
                mat4.multiplyVec3(m, tmp);
                vec3.scale(tmp, boneWeight[i*4+j]);
                vec3.add(r, tmp);
            }
            result[offset] = r[0];
            result[offset+1] = r[1];
            result[offset+2] = r[2];
        }
        this.result = result;
        return true;
    }
});