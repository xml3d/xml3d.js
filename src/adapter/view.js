
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
		var i = incoming._data;
		this._parentRot = XML3DRotation.fromMatrix(i).negate()._data;
		this._parentTrans =  new XML3DVec3(i.m14, i.m24, i.m34).negate()._data;
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
		var negPos = vec3.add(vec3.negate(pos, vec3.create()), this._parentTrans);
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
		this.projMatrix = mat4.create([f / aspect, 0, 0,
				0, 0, f, 0, 0, 0, 0, (znear + zfar) / (znear - zfar), 2 * znear
						* zfar / (znear - zfar), 0, 0, -1, 0]);
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
	return mat4.multiply(mat4.transpose(this.projMatrix, mat4.create()), modelViewMatrix, mat4.create());
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


