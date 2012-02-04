//Adapter for <texture>
(function() {

	var XML3DTextureRenderAdapter = function(factory, node) {
		xml3d.webgl.RenderAdapter.call(this, factory, node);
		this.gl = factory.renderer.handler.gl;
		this.factory = factory;
		this.node = node;
		this.info = this.initTexture();
		this.bind = function(texUnit) { return; };
		this.unbind = function(texUnit) { return; };
	};
	
	xml3d.createClass(XML3DTextureRenderAdapter, xml3d.webgl.RenderAdapter);
	XML3DTextureRenderAdapter.prototype.notifyChanged = function(evt) {
		if (evt.attribute == "src") {
			this.destroy();
			this.info = this.initTexture();
			this.factory.renderer.requestRedraw();
		} else if (evt.attribute == "node") {
			if (evt.newValue == "") {
				this.node = null;
				this.destroy();
				this.factory.renderer.requestRedraw();
			}
		}
	};
	
	XML3DTextureRenderAdapter.prototype._bind = function(texUnit) {
		this.gl.activeTexture(this.gl.TEXTURE0 + texUnit);
		this.gl.bindTexture(this.info.glType, this.info.handle);
	};
	
	XML3DTextureRenderAdapter.prototype._unbind = function(texUnit) {
		this.gl.activeTexture(this.gl.TEXTURE0 + texUnit);
		this.gl.bindTexture(this.info.glType, null);
	};
	
	XML3DTextureRenderAdapter.prototype.initTexture = function() {
		var dataTable = this.factory.renderer.dataFactory.getAdapter(this.node).createDataTable();
		var gl = this.gl;
		var name = this.node.name;
		
		if (!dataTable) {
			return;
		}
	
		if (!dataTable[name]) {
			xml3d.debug.logError("No data table entry found for "+name);
			return;
		}
		
		var opt = {
				isDepth          : false,
				minFilter 		 : dataTable[name].options.minFilter,
				magFilter		 : dataTable[name].options.magFilter,
				wrapS			 : dataTable[name].options.wrapS,
				wrapT			 : dataTable[name].options.wrapT,
				generateMipmap	 : dataTable[name].options.generateMipmap,
				flipY            : true,
				premultiplyAlpha : true	
		};
		
		//Create texture handle
		var texture = gl.createTexture();
		var info = { valid : false };
		var loaded = this.factory.handler.redraw;
		
		//Load texture img(s)
		var image = new Image();
		var texAdapter = this;
		//TODO: handle this in-thread
		image.onload = function() {
			//FIXME: createtex2dfromimage is now in shadermanager... move tex creation to shader manager?
			//texAdapter.info = createTex2DFromImage(gl, texture, image, opt);
			
			texAdapter.bind = texAdapter._bind;
			texAdapter.unbind = texAdapter._unbind;
			
			loaded();
		};
		image.src = dataTable[name].src[0];
		
		return info;
	};
	
	XML3DTextureRenderAdapter.prototype.destroy = function() {
		if (!this.info || this.info.handle === null)
			return;
		
		this.gl.deleteTexture(this.info.handle);
		this.info = null;
		this.bind = function(texUnit) { return; };
		this.unbind = function(texUnit) { return; };
	};
	
	xml3d.webgl.XML3DTextureRenderAdapter = XML3DTextureRenderAdapter;
}());
