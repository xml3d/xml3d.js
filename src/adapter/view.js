
// Adapter for <view>
org.xml3d.webgl.XML3DViewRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.zFar = 100000;
	this.zNear = 0.1;
	this.viewMatrix = null;
	this.projMatrix = null;
	this._parentTrans = new XML3DVec3(0,0,0);
	this._parentRot = new XML3DRotation(0,0,1,0);
	this._parentTransform = null;
	this.__defineSetter__("parentTransform", function(incoming){
		var i = mat4.transpose(incoming._data);
		this._parentRot = XML3DRotation.fromMatrix(i).negate();
		this._parentTrans =  new XML3DVec3(i.m14, i.m24, i.m34).negate();
    });
	this.isValid = true;
};
org.xml3d.webgl.XML3DViewRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DViewRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DViewRenderAdapter;

org.xml3d.webgl.XML3DViewRenderAdapter.prototype.getViewMatrix = function() {

	if (this.viewMatrix == null)
	{
		var negPos      = this.node.position.negate().add(this._parentTrans);
		var negOr = this.node.orientation.negate().multiply(this._parentRot);
		
		this.viewMatrix = negOr.toMatrix().multiply(
				new XML3DMatrix().translate(negPos.x, negPos.y, negPos.z));
		this.viewMatrix._data = mat4.transpose(this.viewMatrix._data);
	}
	return this.viewMatrix;
};


org.xml3d.webgl.XML3DViewRenderAdapter.prototype.getProjectionMatrix = function(aspect) {
	if (this.projMatrix == null) {
		var fovy = this.node.fieldOfView;
		var zfar = this.zFar;
		var znear = this.zNear;
		var f = 1 / Math.tan(fovy / 2);
		this.projMatrix = new XML3DMatrix(f / aspect, 0, 0,
				0, 0, f, 0, 0, 0, 0, (znear + zfar) / (znear - zfar), 2 * znear
						* zfar / (znear - zfar), 0, 0, -1, 0);
	}
	return this.projMatrix;
};

org.xml3d.webgl.XML3DViewRenderAdapter.prototype.getModelViewMatrix = function(model) {
	//TODO: Check matrix multiplication in datatypes... transpose shouldn't be necessary here
	//TODO: cleanup dataypes in this adapter
	return mat4.multiply(this.getViewMatrix()._data, mat4.transpose(model));
};

org.xml3d.webgl.XML3DViewRenderAdapter.prototype.getNormalMatrixGL = function(modelViewMatrix) {
	var invt = mat4.inverse(modelViewMatrix);
	return mat4.toMat3(mat4.transpose(invt));
};

org.xml3d.webgl.XML3DViewRenderAdapter.prototype.getModelViewProjectionMatrix = function(modelViewMatrix) {
	return mat4.multiply(this.projMatrix._data, modelViewMatrix);
};

org.xml3d.webgl.XML3DViewRenderAdapter.prototype.notifyChanged = function(e) {
	if (e.attribute == "orientation" || e.attribute == "position")
		this.viewMatrix = null;
	else if (e.attribute == "fieldOfView")
		this.projMatrix = null;
	else if (e.attribute == "parenttransform") {
        this.parentTransform = newValue;
		this.viewMatrix = null;
    } else {
		this.viewMatrix = null;
		this.projMatrix = null;
	}
	this.factory.handler.redraw("View changed");
};


