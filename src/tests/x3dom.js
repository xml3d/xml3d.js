/** X3DOM JavaScript Library 1.0, http://www.x3dom.org/ */
if (!Array.forEach) {
	Array.forEach = function(array, fun, thisp) {
		var len = array.length;
		for ( var i = 0; i < len; i++) {
			if (i in array) {
				fun.call(thisp, array[i], i, array);
			}
		}
	};
}
if (!Array.map) {
	Array.map = function(array, fun, thisp) {
		var len = array.length;
		var res = [];
		for ( var i = 0; i < len; i++) {
			if (i in array) {
				res[i] = fun.call(thisp, array[i], i, array);
			}
		}
		return res;
	};
}
if (!Array.filter) {
	Array.filter = function(array, fun, thisp) {
		var len = array.length;
		var res = [];
		for ( var i = 0; i < len; i++) {
			if (i in array) {
				var val = array[i];
				if (fun.call(thisp, val, i, array)) {
					res.push(val);
				}
			}
		}
		return res;
	};
}
var x3dom = {
	canvases : []
};
x3dom.x3dNS = 'http://www.web3d.org/specifications/x3d-namespace';
x3dom.x3dextNS = 'http://philip.html5.org/x3d/ext';
x3dom.xsltNS = 'http://www.w3.org/1999/XSL/x3dom.Transform';
x3dom.xhtmlNS = 'http://www.w3.org/1999/xhtml';
x3dom.X3DCanvas = function(x3dElem) {
	this.initContext = function(canvas) {
		x3dom.debug.logInfo("Initializing X3DCanvas for [" + canvas.id + "]");
		var gl = x3dom.gfx_webgl(canvas);
		if (!gl) {
			x3dom.debug.logError("No 3D context found...");
			this.canvasDiv.removeChild(canvas);
			return null;
		}
		return gl;
	};
	this.createHTMLCanvas = function(x3dElem) {
		x3dom.debug.logInfo("Creating canvas for (X)3D element...");
		var canvas = document.createElement('canvas');
		canvas.setAttribute("class", "x3dom-canvas");
		this.canvasDiv.appendChild(canvas);
		this.canvasDiv.setAttribute("class", "x3dom-canvasdiv");
		var userStyle = x3dElem.getAttribute("style");
		if (userStyle) {
			this.canvasDiv.setAttribute("style", userStyle);
		}
		x3dElem.parentNode.insertBefore(this.canvasDiv, x3dElem);
		var x, y, w, h;
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
		var id = x3dElem.getAttribute("id");
		if (id !== null) {
			this.canvasDiv.id = "x3dom-" + id + "-canvasdiv";
			canvas.id = "x3dom-" + id + "-canvas";
		} else {
			var index = new Date().getTime();
			this.canvasDiv.id = "x3dom-" + index + "-canvasdiv";
			canvas.id = "x3dom-" + index + "-canvas";
		}
		return canvas;
	};
	this.createStatDiv = function() {
		var statDiv = document.createElement('div');
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
	this.canvasDiv = document.createElement('div');
	this.canvas = this.createHTMLCanvas(x3dElem);
	this.canvas.parent = this;
	this.fps_t0 = new Date().getTime();
	this.gl = this.initContext(this.canvas);
	this.doc = null;
	var runtimeEnabled = x3dElem.getAttribute("runtimeEnabled");
	if (runtimeEnabled !== null) {
		this.hasRuntime = (runtimeEnabled.toLowerCase() == "true");
	} else {
		this.hasRuntime = x3dElem.hasRuntime;
	}
	if (this.gl === null) {
		this.hasRuntime = false;
	}
	this.showStat = x3dElem.getAttribute("showStat");
	this.statDiv = (this.showStat !== null && this.showStat == "true") ? this
			.createStatDiv() : null;
	if (this.canvas !== null && this.gl !== null && this.hasRuntime) {
		this.canvas.mouse_dragging = false;
		this.canvas.mouse_button = 0;
		this.canvas.mouse_drag_x = 0;
		this.canvas.mouse_drag_y = 0;
		this.canvas.oncontextmenu = function(evt) {
			evt.preventDefault();
			evt.stopPropagation();
			evt.returnValue = false;
			return false;
		};
		this.canvas.addEventListener('mousedown', function(evt) {
			switch (evt.button) {
			case 0:
				this.mouse_button = 1;
				break;
			case 1:
				this.mouse_button = 4;
				break;
			case 2:
				this.mouse_button = 2;
				break;
			default:
				this.mouse_button = 0;
				break;
			}
			this.mouse_drag_x = evt.layerX;
			this.mouse_drag_y = evt.layerY;
			this.mouse_dragging = true;
			if (evt.shiftKey) {
				this.mouse_button = 1;
			}
			if (evt.ctrlKey) {
				this.mouse_button = 4;
			}
			if (evt.altKey) {
				this.mouse_button = 2;
			}
			this.parent.doc.onMousePress(this.mouse_drag_x, this.mouse_drag_y,
					this.mouse_button);
			this.parent.doc.needRender = true;
			window.status = this.id + ' DOWN: ' + evt.layerX + ", "
					+ evt.layerY;
			evt.preventDefault();
			evt.stopPropagation();
			evt.returnValue = false;
		}, false);
		this.canvas.addEventListener('mouseup', function(evt) {
			this.mouse_button = 0;
			this.mouse_dragging = false;
			this.parent.doc.onMouseRelease(this.mouse_drag_x,
					this.mouse_drag_y, this.mouse_button);
			this.parent.doc.needRender = true;
			evt.preventDefault();
			evt.stopPropagation();
			evt.returnValue = false;
		}, false);
		this.canvas.addEventListener('mouseout', function(evt) {
			this.mouse_button = 0;
			this.mouse_dragging = false;
			this.parent.doc.onMouseOut(this.mouse_drag_x, this.mouse_drag_y,
					this.mouse_button);
			this.parent.doc.needRender = true;
			evt.preventDefault();
			evt.stopPropagation();
			evt.returnValue = false;
		}, false);
		this.canvas.addEventListener('dblclick',
				function(evt) {
					this.mouse_button = 0;
					this.mouse_drag_x = evt.layerX;
					this.mouse_drag_y = evt.layerY;
					this.mouse_dragging = false;
					this.parent.doc.onDoubleClick(this.mouse_drag_x,
							this.mouse_drag_y);
					this.parent.doc.needRender = true;
					window.status = this.id + ' DBL: ' + evt.layerX + ", "
							+ evt.layerY;
					evt.preventDefault();
					evt.stopPropagation();
					evt.returnValue = false;
				}, false);
		this.canvas.addEventListener('mousemove', function(evt) {
			window.status = this.id + ' MOVE: ' + evt.layerX + ", "
					+ evt.layerY;
			if (!this.mouse_dragging) {
				return;
			}
			this.mouse_drag_x = evt.layerX;
			this.mouse_drag_y = evt.layerY;
			if (evt.shiftKey) {
				this.mouse_button = 1;
			}
			if (evt.ctrlKey) {
				this.mouse_button = 4;
			}
			if (evt.altKey) {
				this.mouse_button = 2;
			}
			this.parent.doc.onDrag(this.mouse_drag_x, this.mouse_drag_y,
					this.mouse_button);
			this.parent.doc.needRender = true;
			evt.preventDefault();
			evt.stopPropagation();
			evt.returnValue = false;
		}, false);
		this.canvas.addEventListener('DOMMouseScroll', function(evt) {
			this.mouse_drag_y += 2 * evt.detail;
			this.parent.doc.onDrag(this.mouse_drag_x, this.mouse_drag_y, 2);
			this.parent.doc.needRender = true;
			window.status = this.id + ' SCROLL: ' + evt.detail;
			evt.preventDefault();
			evt.stopPropagation();
			evt.returnValue = false;
		}, false);
	}
};
x3dom.X3DCanvas.prototype.tick = function() {
	var d = new Date().getTime();
	var fps = 1000.0 / (d - this.fps_t0);
	this.fps_t0 = d;
	try {
		this.doc.advanceTime(d / 1000);
		if (this.doc.needRender) {
			if (this.statDiv) {
				this.statDiv.textContent = fps.toFixed(2) + ' fps';
			}
			this.doc.needRender = false;
			this.doc.render(this.gl);
		} else {
			if (this.statDiv) {
				this.statDiv.textContent = 'dlc: ' + this.doc.downloadCount;
			}
		}
	} catch (e) {
		x3dom.debug.logException(e);
		throw e;
	}
};
x3dom.X3DCanvas.prototype.load = function(uri, sceneElemPos) {
	this.doc = new x3dom.X3DDocument(this.canvas, this.gl);
	var x3dCanvas = this;
	this.doc.onload = function() {
		x3dom.debug.logInfo("loaded '" + uri + "'");
		if (x3dCanvas.hasRuntime) {
			setInterval(function() {
				x3dCanvas.tick();
			}, 16);
		} else {
			x3dCanvas.tick();
		}
	};
	{
		this.x3dElem.render = function() {
			x3dCanvas.doc.render(x3dCanvas.gl);
		};
		this.x3dElem.context = x3dCanvas.gl.ctx3d;
	}
	this.doc.onerror = function() {
		alert('Failed to load X3D document');
	};
	this.doc.load(uri, sceneElemPos);
};
x3dom.userAgentFeature = {
	supportsDOMAttrModified : false
};
(function() {
	var onload = function() {
		var x3ds = document.getElementsByTagName('X3D');
		var w3sg = document.getElementsByTagName('webSG');
		if (window.navigator.userAgent.match(/webkit/i)) {
			x3dom.debug
					.logInfo("Active DOMAttrModifiedEvent workaround for webkit ");
			x3dom.userAgentFeature.supportsDOMAttrModified = false;
		}
		x3ds = Array.map(x3ds, function(n) {
			n.hasRuntime = true;
			return n;
		});
		w3sg = Array.map(w3sg, function(n) {
			n.hasRuntime = false;
			return n;
		});
		var i = 0;
		for (i = 0; i < w3sg.length; i++) {
			x3ds.push(w3sg[i]);
		}
		var activateLog = false;
		for (i = 0; i < x3ds.length; i++) {
			var showLog = x3ds[i].getAttribute("showLog");
			if (showLog !== null && showLog.toLowerCase() == "true") {
				activateLog = true;
				break;
			}
		}
		if (activateLog) {
			x3dom.debug.activate();
		}
		if (x3dom.versionInfo !== undefined) {
			x3dom.debug.logInfo("X3Dom version " + x3dom.versionInfo.version
					+ " Rev. " + x3dom.versionInfo.svnrevision);
		}
		x3dom.debug.logInfo("Found " + (x3ds.length - w3sg.length)
				+ " X3D and " + w3sg.length + " (experimental) WebSG nodes...");
		for (i = 0; i < x3ds.length; i++) {
			var x3dcanvas = new x3dom.X3DCanvas(x3ds[i]);
			if (x3dcanvas.gl === null) {
				var altDiv = document.createElement("div");
				altDiv.setAttribute("class", "x3dom-nox3d");
				var altP = document.createElement("p");
				altP
						.appendChild(document
								.createTextNode("WebGL is not yet supported in your browser. "));
				var aLnk = document.createElement("a");
				aLnk.setAttribute("href", "http://www.x3dom.org/?page_id=9");
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
				}
				continue;
			}
			var t0 = new Date().getTime();
			x3dcanvas.load(x3ds[i], i);
			x3dom.canvases.push(x3dcanvas);
			var t1 = new Date().getTime() - t0;
			x3dom.debug.logInfo("Time for setup and init of GL element no. "
					+ i + ": " + t1 + " ms.");
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
		for ( var i = 0; i < x3dom.canvases.length; i++) {
			x3dom.canvases[i].doc.shutdown(x3dom.canvases[i].gl);
		}
	};
	window.addEventListener('load', onload, false);
	window.addEventListener('unload', onunload, false);
	window.addEventListener('reload', onunload, false);
	document.onkeypress = function(evt) {
		for ( var i = 0; i < x3dom.canvases.length; i++) {
			if (x3dom.canvases[i].hasRuntime) {
				x3dom.canvases[i].doc.onKeyPress(evt.charCode);
				x3dom.canvases[i].doc.needRender = true;
			}
		}
		return true;
	};
	if (window.location.pathname.lastIndexOf(".xhtml") > 0) {
		document.__getElementById = document.getElementById;
		document.getElementById = function(id) {
			var obj = this.__getElementById(id);
			if (!obj) {
				var elems = this.getElementsByTagName("*");
				for ( var i = 0; i < elems.length && !obj; i++) {
					if (elems[i].getAttribute("id") === id) {
						obj = elems[i];
					}
				}
			}
			return obj;
		};
	}
})();
x3dom.debug = {
	INFO : "INFO",
	WARNING : "WARNING",
	ERROR : "ERROR",
	EXCEPTION : "EXCEPTION",
	isActive : false,
	isFirebugAvailable : false,
	isSetup : false,
	numLinesLogged : 0,
	maxLinesToLog : 400,
	logContainer : null,
	setup : function() {
		if (x3dom.debug.isSetup) {
			return;
		}
		try {
			if (console) {
				x3dom.debug.isFirebugAvailable = true;
			}
		} catch (err) {
			x3dom.debug.isFirebugAvailable = false;
		}
		x3dom.debug.setupLogContainer();
		x3dom.debug.isSetup = true;
	},
	activate : function() {
		x3dom.debug.isActive = true;
		var aDiv = document.createElement("div");
		aDiv.style.clear = "both";
		aDiv.appendChild(document.createTextNode("\r\n"));
		document.body.appendChild(aDiv);
		document.body.appendChild(x3dom.debug.logContainer);
	},
	setupLogContainer : function() {
		x3dom.debug.logContainer = document.createElement("div");
		x3dom.debug.logContainer.id = "x3dom_logdiv";
		x3dom.debug.logContainer.style.border = "2px solid olivedrab";
		x3dom.debug.logContainer.style.height = "180px";
		x3dom.debug.logContainer.style.padding = "4px";
		x3dom.debug.logContainer.style.overflow = "auto";
		x3dom.debug.logContainer.style.whiteSpace = "pre-wrap";
		x3dom.debug.logContainer.style.fontFamily = "sans-serif";
		x3dom.debug.logContainer.style.fontSize = "x-small";
		x3dom.debug.logContainer.style.color = "#00ff00";
		x3dom.debug.logContainer.style.backgroundColor = "black";
		x3dom.debug.logContainer.style.clear = "both";
	},
	doLog : function(msg, logType) {
		if (!x3dom.debug.isActive) {
			return;
		}
		if (x3dom.debug.numLinesLogged === x3dom.debug.maxLinesToLog) {
			msg = "Maximum number of log lines (=" + x3dom.debug.maxLinesToLog
					+ ") reached. Deactivating logging...";
		}
		if (x3dom.debug.numLinesLogged > x3dom.debug.maxLinesToLog) {
			return;
		}
		var node = document.createElement("p");
		node.style.margin = 0;
		node.innerHTML = logType + ": " + msg;
		x3dom.debug.logContainer.insertBefore(node,
				x3dom.debug.logContainer.firstChild);
		if (x3dom.debug.isFirebugAvailable) {
			switch (logType) {
			case x3dom.debug.INFO:
				console.info(msg);
				break;
			case x3dom.debug.WARNING:
				console.warn(msg);
				break;
			case x3dom.debug.ERROR:
				console.error(msg);
				break;
			case x3dom.debug.EXCEPTION:
				console.debug(msg);
				break;
			default:
				break;
			}
		}
		x3dom.debug.numLinesLogged++;
	},
	logInfo : function(msg) {
		x3dom.debug.doLog(msg, x3dom.debug.INFO);
	},
	logWarning : function(msg) {
		x3dom.debug.doLog(msg, x3dom.debug.WARNING);
	},
	logError : function(msg) {
		x3dom.debug.doLog(msg, x3dom.debug.ERROR);
	},
	logException : function(msg) {
		x3dom.debug.doLog(msg, x3dom.debug.EXCEPTION);
	},
	assert : function(c, msg) {
		if (!c) {
			x3dom.debug.doLog("Assertion failed in "
					+ x3dom.debug.assert.caller.name + ': ' + msg,
					x3dom.debug.WARNING);
		}
	}
};
x3dom.debug.setup();
try {
	WebGLFloatArray;
} catch (e) {
	try {
		WebGLArrayBuffer = CanvasArrayBuffer;
		WebGLByteArray = CanvasByteArray;
		WebGLUnsignedByteArray = CanvasUnsignedByteArray;
		WebGLShortArray = CanvasShortArray;
		WebGLUnsignedShortArray = CanvasUnsignedShortArray;
		WebGLIntArray = CanvasIntArray;
		WebGLUnsignedIntArray = CanvasUnsignedIntArray;
		WebGLFloatArray = CanvasFloatArray;
	} catch (e) {
	}
}
x3dom.gfx_webgl = (function() {
	function Context(ctx3d, canvas, name) {
		this.ctx3d = ctx3d;
		this.canvas = canvas;
		this.name = name;
	}
	Context.prototype.getName = function() {
		return this.name;
	};
	function setupContext(canvas) {
		var validContextNames = [ 'moz-webgl', 'webkit-3d',
				'experimental-webgl', 'webgl' ];
		var ctx = null;
		var ctxAttribs = {
			alpha : true,
			depth : true,
			stencil : true,
			antialias : true,
			premultipliedAlpha : false
		};
		for ( var i = 0; i < validContextNames.length; i++) {
			try {
				ctx = canvas.getContext(validContextNames[i], ctxAttribs);
				if (ctx) {
					return new Context(ctx, canvas, 'moz-webgl');
				}
			} catch (e) {
			}
		}
		return null;
	}
	var g_shaders = {};
	g_shaders['vs-x3d-bg-texture'] = {
		type : "vertex",
		data : "attribute vec3 position;" + "varying vec2 fragTexCoord;" + ""
				+ "void main(void) {"
				+ "    gl_Position = vec4(position.xy, 0.0, 1.0);"
				+ "    vec2 texCoord = (position.xy + 1.0) * 0.5;"
				+ "    fragTexCoord = texCoord;" + "}"
	};
	g_shaders['fs-x3d-bg-texture'] = {
		type : "fragment",
		data : "uniform sampler2D tex;" + "varying vec2 fragTexCoord;" + ""
				+ "void main(void) {"
				+ "    gl_FragColor = texture2D(tex, fragTexCoord);" + "}"
	};
	g_shaders['vs-x3d-bg-textureCube'] = {
		type : "vertex",
		data : "attribute vec3 position;"
				+ "uniform mat4 modelViewProjectionMatrix;"
				+ "varying vec3 fragNormal;"
				+ ""
				+ "void main(void) {"
				+ "    fragNormal = (vec4(normalize(position), 0.0)).xyz;"
				+ "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);"
				+ "}"
	};
	g_shaders['fs-x3d-bg-textureCube'] = {
		type : "fragment",
		data : "uniform samplerCube tex;"
				+ "varying vec3 fragNormal;"
				+ ""
				+ "void main(void) {"
				+ "    vec3 normal = -reflect(normalize(fragNormal), vec3(0.0,0.0,1.0));"
				+ "    if (abs(normal.y) >= abs(normal.x) && abs(normal.y) >= abs(normal.z))"
				+ "        normal.x *= -1.0;"
				+ "    gl_FragColor = textureCube(tex, normal);" + "}"
	};
	g_shaders['vs-x3d-textured'] = {
		type : "vertex",
		data : "attribute vec3 position;"
				+ "attribute vec3 normal;"
				+ "attribute vec2 texcoord;"
				+ "varying vec3 fragNormal;"
				+ "varying vec3 fragLightVector;"
				+ "varying vec3 fragEyeVector;"
				+ "varying vec2 fragTexCoord;"
				+ "uniform float sphereMapping;"
				+ "uniform mat4 modelViewProjectionMatrix;"
				+ "uniform mat4 modelViewMatrix;"
				+ "uniform vec3 lightDirection;"
				+ "uniform vec3 eyePosition;"
				+ "uniform mat4 matPV;"
				+ "varying vec4 projCoord;"
				+ ""
				+ "void main(void) {"
				+ "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);"
				+ "    fragNormal = (modelViewMatrix * vec4(normal, 0.0)).xyz;"
				+ "    fragLightVector = -lightDirection;"
				+ "    fragEyeVector = eyePosition - (modelViewMatrix * vec4(position, 1.0)).xyz;"
				+ "    if (sphereMapping == 1.0) {"
				+ "        fragTexCoord = 0.5 + fragNormal.xy / 2.0;"
				+ "    }"
				+ "    else {"
				+ "       fragTexCoord = texcoord;"
				+ "    }"
				+ "    projCoord = matPV * vec4(position+0.5*normalize(normal), 1.0);"
				+ "}"
	};
	g_shaders['vs-x3d-textured-tt'] = {
		type : "vertex",
		data : "attribute vec3 position;"
				+ "attribute vec3 normal;"
				+ "attribute vec2 texcoord;"
				+ "varying vec3 fragNormal;"
				+ "varying vec3 fragLightVector;"
				+ "varying vec3 fragEyeVector;"
				+ "varying vec2 fragTexCoord;"
				+ "uniform float sphereMapping;"
				+ "uniform mat4 texTrafoMatrix;"
				+ "uniform mat4 modelViewProjectionMatrix;"
				+ "uniform mat4 modelViewMatrix;"
				+ "uniform vec3 lightDirection;"
				+ "uniform vec3 eyePosition;"
				+ "uniform mat4 matPV;"
				+ "varying vec4 projCoord;"
				+ ""
				+ "void main(void) {"
				+ "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);"
				+ "    fragNormal = (modelViewMatrix * vec4(normal, 0.0)).xyz;"
				+ "    fragLightVector = -lightDirection;"
				+ "    fragEyeVector = eyePosition - (modelViewMatrix * vec4(position, 1.0)).xyz;"
				+ "    if (sphereMapping == 1.0) {"
				+ "        fragTexCoord = 0.5 + fragNormal.xy / 2.0;"
				+ "    }"
				+ "    else {"
				+ "       fragTexCoord = (texTrafoMatrix * vec4(texcoord, 1.0, 1.0)).xy;"
				+ "    }"
				+ "    projCoord = matPV * vec4(position+0.5*normalize(normal), 1.0);"
				+ "}"
	};
	g_shaders['fs-x3d-textured'] = {
		type : "fragment",
		data : "uniform float ambientIntensity;"
				+ "uniform vec3 diffuseColor;"
				+ "uniform vec3 emissiveColor;"
				+ "uniform float shininess;"
				+ "uniform vec3 specularColor;"
				+ "uniform float sphereMapping;"
				+ "uniform float alpha;"
				+ "uniform float lightOn;"
				+ "uniform sampler2D tex;"
				+ "uniform sampler2D sh_tex;"
				+ "uniform float shadowIntensity;"
				+ ""
				+ "varying vec3 fragNormal;"
				+ "varying vec3 fragLightVector;"
				+ "varying vec3 fragEyeVector;"
				+ "varying vec2 fragTexCoord;"
				+ "varying vec4 projCoord;"
				+ ""
				+ "float PCF_Filter(vec3 projectiveBiased, float filterWidth)"
				+ "{"
				+ "    float stepSize = 2.0 * filterWidth / 3.0;"
				+ "    float blockerCount = 0.0;"
				+ "    projectiveBiased.x -= filterWidth;"
				+ "    projectiveBiased.y -= filterWidth;"
				+ "    for (float i=0.0; i<3.0; i++)"
				+ "    {"
				+ "        for (float j=0.0; j<3.0; j++)"
				+ "        {"
				+ "            projectiveBiased.x += (j*stepSize);"
				+ "            projectiveBiased.y += (i*stepSize);"
				+ "            vec4 shCol = texture2D(sh_tex, (1.0+projectiveBiased.xy)*0.5);"
				+ "            float z = (shCol.a * 16777216.0 + shCol.r * 65536.0 + shCol.g * 256.0 + shCol.b) / 16777216.0;"
				+ "            if (z < projectiveBiased.z) blockerCount += 1.0;"
				+ "            projectiveBiased.x -= (j*stepSize);"
				+ "            projectiveBiased.y -= (i*stepSize);"
				+ "        }"
				+ "    }"
				+ "    float result = 1.0 - shadowIntensity * blockerCount / 9.0;"
				+ "    return result;"
				+ "}"
				+ ""
				+ "void main(void) {"
				+ "    vec3 normal = normalize(fragNormal);"
				+ "    vec3 light = normalize(fragLightVector);"
				+ "    vec3 eye = normalize(fragEyeVector);"
				+ "    vec2 texCoord = vec2(fragTexCoord.x,1.0-fragTexCoord.y);"
				+ "    float diffuse = max(0.0, dot(normal, light)) * lightOn;"
				+ "    diffuse += max(0.0, dot(normal, eye));"
				+ "    float specular = pow(max(0.0, dot(normal, normalize(light+eye))), shininess*128.0) * lightOn;"
				+ "    specular += 0.8 * pow(max(0.0, dot(normal, eye)), shininess*128.0);"
				+ "    vec4 texCol = texture2D(tex, texCoord);"
				+ "    texCol.a *= alpha;"
				+ "    vec3 rgb = emissiveColor;"
				+ "    if (sphereMapping == 1.0) {"
				+ "       rgb += (diffuse*diffuseColor + specular*specularColor) * texCol.rgb;"
				+ "    }" + "    else {"
				+ "       rgb += diffuse*texCol.rgb + specular*specularColor;"
				+ "    }" + "    rgb = clamp(rgb, 0.0, 1.0);"
				+ "    if (shadowIntensity > 0.0) { "
				+ "      vec3 projectiveBiased = projCoord.xyz / projCoord.w;"
				+ "      float shadowed = PCF_Filter(projectiveBiased, 0.002);"
				+ "      rgb *= shadowed;" + "    }"
				+ "    if (texCol.a <= 0.1) discard;"
				+ "    else gl_FragColor = vec4(rgb, texCol.a);" + "}"
	};
	g_shaders['fs-x3d-textured-txt'] = {
		type : "fragment",
		data : "uniform float ambientIntensity;"
				+ "uniform vec3 diffuseColor;"
				+ "uniform vec3 emissiveColor;"
				+ "uniform float shininess;"
				+ "uniform vec3 specularColor;"
				+ "uniform float alpha;"
				+ "uniform float lightOn;"
				+ "uniform sampler2D tex;"
				+ "uniform sampler2D sh_tex;"
				+ "uniform float shadowIntensity;"
				+ ""
				+ "varying vec3 fragNormal;"
				+ "varying vec3 fragLightVector;"
				+ "varying vec3 fragEyeVector;"
				+ "varying vec2 fragTexCoord;"
				+ "varying vec4 projCoord;"
				+ ""
				+ "void main(void) {"
				+ "    vec3 normal = normalize(fragNormal);"
				+ "    vec3 light = normalize(fragLightVector);"
				+ "    vec3 eye = normalize(fragEyeVector);"
				+ "    vec2 texCoord = vec2(fragTexCoord.x,1.0-fragTexCoord.y);"
				+ "    float diffuse = abs(dot(normal, light)) * lightOn;"
				+ "    diffuse += abs(dot(normal, eye));"
				+ "    float specular = pow(abs(dot(normal, normalize(light+eye))), shininess*128.0) * lightOn;"
				+ "    specular += 0.8 * pow(abs(dot(normal, eye)), shininess*128.0);"
				+ "    vec3 rgb = texture2D(tex, texCoord).rgb;"
				+ "    float len = clamp(length(rgb), 0.0, 1.0) * alpha;"
				+ "    rgb *= (emissiveColor + diffuse*diffuseColor + specular*specularColor);"
				+ "    rgb = clamp(rgb, 0.0, 1.0);"
				+ "    if (shadowIntensity > 0.0) { "
				+ "      vec3 projectiveBiased = projCoord.xyz / projCoord.w;"
				+ "      vec4 shCol = texture2D(sh_tex, (1.0+projectiveBiased.xy)*0.5);"
				+ "      float z = (shCol.a * 16777216.0 + shCol.r * 65536.0 + shCol.g * 256.0 + shCol.b) / 16777216.0;"
				+ "      if (z < projectiveBiased.z) rgb *= (1.0 - shadowIntensity);"
				+ "    }" + "    if (len <= 0.1) discard;"
				+ "    else gl_FragColor = vec4(rgb, len);" + "}"
	};
	g_shaders['vs-x3d-untextured'] = {
		type : "vertex",
		data : "attribute vec3 position;"
				+ "attribute vec3 normal;"
				+ "varying vec3 fragNormal;"
				+ "varying vec3 fragLightVector;"
				+ "varying vec3 fragEyeVector;"
				+ "uniform mat4 modelViewProjectionMatrix;"
				+ "uniform mat4 modelViewMatrix;"
				+ "uniform vec3 lightDirection;"
				+ "uniform vec3 eyePosition;"
				+ "uniform mat4 matPV;"
				+ "varying vec4 projCoord;"
				+ ""
				+ "void main(void) {"
				+ "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);"
				+ "    fragNormal = (modelViewMatrix * vec4(normal, 0.0)).xyz;"
				+ "    fragLightVector = -lightDirection;"
				+ "    fragEyeVector = eyePosition - (modelViewMatrix * vec4(position, 1.0)).xyz;"
				+ "    projCoord = matPV * vec4(position+0.5*normalize(normal), 1.0);"
				+ "}"
	};
	g_shaders['fs-x3d-untextured'] = {
		type : "fragment",
		data : "uniform float ambientIntensity;"
				+ "uniform vec3 diffuseColor;"
				+ "uniform vec3 emissiveColor;"
				+ "uniform float shininess;"
				+ "uniform vec3 specularColor;"
				+ "uniform float alpha;"
				+ "uniform float lightOn;"
				+ "uniform sampler2D sh_tex;"
				+ "uniform float shadowIntensity;"
				+ ""
				+ "varying vec3 fragNormal;"
				+ "varying vec3 fragLightVector;"
				+ "varying vec3 fragEyeVector;"
				+ "varying vec4 projCoord;"
				+ ""
				+ "float PCF_Filter(vec3 projectiveBiased, float filterWidth)"
				+ "{"
				+ "    float stepSize = 2.0 * filterWidth / 3.0;"
				+ "    float blockerCount = 0.0;"
				+ "    projectiveBiased.x -= filterWidth;"
				+ "    projectiveBiased.y -= filterWidth;"
				+ "    for (float i=0.0; i<3.0; i++)"
				+ "    {"
				+ "        for (float j=0.0; j<3.0; j++)"
				+ "        {"
				+ "            projectiveBiased.x += (j*stepSize);"
				+ "            projectiveBiased.y += (i*stepSize);"
				+ "            vec4 shCol = texture2D(sh_tex, (1.0+projectiveBiased.xy)*0.5);"
				+ "            float z = (shCol.a * 16777216.0 + shCol.r * 65536.0 + shCol.g * 256.0 + shCol.b) / 16777216.0;"
				+ "            if (z < projectiveBiased.z) blockerCount += 1.0;"
				+ "            projectiveBiased.x -= (j*stepSize);"
				+ "            projectiveBiased.y -= (i*stepSize);"
				+ "        }"
				+ "    }"
				+ "    float result = 1.0 - shadowIntensity * blockerCount / 9.0;"
				+ "    return result;"
				+ "}"
				+ ""
				+ "void main(void) {"
				+ "    vec3 normal = normalize(fragNormal);"
				+ "    vec3 light = normalize(fragLightVector);"
				+ "    vec3 eye = normalize(fragEyeVector);"
				+ "    float diffuse = max(0.0, dot(normal, light)) * lightOn;"
				+ "    diffuse += max(0.0, dot(normal, eye));"
				+ "    float specular = pow(max(0.0, dot(normal, normalize(light+eye))), shininess*128.0) * lightOn;"
				+ "    specular += 0.8 * pow(max(0.0, dot(normal, eye)), shininess*128.0);"
				+ "    vec3 rgb = emissiveColor + diffuse*diffuseColor + specular*specularColor;"
				+ "    rgb = clamp(rgb, 0.0, 1.0);"
				+ "    if (shadowIntensity > 0.0) { "
				+ "      vec3 projectiveBiased = projCoord.xyz / projCoord.w;"
				+ "      float shadowed = PCF_Filter(projectiveBiased, 0.002);"
				+ "      rgb *= shadowed;" + "    }"
				+ "    gl_FragColor = vec4(rgb, alpha);" + "}"
	};
	g_shaders['vs-x3d-vertexcolor'] = {
		type : "vertex",
		data : "attribute vec3 position;"
				+ "attribute vec3 normal;"
				+ "attribute vec3 color;"
				+ "varying vec3 fragNormal;"
				+ "varying vec3 fragColor;"
				+ "varying vec3 fragLightVector;"
				+ "varying vec3 fragEyeVector;"
				+ "uniform mat4 modelViewProjectionMatrix;"
				+ "uniform mat4 modelViewMatrix;"
				+ "uniform vec3 lightDirection;"
				+ "uniform vec3 eyePosition;"
				+ "uniform mat4 matPV;"
				+ "varying vec4 projCoord;"
				+ ""
				+ "void main(void) {"
				+ "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);"
				+ "    fragNormal = (modelViewMatrix * vec4(normal, 0.0)).xyz;"
				+ "    fragLightVector = -lightDirection;"
				+ "    fragColor = color;"
				+ "    fragEyeVector = eyePosition - (modelViewMatrix * vec4(position, 1.0)).xyz;"
				+ "    projCoord = matPV * vec4(position+0.5*normalize(normal), 1.0);"
				+ "}"
	};
	g_shaders['fs-x3d-vertexcolor'] = {
		type : "fragment",
		data : "uniform float ambientIntensity;"
				+ "uniform vec3 diffuseColor;"
				+ "uniform vec3 emissiveColor;"
				+ "uniform float shininess;"
				+ "uniform vec3 specularColor;"
				+ "uniform float alpha;"
				+ "uniform float lightOn;"
				+ "uniform sampler2D sh_tex;"
				+ "uniform float shadowIntensity;"
				+ ""
				+ "varying vec3 fragNormal;"
				+ "varying vec3 fragColor;"
				+ "varying vec3 fragLightVector;"
				+ "varying vec3 fragEyeVector;"
				+ "varying vec4 projCoord;"
				+ ""
				+ "float PCF_Filter(vec3 projectiveBiased, float filterWidth)"
				+ "{"
				+ "    float stepSize = 2.0 * filterWidth / 3.0;"
				+ "    float blockerCount = 0.0;"
				+ "    projectiveBiased.x -= filterWidth;"
				+ "    projectiveBiased.y -= filterWidth;"
				+ "    for (float i=0.0; i<3.0; i++)"
				+ "    {"
				+ "        for (float j=0.0; j<3.0; j++)"
				+ "        {"
				+ "            projectiveBiased.x += (j*stepSize);"
				+ "            projectiveBiased.y += (i*stepSize);"
				+ "            vec4 shCol = texture2D(sh_tex, (1.0+projectiveBiased.xy)*0.5);"
				+ "            float z = (shCol.a * 16777216.0 + shCol.r * 65536.0 + shCol.g * 256.0 + shCol.b) / 16777216.0;"
				+ "            if (z < projectiveBiased.z) blockerCount += 1.0;"
				+ "            projectiveBiased.x -= (j*stepSize);"
				+ "            projectiveBiased.y -= (i*stepSize);"
				+ "        }"
				+ "    }"
				+ "    float result = 1.0 - shadowIntensity * blockerCount / 9.0;"
				+ "    return result;"
				+ "}"
				+ ""
				+ "void main(void) {"
				+ "    vec3 normal = normalize(fragNormal);"
				+ "    vec3 light = normalize(fragLightVector);"
				+ "    vec3 eye = normalize(fragEyeVector);"
				+ "    float diffuse = abs(dot(normal, light)) * lightOn;"
				+ "    diffuse += abs(dot(normal, eye));"
				+ "    float specular = pow(abs(dot(normal, normalize(light+eye))), shininess*128.0) * lightOn;"
				+ "    specular += 0.8 * pow(abs(dot(normal, eye)), shininess*128.0);"
				+ "    vec3 rgb = emissiveColor + diffuse * fragColor + specular * specularColor;"
				+ "    rgb = clamp(rgb, 0.0, 1.0);"
				+ "    if (shadowIntensity > 0.0) { "
				+ "      vec3 projectiveBiased = projCoord.xyz / projCoord.w;"
				+ "      float shadowed = PCF_Filter(projectiveBiased, 0.002);"
				+ "      rgb *= shadowed;" + "    }"
				+ "    gl_FragColor = vec4(rgb, alpha);" + "}"
	};
	g_shaders['vs-x3d-vertexcolorUnlit'] = {
		type : "vertex",
		data : "attribute vec3 position;"
				+ "attribute vec3 color;"
				+ "varying vec3 fragColor;"
				+ "uniform mat4 modelViewProjectionMatrix;"
				+ ""
				+ "void main(void) {"
				+ "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);"
				+ "    fragColor = color;" + "}"
	};
	g_shaders['fs-x3d-vertexcolorUnlit'] = {
		type : "fragment",
		data : "uniform vec3 diffuseColor;" + "uniform float alpha;"
				+ "uniform float lightOn;" + "varying vec3 fragColor;" + ""
				+ "void main(void) {"
				+ "    gl_FragColor = vec4(fragColor, alpha);" + "}"
	};
	g_shaders['fs-x3d-shownormal'] = {
		type : "fragment",
		data : "uniform float ambientIntensity;" + "uniform vec3 diffuseColor;"
				+ "uniform vec3 emissiveColor;" + "uniform float shininess;"
				+ "uniform vec3 specularColor;" + "uniform float alpha;"
				+ "uniform float lightOn;" + "" + "varying vec3 fragNormal;"
				+ "varying vec3 fragLightVector;"
				+ "varying vec3 fragEyeVector;" + "varying vec2 fragTexCoord;"
				+ "" + "void main(void) {"
				+ "    vec3 normal = normalize(fragNormal);"
				+ "    gl_FragColor = vec4((normal+1.0)/2.0, 1.0);" + "}"
	};
	g_shaders['vs-x3d-default'] = {
		type : "vertex",
		data : "attribute vec3 position;"
				+ "uniform mat4 modelViewProjectionMatrix;"
				+ "void main(void) {"
				+ "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);"
				+ "}"
	};
	g_shaders['fs-x3d-default'] = {
		type : "fragment",
		data : "uniform vec3 diffuseColor;" + "void main(void) {"
				+ "    gl_FragColor = vec4(diffuseColor, 1.0);" + "}"
	};
	g_shaders['vs-x3d-pick'] = {
		type : "vertex",
		data : "attribute vec3 position;"
				+ "uniform mat4 modelMatrix;"
				+ "uniform mat4 modelViewProjectionMatrix;"
				+ "uniform vec3 wcMin;"
				+ "uniform vec3 wcMax;"
				+ "varying vec3 worldCoord;"
				+ "void main(void) {"
				+ "    worldCoord = (modelMatrix * vec4(position, 1.0)).xyz;"
				+ "    vec3 dia = wcMax - wcMin;"
				+ "    worldCoord = worldCoord - wcMin;"
				+ "    worldCoord.x /= dia.x;"
				+ "    worldCoord.y /= dia.y;"
				+ "    worldCoord.z /= dia.z;"
				+ "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);"
				+ "}"
	};
	g_shaders['fs-x3d-pick'] = {
		type : "fragment",
		data : "uniform float id;" + "varying vec3 worldCoord;"
				+ "void main(void) {"
				+ "    gl_FragColor = vec4(worldCoord, id);" + "}"
	};
	g_shaders['vs-x3d-shadow'] = {
		type : "vertex",
		data : "attribute vec3 position;"
				+ "uniform mat4 modelViewProjectionMatrix;"
				+ "varying vec4 projCoord;"
				+ "void main(void) {"
				+ "   projCoord = modelViewProjectionMatrix * vec4(position, 1.0);"
				+ "   gl_Position = projCoord;" + "}"
	};
	g_shaders['fs-x3d-shadow'] = {
		type : "fragment",
		data : "varying vec4 projCoord;"
				+ "void main(void) {"
				+ "    vec3 proj = (projCoord.xyz / projCoord.w);"
				+ "    float dist = proj.z * 4294967296.0;"
				+ "    float alpha = float(int(dist / 16777216.0));"
				+ "    dist = dist - float(int(alpha)) * 16777216.0;"
				+ "    float red = float(int(dist / 65536.0));"
				+ "    dist = dist - float(int(red)) * 65536.0;"
				+ "    float green = float(int(dist / 256.0));"
				+ "    dist = dist - float(int(green)) * 256.0;"
				+ "    float blue = float(int(dist / 256.0));"
				+ "    gl_FragColor = vec4(red/256.0, green/256.0, blue/256.0, alpha/256.0);"
				+ "}"
	};
	function getDefaultShaderProgram(gl, suffix) {
		var prog = gl.createProgram();
		var vs = gl.createShader(gl.VERTEX_SHADER);
		var fs = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(vs, g_shaders['vs-x3d-' + suffix].data);
		gl.shaderSource(fs, g_shaders['fs-x3d-' + suffix].data);
		gl.compileShader(vs);
		gl.compileShader(fs);
		gl.attachShader(prog, vs);
		gl.attachShader(prog, fs);
		gl.linkProgram(prog);
		var msg = gl.getProgramInfoLog(prog);
		if (msg) {
			x3dom.debug.logError(msg);
		}
		return wrapShaderProgram(gl, prog);
	}
	function getShaderProgram(gl, ids) {
		var shader = [];
		for ( var id = 0; id < 2; id++) {
			if (!g_shaders[ids[id]]) {
				x3dom.debug.logError('Cannot find shader ' + ids[id]);
				return;
			}
			if (g_shaders[ids[id]].type == 'vertex') {
				shader[id] = gl.createShader(gl.VERTEX_SHADER);
			} else if (g_shaders[ids[id]].type == 'fragment') {
				shader[id] = gl.createShader(gl.FRAGMENT_SHADER);
			} else {
				x3dom.debug
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
			x3dom.debug.logError(msg);
		}
		return wrapShaderProgram(gl, prog);
	}
	function wrapShaderProgram(gl, sp) {
		var shader = {};
		shader.bind = function() {
			gl.useProgram(sp);
		};
		var loc = null, obj = null;
		var i = 0;
		var numUniforms = gl.getProgramParameter(sp, gl.ACTIVE_UNIFORMS);
		for (i = 0; i < numUniforms; ++i) {
			try {
				obj = gl.getActiveUniform(sp, i);
			} catch (eu) {
			}
			if (gl.getError() !== 0) {
				break;
			}
			loc = gl.getUniformLocation(sp, obj.name);
			switch (obj.type) {
			case gl.SAMPLER_2D:
				shader.__defineSetter__(obj.name, (function(loc) {
					return function(val) {
						gl.uniform1i(loc, val);
					};
				})(loc));
				break;
			case gl.SAMPLER_CUBE:
				shader.__defineSetter__(obj.name, (function(loc) {
					return function(val) {
						gl.uniform1i(loc, val);
					};
				})(loc));
				break;
			case gl.BOOL:
				shader.__defineSetter__(obj.name, (function(loc) {
					return function(val) {
						gl.uniform1i(loc, val);
					};
				})(loc));
				break;
			case gl.FLOAT:
				shader.__defineSetter__(obj.name, (function(loc) {
					return function(val) {
						gl.uniform1f(loc, val);
					};
				})(loc));
				break;
			case gl.FLOAT_VEC2:
				shader.__defineSetter__(obj.name, (function(loc) {
					return function(val) {
						gl.uniform2f(loc, val[0], val[1]);
					};
				})(loc));
				break;
			case gl.FLOAT_VEC3:
				shader.__defineSetter__(obj.name, (function(loc) {
					return function(val) {
						gl.uniform3f(loc, val[0], val[1], val[2]);
					};
				})(loc));
				break;
			case gl.FLOAT_VEC4:
				shader.__defineSetter__(obj.name, (function(loc) {
					return function(val) {
						gl.uniform4f(loc, val[0], val[1], val[2], val[3]);
					};
				})(loc));
				break;
			case gl.FLOAT_MAT2:
				shader.__defineSetter__(obj.name, (function(loc) {
					return function(val) {
						gl.uniformMatrix2fv(loc, false,
								new WebGLFloatArray(val));
					};
				})(loc));
				break;
			case gl.FLOAT_MAT3:
				shader.__defineSetter__(obj.name, (function(loc) {
					return function(val) {
						gl.uniformMatrix3fv(loc, false,
								new WebGLFloatArray(val));
					};
				})(loc));
				break;
			case gl.FLOAT_MAT4:
				shader.__defineSetter__(obj.name, (function(loc) {
					return function(val) {
						gl.uniformMatrix4fv(loc, false,
								new WebGLFloatArray(val));
					};
				})(loc));
				break;
			default:
				x3dom.debug.logInfo('GLSL program variable ' + obj.name
						+ ' has unknown type ' + obj.type);
			}
		}
		var numAttribs = gl.getProgramParameter(sp, gl.ACTIVE_ATTRIBUTES);
		for (i = 0; i < numAttribs; ++i) {
			try {
				obj = gl.getActiveAttrib(sp, i);
			} catch (ea) {
			}
			if (gl.getError() !== 0) {
				break;
			}
			loc = gl.getAttribLocation(sp, obj.name);
			shader[obj.name] = loc;
		}
		return shader;
	}
	Context.prototype.setupShape = function(gl, shape) {
		if (shape._webgl !== undefined) {
			if (shape._dirty.positions === true) {
				if (shape._webgl.shader.position !== undefined) {
					shape._webgl.positions = shape._cf.geometry.node._mesh._positions;
					gl.deleteBuffer(shape._webgl.buffers[1]);
					var positionBuffer = gl.createBuffer();
					shape._webgl.buffers[1] = positionBuffer;
					gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
					var vertices = new WebGLFloatArray(shape._webgl.positions);
					gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
					gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
					gl.vertexAttribPointer(shape._webgl.shader.position, 3,
							gl.FLOAT, false, 0, 0);
					delete vertices;
				}
				shape._dirty.positions = false;
			}
			if (shape._dirty.colors === true) {
				if (shape._webgl.shader.color !== undefined) {
					shape._webgl.colors = shape._cf.geometry.node._mesh._colors;
					gl.deleteBuffer(shape._webgl.buffers[4]);
					var colorBuffer = gl.createBuffer();
					shape._webgl.buffers[4] = colorBuffer;
					var colors = new WebGLFloatArray(shape._webgl.colors);
					gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
					gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
					gl.vertexAttribPointer(shape._webgl.shader.color, 3,
							gl.FLOAT, false, 0, 0);
					delete colors;
				}
				shape._dirty.colors = false;
			}
			if (shape._dirty.texture === true) {
				if (shape._webgl.texture !== undefined) {
					var tex = shape._cf.appearance.node._cf.texture.node;
					if (tex) {
						shape.updateTexture(tex, 0);
					}
				}
				shape._dirty.texture = false;
			}
			return;
		}
		shape._dirty.positions = false;
		shape._dirty.normals = false;
		shape._dirty.texcoords = false;
		shape._dirty.colors = false;
		shape._dirty.indexes = false;
		shape._dirty.texture = false;
		if (x3dom.isa(shape._cf.geometry.node, x3dom.nodeTypes.Text)) {
			var text_canvas = document.createElement('canvas');
			text_canvas.width = 600;
			text_canvas.height = 100;
			var text_ctx = text_canvas.getContext('2d');
			var fontStyle = shape._cf.geometry.node._cf.fontStyle.node;
			var font_family = 'SANS';
			if (fontStyle !== null) {
				font_family = Array.map(fontStyle._vf.family, function(s) {
					if (s == 'SANS') {
						return 'sans-serif';
					} else if (s == 'SERIF') {
						return 'serif';
					} else if (s == 'TYPEWRITER') {
						return 'monospace';
					} else {
						return '"' + s + '"';
					}
				}).join(', ');
			}
			var string = shape._cf.geometry.node._vf.string;
			text_ctx.fillStyle = 'rgb(0,0,0)';
			text_ctx.fillRect(0, 0, text_ctx.canvas.width,
					text_ctx.canvas.height);
			text_ctx.fillStyle = 'white';
			text_ctx.lineWidth = 2.5;
			text_ctx.strokeStyle = 'grey';
			text_ctx.save();
			text_ctx.font = "32px " + font_family;
			var txtW = text_ctx.measureText(string).width;
			var txtH = text_ctx.measureText(string).height || 42;
			var leftOffset = (text_ctx.canvas.width - txtW) / 2.0;
			var topOffset = (text_ctx.canvas.height - 32) / 2.0;
			text_ctx.fillText(string, leftOffset, topOffset);
			text_ctx.restore();
			var ids = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, ids);
			gl.texImage2D(gl.TEXTURE_2D, 0, text_canvas);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
			gl.bindTexture(gl.TEXTURE_2D, null);
			var w = txtW / 100.0;
			var h = txtH / 100.0;
			var u0 = leftOffset / text_canvas.width;
			var u = u0 + txtW / text_canvas.width;
			var v = 1 - txtH / text_canvas.height;
			var v0 = topOffset / text_canvas.height + v;
			if (u0 < 0) {
				u0 = 0;
			}
			if (u > 1) {
				u = 1;
			}
			shape._cf.geometry.node._mesh._positions = [ -w, -h, 0, w, -h, 0,
					w, h, 0, -w, h, 0 ];
			shape._cf.geometry.node._mesh._normals = [ 0, 0, 1, 0, 0, 1, 0, 0,
					1, 0, 0, 1 ];
			shape._cf.geometry.node._mesh._texCoords = [ u0, v, u, v, u, v0,
					u0, v0 ];
			shape._cf.geometry.node._mesh._colors = [];
			shape._cf.geometry.node._mesh._indices = [ 0, 1, 2, 2, 3, 0 ];
			shape._cf.geometry.node._mesh._invalidate = true;
			shape._webgl = {
				positions : shape._cf.geometry.node._mesh._positions,
				normals : shape._cf.geometry.node._mesh._normals,
				texcoords : shape._cf.geometry.node._mesh._texCoords,
				colors : shape._cf.geometry.node._mesh._colors,
				indexes : shape._cf.geometry.node._mesh._indices,
				texture : [ ids ],
				buffers : [ {}, {}, {}, {}, {} ]
			};
			shape._webgl.primType = gl.TRIANGLES;
			shape._webgl.shader = getShaderProgram(gl, [ 'vs-x3d-textured',
					'fs-x3d-textured-txt' ]);
		} else {
			var context = this;
			var tex = shape._cf.appearance.node._cf.texture.node;
			shape.updateTexture = function(tex, unit) {
				var that = this;
				var texture;
				if (this._webgl.texture === undefined) {
					this._webgl.texture = [];
				}
				if (x3dom.isa(tex, x3dom.nodeTypes.MultiTexture)) {
					for ( var cnt = 0; cnt < tex.size(); cnt++) {
						var singleTex = tex.getTexture(cnt);
						if (!singleTex)
							break;
						that.updateTexture(singleTex, cnt);
					}
				} else if (x3dom.isa(tex, x3dom.nodeTypes.MovieTexture)) {
					texture = gl.createTexture();
					tex._video = document.createElement('video');
					tex._video.setAttribute('autobuffer', 'true');
					var p = document.getElementsByTagName('body')[0];
					p.appendChild(tex._video);
					tex._video.style.display = "none";
					for ( var i = 0; i < tex._vf.url.length; i++) {
						var videoUrl = tex._nameSpace.getURL(tex._vf.url[i]);
						x3dom.debug.logInfo('Adding video file: ' + videoUrl);
						var src = document.createElement('source');
						src.setAttribute('src', videoUrl);
						tex._video.appendChild(src);
					}
					var updateMovie = function() {
						that._nameSpace.doc.needRender = true;
						gl.bindTexture(gl.TEXTURE_2D, texture);
						gl.texImage2D(gl.TEXTURE_2D, 0, tex._video, false);
						gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER,
								gl.LINEAR);
						gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
								gl.LINEAR);
						gl.bindTexture(gl.TEXTURE_2D, null);
					};
					var startVideo = function() {
						that._nameSpace.doc.needRender = true;
						that._webgl.texture[unit] = texture;
						tex._video.play();
						tex._intervalID = setInterval(updateMovie, 16);
					};
					var videoDone = function() {
						clearInterval(tex._intervalID);
						if (tex._vf.loop === true) {
							tex._video.play();
							tex._intervalID = setInterval(updateMovie, 16);
						}
					};
					tex._video.addEventListener("canplaythrough", startVideo,
							true);
					tex._video.addEventListener("ended", videoDone, true);
				} else if (x3dom.isa(tex,
						x3dom.nodeTypes.X3DEnvironmentTextureNode)) {
					texture = context.loadCubeMap(gl, tex.getTexUrl(),
							that._nameSpace.doc, false);
					that._webgl.texture[unit] = texture;
				} else {
					texture = gl.createTexture();
					var image = new Image();
					image.src = tex._nameSpace.getURL(tex._vf.url[0]);
					that._nameSpace.doc.downloadCount += 1;
					image.onload = function() {
						that._nameSpace.doc.needRender = true;
						that._nameSpace.doc.downloadCount -= 1;
						that._webgl.texture[unit] = texture;
						gl.bindTexture(gl.TEXTURE_2D, texture);
						gl.texImage2D(gl.TEXTURE_2D, 0, image);
						gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER,
								gl.LINEAR);
						gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
								gl.LINEAR);
						gl.bindTexture(gl.TEXTURE_2D, null);
					};
				}
			};
			shape._webgl = {
				positions : shape._cf.geometry.node._mesh._positions,
				normals : shape._cf.geometry.node._mesh._normals,
				texcoords : shape._cf.geometry.node._mesh._texCoords,
				colors : shape._cf.geometry.node._mesh._colors,
				indexes : shape._cf.geometry.node._mesh._indices,
				buffers : [ {}, {}, {}, {}, {} ]
			};
			if (tex) {
				shape.updateTexture(tex, 0);
			}
			if (x3dom.isa(shape._cf.geometry.node, x3dom.nodeTypes.PointSet)) {
				shape._webgl.primType = gl.POINTS;
				shape._webgl.shader = getShaderProgram(gl, [
						'vs-x3d-vertexcolorUnlit', 'fs-x3d-vertexcolorUnlit' ]);
			} else {
				shape._webgl.primType = gl.TRIANGLES;
				if (shape._cf.appearance.node._shader !== null) {
					g_shaders['vs-x3d-HACK'] = {};
					g_shaders['vs-x3d-HACK'].type = "vertex";
					g_shaders['vs-x3d-HACK'].data = shape._cf.appearance.node._shader._vertex._vf.url[0];
					g_shaders['fs-x3d-HACK'] = {};
					g_shaders['fs-x3d-HACK'].type = "fragment";
					g_shaders['fs-x3d-HACK'].data = shape._cf.appearance.node._shader._fragment._vf.url[0];
					shape._webgl.shader = getDefaultShaderProgram(gl, 'HACK');
				} else {
					if (tex) {
						if (shape._cf.appearance.node._cf.textureTransform.node === null) {
							shape._webgl.shader = getShaderProgram(gl, [
									'vs-x3d-textured', 'fs-x3d-textured' ]);
						} else {
							shape._webgl.shader = getShaderProgram(gl, [
									'vs-x3d-textured-tt', 'fs-x3d-textured' ]);
						}
					} else if (shape._cf.geometry.node._mesh._colors.length > 0) {
						shape._webgl.shader = getShaderProgram(gl, [
								'vs-x3d-vertexcolor', 'fs-x3d-vertexcolor' ]);
					} else {
						shape._webgl.shader = getShaderProgram(gl, [
								'vs-x3d-untextured', 'fs-x3d-untextured' ]);
					}
				}
			}
		}
		var sp = shape._webgl.shader;
		if (sp.position !== undefined) {
			var positionBuffer = gl.createBuffer();
			shape._webgl.buffers[1] = positionBuffer;
			gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
			var vertices = new WebGLFloatArray(shape._webgl.positions);
			gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
			gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
			gl.vertexAttribPointer(sp.position, 3, gl.FLOAT, false, 0, 0);
			var indicesBuffer = gl.createBuffer();
			shape._webgl.buffers[0] = indicesBuffer;
			var indexArray = new WebGLUnsignedShortArray(shape._webgl.indexes);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, gl.STATIC_DRAW);
			delete vertices;
			delete indexArray;
		}
		if (sp.normal !== undefined) {
			var normalBuffer = gl.createBuffer();
			shape._webgl.buffers[2] = normalBuffer;
			var normals = new WebGLFloatArray(shape._webgl.normals);
			gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
			gl.vertexAttribPointer(sp.normal, 3, gl.FLOAT, false, 0, 0);
			delete normals;
		}
		if (sp.texcoord !== undefined) {
			var texcBuffer = gl.createBuffer();
			shape._webgl.buffers[3] = texcBuffer;
			var texCoords = new WebGLFloatArray(shape._webgl.texcoords);
			gl.bindBuffer(gl.ARRAY_BUFFER, texcBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
			gl.vertexAttribPointer(sp.texcoord,
					shape._cf.geometry.node._mesh._numTexComponents, gl.FLOAT,
					false, 0, 0);
			delete texCoords;
		}
		if (sp.color !== undefined) {
			var colorBuffer = gl.createBuffer();
			shape._webgl.buffers[4] = colorBuffer;
			var colors = new WebGLFloatArray(shape._webgl.colors);
			gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
			gl.vertexAttribPointer(sp.color, 3, gl.FLOAT, false, 0, 0);
			delete colors;
		}
		var currAttribs = 0;
		shape._webgl.dynamicFields = [];
		for ( var df in shape._cf.geometry.node._mesh._dynamicFields) {
			var attrib = shape._cf.geometry.node._mesh._dynamicFields[df];
			shape._webgl.dynamicFields[currAttribs] = {
				buf : {},
				name : df,
				numComponents : attrib.numComponents
			};
			if (sp[df] !== undefined) {
				var attribBuffer = gl.createBuffer();
				shape._webgl.dynamicFields[currAttribs++].buf = attribBuffer;
				var attribs = new WebGLFloatArray(attrib.value);
				gl.bindBuffer(gl.ARRAY_BUFFER, attribBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, attribs, gl.STATIC_DRAW);
				gl.vertexAttribPointer(sp[df], attrib.numComponents, gl.FLOAT,
						false, 0, 0);
				delete attribs;
			}
		}
	};
	Context.prototype.setupScene = function(gl, scene) {
		if (scene._webgl !== undefined) {
			return;
		}
		var url = scene.getSkyColor()[1];
		var i = 0;
		var w = 1, h = 1;
		if (url.length > 0 && url[0].length > 0) {
			if (url.length >= 6 && url[1].length > 0 && url[2].length > 0
					&& url[3].length > 0 && url[4].length > 0
					&& url[5].length > 0) {
				var sphere = new x3dom.nodeTypes.Sphere();
				scene._webgl = {
					positions : sphere._mesh._positions,
					indexes : sphere._mesh._indices,
					buffers : [ {}, {} ]
				};
				scene._webgl.primType = gl.TRIANGLES;
				scene._webgl.shader = getShaderProgram(gl, [
						'vs-x3d-bg-textureCube', 'fs-x3d-bg-textureCube' ]);
				scene._webgl.texture = this.loadCubeMap(gl, url,
						scene._nameSpace.doc, true);
			} else {
				var texture = gl.createTexture();
				var image = new Image();
				image.src = url[0];
				scene._nameSpace.doc.downloadCount += 1;
				image.onload = function() {
					scene._nameSpace.doc.needRender = true;
					scene._nameSpace.doc.downloadCount -= 1;
					scene._webgl.texture = texture;
					gl.bindTexture(gl.TEXTURE_2D, texture);
					gl.texImage2D(gl.TEXTURE_2D, 0, image, true);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER,
							gl.LINEAR);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
							gl.LINEAR);
					gl.bindTexture(gl.TEXTURE_2D, null);
				};
				scene._webgl = {
					positions : [ -w, -h, 0, -w, h, 0, w, -h, 0, w, h, 0 ],
					indexes : [ 0, 1, 2, 3 ],
					buffers : [ {}, {} ]
				};
				scene._webgl.primType = gl.TRIANGLE_STRIP;
				scene._webgl.shader = getShaderProgram(gl, [
						'vs-x3d-bg-texture', 'fs-x3d-bg-texture' ]);
			}
		} else {
			scene._webgl = {};
		}
		(function() {
			scene._fgnd = {};
			scene._fgnd._webgl = {
				positions : [ -w, -h, 0, -w, h, 0, w, -h, 0, w, h, 0 ],
				indexes : [ 0, 1, 2, 3 ],
				buffers : [ {}, {} ]
			};
			scene._fgnd._webgl.primType = gl.TRIANGLE_STRIP;
			scene._fgnd._webgl.shader = getShaderProgram(gl, [
					'vs-x3d-bg-texture', 'fs-x3d-bg-texture' ]);
			var sp = scene._fgnd._webgl.shader;
			var positionBuffer = gl.createBuffer();
			scene._fgnd._webgl.buffers[1] = positionBuffer;
			gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
			var vertices = new WebGLFloatArray(scene._fgnd._webgl.positions);
			gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
			gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
			gl.vertexAttribPointer(sp.position, 3, gl.FLOAT, false, 0, 0);
			var indicesBuffer = gl.createBuffer();
			scene._fgnd._webgl.buffers[0] = indicesBuffer;
			var indexArray = new WebGLUnsignedShortArray(
					scene._fgnd._webgl.indexes);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, gl.STATIC_DRAW);
			delete vertices;
			delete indexArray;
			scene._fgnd._webgl.render = function(gl, tex) {
				scene._fgnd._webgl.texture = tex;
				gl.frontFace(gl.CCW);
				gl.disable(gl.CULL_FACE);
				gl.disable(gl.DEPTH_TEST);
				sp.bind();
				if (!sp.tex) {
					sp.tex = 0;
				}
				gl.enable(gl.TEXTURE_2D);
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, scene._fgnd._webgl.texture);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER,
						gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
						gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,
						scene._fgnd._webgl.buffers[0]);
				gl.bindBuffer(gl.ARRAY_BUFFER, scene._fgnd._webgl.buffers[1]);
				gl.vertexAttribPointer(sp.position, 3, gl.FLOAT, false, 0, 0);
				gl.enableVertexAttribArray(sp.position);
				try {
					gl.drawElements(scene._fgnd._webgl.primType,
							scene._fgnd._webgl.indexes.length,
							gl.UNSIGNED_SHORT, 0);
				} catch (e) {
					x3dom.debug.logException("render background: " + e);
				}
				gl.disableVertexAttribArray(sp.position);
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, null);
				gl.disable(gl.TEXTURE_2D);
			};
		})();
		if (scene._webgl.shader) {
			var sp = scene._webgl.shader;
			var positionBuffer = gl.createBuffer();
			scene._webgl.buffers[1] = positionBuffer;
			gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
			var vertices = new WebGLFloatArray(scene._webgl.positions);
			gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
			gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
			gl.vertexAttribPointer(sp.position, 3, gl.FLOAT, false, 0, 0);
			var indicesBuffer = gl.createBuffer();
			scene._webgl.buffers[0] = indicesBuffer;
			var indexArray = new WebGLUnsignedShortArray(scene._webgl.indexes);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, gl.STATIC_DRAW);
			delete vertices;
			delete indexArray;
		}
		scene._webgl.render = function(gl) {
			if (!scene._webgl.texture
					|| (scene._webgl.texture.textureCubeReady !== undefined && scene._webgl.texture.textureCubeReady !== true)) {
				var bgCol = scene.getSkyColor()[0];
				gl.clearColor(bgCol[0], bgCol[1], bgCol[2], bgCol[3]);
				gl.clearDepth(1.0);
				gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT
						| gl.STENCIL_BUFFER_BIT);
			} else {
				gl.clearDepth(1.0);
				gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT
						| gl.STENCIL_BUFFER_BIT);
				gl.frontFace(gl.CCW);
				gl.disable(gl.CULL_FACE);
				gl.disable(gl.DEPTH_TEST);
				gl.disable(gl.BLEND);
				sp.bind();
				if (!sp.tex) {
					sp.tex = 0;
				}
				if (scene._webgl.texture.textureCubeReady) {
					sp.modelViewProjectionMatrix = scene.getWCtoCCMatrix()
							.toGL();
					gl.enable(gl.TEXTURE_CUBE_MAP);
					gl.activeTexture(gl.TEXTURE0);
					gl.bindTexture(gl.TEXTURE_CUBE_MAP, scene._webgl.texture);
					gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S,
							gl.CLAMP_TO_EDGE);
					gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T,
							gl.CLAMP_TO_EDGE);
					gl.texParameteri(gl.TEXTURE_CUBE_MAP,
							gl.TEXTURE_MIN_FILTER, gl.LINEAR);
					gl.texParameteri(gl.TEXTURE_CUBE_MAP,
							gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				} else {
					gl.enable(gl.TEXTURE_2D);
					gl.activeTexture(gl.TEXTURE0);
					gl.bindTexture(gl.TEXTURE_2D, scene._webgl.texture);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER,
							gl.LINEAR);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
							gl.LINEAR);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,
							gl.REPEAT);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,
							gl.REPEAT);
				}
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, scene._webgl.buffers[0]);
				gl.bindBuffer(gl.ARRAY_BUFFER, scene._webgl.buffers[1]);
				gl.vertexAttribPointer(sp.position, 3, gl.FLOAT, false, 0, 0);
				gl.enableVertexAttribArray(sp.position);
				try {
					gl.drawElements(scene._webgl.primType,
							scene._webgl.indexes.length, gl.UNSIGNED_SHORT, 0);
				} catch (e) {
					x3dom.debug.logException("render background: " + e);
				}
				gl.disableVertexAttribArray(sp.position);
				if (scene._webgl.texture.textureCubeReady) {
					gl.activeTexture(gl.TEXTURE0);
					gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
					gl.disable(gl.TEXTURE_CUBE_MAP);
				} else {
					gl.activeTexture(gl.TEXTURE0);
					gl.bindTexture(gl.TEXTURE_2D, null);
					gl.disable(gl.TEXTURE_2D);
				}
				gl.clear(gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
			}
		};
	};
	Context.prototype.renderShadowPass = function(gl, scene, mat_light,
			mat_scene) {
		gl.bindFramebuffer(gl.FRAMEBUFFER, scene._webgl.fboShadow.fbo);
		gl.viewport(0, 0, scene._webgl.fboShadow.width,
				scene._webgl.fboShadow.height);
		gl.clearColor(1.0, 1.0, 1.0, 1.0);
		gl.clearDepth(1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.depthFunc(gl.LEQUAL);
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);
		gl.disable(gl.BLEND);
		var sp = scene._webgl.shadowShader;
		sp.bind();
		var i, n = scene.drawableObjects.length;
		for (i = 0; i < n; i++) {
			var trafo = scene.drawableObjects[i][0];
			var shape = scene.drawableObjects[i][1];
			sp.modelViewMatrix = mat_light.mult(trafo).toGL();
			sp.modelViewProjectionMatrix = mat_scene.mult(trafo).toGL();
			if (sp.position !== undefined) {
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape._webgl.buffers[0]);
				gl.bindBuffer(gl.ARRAY_BUFFER, shape._webgl.buffers[1]);
				gl.vertexAttribPointer(sp.position, 3, gl.FLOAT, false, 0, 0);
				gl.enableVertexAttribArray(sp.position);
			}
			try {
				gl.drawElements(shape._webgl.primType,
						shape._webgl.indexes.length, gl.UNSIGNED_SHORT, 0);
			} catch (e) {
				x3dom.debug.logException(shape._DEF + " renderShadowPass(): "
						+ e);
			}
			if (sp.position !== undefined) {
				gl.disableVertexAttribArray(sp.position);
			}
		}
		gl.flush();
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	};
	Context.prototype.renderPickingPass = function(gl, scene, mat_view,
			mat_scene, min, max) {
		gl.bindFramebuffer(gl.FRAMEBUFFER, scene._webgl.fboPick.fbo);
		gl.viewport(0, 0, scene._webgl.fboPick.width,
				scene._webgl.fboPick.height);
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clearDepth(1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.depthFunc(gl.LEQUAL);
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);
		gl.disable(gl.BLEND);
		var sp = scene._webgl.pickShader;
		sp.bind();
		var i, n = scene.drawableObjects.length;
		for (i = 0; i < n; i++) {
			var trafo = scene.drawableObjects[i][0];
			var shape = scene.drawableObjects[i][1];
			sp.modelMatrix = trafo.toGL();
			sp.modelViewProjectionMatrix = mat_scene.mult(trafo).toGL();
			sp.wcMin = min.toGL();
			sp.wcMax = max.toGL();
			sp.id = 1.0 - shape._objectID / 255.0;
			if (sp.position !== undefined) {
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape._webgl.buffers[0]);
				gl.bindBuffer(gl.ARRAY_BUFFER, shape._webgl.buffers[1]);
				gl.vertexAttribPointer(sp.position, 3, gl.FLOAT, false, 0, 0);
				gl.enableVertexAttribArray(sp.position);
			}
			try {
				gl.drawElements(shape._webgl.primType,
						shape._webgl.indexes.length, gl.UNSIGNED_SHORT, 0);
			} catch (e) {
				x3dom.debug.logException(shape._DEF + " renderPickingPass(): "
						+ e);
			}
			if (sp.position !== undefined) {
				gl.disableVertexAttribArray(sp.position);
			}
		}
		gl.flush();
		try {
			var data = gl.readPixels(scene._lastX * scene._webgl.pickScale,
					scene._webgl.fboPick.height - 1 - scene._lastY
							* scene._webgl.pickScale, 1, 1, gl.RGBA,
					gl.UNSIGNED_BYTE);
			if (data.data) {
				data = data.data
			}
			;
			scene._webgl.fboPick.pixelData = data;
		} catch (se) {
			scene._webgl.fboPick.pixelData = [];
		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	};
	Context.prototype.renderScene = function(scene, pick) {
		var gl = this.ctx3d;
		if (gl === null || scene === null) {
			return;
		}
		if (!scene._webgl) {
			this.setupScene(gl, scene);
			scene._webgl.pickScale = 0.5;
			scene._webgl.fboPick = this.initFbo(gl, this.canvas.width
					* scene._webgl.pickScale, this.canvas.height
					* scene._webgl.pickScale, true);
			scene._webgl.fboPick.pixelData = null;
			scene._webgl.pickShader = getDefaultShaderProgram(gl, 'pick');
			scene._webgl.fboShadow = this.initFbo(gl, 1024, 1024, false);
			scene._webgl.shadowShader = getDefaultShaderProgram(gl, 'shadow');
		}
		var t0, t1;
		if (scene.drawableObjects === undefined || !scene.drawableObjects) {
			scene.drawableObjects = [];
			scene.drawableObjects.LODs = [];
			t0 = new Date().getTime();
			scene.collectDrawableObjects(x3dom.fields.SFMatrix4f.identity(),
					scene.drawableObjects);
			t1 = new Date().getTime() - t0;
			if (this.canvas.parent.statDiv) {
				this.canvas.parent.statDiv.appendChild(document
						.createElement("br"));
				this.canvas.parent.statDiv.appendChild(document
						.createTextNode("traverse: " + t1));
			}
		}
		var mat_view = scene.getViewMatrix();
		var mat_scene = scene.getWCtoCCMatrix();
		t0 = new Date().getTime();
		var zPos = [];
		var i, n = scene.drawableObjects.length;
		var center, trafo, obj3d;
		for (i = 0; i < n; i++) {
			trafo = scene.drawableObjects[i][0];
			obj3d = scene.drawableObjects[i][1];
			this.setupShape(gl, obj3d);
			center = obj3d.getCenter();
			center = trafo.multMatrixPnt(center);
			center = mat_view.multMatrixPnt(center);
			zPos[i] = [ i, center.z ];
		}
		zPos.sort(function(a, b) {
			return a[1] - b[1];
		});
		n = scene.drawableObjects.LODs.length;
		if (n) {
			center = new x3dom.fields.SFVec3f(0, 0, 0);
			center = mat_view.inverse().multMatrixPnt(center);
		}
		for (i = 0; i < n; i++) {
			trafo = scene.drawableObjects.LODs[i][0];
			obj3d = scene.drawableObjects.LODs[i][1];
			if (obj3d) {
				obj3d._eye = trafo.inverse().multMatrixPnt(center);
			}
		}
		t1 = new Date().getTime() - t0;
		if (this.canvas.parent.statDiv) {
			this.canvas.parent.statDiv
					.appendChild(document.createElement("br"));
			this.canvas.parent.statDiv.appendChild(document
					.createTextNode("sort: " + t1));
		}
		if (pick) {
			var min = x3dom.fields.SFVec3f.MAX();
			var max = x3dom.fields.SFVec3f.MIN();
			scene.getVolume(min, max, true);
			t0 = new Date().getTime();
			this.renderPickingPass(gl, scene, mat_view, mat_scene, min, max);
			scene._updatePicking = false;
			var index = 0;
			if (index >= 0 && index < scene._webgl.fboPick.pixelData.length) {
				var pickPos = new x3dom.fields.SFVec3f(0, 0, 0);
				pickPos.x = scene._webgl.fboPick.pixelData[index + 0] / 255;
				pickPos.y = scene._webgl.fboPick.pixelData[index + 1] / 255;
				pickPos.z = scene._webgl.fboPick.pixelData[index + 2] / 255;
				pickPos = pickPos.multComponents(max.subtract(min)).add(min);
				var objId = 255 - scene._webgl.fboPick.pixelData[index + 3];
				if (objId > 0) {
					scene._pickingInfo.pickPos = pickPos;
					scene._pickingInfo.pickObj = x3dom.nodeTypes.Shape.idMap.nodeID[objId];
				}
				scene._pickingInfo.updated = true;
			}
			t1 = new Date().getTime() - t0;
			x3dom.debug.logInfo("Picking time (idBuf): " + t1 + "ms");
		}
		var light, lightOn, shadowIntensity;
		var slights = scene.getLights();
		if (slights.length > 0) {
			light = slights[0]._vf.direction;
			lightOn = (slights[0]._vf.on === true) ? 1.0 : 0.0;
			lightOn *= slights[0]._vf.intensity;
			shadowIntensity = (slights[0]._vf.on === true) ? 1.0 : 0.0;
			shadowIntensity *= slights[0]._vf.shadowIntensity;
		} else {
			light = new x3dom.fields.SFVec3f(0, -1, 0);
			lightOn = 0.0;
			shadowIntensity = 0.0;
		}
		light = mat_view.multMatrixVec(light);
		if (shadowIntensity > 0) {
			t0 = new Date().getTime();
			var lightMatrix = scene.getLightMatrix();
			var mat_light = scene.getWCtoLCMatrix(lightMatrix);
			this.renderShadowPass(gl, scene, lightMatrix, mat_light);
			t1 = new Date().getTime() - t0;
			if (this.canvas.parent.statDiv) {
				this.canvas.parent.statDiv.appendChild(document
						.createElement("br"));
				this.canvas.parent.statDiv.appendChild(document
						.createTextNode("shadow: " + t1));
			}
		}
		t0 = new Date().getTime();
		gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		scene._webgl.render(gl);
		gl.depthFunc(gl.LEQUAL);
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);
		gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE,
				gl.ONE);
		gl.enable(gl.BLEND);
		var activeTex = [ gl.TEXTURE0, gl.TEXTURE1, gl.TEXTURE2, gl.TEXTURE3,
				gl.TEXTURE4, gl.TEXTURE5, gl.TEXTURE6, gl.TEXTURE7 ];
		for (i = 0, n = zPos.length; i < n; i++) {
			var obj = scene.drawableObjects[zPos[i][0]];
			var transform = obj[0];
			var shape = obj[1];
			var sp = shape._webgl.shader;
			if (!sp) {
				shape._webgl.shader = getDefaultShaderProgram(gl, 'default');
				sp = shape._webgl.shader;
			}
			sp.bind();
			sp.eyePosition = [ 0, 0, 0 ];
			sp.lightDirection = light.toGL();
			sp.lightOn = lightOn;
			var mat = shape._cf.appearance.node._cf.material.node;
			if (mat) {
				sp.ambientIntensity = mat._vf.ambientIntensity;
				sp.diffuseColor = mat._vf.diffuseColor.toGL();
				sp.emissiveColor = mat._vf.emissiveColor.toGL();
				sp.shininess = mat._vf.shininess;
				sp.specularColor = mat._vf.specularColor.toGL();
				sp.alpha = 1.0 - mat._vf.transparency;
			}
			var userShader = shape._cf.appearance.node._shader;
			if (userShader) {
				for ( var fName in userShader._vf) {
					if (userShader._vf.hasOwnProperty(fName)
							&& fName !== 'language') {
						var field = userShader._vf[fName];
						try {
							sp[fName] = field.toGL();
						} catch (noToGl) {
							sp[fName] = field;
						}
					}
				}
			}
			var model_view = mat_view.mult(transform);
			sp.modelViewMatrix = model_view.toGL();
			if (userShader) {
				sp.modelViewMatrixInverse = model_view.inverse().toGL();
			}
			sp.modelViewProjectionMatrix = mat_scene.mult(transform).toGL();
			for ( var cnt = 0; shape._webgl.texture !== undefined
					&& cnt < shape._webgl.texture.length; cnt++) {
				if (shape._webgl.texture[cnt]) {
					var tex = null;
					if (shape._cf.appearance.node._cf.texture.node) {
						tex = shape._cf.appearance.node._cf.texture.node
								.getTexture(cnt);
					}
					var wrapS = gl.REPEAT, wrapT = gl.REPEAT;
					if (tex && tex._vf.repeatS === false) {
						wrapS = gl.CLAMP_TO_EDGE;
					}
					if (tex && tex._vf.repeatT === false) {
						wrapT = gl.CLAMP_TO_EDGE;
					}
					if (shape._webgl.texture[cnt].textureCubeReady
							&& tex
							&& x3dom.isa(tex,
									x3dom.nodeTypes.X3DEnvironmentTextureNode)) {
						gl.enable(gl.TEXTURE_CUBE_MAP);
						gl.activeTexture(activeTex[cnt]);
						gl.bindTexture(gl.TEXTURE_CUBE_MAP,
								shape._webgl.texture[cnt]);
						gl.texParameteri(gl.TEXTURE_CUBE_MAP,
								gl.TEXTURE_WRAP_S, wrapS);
						gl.texParameteri(gl.TEXTURE_CUBE_MAP,
								gl.TEXTURE_WRAP_T, wrapT);
						gl.texParameteri(gl.TEXTURE_CUBE_MAP,
								gl.TEXTURE_MAG_FILTER, gl.LINEAR);
						gl.texParameteri(gl.TEXTURE_CUBE_MAP,
								gl.TEXTURE_MIN_FILTER, gl.LINEAR);
					} else {
						gl.enable(gl.TEXTURE_2D);
						gl.activeTexture(activeTex[cnt]);
						gl
								.bindTexture(gl.TEXTURE_2D,
										shape._webgl.texture[cnt]);
						gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,
								wrapS);
						gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,
								wrapT);
						gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER,
								gl.LINEAR);
						gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
								gl.LINEAR);
					}
					if (shape._cf.appearance.node._cf.textureTransform.node !== null) {
						var texTrafo = shape._cf.appearance.node
								.transformMatrix();
						sp.texTrafoMatrix = texTrafo.toGL();
					}
					if (shape._cf.geometry.node._cf.texCoord !== undefined
							&& shape._cf.geometry.node._cf.texCoord.node !== null
							&& shape._cf.geometry.node._cf.texCoord.node._vf.mode) {
						var texMode = shape._cf.geometry.node._cf.texCoord.node._vf.mode;
						if (texMode.toLowerCase() == "sphere") {
							sp.sphereMapping = 1.0;
						} else {
							sp.sphereMapping = 0.0;
						}
					} else {
						sp.sphereMapping = 0.0;
					}
					if (!sp.tex) {
						sp.tex = 0;
					}
				}
			}
			if (shadowIntensity > 0) {
				if (!sp.sh_tex) {
					sp.sh_tex = 3;
				}
				gl.activeTexture(gl.TEXTURE3);
				gl.bindTexture(gl.TEXTURE_2D, scene._webgl.fboShadow.tex);
				gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER,
						gl.LINEAR);
				gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
						gl.LINEAR);
				gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,
						gl.CLAMP_TO_EDGE);
				gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,
						gl.CLAMP_TO_EDGE);
				sp.matPV = mat_light.mult(transform).toGL();
			}
			sp.shadowIntensity = shadowIntensity;
			if (sp.position !== undefined) {
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape._webgl.buffers[0]);
				gl.bindBuffer(gl.ARRAY_BUFFER, shape._webgl.buffers[1]);
				gl.vertexAttribPointer(sp.position, 3, gl.FLOAT, false, 0, 0);
				gl.enableVertexAttribArray(sp.position);
			}
			if (sp.normal !== undefined) {
				gl.bindBuffer(gl.ARRAY_BUFFER, shape._webgl.buffers[2]);
				gl.vertexAttribPointer(sp.normal, 3, gl.FLOAT, false, 0, 0);
				gl.enableVertexAttribArray(sp.normal);
			}
			if (sp.texcoord !== undefined) {
				gl.bindBuffer(gl.ARRAY_BUFFER, shape._webgl.buffers[3]);
				gl.vertexAttribPointer(sp.texcoord,
						shape._cf.geometry.node._mesh._numTexComponents,
						gl.FLOAT, false, 0, 0);
				gl.enableVertexAttribArray(sp.texcoord);
			}
			if (sp.color !== undefined) {
				gl.bindBuffer(gl.ARRAY_BUFFER, shape._webgl.buffers[4]);
				gl.vertexAttribPointer(sp.color, 3, gl.FLOAT, false, 0, 0);
				gl.enableVertexAttribArray(sp.color);
			}
			for ( var df = 0; df < shape._webgl.dynamicFields.length; df++) {
				var attrib = shape._webgl.dynamicFields[df];
				if (sp[attrib.name] !== undefined) {
					gl.bindBuffer(gl.ARRAY_BUFFER, attrib.buf);
					gl.vertexAttribPointer(sp[attrib.name],
							attrib.numComponents, gl.FLOAT, false, 0, 0);
					gl.enableVertexAttribArray(sp[attrib.name]);
				}
			}
			if (shape.isSolid()) {
				gl.enable(gl.CULL_FACE);
				if (shape.isCCW()) {
					gl.frontFace(gl.CCW);
				} else {
					gl.frontFace(gl.CW);
				}
			} else {
				gl.disable(gl.CULL_FACE);
			}
			try {
				if (scene._points !== undefined && scene._points) {
					gl.drawElements(gl.POINTS, shape._webgl.indexes.length,
							gl.UNSIGNED_SHORT, 0);
				} else {
					if (shape._webgl.primType == gl.POINTS) {
						gl.drawArrays(gl.POINTS, 0,
								shape._webgl.positions.length / 3);
					} else {
						gl.drawElements(shape._webgl.primType,
								shape._webgl.indexes.length, gl.UNSIGNED_SHORT,
								0);
					}
				}
			} catch (e) {
				x3dom.debug.logException(shape._DEF + " renderScene(): " + e);
			}
			for (cnt = 0; shape._webgl.texture !== undefined
					&& cnt < shape._webgl.texture.length; cnt++) {
				if (shape._webgl.texture[cnt]) {
					tex = null;
					if (shape._cf.appearance.node._cf.texture.node) {
						tex = shape._cf.appearance.node._cf.texture.node
								.getTexture(cnt);
					}
					if (shape._webgl.texture[cnt].textureCubeReady
							&& tex
							&& x3dom.isa(tex,
									x3dom.nodeTypes.X3DEnvironmentTextureNode)) {
						gl.activeTexture(activeTex[cnt]);
						gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
						gl.disable(gl.TEXTURE_CUBE_MAP);
					} else {
						gl.activeTexture(activeTex[cnt]);
						gl.bindTexture(gl.TEXTURE_2D, null);
					}
				}
			}
			if (shadowIntensity > 0) {
				gl.activeTexture(gl.TEXTURE3);
				gl.bindTexture(gl.TEXTURE_2D, null);
			}
			gl.disable(gl.TEXTURE_2D);
			if (sp.position !== undefined) {
				gl.disableVertexAttribArray(sp.position);
			}
			if (sp.normal !== undefined) {
				gl.disableVertexAttribArray(sp.normal);
			}
			if (sp.texcoord !== undefined) {
				gl.disableVertexAttribArray(sp.texcoord);
			}
			if (sp.color !== undefined) {
				gl.disableVertexAttribArray(sp.color);
			}
			for (df = 0; df < shape._webgl.dynamicFields.length; df++) {
				attrib = shape._webgl.dynamicFields[df];
				if (sp[attrib.name] !== undefined) {
					gl.disableVertexAttribArray(sp[attrib.name]);
				}
			}
		}
		gl.disable(gl.BLEND);
		gl.disable(gl.DEPTH_TEST);
		if (scene._visDbgBuf !== undefined && scene._visDbgBuf) {
			if (scene._vf.pickMode.toLowerCase() === "idbuf") {
				gl.viewport(0, 3 * this.canvas.height / 4,
						this.canvas.width / 4, this.canvas.height / 4);
				scene._fgnd._webgl.render(gl, scene._webgl.fboPick.tex);
			}
			if (shadowIntensity > 0) {
				gl.viewport(this.canvas.width / 4, 3 * this.canvas.height / 4,
						this.canvas.width / 4, this.canvas.height / 4);
				scene._fgnd._webgl.render(gl, scene._webgl.fboShadow.tex);
			}
		}
		gl.flush();
		t1 = new Date().getTime() - t0;
		if (this.canvas.parent.statDiv) {
			this.canvas.parent.statDiv
					.appendChild(document.createElement("br"));
			this.canvas.parent.statDiv.appendChild(document
					.createTextNode("render: " + t1));
		}
		scene.drawableObjects = null;
	};
	Context.prototype.shutdown = function(scene) {
		var gl = this.ctx3d;
		if (gl === null || scene === null || !scene
				|| scene.drawableObjects === null) {
			return;
		}
		scene.collectDrawableObjects(x3dom.fields.SFMatrix4f.identity(),
				scene.drawableObjects);
		if (scene._webgl.texture !== undefined && scene._webgl.texture) {
			gl.deleteTexture(scene._webgl.texture);
		}
		if (scene._webgl.shader.position !== undefined) {
			gl.deleteBuffer(scene._webgl.buffers[1]);
			gl.deleteBuffer(scene._webgl.buffers[0]);
		}
		for ( var i = 0, n = scene.drawableObjects.length; i < n; i++) {
			var shape = scene.drawableObjects[i][1];
			var sp = shape._webgl.shader;
			for ( var cnt = 0; shape._webgl.texture !== undefined
					&& cnt < shape._webgl.texture.length; cnt++) {
				if (shape._webgl.texture[cnt]) {
					gl.deleteTexture(shape._webgl.texture[cnt]);
				}
			}
			if (sp.position !== undefined) {
				gl.deleteBuffer(shape._webgl.buffers[1]);
				gl.deleteBuffer(shape._webgl.buffers[0]);
			}
			if (sp.normal !== undefined) {
				gl.deleteBuffer(shape._webgl.buffers[2]);
			}
			if (sp.texcoord !== undefined) {
				gl.deleteBuffer(shape._webgl.buffers[3]);
			}
			if (sp.color !== undefined) {
				gl.deleteBuffer(shape._webgl.buffers[4]);
			}
			for ( var df = 0; df < shape._webgl.dynamicFields.length; df++) {
				var attrib = shape._webgl.dynamicFields[df];
				if (sp[attrib.name] !== undefined) {
					gl.deleteBuffer(attrib.buf);
				}
			}
		}
	};
	Context.prototype.loadCubeMap = function(gl, url, doc, bgnd) {
		var texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S,
				gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T,
				gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
		var faces;
		if (bgnd) {
			faces = [ gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
					gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
					gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
					gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
					gl.TEXTURE_CUBE_MAP_POSITIVE_X,
					gl.TEXTURE_CUBE_MAP_NEGATIVE_X ];
		} else {
			faces = [ gl.TEXTURE_CUBE_MAP_POSITIVE_X,
					gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
					gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
					gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
					gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
					gl.TEXTURE_CUBE_MAP_NEGATIVE_Z ];
		}
		texture.pendingTextureLoads = -1;
		texture.textureCubeReady = false;
		for ( var i = 0; i < faces.length; i++) {
			var face = faces[i];
			var image = new Image();
			texture.pendingTextureLoads++;
			doc.downloadCount += 1;
			image.onload = function(texture, face, image, swap) {
				return function() {
					gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
					gl.texImage2D(face, 0, image, swap);
					gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
					texture.pendingTextureLoads--;
					doc.downloadCount -= 1;
					if (texture.pendingTextureLoads < 0) {
						texture.textureCubeReady = true;
						x3dom.debug.logInfo("Loading CubeMap finished...");
						doc.needRender = true;
					}
				};
			}(texture, face, image, (bgnd && (i <= 1 || i >= 4)));
			image.src = url[i];
		}
		return texture;
	};
	Context.prototype.emptyTexImage2D = function(gl, internalFormat, width,
			height, format, type) {
		var bytes = 3;
		switch (internalFormat) {
		case gl.DEPTH_COMPONENT:
			bytes = 3;
			break;
		case gl.ALPHA:
			bytes = 1;
			break;
		case gl.RGB:
			bytes = 3;
			break;
		case gl.RGBA:
			bytes = 4;
			break;
		case gl.LUMINANCE:
			bytes = 1;
			break;
		case gl.LUMINANCE_ALPHA:
			bytes = 2;
			break;
		}
		var pixels = new WebGLUnsignedByteArray(width * height * bytes);
		gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0,
				format, type, pixels);
	};
	Context.prototype.initTex = function(gl, w, h, nearest) {
		var tex = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, tex);
		this.emptyTexImage2D(gl, gl.RGBA, w, h, gl.RGBA, gl.UNSIGNED_BYTE);
		if (nearest) {
			gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		} else {
			gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		}
		gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.bindTexture(gl.TEXTURE_2D, null);
		tex.width = w;
		tex.height = h;
		return tex;
	};
	Context.prototype.initFbo = function(gl, w, h, nearest) {
		var fbo = gl.createFramebuffer();
		var rb = gl.createRenderbuffer();
		var tex = this.initTex(gl, w, h, nearest);
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
		gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT, w, h);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
				gl.TEXTURE_2D, tex, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
				gl.RENDERBUFFER, rb);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		var r = {};
		r.fbo = fbo;
		r.rbo = rb;
		r.tex = tex;
		r.width = w;
		r.height = h;
		return r;
	};
	return setupContext;
})();
x3dom.nodeTypes = {};
x3dom.nodeTypesLC = {};
x3dom.components = {};
x3dom.registerNodeType = function(nodeTypeName, componentName, nodeDef) {
	x3dom.debug.logInfo("Registering nodetype [" + nodeTypeName
			+ "] in component [" + componentName + "]");
	if (x3dom.components[componentName] === undefined) {
		x3dom.debug.logInfo("Adding new component [" + componentName + "]");
		x3dom.components[componentName] = {};
	} else {
		x3dom.debug.logInfo("Using component [" + componentName + "]");
	}
	nodeDef._typeName = nodeTypeName;
	nodeDef._compName = componentName;
	x3dom.components[componentName][nodeTypeName] = nodeDef;
	x3dom.nodeTypes[nodeTypeName] = nodeDef;
	x3dom.nodeTypesLC[nodeTypeName.toLowerCase()] = nodeDef;
};
x3dom.isX3DElement = function(node) {
	return (node.nodeType === Node.ELEMENT_NODE && node.localName && (x3dom.nodeTypes[node.localName]
			|| x3dom.nodeTypesLC[node.localName.toLowerCase()]
			|| node.localName.toLowerCase() === "x3d"
			|| node.localName.toLowerCase() === "websg"
			|| node.localName.toLowerCase() === "scene" || node.localName
			.toLowerCase() === "route"));
};
x3dom.BindableStack = function(type, defaultType, defaultRoot) {
	this.type = type;
	this.defaultType = type;
	this.defaultRoot = defaultRoot;
	this.bindBag = [];
	this.bindStack = [];
};
x3dom.BindableStack.prototype.getActive = function() {
	if (this.bindStack.empty) {
		if (this.bindBag.empty) {
			var obj = new this.defaultType();
			this.defaultRoot.addChild(obj);
			obj.initDefault();
			this.bindBag.push(obj);
		}
		this.bindBag[0].activate();
		this.bindStack.push(this.bindBag[0]);
	}
	return this.bindStack[this.bindStack.length].top();
};
x3dom.BindableBag = function(defaultRoot) {
	this.addType("X3DViewpointNode", "Viewpoint", getViewpoint, defaultRoot);
	this.addType("X3DNavigationInfoNode", "NavigationInfo", getNavigationInfo,
			defaultRoot);
	this.addType("X3DBackgroundNode", "Background", getBackground, defaultRoot);
	this.addType("X3DFogNode", "Fog", getFog, defaultRoot);
};
x3dom.BindableBag.prototype.addType = function(typeName, defaultTypeName,
		getter, defaultRoot) {
	var type = x3dom.nodeTypes[typeName];
	var defaultType = x3dom.nodeTypes[defaultTypeName];
	var stack;
	if (type && defaultType) {
		stack = new x3dom.BindableStack(type, defaultType, defaultRoot);
		this[typeName] = this;
		this[getter] = function(stack) {
			return stack.getActive();
		};
	} else {
		x3dom.debug.logInfo('Invalid Bindable type/defaultType:' + typeName
				+ '/' + defaultType);
	}
};
x3dom.NodeNameSpace = function(name, document) {
	this.name = name;
	this.doc = document;
	this.baseURL = "";
	this.defMap = {};
	this.parent = null;
	this.childSpaces = [];
};
x3dom.NodeNameSpace.prototype.addNode = function(node, name) {
	this.defMap[name] = node;
	node.nameSpace = this;
};
x3dom.NodeNameSpace.prototype.removeNode = function(name) {
	var node = this.defMap.name;
	delete this.defMap.name;
	if (node) {
		node.nameSpace = null;
	}
};
x3dom.NodeNameSpace.prototype.getNamedNode = function(name) {
	return this.defMap[name];
};
x3dom.NodeNameSpace.prototype.getNamedElement = function(name) {
	var node = this.defMap[name];
	return (node ? node._xmlNode : null);
};
x3dom.NodeNameSpace.prototype.addSpace = function(space) {
	this.childSpaces.push(space);
	space.parent = this;
};
x3dom.NodeNameSpace.prototype.removeSpace = function(space) {
	this.childSpaces.push(space);
	space.parent = null;
};
x3dom.NodeNameSpace.prototype.setBaseURL = function(url) {
	var i = url.lastIndexOf("/");
	this.baseURL = (i >= 0) ? url.substr(0, i + 1) : "";
	x3dom.debug.logInfo("setBaseURL: " + this.baseURL);
};
x3dom.NodeNameSpace.prototype.getURL = function(url) {
	if (url === undefined || !url.length) {
		return "";
	} else {
		return ((url[0] === '/') || (url.indexOf(":") >= 0)) ? url
				: (this.baseURL + url);
	}
};
x3dom.setElementAttribute = function(attrName, newVal) {
	var prevVal = this.getAttribute(attrName);
	this.__setAttribute(attrName, newVal);
	this._x3domNode.updateField(attrName, newVal);
	this._x3domNode._nameSpace.doc.needRender = true;
};
x3dom.NodeNameSpace.prototype.setupTree = function(domNode) {
	var n, t;
	if (x3dom.isX3DElement(domNode)) {
		if ((x3dom.userAgentFeature.supportsDOMAttrModified === false)
				&& (domNode.tagName !== undefined)) {
			domNode.__setAttribute = domNode.setAttribute;
			domNode.setAttribute = x3dom.setElementAttribute;
		}
		if (domNode.hasAttribute('USE')) {
			n = this.defMap[domNode.getAttribute('USE')];
			if (n === null)
				x3dom.debug.logInfo('Could not USE: ' + domNode
						.getAttribute('USE'));
			return n;
		} else {
			if (domNode.localName.toLowerCase() === 'route') {
				var route = domNode;
				var fromNode = this.defMap[route.getAttribute('fromNode')];
				var toNode = this.defMap[route.getAttribute('toNode')];
				if (!(fromNode && toNode)) {
					x3dom.debug
							.logInfo("Broken route - can't find all DEFs for "
									+ route.getAttribute('fromNode') + " -> "
									+ route.getAttribute('toNode'));
					return null;
				}
				fromNode.setupRoute(route.getAttribute('fromField'), toNode,
						route.getAttribute('toField'));
				return null;
			}
			var nodeType = x3dom.nodeTypesLC[domNode.localName.toLowerCase()];
			if (nodeType === undefined) {
				x3dom.debug.logInfo("Unrecognised X3D element &lt;"
						+ domNode.localName + "&gt;.");
			} else {
				var ctx = {
					doc : this.doc,
					xmlNode : domNode
				};
				n = new nodeType(ctx);
				n._nameSpace = this;
				if (domNode.hasAttribute('DEF')) {
					n._DEF = domNode.getAttribute('DEF');
					this.defMap[n._DEF] = n;
				} else {
					if (domNode.hasAttribute('id')) {
						n._DEF = domNode.getAttribute('id');
						this.defMap[n._DEF] = n;
					}
				}
				n._xmlNode = domNode;
				domNode._x3domNode = n;
				var that = this;
				Array.forEach(domNode.childNodes, function(childDomNode) {
					var c = that.setupTree(childDomNode);
					if (c)
						n.addChild(c, childDomNode
								.getAttribute("containerField"));
				});
				n.nodeChanged();
				return n;
			}
		}
	} else if (domNode.localName) {
		x3dom.debug.logInfo("Unrecognised X3D element &lt;" + domNode.localName
				+ "&gt;.");
		n = null;
	}
	return n;
};
function defineClass(parent, ctor, methods) {
	if (parent) {
		function inheritance() {
		}
		inheritance.prototype = parent.prototype;
		ctor.prototype = new inheritance();
		ctor.prototype.constructor = ctor;
		ctor.superClass = parent;
	}
	if (methods) {
		for ( var m in methods) {
			ctor.prototype[m] = methods[m];
		}
	}
	return ctor;
}
x3dom.isa = function(object, clazz) {
	if (object.constructor == clazz) {
		return true;
	}
	function f(c) {
		if (c == clazz) {
			return true;
		}
		if (c.prototype && c.prototype.constructor
				&& c.prototype.constructor.superClass) {
			return f(c.prototype.constructor.superClass);
		}
		return false;
	}
	return f(object.constructor.superClass);
};
x3dom
		.registerNodeType(
				"X3DNode",
				"Core",
				defineClass(
						null,
						function(ctx) {
							this._DEF = null;
							this._nameSpace = null;
							this._vf = {};
							this._cf = {};
							this._fieldWatchers = {};
							this._parentNodes = [];
							this._childNodes = [];
						},
						{
							addChild : function(node, containerFieldName) {
								if (node) {
									var field = null;
									if (containerFieldName) {
										field = this._cf[containerFieldName];
									} else {
										for ( var fieldName in this._cf) {
											if (this._cf
													.hasOwnProperty(fieldName)) {
												var testField = this._cf[fieldName];
												if (x3dom.isa(node,
														testField.type)) {
													field = testField;
													break;
												}
											}
										}
									}
									if (field && field.addLink(node)) {
										node._parentNodes.push(this);
										this._childNodes.push(node);
										return true;
									}
								}
								return false;
							},
							removeChild : function(node) {
								if (node) {
									for ( var fieldName in this._cf) {
										if (this._cf.hasOwnProperty(fieldName)) {
											var field = this._cf[fieldName];
											if (field.rmLink(node)) {
												for ( var i = 0, n = node._parentNodes.length; i < n; i++) {
													if (node._parentNode === this) {
														node._parentNodes
																.splice(i, 1);
													}
												}
												for ( var j = 0, m = this._childNodes.length; j < m; j++) {
													if (this._childNodes[j] === node) {
														this._childNodes
																.splice(j, 1);
														return true;
													}
												}
											}
										}
									}
								}
								return false;
							},
							getCurrentTransform : function() {
								if (this._parentNodes.length >= 1) {
									return this
											.transformMatrix(this._parentNodes[0]
													.getCurrentTransform());
								} else {
									return x3dom.fields.SFMatrix4f.identity();
								}
							},
							transformMatrix : function(transform) {
								return transform;
							},
							getVolume : function(min, max, invalidate) {
								var valid = false;
								for ( var i = 0, n = this._childNodes.length; i < n; i++) {
									if (this._childNodes[i]) {
										var childMin = x3dom.fields.SFVec3f
												.MAX();
										var childMax = x3dom.fields.SFVec3f
												.MIN();
										valid = this._childNodes[i].getVolume(
												childMin, childMax, invalidate)
												|| valid;
										if (valid) {
											if (min.x > childMin.x)
												min.x = childMin.x;
											if (min.y > childMin.y)
												min.y = childMin.y;
											if (min.z > childMin.z)
												min.z = childMin.z;
											if (max.x < childMax.x)
												max.x = childMax.x;
											if (max.y < childMax.y)
												max.y = childMax.y;
											if (max.z < childMax.z)
												max.z = childMax.z;
										}
									}
								}
								return valid;
							},
							find : function(type) {
								for ( var i = 0; i < this._childNodes.length; i++) {
									if (this._childNodes[i]) {
										if (this._childNodes[i].constructor == type) {
											return this._childNodes[i];
										}
										var c = this._childNodes[i].find(type);
										if (c) {
											return c;
										}
									}
								}
								return null;
							},
							findAll : function(type) {
								var found = [];
								for ( var i = 0; i < this._childNodes.length; i++) {
									if (this._childNodes[i]) {
										if (this._childNodes[i].constructor == type) {
											found.push(this._childNodes[i]);
										}
										found = found
												.concat(this._childNodes[i]
														.findAll(type));
									}
								}
								return found;
							},
							findParentProperty : function(propertyName) {
								var value = this[propertyName];
								if (!value) {
									for ( var i = 0, n = this._parentNodes.length; i < n; i++) {
										if ((value = this._parentNodes[i]
												.findParentProperty(propertyName))) {
											break;
										}
									}
								}
								return value;
							},
							findX3DDoc : function() {
								return this._nameSpace.doc;
							},
							collectDrawableObjects : function(transform, out) {
								for ( var i = 0; i < this._childNodes.length; i++) {
									if (this._childNodes[i]) {
										var childTransform = this._childNodes[i]
												.transformMatrix(transform);
										this._childNodes[i]
												.collectDrawableObjects(
														childTransform, out);
									}
								}
							},
							doIntersect : function(line) {
								var isect = false;
								for ( var i = 0; i < this._childNodes.length; i++) {
									if (this._childNodes[i]) {
										isect = this._childNodes[i]
												.doIntersect(line)
												|| isect;
									}
								}
								return isect;
							},
							postMessage : function(field, msg) {
								var listeners = this._fieldWatchers[field];
								var thisp = this;
								if (listeners) {
									Array.forEach(listeners, function(l) {
										l.call(thisp, msg);
									});
								}
							},
							updateField : function(field, msg) {
								var f = this._vf[field];
								if (f === undefined) {
									f = {};
									this._vf[field] = f;
								}
								if (f !== null) {
									try {
										this._vf[field].setValueByStr(msg);
									} catch (exc1) {
										try {
											switch ((typeof (this._vf[field]))
													.toString()) {
											case "number":
												this._vf[field] = +msg;
												break;
											case "boolean":
												this._vf[field] = (msg
														.toLowerCase() === "true");
												break;
											case "string":
												this._vf[field] = msg;
												break;
											}
											;
										} catch (exc2) {
											x3dom.debug
													.logInfo("updateField: setValueByStr() NYI for "
															+ typeof (f));
										}
									}
									this.fieldChanged(field);
								}
							},
							setupRoute : function(fromField, toNode, toField) {
								var pos;
								var fieldName;
								var pre = "set_", post = "_changed";
								if (!this._vf[fromField]) {
									pos = fromField.indexOf(pre);
									if (pos === 0) {
										fieldName = fromField.substr(
												pre.length,
												fromField.length - 1);
										if (this._vf[fieldName])
											fromField = fieldName;
									} else {
										pos = fromField.indexOf(post);
										if (pos > 0) {
											fieldName = fromField.substr(0,
													fromField.length
															- post.length);
											if (this._vf[fieldName])
												fromField = fieldName;
										}
									}
								}
								if (!toNode._vf[toField]) {
									pos = toField.indexOf(pre);
									if (pos === 0) {
										fieldName = toField.substr(pre.length,
												toField.length - 1);
										if (toNode._vf[fieldName])
											toField = fieldName;
									} else {
										pos = toField.indexOf(post);
										if (pos > 0) {
											fieldName = toField.substr(0,
													toField.length
															- post.length);
											if (toNode._vf[fieldName])
												toField = fieldName;
										}
									}
								}
								if (!this._fieldWatchers[fromField]) {
									this._fieldWatchers[fromField] = [];
								}
								this._fieldWatchers[fromField].push(function(
										msg) {
									toNode.postMessage(toField, msg);
								});
								if (!toNode._fieldWatchers[toField]) {
									toNode._fieldWatchers[toField] = [];
								}
								toNode._fieldWatchers[toField].push(function(
										msg) {
									toNode._vf[toField] = msg;
									toNode.fieldChanged(toField);
								});
							},
							fieldChanged : function(fieldName) {
							},
							nodeChanged : function() {
							},
							addField_SFInt32 : function(ctx, name, n) {
								this._vf[name] = ctx
										&& ctx.xmlNode.hasAttribute(name) ? parseInt(
										ctx.xmlNode.getAttribute(name), 10)
										: n;
							},
							addField_SFFloat : function(ctx, name, n) {
								this._vf[name] = ctx
										&& ctx.xmlNode.hasAttribute(name) ? +ctx.xmlNode
										.getAttribute(name)
										: n;
							},
							addField_SFTime : function(ctx, name, n) {
								this._vf[name] = ctx
										&& ctx.xmlNode.hasAttribute(name) ? +ctx.xmlNode
										.getAttribute(name)
										: n;
							},
							addField_SFBool : function(ctx, name, n) {
								this._vf[name] = ctx
										&& ctx.xmlNode.hasAttribute(name) ? ctx.xmlNode
										.getAttribute(name).toLowerCase() === "true"
										: n;
							},
							addField_SFString : function(ctx, name, n) {
								this._vf[name] = ctx
										&& ctx.xmlNode.hasAttribute(name) ? ctx.xmlNode
										.getAttribute(name)
										: n;
							},
							addField_SFColor : function(ctx, name, r, g, b) {
								this._vf[name] = ctx
										&& ctx.xmlNode.hasAttribute(name) ? x3dom.fields.SFColor
										.parse(ctx.xmlNode.getAttribute(name))
										: new x3dom.fields.SFColor(r, g, b);
							},
							addField_SFVec2f : function(ctx, name, x, y) {
								this._vf[name] = ctx
										&& ctx.xmlNode.hasAttribute(name) ? x3dom.fields.SFVec2f
										.parse(ctx.xmlNode.getAttribute(name))
										: new x3dom.fields.SFVec2f(x, y);
							},
							addField_SFVec3f : function(ctx, name, x, y, z) {
								this._vf[name] = ctx
										&& ctx.xmlNode.hasAttribute(name) ? x3dom.fields.SFVec3f
										.parse(ctx.xmlNode.getAttribute(name))
										: new x3dom.fields.SFVec3f(x, y, z);
							},
							addField_SFRotation : function(ctx, name, x, y, z,
									a) {
								this._vf[name] = ctx
										&& ctx.xmlNode.hasAttribute(name) ? x3dom.fields.Quaternion
										.parseAxisAngle(ctx.xmlNode
												.getAttribute(name))
										: x3dom.fields.Quaternion.axisAngle(
												new x3dom.fields.SFVec3f(x, y,
														z), a);
							},
							addField_SFMatrix4f : function(ctx, name, _00, _01,
									_02, _03, _10, _11, _12, _13, _20, _21,
									_22, _23, _30, _31, _32, _33) {
								this._vf[name] = ctx
										&& ctx.xmlNode.hasAttribute(name) ? x3dom.fields.SFMatrix4f
										.parse(ctx.xmlNode.getAttribute(name))
										: new x3dom.fields.SFMatrix4f(_00, _01,
												_02, _03, _10, _11, _12, _13,
												_20, _21, _22, _23, _30, _31,
												_32, _33);
							},
							addField_MFString : function(ctx, name, def) {
								this._vf[name] = ctx
										&& ctx.xmlNode.hasAttribute(name) ? x3dom.fields.MFString
										.parse(ctx.xmlNode.getAttribute(name))
										: new x3dom.fields.MFString(def);
							},
							addField_MFInt32 : function(ctx, name, def) {
								this._vf[name] = ctx
										&& ctx.xmlNode.hasAttribute(name) ? x3dom.fields.MFInt32
										.parse(ctx.xmlNode.getAttribute(name))
										: new x3dom.fields.MFInt32(def);
							},
							addField_MFFloat : function(ctx, name, def) {
								this._vf[name] = ctx
										&& ctx.xmlNode.hasAttribute(name) ? x3dom.fields.MFFloat
										.parse(ctx.xmlNode.getAttribute(name))
										: new x3dom.fields.MFFloat(def);
							},
							addField_MFColor : function(ctx, name, def) {
								this._vf[name] = ctx
										&& ctx.xmlNode.hasAttribute(name) ? x3dom.fields.MFColor
										.parse(ctx.xmlNode.getAttribute(name))
										: new x3dom.fields.MFColor(def);
							},
							addField_MFVec2f : function(ctx, name, def) {
								this._vf[name] = ctx
										&& ctx.xmlNode.hasAttribute(name) ? x3dom.fields.MFVec2f
										.parse(ctx.xmlNode.getAttribute(name))
										: new x3dom.fields.MFVec2f(def);
							},
							addField_MFVec3f : function(ctx, name, def) {
								this._vf[name] = ctx
										&& ctx.xmlNode.hasAttribute(name) ? x3dom.fields.MFVec3f
										.parse(ctx.xmlNode.getAttribute(name))
										: new x3dom.fields.MFVec3f(def);
							},
							addField_MFRotation : function(ctx, name, def) {
								this._vf[name] = ctx
										&& ctx.xmlNode.hasAttribute(name) ? x3dom.fields.MFRotation
										.parse(ctx.xmlNode.getAttribute(name))
										: new x3dom.fields.MFRotation(def);
							},
							addField_SFNode : function(name, type) {
								this._cf[name] = new x3dom.fields.SFNode(type);
							},
							addField_MFNode : function(name, type) {
								this._cf[name] = new x3dom.fields.MFNode(type);
							}
						}));
x3dom.registerNodeType("Field", "Core", defineClass(x3dom.nodeTypes.X3DNode,
		function(ctx) {
			x3dom.nodeTypes.Field.superClass.call(this, ctx);
			this.addField_SFString(ctx, 'name', "");
			this.addField_SFString(ctx, 'type', "");
			this.addField_SFString(ctx, 'value', "");
		}, {
			fieldChanged : function(fieldName) {
				var that = this;
				if (fieldName === 'value') {
					Array.forEach(this._parentNodes, function(node) {
						node.fieldChanged(that._vf.name);
					});
				}
			}
		}));
x3dom.registerNodeType("Uniform", "Shaders", defineClass(x3dom.nodeTypes.Field,
		function(ctx) {
			x3dom.nodeTypes.Uniform.superClass.call(this, ctx);
		}));
x3dom.registerNodeType("X3DAppearanceNode", "Shape", defineClass(
		x3dom.nodeTypes.X3DNode, function(ctx) {
			x3dom.nodeTypes.X3DAppearanceNode.superClass.call(this, ctx);
		}));
x3dom.registerNodeType("Appearance", "Shape", defineClass(
		x3dom.nodeTypes.X3DAppearanceNode, function(ctx) {
			x3dom.nodeTypes.Appearance.superClass.call(this, ctx);
			this.addField_SFNode('material', x3dom.nodeTypes.X3DMaterialNode);
			this.addField_SFNode('texture', x3dom.nodeTypes.X3DTextureNode);
			this.addField_SFNode('textureTransform',
					x3dom.nodeTypes.X3DTextureTransformNode);
			this.addField_MFNode('shaders', x3dom.nodeTypes.X3DShaderNode);
			this._shader = null;
		}, {
			nodeChanged : function() {
				if (!this._cf.material.node) {
					this.addChild(x3dom.nodeTypes.Material.defaultNode());
				}
				if (this._cf.shaders.nodes.length) {
					this._shader = this._cf.shaders.nodes[0];
				}
			},
			transformMatrix : function() {
				if (this._cf.textureTransform.node === null) {
					return x3dom.fields.SFMatrix4f.identity();
				} else {
					return this._cf.textureTransform.node.transformMatrix();
				}
			}
		}));
x3dom.nodeTypes.Appearance.defaultNode = function() {
	if (!x3dom.nodeTypes.Appearance._defaultNode) {
		x3dom.nodeTypes.Appearance._defaultNode = new x3dom.nodeTypes.Appearance();
		x3dom.nodeTypes.Appearance._defaultNode.nodeChanged();
	}
	return x3dom.nodeTypes.Appearance._defaultNode;
};
x3dom.registerNodeType("X3DAppearanceChildNode", "Shape", defineClass(
		x3dom.nodeTypes.X3DNode, function(ctx) {
			x3dom.nodeTypes.X3DAppearanceChildNode.superClass.call(this, ctx);
		}));
x3dom.registerNodeType("X3DMaterialNode", "Shape", defineClass(
		x3dom.nodeTypes.X3DAppearanceChildNode, function(ctx) {
			x3dom.nodeTypes.X3DMaterialNode.superClass.call(this, ctx);
		}));
x3dom.registerNodeType("Material", "Shape", defineClass(
		x3dom.nodeTypes.X3DMaterialNode, function(ctx) {
			x3dom.nodeTypes.Material.superClass.call(this, ctx);
			this.addField_SFFloat(ctx, 'ambientIntensity', 0.2);
			this.addField_SFColor(ctx, 'diffuseColor', 0.8, 0.8, 0.8);
			this.addField_SFColor(ctx, 'emissiveColor', 0, 0, 0);
			this.addField_SFFloat(ctx, 'shininess', 0.2);
			this.addField_SFColor(ctx, 'specularColor', 0, 0, 0);
			this.addField_SFFloat(ctx, 'transparency', 0);
		}));
x3dom.nodeTypes.Material.defaultNode = function() {
	if (!x3dom.nodeTypes.Material._defaultNode) {
		x3dom.nodeTypes.Material._defaultNode = new x3dom.nodeTypes.Material();
		x3dom.nodeTypes.Material._defaultNode.nodeChanged();
	}
	return x3dom.nodeTypes.Material._defaultNode;
};
x3dom.registerNodeType("X3DTextureTransformNode", "Texturing", defineClass(
		x3dom.nodeTypes.X3DAppearanceChildNode, function(ctx) {
			x3dom.nodeTypes.X3DTextureTransformNode.superClass.call(this, ctx);
		}));
x3dom
		.registerNodeType(
				"TextureTransform",
				"Texturing",
				defineClass(
						x3dom.nodeTypes.X3DTextureTransformNode,
						function(ctx) {
							x3dom.nodeTypes.TextureTransform.superClass.call(
									this, ctx);
							this.addField_SFVec2f(ctx, 'center', 0, 0);
							this.addField_SFFloat(ctx, 'rotation', 0);
							this.addField_SFVec2f(ctx, 'scale', 1, 1);
							this.addField_SFVec2f(ctx, 'translation', 0, 0);
							var negCenter = new x3dom.fields.SFVec3f(
									-this._vf.center.x, -this._vf.center.y, 1);
							var posCenter = new x3dom.fields.SFVec3f(
									this._vf.center.x, this._vf.center.y, 0);
							var trans3 = new x3dom.fields.SFVec3f(
									this._vf.translation.x,
									this._vf.translation.y, 0);
							var scale3 = new x3dom.fields.SFVec3f(
									this._vf.scale.x, this._vf.scale.y, 0);
							this._trafo = x3dom.fields.SFMatrix4f
									.translation(negCenter)
									.mult(x3dom.fields.SFMatrix4f.scale(scale3))
									.mult(
											x3dom.fields.SFMatrix4f
													.rotationZ(this._vf.rotation))
									.mult(
											x3dom.fields.SFMatrix4f
													.translation(posCenter
															.add(trans3)));
						},
						{
							fieldChanged : function(fieldName) {
								var negCenter = new x3dom.fields.SFVec3f(
										-this._vf.center.x, -this._vf.center.y,
										1);
								var posCenter = new x3dom.fields.SFVec3f(
										this._vf.center.x, this._vf.center.y, 0);
								var trans3 = new x3dom.fields.SFVec3f(
										this._vf.translation.x,
										this._vf.translation.y, 0);
								var scale3 = new x3dom.fields.SFVec3f(
										this._vf.scale.x, this._vf.scale.y, 0);
								this._trafo = x3dom.fields.SFMatrix4f
										.translation(negCenter)
										.mult(
												x3dom.fields.SFMatrix4f
														.scale(scale3))
										.mult(
												x3dom.fields.SFMatrix4f
														.rotationZ(this._vf.rotation))
										.mult(
												x3dom.fields.SFMatrix4f
														.translation(posCenter
																.add(trans3)));
							},
							transformMatrix : function() {
								return this._trafo;
							}
						}));
x3dom.registerNodeType("TextureProperties", "Texturing", defineClass(
		x3dom.nodeTypes.X3DNode, function(ctx) {
			x3dom.nodeTypes.TextureProperties.superClass.call(this, ctx);
			this.addField_SFFloat(ctx, 'anisotropicDegree', 1.0);
			this.addField_SFInt32(ctx, 'borderWidth', 0);
			this.addField_SFString(ctx, 'boundaryModeS', "REPEAT");
			this.addField_SFString(ctx, 'boundaryModeT', "REPEAT");
			this.addField_SFString(ctx, 'boundaryModeR', "REPEAT");
			this.addField_SFString(ctx, 'magnificationFilter', "FASTEST");
			this.addField_SFString(ctx, 'minificationFilter', "FASTEST");
			this.addField_SFString(ctx, 'textureCompression', "FASTEST");
			this.addField_SFFloat(ctx, 'texturePriority', 0);
			this.addField_SFBool(ctx, 'generateMipMaps', false);
			x3dom.debug.logInfo("TextureProperties NYI");
		}));
x3dom.registerNodeType("X3DTextureNode", "Texturing", defineClass(
		x3dom.nodeTypes.X3DAppearanceChildNode, function(ctx) {
			x3dom.nodeTypes.X3DTextureNode.superClass.call(this, ctx);
			this.addField_MFString(ctx, 'url', []);
			this.addField_SFBool(ctx, 'repeatS', true);
			this.addField_SFBool(ctx, 'repeatT', true);
			this.addField_SFNode('textureProperties',
					x3dom.nodeTypes.TextureProperties);
		}, {
			fieldChanged : function(fieldName) {
				if (fieldName == "url") {
					Array.forEach(this._parentNodes, function(app) {
						Array.forEach(app._parentNodes, function(shape) {
							shape._dirty.texture = true;
						});
					});
				}
			},
			getTexture : function(pos) {
				if (pos === 0) {
					return this;
				}
				return null;
			},
			size : function() {
				return 1;
			}
		}));
x3dom.registerNodeType("MultiTexture", "Texturing", defineClass(
		x3dom.nodeTypes.X3DTextureNode, function(ctx) {
			x3dom.nodeTypes.MultiTexture.superClass.call(this, ctx);
			this.addField_MFNode('texture', x3dom.nodeTypes.X3DTextureNode);
		}, {
			getTexture : function(pos) {
				if (pos >= 0 && pos < this._cf.texture.nodes.length) {
					return this._cf.texture.nodes[pos];
				}
				return null;
			},
			size : function() {
				return this._cf.texture.nodes.length;
			}
		}));
x3dom
		.registerNodeType(
				"Texture",
				"Texturing",
				defineClass(
						x3dom.nodeTypes.X3DTextureNode,
						function(ctx) {
							x3dom.nodeTypes.Texture.superClass.call(this, ctx);
							if (!this._vf.url.length && ctx.xmlNode) {
								x3dom.debug
										.logInfo("No Texture URL given, searching for &lt;img&gt; elements...");
								var that = this;
								try {
									Array
											.forEach(
													ctx.xmlNode.childNodes,
													function(childDomNode) {
														if (childDomNode.nodeType === 1) {
															var url = childDomNode
																	.getAttribute("src");
															if (url) {
																that._vf.url
																		.push(url);
																childDomNode.style.display = "none";
																x3dom.debug
																		.logInfo(that._vf.url[that._vf.url.length - 1]);
															}
														}
													});
								} catch (e) {
								}
							}
						}, {}));
x3dom.registerNodeType("ImageTexture", "Texturing", defineClass(
		x3dom.nodeTypes.Texture, function(ctx) {
			x3dom.nodeTypes.ImageTexture.superClass.call(this, ctx);
		}, {}));
x3dom.registerNodeType("MovieTexture", "Texturing", defineClass(
		x3dom.nodeTypes.Texture, function(ctx) {
			x3dom.nodeTypes.MovieTexture.superClass.call(this, ctx);
			this.addField_SFBool(ctx, 'loop', false);
			this.addField_SFFloat(ctx, 'speed', 1.0);
			this._video = null;
			this._intervalID = 0;
		}, {}));
x3dom.registerNodeType("X3DEnvironmentTextureNode", "CubeMapTexturing",
		defineClass(x3dom.nodeTypes.X3DTextureNode, function(ctx) {
			x3dom.nodeTypes.X3DEnvironmentTextureNode.superClass
					.call(this, ctx);
		}, {
			getTexUrl : function() {
				return [];
			}
		}));
x3dom
		.registerNodeType(
				"ComposedCubeMapTexture",
				"CubeMapTexturing",
				defineClass(
						x3dom.nodeTypes.X3DEnvironmentTextureNode,
						function(ctx) {
							x3dom.nodeTypes.ComposedCubeMapTexture.superClass
									.call(this, ctx);
							this.addField_SFNode('back',
									x3dom.nodeTypes.Texture);
							this.addField_SFNode('front',
									x3dom.nodeTypes.Texture);
							this.addField_SFNode('bottom',
									x3dom.nodeTypes.Texture);
							this
									.addField_SFNode('top',
											x3dom.nodeTypes.Texture);
							this.addField_SFNode('left',
									x3dom.nodeTypes.Texture);
							this.addField_SFNode('right',
									x3dom.nodeTypes.Texture);
						},
						{
							getTexUrl : function() {
								return [
										this._nameSpace
												.getURL(this._cf.right.node._vf.url[0]),
										this._nameSpace
												.getURL(this._cf.left.node._vf.url[0]),
										this._nameSpace
												.getURL(this._cf.top.node._vf.url[0]),
										this._nameSpace
												.getURL(this._cf.bottom.node._vf.url[0]),
										this._nameSpace
												.getURL(this._cf.front.node._vf.url[0]),
										this._nameSpace
												.getURL(this._cf.back.node._vf.url[0]) ];
							}
						}));
x3dom.registerNodeType("X3DShaderNode", "Shaders", defineClass(
		x3dom.nodeTypes.X3DAppearanceChildNode, function(ctx) {
			x3dom.nodeTypes.X3DShaderNode.superClass.call(this, ctx);
			this.addField_SFString(ctx, 'language', "");
		}));
x3dom
		.registerNodeType(
				"ComposedShader",
				"Shaders",
				defineClass(
						x3dom.nodeTypes.X3DShaderNode,
						function(ctx) {
							x3dom.nodeTypes.ComposedShader.superClass.call(
									this, ctx);
							this.addField_MFNode('fields',
									x3dom.nodeTypes.Field);
							this.addField_MFNode('parts',
									x3dom.nodeTypes.ShaderPart);
							this._vertex = null;
							this._fragment = null;
							x3dom.debug
									.logInfo("Current ComposedShader node implementation limitations:\n"
											+ "Vertex attributes (if given in the standard X3D fields 'coord', 'color', "
											+ "'normal', 'texCoord'), matrices and texture are provided as follows...\n"
											+ "    attribute vec3 position;\n"
											+ "    attribute vec3 normal;\n"
											+ "    attribute vec2 texcoord;\n"
											+ "    attribute vec3 color;\n"
											+ "    uniform mat4 modelViewProjectionMatrix;\n"
											+ "    uniform mat4 modelViewMatrix;\n"
											+ "    uniform sampler2D tex;\n");
						},
						{
							nodeChanged : function() {
								var i, n = this._cf.parts.nodes.length;
								for (i = 0; i < n; i++) {
									if (this._cf.parts.nodes[i]._vf.type
											.toLowerCase() == 'vertex') {
										this._vertex = this._cf.parts.nodes[i];
									} else if (this._cf.parts.nodes[i]._vf.type
											.toLowerCase() == 'fragment') {
										this._fragment = this._cf.parts.nodes[i];
									}
								}
								var ctx = {};
								n = this._cf.fields.nodes.length;
								for (i = 0; i < n; i++) {
									var fieldName = this._cf.fields.nodes[i]._vf.name;
									ctx.xmlNode = this._cf.fields.nodes[i]._xmlNode;
									ctx.xmlNode.setAttribute(fieldName,
											this._cf.fields.nodes[i]._vf.value);
									var funcName = "this.addField_"
											+ this._cf.fields.nodes[i]._vf.type
											+ "(ctx, name);";
									var func = new Function('ctx', 'name',
											funcName);
									func.call(this, ctx, fieldName);
								}
							},
							fieldChanged : function(fieldName) {
								var i, n = this._cf.fields.nodes.length;
								for (i = 0; i < n; i++) {
									var name = this._cf.fields.nodes[i]._vf.name;
									if (name === fieldName) {
										this._vf[name]
												.setValueByStr(this._cf.fields.nodes[i]._vf.value);
										break;
									}
								}
							}
						}));
x3dom.registerNodeType("ShaderPart", "Shaders", defineClass(
		x3dom.nodeTypes.X3DNode, function(ctx) {
			x3dom.nodeTypes.ShaderPart.superClass.call(this, ctx);
			this.addField_MFString(ctx, 'url', []);
			this.addField_SFString(ctx, 'type', "VERTEX");
			x3dom.debug.assert(this._vf.type.toLowerCase() == 'vertex'
					|| this._vf.type.toLowerCase() == 'fragment');
			if (!this._vf.url.length && ctx.xmlNode) {
				var that = this;
				try {
					that._vf.url.push(ctx.xmlNode.childNodes[1].nodeValue);
					ctx.xmlNode.removeChild(ctx.xmlNode.childNodes[1]);
				} catch (e) {
					Array.forEach(ctx.xmlNode.childNodes,
							function(childDomNode) {
								if (childDomNode.nodeType === 3) {
									that._vf.url.push(childDomNode.data);
								}
								childDomNode.parentNode
										.removeChild(childDomNode);
							});
				}
			}
		}, {}));
x3dom.Mesh = function(parent) {
	this._parent = parent;
	this._min = new x3dom.fields.SFVec3f(0, 0, 0);
	this._max = new x3dom.fields.SFVec3f(0, 0, 0);
	this._invalidate = true;
};
x3dom.Mesh.prototype._dynamicFields = {};
x3dom.Mesh.prototype._positions = [];
x3dom.Mesh.prototype._normals = [];
x3dom.Mesh.prototype._texCoords = [];
x3dom.Mesh.prototype._colors = [];
x3dom.Mesh.prototype._indices = [];
x3dom.Mesh.prototype._numTexComponents = 2;
x3dom.Mesh.prototype._lit = true;
x3dom.Mesh.prototype._min = {};
x3dom.Mesh.prototype._max = {};
x3dom.Mesh.prototype._invalidate = true;
x3dom.Mesh.prototype.getBBox = function(min, max, invalidate) {
	if (this._invalidate === true && invalidate === true) {
		var coords = this._positions;
		var n = coords.length;
		if (n > 3) {
			this._min = new x3dom.fields.SFVec3f(coords[0], coords[1],
					coords[2]);
			this._max = new x3dom.fields.SFVec3f(coords[0], coords[1],
					coords[2]);
		} else {
			this._min = new x3dom.fields.SFVec3f(0, 0, 0);
			this._max = new x3dom.fields.SFVec3f(0, 0, 0);
		}
		for ( var i = 3; i < n; i += 3) {
			if (this._min.x > coords[i + 0]) {
				this._min.x = coords[i + 0];
			}
			if (this._min.y > coords[i + 1]) {
				this._min.y = coords[i + 1];
			}
			if (this._min.z > coords[i + 2]) {
				this._min.z = coords[i + 2];
			}
			if (this._max.x < coords[i + 0]) {
				this._max.x = coords[i + 0];
			}
			if (this._max.y < coords[i + 1]) {
				this._max.y = coords[i + 1];
			}
			if (this._max.z < coords[i + 2]) {
				this._max.z = coords[i + 2];
			}
		}
		this._invalidate = false;
	}
	min.setValues(this._min);
	max.setValues(this._max);
};
x3dom.Mesh.prototype.getCenter = function() {
	var min = new x3dom.fields.SFVec3f(0, 0, 0);
	var max = new x3dom.fields.SFVec3f(0, 0, 0);
	this.getBBox(min, max, true);
	var center = min.add(max).multiply(0.5);
	return center;
};
x3dom.Mesh.prototype.doIntersect = function(line) {
	var min = new x3dom.fields.SFVec3f(0, 0, 0);
	var max = new x3dom.fields.SFVec3f(0, 0, 0);
	this.getBBox(min, max, true);
	var isect = line.intersect(min, max);
	if (isect && line.enter < line.dist) {
		line.dist = line.enter;
		line.hitObject = this._parent;
		line.hitPoint = line.pos.add(line.dir.multiply(line.enter));
	}
	return isect;
};
x3dom.Mesh.prototype.calcNormals = function(creaseAngle) {
	var i = 0, j = 0, num = 0;
	var multInd = (this._multiIndIndices !== undefined && this._multiIndIndices.length);
	var coords = this._positions;
	var idxs = multInd ? this._multiIndIndices : this._indices;
	var vertNormals = [];
	var vertFaceNormals = [];
	var a, b, n = null;
	num = coords.length / 3;
	for (i = 0; i < num; ++i) {
		vertFaceNormals[i] = [];
	}
	num = idxs.length;
	for (i = 0; i < num; i += 3) {
		if (!multInd) {
			a = new x3dom.fields.SFVec3f(coords[idxs[i] * 3],
					coords[idxs[i] * 3 + 1], coords[idxs[i] * 3 + 2])
					.subtract(new x3dom.fields.SFVec3f(coords[idxs[i + 1] * 3],
							coords[idxs[i + 1] * 3 + 1],
							coords[idxs[i + 1] * 3 + 2]));
			b = new x3dom.fields.SFVec3f(coords[idxs[i + 1] * 3],
					coords[idxs[i + 1] * 3 + 1], coords[idxs[i + 1] * 3 + 2])
					.subtract(new x3dom.fields.SFVec3f(coords[idxs[i + 2] * 3],
							coords[idxs[i + 2] * 3 + 1],
							coords[idxs[i + 2] * 3 + 2]));
		} else {
			a = new x3dom.fields.SFVec3f(coords[i * 3], coords[i * 3 + 1],
					coords[i * 3 + 2]).subtract(new x3dom.fields.SFVec3f(
					coords[(i + 1) * 3], coords[(i + 1) * 3 + 1],
					coords[(i + 1) * 3 + 2]));
			b = new x3dom.fields.SFVec3f(coords[(i + 1) * 3],
					coords[(i + 1) * 3 + 1], coords[(i + 1) * 3 + 2])
					.subtract(new x3dom.fields.SFVec3f(coords[(i + 2) * 3],
							coords[(i + 2) * 3 + 1], coords[(i + 2) * 3 + 2]));
		}
		n = a.cross(b).normalize();
		vertFaceNormals[idxs[i]].push(n);
		vertFaceNormals[idxs[i + 1]].push(n);
		vertFaceNormals[idxs[i + 2]].push(n);
	}
	for (i = 0; i < coords.length; i += 3) {
		n = new x3dom.fields.SFVec3f(0, 0, 0);
		if (!multInd) {
			num = vertFaceNormals[i / 3].length;
			for (j = 0; j < num; ++j) {
				n = n.add(vertFaceNormals[i / 3][j]);
			}
		} else {
			num = vertFaceNormals[idxs[i / 3]].length;
			for (j = 0; j < num; ++j) {
				n = n.add(vertFaceNormals[idxs[i / 3]][j]);
			}
		}
		n = n.normalize();
		vertNormals[i] = n.x;
		vertNormals[i + 1] = n.y;
		vertNormals[i + 2] = n.z;
	}
	if (multInd) {
		this._multiIndIndices = [];
	}
	this._normals = vertNormals;
};
x3dom.Mesh.prototype.calcTexCoords = function(mode) {
	this._texCoords = [];
	if (mode.toLowerCase() === "sphere-local") {
		for ( var i = 0, j = 0, n = this._normals.length; i < n; i += 3) {
			this._texCoords[j++] = 0.5 + this._normals[i] / 2.0;
			this._texCoords[j++] = 0.5 + this._normals[i + 1] / 2.0;
		}
	} else {
		var min = new x3dom.fields.SFVec3f(0, 0, 0), max = new x3dom.fields.SFVec3f(
				0, 0, 0);
		this.getBBox(min, max, true);
		var dia = max.subtract(min);
		var S = 0, T = 1;
		if (dia.x >= dia.y) {
			if (dia.x >= dia.z) {
				S = 0;
				T = dia.y >= dia.z ? 1 : 2;
			} else {
				S = 2;
				T = 0;
			}
		} else {
			if (dia.y >= dia.z) {
				S = 1;
				T = dia.x >= dia.z ? 0 : 2;
			} else {
				S = 2;
				T = 1;
			}
		}
		var sDenom = 1, tDenom = 1;
		var sMin = 0, tMin = 0;
		switch (S) {
		case 0:
			sDenom = dia.x;
			sMin = min.x;
			break;
		case 1:
			sDenom = dia.y;
			sMin = min.y;
			break;
		case 2:
			sDenom = dia.z;
			sMin = min.z;
			break;
		}
		switch (T) {
		case 0:
			tDenom = dia.x;
			tMin = min.x;
			break;
		case 1:
			tDenom = dia.y;
			tMin = min.y;
			break;
		case 2:
			tDenom = dia.z;
			tMin = min.z;
			break;
		}
		for ( var k = 0, l = 0, m = this._positions.length; k < m; k += 3) {
			this._texCoords[l++] = (this._positions[k + S] - sMin) / sDenom;
			this._texCoords[l++] = (this._positions[k + T] - tMin) / tDenom;
		}
	}
};
x3dom.registerNodeType("X3DGeometryNode", "Rendering", defineClass(
		x3dom.nodeTypes.X3DNode, function(ctx) {
			x3dom.nodeTypes.X3DGeometryNode.superClass.call(this, ctx);
			this.addField_SFBool(ctx, 'solid', true);
			this.addField_SFBool(ctx, 'ccw', true);
			this._mesh = new x3dom.Mesh(this);
		}, {
			getVolume : function(min, max, invalidate) {
				this._mesh.getBBox(min, max, invalidate);
				return true;
			},
			getCenter : function() {
				return this._mesh.getCenter();
			},
			doIntersect : function(line) {
				return this._mesh.doIntersect(line);
			}
		}));
x3dom
		.registerNodeType(
				"Mesh",
				"Rendering",
				defineClass(
						x3dom.nodeTypes.X3DGeometryNode,
						function(ctx) {
							x3dom.nodeTypes.Mesh.superClass.call(this, ctx);
							this.addField_SFString(ctx, 'primType', "triangle");
							this.addField_MFInt32(ctx, 'index', []);
							this.addField_MFNode('vertexAttributes',
									x3dom.nodeTypes.X3DVertexAttributeNode);
							this._mesh = new x3dom.Mesh(this);
						},
						{
							nodeChanged : function() {
								var i, n = this._cf.vertexAttributes.nodes.length;
								for (i = 0; i < n; i++) {
									var name = this._cf.vertexAttributes.nodes[i]._vf.name;
									switch (name.toLowerCase()) {
									case "position":
										this._mesh._positions = this._cf.vertexAttributes.nodes[i]._vf.value
												.toGL();
										break;
									case "normal":
										this._mesh._normals = this._cf.vertexAttributes.nodes[i]._vf.value
												.toGL();
										break;
									case "texcoord":
										this._mesh._texCoords = this._cf.vertexAttributes.nodes[i]._vf.value
												.toGL();
										break;
									case "color":
										this._mesh._colors = this._cf.vertexAttributes.nodes[i]._vf.value
												.toGL();
										break;
									default: {
										this._mesh._dynamicFields[name] = {};
										this._mesh._dynamicFields[name].numComponents = this._cf.vertexAttributes.nodes[i]._vf.numComponents;
										this._mesh._dynamicFields[name].value = this._cf.vertexAttributes.nodes[i]._vf.value
												.toGL();
									}
										break;
									}
								}
								this._mesh._indices = this._vf.index.toGL();
								this._mesh._invalidate = true;
							}
						}));
x3dom.registerNodeType("Box", "Geometry3D", defineClass(
		x3dom.nodeTypes.X3DGeometryNode, function(ctx) {
			x3dom.nodeTypes.Box.superClass.call(this, ctx);
			var sx, sy, sz;
			if (ctx.xmlNode.hasAttribute('size')) {
				var size = x3dom.fields.SFVec3f.parse(ctx.xmlNode
						.getAttribute('size'));
				sx = size.x;
				sy = size.y;
				sz = size.z;
			} else {
				sx = sy = sz = 2;
			}
			sx /= 2;
			sy /= 2;
			sz /= 2;
			this._mesh._positions = [ -sx, -sy, -sz, -sx, sy, -sz, sx, sy, -sz,
					sx, -sy, -sz, -sx, -sy, sz, -sx, sy, sz, sx, sy, sz, sx,
					-sy, sz, -sx, -sy, -sz, -sx, -sy, sz, -sx, sy, sz, -sx, sy,
					-sz, sx, -sy, -sz, sx, -sy, sz, sx, sy, sz, sx, sy, -sz,
					-sx, sy, -sz, -sx, sy, sz, sx, sy, sz, sx, sy, -sz, -sx,
					-sy, -sz, -sx, -sy, sz, sx, -sy, sz, sx, -sy, -sz ];
			this._mesh._normals = [ 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
					0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, -1, 0, 0, -1, 0, 0, -1, 0,
					0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0,
					0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
					-1, 0 ];
			this._mesh._texCoords = [ 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1,
					1, 0, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1,
					0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0 ];
			this._mesh._indices = [ 0, 1, 2, 2, 3, 0, 4, 7, 5, 5, 7, 6, 8, 9,
					10, 10, 11, 8, 12, 14, 13, 14, 12, 15, 16, 17, 18, 18, 19,
					16, 20, 22, 21, 22, 20, 23 ];
			this._mesh._invalidate = true;
		}));
x3dom
		.registerNodeType(
				"Sphere",
				"Geometry3D",
				defineClass(
						x3dom.nodeTypes.X3DGeometryNode,
						function(ctx) {
							x3dom.nodeTypes.Sphere.superClass.call(this, ctx);
							var r = ctx ? 1 : 10000;
							if (ctx && ctx.xmlNode.hasAttribute('radius')) {
								r = +ctx.xmlNode.getAttribute('radius');
							}
							this._mesh._indices = [];
							this._mesh._positions = [];
							this._mesh._normals = [];
							this._mesh._texCoords = [];
							this._mesh._colors = [];
							var latNumber, longNumber;
							var latitudeBands = 24;
							var longitudeBands = 24;
							var theta, sinTheta, cosTheta;
							var phi, sinPhi, cosPhi;
							var x, y, z, u, v;
							for (latNumber = 0; latNumber <= latitudeBands; latNumber++) {
								theta = (latNumber * Math.PI) / latitudeBands;
								sinTheta = Math.sin(theta);
								cosTheta = Math.cos(theta);
								for (longNumber = 0; longNumber <= longitudeBands; longNumber++) {
									phi = (longNumber * 2.0 * Math.PI)
											/ longitudeBands;
									sinPhi = Math.sin(phi);
									cosPhi = Math.cos(phi);
									x = -cosPhi * sinTheta;
									y = -cosTheta;
									z = -sinPhi * sinTheta;
									u = 0.25 - ((1.0 * longNumber) / longitudeBands);
									v = latNumber / latitudeBands;
									this._mesh._positions.push(r * x);
									this._mesh._positions.push(r * y);
									this._mesh._positions.push(r * z);
									this._mesh._normals.push(x);
									this._mesh._normals.push(y);
									this._mesh._normals.push(z);
									this._mesh._texCoords.push(u);
									this._mesh._texCoords.push(v);
								}
							}
							var first, second;
							for (latNumber = 0; latNumber < latitudeBands; latNumber++) {
								for (longNumber = 0; longNumber < longitudeBands; longNumber++) {
									first = (latNumber * (longitudeBands + 1))
											+ longNumber;
									second = first + longitudeBands + 1;
									this._mesh._indices.push(first);
									this._mesh._indices.push(second);
									this._mesh._indices.push(first + 1);
									this._mesh._indices.push(second);
									this._mesh._indices.push(second + 1);
									this._mesh._indices.push(first + 1);
								}
							}
							this._mesh._invalidate = true;
						}));
x3dom.registerNodeType("Torus", "Geometry3D", defineClass(
		x3dom.nodeTypes.X3DGeometryNode, function(ctx) {
			x3dom.nodeTypes.Torus.superClass.call(this, ctx);
			var innerRadius = 0.5, outerRadius = 1.0;
			if (ctx.xmlNode.hasAttribute('innerRadius')) {
				innerRadius = +ctx.xmlNode.getAttribute('innerRadius');
			}
			if (ctx.xmlNode.hasAttribute('outerRadius')) {
				outerRadius = +ctx.xmlNode.getAttribute('outerRadius');
			}
			var rings = 24, sides = 24;
			var ringDelta = 2.0 * Math.PI / rings;
			var sideDelta = 2.0 * Math.PI / sides;
			var p = [], n = [], t = [], i = [];
			var a, b, theta, phi;
			for (a = 0, theta = 0; a <= rings; a++, theta += ringDelta) {
				var cosTheta = Math.cos(theta);
				var sinTheta = Math.sin(theta);
				for (b = 0, phi = 0; b <= sides; b++, phi += sideDelta) {
					var cosPhi = Math.cos(phi);
					var sinPhi = Math.sin(phi);
					var dist = outerRadius + innerRadius * cosPhi;
					n.push(cosTheta * cosPhi, -sinTheta * cosPhi, sinPhi);
					p.push(cosTheta * dist, -sinTheta * dist, innerRadius
							* sinPhi);
					t.push(-a / rings, b / sides);
				}
			}
			for (a = 0; a < sides; a++) {
				for (b = 0; b < rings; b++) {
					i.push(b * (sides + 1) + a);
					i.push(b * (sides + 1) + a + 1);
					i.push((b + 1) * (sides + 1) + a);
					i.push(b * (sides + 1) + a + 1);
					i.push((b + 1) * (sides + 1) + a + 1);
					i.push((b + 1) * (sides + 1) + a);
				}
			}
			this._mesh._positions = p;
			this._mesh._normals = n;
			this._mesh._texCoords = t;
			this._mesh._indices = i;
			this._mesh._invalidate = true;
		}));
x3dom.registerNodeType("Cone", "Geometry3D", defineClass(
		x3dom.nodeTypes.X3DGeometryNode, function(ctx) {
			x3dom.nodeTypes.Cone.superClass.call(this, ctx);
			var bottomRadius = 1.0, height = 2.0;
			if (ctx.xmlNode.hasAttribute('bottomRadius')) {
				bottomRadius = +ctx.xmlNode.getAttribute('bottomRadius');
			}
			if (ctx.xmlNode.hasAttribute('height')) {
				height = +ctx.xmlNode.getAttribute('height');
			}
			var beta, x, z;
			var sides = 32;
			var delta = 2.0 * Math.PI / sides;
			var incl = bottomRadius / height;
			var nlen = 1.0 / Math.sqrt(1.0 + incl * incl);
			var p = [], n = [], t = [], i = [];
			for ( var j = 0, k = 0; j <= sides; j++) {
				beta = j * delta;
				x = Math.sin(beta);
				z = -Math.cos(beta);
				p.push(0, height / 2, 0);
				n.push(x / nlen, incl / nlen, z / nlen);
				t.push(1.0 - j / sides, 1);
				p.push(x * bottomRadius, -height / 2, z * bottomRadius);
				n.push(x / nlen, incl / nlen, z / nlen);
				t.push(1.0 - j / sides, 0);
				if (j > 0) {
					i.push(k + 0);
					i.push(k + 2);
					i.push(k + 1);
					i.push(k + 1);
					i.push(k + 2);
					i.push(k + 3);
					k += 2;
				}
			}
			if (bottomRadius > 0) {
				var base = p.length / 3;
				for (j = sides - 1; j >= 0; j--) {
					beta = j * delta;
					x = bottomRadius * Math.sin(beta);
					z = -bottomRadius * Math.cos(beta);
					p.push(x, -height / 2, z);
					n.push(0, -1, 0);
					t.push(x / bottomRadius / 2 + 0.5, z / bottomRadius / 2
							+ 0.5);
				}
				var h = base + 1;
				for (j = 2; j < sides; j++) {
					i.push(h);
					i.push(base);
					h = base + j;
					i.push(h);
				}
			}
			this._mesh._positions = p;
			this._mesh._normals = n;
			this._mesh._texCoords = t;
			this._mesh._indices = i;
			this._mesh._invalidate = true;
		}));
x3dom.registerNodeType("Cylinder", "Geometry3D", defineClass(
		x3dom.nodeTypes.X3DGeometryNode, function(ctx) {
			x3dom.nodeTypes.Cylinder.superClass.call(this, ctx);
			var radius = 1.0, height = 2.0;
			if (ctx.xmlNode.hasAttribute('radius')) {
				radius = +ctx.xmlNode.getAttribute('radius');
			}
			if (ctx.xmlNode.hasAttribute('height')) {
				height = +ctx.xmlNode.getAttribute('height');
			}
			var beta, x, z;
			var sides = 24;
			var delta = 2.0 * Math.PI / sides;
			var p = [], n = [], t = [], i = [];
			for ( var j = 0, k = 0; j <= sides; j++) {
				beta = j * delta;
				x = Math.sin(beta);
				z = -Math.cos(beta);
				p.push(x * radius, -height / 2, z * radius);
				n.push(x, 0, z);
				t.push(1.0 - j / sides, 0);
				p.push(x * radius, height / 2, z * radius);
				n.push(x, 0, z);
				t.push(1.0 - j / sides, 1);
				if (j > 0) {
					i.push(k + 0);
					i.push(k + 1);
					i.push(k + 2);
					i.push(k + 2);
					i.push(k + 1);
					i.push(k + 3);
					k += 2;
				}
			}
			if (radius > 0) {
				var base = p.length / 3;
				for (j = sides - 1; j >= 0; j--) {
					beta = j * delta;
					x = radius * Math.sin(beta);
					z = -radius * Math.cos(beta);
					p.push(x, height / 2, z);
					n.push(0, 1, 0);
					t.push(x / radius / 2 + 0.5, -z / radius / 2 + 0.5);
				}
				var h = base + 1;
				for (j = 2; j < sides; j++) {
					i.push(base);
					i.push(h);
					h = base + j;
					i.push(h);
				}
				base = p.length / 3;
				for (j = sides - 1; j >= 0; j--) {
					beta = j * delta;
					x = radius * Math.sin(beta);
					z = -radius * Math.cos(beta);
					p.push(x, -height / 2, z);
					n.push(0, -1, 0);
					t.push(x / radius / 2 + 0.5, z / radius / 2 + 0.5);
				}
				h = base + 1;
				for (j = 2; j < sides; j++) {
					i.push(h);
					i.push(base);
					h = base + j;
					i.push(h);
				}
			}
			this._mesh._positions = p;
			this._mesh._normals = n;
			this._mesh._texCoords = t;
			this._mesh._indices = i;
			this._mesh._invalidate = true;
		}));
x3dom.registerNodeType("PointSet", "Rendering", defineClass(
		x3dom.nodeTypes.X3DGeometryNode, function(ctx) {
			x3dom.nodeTypes.PointSet.superClass.call(this, ctx);
			this.addField_SFNode('coord', x3dom.nodeTypes.Coordinate);
			this.addField_SFNode('color', x3dom.nodeTypes.Color);
		}, {
			nodeChanged : function() {
				var time0 = new Date().getTime();
				var coordNode = this._cf.coord.node;
				x3dom.debug.assert(coordNode);
				var positions = coordNode._vf.point;
				var colorNode = this._cf.color.node;
				var colors = [];
				if (colorNode) {
					colors = colorNode._vf.color;
					x3dom.debug.assert(positions.length == colors.length);
				} else {
					for ( var i = 0, n = positions.length; i < n; i++)
						colors.push(1.0);
				}
				this._mesh._indices = [];
				this._mesh._positions = positions.toGL();
				this._mesh._colors = colors.toGL();
				this._mesh._normals = [];
				this._mesh._texCoords = [];
				this._mesh._lit = false;
				this._mesh._invalidate = true;
				var time1 = new Date().getTime() - time0;
			},
			fieldChanged : function(fieldName) {
				var pnts;
				var i, n;
				if (fieldName == "coord") {
					pnts = this._cf.coord.node._vf.point;
					n = pnts.length;
					this._mesh._positions = [];
					for (i = 0; i < n; i++) {
						this._mesh._positions.push(pnts[i].x);
						this._mesh._positions.push(pnts[i].y);
						this._mesh._positions.push(pnts[i].z);
					}
					this._mesh._invalidate = true;
					Array.forEach(this._parentNodes, function(node) {
						node._dirty.positions = true;
					});
				} else if (fieldName == "color") {
					pnts = this._cf.color.node._vf.color;
					n = pnts.length;
					this._mesh._colors = [];
					for (i = 0; i < n; i++) {
						this._mesh._colors.push(pnts[i].r);
						this._mesh._colors.push(pnts[i].g);
						this._mesh._colors.push(pnts[i].b);
					}
					Array.forEach(this._parentNodes, function(node) {
						node._dirty.colors = true;
					});
				}
			}
		}));
x3dom.registerNodeType("Text", "Text",
		defineClass(x3dom.nodeTypes.X3DGeometryNode,
				function(ctx) {
					x3dom.nodeTypes.Text.superClass.call(this, ctx);
					this.addField_MFString(ctx, 'string', []);
					this.addField_MFFloat(ctx, 'length', []);
					this.addField_SFFloat(ctx, 'maxExtent', 0.0);
					this.addField_SFNode('fontStyle',
							x3dom.nodeTypes.X3DFontStyleNode);
				}, {
					nodeChanged : function() {
						if (!this._cf.fontStyle.node) {
							this.addChild(x3dom.nodeTypes.FontStyle
									.defaultNode());
						}
					}
				}));
x3dom
		.registerNodeType(
				"X3DComposedGeometryNode",
				"Rendering",
				defineClass(
						x3dom.nodeTypes.X3DGeometryNode,
						function(ctx) {
							x3dom.nodeTypes.X3DComposedGeometryNode.superClass
									.call(this, ctx);
							this.addField_SFBool(ctx, 'colorPerVertex', true);
							this.addField_SFBool(ctx, 'normalPerVertex', true);
							this.addField_MFNode('attrib',
									x3dom.nodeTypes.X3DVertexAttributeNode);
							this.addField_SFNode('coord',
									x3dom.nodeTypes.Coordinate);
							this.addField_SFNode('normal',
									x3dom.nodeTypes.Normal);
							this
									.addField_SFNode('color',
											x3dom.nodeTypes.Color);
							this.addField_SFNode('texCoord',
									x3dom.nodeTypes.X3DTextureCoordinateNode);
						},
						{
							handleAttribs : function() {
								var i, n = this._cf.attrib.nodes.length;
								for (i = 0; i < n; i++) {
									var name = this._cf.attrib.nodes[i]._vf.name;
									switch (name.toLowerCase()) {
									case "position":
										this._mesh._positions = this._cf.attrib.nodes[i]._vf.value
												.toGL();
										break;
									case "normal":
										this._mesh._normals = this._cf.attrib.nodes[i]._vf.value
												.toGL();
										break;
									case "texcoord":
										this._mesh._texCoords = this._cf.attrib.nodes[i]._vf.value
												.toGL();
										break;
									case "color":
										this._mesh._colors = this._cf.attrib.nodes[i]._vf.value
												.toGL();
										break;
									default: {
										this._mesh._dynamicFields[name] = {};
										this._mesh._dynamicFields[name].numComponents = this._cf.attrib.nodes[i]._vf.numComponents;
										this._mesh._dynamicFields[name].value = this._cf.attrib.nodes[i]._vf.value
												.toGL();
									}
										break;
									}
								}
							}
						}));
x3dom.registerNodeType("IndexedFaceSet", "Geometry3D", defineClass(
		x3dom.nodeTypes.X3DComposedGeometryNode, function(ctx) {
			x3dom.nodeTypes.IndexedFaceSet.superClass.call(this, ctx);
			this.addField_SFFloat(ctx, 'creaseAngle', 0);
			this.addField_MFInt32(ctx, 'coordIndex', []);
			this.addField_MFInt32(ctx, 'normalIndex', []);
			this.addField_MFInt32(ctx, 'colorIndex', []);
			this.addField_MFInt32(ctx, 'texCoordIndex', []);
		}, {
			nodeChanged : function() {
				var time0 = new Date().getTime();
				this.handleAttribs();
				var indexes = this._vf.coordIndex;
				var normalInd = this._vf.normalIndex;
				var texCoordInd = this._vf.texCoordIndex;
				var colorInd = this._vf.colorIndex;
				var hasNormal = false, hasNormalInd = false;
				var hasTexCoord = false, hasTexCoordInd = false;
				var hasColor = false, hasColorInd = false;
				var colPerVert = this._vf.colorPerVertex;
				var normPerVert = this._vf.normalPerVertex;
				if (normalInd.length > 0) {
					hasNormalInd = true;
				}
				if (texCoordInd.length > 0) {
					hasTexCoordInd = true;
				}
				if (colorInd.length > 0) {
					hasColorInd = true;
				}
				var positions, normals, texCoords, colors;
				var coordNode = this._cf.coord.node;
				x3dom.debug.assert(coordNode);
				positions = coordNode._vf.point;
				var normalNode = this._cf.normal.node;
				if (normalNode) {
					hasNormal = true;
					normals = normalNode._vf.vector;
				} else {
					hasNormal = false;
				}
				var texMode = "", numTexComponents = 2;
				var texCoordNode = this._cf.texCoord.node;
				if (texCoordNode) {
					if (texCoordNode._vf.point) {
						hasTexCoord = true;
						texCoords = texCoordNode._vf.point;
						if (x3dom.isa(texCoordNode,
								x3dom.nodeTypes.TextureCoordinate3D)) {
							numTexComponents = 3;
						}
					} else if (texCoordNode._vf.mode) {
						texMode = texCoordNode._vf.mode;
					}
				} else {
					hasTexCoord = false;
				}
				var colorNode = this._cf.color.node;
				if (colorNode) {
					hasColor = true;
					colors = colorNode._vf.color;
				} else {
					hasColor = false;
				}
				this._mesh._indices = [];
				this._mesh._positions = [];
				this._mesh._normals = [];
				this._mesh._texCoords = [];
				this._mesh._colors = [];
				var i, t, cnt, faceCnt;
				var p0, p1, p2, n0, n1, n2, t0, t1, t2, c0, c1, c2;
				if ((hasNormal && hasNormalInd)
						|| (hasTexCoord && hasTexCoordInd)
						|| (hasColor && hasColorInd)) {
					t = 0;
					cnt = 0;
					faceCnt = 0;
					this._mesh._multiIndIndices = [];
					for (i = 0; i < indexes.length; ++i) {
						if (indexes[i] == -1) {
							t = 0;
							continue;
						}
						if (hasNormalInd) {
							x3dom.debug.assert(normalInd[i] != -1);
						}
						if (hasTexCoordInd) {
							x3dom.debug.assert(texCoordInd[i] != -1);
						}
						if (hasColorInd) {
							x3dom.debug.assert(colorInd[i] != -1);
						}
						switch (t) {
						case 0:
							p0 = +indexes[i];
							if (hasNormalInd && normPerVert) {
								n0 = +normalInd[i];
							} else {
								n0 = p0;
							}
							if (hasTexCoordInd) {
								t0 = +texCoordInd[i];
							} else {
								t0 = p0;
							}
							if (hasColorInd && colPerVert) {
								c0 = +colorInd[i];
							} else {
								c0 = p0;
							}
							t = 1;
							break;
						case 1:
							p1 = +indexes[i];
							if (hasNormalInd && normPerVert) {
								n1 = +normalInd[i];
							} else {
								n1 = p1;
							}
							if (hasTexCoordInd) {
								t1 = +texCoordInd[i];
							} else {
								t1 = p1;
							}
							if (hasColorInd && colPerVert) {
								c1 = +colorInd[i];
							} else {
								c1 = p1;
							}
							t = 2;
							break;
						case 2:
							p2 = +indexes[i];
							if (hasNormalInd && normPerVert) {
								n2 = +normalInd[i];
							} else if (hasNormalInd && !normPerVert) {
								n2 = +normalInd[faceCnt];
							} else {
								n2 = p2;
							}
							if (hasTexCoordInd) {
								t2 = +texCoordInd[i];
							} else {
								t2 = p2;
							}
							if (hasColorInd && colPerVert) {
								c2 = +colorInd[i];
							} else if (hasColorInd && !colPerVert) {
								c2 = +colorInd[faceCnt];
							} else {
								c2 = p2;
							}
							t = 3;
							this._mesh._indices.push(cnt++, cnt++, cnt++);
							this._mesh._positions.push(positions[p0].x);
							this._mesh._positions.push(positions[p0].y);
							this._mesh._positions.push(positions[p0].z);
							this._mesh._positions.push(positions[p1].x);
							this._mesh._positions.push(positions[p1].y);
							this._mesh._positions.push(positions[p1].z);
							this._mesh._positions.push(positions[p2].x);
							this._mesh._positions.push(positions[p2].y);
							this._mesh._positions.push(positions[p2].z);
							if (hasNormal) {
								if (!normPerVert) {
									n0 = n2;
									n1 = n2;
								}
								this._mesh._normals.push(normals[n0].x);
								this._mesh._normals.push(normals[n0].y);
								this._mesh._normals.push(normals[n0].z);
								this._mesh._normals.push(normals[n1].x);
								this._mesh._normals.push(normals[n1].y);
								this._mesh._normals.push(normals[n1].z);
								this._mesh._normals.push(normals[n2].x);
								this._mesh._normals.push(normals[n2].y);
								this._mesh._normals.push(normals[n2].z);
							} else {
								this._mesh._multiIndIndices.push(p0, p1, p2);
							}
							if (hasColor) {
								if (!colPerVert) {
									c0 = c2;
									c1 = c2;
								}
								this._mesh._colors.push(colors[c0].r);
								this._mesh._colors.push(colors[c0].g);
								this._mesh._colors.push(colors[c0].b);
								this._mesh._colors.push(colors[c1].r);
								this._mesh._colors.push(colors[c1].g);
								this._mesh._colors.push(colors[c1].b);
								this._mesh._colors.push(colors[c2].r);
								this._mesh._colors.push(colors[c2].g);
								this._mesh._colors.push(colors[c2].b);
							}
							if (hasTexCoord) {
								this._mesh._texCoords.push(texCoords[t0].x);
								this._mesh._texCoords.push(texCoords[t0].y);
								this._mesh._texCoords.push(texCoords[t1].x);
								this._mesh._texCoords.push(texCoords[t1].y);
								this._mesh._texCoords.push(texCoords[t2].x);
								this._mesh._texCoords.push(texCoords[t2].y);
							}
							faceCnt++;
							break;
						case 3:
							p1 = p2;
							n1 = n2;
							t1 = t2;
							p2 = +indexes[i];
							if (hasNormalInd) {
								n2 = +normalInd[i];
							} else if (hasNormalInd && !normPerVert) {
								n2 = +normalInd[faceCnt];
							} else {
								n2 = p2;
							}
							if (hasTexCoordInd) {
								t2 = +texCoordInd[i];
							} else {
								t2 = p2;
							}
							if (hasColorInd && colPerVert) {
								c2 = +colorInd[i];
							} else if (hasColorInd && !colPerVert) {
								c2 = +colorInd[faceCnt];
							} else {
								c2 = p2;
							}
							this._mesh._indices.push(cnt++, cnt++, cnt++);
							this._mesh._positions.push(positions[p0].x);
							this._mesh._positions.push(positions[p0].y);
							this._mesh._positions.push(positions[p0].z);
							this._mesh._positions.push(positions[p1].x);
							this._mesh._positions.push(positions[p1].y);
							this._mesh._positions.push(positions[p1].z);
							this._mesh._positions.push(positions[p2].x);
							this._mesh._positions.push(positions[p2].y);
							this._mesh._positions.push(positions[p2].z);
							if (hasNormal) {
								if (!normPerVert) {
									n0 = n2;
									n1 = n2;
								}
								this._mesh._normals.push(normals[n0].x);
								this._mesh._normals.push(normals[n0].y);
								this._mesh._normals.push(normals[n0].z);
								this._mesh._normals.push(normals[n1].x);
								this._mesh._normals.push(normals[n1].y);
								this._mesh._normals.push(normals[n1].z);
								this._mesh._normals.push(normals[n2].x);
								this._mesh._normals.push(normals[n2].y);
								this._mesh._normals.push(normals[n2].z);
							} else {
								this._mesh._multiIndIndices.push(p0, p1, p2);
							}
							if (hasColor) {
								if (!colPerVert) {
									c0 = c2;
									c1 = c2;
								}
								this._mesh._colors.push(colors[c0].r);
								this._mesh._colors.push(colors[c0].g);
								this._mesh._colors.push(colors[c0].b);
								this._mesh._colors.push(colors[c1].r);
								this._mesh._colors.push(colors[c1].g);
								this._mesh._colors.push(colors[c1].b);
								this._mesh._colors.push(colors[c2].r);
								this._mesh._colors.push(colors[c2].g);
								this._mesh._colors.push(colors[c2].b);
							}
							if (hasTexCoord) {
								this._mesh._texCoords.push(texCoords[t0].x);
								this._mesh._texCoords.push(texCoords[t0].y);
								this._mesh._texCoords.push(texCoords[t1].x);
								this._mesh._texCoords.push(texCoords[t1].y);
								this._mesh._texCoords.push(texCoords[t2].x);
								this._mesh._texCoords.push(texCoords[t2].y);
							}
							faceCnt++;
							break;
						default:
						}
					}
					if (!hasNormal) {
						this._mesh.calcNormals(this._vf.creaseAngle);
					}
					if (!hasTexCoord) {
						this._mesh.calcTexCoords(texMode);
					}
				} else {
					t = 0;
					for (i = 0; i < indexes.length; ++i) {
						if (indexes[i] == -1) {
							t = 0;
							continue;
						}
						switch (t) {
						case 0:
							n0 = +indexes[i];
							t = 1;
							break;
						case 1:
							n1 = +indexes[i];
							t = 2;
							break;
						case 2:
							n2 = +indexes[i];
							t = 3;
							this._mesh._indices.push(n0, n1, n2);
							break;
						case 3:
							n1 = n2;
							n2 = +indexes[i];
							this._mesh._indices.push(n0, n1, n2);
							break;
						}
					}
					this._mesh._positions = positions.toGL();
					if (hasNormal) {
						this._mesh._normals = normals.toGL();
					} else {
						this._mesh.calcNormals(this._vf.creaseAngle);
					}
					if (hasTexCoord) {
						this._mesh._texCoords = texCoords.toGL();
						this._mesh._numTexComponents = numTexComponents;
					} else {
						this._mesh.calcTexCoords(texMode);
					}
					if (hasColor) {
						this._mesh._colors = colors.toGL();
					}
				}
				this._mesh._invalidate = true;
				var time1 = new Date().getTime() - time0;
			},
			fieldChanged : function(fieldName) {
				var pnts;
				var i, n;
				if (fieldName == "coord") {
					pnts = this._cf.coord.node._vf.point;
					n = pnts.length;
					this._mesh._positions = [];
					for (i = 0; i < n; i++) {
						this._mesh._positions.push(pnts[i].x);
						this._mesh._positions.push(pnts[i].y);
						this._mesh._positions.push(pnts[i].z);
					}
					this._mesh._invalidate = true;
					Array.forEach(this._parentNodes, function(node) {
						node._dirty.positions = true;
					});
				} else if (fieldName == "color") {
					pnts = this._cf.color.node._vf.color;
					n = pnts.length;
					this._mesh._colors = [];
					for (i = 0; i < n; i++) {
						this._mesh._colors.push(pnts[i].r);
						this._mesh._colors.push(pnts[i].g);
						this._mesh._colors.push(pnts[i].b);
					}
					Array.forEach(this._parentNodes, function(node) {
						node._dirty.colors = true;
					});
				}
			}
		}));
x3dom.registerNodeType("IndexedTriangleSet", "Rendering", defineClass(
		x3dom.nodeTypes.X3DComposedGeometryNode, function(ctx) {
			x3dom.nodeTypes.IndexedTriangleSet.superClass.call(this, ctx);
			this.addField_MFInt32(ctx, 'index', []);
		}, {
			nodeChanged : function() {
				var time0 = new Date().getTime();
				this.handleAttribs();
				var colPerVert = this._vf.colorPerVertex;
				var normPerVert = this._vf.normalPerVertex;
				var indexes = this._vf.index;
				var hasNormal = false, hasTexCoord = false, hasColor = false;
				var positions, normals, texCoords, colors;
				var coordNode = this._cf.coord.node;
				x3dom.debug.assert(coordNode);
				positions = coordNode._vf.point;
				var normalNode = this._cf.normal.node;
				if (normalNode) {
					hasNormal = true;
					normals = normalNode._vf.vector;
				} else {
					hasNormal = false;
				}
				var texMode = "", numTexComponents = 2;
				var texCoordNode = this._cf.texCoord.node;
				if (texCoordNode) {
					if (texCoordNode._vf.point) {
						hasTexCoord = true;
						texCoords = texCoordNode._vf.point;
						if (x3dom.isa(texCoordNode,
								x3dom.nodeTypes.TextureCoordinate3D)) {
							numTexComponents = 3;
						}
					} else if (texCoordNode._vf.mode) {
						texMode = texCoordNode._vf.mode;
					}
				} else {
					hasTexCoord = false;
				}
				var colorNode = this._cf.color.node;
				if (colorNode) {
					hasColor = true;
					colors = colorNode._vf.color;
				} else {
					hasColor = false;
				}
				this._mesh._indices = indexes.toGL();
				this._mesh._positions = positions.toGL();
				if (hasNormal) {
					this._mesh._normals = normals.toGL();
				} else {
					this._mesh.calcNormals(this._vf.creaseAngle);
				}
				if (hasTexCoord) {
					this._mesh._texCoords = texCoords.toGL();
					this._mesh._numTexComponents = numTexComponents;
				} else {
					this._mesh.calcTexCoords(texMode);
				}
				if (hasColor) {
					this._mesh._colors = colors.toGL();
				}
				this._mesh._invalidate = true;
				var time1 = new Date().getTime() - time0;
			},
			fieldChanged : function(fieldName) {
				var pnts;
				var i, n;
				if (fieldName == "coord") {
					pnts = this._cf.coord.node._vf.point;
					n = pnts.length;
					this._mesh._positions = [];
					for (i = 0; i < n; i++) {
						this._mesh._positions.push(pnts[i].x);
						this._mesh._positions.push(pnts[i].y);
						this._mesh._positions.push(pnts[i].z);
					}
					this._mesh._invalidate = true;
					Array.forEach(this._parentNodes, function(node) {
						node._dirty.positions = true;
					});
				} else if (fieldName == "color") {
					pnts = this._cf.color.node._vf.color;
					n = pnts.length;
					this._mesh._colors = [];
					for (i = 0; i < n; i++) {
						this._mesh._colors.push(pnts[i].r);
						this._mesh._colors.push(pnts[i].g);
						this._mesh._colors.push(pnts[i].b);
					}
					Array.forEach(this._parentNodes, function(node) {
						node._dirty.colors = true;
					});
				}
			}
		}));
x3dom.registerNodeType("X3DGeometricPropertyNode", "Rendering",
		defineClass(x3dom.nodeTypes.X3DNode,
				function(ctx) {
					x3dom.nodeTypes.X3DGeometricPropertyNode.superClass.call(
							this, ctx);
				}));
x3dom.registerNodeType("Coordinate", "Rendering", defineClass(
		x3dom.nodeTypes.X3DGeometricPropertyNode, function(ctx) {
			x3dom.nodeTypes.Coordinate.superClass.call(this, ctx);
			this.addField_MFVec3f(ctx, 'point', []);
		}, {
			fieldChanged : function(fieldName) {
				Array.forEach(this._parentNodes, function(node) {
					node.fieldChanged("coord");
				});
			}
		}));
x3dom.registerNodeType("X3DTextureCoordinateNode", "Texturing",
		defineClass(x3dom.nodeTypes.X3DGeometricPropertyNode,
				function(ctx) {
					x3dom.nodeTypes.X3DTextureCoordinateNode.superClass.call(
							this, ctx);
				}));
x3dom.registerNodeType("TextureCoordinate3D", "Texturing3D", defineClass(
		x3dom.nodeTypes.X3DTextureCoordinateNode, function(ctx) {
			x3dom.nodeTypes.TextureCoordinate3D.superClass.call(this, ctx);
			this.addField_MFVec3f(ctx, 'point', []);
		}));
x3dom.registerNodeType("TextureCoordinate", "Texturing", defineClass(
		x3dom.nodeTypes.X3DTextureCoordinateNode, function(ctx) {
			x3dom.nodeTypes.TextureCoordinate.superClass.call(this, ctx);
			this.addField_MFVec2f(ctx, 'point', []);
		}));
x3dom.registerNodeType("TextureCoordinateGenerator", "Texturing", defineClass(
		x3dom.nodeTypes.X3DTextureCoordinateNode, function(ctx) {
			x3dom.nodeTypes.TextureCoordinateGenerator.superClass.call(this,
					ctx);
			this.addField_SFString(ctx, 'mode', "SPHERE");
			this.addField_MFFloat(ctx, 'parameter', []);
		}));
x3dom.registerNodeType("Normal", "Rendering", defineClass(
		x3dom.nodeTypes.X3DGeometricPropertyNode, function(ctx) {
			x3dom.nodeTypes.Normal.superClass.call(this, ctx);
			this.addField_MFVec3f(ctx, 'vector', []);
		}));
x3dom.registerNodeType("Color", "Rendering", defineClass(
		x3dom.nodeTypes.X3DGeometricPropertyNode, function(ctx) {
			x3dom.nodeTypes.Color.superClass.call(this, ctx);
			this.addField_MFColor(ctx, 'color', []);
		}, {
			fieldChanged : function(fieldName) {
				Array.forEach(this._parentNodes, function(node) {
					node.fieldChanged("color");
				});
			}
		}));
x3dom.registerNodeType("X3DVertexAttributeNode", "Shaders", defineClass(
		x3dom.nodeTypes.X3DGeometricPropertyNode, function(ctx) {
			x3dom.nodeTypes.X3DVertexAttributeNode.superClass.call(this, ctx);
			this.addField_SFString(ctx, 'name', "");
		}));
x3dom.registerNodeType("FloatVertexAttribute", "Shaders", defineClass(
		x3dom.nodeTypes.X3DVertexAttributeNode, function(ctx) {
			x3dom.nodeTypes.FloatVertexAttribute.superClass.call(this, ctx);
			this.addField_SFInt32(ctx, 'numComponents', 4);
			this.addField_MFFloat(ctx, 'value', []);
		}, {
			fieldChanged : function(fieldName) {
			}
		}));
x3dom.registerNodeType("X3DFontStyleNode", "Text", defineClass(
		x3dom.nodeTypes.X3DNode, function(ctx) {
			x3dom.nodeTypes.X3DFontStyleNode.superClass.call(this, ctx);
		}));
x3dom.registerNodeType("FontStyle", "Text", defineClass(
		x3dom.nodeTypes.X3DFontStyleNode, function(ctx) {
			x3dom.nodeTypes.FontStyle.superClass.call(this, ctx);
			this.addField_MFString(ctx, 'family', [ 'SERIF' ]);
			this.addField_SFBool(ctx, 'horizontal', true);
			this.addField_MFString(ctx, 'justify', [ 'BEGIN' ]);
			this.addField_SFString(ctx, 'language', "");
			this.addField_SFBool(ctx, 'leftToRight', true);
			this.addField_SFFloat(ctx, 'size', 1.0);
			this.addField_SFFloat(ctx, 'spacing', 1.0);
			this.addField_SFString(ctx, 'style', "PLAIN");
			this.addField_SFBool(ctx, 'topToBottom', true);
		}));
x3dom.nodeTypes.FontStyle.defaultNode = function() {
	if (!x3dom.nodeTypes.FontStyle._defaultNode) {
		x3dom.nodeTypes.FontStyle._defaultNode = new x3dom.nodeTypes.FontStyle();
		x3dom.nodeTypes.FontStyle._defaultNode.nodeChanged();
	}
	return x3dom.nodeTypes.FontStyle._defaultNode;
};
x3dom.registerNodeType("X3DChildNode", "Core", defineClass(
		x3dom.nodeTypes.X3DNode, function(ctx) {
			x3dom.nodeTypes.X3DChildNode.superClass.call(this, ctx);
		}));
x3dom.registerNodeType("X3DSoundNode", "Sound", defineClass(
		x3dom.nodeTypes.X3DChildNode, function(ctx) {
			x3dom.nodeTypes.X3DSoundNode.superClass.call(this, ctx);
		}));
x3dom.registerNodeType("Sound", "Sound", defineClass(
		x3dom.nodeTypes.X3DSoundNode, function(ctx) {
			x3dom.nodeTypes.Sound.superClass.call(this, ctx);
			this.addField_SFNode('source', x3dom.nodeTypes.X3DSoundSourceNode);
		}));
x3dom.registerNodeType("X3DTimeDependentNode", "Time", defineClass(
		x3dom.nodeTypes.X3DChildNode, function(ctx) {
			x3dom.nodeTypes.X3DTimeDependentNode.superClass.call(this, ctx);
			this.addField_SFBool(ctx, 'loop', false);
		}));
x3dom.registerNodeType("X3DSoundSourceNode", "Sound", defineClass(
		x3dom.nodeTypes.X3DTimeDependentNode, function(ctx) {
			x3dom.nodeTypes.X3DSoundSourceNode.superClass.call(this, ctx);
		}));
x3dom.registerNodeType("AudioClip", "Sound", defineClass(
		x3dom.nodeTypes.X3DSoundSourceNode, function(ctx) {
			x3dom.nodeTypes.AudioClip.superClass.call(this, ctx);
			this.addField_MFString(ctx, 'url', []);
			this._audio = null;
		}, {
			nodeChanged : function() {
				this._audio = document.createElement('audio');
				this._audio.setAttribute('autobuffer', 'true');
				var p = document.getElementsByTagName('body')[0];
				p.appendChild(this._audio);
				for ( var i = 0; i < this._vf.url.length; i++) {
					var audioUrl = this._nameSpace.getURL(this._vf.url[i]);
					x3dom.debug.logInfo('Adding sound file: ' + audioUrl);
					var src = document.createElement('source');
					src.setAttribute('src', audioUrl);
					this._audio.appendChild(src);
				}
				var that = this;
				var startAudio = function() {
					that._audio.play();
				};
				var audioDone = function() {
					if (that._vf.loop === true) {
						that._audio.play();
					}
				};
				this._audio
						.addEventListener("canplaythrough", startAudio, true);
				this._audio.addEventListener("ended", audioDone, true);
			}
		}));
x3dom.registerNodeType("X3DBindableNode", "Core", defineClass(
		x3dom.nodeTypes.X3DChildNode, function(ctx) {
			x3dom.nodeTypes.X3DBindableNode.superClass.call(this, ctx);
			this._stack = null;
		}, {
			initDefault : function() {
				;
			},
			activate : function() {
				;
			},
			deactivate : function() {
				;
			},
			nodeChanged : function() {
			}
		}));
x3dom.registerNodeType("X3DViewpointNode", "Navigation", defineClass(
		x3dom.nodeTypes.X3DBindableNode, function(ctx) {
			x3dom.nodeTypes.X3DViewpointNode.superClass.call(this, ctx);
		}, {
			linkStack : function() {
			}
		}));
x3dom.registerNodeType("X3DNavigationInfoNode", "Navigation", defineClass(
		x3dom.nodeTypes.X3DBindableNode, function(ctx) {
			x3dom.nodeTypes.X3DNavigationInfoNode.superClass.call(this, ctx);
		}, {}));
x3dom.registerNodeType("X3DBackgroundNode", "EnvironmentalEffects",
		defineClass(x3dom.nodeTypes.X3DBindableNode, function(ctx) {
			x3dom.nodeTypes.X3DBackgroundNode.superClass.call(this, ctx);
		}, {
			getSkyColor : function() {
				return new x3dom.fields.SFColor(0, 0, 0);
			},
			getTransparency : function() {
				return 0;
			},
			getTexUrl : function() {
				return [];
			}
		}));
x3dom.registerNodeType("X3DFogNode", "EnvironmentalEffects", defineClass(
		x3dom.nodeTypes.X3DBindableNode, function(ctx) {
			x3dom.nodeTypes.X3DFogNode.superClass.call(this, ctx);
		}, {}));
x3dom
		.registerNodeType(
				"Viewpoint",
				"Navigation",
				defineClass(
						x3dom.nodeTypes.X3DViewpointNode,
						function(ctx) {
							x3dom.nodeTypes.Viewpoint.superClass
									.call(this, ctx);
							this.addField_SFFloat(ctx, 'fieldOfView', 0.785398);
							this.addField_SFVec3f(ctx, 'position', 0, 0, 10);
							this.addField_SFRotation(ctx, 'orientation', 0, 0,
									0, 1);
							this.addField_SFVec3f(ctx, 'centerOfRotation', 0,
									0, 0);
							this.addField_SFFloat(ctx, 'zNear', 0.1);
							this.addField_SFFloat(ctx, 'zFar', 100000);
							this._viewMatrix = this._vf.orientation
									.toMatrix()
									.transpose()
									.mult(
											x3dom.fields.SFMatrix4f
													.translation(this._vf.position
															.negate()));
							this._projMatrix = null;
						},
						{
							fieldChanged : function(fieldName) {
								if (fieldName == "position"
										|| fieldName == "orientation") {
									this._viewMatrix = this._vf.orientation
											.toMatrix()
											.transpose()
											.mult(
													x3dom.fields.SFMatrix4f
															.translation(this._vf.position
																	.negate()));
								} else if (fieldName == "fieldOfView"
										|| fieldName == "zNear"
										|| fieldName == "zFar") {
									this._projMatrix = null;
								}
							},
							getCenterOfRotation : function() {
								return this._vf.centerOfRotation;
							},
							getViewMatrix : function() {
								return this._viewMatrix;
							},
							getFieldOfView : function() {
								return this._vf.fieldOfView;
							},
							setView : function(newView) {
								var mat = this.getCurrentTransform();
								mat.inverse();
								this._viewMatrix = mat.mult(newView);
							},
							resetView : function() {
								this._viewMatrix = this._vf.orientation
										.toMatrix()
										.transpose()
										.mult(
												x3dom.fields.SFMatrix4f
														.translation(this._vf.position
																.negate()));
							},
							getProjectionMatrix : function(aspect) {
								if (this._projMatrix == null) {
									var fovy = this._vf.fieldOfView;
									var zfar = this._vf.zFar;
									var znear = this._vf.zNear;
									var f = 1 / Math.tan(fovy / 2);
									this._projMatrix = new x3dom.fields.SFMatrix4f(
											f / aspect, 0, 0, 0, 0, f, 0, 0, 0,
											0, (znear + zfar) / (znear - zfar),
											2 * znear * zfar / (znear - zfar),
											0, 0, -1, 0);
								}
								return this._projMatrix;
							}
						}));
x3dom.registerNodeType("Fog", "EnvironmentalEffects", defineClass(
		x3dom.nodeTypes.X3DFogNode, function(ctx) {
			x3dom.nodeTypes.Fog.superClass.call(this, ctx);
			this.addField_SFColor(ctx, 'color', 1, 1, 1);
			this.addField_SFString(ctx, 'fogType', "LINEAR");
			this.addField_SFFloat(ctx, 'visibilityRange', 0);
			x3dom.debug.logInfo("Fog NYI");
		}, {}));
x3dom.registerNodeType("NavigationInfo", "Navigation", defineClass(
		x3dom.nodeTypes.X3DNavigationInfoNode, function(ctx) {
			x3dom.nodeTypes.NavigationInfo.superClass.call(this, ctx);
			this.addField_SFBool(ctx, 'headlight', true);
			this.addField_MFString(ctx, 'type', [ "EXAMINE", "ANY" ]);
			this.addField_MFFloat(ctx, 'avatarSize', [ 0.25, 1.6, 0.75 ]);
			this.addField_SFFloat(ctx, 'speed', 1.0);
			this.addField_SFFloat(ctx, 'visibilityLimit', 0.0);
			this.addField_SFTime(ctx, 'transitionTime', 1.0);
			this.addField_MFString(ctx, 'transitionType', [ "LINEAR" ]);
			x3dom.debug.logInfo("NavType: " + this._vf.type[0].toLowerCase());
		}, {}));
x3dom.registerNodeType("WorldInfo", "Core", defineClass(
		x3dom.nodeTypes.X3DChildNode, function(ctx) {
			x3dom.nodeTypes.WorldInfo.superClass.call(this, ctx);
			this.addField_MFString(ctx, 'info', []);
			this.addField_SFString(ctx, 'title', "");
			x3dom.debug.logInfo(this._vf.info);
			x3dom.debug.logInfo(this._vf.title);
		}, {}));
x3dom.registerNodeType("Background", "EnvironmentalEffects", defineClass(
		x3dom.nodeTypes.X3DBackgroundNode, function(ctx) {
			x3dom.nodeTypes.Background.superClass.call(this, ctx);
			this.addField_MFColor(ctx, 'skyColor', [ new x3dom.fields.SFColor(
					0, 0, 0) ]);
			this.addField_MFFloat(ctx, 'skyAngle', []);
			this.addField_MFColor(ctx, 'groundColor', []);
			this.addField_MFFloat(ctx, 'groundAngle', []);
			this.addField_SFFloat(ctx, 'transparency', 0);
			this.addField_MFString(ctx, 'backUrl', []);
			this.addField_MFString(ctx, 'bottomUrl', []);
			this.addField_MFString(ctx, 'frontUrl', []);
			this.addField_MFString(ctx, 'leftUrl', []);
			this.addField_MFString(ctx, 'rightUrl', []);
			this.addField_MFString(ctx, 'topUrl', []);
		}, {
			getSkyColor : function() {
				return this._vf.skyColor;
			},
			getTransparency : function() {
				return this._vf.transparency;
			},
			getTexUrl : function() {
				return [ this._nameSpace.getURL(this._vf.backUrl[0]),
						this._nameSpace.getURL(this._vf.frontUrl[0]),
						this._nameSpace.getURL(this._vf.bottomUrl[0]),
						this._nameSpace.getURL(this._vf.topUrl[0]),
						this._nameSpace.getURL(this._vf.leftUrl[0]),
						this._nameSpace.getURL(this._vf.rightUrl[0]) ];
			}
		}));
x3dom.registerNodeType("X3DLightNode", "Lighting", defineClass(
		x3dom.nodeTypes.X3DChildNode, function(ctx) {
			x3dom.nodeTypes.X3DLightNode.superClass.call(this, ctx);
			this.addField_SFFloat(ctx, 'ambientIntensity', 0);
			this.addField_SFColor(ctx, 'color', 1, 1, 1);
			this.addField_SFFloat(ctx, 'intensity', 1);
			this.addField_SFBool(ctx, 'global', false);
			this.addField_SFBool(ctx, 'on', true);
			this.addField_SFFloat(ctx, 'shadowIntensity', 0);
		}, {
			getViewMatrix : function(vec) {
				return x3dom.fields.SFMatrix4f.identity;
			}
		}));
x3dom.registerNodeType("DirectionalLight", "Lighting", defineClass(
		x3dom.nodeTypes.X3DLightNode, function(ctx) {
			x3dom.nodeTypes.DirectionalLight.superClass.call(this, ctx);
			this.addField_SFVec3f(ctx, 'direction', 0, 0, -1);
		}, {
			getViewMatrix : function(vec) {
				var dir = this._vf.direction.normalize();
				var orientation = x3dom.fields.Quaternion.rotateFromTo(
						new x3dom.fields.SFVec3f(0, 0, -1), dir);
				return orientation.toMatrix().transpose().mult(
						x3dom.fields.SFMatrix4f.translation(vec.negate()));
			}
		}));
x3dom.registerNodeType("PointLight", "Lighting", defineClass(
		x3dom.nodeTypes.X3DLightNode, function(ctx) {
			x3dom.nodeTypes.PointLight.superClass.call(this, ctx);
			this.addField_SFVec3f(ctx, 'attenuation', 1, 0, 0);
			this.addField_SFVec3f(ctx, 'location', 0, 0, 0);
			this.addField_SFFloat(ctx, 'radius', 100);
			this._vf.global = true;
			x3dom.debug.logInfo("PointLight NYI");
		}, {
			getViewMatrix : function(vec) {
				var pos = this._vf.location;
				var orientation = x3dom.fields.Quaternion.rotateFromTo(
						new x3dom.fields.SFVec3f(0, 0, -1), vec);
				return orientation.toMatrix().transpose().mult(
						x3dom.fields.SFMatrix4f.translation(pos.negate()));
			}
		}));
x3dom.registerNodeType("SpotLight", "Lighting", defineClass(
		x3dom.nodeTypes.X3DLightNode, function(ctx) {
			x3dom.nodeTypes.SpotLight.superClass.call(this, ctx);
			this.addField_SFVec3f(ctx, 'direction', 0, 0, -1);
			this.addField_SFVec3f(ctx, 'attenuation', 1, 0, 0);
			this.addField_SFVec3f(ctx, 'location', 0, 0, 0);
			this.addField_SFFloat(ctx, 'radius', 100);
			this.addField_SFFloat(ctx, 'beamWidth', 1.5707963);
			this.addField_SFFloat(ctx, 'cutOffAngle', 1.5707963);
			this._vf.global = true;
			x3dom.debug.logInfo("SpotLight NYI");
		}, {
			getViewMatrix : function(vec) {
				var pos = this._vf.location;
				var dir = this._vf.direction.normalize();
				var orientation = x3dom.fields.Quaternion.rotateFromTo(
						new x3dom.fields.SFVec3f(0, 0, -1), dir);
				return orientation.toMatrix().transpose().mult(
						x3dom.fields.SFMatrix4f.translation(pos.negate()));
			}
		}));
x3dom.registerNodeType("X3DShapeNode", "Shape", defineClass(
		x3dom.nodeTypes.X3DChildNode, function(ctx) {
			x3dom.nodeTypes.X3DShapeNode.superClass.call(this, ctx);
		}));
x3dom.registerNodeType("Shape", "Shape", defineClass(
		x3dom.nodeTypes.X3DShapeNode, function(ctx) {
			x3dom.nodeTypes.Shape.superClass.call(this, ctx);
			this._objectID = ++x3dom.nodeTypes.Shape.objectID;
			this.addField_SFNode('appearance',
					x3dom.nodeTypes.X3DAppearanceNode);
			this.addField_SFNode('geometry', x3dom.nodeTypes.X3DGeometryNode);
			this._dirty = {
				positions : true,
				normals : true,
				texcoords : true,
				colors : true,
				indexes : true,
				texture : true
			};
		}, {
			nodeChanged : function() {
				if (!this._cf.appearance.node) {
					this.addChild(x3dom.nodeTypes.Appearance.defaultNode());
				}
				x3dom.nodeTypes.Shape.idMap.nodeID[this._objectID] = this;
			},
			collectDrawableObjects : function(transform, out) {
				if (out !== null) {
					out.push( [ transform, this ]);
				}
			},
			getVolume : function(min, max, invalidate) {
				return this._cf.geometry.node.getVolume(min, max, invalidate);
			},
			getCenter : function() {
				return this._cf.geometry.node.getCenter();
			},
			doIntersect : function(line) {
				return this._cf.geometry.node.doIntersect(line);
			},
			isSolid : function() {
				return this._cf.geometry.node._vf.solid;
			},
			isCCW : function() {
				return this._cf.geometry.node._vf.ccw;
			}
		}));
x3dom.nodeTypes.Shape.objectID = 0;
x3dom.nodeTypes.Shape.idMap = {
	nodeID : {},
	remove : function(obj) {
		for ( var prop in this.nodeID) {
			if (this.nodeID.hasOwnProperty(prop)) {
				var val = this.nodeID[prop];
				if (val._objectID && obj._objectID
						&& val._objectID === obj._objectID) {
					delete this.nodeID[prop];
					x3dom.debug.logInfo("Unreg " + val._objectID);
				}
			}
		}
	}
};
x3dom.registerNodeType("X3DGroupingNode", "Grouping", defineClass(
		x3dom.nodeTypes.X3DChildNode, function(ctx) {
			x3dom.nodeTypes.X3DGroupingNode.superClass.call(this, ctx);
			this.addField_SFBool(ctx, 'render', true);
			this.addField_MFNode('children', x3dom.nodeTypes.X3DChildNode);
		}, {
			collectDrawableObjects : function(transform, out) {
				if (!this._vf.render) {
					return;
				}
				for ( var i = 0; i < this._childNodes.length; i++) {
					if (this._childNodes[i]) {
						var childTransform = this._childNodes[i]
								.transformMatrix(transform);
						this._childNodes[i].collectDrawableObjects(
								childTransform, out);
					}
				}
			}
		}));
x3dom
		.registerNodeType(
				"Switch",
				"Grouping",
				defineClass(
						x3dom.nodeTypes.X3DGroupingNode,
						function(ctx) {
							x3dom.nodeTypes.Switch.superClass.call(this, ctx);
							this.addField_SFInt32(ctx, 'whichChoice', -1);
						},
						{
							getVolume : function(min, max, invalidate) {
								if (this._vf.whichChoice < 0
										|| this._vf.whichChoice >= this._childNodes.length) {
									return false;
								}
								if (this._childNodes[this._vf.whichChoice]) {
									return this._childNodes[this._vf.whichChoice]
											.getVolume(min, max, invalidate);
								}
								return false;
							},
							find : function(type) {
								if (this._vf.whichChoice < 0
										|| this._vf.whichChoice >= this._childNodes.length) {
									return null;
								}
								if (this._childNodes[this._vf.whichChoice]) {
									if (this._childNodes[this._vf.whichChoice].constructor == type) {
										return this._childNodes[this._vf.whichChoice];
									}
									var c = this._childNodes[this._vf.whichChoice]
											.find(type);
									if (c) {
										return c;
									}
								}
								return null;
							},
							findAll : function(type) {
								if (this._vf.whichChoice < 0
										|| this._vf.whichChoice >= this._childNodes.length) {
									return [];
								}
								var found = [];
								if (this._childNodes[this._vf.whichChoice]) {
									if (this._childNodes[this._vf.whichChoice].constructor == type) {
										found
												.push(this._childNodes[this._vf.whichChoice]);
									}
									found = found
											.concat(this._childNodes[this._vf.whichChoice]
													.findAll(type));
								}
								return found;
							},
							collectDrawableObjects : function(transform, out) {
								if (this._vf.whichChoice < 0
										|| this._vf.whichChoice >= this._childNodes.length) {
									return;
								}
								if (this._childNodes[this._vf.whichChoice]) {
									var childTransform = this._childNodes[this._vf.whichChoice]
											.transformMatrix(transform);
									this._childNodes[this._vf.whichChoice]
											.collectDrawableObjects(
													childTransform, out);
								}
							},
							doIntersect : function(line) {
								if (this._vf.whichChoice < 0
										|| this._vf.whichChoice >= this._childNodes.length) {
									return false;
								}
								if (this._childNodes[this._vf.whichChoice]) {
									return this._childNodes[this._vf.whichChoice]
											.doIntersect(line);
								}
								return false;
							}
						}));
x3dom.registerNodeType("X3DTransformNode", "Grouping", defineClass(
		x3dom.nodeTypes.X3DGroupingNode, function(ctx) {
			x3dom.nodeTypes.X3DTransformNode.superClass.call(this, ctx);
			this._trafo = null;
		}, {
			transformMatrix : function(transform) {
				return transform.mult(this._trafo);
			},
			getVolume : function(min, max, invalidate) {
				var nMin = x3dom.fields.SFVec3f.MAX();
				var nMax = x3dom.fields.SFVec3f.MIN();
				var valid = false;
				for ( var i = 0, n = this._childNodes.length; i < n; i++) {
					if (this._childNodes[i]) {
						var childMin = x3dom.fields.SFVec3f.MAX();
						var childMax = x3dom.fields.SFVec3f.MIN();
						valid = this._childNodes[i].getVolume(childMin,
								childMax, invalidate)
								|| valid;
						if (valid) {
							if (nMin.x > childMin.x)
								nMin.x = childMin.x;
							if (nMin.y > childMin.y)
								nMin.y = childMin.y;
							if (nMin.z > childMin.z)
								nMin.z = childMin.z;
							if (nMax.x < childMax.x)
								nMax.x = childMax.x;
							if (nMax.y < childMax.y)
								nMax.y = childMax.y;
							if (nMax.z < childMax.z)
								nMax.z = childMax.z;
						}
					}
				}
				if (valid) {
					nMin = this._trafo.multMatrixPnt(nMin);
					nMax = this._trafo.multMatrixPnt(nMax);
					min.x = nMin.x < nMax.x ? nMin.x : nMax.x;
					min.y = nMin.y < nMax.y ? nMin.y : nMax.y;
					min.z = nMin.z < nMax.z ? nMin.z : nMax.z;
					max.x = nMax.x > nMin.x ? nMax.x : nMin.x;
					max.y = nMax.y > nMin.y ? nMax.y : nMin.y;
					max.z = nMax.z > nMin.z ? nMax.z : nMin.z;
				}
				return valid;
			},
			doIntersect : function(line) {
				var isect = false;
				var mat = this._trafo.inverse();
				var tmpPos = new x3dom.fields.SFVec3f(line.pos.x, line.pos.y,
						line.pos.z);
				var tmpDir = new x3dom.fields.SFVec3f(line.dir.x, line.dir.y,
						line.dir.z);
				line.pos = mat.multMatrixPnt(line.pos);
				line.dir = mat.multMatrixVec(line.dir);
				if (line.hitObject) {
					line.dist *= line.dir.length();
				}
				for ( var i = 0; i < this._childNodes.length; i++) {
					if (this._childNodes[i]) {
						isect = this._childNodes[i].doIntersect(line) || isect;
					}
				}
				line.pos.setValues(tmpPos);
				line.dir.setValues(tmpDir);
				if (isect) {
					line.hitPoint = this._trafo.multMatrixPnt(line.hitPoint);
					line.dist *= line.dir.length();
				}
				return isect;
			}
		}));
x3dom.registerNodeType("Transform", "Grouping", defineClass(
		x3dom.nodeTypes.X3DTransformNode, function(ctx) {
			x3dom.nodeTypes.Transform.superClass.call(this, ctx);
			this.addField_SFVec3f(ctx, 'center', 0, 0, 0);
			this.addField_SFVec3f(ctx, 'translation', 0, 0, 0);
			this.addField_SFRotation(ctx, 'rotation', 0, 0, 1, 0);
			this.addField_SFVec3f(ctx, 'scale', 1, 1, 1);
			this.addField_SFRotation(ctx, 'scaleOrientation', 0, 0, 1, 0);
			this._trafo = x3dom.fields.SFMatrix4f.translation(
					this._vf.translation.add(this._vf.center)).mult(
					this._vf.rotation.toMatrix()).mult(
					this._vf.scaleOrientation.toMatrix()).mult(
					x3dom.fields.SFMatrix4f.scale(this._vf.scale)).mult(
					this._vf.scaleOrientation.toMatrix().inverse()).mult(
					x3dom.fields.SFMatrix4f.translation(this._vf.center
							.negate()));
		}, {
			fieldChanged : function(fieldName) {
				this._trafo = x3dom.fields.SFMatrix4f.translation(
						this._vf.translation.add(this._vf.center)).mult(
						this._vf.rotation.toMatrix()).mult(
						this._vf.scaleOrientation.toMatrix()).mult(
						x3dom.fields.SFMatrix4f.scale(this._vf.scale)).mult(
						this._vf.scaleOrientation.toMatrix().inverse()).mult(
						x3dom.fields.SFMatrix4f.translation(this._vf.center
								.negate()));
			}
		}));
x3dom.registerNodeType("MatrixTransform", "Grouping", defineClass(
		x3dom.nodeTypes.X3DTransformNode, function(ctx) {
			x3dom.nodeTypes.MatrixTransform.superClass.call(this, ctx);
			this.addField_SFMatrix4f(ctx, 'matrix', 1, 0, 0, 0, 0, 1, 0, 0, 0,
					0, 1, 0, 0, 0, 0, 1);
			this._trafo = this._vf.matrix;
		}, {}));
x3dom.registerNodeType("Group", "Grouping", defineClass(
		x3dom.nodeTypes.X3DGroupingNode, function(ctx) {
			x3dom.nodeTypes.Group.superClass.call(this, ctx);
		}, {}));
x3dom.registerNodeType("Collision", "Navigation", defineClass(
		x3dom.nodeTypes.X3DGroupingNode, function(ctx) {
			x3dom.nodeTypes.Collision.superClass.call(this, ctx);
			this.addField_SFBool(ctx, "enabled", true);
			this.addField_SFNode("proxy", x3dom.nodeTypes.X3DGroupingNode);
		}, {
			collectDrawableObjects : function(transform, out) {
				for ( var i = 0; i < this._childNodes.length; i++) {
					if (this._childNodes[i]
							&& (this._childNodes[i] !== this._cf.proxy.node)) {
						var childTransform = this._childNodes[i]
								.transformMatrix(transform);
						this._childNodes[i].collectDrawableObjects(
								childTransform, out);
					}
				}
			}
		}));
x3dom.registerNodeType("LOD", "Navigation", defineClass(
		x3dom.nodeTypes.X3DGroupingNode, function(ctx) {
			x3dom.nodeTypes.LOD.superClass.call(this, ctx);
			this.addField_SFBool(ctx, "forceTransitions", false);
			this.addField_SFVec3f(ctx, 'center', 0, 0, 0);
			this.addField_MFFloat(ctx, "range", []);
			this._eye = new x3dom.fields.SFVec3f(0, 0, 0);
		}, {
			collectDrawableObjects : function(transform, out) {
				var i = 0, n = this._childNodes.length;
				var min = x3dom.fields.SFVec3f.MAX();
				var max = x3dom.fields.SFVec3f.MIN();
				var ok = this.getVolume(min, max, true);
				var mid = (max.add(min).multiply(0.5)).add(this._vf.center);
				var len = mid.subtract(this._eye).length();
				while (i < this._vf.range.length && len > this._vf.range[i]) {
					i++;
				}
				if (i && i >= n) {
					i = n - 1;
				}
				if (n && this._childNodes[i]) {
					var childTransform = this._childNodes[i]
							.transformMatrix(transform);
					this._childNodes[i].collectDrawableObjects(childTransform,
							out);
				}
				if (out !== null) {
					out.LODs.push( [ transform, this ]);
				}
			}
		}));
x3dom
		.registerNodeType(
				"X3DInterpolatorNode",
				"Interpolation",
				defineClass(
						x3dom.nodeTypes.X3DChildNode,
						function(ctx) {
							x3dom.nodeTypes.X3DInterpolatorNode.superClass
									.call(this, ctx);
							if (ctx.xmlNode.hasAttribute('key'))
								this._vf.key = Array.map(ctx.xmlNode
										.getAttribute('key').split(/\s+/),
										function(n) {
											return +n;
										});
							else
								this._vf.key = [];
						},
						{
							linearInterp : function(t, interp) {
								if (t <= this._vf.key[0])
									return this._vf.keyValue[0];
								if (t >= this._vf.key[this._vf.key.length - 1])
									return this._vf.keyValue[this._vf.key.length - 1];
								for ( var i = 0; i < this._vf.key.length - 1; ++i) {
									if ((this._vf.key[i] < t)
											&& (t <= this._vf.key[i + 1])) {
										return interp(
												this._vf.keyValue[i],
												this._vf.keyValue[i + 1],
												(t - this._vf.key[i])
														/ (this._vf.key[i + 1] - this._vf.key[i]));
									}
								}
								return this._vf.keyValue[0];
							}
						}));
x3dom
		.registerNodeType(
				"OrientationInterpolator",
				"Interpolation",
				defineClass(
						x3dom.nodeTypes.X3DInterpolatorNode,
						function(ctx) {
							x3dom.nodeTypes.OrientationInterpolator.superClass
									.call(this, ctx);
							if (ctx.xmlNode.hasAttribute('keyValue'))
								this._vf.keyValue = x3dom.fields.MFRotation
										.parse(ctx.xmlNode
												.getAttribute('keyValue'));
							else
								this._vf.keyValue = [];
							this._fieldWatchers.fraction = this._fieldWatchers.set_fraction = [ function(
									msg) {
								var value = this.linearInterp(msg, function(a,
										b, t) {
									return a.slerp(b, t);
								});
								this.postMessage('value_changed', value);
							} ];
						}));
x3dom
		.registerNodeType(
				"PositionInterpolator",
				"Interpolation",
				defineClass(
						x3dom.nodeTypes.X3DInterpolatorNode,
						function(ctx) {
							x3dom.nodeTypes.PositionInterpolator.superClass
									.call(this, ctx);
							if (ctx.xmlNode.hasAttribute('keyValue'))
								this._vf.keyValue = x3dom.fields.MFVec3f
										.parse(ctx.xmlNode
												.getAttribute('keyValue'));
							else
								this._vf.keyValue = [];
							this._fieldWatchers.fraction = this._fieldWatchers.set_fraction = [ function(
									msg) {
								var value = this.linearInterp(msg, function(a,
										b, t) {
									return a.multiply(1.0 - t).add(
											b.multiply(t));
								});
								this.postMessage('value_changed', value);
							} ];
						}));
x3dom
		.registerNodeType(
				"ScalarInterpolator",
				"Interpolation",
				defineClass(
						x3dom.nodeTypes.X3DInterpolatorNode,
						function(ctx) {
							x3dom.nodeTypes.ScalarInterpolator.superClass.call(
									this, ctx);
							if (ctx.xmlNode.hasAttribute('keyValue'))
								this._vf.keyValue = Array.map(ctx.xmlNode
										.getAttribute('keyValue').split(/\s+/),
										function(n) {
											return +n;
										});
							else
								this._vf.keyValue = [];
							this._fieldWatchers.fraction = this._fieldWatchers.set_fraction = [ function(
									msg) {
								var value = this.linearInterp(msg, function(a,
										b, t) {
									return (1.0 - t) * a + t * b;
								});
								this.postMessage('value_changed', value);
							} ];
						}));
x3dom
		.registerNodeType(
				"CoordinateInterpolator",
				"Interpolation",
				defineClass(
						x3dom.nodeTypes.X3DInterpolatorNode,
						function(ctx) {
							x3dom.nodeTypes.CoordinateInterpolator.superClass
									.call(this, ctx);
							this._vf.keyValue = [];
							if (ctx.xmlNode.hasAttribute('keyValue')) {
								var arr = x3dom.fields.MFVec3f
										.parse(ctx.xmlNode
												.getAttribute('keyValue'));
								var key = this._vf.key.length > 0 ? this._vf.key.length
										: 1;
								var len = arr.length / key;
								for ( var i = 0; i < key; i++) {
									var val = new x3dom.fields.MFVec3f();
									for ( var j = 0; j < len; j++) {
										val.push(arr[i * len + j]);
									}
									this._vf.keyValue.push(val);
								}
							}
							this._fieldWatchers.fraction = this._fieldWatchers.set_fraction = [ function(
									msg) {
								var value = this.linearInterp(msg, function(a,
										b, t) {
									var val = new x3dom.fields.MFVec3f();
									for ( var i = 0; i < a.length; i++) {
										val.push(a[i].multiply(1.0 - t).add(
												b[i].multiply(t)));
									}
									return val;
								});
								this.postMessage('value_changed', value);
							} ];
						}));
x3dom.registerNodeType("X3DSensorNode", "Core", defineClass(
		x3dom.nodeTypes.X3DChildNode, function(ctx) {
			x3dom.nodeTypes.X3DSensorNode.superClass.call(this, ctx);
		}));
x3dom.registerNodeType("TimeSensor", "Time", defineClass(
		x3dom.nodeTypes.X3DSensorNode, function(ctx) {
			x3dom.nodeTypes.TimeSensor.superClass.call(this, ctx);
			ctx.doc.animNode.push(this);
			this.addField_SFBool(ctx, 'enabled', true);
			this.addField_SFTime(ctx, 'cycleInterval', 1);
			this.addField_SFBool(ctx, 'loop', false);
			this.addField_SFTime(ctx, 'startTime', 0);
			this._fraction = 0;
		}, {
			onframe : function(ts) {
				if (!this._vf.enabled)
					return;
				var isActive = (ts >= this._vf.startTime);
				var cycleFrac, cycle, fraction;
				if (this._vf.cycleInterval > 0) {
					cycleFrac = (ts - this._vf.startTime)
							/ this._vf.cycleInterval;
					cycle = Math.floor(cycleFrac);
					fraction = cycleFrac - cycle;
				}
				this.postMessage('fraction_changed', fraction);
			}
		}));
x3dom
		.registerNodeType(
				"Scene",
				"Core",
				defineClass(
						x3dom.nodeTypes.X3DGroupingNode,
						function(ctx) {
							x3dom.nodeTypes.Scene.superClass.call(this, ctx);
							this.addField_SFString(ctx, 'pickMode', "idBuf");
							this._updatePicking = false;
							this._pickingInfo = {
								pickPos : {},
								pickObj : null,
								updated : false
							};
							this._rotMat = x3dom.fields.SFMatrix4f.identity();
							this._transMat = x3dom.fields.SFMatrix4f.identity();
							this._movement = new x3dom.fields.SFVec3f(0, 0, 0);
							this._width = 400;
							this._height = 300;
							this._lastX = -1;
							this._lastY = -1;
							this._pick = new x3dom.fields.SFVec3f(0, 0, 0);
							this._ctx = ctx;
							this._cam = null;
							this._bgnd = null;
							this._navi = null;
							this._lights = [];
						},
						{
							getViewpoint : function() {
								if (this._cam == null) {
									this._cam = this
											.find(x3dom.nodeTypes.Viewpoint);
									if (!this._cam) {
										var nodeType = x3dom.nodeTypes.Viewpoint;
										this._cam = new nodeType();
										this._cam._nameSpace = this._nameSpace;
										this.addChild(this._cam);
										x3dom.debug
												.logInfo("Created ViewBindable.");
									}
								}
								return this._cam;
							},
							getLights : function() {
								if (this._lights.length == 0)
									this._lights = this
											.findAll(x3dom.nodeTypes.DirectionalLight);
								return this._lights;
							},
							getNavInfo : function() {
								if (this._navi == null) {
									this._navi = this
											.find(x3dom.nodeTypes.NavigationInfo);
									if (!this._navi) {
										var nodeType = x3dom.nodeTypes.NavigationInfo;
										this._navi = new nodeType();
										this._navi._nameSpace = this._nameSpace;
										this.addChild(this._navi);
										x3dom.debug
												.logInfo("Created UserBindable.");
									}
								}
								return this._navi;
							},
							getViewpointMatrix : function() {
								var viewpoint = this.getViewpoint();
								var mat_viewpoint = viewpoint
										.getCurrentTransform();
								return mat_viewpoint.mult(viewpoint
										.getViewMatrix());
							},
							getViewMatrix : function() {
								return this.getViewpointMatrix().mult(
										this._transMat).mult(this._rotMat);
							},
							getLightMatrix : function() {
								var lights = this.getLights();
								if (lights.length > 0) {
									var min = x3dom.fields.SFVec3f.MAX();
									var max = x3dom.fields.SFVec3f.MIN();
									var ok = this.getVolume(min, max, true);
									if (ok) {
										var viewpoint = this.getViewpoint();
										var fov = viewpoint.getFieldOfView();
										var dia = max.subtract(min);
										var dist1 = (dia.y / 2.0)
												/ Math.tan(fov / 2.0)
												+ (dia.z / 2.0);
										var dist2 = (dia.x / 2.0)
												/ Math.tan(fov / 2.0)
												+ (dia.z / 2.0);
										dia = min.add(dia.multiply(0.5));
										if (x3dom.isa(lights[0],
												x3dom.nodeTypes.PointLight)) {
											dia = dia.subtract(
													lights[0]._vf.location)
													.normalize();
										} else {
											var dir = lights[0]._vf.direction
													.normalize().negate();
											dia = dia
													.add(dir
															.multiply(1.2 * (dist1 > dist2 ? dist1
																	: dist2)));
										}
										return lights[0].getViewMatrix(dia);
									}
								}
								return this.getViewMatrix();
							},
							getWCtoLCMatrix : function(lMat) {
								var proj = this.getProjectionMatrix();
								var view;
								if (arguments.length === 0) {
									view = this.getLightMatrix();
								} else {
									view = lMat;
								}
								return proj.mult(view);
							},
							getSkyColor : function() {
								if (this._bgnd == null) {
									this._bgnd = this
											.find(x3dom.nodeTypes.Background);
									if (!this._bgnd) {
										var nodeType = x3dom.nodeTypes.Background;
										this._bgnd = new nodeType();
										this._bgnd._nameSpace = this._nameSpace;
										this.addChild(this._bgnd);
										this._bgnd._vf.skyColor[0] = new x3dom.fields.SFColor(
												0, 0, 0);
										this._bgnd._vf.transparency = 1;
										x3dom.debug
												.logInfo("Created BackgroundBindable.");
									}
								}
								var bgCol = this._bgnd.getSkyColor().toGL();
								if (bgCol.length > 2)
									bgCol[3] = 1.0 - this._bgnd
											.getTransparency();
								return [ bgCol, this._bgnd.getTexUrl() ];
							},
							getProjectionMatrix : function() {
								var viewpoint = this.getViewpoint();
								return viewpoint
										.getProjectionMatrix(this._width
												/ this._height);
							},
							getWCtoCCMatrix : function() {
								var view = this.getViewMatrix();
								var proj = this.getProjectionMatrix();
								return proj.mult(view);
							},
							getCCtoWCMatrix : function() {
								var mat = this.getWCtoCCMatrix();
								return mat.inverse();
							},
							calcViewRay : function(x, y) {
								var cctowc = this.getCCtoWCMatrix();
								var rx = x / (this._width - 1.0) * 2.0 - 1.0;
								var ry = (this._height - 1.0 - y)
										/ (this._height - 1.0) * 2.0 - 1.0;
								var from = cctowc
										.multFullMatrixPnt(new x3dom.fields.SFVec3f(
												rx, ry, -1));
								var at = cctowc
										.multFullMatrixPnt(new x3dom.fields.SFVec3f(
												rx, ry, 1));
								var dir = at.subtract(from);
								return new x3dom.fields.Line(from, dir);
							},
							showAll : function() {
								var min = x3dom.fields.SFVec3f.MAX();
								var max = x3dom.fields.SFVec3f.MIN();
								var ok = this.getVolume(min, max, true);
								if (ok) {
									var viewpoint = this.getViewpoint();
									var fov = viewpoint.getFieldOfView();
									var dia = max.subtract(min);
									var dist1 = (dia.y / 2.0)
											/ Math.tan(fov / 2.0)
											+ (dia.z / 2.0);
									var dist2 = (dia.x / 2.0)
											/ Math.tan(fov / 2.0)
											+ (dia.z / 2.0);
									dia = min.add(dia.multiply(0.5));
									dia.z += (dist1 > dist2 ? dist1 : dist2);
									viewpoint.setView(x3dom.fields.SFMatrix4f
											.translation(dia.multiply(-1)));
									this._rotMat = x3dom.fields.SFMatrix4f
											.identity();
									this._transMat = x3dom.fields.SFMatrix4f
											.identity();
									this._movement = new x3dom.fields.SFVec3f(
											0, 0, 0);
								}
							},
							resetView : function() {
								this.getViewpoint().resetView();
								this._rotMat = x3dom.fields.SFMatrix4f
										.identity();
								this._transMat = x3dom.fields.SFMatrix4f
										.identity();
								this._movement = new x3dom.fields.SFVec3f(0, 0,
										0);
							},
							checkEvents : function(obj) {
								var that = this;
								try {
									var anObj = obj;
									if (anObj._xmlNode.hasAttribute('onclick')
											|| (anObj = anObj._cf.geometry.node)._xmlNode
													.hasAttribute('onclick')) {
										var funcStr = anObj._xmlNode
												.getAttribute('onclick');
										var func = new Function('hitPnt',
												funcStr);
										func.call(anObj, that._pick.toGL());
									}
								} catch (e) {
								}
								var recurse = function(obj) {
									Array
											.forEach(
													obj._parentNodes,
													function(node) {
														if (node._xmlNode
																&& node._xmlNode
																		.hasAttribute('onclick')) {
															var funcStr = node._xmlNode
																	.getAttribute('onclick');
															var func = new Function(
																	'hitPnt',
																	funcStr);
															func
																	.call(
																			node,
																			that._pick
																					.toGL());
														}
														if (x3dom
																.isa(
																		node,
																		x3dom.nodeTypes.Anchor)) {
															node.handleTouch();
														} else {
															recurse(node);
														}
													});
								};
								recurse(obj);
							},
							onMousePress : function(x, y, buttonState) {
								this._lastX = x;
								this._lastY = y;
							},
							onMouseRelease : function(x, y, buttonState) {
								this._lastX = x;
								this._lastY = y;
								var avoidTraversal = (this._vf.pickMode
										.toLowerCase() === "idbuf");
								var isect = false;
								var obj = null;
								if (avoidTraversal) {
									if (!this._pickingInfo.updated) {
										this._updatePicking = true;
										return;
									} else {
										this._pickingInfo.updated = false;
										if ((obj = this._pickingInfo.pickObj)) {
											this._pick
													.setValues(this._pickingInfo.pickPos);
											this._pickingInfo.pickObj = null;
											this.checkEvents(obj);
											x3dom.debug.logInfo("Hit \""
													+ obj._xmlNode.localName
													+ "/ " + obj._DEF + "\"");
											x3dom.debug
													.logInfo("Ray hit at position "
															+ this._pick);
											return;
										}
									}
								}
								var line = this.calcViewRay(x, y);
								if (!avoidTraversal) {
									var t0 = new Date().getTime();
									isect = this.doIntersect(line);
									if (isect && (obj = line.hitObject)) {
										this._pick.setValues(line.hitPoint);
										this.checkEvents(obj);
										x3dom.debug.logInfo("Hit \""
												+ obj._xmlNode.localName + "/ "
												+ obj._DEF + "\ at dist="
												+ line.dist.toFixed(4));
										x3dom.debug
												.logInfo("Ray hit at position "
														+ this._pick);
									}
									var t1 = new Date().getTime() - t0;
									x3dom.debug.logInfo("Picking time (box): "
											+ t1 + "ms");
								}
								if (!isect) {
									var dir = this.getViewMatrix().e2()
											.negate();
									var u = dir.dot(line.pos.negate())
											/ dir.dot(line.dir);
									this._pick = line.pos.add(line.dir
											.multiply(u));
								}
							},
							onMouseOut : function(x, y, buttonState) {
								this._lastX = x;
								this._lastY = y;
							},
							onDoubleClick : function(x, y) {
								var navi = this.getNavInfo();
								if (navi._vf.type[0].length <= 1
										|| navi._vf.type[0].toLowerCase() == "none")
									return;
								var viewpoint = this.getViewpoint();
								viewpoint._vf.centerOfRotation
										.setValues(this._pick);
								x3dom.debug.logInfo("New center of Rotation:  "
										+ this._pick);
							},
							onDrag : function(x, y, buttonState) {
								var navi = this.getNavInfo();
								if (navi._vf.type[0].length <= 1
										|| navi._vf.type[0].toLowerCase() == "none")
									return;
								var dx = x - this._lastX;
								var dy = y - this._lastY;
								var min, max, ok, d, vec;
								var viewpoint = this.getViewpoint();
								if (buttonState & 1) {
									var alpha = (dy * 2 * Math.PI)
											/ this._width;
									var beta = (dx * 2 * Math.PI)
											/ this._height;
									var mat = this.getViewMatrix();
									var mx = x3dom.fields.SFMatrix4f
											.rotationX(alpha);
									var my = x3dom.fields.SFMatrix4f
											.rotationY(beta);
									var center = viewpoint
											.getCenterOfRotation();
									mat.setTranslate(new x3dom.fields.SFVec3f(
											0, 0, 0));
									this._rotMat = this._rotMat.mult(
											x3dom.fields.SFMatrix4f
													.translation(center)).mult(
											mat.inverse()).mult(mx).mult(my)
											.mult(mat).mult(
													x3dom.fields.SFMatrix4f
															.translation(center
																	.negate()));
								}
								if (buttonState & 4) {
									min = x3dom.fields.SFVec3f.MAX();
									max = x3dom.fields.SFVec3f.MIN();
									ok = this.getVolume(min, max, true);
									d = ok ? (max.subtract(min)).length() : 10;
									d = (d < x3dom.fields.Eps) ? 1 : d;
									vec = new x3dom.fields.SFVec3f(d * dx
											/ this._width, d * (-dy)
											/ this._height, 0);
									this._movement = this._movement.add(vec);
									this._transMat = viewpoint
											.getViewMatrix()
											.inverse()
											.mult(
													x3dom.fields.SFMatrix4f
															.translation(this._movement))
											.mult(viewpoint.getViewMatrix());
								}
								if (buttonState & 2) {
									min = x3dom.fields.SFVec3f.MAX();
									max = x3dom.fields.SFVec3f.MIN();
									ok = this.getVolume(min, max, true);
									d = ok ? (max.subtract(min)).length() : 10;
									d = (d < x3dom.fields.Eps) ? 1 : d;
									vec = new x3dom.fields.SFVec3f(0, 0, d
											* (dx + dy) / this._height);
									this._movement = this._movement.add(vec);
									this._transMat = viewpoint
											.getViewMatrix()
											.inverse()
											.mult(
													x3dom.fields.SFMatrix4f
															.translation(this._movement))
											.mult(viewpoint.getViewMatrix());
								}
								this._lastX = x;
								this._lastY = y;
							}
						}));
x3dom.registerNodeType("Anchor", "Networking", defineClass(
		x3dom.nodeTypes.X3DGroupingNode, function(ctx) {
			x3dom.nodeTypes.Anchor.superClass.call(this, ctx);
			this.addField_MFString(ctx, 'url', []);
		}, {
			doIntersect : function(line) {
				var isect = false;
				for ( var i = 0; i < this._childNodes.length; i++) {
					if (this._childNodes[i]) {
						isect = this._childNodes[i].doIntersect(line) || isect;
					}
				}
				return isect;
			},
			handleTouch : function() {
				window.location = this._nameSpace.getURL(this._vf.url[0]);
			}
		}));
x3dom
		.registerNodeType(
				"Inline",
				"Networking",
				defineClass(
						x3dom.nodeTypes.X3DGroupingNode,
						function(ctx) {
							x3dom.nodeTypes.Inline.superClass.call(this, ctx);
							this.addField_MFString(ctx, 'url', []);
							this.addField_SFBool(ctx, 'load', true);
						},
						{
							fieldChanged : function(fieldName) {
							},
							nodeChanged : function() {
								var that = this;
								var xhr = new XMLHttpRequest();
								xhr.overrideMimeType('text/xml');
								this._nameSpace.doc.downloadCount += 1;
								xhr.onreadystatechange = function() {
									if (xhr.readyState == 4) {
										if (xhr.responseXML.documentElement.localName == 'parsererror') {
											x3dom.debug
													.logInfo('XML parser failed on '
															+ this._vf.url
															+ ':\n'
															+ xhr.responseXML.documentElement.textContent);
											return;
										}
									} else {
										x3dom.debug
												.logInfo('Loading inlined data... (readyState: ' + xhr.readyState + ')');
										return;
									}
									if (xhr.status !== 200) {
										x3dom.debug
												.logError('XMLHttpRequest requires a web server running!');
										return;
									}
									x3dom.debug
											.logInfo('Inline: downloading ' + that._vf.url + ' done.');
									var xml = xhr.responseXML;
									var inlScene = xml
											.getElementsByTagName('Scene')[0]
											|| xml
													.getElementsByTagName('scene')[0];
									if (inlScene) {
										var nameSpace = new x3dom.NodeNameSpace(
												"", that._nameSpace.doc);
										nameSpace.setBaseURL(that._vf.url[0]);
										var newScene = nameSpace
												.setupTree(inlScene);
										that.addChild(newScene);
									} else {
										x3dom.debug
												.logInfo('no Scene in ' + xml.localName);
									}
									while (that._childNodes.empty === false) {
										that.removeChild(that._childNodes[0]);
									}
									that.addChild(newScene);
									that._nameSpace.doc.downloadCount -= 1;
									that._nameSpace.doc.needRender = true;
									x3dom.debug
											.logInfo('Inline: added ' + that._vf.url + ' to scene.');
								};
								xhr.open('GET', this._nameSpace
										.getURL(this._vf.url[0]), true);
								xhr.send(null);
							}
						}));
x3dom.X3DDocument = function(canvas, ctx) {
	this.canvas = canvas;
	this.ctx = ctx;
	this.needRender = true;
	this.animNode = [];
	this.downloadCount = 0;
	this.onload = function() {
	};
	this.onerror = function() {
	};
};
x3dom.X3DDocument.prototype.load = function(uri, sceneElemPos) {
	var uri_docs = {};
	var queued_uris = [ uri ];
	var doc = this;
	function next_step() {
		if (queued_uris.length == 0) {
			doc._setup(uri_docs[uri], uri_docs, sceneElemPos);
			doc.onload();
			return;
		}
		var next_uri = queued_uris.shift();
		if (x3dom.isX3DElement(next_uri)
				&& (next_uri.localName.toLowerCase() === 'x3d' || next_uri.localName
						.toLowerCase() === 'websg')) {
			uri_docs[next_uri] = next_uri;
			next_step();
		}
	}
	next_step();
};
x3dom.findScene = function(x3dElem) {
	var sceneElems = [];
	for ( var i = 0; i < x3dElem.childNodes.length; i++) {
		var sceneElem = x3dElem.childNodes[i];
		if (sceneElem && sceneElem.localName
				&& sceneElem.localName.toLowerCase() === "scene") {
			sceneElems.push(sceneElem);
		}
	}
	if (sceneElems.length > 1) {
		x3dom.debug.logError("X3D element has more than one Scene child (has "
				+ x3dElem.childNodes.length + ").");
	} else {
		return sceneElems[0];
	}
	return null;
};
x3dom.X3DDocument.prototype._setup = function(sceneDoc, uriDocs, sceneElemPos) {
	var doc = this;
	var domEventListener = {
		onAttrModified : function(e) {
			var attrToString = {
				1 : "MODIFICATION",
				2 : "ADDITION",
				3 : "REMOVAL"
			};
			e.target._x3domNode.updateField(e.attrName, e.newValue);
			doc.needRender = true;
		},
		onNodeRemoved : function(e) {
			var parent = e.target.parentNode._x3domNode;
			var child = e.target._x3domNode;
			if (parent) {
				parent.removeChild(child);
				doc.needRender = true;
			}
		},
		onNodeInserted : function(e) {
			var parent = e.target.parentNode._x3domNode;
			var child = e.target;
			if (parent._nameSpace) {
				var newNode = parent._nameSpace.setupTree(child);
				parent.addChild(newNode, child.getAttribute("containerField"));
				doc.needRender = true;
			} else {
				x3dom.debug.logInfo("No _nameSpace in onNodeInserted");
			}
		}
	};
	sceneDoc.addEventListener('DOMNodeRemoved', domEventListener.onNodeRemoved,
			true);
	sceneDoc.addEventListener('DOMNodeInserted',
			domEventListener.onNodeInserted, true);
	if ((x3dom.userAgentFeature.supportsDOMAttrModified === true)) {
		sceneDoc.addEventListener('DOMAttrModified',
				domEventListener.onAttrModified, true);
	}
	var sceneElem = x3dom.findScene(sceneDoc);
	var nameSpace = new x3dom.NodeNameSpace("scene", doc);
	var scene = nameSpace.setupTree(sceneElem);
	this._scene = scene;
	this._scene._width = this.canvas.width;
	this._scene._height = this.canvas.height;
};
x3dom.X3DDocument.prototype.advanceTime = function(t) {
	if (this.animNode.length) {
		this.needRender = true;
		Array.forEach(this.animNode, function(node) {
			node.onframe(t);
		});
	}
};
x3dom.X3DDocument.prototype.render = function(ctx) {
	if (!ctx || !this._scene)
		return;
	ctx.renderScene(this._scene, this._scene._updatePicking);
	if (this._scene._pickingInfo.updated) {
		this._scene.onMouseRelease(this._scene._lastX, this._scene._lastY, 0);
		this.needRender = true;
	}
};
x3dom.X3DDocument.prototype.onDrag = function(x, y, buttonState) {
	if (this._scene) {
		this._scene.onDrag(x, y, buttonState);
	}
};
x3dom.X3DDocument.prototype.onMousePress = function(x, y, buttonState) {
	if (this._scene) {
		this._scene.onMousePress(x, y, buttonState);
	}
};
x3dom.X3DDocument.prototype.onMouseRelease = function(x, y, buttonState) {
	if (this._scene) {
		this._scene.onMouseRelease(x, y, buttonState);
	}
};
x3dom.X3DDocument.prototype.onMouseOut = function(x, y, buttonState) {
	if (this._scene) {
		this._scene.onMouseOut(x, y, buttonState);
	}
};
x3dom.X3DDocument.prototype.onDoubleClick = function(x, y) {
	if (this._scene) {
		this._scene.onDoubleClick(x, y);
	}
};
x3dom.X3DDocument.prototype.onKeyPress = function(charCode) {
	switch (charCode) {
	case 32: {
		x3dom.debug
				.logInfo("a: show all | d: show helper buffers | l: light view | "
						+ "m: toggle render mode | p: intersect type | r: reset view");
	}
		break;
	case 97: {
		this._scene.showAll();
	}
		break;
	case 100: {
		if (this._scene._visDbgBuf === undefined) {
			this._scene._visDbgBuf = true;
		} else {
			this._scene._visDbgBuf = !this._scene._visDbgBuf;
		}
	}
		break;
	case 108: {
		if (this._scene.getLights().length > 0) {
			this._scene.getViewpoint().setView(this._scene.getLightMatrix());
			this._scene._rotMat = x3dom.fields.SFMatrix4f.identity();
			this._scene._transMat = x3dom.fields.SFMatrix4f.identity();
			this._scene._movement = new x3dom.fields.SFVec3f(0, 0, 0);
		}
	}
		break;
	case 109: {
		if (this._scene._points === undefined) {
			this._scene._points = true;
		} else {
			this._scene._points = !this._scene._points;
		}
	}
		break;
	case 112: {
		if (this._scene._vf.pickMode.toLowerCase() === "idbuf") {
			this._scene._vf.pickMode = "box";
		} else {
			this._scene._vf.pickMode = "idBuf";
		}
		x3dom.debug.logInfo("Switch pickMode to '" + this._scene._vf.pickMode
				+ "'.");
	}
		break;
	case 114: {
		this._scene.resetView();
	}
		break;
	default:
	}
};
x3dom.X3DDocument.prototype.shutdown = function(ctx) {
	if (!ctx)
		return;
	ctx.shutdown(this._scene);
};
x3dom.fields = {};
x3dom.fields.Eps = 0.000001;
x3dom.fields.SFMatrix4f = function(_00, _01, _02, _03, _10, _11, _12, _13, _20,
		_21, _22, _23, _30, _31, _32, _33) {
	if (arguments.length === 0) {
		this._00 = 1;
		this._01 = 0;
		this._02 = 0;
		this._03 = 0;
		this._10 = 0;
		this._11 = 1;
		this._12 = 0;
		this._13 = 0;
		this._20 = 0;
		this._21 = 0;
		this._22 = 1;
		this._23 = 0;
		this._30 = 0;
		this._31 = 0;
		this._32 = 0;
		this._33 = 1;
	} else {
		this._00 = _00;
		this._01 = _01;
		this._02 = _02;
		this._03 = _03;
		this._10 = _10;
		this._11 = _11;
		this._12 = _12;
		this._13 = _13;
		this._20 = _20;
		this._21 = _21;
		this._22 = _22;
		this._23 = _23;
		this._30 = _30;
		this._31 = _31;
		this._32 = _32;
		this._33 = _33;
	}
};
x3dom.fields.SFMatrix4f.prototype.e0 = function() {
	var baseVec = new x3dom.fields.SFVec3f(this._00, this._10, this._20);
	return baseVec.normalize();
};
x3dom.fields.SFMatrix4f.prototype.e1 = function() {
	var baseVec = new x3dom.fields.SFVec3f(this._01, this._11, this._21);
	return baseVec.normalize();
};
x3dom.fields.SFMatrix4f.prototype.e2 = function() {
	var baseVec = new x3dom.fields.SFVec3f(this._02, this._12, this._22);
	return baseVec.normalize();
};
x3dom.fields.SFMatrix4f.prototype.e3 = function() {
	return new x3dom.fields.SFVec3f(this._03, this._13, this._23);
};
x3dom.fields.SFMatrix4f.identity = function() {
	return new x3dom.fields.SFMatrix4f(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0,
			0, 0, 1);
};
x3dom.fields.SFMatrix4f.translation = function(vec) {
	return new x3dom.fields.SFMatrix4f(1, 0, 0, vec.x, 0, 1, 0, vec.y, 0, 0, 1,
			vec.z, 0, 0, 0, 1);
};
x3dom.fields.SFMatrix4f.rotationX = function(a) {
	var c = Math.cos(a);
	var s = Math.sin(a);
	return new x3dom.fields.SFMatrix4f(1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0,
			0, 0, 1);
};
x3dom.fields.SFMatrix4f.rotationY = function(a) {
	var c = Math.cos(a);
	var s = Math.sin(a);
	return new x3dom.fields.SFMatrix4f(c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0,
			0, 0, 1);
};
x3dom.fields.SFMatrix4f.rotationZ = function(a) {
	var c = Math.cos(a);
	var s = Math.sin(a);
	return new x3dom.fields.SFMatrix4f(c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0,
			0, 0, 1);
};
x3dom.fields.SFMatrix4f.scale = function(vec) {
	return new x3dom.fields.SFMatrix4f(vec.x, 0, 0, 0, 0, vec.y, 0, 0, 0, 0,
			vec.z, 0, 0, 0, 0, 1);
};
x3dom.fields.SFMatrix4f.prototype.setTranslate = function(vec) {
	this._03 = vec.x;
	this._13 = vec.y;
	this._23 = vec.z;
};
x3dom.fields.SFMatrix4f.prototype.setScale = function(vec) {
	this._00 = vec.x;
	this._11 = vec.y;
	this._22 = vec.z;
};
x3dom.fields.SFMatrix4f.parseRotation = function(str) {
	var m = /^([+-]?\d*\.*\d*[eE]?[+-]?\d*?)\s*,?\s*([+-]?\d*\.*\d*[eE]?[+-]?\d*?)\s*,?\s*([+-]?\d*\.*\d*[eE]?[+-]?\d*?)\s*,?\s*([+-]?\d*\.*\d*[eE]?[+-]?\d*?)$/
			.exec(str);
	var x = +m[1], y = +m[2], z = +m[3], a = +m[4];
	var d = Math.sqrt(x * x + y * y + z * z);
	if (d === 0) {
		x = 1;
		y = z = 0;
	} else {
		x /= d;
		y /= d;
		z /= d;
	}
	var c = Math.cos(a);
	var s = Math.sin(a);
	var t = 1 - c;
	return new x3dom.fields.SFMatrix4f(t * x * x + c, t * x * y + s * z, t * x
			* z - s * y, 0, t * x * y - s * z, t * y * y + c,
			t * y * z + s * x, 0, t * x * z + s * y, t * y * z - s * x, t * z
					* z + c, 0, 0, 0, 0, 1).transpose();
};
x3dom.fields.SFMatrix4f.parse = function(str) {
	var arr = Array.map(str.split(/[,\s]+/), function(n) {
		return +n;
	});
	if (arr.length >= 16) {
		return new x3dom.fields.SFMatrix4f(arr[0], arr[1], arr[2], arr[3],
				arr[4], arr[5], arr[6], arr[7], arr[8], arr[9], arr[10],
				arr[11], arr[12], arr[13], arr[14], arr[15]);
	} else {
		x3dom.debug.logInfo("SFMatrix4f - can't parse string: " + str);
		return x3dom.fields.SFMatrix4f.identity();
	}
};
x3dom.fields.SFMatrix4f.prototype.mult = function(that) {
	return new x3dom.fields.SFMatrix4f(this._00 * that._00 + this._01
			* that._10 + this._02 * that._20 + this._03 * that._30, this._00
			* that._01 + this._01 * that._11 + this._02 * that._21 + this._03
			* that._31, this._00 * that._02 + this._01 * that._12 + this._02
			* that._22 + this._03 * that._32, this._00 * that._03 + this._01
			* that._13 + this._02 * that._23 + this._03 * that._33, this._10
			* that._00 + this._11 * that._10 + this._12 * that._20 + this._13
			* that._30, this._10 * that._01 + this._11 * that._11 + this._12
			* that._21 + this._13 * that._31, this._10 * that._02 + this._11
			* that._12 + this._12 * that._22 + this._13 * that._32, this._10
			* that._03 + this._11 * that._13 + this._12 * that._23 + this._13
			* that._33, this._20 * that._00 + this._21 * that._10 + this._22
			* that._20 + this._23 * that._30, this._20 * that._01 + this._21
			* that._11 + this._22 * that._21 + this._23 * that._31, this._20
			* that._02 + this._21 * that._12 + this._22 * that._22 + this._23
			* that._32, this._20 * that._03 + this._21 * that._13 + this._22
			* that._23 + this._23 * that._33, this._30 * that._00 + this._31
			* that._10 + this._32 * that._20 + this._33 * that._30, this._30
			* that._01 + this._31 * that._11 + this._32 * that._21 + this._33
			* that._31, this._30 * that._02 + this._31 * that._12 + this._32
			* that._22 + this._33 * that._32, this._30 * that._03 + this._31
			* that._13 + this._32 * that._23 + this._33 * that._33);
};
x3dom.fields.SFMatrix4f.prototype.multMatrixPnt = function(vec) {
	return new x3dom.fields.SFVec3f(this._00 * vec.x + this._01 * vec.y
			+ this._02 * vec.z + this._03, this._10 * vec.x + this._11 * vec.y
			+ this._12 * vec.z + this._13, this._20 * vec.x + this._21 * vec.y
			+ this._22 * vec.z + this._23);
};
x3dom.fields.SFMatrix4f.prototype.multMatrixVec = function(vec) {
	return new x3dom.fields.SFVec3f(this._00 * vec.x + this._01 * vec.y
			+ this._02 * vec.z, this._10 * vec.x + this._11 * vec.y + this._12
			* vec.z, this._20 * vec.x + this._21 * vec.y + this._22 * vec.z);
};
x3dom.fields.SFMatrix4f.prototype.multFullMatrixPnt = function(vec) {
	var w = this._30 * vec.x + this._31 * vec.y + this._32 * vec.z + this._33;
	if (w) {
		w = 1.0 / w;
	}
	return new x3dom.fields.SFVec3f((this._00 * vec.x + this._01 * vec.y
			+ this._02 * vec.z + this._03)
			* w,
			(this._10 * vec.x + this._11 * vec.y + this._12 * vec.z + this._13)
					* w, (this._20 * vec.x + this._21 * vec.y + this._22
					* vec.z + this._23)
					* w);
};
x3dom.fields.SFMatrix4f.prototype.transpose = function() {
	return new x3dom.fields.SFMatrix4f(this._00, this._10, this._20, this._30,
			this._01, this._11, this._21, this._31, this._02, this._12,
			this._22, this._32, this._03, this._13, this._23, this._33);
};
x3dom.fields.SFMatrix4f.prototype.toGL = function() {
	return [ this._00, this._10, this._20, this._30, this._01, this._11,
			this._21, this._31, this._02, this._12, this._22, this._32,
			this._03, this._13, this._23, this._33 ];
};
x3dom.fields.SFMatrix4f.prototype.getTransform = function(translation,
		rotation, scale) {
	var T = new x3dom.fields.SFVec3f(this._03, this._13, this._23);
	var S = new x3dom.fields.SFVec3f(1, 1, 1);
	var angle_x, angle_y, angle_z, tr_x, tr_y, C;
	angle_y = Math.asin(this._02);
	C = Math.cos(angle_y);
	if (Math.abs(C) > 0.005) {
		tr_x = this._22 / C;
		tr_y = -this._12 / C;
		angle_x = Math.atan2(tr_y, tr_x);
		tr_x = this._00 / C;
		tr_y = -this._01 / C;
		angle_z = Math.atan2(tr_y, tr_x);
	} else {
		angle_x = 0;
		tr_x = this._11;
		tr_y = this._10;
		angle_z = Math.atan2(tr_y, tr_x);
	}
	var R = new x3dom.fields.Quaternion(-Math.cos((angle_x - angle_z) / 2)
			* Math.sin(angle_y / 2), Math.sin((angle_x - angle_z) / 2)
			* Math.sin(angle_y / 2), -Math.sin((angle_x + angle_z) / 2)
			* Math.cos(angle_y / 2), Math.cos((angle_x + angle_z) / 2)
			* Math.cos(angle_y / 2));
	translation.x = T.x;
	translation.y = T.y;
	translation.z = T.z;
	rotation.x = R.x;
	rotation.y = R.y;
	rotation.z = R.z;
	rotation.w = R.w;
	scale.x = S.x;
	scale.y = S.y;
	scale.z = S.z;
};
x3dom.fields.SFMatrix4f.prototype.det3 = function(a1, a2, a3, b1, b2, b3, c1,
		c2, c3) {
	var d = (a1 * b2 * c3) + (a2 * b3 * c1) + (a3 * b1 * c2) - (a1 * b3 * c2)
			- (a2 * b1 * c3) - (a3 * b2 * c1);
	return d;
};
x3dom.fields.SFMatrix4f.prototype.det = function() {
	var a1, a2, a3, a4, b1, b2, b3, b4, c1, c2, c3, c4, d1, d2, d3, d4;
	a1 = this._00;
	b1 = this._10;
	c1 = this._20;
	d1 = this._30;
	a2 = this._01;
	b2 = this._11;
	c2 = this._21;
	d2 = this._31;
	a3 = this._02;
	b3 = this._12;
	c3 = this._22;
	d3 = this._32;
	a4 = this._03;
	b4 = this._13;
	c4 = this._23;
	d4 = this._33;
	var d = +a1 * this.det3(b2, b3, b4, c2, c3, c4, d2, d3, d4) - b1
			* this.det3(a2, a3, a4, c2, c3, c4, d2, d3, d4) + c1
			* this.det3(a2, a3, a4, b2, b3, b4, d2, d3, d4) - d1
			* this.det3(a2, a3, a4, b2, b3, b4, c2, c3, c4);
	return d;
};
x3dom.fields.SFMatrix4f.prototype.inverse = function() {
	var a1, a2, a3, a4, b1, b2, b3, b4, c1, c2, c3, c4, d1, d2, d3, d4;
	a1 = this._00;
	b1 = this._10;
	c1 = this._20;
	d1 = this._30;
	a2 = this._01;
	b2 = this._11;
	c2 = this._21;
	d2 = this._31;
	a3 = this._02;
	b3 = this._12;
	c3 = this._22;
	d3 = this._32;
	a4 = this._03;
	b4 = this._13;
	c4 = this._23;
	d4 = this._33;
	var rDet = this.det();
	if (Math.abs(rDet) < x3dom.fields.Eps) {
		x3dom.debug.logInfo("Invert matrix: singular matrix, no inverse!");
		return x3dom.fields.SFMatrix4f.identity();
	}
	rDet = 1.0 / rDet;
	return new x3dom.fields.SFMatrix4f(+this.det3(b2, b3, b4, c2, c3, c4, d2,
			d3, d4)
			* rDet, -this.det3(a2, a3, a4, c2, c3, c4, d2, d3, d4) * rDet,
			+this.det3(a2, a3, a4, b2, b3, b4, d2, d3, d4) * rDet, -this.det3(
					a2, a3, a4, b2, b3, b4, c2, c3, c4)
					* rDet, -this.det3(b1, b3, b4, c1, c3, c4, d1, d3, d4)
					* rDet, +this.det3(a1, a3, a4, c1, c3, c4, d1, d3, d4)
					* rDet, -this.det3(a1, a3, a4, b1, b3, b4, d1, d3, d4)
					* rDet, +this.det3(a1, a3, a4, b1, b3, b4, c1, c3, c4)
					* rDet, +this.det3(b1, b2, b4, c1, c2, c4, d1, d2, d4)
					* rDet, -this.det3(a1, a2, a4, c1, c2, c4, d1, d2, d4)
					* rDet, +this.det3(a1, a2, a4, b1, b2, b4, d1, d2, d4)
					* rDet, -this.det3(a1, a2, a4, b1, b2, b4, c1, c2, c4)
					* rDet, -this.det3(b1, b2, b3, c1, c2, c3, d1, d2, d3)
					* rDet, +this.det3(a1, a2, a3, c1, c2, c3, d1, d2, d3)
					* rDet, -this.det3(a1, a2, a3, b1, b2, b3, d1, d2, d3)
					* rDet, +this.det3(a1, a2, a3, b1, b2, b3, c1, c2, c3)
					* rDet);
};
x3dom.fields.SFMatrix4f.prototype.toString = function() {
	return '[SFMatrix4f ' + this._00 + ', ' + this._01 + ', ' + this._02 + ', '
			+ this._03 + '; ' + this._10 + ', ' + this._11 + ', ' + this._12
			+ ', ' + this._13 + '; ' + this._20 + ', ' + this._21 + ', '
			+ this._22 + ', ' + this._23 + '; ' + this._30 + ', ' + this._31
			+ ', ' + this._32 + ', ' + this._33 + ']';
};
x3dom.fields.SFMatrix4f.prototype.setValueByStr = function(str) {
	var arr = Array.map(str.split(/[,\s]+/), function(n) {
		return +n;
	});
	if (arr.length >= 16) {
		this._00 = arr[0];
		this._01 = arr[1];
		this._02 = arr[2];
		this._03 = arr[3];
		this._10 = arr[4];
		this._11 = arr[5];
		this._12 = arr[6];
		this._13 = arr[7];
		this._20 = arr[8];
		this._21 = arr[9];
		this._22 = arr[10];
		this._23 = arr[11];
		this._30 = arr[12];
		this._31 = arr[13];
		this._32 = arr[14];
		this._33 = arr[15];
	} else {
		x3dom.debug.logInfo("SFMatrix4f - can't parse string: " + str);
	}
	return this;
};
x3dom.fields.SFVec2f = function(x, y) {
	if (arguments.length === 0) {
		this.x = this.y = 0;
	} else {
		this.x = x;
		this.y = y;
	}
};
x3dom.fields.SFVec2f.parse = function(str) {
	var m = /^([+-]?\d*\.*\d*[eE]?[+-]?\d*?)\s*,?\s*([+-]?\d*\.*\d*[eE]?[+-]?\d*?)$/
			.exec(str);
	return new x3dom.fields.SFVec2f(+m[1], +m[2]);
};
x3dom.fields.SFVec2f.prototype.setValues = function(that) {
	this.x = that.x;
	this.y = that.y;
};
x3dom.fields.SFVec2f.prototype.add = function(that) {
	return new x3dom.fields.SFVec2f(this.x + that.x, this.y + that.y);
};
x3dom.fields.SFVec2f.prototype.subtract = function(that) {
	return new x3dom.fields.SFVec2f(this.x - that.x, this.y - that.y);
};
x3dom.fields.SFVec2f.prototype.negate = function() {
	return new x3dom.fields.SFVec2f(-this.x, -this.y);
};
x3dom.fields.SFVec2f.prototype.dot = function(that) {
	return this.x * that.x + this.y * that.y;
};
x3dom.fields.SFVec2f.prototype.reflect = function(n) {
	var d2 = this.dot(n) * 2;
	return new x3dom.fields.SFVec2f(this.x - d2 * n.x, this.y - d2 * n.y);
};
x3dom.fields.SFVec2f.prototype.normalize = function(that) {
	var n = this.length();
	if (n) {
		n = 1.0 / n;
	}
	return new x3dom.fields.SFVec2f(this.x * n, this.y * n);
};
x3dom.fields.SFVec2f.prototype.multComponents = function(that) {
	return new x3dom.fields.SFVec2f(this.x * that.x, this.y * that.y);
};
x3dom.fields.SFVec2f.prototype.multiply = function(n) {
	return new x3dom.fields.SFVec2f(this.x * n, this.y * n);
};
x3dom.fields.SFVec2f.prototype.divide = function(n) {
	var denom = n ? (1.0 / n) : 1.0;
	return new x3dom.fields.SFVec2f(this.x * denom, this.y * denom);
};
x3dom.fields.SFVec2f.prototype.length = function() {
	return Math.sqrt((this.x * this.x) + (this.y * this.y));
};
x3dom.fields.SFVec2f.prototype.toGL = function() {
	return [ this.x, this.y ];
};
x3dom.fields.SFVec2f.prototype.toString = function() {
	return "{ x " + this.x + " y " + this.y + " }";
};
x3dom.fields.SFVec2f.prototype.setValueByStr = function(str) {
	var m = /^([+-]?\d*\.*\d*[eE]?[+-]?\d*?)\s*,?\s*([+-]?\d*\.*\d*[eE]?[+-]?\d*?)$/
			.exec(str);
	this.x = +m[1];
	this.y = +m[2];
	return this;
};
x3dom.fields.SFVec3f = function(x, y, z) {
	if (arguments.length === 0) {
		this.x = this.y = this.z = 0;
	} else {
		this.x = x;
		this.y = y;
		this.z = z;
	}
};
x3dom.fields.SFVec3f.MIN = function() {
	return new x3dom.fields.SFVec3f(Number.MIN_VALUE, Number.MIN_VALUE,
			Number.MIN_VALUE);
};
x3dom.fields.SFVec3f.MAX = function() {
	return new x3dom.fields.SFVec3f(Number.MAX_VALUE, Number.MAX_VALUE,
			Number.MAX_VALUE);
};
x3dom.fields.SFVec3f.parse = function(str) {
	try {
		var m = /^([+-]?\d*\.*\d*[eE]?[+-]?\d*?)\s*,?\s*([+-]?\d*\.*\d*[eE]?[+-]?\d*?)\s*,?\s*([+-]?\d*\.*\d*[eE]?[+-]?\d*?)$/
				.exec(str);
		return new x3dom.fields.SFVec3f(+m[1], +m[2], +m[3]);
	} catch (e) {
		var c = x3dom.fields.SFColor.colorParse(str);
		return new x3dom.fields.SFVec3f(c.r, c.g, c.b);
	}
};
x3dom.fields.SFVec3f.prototype.setValues = function(that) {
	this.x = that.x;
	this.y = that.y;
	this.z = that.z;
};
x3dom.fields.SFVec3f.prototype.add = function(that) {
	return new x3dom.fields.SFVec3f(this.x + that.x, this.y + that.y, this.z
			+ that.z);
};
x3dom.fields.SFVec3f.prototype.subtract = function(that) {
	return new x3dom.fields.SFVec3f(this.x - that.x, this.y - that.y, this.z
			- that.z);
};
x3dom.fields.SFVec3f.prototype.negate = function() {
	return new x3dom.fields.SFVec3f(-this.x, -this.y, -this.z);
};
x3dom.fields.SFVec3f.prototype.dot = function(that) {
	return (this.x * that.x + this.y * that.y + this.z * that.z);
};
x3dom.fields.SFVec3f.prototype.cross = function(that) {
	return new x3dom.fields.SFVec3f(this.y * that.z - this.z * that.y, this.z
			* that.x - this.x * that.z, this.x * that.y - this.y * that.x);
};
x3dom.fields.SFVec3f.prototype.reflect = function(n) {
	var d2 = this.dot(n) * 2;
	return new x3dom.fields.SFVec3f(this.x - d2 * n.x, this.y - d2 * n.y,
			this.z - d2 * n.z);
};
x3dom.fields.SFVec3f.prototype.length = function() {
	return Math.sqrt((this.x * this.x) + (this.y * this.y) + (this.z * this.z));
};
x3dom.fields.SFVec3f.prototype.normalize = function(that) {
	var n = this.length();
	if (n) {
		n = 1.0 / n;
	}
	return new x3dom.fields.SFVec3f(this.x * n, this.y * n, this.z * n);
};
x3dom.fields.SFVec3f.prototype.multComponents = function(that) {
	return new x3dom.fields.SFVec3f(this.x * that.x, this.y * that.y, this.z
			* that.z);
};
x3dom.fields.SFVec3f.prototype.multiply = function(n) {
	return new x3dom.fields.SFVec3f(this.x * n, this.y * n, this.z * n);
};
x3dom.fields.SFVec2f.prototype.divide = function(n) {
	var denom = n ? (1.0 / n) : 1.0;
	return new x3dom.fields.SFVec2f(this.x * denom, this.y * denom, this.z
			* denom);
};
x3dom.fields.SFVec3f.prototype.toGL = function() {
	return [ this.x, this.y, this.z ];
};
x3dom.fields.SFVec3f.prototype.toString = function() {
	return "{ x " + this.x + " y " + this.y + " z " + this.z + " }";
};
x3dom.fields.SFVec3f.prototype.setValueByStr = function(str) {
	try {
		var m = /^([+-]?\d*\.*\d*[eE]?[+-]?\d*?)\s*,?\s*([+-]?\d*\.*\d*[eE]?[+-]?\d*?)\s*,?\s*([+-]?\d*\.*\d*[eE]?[+-]?\d*?)$/
				.exec(str);
		this.x = +m[1];
		this.y = +m[2];
		this.z = +m[3];
	} catch (e) {
		var c = x3dom.fields.SFColor.colorParse(str);
		this.x = c.r;
		this.y = c.g;
		this.z = c.b;
	}
	return this;
};
x3dom.fields.Quaternion = function(x, y, z, w) {
	this.x = x;
	this.y = y;
	this.z = z;
	this.w = w;
};
x3dom.fields.Quaternion.prototype.mult = function(that) {
	return new x3dom.fields.Quaternion(this.w * that.x + this.x * that.w
			+ this.y * that.z - this.z * that.y, this.w * that.y + this.y
			* that.w + this.z * that.x - this.x * that.z, this.w * that.z
			+ this.z * that.w + this.x * that.y - this.y * that.x, this.w
			* that.w - this.x * that.x - this.y * that.y - this.z * that.z);
};
x3dom.fields.Quaternion.parseAxisAngle = function(str) {
	var m = /^([+-]?\d*\.*\d*[eE]?[+-]?\d*?)\s*,?\s*([+-]?\d*\.*\d*[eE]?[+-]?\d*?)\s*,?\s*([+-]?\d*\.*\d*[eE]?[+-]?\d*?)\s*,?\s*([+-]?\d*\.*\d*[eE]?[+-]?\d*?)$/
			.exec(str);
	return x3dom.fields.Quaternion.axisAngle(new x3dom.fields.SFVec3f(+m[1],
			+m[2], +m[3]), +m[4]);
};
x3dom.fields.Quaternion.axisAngle = function(axis, a) {
	var t = axis.length();
	if (t > x3dom.fields.Eps) {
		var s = Math.sin(a / 2) / t;
		var c = Math.cos(a / 2);
		return new x3dom.fields.Quaternion(axis.x * s, axis.y * s, axis.z * s,
				c);
	} else {
		return new x3dom.fields.Quaternion(0, 0, 0, 1);
	}
};
x3dom.fields.Quaternion.prototype.toMatrix = function() {
	var xx = this.x * this.x;
	var xy = this.x * this.y;
	var xz = this.x * this.z;
	var yy = this.y * this.y;
	var yz = this.y * this.z;
	var zz = this.z * this.z;
	var wx = this.w * this.x;
	var wy = this.w * this.y;
	var wz = this.w * this.z;
	return new x3dom.fields.SFMatrix4f(1 - 2 * (yy + zz), 2 * (xy - wz),
			2 * (xz + wy), 0, 2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx),
			0, 2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy), 0, 0, 0, 0, 1);
};
x3dom.fields.Quaternion.prototype.dot = function(that) {
	return this.x * that.x + this.y * that.y + this.z * that.z + this.w
			* that.w;
};
x3dom.fields.Quaternion.prototype.add = function(that) {
	return new x3dom.fields.Quaternion(this.x + that.x, this.y + that.y, this.z
			+ that.z, this.w + that.w);
};
x3dom.fields.Quaternion.prototype.subtract = function(that) {
	return new x3dom.fields.Quaternion(this.x - that.x, this.y - that.y, this.z
			- that.z, this.w - that.w);
};
x3dom.fields.Quaternion.prototype.multScalar = function(s) {
	return new x3dom.fields.Quaternion(this.x * s, this.y * s, this.z * s,
			this.w * s);
};
x3dom.fields.Quaternion.prototype.normalize = function(that) {
	var d2 = this.dot(that);
	var id = 1.0;
	if (d2) {
		id = 1.0 / Math.sqrt(d2);
	}
	return new x3dom.fields.Quaternion(this.x * id, this.y * id, this.z * id,
			this.w * id);
};
x3dom.fields.Quaternion.prototype.negate = function() {
	return new x3dom.fields.Quaternion(-this.x, -this.y, -this.z, -this.w);
};
x3dom.fields.Quaternion.prototype.inverse = function() {
	return new x3dom.fields.Quaternion(-this.x, -this.y, -this.z, this.w);
};
x3dom.fields.Quaternion.prototype.slerp = function(that, t) {
	var cosom = this.dot(that);
	var rot1;
	if (cosom < 0.0) {
		cosom = -cosom;
		rot1 = that.negate();
	} else {
		rot1 = new x3dom.fields.Quaternion(that.x, that.y, that.z, that.w);
	}
	var scalerot0, scalerot1;
	if ((1.0 - cosom) > 0.00001) {
		var omega = Math.acos(cosom);
		var sinom = Math.sin(omega);
		scalerot0 = Math.sin((1.0 - t) * omega) / sinom;
		scalerot1 = Math.sin(t * omega) / sinom;
	} else {
		scalerot0 = 1.0 - t;
		scalerot1 = t;
	}
	return this.multScalar(scalerot0).add(rot1.multScalar(scalerot1));
};
x3dom.fields.Quaternion.rotateFromTo = function(fromVec, toVec) {
	var from = fromVec.normalize();
	var to = toVec.normalize();
	var cost = from.dot(to);
	if (cost > 0.99999) {
		return new x3dom.fields.Quaternion(0, 0, 0, 1);
	} else if (cost < -0.99999) {
		var cAxis = new x3dom.fields.SFVec3f(1, 0, 0);
		var tmp = from.cross(cAxis);
		if (tmp.length() < 0.00001) {
			cAxis.x = 0;
			cAxis.y = 1;
			cAxis.z = 0;
			tmp = from.cross(cAxis);
		}
		tmp.normalize();
		return x3dom.fields.Quaternion.axisAngle(tmp, Math.Pi);
	}
	var axis = fromVec.cross(toVec);
	axis.normalize();
	var s = Math.sqrt(0.5 * (1.0 - cost));
	axis = axis.multiply(s);
	s = Math.sqrt(0.5 * (1.0 + cost));
	return new x3dom.fields.Quaternion(axis.x, axis.y, axis.z, s);
};
x3dom.fields.Quaternion.prototype.toString = function() {
	return '((' + this.x + ', ' + this.y + ', ' + this.z + '), ' + this.w + ')';
};
x3dom.fields.Quaternion.prototype.setValueByStr = function(str) {
	var m = /^([+-]?\d*\.*\d*[eE]?[+-]?\d*?)\s*,?\s*([+-]?\d*\.*\d*[eE]?[+-]?\d*?)\s*,?\s*([+-]?\d*\.*\d*[eE]?[+-]?\d*?)\s*,?\s*([+-]?\d*\.*\d*[eE]?[+-]?\d*?)$/
			.exec(str);
	var quat = x3dom.fields.Quaternion.axisAngle(new x3dom.fields.SFVec3f(
			+m[1], +m[2], +m[3]), +m[4]);
	this.x = quat.x;
	this.y = quat.y;
	this.z = quat.z;
	this.w = quat.w;
	return this;
};
x3dom.fields.SFColor = function(r, g, b) {
	if (arguments.length === 0) {
		this.r = this.g = this.b = 0;
	} else {
		this.r = r;
		this.g = g;
		this.b = b;
	}
};
x3dom.fields.SFColor.parse = function(str) {
	try {
		var m = /^([+-]?\d*\.*\d*[eE]?[+-]?\d*?)\s*,?\s*([+-]?\d*\.*\d*[eE]?[+-]?\d*?)\s*,?\s*([+-]?\d*\.*\d*[eE]?[+-]?\d*?)$/
				.exec(str);
		return new x3dom.fields.SFColor(+m[1], +m[2], +m[3]);
	} catch (e) {
		return x3dom.fields.SFColor.colorParse(str);
	}
};
x3dom.fields.SFColor.prototype.setHSV = function(h, s, v) {
	x3dom.debug.logInfo("SFColor.setHSV() NYI");
};
x3dom.fields.SFColor.prototype.getHSV = function() {
	var h = 0, s = 0, v = 0;
	x3dom.debug.logInfo("SFColor.getHSV() NYI");
	return [ h, s, v ];
};
x3dom.fields.SFColor.prototype.setValues = function(color) {
	this.r = color.r;
	this.g = color.g;
	this.b = color.b;
};
x3dom.fields.SFColor.prototype.toGL = function() {
	return [ this.r, this.g, this.b ];
};
x3dom.fields.SFColor.prototype.toString = function() {
	return "{ r " + this.r + " g " + this.g + " b " + this.b + " }";
};
x3dom.fields.SFColor.prototype.setValueByStr = function(str) {
	try {
		var m = /^([+-]?\d*\.*\d*[eE]?[+-]?\d*?)\s*,?\s*([+-]?\d*\.*\d*[eE]?[+-]?\d*?)\s*,?\s*([+-]?\d*\.*\d*[eE]?[+-]?\d*?)$/
				.exec(str);
		this.r = +m[1];
		this.g = +m[2];
		this.b = +m[3];
	} catch (e) {
		var c = x3dom.fields.SFColor.colorParse(str);
		this.r = c.r;
		this.g = c.g;
		this.b = c.b;
	}
	return this;
};
x3dom.fields.SFColor.colorParse = function(color) {
	var red = 0, green = 0, blue = 0;
	var color_names = {
		aliceblue : 'f0f8ff',
		antiquewhite : 'faebd7',
		aqua : '00ffff',
		aquamarine : '7fffd4',
		azure : 'f0ffff',
		beige : 'f5f5dc',
		bisque : 'ffe4c4',
		black : '000000',
		blanchedalmond : 'ffebcd',
		blue : '0000ff',
		blueviolet : '8a2be2',
		brown : 'a52a2a',
		burlywood : 'deb887',
		cadetblue : '5f9ea0',
		chartreuse : '7fff00',
		chocolate : 'd2691e',
		coral : 'ff7f50',
		cornflowerblue : '6495ed',
		cornsilk : 'fff8dc',
		crimson : 'dc143c',
		cyan : '00ffff',
		darkblue : '00008b',
		darkcyan : '008b8b',
		darkgoldenrod : 'b8860b',
		darkgray : 'a9a9a9',
		darkgreen : '006400',
		darkkhaki : 'bdb76b',
		darkmagenta : '8b008b',
		darkolivegreen : '556b2f',
		darkorange : 'ff8c00',
		darkorchid : '9932cc',
		darkred : '8b0000',
		darksalmon : 'e9967a',
		darkseagreen : '8fbc8f',
		darkslateblue : '483d8b',
		darkslategray : '2f4f4f',
		darkturquoise : '00ced1',
		darkviolet : '9400d3',
		deeppink : 'ff1493',
		deepskyblue : '00bfff',
		dimgray : '696969',
		dodgerblue : '1e90ff',
		feldspar : 'd19275',
		firebrick : 'b22222',
		floralwhite : 'fffaf0',
		forestgreen : '228b22',
		fuchsia : 'ff00ff',
		gainsboro : 'dcdcdc',
		ghostwhite : 'f8f8ff',
		gold : 'ffd700',
		goldenrod : 'daa520',
		gray : '808080',
		green : '008000',
		greenyellow : 'adff2f',
		honeydew : 'f0fff0',
		hotpink : 'ff69b4',
		indianred : 'cd5c5c',
		indigo : '4b0082',
		ivory : 'fffff0',
		khaki : 'f0e68c',
		lavender : 'e6e6fa',
		lavenderblush : 'fff0f5',
		lawngreen : '7cfc00',
		lemonchiffon : 'fffacd',
		lightblue : 'add8e6',
		lightcoral : 'f08080',
		lightcyan : 'e0ffff',
		lightgoldenrodyellow : 'fafad2',
		lightgrey : 'd3d3d3',
		lightgreen : '90ee90',
		lightpink : 'ffb6c1',
		lightsalmon : 'ffa07a',
		lightseagreen : '20b2aa',
		lightskyblue : '87cefa',
		lightslateblue : '8470ff',
		lightslategray : '778899',
		lightsteelblue : 'b0c4de',
		lightyellow : 'ffffe0',
		lime : '00ff00',
		limegreen : '32cd32',
		linen : 'faf0e6',
		magenta : 'ff00ff',
		maroon : '800000',
		mediumaquamarine : '66cdaa',
		mediumblue : '0000cd',
		mediumorchid : 'ba55d3',
		mediumpurple : '9370d8',
		mediumseagreen : '3cb371',
		mediumslateblue : '7b68ee',
		mediumspringgreen : '00fa9a',
		mediumturquoise : '48d1cc',
		mediumvioletred : 'c71585',
		midnightblue : '191970',
		mintcream : 'f5fffa',
		mistyrose : 'ffe4e1',
		moccasin : 'ffe4b5',
		navajowhite : 'ffdead',
		navy : '000080',
		oldlace : 'fdf5e6',
		olive : '808000',
		olivedrab : '6b8e23',
		orange : 'ffa500',
		orangered : 'ff4500',
		orchid : 'da70d6',
		palegoldenrod : 'eee8aa',
		palegreen : '98fb98',
		paleturquoise : 'afeeee',
		palevioletred : 'd87093',
		papayawhip : 'ffefd5',
		peachpuff : 'ffdab9',
		peru : 'cd853f',
		pink : 'ffc0cb',
		plum : 'dda0dd',
		powderblue : 'b0e0e6',
		purple : '800080',
		red : 'ff0000',
		rosybrown : 'bc8f8f',
		royalblue : '4169e1',
		saddlebrown : '8b4513',
		salmon : 'fa8072',
		sandybrown : 'f4a460',
		seagreen : '2e8b57',
		seashell : 'fff5ee',
		sienna : 'a0522d',
		silver : 'c0c0c0',
		skyblue : '87ceeb',
		slateblue : '6a5acd',
		slategray : '708090',
		snow : 'fffafa',
		springgreen : '00ff7f',
		steelblue : '4682b4',
		tan : 'd2b48c',
		teal : '008080',
		thistle : 'd8bfd8',
		tomato : 'ff6347',
		turquoise : '40e0d0',
		violet : 'ee82ee',
		violetred : 'd02090',
		wheat : 'f5deb3',
		white : 'ffffff',
		whitesmoke : 'f5f5f5',
		yellow : 'ffff00',
		yellowgreen : '9acd32'
	};
	if (color_names[color]) {
		color = "#" + color_names[color];
	}
	if (color.substr && color.substr(0, 1) === "#") {
		color = color.substr(1);
		var len = color.length;
		if (len === 6) {
			red = parseInt("0x" + color.substr(0, 2)) / 255.0;
			green = parseInt("0x" + color.substr(2, 2)) / 255.0;
			blue = parseInt("0x" + color.substr(4, 2)) / 255.0;
		} else if (len === 3) {
			red = parseInt("0x" + color.substr(0, 1)) / 15.0;
			green = parseInt("0x" + color.substr(1, 1)) / 15.0;
			blue = parseInt("0x" + color.substr(2, 1)) / 15.0;
		}
	}
	return new x3dom.fields.SFColor(red, green, blue);
};
x3dom.fields.MFColor = function(colorArray) {
	if (arguments.length == 0) {
	} else {
		colorArray.map(function(c) {
			this.push(c);
		}, this);
	}
};
x3dom.fields.MFColor.prototype = new Array;
x3dom.fields.MFColor.parse = function(str) {
	var mc = str.match(/([+\-0-9eE\.]+)/g);
	var colors = [];
	for ( var i = 0, n = mc.length; i < n; i += 3) {
		colors
				.push(new x3dom.fields.SFColor(+mc[i + 0], +mc[i + 1],
						+mc[i + 2]));
	}
	return new x3dom.fields.MFColor(colors);
};
x3dom.fields.MFColor.prototype.setValueByStr = function(str) {
	while (this.length) {
		this.pop();
	}
	var mc = str.match(/([+\-0-9eE\.]+)/g);
	for ( var i = 0, n = mc.length; i < n; i += 3) {
		this.push(new x3dom.fields.SFColor(+mc[i + 0], +mc[i + 1], +mc[i + 2]));
	}
};
x3dom.fields.MFColor.prototype.toGL = function() {
	var a = [];
	Array.map(this, function(c) {
		a.push(c.r);
		a.push(c.g);
		a.push(c.b);
	});
	return a;
};
x3dom.fields.MFRotation = function(rotArray) {
	if (arguments.length == 0) {
	} else {
		rotArray.map(function(v) {
			this.push(v);
		}, this);
	}
};
x3dom.fields.MFRotation.prototype = new Array;
x3dom.fields.MFRotation.parse = function(str) {
	var mc = str.match(/([+\-0-9eE\.]+)/g);
	var vecs = [];
	for ( var i = 0, n = mc.length; i < n; i += 4) {
		vecs.push(x3dom.fields.Quaternion.axisAngle(new x3dom.fields.SFVec3f(
				+mc[i + 0], +mc[i + 1], +mc[i + 2]), +mc[i + 3]));
	}
	return new x3dom.fields.MFRotation(vecs);
};
x3dom.fields.MFRotation.prototype.setValueByStr = function(str) {
	while (this.length) {
		this.pop();
	}
	var mc = str.match(/([+\-0-9eE\.]+)/g);
	for ( var i = 0, n = mc.length; i < n; i += 4) {
		this.push(x3dom.fields.Quaternion.axisAngle(new x3dom.fields.SFVec3f(
				+mc[i + 0], +mc[i + 1], +mc[i + 2]), +mc[i + 3]));
	}
};
x3dom.fields.MFRotation.prototype.toGL = function() {
	var a = [];
	return a;
};
x3dom.fields.MFVec3f = function(vec3Array) {
	if (arguments.length == 0) {
	} else {
		vec3Array.map(function(v) {
			this.push(v);
		}, this);
	}
};
x3dom.fields.MFVec3f.prototype = new Array;
x3dom.fields.MFVec3f.parse = function(str) {
	var mc = str.match(/([+\-0-9eE\.]+)/g);
	var vecs = [];
	for ( var i = 0, n = mc.length; i < n; i += 3) {
		vecs.push(new x3dom.fields.SFVec3f(+mc[i + 0], +mc[i + 1], +mc[i + 2]));
	}
	return new x3dom.fields.MFVec3f(vecs);
};
x3dom.fields.MFVec3f.prototype.setValueByStr = function(str) {
	while (this.length) {
		this.pop();
	}
	var mc = str.match(/([+\-0-9eE\.]+)/g);
	for ( var i = 0, n = mc.length; i < n; i += 3) {
		this.push(new x3dom.fields.SFVec3f(+mc[i + 0], +mc[i + 1], +mc[i + 2]));
	}
};
x3dom.fields.MFVec3f.prototype.toGL = function() {
	var a = [];
	Array.map(this, function(c) {
		a.push(c.x);
		a.push(c.y);
		a.push(c.z);
	});
	return a;
};
x3dom.fields.MFVec2f = function(vec2Array) {
	if (arguments.length == 0) {
	} else {
		vec2Array.map(function(v) {
			this.push(v);
		}, this);
	}
};
x3dom.fields.MFVec2f.prototype = new Array;
x3dom.fields.MFVec2f.parse = function(str) {
	var mc = str.match(/([+\-0-9eE\.]+)/g);
	var vecs = [];
	for ( var i = 0, n = mc.length; i < n; i += 2) {
		vecs.push(new x3dom.fields.SFVec2f(+mc[i + 0], +mc[i + 1]));
	}
	return new x3dom.fields.MFVec2f(vecs);
};
x3dom.fields.MFVec2f.prototype.setValueByStr = function(str) {
	while (this.length) {
		this.pop();
	}
	var mc = str.match(/([+\-0-9eE\.]+)/g);
	for ( var i = 0, n = mc.length; i < n; i += 2) {
		this.push(new x3dom.fields.SFVec2f(+mc[i + 0], +mc[i + 1]));
	}
};
x3dom.fields.MFVec2f.prototype.toGL = function() {
	var a = [];
	Array.map(this, function(v) {
		a.push(v.x);
		a.push(v.y);
	});
	return a;
};
x3dom.fields.MFInt32 = function(array) {
	if (arguments.length == 0) {
	} else {
		array.map(function(v) {
			this.push(v);
		}, this);
	}
};
x3dom.fields.MFInt32.prototype = new Array;
x3dom.fields.MFInt32.parse = function(str) {
	var mc = str.match(/([+-]?\d+\s*){1},?\s*/g);
	var vals = [];
	for ( var i = 0, n = mc.length; i < n; ++i) {
		vals.push(parseInt(mc[i], 10));
	}
	return new x3dom.fields.MFInt32(vals);
};
x3dom.fields.MFInt32.prototype.setValueByStr = function(str) {
	while (this.length) {
		this.pop();
	}
	var mc = str.match(/([+-]?\d+\s*){1},?\s*/g);
	for ( var i = 0, n = mc.length; i < n; ++i) {
		this.push(parseInt(mc[i], 10));
	}
};
x3dom.fields.MFInt32.prototype.toGL = function() {
	var a = [];
	Array.map(this, function(v) {
		a.push(v);
	});
	return a;
};
x3dom.fields.MFFloat = function(array) {
	if (arguments.length == 0) {
	} else {
		array.map(function(v) {
			this.push(v);
		}, this);
	}
};
x3dom.fields.MFFloat.prototype = new Array;
x3dom.fields.MFFloat.parse = function(str) {
	var mc = str.match(/([+\-0-9eE\.]+)/g);
	var vals = [];
	for ( var i = 0, n = mc.length; i < n; i++) {
		vals.push(+mc[i]);
	}
	return new x3dom.fields.MFFloat(vals);
};
x3dom.fields.MFFloat.prototype.setValueByStr = function(str) {
	while (this.length) {
		this.pop();
	}
	var mc = str.match(/([+\-0-9eE\.]+)/g);
	for ( var i = 0, n = mc.length; i < n; i++) {
		this.push(+mc[i]);
	}
};
x3dom.fields.MFFloat.prototype.toGL = function() {
	var a = [];
	Array.map(this, function(v) {
		a.push(v);
	});
	return a;
};
x3dom.fields.MFString = function(strArray) {
	if (arguments.length == 0) {
	} else {
		strArray.map(function(v) {
			this.push(v);
		}, this);
	}
};
x3dom.fields.MFString.parse = function(str) {
	var arr = [];
	if (str.length && str[0] == '"') {
		var m, re = /"((?:[^\\"]|\\\\|\\")*)"/g;
		while ((m = re.exec(str))) {
			var s = m[1].replace(/\\([\\"])/, "$1");
			if (s !== undefined) {
				arr.push(s);
			}
		}
	} else {
		arr.push(str);
	}
	return new x3dom.fields.MFString(arr);
};
x3dom.fields.MFString.prototype = new Array;
x3dom.fields.MFString.prototype.setValueByStr = function(str) {
	var arr = this;
	while (arr.length) {
		arr.pop();
	}
	if (str.length && str[0] == '"') {
		var m, re = /"((?:[^\\"]|\\\\|\\")*)"/g;
		while ((m = re.exec(str))) {
			var s = m[1].replace(/\\([\\"])/, "$1");
			if (s !== undefined) {
				arr.push(s);
			}
		}
	} else {
		arr.push(str);
	}
	return this;
};
x3dom.fields.MFString.prototype.toString = function() {
	var str = "";
	for ( var i = 0; i < this.length; i++) {
		str = str + this[i] + " ";
	}
	return str;
};
x3dom.fields.SFNode = function(type) {
	this.type = type;
	this.node = null;
};
x3dom.fields.SFNode.prototype.hasLink = function(node) {
	return (node ? (this.node === node) : this.node);
};
x3dom.fields.SFNode.prototype.addLink = function(node) {
	this.node = node;
	return true;
};
x3dom.fields.SFNode.prototype.rmLink = function(node) {
	if (this.node === node) {
		this.node = null;
		return true;
	} else {
		return false;
	}
};
x3dom.fields.MFNode = function(type) {
	this.type = type;
	this.nodes = [];
};
x3dom.fields.MFNode.prototype.hasLink = function(node) {
	if (node) {
		for ( var i = 0, n = this.nodes.length; i < n; i++) {
			if (this.nodes[i] === node) {
				return true;
			}
		}
	} else {
		return (this.length > 0);
	}
	return false;
};
x3dom.fields.MFNode.prototype.addLink = function(node) {
	this.nodes.push(node);
	return true;
};
x3dom.fields.MFNode.prototype.rmLink = function(node) {
	for ( var i = 0, n = this.nodes.length; i < n; i++) {
		if (this.nodes[i] === node) {
			this.nodes.splice(i, 1);
			return true;
		}
	}
	return false;
};
x3dom.fields.MFNode.prototype.length = function() {
	return this.nodes.length;
};
x3dom.fields.Line = function(pos, dir) {
	if (arguments.length == 0) {
		this.pos = new x3dom.fields.SFVec3f(0, 0, 0);
		this.dir = new x3dom.fields.SFVec3f(0, 0, 1);
	} else {
		this.pos = new x3dom.fields.SFVec3f(pos.x, pos.y, pos.z);
		var n = dir.length();
		if (n) {
			n = 1.0 / n;
		}
		this.dir = new x3dom.fields.SFVec3f(dir.x * n, dir.y * n, dir.z * n);
	}
	this.enter = 0;
	this.exit = 0;
	this.hitObject = null;
	this.hitPoint = {};
	this.dist = Number.MAX_VALUE;
};
x3dom.fields.Line.prototype.toString = function() {
	var str = 'Line: [' + this.pos.toString() + '; ' + this.dir.toString()
			+ ']';
	return str;
};
x3dom.fields.Line.prototype.intersect = function(low, high) {
	var isect = 0.0;
	var out = Number.MAX_VALUE;
	var r, te, tl;
	if (this.dir.x > x3dom.fields.Eps) {
		r = 1.0 / this.dir.x;
		te = (low.x - this.pos.x) * r;
		tl = (high.x - this.pos.x) * r;
		if (tl < out)
			out = tl;
		if (te > isect)
			isect = te;
	} else if (this.dir.x < -x3dom.fields.Eps) {
		r = 1.0 / this.dir.x;
		te = (high.x - this.pos.x) * r;
		tl = (low.x - this.pos.x) * r;
		if (tl < out)
			out = tl;
		if (te > isect)
			isect = te;
	} else if (this.pos.x < low.x || this.pos.x > high.x) {
		return false;
	}
	if (this.dir.y > x3dom.fields.Eps) {
		r = 1.0 / this.dir.y;
		te = (low.y - this.pos.y) * r;
		tl = (high.y - this.pos.y) * r;
		if (tl < out)
			out = tl;
		if (te > isect)
			isect = te;
		if (isect - out >= x3dom.fields.Eps)
			return false;
	} else if (this.dir.y < -x3dom.fields.Eps) {
		r = 1.0 / this.dir.y;
		te = (high.y - this.pos.y) * r;
		tl = (low.y - this.pos.y) * r;
		if (tl < out)
			out = tl;
		if (te > isect)
			isect = te;
		if (isect - out >= x3dom.fields.Eps)
			return false;
	} else if (this.pos.y < low.y || this.pos.y > high.y) {
		return false;
	}
	if (this.dir.z > x3dom.fields.Eps) {
		r = 1.0 / this.dir.z;
		te = (low.z - this.pos.z) * r;
		tl = (high.z - this.pos.z) * r;
		if (tl < out)
			out = tl;
		if (te > isect)
			isect = te;
	} else if (this.dir.z < -x3dom.fields.Eps) {
		r = 1.0 / this.dir.z;
		te = (high.z - this.pos.z) * r;
		tl = (low.z - this.pos.z) * r;
		if (tl < out)
			out = tl;
		if (te > isect)
			isect = te;
	} else if (this.pos.z < low.z || this.pos.z > high.z) {
		return false;
	}
	this.enter = isect;
	this.exit = out;
	return (isect - out < x3dom.fields.Eps);
};
x3dom.versionInfo = {
	version : '1.0',
	svnrevision : '456'
};