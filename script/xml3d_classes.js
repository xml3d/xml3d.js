
// Create global symbol org
var org;
if (!org)
	org = {};
else if (typeof org != "object")
	throw new Error("org already exists and is not an object");

if (!org.xml3d)
	org.xml3d = {};
else if (typeof org.xml3d != "object")
	throw new Error("org.xml3d already exists and is not an object");

org.xml3d.nodeTypes = {};
org.xml3d.registerNodeType = function(nodeTypeName, nodeDef) {
	if (org.xml3d.debug)
		org.xml3d.debug.logInfo("Registering nodetype [" + nodeTypeName + "]");
	org.xml3d.nodeTypes[nodeTypeName] = nodeDef;
};
org.xml3d.defineClass = function(parent, ctor, methods) {
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
};

// -----------------------------------------------------------------------------
// Class URI
// -----------------------------------------------------------------------------
org.xml3d.URI = function(str) {
	if (!str)
		str = "";
	// Based on the regex in RFC2396 Appendix B.
	var parser = /^(?:([^:\/?\#]+):)?(?:\/\/([^\/?\#]*))?([^?\#]*)(?:\?([^\#]*))?(?:\#(.*))?/;
	var result = str.match(parser);
	this.scheme = result[1] || null;
	this.authority = result[2] || null;
	this.path = result[3] || null;
	this.query = result[4] || null;
	this.fragment = result[5] || null;
};

// Restore the URI to it's stringy glory.
org.xml3d.URI.prototype.toString = function() {
	var str = "";
	if (this.scheme) {
		str += this.scheme + ":";
	}
	if (this.authority) {
		str += "//" + this.authority;
	}
	if (this.path) {
		str += this.path;
	}
	if (this.query) {
		str += "?" + this.query;
	}
	if (this.fragment) {
		str += "#" + this.fragment;
	}
	return str;
};

// -----------------------------------------------------------------------------
// Class URIResolver
// -----------------------------------------------------------------------------
org.xml3d.URIResolver = function() {
};

org.xml3d.URIResolver.resolve = function(document, uriStr) {
	if (!document || !uriStr)
		return null;
	var uri = new org.xml3d.URI(uriStr);
	if (!uri.path)
		return org.xml3d.URIResolver.resolveLocal(document, uri.fragment);

	org.xml3d.debug.logInfo("++ Can't resolve global hrefs yet: " + uriStr);
	// TODO Resolve intra-document references
	return null;
};

org.xml3d.URIResolver.resolveLocal = function(document, id) {
	if (document !== undefined && document) {
		var elem = document.getElementById(id);
		//org.xml3d.debug.logInfo("++ Found: " + elem);
		if (elem)
		{
			var node = document.getNode(elem);
			//org.xml3d.debug.logInfo("++ Found: " + node);
			return node;
		}
	}
	return null;
};

var getElementByIdWrapper = function(xmldoc, myID, namespace) {
	
};

// -----------------------------------------------------------------------------
// Class XML3DNodeFactory
// -----------------------------------------------------------------------------
org.xml3d.XML3DNodeFactory = function() {
};

org.xml3d.XML3DNodeFactory.isXML3DNode = function(node) {
	return (node.nodeType === Node.ELEMENT_NODE && (node.namespaceURI == org.xml3d.xml3dNS));
};

org.xml3d.XML3DNodeFactory.prototype.create = function(node, ctx) {
	var n, t;
	if (org.xml3d.XML3DNodeFactory.isXML3DNode(node)) {
		var nodeType = org.xml3d.nodeTypes[node.localName];
		if (nodeType === undefined) {
			org.xml3d.debug.logInfo("Unrecognised element " + node.localName);
		} else {
			org.xml3d.debug.logInfo("Created class for " + node.localName);
			ctx.domElement = node;
			n = new nodeType(ctx);
			node._xml3dNode = n;
			Array.forEach(Array.map(node.childNodes, function(n) {
				return this.create(n, ctx);
			}, this), function(c) {
				if (c)
					n.addChild(c);
			});
			return n;
		}
	}
};

// -----------------------------------------------------------------------------
// Class XML3Document
// -----------------------------------------------------------------------------
org.xml3d.XML3DDocument = function(parentDocument) {
	this.parentDocument = parentDocument;
	this.canvases = new Array();
	this.factory = new org.xml3d.XML3DNodeFactory();
	this.onload = function() {
		alert("on load");
	};
	this.onerror = function() {
		alert("on error");
	};
};

org.xml3d.XML3DDocument.prototype.createCanvas = function(xml3dElement) {
	
	var canvas = new org.xml3d.XML3DCanvas(xml3dElement);
	if (canvas.gl) {
		canvas.root = this.getNode(xml3dElement);
		this.canvases.push(canvas);
		canvas.onload();
	}
	return canvas;
};

org.xml3d.XML3DDocument.prototype.onunload = function(xml3dElement) {
	for ( var i = 0; i < this.canvases.length; i++) {
		this.canvases[i].shutdown();
	}
};

org.xml3d.XML3DDocument.prototype.getNode = function(element) {
	if (element._xml3dNode !== undefined)
		return element._xml3dNode;
	
	var ctx = {
			assert : org.xml3d.debug.assert,
			log : org.xml3d.debug.logInfo,
			factory : this.factory,
			doc : this
		};
	return this.factory.create(element, ctx);
};

org.xml3d.XML3DDocument.prototype.getElementById = function(id) {
	return this.parentDocument.evaluate('//*[@id="' + id + '"]', this.parentDocument, function() {
		return org.xml3d.xml3dNS;
	}, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
};

org.xml3d.XML3DDocument.prototype.resolve = function(uriStr) {
		return org.xml3d.URIResolver.resolve(this, uriStr);
};

// MeshTypes
org.xml3d.MeshTypes = {};
org.xml3d.MeshTypes["triangles"] = 0;
org.xml3d.MeshTypes["triangleStrips"] = 1;
// TextureTypes
org.xml3d.TextureTypes = {};
org.xml3d.TextureTypes["2D"] = 0;
org.xml3d.TextureTypes["1D"] = 1;
org.xml3d.TextureTypes["3D"] = 2;
// FilterTypes
org.xml3d.FilterTypes = {};
org.xml3d.FilterTypes["none"] = 0;
org.xml3d.FilterTypes["nearest"] = 1;
org.xml3d.FilterTypes["linear"] = 2;
// WrapTypes
org.xml3d.WrapTypes = {};
org.xml3d.WrapTypes["clamp"] = 0;
org.xml3d.WrapTypes["repeat"] = 1;
org.xml3d.WrapTypes["border"] = 2;

/**
 * Register class for element <Xml3dNode>
 */
org.xml3d.registerNodeType("Xml3dNode",
  org.xml3d.defineClass(
    null,
    function(c) {
      this.domElement = c.domElement;
      this.typeName = c.domElement.localName;
      this.xml3ddocument = c.doc;
      this.parentNode = c.doc.getNode(c.domElement.parentNode);
      this.childNodes = [];
      this.adapters = [];
    }, {
   		addChild : function(node) {
				this.childNodes.push(node);
			},
		addAdapter: function(node) {
				this.adapters.push(node);
			},
		getTextContent : function() {
			var str = "";
			var k = this.domElement.firstChild;
			while (k) {
				if (k.nodeType == 3)
					str += k.textContent;
				k = k.nextSibling;
			}
			return str;
		}
    }));


/**
 * Register class for element <Xml3dBaseType>
 */
org.xml3d.registerNodeType("Xml3dBaseType",
  org.xml3d.defineClass(
    org.xml3d.nodeTypes.Xml3dNode,
    function(c) {
    org.xml3d.nodeTypes.Xml3dBaseType.superClass.call(this, c);
    }, {
    }));

/**
 * Register class for element <defs>
 */
org.xml3d.registerNodeType("defs",
  org.xml3d.defineClass(
	org.xml3d.nodeTypes.Xml3dBaseType,
    function(c) {
    org.xml3d.nodeTypes.defs.superClass.call(this, c);
	this.children = [];
    }, {
    }));

/**
 * Register class for element <Xml3dGraphType>
 */
org.xml3d.registerNodeType("Xml3dGraphType",
  org.xml3d.defineClass(
	org.xml3d.nodeTypes.Xml3dBaseType,
    function(c) {
    org.xml3d.nodeTypes.Xml3dGraphType.superClass.call(this, c);
	this.visible = org.xml3d.initBoolean(this.domElement.getAttribute("visible"), true);
    }, {
    }));

/**
 * Register class for element <group>
 */
org.xml3d.registerNodeType("group",
  org.xml3d.defineClass(
	org.xml3d.nodeTypes.Xml3dGraphType,
    function(c) {
    org.xml3d.nodeTypes.group.superClass.call(this, c);
	this.translation = org.xml3d.initVec3f(this.domElement.getAttribute("translation"), 0, 0, 0);
	this.scale = org.xml3d.initVec3f(this.domElement.getAttribute("scale"), 1, 1, 1);
	this.rotation = org.xml3d.initAxisAnglef(this.domElement.getAttribute("rotation"), 0, 0, 1, 0);
	this.center = org.xml3d.initVec3f(this.domElement.getAttribute("center"), 0, 0, 0);
	this.scaleOrientation = org.xml3d.initAxisAnglef(this.domElement.getAttribute("scaleOrientation"), 0, 0, 1, 0);
	this.transform = null;
	this.children = [];
    }, {
	getTransform : function() {
		if (!this.transform && this.domElement.hasAttribute("transform"))
		{
		  this.transform = this.xml3ddocument.resolve(this.domElement.getAttribute("transform"));
		}
		return this.transform;
	}
    }));

/**
 * Register class for element <Xml3dGeometryType>
 */
org.xml3d.registerNodeType("Xml3dGeometryType",
  org.xml3d.defineClass(
	org.xml3d.nodeTypes.Xml3dGraphType,
    function(c) {
    org.xml3d.nodeTypes.Xml3dGeometryType.superClass.call(this, c);
    }, {
    }));

/**
 * Register class for element <mesh>
 */
org.xml3d.registerNodeType("mesh",
  org.xml3d.defineClass(
	org.xml3d.nodeTypes.Xml3dGeometryType,
    function(c) {
    org.xml3d.nodeTypes.mesh.superClass.call(this, c);
	this.type = org.xml3d.initEnum(this.domElement.getAttribute("type"), 0, org.xml3d.MeshTypes);
	this.binds = [];
    }, {
    }));

/**
 * Register class for element <Xml3dTransformProvider>
 */
org.xml3d.registerNodeType("Xml3dTransformProvider",
  org.xml3d.defineClass(
	org.xml3d.nodeTypes.Xml3dBaseType,
    function(c) {
    org.xml3d.nodeTypes.Xml3dTransformProvider.superClass.call(this, c);
    }, {
    }));

/**
 * Register class for element <transform>
 */
org.xml3d.registerNodeType("transform",
  org.xml3d.defineClass(
	org.xml3d.nodeTypes.Xml3dTransformProvider,
    function(c) {
    org.xml3d.nodeTypes.transform.superClass.call(this, c);
	this.translation = org.xml3d.initVec3f(this.domElement.getAttribute("translation"), 0, 0, 0);
	this.scale = org.xml3d.initVec3f(this.domElement.getAttribute("scale"), 1, 1, 1);
	this.rotation = org.xml3d.initAxisAnglef(this.domElement.getAttribute("rotation"), 0, 0, 1, 0);
	this.center = org.xml3d.initVec3f(this.domElement.getAttribute("center"), 0, 0, 0);
	this.scaleOrientation = org.xml3d.initAxisAnglef(this.domElement.getAttribute("scaleOrientation"), 0, 0, 1, 0);
    }, {
    }));

/**
 * Register class for element <entity>
 */
org.xml3d.registerNodeType("entity",
  org.xml3d.defineClass(
	org.xml3d.nodeTypes.group,
    function(c) {
    org.xml3d.nodeTypes.entity.superClass.call(this, c);
	this.shader = null;
    }, {
	getShader : function() {
		if (!this.shader && this.domElement.hasAttribute("shader"))
		{
		  this.shader = this.xml3ddocument.resolve(this.domElement.getAttribute("shader"));
		}
		return this.shader;
	}
    }));

/**
 * Register class for element <bind>
 */
org.xml3d.registerNodeType("bind",
  org.xml3d.defineClass(
	org.xml3d.nodeTypes.Xml3dBaseType,
    function(c) {
    org.xml3d.nodeTypes.bind.superClass.call(this, c);
	this.semantic = org.xml3d.initString(this.domElement.getAttribute("semantic"), "");
	this.bound = null;
    }, {
    }));

/**
 * Register class for element <Xml3dShaderType>
 */
org.xml3d.registerNodeType("Xml3dShaderType",
  org.xml3d.defineClass(
	org.xml3d.nodeTypes.Xml3dBaseType,
    function(c) {
    org.xml3d.nodeTypes.Xml3dShaderType.superClass.call(this, c);
	this.binds = [];
	this.script = null;
    }, {
	getScript : function() {
		if (!this.script && this.domElement.hasAttribute("script"))
		{
		  this.script = this.xml3ddocument.resolve(this.domElement.getAttribute("script"));
		}
		return this.script;
	}
    }));

/**
 * Register class for element <Xml3dSurfaceShaderProvider>
 */
org.xml3d.registerNodeType("Xml3dSurfaceShaderProvider",
  org.xml3d.defineClass(
	org.xml3d.nodeTypes.Xml3dShaderType,
    function(c) {
    org.xml3d.nodeTypes.Xml3dSurfaceShaderProvider.superClass.call(this, c);
    }, {
    }));

/**
 * Register class for element <shader>
 */
org.xml3d.registerNodeType("shader",
  org.xml3d.defineClass(
	org.xml3d.nodeTypes.Xml3dSurfaceShaderProvider,
    function(c) {
    org.xml3d.nodeTypes.shader.superClass.call(this, c);
    }, {
    }));

/**
 * Register class for element <light>
 */
org.xml3d.registerNodeType("light",
  org.xml3d.defineClass(
	org.xml3d.nodeTypes.Xml3dGraphType,
    function(c) {
    org.xml3d.nodeTypes.light.superClass.call(this, c);
	this.global = org.xml3d.initBoolean(this.domElement.getAttribute("global"), false);
	this.intensity = org.xml3d.initFloat(this.domElement.getAttribute("intensity"), 1);
	this.shader = null;
    }, {
	getShader : function() {
		if (!this.shader && this.domElement.hasAttribute("shader"))
		{
		  this.shader = this.xml3ddocument.resolve(this.domElement.getAttribute("shader"));
		}
		return this.shader;
	}
    }));

/**
 * Register class for element <Xml3dLightShaderProvider>
 */
org.xml3d.registerNodeType("Xml3dLightShaderProvider",
  org.xml3d.defineClass(
	org.xml3d.nodeTypes.Xml3dShaderType,
    function(c) {
    org.xml3d.nodeTypes.Xml3dLightShaderProvider.superClass.call(this, c);
    }, {
    }));

/**
 * Register class for element <lightshader>
 */
org.xml3d.registerNodeType("lightshader",
  org.xml3d.defineClass(
	org.xml3d.nodeTypes.Xml3dLightShaderProvider,
    function(c) {
    org.xml3d.nodeTypes.lightshader.superClass.call(this, c);
    }, {
    }));

/**
 * Register class for element <script>
 */
org.xml3d.registerNodeType("script",
  org.xml3d.defineClass(
	org.xml3d.nodeTypes.Xml3dBaseType,
    function(c) {
    org.xml3d.nodeTypes.script.superClass.call(this, c);
	this.value = org.xml3d.initString(this.getTextContent(), null);
    }, {
    }));

/**
 * Register class for element <Xml3dBindable>
 */
org.xml3d.registerNodeType("Xml3dBindable",
  org.xml3d.defineClass(
    org.xml3d.nodeTypes.Xml3dNode,
    function(c) {
    org.xml3d.nodeTypes.Xml3dBindable.superClass.call(this, c);
    }, {
    }));

/**
 * Register class for element <float>
 */
org.xml3d.registerNodeType("float",
  org.xml3d.defineClass(
	org.xml3d.nodeTypes.Xml3dBindable,
    function(c) {
    org.xml3d.nodeTypes.float.superClass.call(this, c);
	this.value = org.xml3d.initFloatArray(this.getTextContent(), null);
    }, {
    }));

/**
 * Register class for element <float2>
 */
org.xml3d.registerNodeType("float2",
  org.xml3d.defineClass(
	org.xml3d.nodeTypes.Xml3dBindable,
    function(c) {
    org.xml3d.nodeTypes.float2.superClass.call(this, c);
	this.value = org.xml3d.initFloat2Array(this.getTextContent(), null);
    }, {
    }));

/**
 * Register class for element <float3>
 */
org.xml3d.registerNodeType("float3",
  org.xml3d.defineClass(
	org.xml3d.nodeTypes.Xml3dBindable,
    function(c) {
    org.xml3d.nodeTypes.float3.superClass.call(this, c);
	this.value = org.xml3d.initFloat3Array(this.getTextContent(), null);
    }, {
    }));

/**
 * Register class for element <float4>
 */
org.xml3d.registerNodeType("float4",
  org.xml3d.defineClass(
	org.xml3d.nodeTypes.Xml3dBindable,
    function(c) {
    org.xml3d.nodeTypes.float4.superClass.call(this, c);
	this.value = org.xml3d.initFloat4Array(this.getTextContent(), null);
    }, {
    }));

/**
 * Register class for element <int>
 */
org.xml3d.registerNodeType("int",
  org.xml3d.defineClass(
	org.xml3d.nodeTypes.Xml3dBindable,
    function(c) {
    org.xml3d.nodeTypes.int.superClass.call(this, c);
	this.value = org.xml3d.initIntArray(this.getTextContent(), null);
    }, {
    }));

/**
 * Register class for element <bool>
 */
org.xml3d.registerNodeType("bool",
  org.xml3d.defineClass(
	org.xml3d.nodeTypes.Xml3dBindable,
    function(c) {
    org.xml3d.nodeTypes.bool.superClass.call(this, c);
	this.value = org.xml3d.initBoolArray(this.getTextContent(), null);
    }, {
    }));

/**
 * Register class for element <use>
 */
org.xml3d.registerNodeType("use",
  org.xml3d.defineClass(
	org.xml3d.nodeTypes.Xml3dGraphType,
    function(c) {
    org.xml3d.nodeTypes.use.superClass.call(this, c);
	this.href = null;
    }, {
	getHref : function() {
		if (!this.href && this.domElement.hasAttribute("href"))
		{
		  this.href = this.xml3ddocument.resolve(this.domElement.getAttribute("href"));
		}
		return this.href;
	}
    }));

/**
 * Register class for element <xml3d>
 */
org.xml3d.registerNodeType("xml3d",
  org.xml3d.defineClass(
	org.xml3d.nodeTypes.Xml3dBaseType,
    function(c) {
    org.xml3d.nodeTypes.xml3d.superClass.call(this, c);
	this.height = org.xml3d.initInt(this.domElement.getAttribute("height"), 600);
	this.width = org.xml3d.initInt(this.domElement.getAttribute("width"), 800);
	this.definitionArea = [];
	this.graph = [];
	this.camera = new org.xml3d.Camera();
    }, {
    }));

/**
 * Register class for element <camera>
 */
org.xml3d.registerNodeType("camera",
  org.xml3d.defineClass(
    org.xml3d.nodeTypes.Xml3dNode,
    function(c) {
    org.xml3d.nodeTypes.camera.superClass.call(this, c);
    }, {
    }));

/**
 * Register class for element <Xml3dImageDataProvider>
 */
org.xml3d.registerNodeType("Xml3dImageDataProvider",
  org.xml3d.defineClass(
	org.xml3d.nodeTypes.Xml3dBaseType,
    function(c) {
    org.xml3d.nodeTypes.Xml3dImageDataProvider.superClass.call(this, c);
    }, {
    }));

/**
 * Register class for element <texture>
 */
org.xml3d.registerNodeType("texture",
  org.xml3d.defineClass(
	org.xml3d.nodeTypes.Xml3dBindable,
    function(c) {
    org.xml3d.nodeTypes.texture.superClass.call(this, c);
	this.type = org.xml3d.initEnum(this.domElement.getAttribute("type"), 0, org.xml3d.TextureTypes);
	this.filterMin = org.xml3d.initEnum(this.domElement.getAttribute("filterMin"), null, org.xml3d.FilterTypes);
	this.filterMag = org.xml3d.initEnum(this.domElement.getAttribute("filterMag"), null, org.xml3d.FilterTypes);
	this.filterMip = org.xml3d.initEnum(this.domElement.getAttribute("filterMip"), null, org.xml3d.FilterTypes);
	this.wrapS = org.xml3d.initEnum(this.domElement.getAttribute("wrapS"), null, org.xml3d.WrapTypes);
	this.wrapT = org.xml3d.initEnum(this.domElement.getAttribute("wrapT"), null, org.xml3d.WrapTypes);
	this.wrapU = org.xml3d.initEnum(this.domElement.getAttribute("wrapU"), null, org.xml3d.WrapTypes);
	this.borderColor = org.xml3d.initString(this.domElement.getAttribute("borderColor"), null);
	this.imageData = null;
    }, {
    }));

/**
 * Register class for element <img>
 */
org.xml3d.registerNodeType("img",
  org.xml3d.defineClass(
	org.xml3d.nodeTypes.Xml3dImageDataProvider,
    function(c) {
    org.xml3d.nodeTypes.img.superClass.call(this, c);
	this.src = org.xml3d.initAnyURI(this.domElement.getAttribute("src"), "");
    }, {
    }));

