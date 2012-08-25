(function() {

    var rd = vec3.create();
    var rp = vec3.create();
    var rt = vec3.create();

    var tmpd = vec3.create();
    var tmpp = vec3.create();

    XML3D.xflow.register("skinning", {
    outputs: [{name: 'pos', tupleSize: '3'}, {name: 'dir', tupleSize:'3'}, {name: 'tangent', tupleSize:'3'}],
    params:  ['pos','dir','boneIdx','boneWeight','boneXform','tangent'],
    evaluate: function(pos,dir,boneIdx,boneWeight,boneXform,tangent) {
        var count = pos.length / 3;
        if (!this.tmpp || this.tmpp.length != pos.length) {
            this.tmpp = new Float32Array(pos.length);
            this.tmpd = new Float32Array(dir.length);
            this.tmpt = tangent ? new Float32Array(tangent.length) : null;
        }

        var resd = this.tmpp;
        var resp = this.tmpd;
        var rest = this.tmpt;

        for(var i = 0; i<count;i++) {
            var offset = i*3;
            rd[0] = rd[1] = rd[2] = +0;
            rp[0] = rp[1] = rp[2] = +0;
            rt[0] = rt[1] = rt[2] = +0;
            for(var j = 0; j < 4; j++) {
                var weight = boneWeight[i*4+j];
                if (weight) {
                    var mo = boneIdx[i*4+j]*16;

                    mat4.multiplyOffsetVec3(boneXform, mo, pos, offset, tmpp);
                    vec3.scale(tmpp, weight);
                    vec3.add(rp, tmpp);

                    mat4.multiplyOffsetDirection(boneXform, mo, dir, offset, tmpd);
                    vec3.scale(tmpd, weight);
                    vec3.add(rd, tmpd);

                    if(tangent) {
                        mat4.multiplyOffsetDirection(boneXform, mo, tangent, offset, tmpd);
                        vec3.scale(tmpd, weight);
                        vec3.add(rt, tmpd);
                    }
                }
            }
            resp[offset] = rp[0];
            resp[offset+1] = rp[1];
            resp[offset+2] = rp[2];
            resd[offset] = rd[0];
            resd[offset+1] = rd[1];
            resd[offset+2] = rd[2];
            if(tangent) {
                rest[offset] = rt[0];
                rest[offset+1] = rt[1];
                rest[offset+2] = rt[2];
            }
        }
        this.result.pos = resp;
        this.result.dir = resd;
        this.result.tangent = rest;
        return true;
    },

    evaluate_parallel: function(pos, dir, boneIndex, boneWeight, boneXform, tangent) {
        if (!this.elementalFunc) {
            this.elementalFunc = function(index, pos, dir, boneIndex, boneWeight, boneXform) {
                var rp = [0,0,0];
                var rd = [0,0,0];
                var off4 = index*4;
                var off3 = index*3;

                var xp = pos[off3], yp = pos[off3+1], zp = pos[off3+2];
                var xd = dir[off3], yd = dir[off3+1], zd = dir[off3+2];

                for (var j=0; j < 4; j++) {
                    var weight = boneWeight[off4+j];
                    if (weight > 0) {
                        var mo = boneIndex[off4+j] * 16;

                        rp[0] += (boneXform[mo+0]*xp + boneXform[mo+4]*yp + boneXform[mo+8]*zp + boneXform[mo+12]) * weight;
                        rp[1] += (boneXform[mo+1]*xp + boneXform[mo+5]*yp + boneXform[mo+9]*zp + boneXform[mo+13]) * weight;
                        rp[2] += (boneXform[mo+2]*xp + boneXform[mo+6]*yp + boneXform[mo+10]*zp + boneXform[mo+14]) * weight;

                        rd[0] += (boneXform[mo+0]*xd + boneXform[mo+4]*yd + boneXform[mo+8]*zd) * weight;
                        rd[1] += (boneXform[mo+1]*xd + boneXform[mo+5]*yd + boneXform[mo+9]*zd) * weight;
                        rd[2] += (boneXform[mo+2]*xd + boneXform[mo+6]*yd + boneXform[mo+10]*zd) * weight;
                    }
                }

                return {position : rp, direction : rd};
            };
            this.elementalFuncTangents = function(index, pos, dir, boneIndex, boneWeight, boneXform, tangent) {
                var rp = [0,0,0];
                var rd = [0,0,0];
                var rt = [0,0,0];
                var off4 = index*4;
                var off3 = index*3;

                var xp = pos[off3], yp = pos[off3+1], zp = pos[off3+2];
                var xd = dir[off3], yd = dir[off3+1], zd = dir[off3+2];
                var xt = tangent[off3], yt = tangent[off3+1], zt = tangent[off3+2];

                for (var j=0; j < 4; j++) {
                    var weight = boneWeight[off4+j];
                    if (weight > 0) {
                        var mo = boneIndex[off4+j] * 16;

                        rp[0] += (boneXform[mo+0]*xp + boneXform[mo+4]*yp + boneXform[mo+8]*zp + boneXform[mo+12]) * weight;
                        rp[1] += (boneXform[mo+1]*xp + boneXform[mo+5]*yp + boneXform[mo+9]*zp + boneXform[mo+13]) * weight;
                        rp[2] += (boneXform[mo+2]*xp + boneXform[mo+6]*yp + boneXform[mo+10]*zp + boneXform[mo+14]) * weight;

                        rd[0] += (boneXform[mo+0]*xd + boneXform[mo+4]*yd + boneXform[mo+8]*zd) * weight;
                        rd[1] += (boneXform[mo+1]*xd + boneXform[mo+5]*yd + boneXform[mo+9]*zd) * weight;
                        rd[2] += (boneXform[mo+2]*xd + boneXform[mo+6]*yd + boneXform[mo+10]*zd) * weight;

                        rt[0] += (boneXform[mo+0]*xt + boneXform[mo+4]*yt + boneXform[mo+8]*zt) * weight;
                        rt[1] += (boneXform[mo+1]*xt + boneXform[mo+5]*yt + boneXform[mo+9]*zt) * weight;
                        rt[2] += (boneXform[mo+2]*xt + boneXform[mo+6]*yt + boneXform[mo+10]*zt) * weight;
                    }
                }

                return {position : rp, direction : rd, tangent : rt};
            };
        }

        var numVertices = pos.length / 3;

        var tmp = tangent ?
                new ParallelArray(numVertices, this.elementalFuncTangents, pos, dir, boneIndex, boneWeight,boneXform, tangent) :
                new ParallelArray(numVertices, this.elementalFunc, pos, dir, boneIndex, boneWeight,boneXform);
        var result = tmp.unzip();
        this.result.pos = result.position;
        this.result.dir = result.direction;
        this.result.tangent = result.tangent;
        return true;
    }
});
}());