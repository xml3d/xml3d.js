//Adapter for <texture>
(function() {

	var XML3DTextureRenderAdapter = function(factory, node) {
		xml3d.webgl.RenderAdapter.call(this, factory, node);
		this.gl = factory.renderer.handler.gl;
		this.factory = factory;
		this.node = node;
		this.dataAdapter = factory.renderer.dataFactory.getAdapter(this.node);
	};
	
	xml3d.createClass(XML3DTextureRenderAdapter, xml3d.webgl.RenderAdapter);
	XML3DTextureRenderAdapter.prototype.notifyChanged = function(evt) {
		//TODO: pass changes to renderer
		/*if (evt.attribute == "src") {
			this.destroy();
			this.info = this.initTexture();
			this.factory.renderer.requestRedraw();
		} else if (evt.attribute == "node") {
			if (evt.newValue == "") {
				this.node = null;
				this.destroy();
				this.factory.renderer.requestRedraw();
			}
		}*/
		var shaderAdapter = this.factory.getAdapter(this.node.parentElement);
		if (shaderAdapter)
			shaderAdapter.notifyChanged(evt);
	};
	
	XML3DTextureRenderAdapter.prototype.getDataTable = function() {
		return this.dataAdapter.createDataTable();
	};
	
	XML3DTextureRenderAdapter.prototype.destroy = function() {
		if (!this.info || this.info.handle === null)
			return;
		
		this.gl.deleteTexture(this.info.handle);
		this.info = null;
		this.bind = function(texUnit) { return; };
		this.unbind = function(texUnit) { return; };
	};
	
	XML3DTextureRenderAdapter.prototype.dispose = function(evt) {
		//TODO: tell renderer to dispose
	};
	
	xml3d.webgl.XML3DTextureRenderAdapter = XML3DTextureRenderAdapter;
}());
