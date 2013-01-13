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

        mat4.translate(transform.translate, IDENT_MAT, transVec);
        mat4.translate(transform.center, IDENT_MAT, centerVec);
        mat4.translate(transform.centerInverse, IDENT_MAT, vec3.negate(centerVec, centerVec));
        mat4.scale(transform.scale, IDENT_MAT, s);
        mat4.invert(transform.scaleOrientationInv, so);

        // M = T * C
        mat4.multiply(this.matrix, transform.translate, transform.center);
        // M = T * C * R
        mat4.multiply(this.matrix, this.matrix, rot);
        // M = T * C * R * SO
        mat4.multiply(this.matrix, this.matrix, so);
        // M = T * C * R * SO * S
        mat4.multiply(this.matrix, this.matrix, transform.scale);
        // M = T * C * R * SO * S * -SO
        mat4.multiply(this.matrix, this.matrix, transform.scaleOrientationInv);
        // M = T * C * R * SO * S * -SO * -C
        mat4.multiply(this.matrix, this.matrix, transform.centerInverse);

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


    var DataRenderAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);
    };
    XML3D.createClass(DataRenderAdapter, XML3D.webgl.RenderAdapter);
    var p = DataRenderAdapter.prototype;

    p.init = function() {
        // Create all matrices, no valid values yet
        this.dataAdapter = XML3D.data.factory.getAdapter(this.node);
        this.needMatrixUpdate = true;
    };

    p.updateMatrix = function() {

        if(!this.transformRequest){
            var that = this;
            this.transformRequest = this.dataAdapter.getComputeRequest(["transform"],
                function(request, changeType) {
                    that.dataChanged(request, changeType);
                }
            );
        }

        this.matrix = mat4.create();

        var dataResult =  this.transformRequest.getResult();
        var transformData = (dataResult.getOutputData("transform") && dataResult.getOutputData("transform").getValue());
        if(!transformData){
            this.matrix = mat4.create();
            return;
        }
        for(var i = 0; i < 16; ++i){
            this.matrix[i] = transformData[i];
        }
        this.needMatrixUpdate = false;
    };

    p.getMatrix = function() {
        this.needMatrixUpdate && this.updateMatrix();
        return this.matrix;
    };

    p.dataChanged = function(request, changeType){
        this.factory.renderer.requestRedraw("Transformation changed.", true);
        this.needMatrixUpdate = true;
        this.notifyOppositeAdapters();
    }

    // Export to XML3D.webgl namespace
    XML3D.webgl.DataRenderAdapter = DataRenderAdapter;

}());


