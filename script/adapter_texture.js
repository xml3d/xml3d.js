

//Adapter for <texture>
org.xml3d.webgl.XML3DTextureRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.gl = factory.renderer.handler.gl;
	this.info = this.initTexture(factory, node);
	this.bind = function(texUnit) { return; };
	this.unbind = function(texUnit) { return; };
};
org.xml3d.webgl.XML3DTextureRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DTextureRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DTextureRenderAdapter;

org.xml3d.webgl.XML3DTextureRenderAdapter.prototype.notifyChanged = function(evt) {
	//this.shaderAdapter.notifyChanged(evt);
};

org.xml3d.webgl.XML3DTextureRenderAdapter.prototype._bind = function(texUnit) {
	this.gl.activeTexture(this.gl.TEXTURE0 + texUnit);
	this.gl.bindTexture(this.info.glType, this.info.handle);
};

org.xml3d.webgl.XML3DTextureRenderAdapter.prototype._unbind = function(texUnit) {
	this.gl.activeTexture(this.gl.TEXTURE0 + texUnit);
	this.gl.bindTexture(this.info.glType, null);
};

org.xml3d.webgl.XML3DTextureRenderAdapter.prototype.initTexture = function(factory, node) {
	var dataTable = factory.renderer.dataFactory.getAdapter(node).createDataTable();
	var gl = this.gl;
	
	if (!dataTable[node.name]) {
		org.xml3d.debug.logError("No data table entry found for "+node.name);
		return;
	}
	
	var opt = {
			isDepth          : false,
			depthMode        : gl.LUMINANCE,
			depthCompareMode : gl.COMPARE_R_TO_TEXTURE,
			depthCompareFunc : gl.LEQUAL,
			flipY            : true,
			premultiplyAlpha : true	
	};
	
	opt.minFilter = dataTable[node.name].options.minFilter;
	opt.magFilter = dataTable[node.name].options.magFilter;
	opt.wrapS = dataTable[node.name].options.wrapS;
	opt.wrapT = dataTable[node.name].options.wrapT;
	opt.generateMipmap = dataTable[node.name].options.generateMipmap;
	
	//Create texture handle
	var texture = gl.createTexture();
	var info = { valid : false };
	var loaded = this.factory.handler.redraw;
	
	//Load texture img(s)
	//var image = node.firstElementChild;
	var image = new Image();
	var texAdapter = this;
	image.onload = function() {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		
		//gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, opt.wrapS);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, opt.wrapT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, opt.minFilter);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, opt.magFilter);
		
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		
		if (opt.generateMipmap) {
			gl.generateMipmap(gl.TEXTURE_2D);
		}
		
		gl.bindTexture(gl.TEXTURE_2D, null);
		
		info.handle = texture;
		info.options = opt;
		info.valid = true;
		info.glType = gl.TEXTURE_2D;
		info.format = gl.RGBA;	
		
		texAdapter.bind = texAdapter._bind;
		texAdapter.unbind = texAdapter._unbind;
		
		loaded();
	};
	image.src = dataTable[node.name].src[0];
	
	return info;
};

org.xml3d.webgl.XML3DTextureRenderAdapter.prototype.destroy = function() {
	if (!this.info || this.info.handle === null)
		return;
	
	this.gl.deleteTexture(this.info.handle);
	this.info = null;
};
