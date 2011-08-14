
//Adapter for <texture>
org.xml3d.webgl.XML3DTextureRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.gl = factory.renderer.handler.gl;
	this.factory = factory;
	this.node = node;
	this.info = this.initTexture();
	this.bind = function(texUnit) { return; };
	this.unbind = function(texUnit) { return; };
};
org.xml3d.webgl.XML3DTextureRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DTextureRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DTextureRenderAdapter;

org.xml3d.webgl.XML3DTextureRenderAdapter.prototype.notifyChanged = function(evt) {
	if (evt.attribute == "src") {
		this.destroy();
		this.info = this.initTexture();
	}
};

org.xml3d.webgl.XML3DTextureRenderAdapter.prototype._bind = function(texUnit) {
	this.gl.activeTexture(this.gl.TEXTURE0 + texUnit);
	this.gl.bindTexture(this.info.glType, this.info.handle);
};

org.xml3d.webgl.XML3DTextureRenderAdapter.prototype._unbind = function(texUnit) {
	this.gl.activeTexture(this.gl.TEXTURE0 + texUnit);
	this.gl.bindTexture(this.info.glType, null);
};

org.xml3d.webgl.XML3DTextureRenderAdapter.prototype.initTexture = function() {
	var dataTable = this.factory.renderer.dataFactory.getAdapter(this.node).createDataTable();
	var gl = this.gl;
	var name = this.node.name;
	
	if (!dataTable[name]) {
		org.xml3d.debug.logError("No data table entry found for "+name);
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
	
	opt.minFilter = dataTable[name].options.minFilter;
	opt.magFilter = dataTable[name].options.magFilter;
	opt.wrapS = dataTable[name].options.wrapS;
	opt.wrapT = dataTable[name].options.wrapT;
	opt.generateMipmap = dataTable[name].options.generateMipmap;
	
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
	image.src = dataTable[name].src[0];
	
	return info;
};

org.xml3d.webgl.XML3DTextureRenderAdapter.prototype.destroy = function() {
	if (!this.info || this.info.handle === null)
		return;
	
	this.gl.deleteTexture(this.info.handle);
	this.info = null;
	this.bind = function(texUnit) { return; };
	this.unbind = function(texUnit) { return; };
};
