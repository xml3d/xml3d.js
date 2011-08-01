
// Adapter for <view>
org.xml3d.webgl.XML3DViewRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.zFar = 100000;
	this.zNear = 0.1;
	this.viewMatrix = null;
	this.projMatrix = null;
	this.parentTransform = null;
	this._adjustedParentTransform = null;
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
				
		if (this._adjustedParentTransform) {
			this.viewMatrix = this.viewMatrix.multiply(this._adjustedParentTransform);
		}
	}
	return new sglM4(this.viewMatrix.toGL());
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
	return new sglM4(this.projMatrix.toGL());
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

org.xml3d.webgl.XML3DViewRenderAdapter.prototype.__defineSetter__("parentTransform", (function(value) {
	this._parentTransform = value;
	
	if (!value)
		return;
	
	var p = this._parentTransform;
	var mat = new XML3DMatrix(
	p[0], p[4], p[8], p[12], 
	p[1], p[5], p[9], p[13], 
	p[2], p[6], p[10], p[14],
	p[3], p[7], p[11], p[15]);

	this._adjustedParentTransform = mat;

}));

