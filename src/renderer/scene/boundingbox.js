(function() {


    var BoundingBox = function() {
        this.min = new Float32Array(3);
        this.max = new Float32Array(3);
        this.vertices = null;
        this.reset();
    };

    BoundingBox.prototype.getAsXML3DBox = function() {
        return new window.XML3DBox(this.min, this.max);
    };

    BoundingBox.prototype.extendWithBox = function(that) {
        if(that.min[0] < this.min[0])
            this.min[0] = that.min[0];
        if(that.min[1] < this.min[1])
            this.min[1] = that.min[1];
        if(that.min[2] < this.min[2])
            this.min[2] = that.min[2];

        if(that.max[0] > this.max[0])
            this.max[0] = that.max[0];
        if(that.max[1] > this.max[1])
            this.max[1] = that.max[1];
        if(that.max[2] > this.max[2])
            this.max[2] = that.max[2];
    };

    BoundingBox.prototype.extendWithVertices = function(v) {
        for (var i=0; i < v.length;) {
            if(v[i] < this.min[0])
                this.min[0] = v[i];
            if(v[i] > this.max[0])
                this.max[0] = v[i];
            i++;
            if(v[i] < this.min[1])
                this.min[1] = v[i];
            if(v[i] > this.max[1])
                this.max[1] = v[i];
            i++;
            if(v[i] < this.min[2])
                this.min[2] = v[i];
            if(v[i] > this.max[2])
                this.max[2] = v[i];
            i++
        }
    };

    BoundingBox.prototype.makeAxisAligned = (function() {
        var absMat = XML3D.math.mat4.create();
        return function(mat) {
            if (this.isEmpty())
                return;

            var center = XML3D.math.vec3.scale(XML3D.math.vec3.create(), XML3D.math.vec3.add(XML3D.math.vec3.create(), this.min, this.max), 0.5);
            var extend = XML3D.math.vec3.scale(XML3D.math.vec3.create(), XML3D.math.vec3.subtract(XML3D.math.vec3.create(), this.max, this.min), 0.5);

            XML3D.math.mat4.copy(absMat, mat);
            absMat.set([0, 0, 0, 1], 12);
            for ( var i = 0; i < 16; i++) {
                absMat[i] = Math.abs(absMat[i]);
            }

            XML3D.math.vec3.transformMat4(extend, extend, absMat);
            XML3D.math.vec3.transformMat4(center, center, mat);

            XML3D.math.vec3.add(this.max, center, extend);
            XML3D.math.vec3.subtract(this.min, center, extend);
        }
    })();

    BoundingBox.prototype.reset = function() {
        this.min[0] = Number.MAX_VALUE; this.min[1] = Number.MAX_VALUE; this.min[2] = Number.MAX_VALUE;
        this.max[0] = -Number.MAX_VALUE; this.max[1] = -Number.MAX_VALUE; this.max[2] = -Number.MAX_VALUE;
    };

    BoundingBox.prototype.isEmpty = function() {
        return (this.min[0] > this.max[0] || this.min[1] > this.max[1] || this.min[2] > this.max[2]);
    };

    BoundingBox.prototype.getVertices = function() {
        if (this.vertices) {
            return this.vertices;
        }
        var v = new Float32Array(8*3);
        var min = this.min;
        var max = this.max;

        v.set(min, 0);
        v[3] = min[0]; v[4] = max[1]; v[5] = min[2];
        v[6] = max[0]; v[7] = max[1]; v[8] = min[2];
        v[9] = max[0]; v[10] = min[1]; v[11] = min[2];
        v[12] = min[0]; v[13] = min[1]; v[14] = max[2];
        v[15] = min[0]; v[16] = max[1]; v[17] = max[2];
        v.set(max, 18);
        v[21] = max[0]; v[22] = min[1]; v[23] = max[2];
        return this.vertices = v;
    };

    BoundingBox.prototype.getZMinMax = function(mat) {
        var v = this.getVertices();
        var min = Number.MAX_VALUE;
        var max = -Number.MAX_VALUE;
        for (var i=2; i < 24; i+=3) {
            if (v[i] < min)
                min = v[i];
            if (v[i] > max)
                max = v[i];
        }
        return {zMin : min, zMax : max};
    };

    BoundingBox.prototype.applyTransform = function(mat) {
        var v = this.getVertices();
        var vec = new Float32Array(3);
        for (var i=0; i < 24; i+=3) {
            vec[0] = v[i];
            vec[1] = v[i+1];
            vec[2] = v[i+2];
            XML3D.math.vec3.transformMat4(vec, vec, mat);
            v.set(vec, i);
        }
        XML3D.math.vec3.transformMat4(this.min, this.min, mat);
        XML3D.math.vec3.transformMat4(this.max, this.max, mat);
    };

    BoundingBox.prototype.getLongestSide = function() {
        var x = this.max[0] - this.min[0];
        var y = this.max[1] - this.min[1];
        var z = this.max[2] - this.min[2];
        return Math.max(x, Math.max(y, z));
    };

    XML3D.webgl.BoundingBox = BoundingBox;
})();
