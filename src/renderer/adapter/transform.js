// Adapter for <transform>
(function() {

    var TransformRenderAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);
        this.isValid = true;
		this.needsUpdate = true;
    };

    XML3D.createClass(TransformRenderAdapter, XML3D.webgl.RenderAdapter);
    var p = TransformRenderAdapter.prototype;

	var IDENT_MAT = XML3D.math.mat4.identity(XML3D.math.mat4.create());

	p.init = function() {
	    // Create all matrices, no valid values yet
	    this.matrix = XML3D.math.mat4.create();
	    this.transform = {
	            translate              : XML3D.math.mat4.create(),
	            scale                  : XML3D.math.mat4.create(),
	            scaleOrientationInv    : XML3D.math.mat4.create(),
	            center                 : XML3D.math.mat4.create(),
                centerInverse          : XML3D.math.mat4.create()
	            //rotation               : XML3D.math.mat4.create()
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

        XML3D.math.mat4.translate(transform.translate, IDENT_MAT, transVec);
        XML3D.math.mat4.translate(transform.center, IDENT_MAT, centerVec);
        XML3D.math.mat4.translate(transform.centerInverse, IDENT_MAT, XML3D.math.vec3.negate(centerVec, centerVec));
        XML3D.math.mat4.scale(transform.scale, IDENT_MAT, s);
        XML3D.math.mat4.invert(transform.scaleOrientationInv, so);

        // M = T * C
        XML3D.math.mat4.multiply(this.matrix, transform.translate, transform.center);
        // M = T * C * R
        XML3D.math.mat4.multiply(this.matrix, this.matrix, rot);
        // M = T * C * R * SO
        XML3D.math.mat4.multiply(this.matrix, this.matrix, so);
        // M = T * C * R * SO * S
        XML3D.math.mat4.multiply(this.matrix, this.matrix, transform.scale);
        // M = T * C * R * SO * S * -SO
        XML3D.math.mat4.multiply(this.matrix, this.matrix, transform.scaleOrientationInv);
        // M = T * C * R * SO * S * -SO * -C
        XML3D.math.mat4.multiply(this.matrix, this.matrix, transform.centerInverse);

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
        this.matrixReady = {};
        this.matrices = {};
        this.requests = {};
    };

    p.updateMatrix = function(type) {

        createRequest(this, type);

        this.matrices[type] = XML3D.math.mat4.create();

        var dataResult =  this.requests[type].getResult();
        var transformData = (dataResult.getOutputData(type) && dataResult.getOutputData(type).getValue());
        if(!transformData){
            XML3D.math.mat4.identity(this.matrices[type]);
            return;
        }
        for(var i = 0; i < 16; ++i){
            this.matrices[type][i] = transformData[i];
        }
        this.matrixReady[type] = true;
    };

    p.getMatrix = function(type) {
        !this.matrixReady[type] && this.updateMatrix(type);
        return this.matrices[type];
    };

    p.dataChanged = function(request, changeType){
        this.factory.renderer.requestRedraw("Transformation changed.", true);
        for(var type in this.requests){
            if(this.requests[type] == request)
                delete this.matrixReady[type];
        }
        this.notifyOppositeAdapters();
    }

    function createRequest(adapter, key){
        if(!adapter.requests[key]){
            var that = adapter;
            adapter.requests[key] = adapter.dataAdapter.getComputeRequest([key],
                function(request, changeType) {
                    that.dataChanged(request, changeType);
                }
            );
        }
    }

    // Export to XML3D.webgl namespace
    XML3D.webgl.DataRenderAdapter = DataRenderAdapter;

}());


