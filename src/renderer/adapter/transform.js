// Adapter for <transform>
(function() {

    var TransformRenderAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);
        this.isValid = true;
		this.needsUpdate = true;
    };

    XML3D.createClass(TransformRenderAdapter, XML3D.webgl.RenderAdapter);
    var p = TransformRenderAdapter.prototype;

	var IDENT_MAT = mat4.identity(mat4.create());

	p.init = function() {
	    // Create all matrices, no valid values yet
	    this.matrix = mat4.create();
	    this.transform = {
	            translate              : mat4.create(),
	            scale                  : mat4.create(),
	            scaleOrientationInv    : mat4.create(),
	            center                 : mat4.create(),
                centerInverse          : mat4.create()
	            //rotation               : mat4.create()
	    };
        this.needsUpdate = true;
	};

	p.updateMatrix = function() {
        var n = this.node,
            transform = this.transform,
            transVec = n.translation._data,
            centerVec = n.center._data,
            s = n.scale._data,
            so = n.scaleOrientation.toMatrix()._data,
            rot = n.rotation.toMatrix()._data;

        mat4.translate(IDENT_MAT,transVec, transform.translate);
        mat4.translate(IDENT_MAT,centerVec, transform.center);
        mat4.translate(IDENT_MAT,vec3.negate(centerVec), transform.centerInverse);
        mat4.scale(IDENT_MAT, s, transform.scale);
        mat4.inverse(so, transform.scaleOrientationInv);

        // M = T * C
        mat4.multiply(transform.translate,transform.center, this.matrix);
        // M = T * C * R
        mat4.multiply(this.matrix, rot);
        // M = T * C * R * SO
        mat4.multiply(this.matrix, so);
        // M = T * C * R * SO * S
        mat4.multiply(this.matrix, transform.scale);
        // M = T * C * R * SO * S * -SO
        mat4.multiply(this.matrix, transform.scaleOrientationInv);
        // M = T * C * R * SO * S * -SO * C
        mat4.multiply(this.matrix, transform.centerInverse);

        this.needsUpdate = false;
    };

	p.getMatrix = function() {
	    this.needsUpdate && this.updateMatrix();
	    return this.matrix;
	};


    p.notifyChanged = function(e) {
        if (e.type == 1) {
			this.needsUpdate = true;
            this.factory.renderer.requestRedraw("Transformation changed.", true);
        } else if (e.type == 2) {
            this.dispose();
        }
        this.notifyOppositeAdapters();
    };
    p.dispose = function() {
        this.isValid = false;
    };
    // Export to XML3D.webgl namespace
    XML3D.webgl.TransformRenderAdapter = TransformRenderAdapter;

}());
