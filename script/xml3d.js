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

org.xml3d.XML3DCanvas = function(xml3dElement) {
	this.xml3dElem = xml3dElement;
	this.root = null;

	// Place xml3dElement inside an invisble div
	this.hideDiv = document.createElementNS(org.xml3d.xhtmlNS, 'div');
	xml3dElement.parentNode.insertBefore(this.hideDiv, xml3dElement);
	this.hideDiv.appendChild(xml3dElement);
	this.hideDiv.style.display = "none";

	// Create canvas and append it to the document created before
	this.canvas = org.xml3d.XML3DCanvas.createHTMLCanvas(xml3dElement);
	this.hideDiv.parentNode.insertBefore(this.canvas, this.hideDiv);

	this.fps_t0 = new Date().getTime();
	this.gl = this.initContext(this.canvas);
};

org.xml3d.XML3DCanvas.prototype.initContext = function(canvas) {
	org.xml3d.debug.logInfo("Initializing XML3DCanvas for [" + canvas.id + "]");
	var gl = org.xml3d.gfx_webgl(canvas);
	if (!gl) {
		org.xml3d.debug.logError("No 3D context found...");
		this.hideDiv.parentNode.removeChild(canvas);
		return null;
	}
	return gl;
};

org.xml3d.XML3DCanvas.createHTMLCanvas = function(x3dElem) {
	org.xml3d.debug.logInfo("Creating canvas for X3D element...");
	var canvas = document.createElementNS(org.xml3d.xhtmlNS, 'canvas');
	canvas.setAttribute("class", "xml3d-canvas");

	var x, y, w, h, showStat;

	if ((w = x3dElem.getAttribute("style")) !== null) {
		org.xml3d.debug.logInfo("Setting style");
		canvas.setAttribute("style", x3dElem.getAttribute("style"));
	}

	org.xml3d.debug.logInfo("Canvas getAttribute style: "
			+ canvas.getAttribute("style"));
	org.xml3d.debug.logInfo("Canvas style: " + canvas.style);
	org.xml3d.debug.logInfo("Canvas style width: " + canvas.style.width);
	org.xml3d.debug.logInfo("Canvas style height: " + canvas.style.height);

	var sides = [ "top", "right", "bottom", "left" ];
	var colorStr = styleStr = widthStr = paddingStr = "";
	for (i in sides) {
		colorStr += org.xml3d.util.getStyle(x3dElem, "border-" + sides[i]
				+ "-color")
				+ " ";
		styleStr += org.xml3d.util.getStyle(x3dElem, "border-" + sides[i]
				+ "-style")
				+ " ";
		widthStr += org.xml3d.util.getStyle(x3dElem, "border-" + sides[i]
				+ "-width")
				+ " ";
		paddingStr += org.xml3d.util.getStyle(x3dElem, "padding-" + sides[i])
				+ " ";
		// org.xml3d.debug.logInfo("Computed border color: " + sides[i] + ": " +
		// colorStr);
		// org.xml3d.debug.logInfo("Computed border style: " + sides[i] + ": " +
		// styleStr);
		// org.xml3d.debug.logInfo("Computed border width: " + sides[i] + ": " +
		// widthStr);
		// org.xml3d.debug.logInfo("Computed padding: " + sides[i] + ": " +
		// paddingStr);
	}
	canvas.style.borderColor = colorStr;
	canvas.style.borderStyle = styleStr;
	canvas.style.borderWidth = widthStr;
	canvas.style.padding = paddingStr;
	canvas.style.backgroundColor = org.xml3d.util.getStyle(x3dElem,
			"background-Color");

	if ((w = x3dElem.getAttribute("width")) !== null) {
		canvas.style.width = w.toString();
		org.xml3d.debug.logInfo("Init w:" + canvas.style.width);
	}
	if ((h = x3dElem.getAttribute("height")) !== null) {

		canvas.style.height = h.toString();
	}
	canvas.setAttribute("height", canvas.style.height);
	canvas.setAttribute("width", canvas.style.width);

	return canvas;
};

org.xml3d.XML3DCanvas.prototype.createStatDiv = function() {
	var statDiv = document.createElementNS(org.xml3d.xhtmlNS, 'div');
	statDiv.setAttribute("class", "xml3d-statdiv");
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
			var colorStr = org.xml3d.util.getStyle(root,
					"background-color");
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
		x3ds = Array.map(x3ds, function(n) {
			return n;
		});
		
		var activateLog = false;
		for (var i = 0; i < x3ds.length; i++) {
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
		
		if (x3ds.length) {
			if (x3ds[0].style !== undefined) {
				org.xml3d.debug.logInfo("Using native implementation...");
				new org.xml3d.Xml3dSceneController(x3ds[0], x3ds[0]);
				return;
			}
		}
		
		for (i = 0; i < x3ds.length; i++) {
			var x3dcanvas = org.xml3d.document.createCanvas(x3ds[i]);
			if (x3dcanvas.gl === null) {
				var altDiv = document.createElement("div");
				altDiv.setAttribute("class", "xml3d-nox3d");
				var altP = document.createElement("p");
				altP
						.appendChild(document
								.createTextNode("WebGL is not yet supported in your browser. "));
				var aLnk = document.createElement("a");
				aLnk.setAttribute("href", "http://www.xml3d.org/");
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
		// org.xml3d.debug.logInfo("setupContext: canvas=" + canvas);
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
