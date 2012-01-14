
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
		var m = new XML3DMatrix();

		var t = n.translation;
		var c = n.center;
		var s = n.scale;
		var so = n.scaleOrientation.toMatrix();
		
		this.matrix = m.translate(t.x, t.y, t.z)
		  .multiply(m.translate(c.x, c.y, c.z)).multiply(n.rotation.toMatrix())
		  .multiply(so).multiply(m.scale(s.x, s.y, s.z))
		  .multiply(so.inverse()).multiply(m.translate(-c.x, -c.y, -c.z));
		
		this.matrix = this.matrix.transpose();
		
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