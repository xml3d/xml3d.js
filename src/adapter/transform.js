
// Adapter for <transform>
org.xml3d.webgl.XML3DTransformRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.matrix = null;
	this.listeners = new Array();
	this.isValid = true;
};
org.xml3d.webgl.XML3DTransformRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DTransformRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DTransformRenderAdapter;

org.xml3d.webgl.XML3DTransformRenderAdapter.prototype.getMatrix = function() {
	if (!this.matrix) {
		var n         = this.node;
		var m = mat4.identity(mat4.create());

		var t = n.translation._data;
		var c = n.center._data;
		var s = n.scale._data;
		var so = n.scaleOrientation.toMatrix()._data;
	
		var tmp = mat4.multiply(mat4.multiply(mat4.multiply(mat4.multiply(mat4.multiply(mat4.multiply(		
				mat4.inverse(so),
				mat4.translate(m, vec3.negate(c))),
				mat4.scale(m, s)),
				so),
				n.rotation.toMatrix()._data),
				mat4.translate(m, c)),
				mat4.translate(m,t));
				
		this.matrix = mat4.transpose(tmp);
		
	}
	return this.matrix;
};

org.xml3d.webgl.XML3DTransformRenderAdapter.prototype.notifyChanged = function(e) {
	this.matrix = null;
	this.matrix = this.getMatrix();
	for (var i=0; i<this.listeners.length; i++) {
		if (this.listeners[i].isValid)
			this.listeners[i].internalNotifyChanged("transform", this.matrix);
		else {
			this.listeners.splice(i,1);
			i--;
		}
	}
	this.factory.renderer.requestRedraw("Transformation changed.");
};
org.xml3d.webgl.XML3DTransformRenderAdapter.prototype.dispose = function() {
	this.isValid = false;
};