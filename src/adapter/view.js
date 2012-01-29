
// Adapter for <view>
org.xml3d.webgl.XML3DViewRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.zFar = 100000;
	this.zNear = 0.1;
	this.viewMatrix = null;
	this.projMatrix = null;
	this._parentTrans = vec3.create([0,0,0]);
	this._parentRot = quat4.create([0,0,0,1]);
	this._parentTransform = null;
	this.__defineSetter__("parentTransform", function(incoming){
		//TODO: rotation.fromMatrix is missing now, what to do?
		return;
		this._parentRot = new XML3DRotation().fromMatrix(incoming)._data;
		this._parentTrans = vec3.create([incoming[12], incoming[13], incoming[14]]);
    });
	this.isValid = true;
};
org.xml3d.webgl.XML3DViewRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DViewRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DViewRenderAdapter;

org.xml3d.webgl.XML3DViewRenderAdapter.prototype.getViewMatrix = function() {

	if (this.viewMatrix == null)
	{
		var pos = this.node.position._data;
		var orient = this.node.orientation._data;
		var negPos = vec3.negate(vec3.add(pos, this._parentTrans, vec3.create()));
		var negOr = quat4.multiply(orient, this._parentRot, quat4.create());
		quat4.inverse(negOr);
		
		this.viewMatrix = mat4.multiply(
							quat4.toMat4(negOr), 
							mat4.translate(mat4.identity(mat4.create()), negPos)
						  );
	}
	return this.viewMatrix;
};


org.xml3d.webgl.XML3DViewRenderAdapter.prototype.getProjectionMatrix = function(aspect) {
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

org.xml3d.webgl.XML3DViewRenderAdapter.prototype.getModelViewMatrix = function(model) {
	return mat4.multiply(this.getViewMatrix(), model, mat4.create());
};

org.xml3d.webgl.XML3DViewRenderAdapter.prototype.getNormalMatrix = function(modelViewMatrix) {
	var invt = mat4.inverse(modelViewMatrix, mat4.create());
	return mat4.toMat3(invt);
};

org.xml3d.webgl.XML3DViewRenderAdapter.prototype.getModelViewProjectionMatrix = function(modelViewMatrix) {
	return mat4.multiply(this.projMatrix, modelViewMatrix, mat4.create());
};

org.xml3d.webgl.XML3DViewRenderAdapter.prototype.notifyChanged = function(evt) {	
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
		org.xml3d.debug.logWarning("Unhandled event in group adapter: "+evt.eventType + " for parameter "+target);
	}
	
	this.factory.handler.redraw("View changed");
};


