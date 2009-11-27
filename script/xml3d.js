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
org.xml3d.webglNS = 'http://www.w3.org/2009/xml3d/webgl';
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
	this.createHTMLCanvas = function(x3dElem, sibling) {
		org.xml3d.debug.logInfo("Creating canvas for X3D element...");
		var canvas = document.createElementNS(org.xml3d.xhtmlNS, 'canvas');
		canvas.setAttribute("class", "x3dom-canvas");
		this.canvasDiv.appendChild(canvas);
		sibling.parentNode.insertBefore(this.canvasDiv, sibling);
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
	
	var hideDiv = document.createElementNS(org.xml3d.xhtmlNS, 'div');
	x3dElem.parentNode.insertBefore(hideDiv, x3dElem);
	hideDiv.appendChild(x3dElem);
	hideDiv.style.display ="none";
	
	this.root = null;
	this.canvasDiv = document.createElementNS(org.xml3d.xhtmlNS, 'div');
	this.canvas = this.createHTMLCanvas(x3dElem, hideDiv);
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
	if (org.xml3d.Xml3dSceneController !== undefined)
		new org.xml3d.Xml3dSceneController(this.canvas, this.root);
	
	var root = this.root;
	this.root.getBackgroundColor = function() {
		if (RGBColor && document.defaultView
				&& document.defaultView.getComputedStyle) {
			var colorStr = document.defaultView.getComputedStyle(
					root.domElement, "").getPropertyValue("background-color");
			var color = new RGBColor(colorStr);
			return color.toGLAlpha();
		}
	};

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
	this.gl.shutdown();
};

(function() {
	var onload = function() {
		var x3ds = document.getElementsByTagNameNS(org.xml3d.xml3dNS, 'xml3d');
		if (x3ds.length)
		{
			if (x3ds.item(0).style !== undefined)
			{
			  org.xml3d.debug.logInfo("Using native implementation...");
			  return;
			}
		}
		x3ds = Array.map(x3ds, function(n) {
			return n;
		});
		var i = 0;
		var activateLog = false;
		for (i = 0; i < x3ds.length; i++) {
			var showLog = x3ds[i].getAttributeNS(org.xml3d.webglNS, "showLog");
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
		//org.xml3d.debug.logInfo("setupContext: canvas=" + canvas);
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
	
	Context.prototype.renderScene = function(scene) {
		var gl = this.ctx3d;
		gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		var bgCol = scene.getBackgroundColor();
		if (bgCol)
			gl.clearColor(bgCol[0], bgCol[1], bgCol[2], bgCol[3]);
		else
			gl.clearColor(0.0, 0.0, 0.0, 1.0);
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
		
		if (this.renderer) {
			this.renderer.dispose();
		}
	};
	return setupContext;
})();


