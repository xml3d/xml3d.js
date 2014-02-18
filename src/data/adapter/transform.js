// Adapter for <transform>
(function() {

    var TransformDataAdapter = function(factory, node) {
        XML3D.base.NodeAdapter.call(this, factory, node);
        this.isValid = true;
		this.needsUpdate = true;
    };

    XML3D.createClass(TransformDataAdapter, XML3D.base.NodeAdapter);
    var p = TransformDataAdapter.prototype;

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
        } else if (e.type == 2) {
            this.dispose();
        }
        this.notifyOppositeAdapters();
    };
    p.dispose = function() {
        this.isValid = false;
    };

    // Export to XML3D.data namespace
    XML3D.data.TransformDataAdapter = TransformDataAdapter;


    XML3D.data.DOMTransformFetcher = function(owner, attrName, dataName, onlyDataTransform){
        this.owner = owner;
        this.node = owner.node;
        this.attrName = attrName;
        this.dataName = dataName;
        this.adapterHandle = null;
        this.xflowRequest = null;
        this.onlyDataTransform = onlyDataTransform || false;
        this._bindedCallback = this._onChange.bind(this);
    }
    XML3D.data.DOMTransformFetcher.prototype.clear = function(){
        this.xflowRequest && this.xflowRequest.clear();
        this.xflowRequest = null;
        this.adapterHandle && this.adapterHandle.removeListener(this._bindedCallback)
    }

    XML3D.data.DOMTransformFetcher.prototype.update = function(){
        var newHandle = this.owner.getAdapterHandle(this.node.getAttribute(this.attrName), XML3D.data, 0);
        if(newHandle != this.adapterHandle){
            this.clear();
            this.adapterHandle = newHandle;
            if(newHandle)
                newHandle.addListener(this._bindedCallback)
        }
        this.updateMatrix();
    }

    XML3D.data.DOMTransformFetcher.prototype.updateMatrix = function(){
        this.owner.onTransformChange(this.attrName, this.getMatrix());
    }

    XML3D.data.DOMTransformFetcher.prototype.getMatrix = ( function () {
        var IDENTITY = XML3D.math.mat4.create();
        return function () {
            if(!this.onlyDataTransform){
                var cssMatrix = XML3D.css.getCSSMatrix(this.node);
                if (cssMatrix) {
                    return XML3D.css.convertCssToMat4(cssMatrix);
                }
            }
            var adapter;
            if(this.adapterHandle && (adapter = this.adapterHandle.getAdapter())){
                if(adapter.getXflowNode){
                    if(!this.xflowRequest)
                        this.xflowRequest = new Xflow.ComputeRequest(adapter.getXflowNode(),[this.dataName], this._bindedCallback);
                    var dataResult =  this.xflowRequest.getResult();
                    var transformData = (dataResult.getOutputData(this.dataName) && dataResult.getOutputData(this.dataName).getValue());
                    if(transformData)
                        return transformData;
                }
                if (adapter.getMatrix) {
                    return adapter.getMatrix();
                }
            }
            return this.onlyDataTransform ? null : IDENTITY;
        };
    }());

    XML3D.data.DOMTransformFetcher.prototype._onChange = function(){
        this.updateMatrix();
    }


}());


