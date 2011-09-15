
// Adapter for <view>
org.xml3d.webgl.XML3DViewRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.zFar = 100000;
	this.zNear = 0.1;
	this.viewMatrix = null;
	this.projMatrix = null;
	this.parentTransform = null;
	this.isValid = true;
};
org.xml3d.webgl.XML3DViewRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DViewRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DViewRenderAdapter;

org.xml3d.webgl.XML3DViewRenderAdapter.prototype.getViewMatrix = function() {

	if (this.viewMatrix == null)
	{
		var negPos      = this.node.position.negate();
		this.viewMatrix = this.node.orientation.negate().toMatrix().multiply(
				new XML3DMatrix().translate(negPos.x, negPos.y, negPos.z));
				
		if (this.parentTransform) {
			this.viewMatrix = this.viewMatrix.multiply(this.parentTransform.transpose());		
		}
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
	return this.getViewMatrix().multiply(model.transpose());
};

org.xml3d.webgl.XML3DViewRenderAdapter.prototype.getNormalMatrixGL = function(modelViewMatrix) {
	var invt = modelViewMatrix.inverse().transpose();
	return invt.to3x3GL();
};

org.xml3d.webgl.XML3DViewRenderAdapter.prototype.getModelViewProjectionMatrix = function(modelViewMatrix) {
	return this.projMatrix.multiply(modelViewMatrix);
};

org.xml3d.webgl.XML3DViewRenderAdapter.prototype.notifyChanged = function(e) {
	if (e.attribute == "orientation" || e.attribute == "position")
		this.viewMatrix = null;
	else if (e.attribute == "fieldOfView")
		this.projMatrix = null;
	else {
		this.viewMatrix = null;
		this.projMatrix = null;
	}
	this.factory.handler.redraw("View changed");
};

org.xml3d.webgl.XML3DViewRenderAdapter.prototype.internalNotifyChanged = function(what, newValue) {
	if (what == "parenttransform") {
		this.parentTransform = newValue;		
		this.viewMatrix = null;
	}
};

