
// Adapter for <view>
xml3d.webgl.XML3DViewRenderAdapter = function(factory, node) {
	xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.zFar = 100000;
	this.zNear = 0.1;
	this.viewMatrix = null;
	this.projMatrix = null;
	this._parentTrans = vec3.create([0,0,0]);
	this._parentRot = quat4.create([0,0,0,1]);
	this._parentTransform = null;
	this.isValid = true;
};
xml3d.webgl.XML3DViewRenderAdapter.prototype = new xml3d.webgl.RenderAdapter();
xml3d.webgl.XML3DViewRenderAdapter.prototype.constructor = xml3d.webgl.XML3DViewRenderAdapter;

xml3d.webgl.XML3DViewRenderAdapter.prototype.getViewMatrix = function() {

	if (this.viewMatrix == null)
	{
		var pos = this.node.position._data;
		var orient = this.node.orientation;
		var v = mat4.rotate(mat4.translate(mat4.identity(mat4.create()),pos), orient.angle, orient.axis._data);

		var p = this.factory.getAdapter(this.node.parentNode);
		this.parentTransform = p.applyTransformMatrix(mat4.identity(mat4.create()));
		//console.log(mat4.str(this.parentTransform));
		if(this.parentTransform) {
		    v = mat4.multiply(this.parentTransform, v);
		}
		this.viewMatrix = mat4.inverse(v);
	}
	return this.viewMatrix;
};


xml3d.webgl.XML3DViewRenderAdapter.prototype.getProjectionMatrix = function(aspect) {
	if (this.projMatrix == null) {
		var fovy = this.node.fieldOfView;
		var zfar = this.zFar;
		var znear = this.zNear;
		var f = 1 / Math.tan(fovy / 2);
		this.projMatrix = mat4.create([f / aspect, 0, 0, 0, 
			                           0, f, 0, 0, 
			                           0, 0, (znear + zfar) / (znear - zfar), -1, 
			                           0, 0, 2 * znear* zfar / (znear - zfar), 0]);
	}
	return this.projMatrix;
};

xml3d.webgl.XML3DViewRenderAdapter.prototype.getModelViewMatrix = function(model) {
	return mat4.multiply(this.getViewMatrix(), model, mat4.create());
};

xml3d.webgl.XML3DViewRenderAdapter.prototype.getNormalMatrix = function(modelViewMatrix) {
	var invt = mat4.inverse(modelViewMatrix, mat4.create());
	return mat4.toMat3(invt);
};

xml3d.webgl.XML3DViewRenderAdapter.prototype.getModelViewProjectionMatrix = function(modelViewMatrix) {
	return mat4.multiply(this.projMatrix, modelViewMatrix, mat4.create());
};

xml3d.webgl.XML3DViewRenderAdapter.prototype.notifyChanged = function(evt) {	
	var me = this;
	var targets = {};
	
	targets["internal:transform"] = function() {
		me.parentTransform = evt.newValue;
		me.viewMatrix = null;
	};
	targets["orientation"] = targets["position"] = function() {
		me.viewMatrix = null;
	};
	targets["fieldOfView"] = function() {
		me.projMatrix = null;
	};
	
	var target = null;
	if (evt instanceof XML3D_InternalMutationEvent)
		target = "internal:"+evt.type;
	else
		target = evt.attrName;
	
	if (targets[target]) {
		targets[target]();
	}
	else {
		xml3d.debug.logWarning("Unhandled event in group adapter: "+evt.eventType + " for parameter "+target);
	}
	
	this.factory.handler.redraw("View changed");
};


