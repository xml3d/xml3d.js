XML3D.xflow.register("skinning", {
    outputs: [{name: 'pos', tupleSize: '3'}, {name: 'dir', tupleSize:'3'}],
    params:  ['pos','dir','boneIdx','boneWeight','boneXform'],
    evaluate: function(pos,dir,boneIdx,boneWeight,boneXform) {
        var count = pos.length / 3;
        var resd = new Float32Array(pos.length);
        var resp = new Float32Array(dir.length);

        var m = mat4.create();
        var rd = vec3.create();
        var rp = vec3.create();
        
        var tmpd = vec3.create();
        var tmpp = vec3.create();

        for(var i = 0; i<count;i++) {
            var offset = i*3;
            rd[0] = rd[1] = rd[2] = +0;
            rp[0] = rp[1] = rp[2] = +0;
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
                }
            }
            resp[offset] = rp[0];
            resp[offset+1] = rp[1];
            resp[offset+2] = rp[2];
            resd[offset] = rd[0];
            resd[offset+1] = rd[1];
            resd[offset+2] = rd[2];
        }
        this.pos = resp;
        this.dir = resd;
        return true;
    },

    evaluate_parallel: function(pos, dir, boneIndex, boneWeight, boneXform) {
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
    	}

        var numVertices = pos.length / 3;
        
        var tmp = new ParallelArray(
                numVertices,
                this.elementalFunc,
                pos,
                dir,
                boneIndex,
                boneWeight,
                boneXform
        );
        var result = tmp.unzip();
        this.result.pos = result.position;
        this.result.dir = result.direction;
        return true;
    }
});