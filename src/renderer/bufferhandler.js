/*******************************************
 * Class xml3d.webgl.XML3DBufferHandler 
 * 
 * The XML3DBufferHandler is an abstraction layer between the renderer and WebGL. It handles all operations
 * on Framebuffer Objects but doesn't store any of these internally. FBOs are returned and expected as a
 * 'struct' containing the following information:
 * 
 * 		handle			: The WebGL handle returned when gl.createFramebuffer() is called
 * 		valid			: A flag indicating whether this FBO is complete
 * 		width			: Width of this FBO
 * 		height			: Height of this FBO
 * 		colorTarget		
 * 		depthTarget 	
 * 		stencilTarget	: The targets that will be rendered to, can be either a RenderBuffer or Texture2D contained
 * 						  in another 'struct' with fields "handle" and "isTexture"
 * 
 * @author Christian Schlinkmann
 *******************************************/

xml3d.webgl.MAX_PICK_BUFFER_WIDTH = 512;
xml3d.webgl.MAX_PICK_BUFFER_HEIGHT = 512;

xml3d.webgl.XML3DBufferHandler = function(gl, renderer, shaderManager) {
	this.renderer = renderer;
	this.gl = gl;
	this.shaderManager = shaderManager;
};

xml3d.webgl.XML3DBufferHandler.prototype.createPickingBuffer = function(width, height) {
	var gl = this.gl;
	var scale = 1.0;
	
	var hDiff = height - xml3d.webgl.MAX_PICK_BUFFER_HEIGHT;
	var wDiff = width - xml3d.webgl.MAX_PICK_BUFFER_WIDTH;
	
	if (hDiff > 0 || wDiff > 0) {
		if (hDiff > wDiff) {
			scale = xml3d.webgl.MAX_PICK_BUFFER_HEIGHT / height;
		} else {
			scale = xml3d.webgl.MAX_PICK_BUFFER_WIDTH / width;
		}	
	}
	
	width = Math.floor(width * scale);
	height = Math.floor(height * scale);
	
	return this.createFrameBuffer(width, height, gl.RGBA, gl.DEPTH_COMPONENT16, null, { depthAsRenderbuffer : true }, scale );
};

xml3d.webgl.XML3DBufferHandler.prototype.createShadowBuffer = function() {
	//TODO: this
};

xml3d.webgl.XML3DBufferHandler.prototype.createFrameBuffer = function(width, height, colorFormat, depthFormat, stencilFormat, options, scale) {
	
	var gl = this.gl;	
	options = this.fillOptions(options);
	
	var handle = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, handle);
	
	//Create targets
	var colorTarget = { handle : null, isTexture : false };
	if (colorFormat) {
		colorTargets = [];
		if (options.colorAsRenderbuffer) {
			var ct = gl.createRenderbuffer();
			gl.bindRenderbuffer(gl.RENDERBUFFER, ct);
			gl.renderbufferStorage(gl.RENDERBUFFER, colorFormat, width, height);
			gl.bindRenderbuffer(gl.RENDERBUFFER, null);
			
			gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, ct);
			
			colorTarget.handle = ct;
			colorTarget.isTexture = false;		
		} else {
			//opt.generateMipmap = opt.generateColorsMipmap;
			var ctex = this.shaderManager.createTex2DFromData(gl, colorFormat, width, height, gl.RGBA, 
					gl.UNSIGNED_BYTE, null, options);
			
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, ctex.handle, 0);
			
			colorTarget.handle = handle;
			colorTarget.isTexture = true;
		}	
	}
	
	var depthTarget = { handle : null, isTexture : false };
	if (depthFormat) {
		options.isDepth = true;
		if (options.depthAsRenderbuffer) {
			var dt = gl.createRenderbuffer();
			gl.bindRenderbuffer(gl.RENDERBUFFER, dt);
			gl.renderbufferStorage(gl.RENDERBUFFER, depthFormat, width, height);
			gl.bindRenderbuffer(gl.RENDERBUFFER, null);
			
			gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, dt);
			
			depthTarget.handle = dt;
			depthTarget.isTexture = false;
		} else {
			//opt.generateMipmap = opt.generateDepthMipmap;			
			var dtex = this.shaderManager.createTex2DFromData(gl, depthFormat, width, height, 
									gl.DEPTH_COMPONENT, gl.FLOAT, null, options);
			
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, dtex.handle, 0);
			
			depthTarget.handle = dtex.handle;
			depthTarget.isTexture = true;
		}
	}
	
	var stencilTarget = { handle : null, isTexture : false };
	if (stencilFormat) {
		options.isDepth = false;
		if (options.stencilAsRenderbuffer) {
			var st = gl.createRenderbuffer();
			gl.bindRenderbuffer(gl.RENDERBUFFER, st);
			gl.renderbufferStorage(gl.RENDERBUFFER, stencilFormat, width, height);
			gl.bindRenderbuffer(gl.RENDERBUFFER, null);
			
			gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.RENDERBUFFER, st);			
			
			stencilTarget.handle = st;
			stencilTarget.isTexture = false;
		}
		else {
			//opt.generateMipmap = opt.generateStencilMipmap;			
			var stex = this.shaderManager.createTex2DFromData(gl, stencilFormat, width, height, 
									gl.STENCIL_COMPONENT, gl.UNSIGNED_BYTE, null, options);
			
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.TEXTURE_2D, stex.handle, 0);
			
			stencilTarget.handle = stex.handle;
			stencilTarget.isTexture = true;
		}
	}
	
	//Finalize framebuffer creation
	var fbStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
	
	switch (fbStatus) {
	    case gl.FRAMEBUFFER_COMPLETE:
	        break;
	    case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
	        xml3d.debug.logError("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_ATTACHMENT");
	        break;
	    case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
	    	xml3d.debug.logError("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT");
	        break;
	    case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
	    	xml3d.debug.logError("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_DIMENSIONS");
	        break;
	    case gl.FRAMEBUFFER_UNSUPPORTED:
	    	xml3d.debug.logError("Incomplete framebuffer: FRAMEBUFFER_UNSUPPORTED");
	        break;
	    default:
	    	xml3d.debug.logError("Incomplete framebuffer: " + status);
	}
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	var fbo = {};
	fbo.handle = handle;
	fbo.valid = (fbStatus == gl.FRAMEBUFFER_COMPLETE);
	fbo.width = width;
	fbo.height = height;
	fbo.colorTarget = colorTarget;
	fbo.depthTarget = depthTarget;
	fbo.stencilTarget = stencilTarget;
	fbo.scale = scale;

	return fbo;
};

xml3d.webgl.XML3DBufferHandler.prototype.destroyFrameBuffer = function(fbo) {
	if (!fbo.handle)
		return;
	
	var gl = this.gl;
	gl.deleteFramebuffer(fbo.handle);
	
	if(fbo.colorTarget !== null) {
		if (fbo.colorTarget.isTexture) 
			gl.deleteTexture(fbo.colorTarget.handle);
		else
			gl.deleteRenderBuffer(fbo.colorTarget.handle);
	}
	if(fbo.depthTarget !== null) {
		if (fbo.depthTarget.isTexture) 
			gl.deleteTexture(fbo.depthTarget.handle);
		else
			gl.deleteRenderBuffer(fbo.depthTarget.handle);
	}
	if(fbo.stencilTarget !== null) {
		if (fbo.stencilTarget.isTexture) 
			gl.deleteTexture(fbo.stencilTarget.handle);
		else
			gl.deleteRenderBuffer(fbo.stencilTarget.handle);
	}
	
};

xml3d.webgl.XML3DBufferHandler.prototype.fillOptions = function(options) {
	var gl = this.gl;
	var opt =  {
		wrapS             	  : gl.CLAMP_TO_EDGE,
		wrapT                 : gl.CLAMP_TO_EDGE,
		minFilter             : gl.NEAREST,
		magFilter             : gl.NEAREST,
		depthMode             : gl.LUMINANCE,
		depthCompareMode      : gl.COMPARE_R_TO_TEXTURE,
		depthCompareFunc      : gl.LEQUAL,
		colorsAsRenderbuffer  : false,
		depthAsRenderbuffer   : false,
		stencilAsRenderbuffer : false,
		isDepth               : false
	};
	
	for (var item in options) {
		opt[item] = options[item];
	}
	return opt;
};



