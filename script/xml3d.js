// Create global symbol org
var org;
if (!org)
	org = {};
else if (typeof org != "object")
	throw new Error("org already exists and is not an object");

// Create global symbol org.xml3d
if (!org.xml3d)
	org.xml3d = {};
else if (typeof org.xml3d != "object")
	throw new Error("org.xml3d already exists and is not an object");

org.xml3d.xml3dNS = 'http://www.w3.org/2009/xml3d';
org.xml3d.xhtmlNS = 'http://www.w3.org/1999/xhtml';
org.xml3d.document = new org.xml3d.XML3DDocument(document);

org.xml3d.XML3DCanvas = function(x3dElem) {
	this.initContext = function(canvas) {
		org.xml3d.debug.logInfo("Initializing XML3DCanvas for [" + canvas.id
				+ "]");
		var gl = org.xml3d.gfx_webgl(canvas);
		if (!gl) {
			org.xml3d.debug.logError("No 3D context found...");
			this.canvasDiv.removeChild(canvas);
			return null;
		}
		return gl;
	};
	this.createHTMLCanvas = function(x3dElem) {
		org.xml3d.debug.logInfo("Creating canvas for X3D element...");
		var canvas = document.createElementNS(org.xml3d.xhtmlNS, 'canvas');
		canvas.setAttribute("class", "x3dom-canvas");
		this.canvasDiv.appendChild(canvas);
		x3dElem.parentNode.insertBefore(this.canvasDiv, x3dElem);
		var x, y, w, h, showStat;
		if ((x = x3dElem.getAttribute("x")) !== null) {
			canvas.style.left = x.toString();
		}
		if ((y = x3dElem.getAttribute("y")) !== null) {
			canvas.style.top = y.toString();
		}
		if ((w = x3dElem.getAttribute("width")) !== null) {
			canvas.style.width = this.canvasDiv.style.width = w.toString();
			canvas.setAttribute("width", canvas.style.width);
		}
		if ((h = x3dElem.getAttribute("height")) !== null) {
			canvas.style.height = this.canvasDiv.style.height = h.toString();
			canvas.setAttribute("height", canvas.style.height);
		}
		var id;
		if ((id = x3dElem.getAttribute("id")) !== null) {
			this.canvasDiv.setAttribute("class", "x3dom-canvasdiv");
			this.canvasDiv.id = "x3dom-" + id + "-canvasdiv";
			canvas.id = "x3dom-" + id + "-canvas";
		} else {
			var index = (document
					.getElementsByTagNameNS(org.xml3d.x3dNS, 'X3D').length + 1);
			this.canvasDiv.id = "x3dom-" + index + "-canvasdiv";
			canvas.id = "x3dom-" + index + "-canvas";
		}

		return canvas;
	};
	this.createStatDiv = function() {
		var statDiv = document.createElementNS(org.xml3d.xhtmlNS, 'div');
		statDiv.setAttribute("class", "x3dom-statdiv");
		statDiv.innerHTML = "0 fps";
		this.canvasDiv.appendChild(statDiv);
		statDiv.oncontextmenu = statDiv.onmousedown = function(evt) {
			evt.preventDefault();
			evt.stopPropagation();
			evt.returnValue = false;
			return false;
		};
		return statDiv;
	};
	this.x3dElem = x3dElem;
	this.root = null;
	this.canvasDiv = document.createElementNS(org.xml3d.xhtmlNS, 'div');
	this.canvas = this.createHTMLCanvas(x3dElem);
	this.canvas.parent = this;
	this.fps_t0 = new Date().getTime();
	this.gl = this.initContext(this.canvas);
	this.showStat = x3dElem.getAttribute("showStat");
	this.statDiv = (this.showStat !== null && this.showStat == "true") ? this
			.createStatDiv() : null;
};

org.xml3d.XML3DCanvas.prototype.onload = function() {
	if (!this.root)
		return;
	org.xml3d.debug.logInfo("Canvas loaded. Starting update");
	new org.xml3d.Xml3dSceneController(this.canvas, this.root);

	var x3dCanvas = this;
	setInterval(function() {
		x3dCanvas.tick();
	}, 16);
};

org.xml3d.XML3DCanvas.prototype.tick = function() {
	var d = new Date().getTime();
	var fps = 1000.0 / (d - this.fps_t0);
	if (this.statDiv) {
		this.statDiv.textContent = fps.toFixed(2) + ' fps';
	}
	this.fps_t0 = d;
	try {
		// this.doc.advanceTime(d / 1000);
		this.gl.renderScene(this.root);
	} catch (e) {
		org.xml3d.debug.logException(e);
		throw e;
	}
};

org.xml3d.XML3DCanvas.prototype.shutdown = function() {
	alert("TODO: shutdown");
};

(function() {
	var onload = function() {
		var x3ds = document.getElementsByTagNameNS(org.xml3d.xml3dNS, 'xml3d');
		x3ds = Array.map(x3ds, function(n) {
			return n;
		});
		var i = 0;
		var activateLog = false;
		for (i = 0; i < x3ds.length; i++) {
			var showLog = x3ds[i].getAttribute("showLog");
			if (showLog !== null && showLog == "true") {
				activateLog = true;
				break;
			}
		}
		if (activateLog) {
			org.xml3d.debug.activate();
		}
		org.xml3d.debug.logInfo("Found " + x3ds.length + " xml3d nodes...");
		for (i = 0; i < x3ds.length; i++) {
			var x3dcanvas = org.xml3d.document.createCanvas(x3ds[i]);
			if (x3dcanvas.gl === null) {
				var altDiv = document.createElement("div");
				altDiv.setAttribute("class", "x3dom-nox3d");
				var altP = document.createElement("p");
				altP
						.appendChild(document
								.createTextNode("WebGL is not yet supported in your browser. "));
				var aLnk = document.createElement("a");
				aLnk
						.setAttribute("href",
								"http://www.org.xml3d.org/?page_id=9");
				aLnk
						.appendChild(document
								.createTextNode("Follow link for a list of supported browsers... "));
				altDiv.appendChild(altP);
				altDiv.appendChild(aLnk);
				x3dcanvas.canvasDiv.appendChild(altDiv);
				if (x3dcanvas.statDiv) {
					x3dcanvas.canvasDiv.removeChild(x3dcanvas.statDiv);
				}
				var altImg = x3ds[i].getAttribute("altImg") || null;
				if (altImg) {
					var altImgObj = new Image();
					altImgObj.src = altImg;
					x3dcanvas.canvasDiv.style.backgroundImage = "url(" + altImg
							+ ")";
				} else {
				}
				continue;
			}
		}
		var ready = (function(eventType) {
			var evt = null;
			if (document.createEvent) {
				evt = document.createEvent("Events");
				evt.initEvent(eventType, true, true);
				document.dispatchEvent(evt);
			} else if (document.createEventObject) {
				evt = document.createEventObject();
				document.fireEvent('on' + eventType, evt);
			}
		})('load');
	};
	var onunload = function() {
		org.xml3d.document.onunload();
	};
	window.addEventListener('load', onload, false);
	window.addEventListener('unload', onunload, false);
	window.addEventListener('reload', onunload, false);
	// document.onkeypress = function(evt) {
	// for ( var i = 0; i < org.xml3d.canvases.length; i++) {
	// org.xml3d.canvases[i].doc.onKeyPress(evt.charCode);
	// }
	// return true;
	// };
})();

org.xml3d.gfx_webgl = (function() {
	function Context(ctx3d, canvas, name) {
		this.ctx3d = ctx3d;
		this.canvas = canvas;
		this.name = name;
	}
	Context.prototype.getName = function() {
		return this.name;
	};
	function setupContext(canvas) {
		org.xml3d.debug.logInfo("setupContext: canvas=" + canvas);
		var ctx = null;
		try {
			ctx = canvas.getContext('moz-webgl');
			if (ctx) {
				return new Context(ctx, canvas, 'moz-webgl');
			}
		} catch (ef) {
		}
		try {
			ctx = canvas.getContext('webkit-3d');
			if (ctx) {
				return new Context(ctx, canvas, 'webkit-3d');
			}
		} catch (es) {
		}
	}

	function getShaderProgram(gl, ids) {
		var shader = [];
		for ( var id = 0; id < 2; id++) {
			if (!g_shaders[ids[id]]) {
				org.xml3d.debug.logError('Cannot find shader ' + ids[id]);
				return;
			}
			if (g_shaders[ids[id]].type == 'vertex') {
				shader[id] = gl.createShader(gl.VERTEX_SHADER);
			} else if (g_shaders[ids[id]].type == 'fragment') {
				shader[id] = gl.createShader(gl.FRAGMENT_SHADER);
			} else {
				org.xml3d.debug
						.logError('Invalid shader type ' + g_shaders[id].type);
				return;
			}
			gl.shaderSource(shader[id], g_shaders[ids[id]].data);
			gl.compileShader(shader[id]);
		}
		var prog = gl.createProgram();
		gl.attachShader(prog, shader[0]);
		gl.attachShader(prog, shader[1]);
		gl.linkProgram(prog);
		var msg = gl.getProgramInfoLog(prog);
		if (msg) {
			org.xml3d.debug.logError(msg);
		}
		return wrapShaderProgram(gl, prog);
	}

	/*
	 * Context.prototype.setupShape = function(gl, shape) { if
	 * (org.xml3d.isa(shape._geometry, org.xml3d.nodeTypes.Text)) { var
	 * text_canvas = document.createElementNS( 'http://www.w3.org/1999/xhtml',
	 * 'canvas'); var text_ctx = text_canvas.getContext('2d'); var fontStyle =
	 * shape._geometry._fontStyle; var font_family = 'SANS';
	 * text_ctx.mozTextStyle = '48px ' + font_family; var i = 0; var text_w = 0;
	 * var string = shape._geometry._string; for (i = 0; i < string.length; ++i) {
	 * text_w = Math.max(text_w, text_ctx.mozMeasureText(string[i])); } var
	 * line_h = 1.2 * text_ctx.mozMeasureText('M'); var text_h = line_h *
	 * shape._geometry._string.length; text_canvas.width = Math.pow(2,
	 * Math.ceil(Math.log(text_w) / Math.log(2))); text_canvas.height =
	 * Math.pow(2, Math.ceil(Math.log(text_h) / Math.log(2)));
	 * text_ctx.fillStyle = '#000'; text_ctx.translate(0, line_h); for (i = 0; i <
	 * string.length; ++i) { text_ctx.mozDrawText(string[i]);
	 * text_ctx.translate(0, line_h); } document.body.appendChild(text_canvas);
	 * var ids = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, ids);
	 * gl.texImage2D(gl.TEXTURE_2D, 0, text_canvas); var w = text_w / text_h;
	 * var h = 1; var u = text_w / text_canvas.width; var v = text_h /
	 * text_canvas.height; shape._webgl = { positions : [ -w, -h, 0, w, -h, 0,
	 * w, h, 0, -w, h, 0 ], normals : [ 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1 ],
	 * indexes : [ 0, 1, 2, 2, 3, 0 ], texcoords : [ 0, v, u, v, u, 0, 0, 0 ],
	 * mask_texture : ids }; shape._webgl.shader = getShaderProgram(gl, [
	 * 'vs-x3d-textured', 'fs-x3d-textured' ]); } else { if (shape._webgl !==
	 * undefined) { return; } var tex = shape._appearance._texture; if (tex) {
	 * var texture = gl.createTexture(); var image = new Image(); image.src =
	 * tex._url; image.onload = function() { shape._webgl.texture = texture;
	 * gl.bindTexture(gl.TEXTURE_2D, texture); gl.texImage2D(gl.TEXTURE_2D, 0,
	 * image); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER,
	 * gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
	 * gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,
	 * gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,
	 * gl.REPEAT); }; } shape._webgl = { positions :
	 * shape._geometry._mesh._positions, normals :
	 * shape._geometry._mesh._normals, texcoords :
	 * shape._geometry._mesh._texCoords, colors : shape._geometry._mesh._colors,
	 * indexes : shape._geometry._mesh._indices, buffers : [ {}, {}, {}, {}, {} ] };
	 * if (tex) { if (shape._appearance._textureTransform === null) {
	 * shape._webgl.shader = getShaderProgram(gl, [ 'vs-x3d-textured',
	 * 'fs-x3d-textured' ]); } else { shape._webgl.shader = getShaderProgram(gl, [
	 * 'vs-x3d-textured-tt', 'fs-x3d-textured' ]); } } else if
	 * (shape._geometry._mesh._colors.length > 0) { shape._webgl.shader =
	 * getShaderProgram(gl, [ 'vs-x3d-vertexcolor', 'fs-x3d-vertexcolor' ]); }
	 * else { shape._webgl.shader = getShaderProgram(gl, [ 'vs-x3d-untextured',
	 * 'fs-x3d-untextured' ]); } var sp = shape._webgl.shader; if (sp.position
	 * !== undefined) { var positionBuffer = gl.createBuffer();
	 * shape._webgl.buffers[1] = positionBuffer; gl.bindBuffer(gl.ARRAY_BUFFER,
	 * positionBuffer); var vertices = new
	 * CanvasFloatArray(shape._webgl.positions); gl.bufferData(gl.ARRAY_BUFFER,
	 * vertices, gl.STATIC_DRAW); gl.bindBuffer(gl.ARRAY_BUFFER,
	 * positionBuffer); gl.vertexAttribPointer(sp.position, 3, gl.FLOAT, false,
	 * 0, 0); var indicesBuffer = gl.createBuffer(); shape._webgl.buffers[0] =
	 * indicesBuffer; var indexArray = new CanvasUnsignedShortArray(
	 * shape._webgl.indexes); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,
	 * indicesBuffer); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray,
	 * gl.STATIC_DRAW); delete vertices; delete indexArray; } if (sp.normal !==
	 * undefined) { var normalBuffer = gl.createBuffer();
	 * shape._webgl.buffers[2] = normalBuffer; var normals = new
	 * CanvasFloatArray(shape._webgl.normals); gl.bindBuffer(gl.ARRAY_BUFFER,
	 * normalBuffer); gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
	 * gl.vertexAttribPointer(sp.normal, 3, gl.FLOAT, false, 0, 0); delete
	 * normals; } if (sp.texcoord !== undefined) { var texcBuffer =
	 * gl.createBuffer(); shape._webgl.buffers[3] = texcBuffer; var texCoords =
	 * new CanvasFloatArray(shape._webgl.texcoords);
	 * gl.bindBuffer(gl.ARRAY_BUFFER, texcBuffer);
	 * gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
	 * gl.vertexAttribPointer(sp.texcoord, 2, gl.FLOAT, false, 0, 0); delete
	 * texCoords; } if (sp.color !== undefined) { var colorBuffer =
	 * gl.createBuffer(); shape._webgl.buffers[4] = colorBuffer; var colors =
	 * new CanvasFloatArray(shape._webgl.colors); gl.bindBuffer(gl.ARRAY_BUFFER,
	 * colorBuffer); gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
	 * gl.vertexAttribPointer(sp.color, 3, gl.FLOAT, false, 0, 0); delete
	 * colors; } } };
	 */
	Context.prototype.renderScene = function(scene) {
		var gl = this.ctx3d;
		gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		// TODO
		// var bgCol = scene.getSkyColor();
		// gl.clearColor(bgCol[0], bgCol[1], bgCol[2], bgCol[3]);
		gl.clearColor(0.5, 0.5, 0.5, 1.0);
		gl.clearDepth(1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT
				| gl.STENCIL_BUFFER_BIT);
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		gl.enable(gl.CULL_FACE);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		if (this.renderer === undefined || !this.renderer) {
			this.renderer = new org.xml3d.webgl.Renderer(scene, this.canvas, gl);
		}
		this.renderer.render();

		gl.disable(gl.BLEND);
		gl.disable(gl.DEPTH_TEST);

	};
	Context.prototype.shutdown = function(scene) {
		var gl = this.ctx3d;
		/*
		 * scene._collectDrawableObjects(org.xml3d.dataTypes.SFMatrix4.identity(),
		 * scene.drawableObjects); for ( var i = 0, n =
		 * scene.drawableObjects.length; i < n; i++) { var shape =
		 * scene.drawableObjects[i][1]; var sp = shape._webgl.shader; if
		 * (shape._webgl.texture !== undefined && shape._webgl.texture) {
		 * gl.deleteTexture(shape._webgl.texture); } if (sp.position !==
		 * undefined) { gl.deleteBuffer(shape._webgl.buffers[1]);
		 * gl.deleteBuffer(shape._webgl.buffers[0]); } if (sp.normal !==
		 * undefined) { gl.deleteBuffer(shape._webgl.buffers[2]); } if
		 * (sp.texcoord !== undefined) {
		 * gl.deleteBuffer(shape._webgl.buffers[3]); } if (sp.color !==
		 * undefined) { gl.deleteBuffer(shape._webgl.buffers[4]); } }
		 */
	};
	return setupContext;
})();

org.xml3d.Camera = function() {
	this.position = new org.xml3d.dataTypes.Vec3f(0.0, 0.0, 10.0);
	this.orientation = new org.xml3d.dataTypes.Quaternion(0.0, 0.0, 0.0, 1.0);
	this.fieldOfView = 0.78539816339744828;
	this.zFar = 100000;
	this.zNear = 0.1;

};

org.xml3d.Camera.prototype.getViewMatrix = function() {
	return this.orientation.toMatrix().transpose().mult(
			org.xml3d.dataTypes.SFMatrix4.translation(this.position.negate()));
};

org.xml3d.Camera.prototype.getProjectionMatrix = function(aspect) {
	if (this.projMatrix == null) {
		var fovy = this.fieldOfView;
		var zfar = this.zFar;
		var znear = this.zNear;
		var f = 1 / Math.tan(fovy / 2);
		this.projMatrix = new org.xml3d.dataTypes.SFMatrix4(f / aspect, 0, 0,
				0, 0, f, 0, 0, 0, 0, (znear + zfar) / (znear - zfar), 2 * znear
						* zfar / (znear - zfar), 0, 0, -1, 0);
	}
	return this.projMatrix;
};

org.xml3d.initFloat = function(value, defaultValue) {
	return value ? +value : defaultValue;
};

org.xml3d.initString = function(value, defaultValue) {
	return value ? value : defaultValue;
};

org.xml3d.initInt = function(value, defaultValue) {
	return value ? parseInt(value) : defaultValue;
};

org.xml3d.initBoolean = function(value, defaultValue) {
	return value ? value == "true" : defaultValue;
};

org.xml3d.initVec3f = function(value, x, y, z) {
	return value ? org.xml3d.dataTypes.Vec3f.parse(value)
			: new org.xml3d.dataTypes.Vec3f(x, y, z);
};

org.xml3d.initAxisAnglef = function(value, x, y, z, angle) {
	return value ? org.xml3d.dataTypes.Quaternion.parseAxisAngle(value)
			: org.xml3d.dataTypes.Quaternion.axisAngle(
					new org.xml3d.dataTypes.Vec3f(x, y, z), angle);
};

org.xml3d.initEnum = function(value, defaultValue, choice) {
	return (value && choice[value] !== undefined) ? choice[value]
			: defaultValue;
};

org.xml3d.initIntArray = function(value, defaultValue) {
	var exp = /([+\-0-9]+)/g;
	return value ? value.match(exp) : defaultValue;
	/*Array.forEach(Array.map(node.domElement.childNodes, function(n) {
		return (n.nodeType === Node.TEXT_NODE) ? n.nodeValue : null;
	}, this), function(c) {
		tmp += c;

	});
	node['_' + name] = tmp.match();
	for ( var i = 0; i < node.domElement.childNodes.length; i++) {
		node.domElement.removeChild(node.domElement.childNodes[i]);
	}*/

};

org.xml3d.initFloatArray = function(value, defaultValue) {
	var exp = /([+\-0-9eE\.]+)/g;
	return value ? value.match(exp) : defaultValue;
};

org.xml3d.initFloat3Array = function(value, defaultValue) {
	return org.xml3d.initFloatArray(value, defaultValue);
};

org.xml3d.initFloat2Array = function(value, defaultValue) {
	return org.xml3d.initFloatArray(value, defaultValue);
};

org.xml3d.initBoolArray = function(value, defaultValue) {
	return new Array();
};

org.xml3d.initAnyURI = function(node, defaultValue) {
	return org.xml3d.initString(node, defaultValue);
};
