
//Adapter for <texture>
org.xml3d.webgl.XML3DTextureRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	//this.shaderAdapter = factory.getAdapter(node.parentNode, org.xml3d.webgl.Renderer.prototype);
	this.info = this.initTexture(factory, node);
	this.gl = factory.renderer.handler.gl;
};
org.xml3d.webgl.XML3DTextureRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DTextureRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DTextureRenderAdapter;
org.xml3d.webgl.XML3DTextureRenderAdapter.prototype.notifyChanged = function(evt) {
	//this.shaderAdapter.notifyChanged(evt);
};

org.xml3d.webgl.XML3DTextureRenderAdapter.prototype.bind = function(texUnit) {
	this.gl.activeTexture(this.gl.TEXTURE0 + texUnit);
	this.gl.bindTexture(this.info.glType, this.info.handle);
};

org.xml3d.webgl.XML3DTextureRenderAdapter.prototype.unbind = function(texUnit) {
	this.gl.activeTexture(this.gl.TEXTURE0 + texUnit);
	this.gl.bindTexture(this.info.glType, null);
};

org.xml3d.webgl.XML3DTextureRenderAdapter.prototype.initTexture = function(factory, node) {
	var dataTable = factory.renderer.dataFactory.getAdapter(node).createDataTable();
	var gl = this.gl;
	var opt = {
			minFilter        : dataTable.options.minFilter,
			magFilter        : dataTable.options.magFilter,
			wrapS            : dataTable.options.wrapS,
			wrapT            : dataTable.options.wrapT,
			isDepth          : false,
			depthMode        : gl.LUMINANCE,
			depthCompareMode : gl.COMPARE_R_TO_TEXTURE,
			depthCompareFunc : gl.LEQUAL,
			generateMipmap   : dataTable.options.generateMipmap,
			flipY            : true,
			premultiplyAlpha : false	
	};
	var info = { valid : false };
	var loaded = this.factory.handler.redraw;
	
	//Load texture img(s)
	var img = new Image();
	img.onload = function() {
		var texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		
		//TODO: flipY
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, opt.wrapS);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, opt.wrapT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, opt.minFilter);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, opt.magFilter);
		
		if (opt.generateMipmap) {
			gl.generateMipmap(gl.TEXTURE_2D);
		}
		
		gl.bindTexture(gl.TEXTURE_2D, null);
		
		info.handle = texture;
		info.options = opt;
		info.valid = true;
		info.glType = gl.TEXTURE_2D;
		info.format = gl.RGBA;	
		
		loaded();
	};
	img.src = dataTable.imgSrc;
	
	return info;
	
};

org.xml3d.webgl.XML3DTextureRenderAdapter.prototype.destroy = function() {
	if (!this.info || this.info.handle === null)
		return;
	
	this.gl.deleteTexture(this.info.handle);
	this.info = null;
};
