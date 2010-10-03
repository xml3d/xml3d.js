
//Check, if basics have already been defined
var org;
if (!org || !org.xml3d)
  throw new Error("xml3d.js has to be included first");

//Create global symbol org.xml3d.webgl
if (!org.xml3d.event)
	org.xml3d.event = {};
else if (typeof org.xml3d.event != "object")
	throw new Error("org.xml3d.event already exists and is not an object");

//Create global symbol org.xml3d.data
if (!org.xml3d.data)
	org.xml3d.data = {};
else if (typeof org.xml3d.data != "object")
	throw new Error("org.xml3d.data already exists and is not an object");


org.xml3d.classInfo = {};
org.xml3d.methods = {};
org.xml3d.document = null;

org.xml3d.data.configure = function(xml3ds) {
 	if (!org.xml3d.document)
 		org.xml3d.document = new org.xml3d.XML3DDocument();
 	
 	for(var x in xml3ds) {
 		org.xml3d.document.initXml3d(xml3ds[x]);
 	}
};

org.xml3d.defineClass = function(ctor, parent, methods) {
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

org.xml3d.isa = function(object, classInfo) {
	var oClass = object._classInfo;
	while (oClass !== undefined)  {
		if (oClass == classInfo)
			return true;
		oClass = oClass.constructor.superClass;
	}
	return false;
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
	
	if (uri.scheme == 'urn')
	{
		org.xml3d.debug.logInfo("++ Found URN." + uriStr);
		return null;
	}
	
	if (!uri.path)
		return org.xml3d.URIResolver.resolveLocal(document, uri.fragment);

	
	org.xml3d.debug.logWarning("++ Can't resolve global hrefs yet: " + uriStr);
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

org.xml3d.XML3DNodeFactory.prototype.create = function(node, context) {
	var n, t;
	if (org.xml3d.XML3DNodeFactory.isXML3DNode(node)) {
		var classInfo = org.xml3d.classInfo[node.localName];
		if (classInfo === undefined) {
			org.xml3d.debug.logInfo("Unrecognised element " + node.localName);
		} else {
			classInfo.configure(node, context);
			node._configured = true;
			node._classInfo = classInfo;
			//n = new elementType(ctx);
			//node._xml3dNode = n;
			Array.forEach(Array.map(node.childNodes, function(n) {
				return this.create(n, context);
			}, this), function(c) {
				
			});
			return n;
		}
	}
};

org.xml3d.XML3DNodeFactory.createXML3DVec3FromString = function(value) {
	var result = new XML3DVec3();
	result.setVec3Value(value);
	return result;
};

org.xml3d.XML3DNodeFactory.createXML3DRotationFromString = function(value) {
	var result = new XML3DRotation();
	result.setAxisAngleValue(value);
	return result;
};

// -----------------------------------------------------------------------------
// Class XML3Document
// -----------------------------------------------------------------------------
org.xml3d.XML3DDocument = function(parentDocument) {
	this.parentDocument = parentDocument;
	this.factory = new org.xml3d.XML3DNodeFactory();
	this.onload = function() {
		alert("on load");
	};
	this.onerror = function() {
		alert("on error");
	};
};

org.xml3d.XML3DDocument.prototype.initXml3d = function(xml3dElement) {
	
	if (xml3dElement._xml3dNode !== undefined)
		return;
	
	xml3dNode = this.getNode(xml3dElement);
	xml3dElement.addEventListener('DOMNodeRemoved', this.onRemove, true);
	xml3dElement.addEventListener('DOMNodeInserted', this.onAdd, true);
	xml3dElement.addEventListener('DOMAttrModified', this.onSet, true);
	xml3dElement.addEventListener('DOMCharacterDataModified', this.onTextSet, true);

};

org.xml3d.XML3DDocument.prototype.onTextSet = function(e){
	if (e.target === undefined)
	{
		org.xml3d.debug.logInfo("Unhandled event on: " + e.target.localName);
		return;
	}
	try {
		var bindNode = e.target.parentNode.parentNode;
		var oldValue = e.target.parentNode.value;
		e.target.parentNode.setValue(e);
		if (bindNode.notificationRequired())
			bindNode.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "text", oldValue, e.target.parentNode.value));
	} catch (e) {
		org.xml3d.debug.logError("Exception in textSet:");
		org.xml3d.debug.logException(e);
	}
};

org.xml3d.XML3DDocument.prototype.onAdd = function(e) {
	try {
		org.xml3d.document.getNode(e.target);
	} catch (e) {
		org.xml3d.debug.logError("Exception in configuring node:");
		org.xml3d.debug.logException(e);
	}
};

org.xml3d.XML3DDocument.prototype.onSet = function(e) {
	if (e.target === undefined)
	{
		org.xml3d.debug.logInfo("Unhandled event on: " + e.target.localName);
		return;
	}
	try {
		e.target.setField(e);
	} catch (e) {
		org.xml3d.debug.logError("Exception in setField:");
		org.xml3d.debug.logException(e);
	}
};

org.xml3d.XML3DDocument.prototype.onRemove = function(e) {
	org.xml3d.debug.logInfo("Remove: "+e);
};

org.xml3d.XML3DDocument.prototype.onunload = function(xml3dElement) {
};

org.xml3d.XML3DDocument.prototype.getNode = function(element) {
	if (element._configured !== undefined)
		return element;
	
	var ctx = {
			assert : org.xml3d.debug.assert,
			log : org.xml3d.debug.logInfo,
			factory : this.factory,
			doc : this
		};
	return this.factory.create(element, ctx);
};

org.xml3d.XML3DDocument.prototype.resolve = function(uriStr) {
		return org.xml3d.URIResolver.resolve(this, uriStr);
};

org.xml3d.XML3DDocument.prototype.nativeGetElementById = document.getElementById;

org.xml3d.XML3DDocument.prototype.getElementById = function(id) {
	return document.getElementById(id);
};

//-----------------------------------------------------------------------------
//Class Notification
//-----------------------------------------------------------------------------
org.xml3d.Notification = function(notifier, eventType, attribute, oldValue, newValue) {
	this.notifier = notifier;
	this.eventType = eventType;
	this.attribute = attribute;
	this.oldValue = oldValue;
	this.newValue = newValue;
};

//-----------------------------------------------------------------------------
// Adapter and Adapter factory
//-----------------------------------------------------------------------------

org.xml3d.data.Adapter = function(factory, node) {
	this.factory = factory; // optional
	this.node = node; // optional
	this.init = function() {
	  // Init is called by the factory after adding the adapter to the node
	};

};
org.xml3d.data.Adapter.prototype.notifyChanged = function(e) {
	 // Notification from the data structure. e is of type org.xml3d.Notification.
};
org.xml3d.data.Adapter.prototype.isAdapterFor = function(aType) {
	 return false; // Needs to be overwritten
};

org.xml3d.data.AdapterFactory = function() {
	//this.parentFactory = parent;
 	// This function has to be overwritten
	//this.createAdapter = function(node) {
	//	return null;
	//};
	this.getAdapter = function(node, atype) {
		if (!node || node._configured === undefined)
			return null;
		for (i = 0; i < node.adapters.length; i++) {
			if (node.adapters[i].isAdapterFor(atype)) {
				return node.adapters[i];
			}
		}
		// No adapter found, try to create one
		var adapter = this.createAdapter(node);
		if (adapter) {
			node.addAdapter(adapter);
			adapter.init();
		}
		return adapter;
	};
};


//-----------------------------------------------------------------------------
// Init helper
//-----------------------------------------------------------------------------
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

org.xml3d.initXML3DVec3 = function(value, x, y, z) {
	if (value) {
		var result = new XML3DVec3();
		result.setVec3Value(value);
		return result;
	}
	else return new XML3DVec3(x, y, z);
};

org.xml3d.initXML3DRotation = function(value, x, y, z, angle) {
	var result = new XML3DRotation();
	if (value) {
		result.setAxisAngleValue(value);
	} else {
		result.setAxisAngle(new XML3DVec3(x, y, z), angle);
	}
	return result;
};

org.xml3d.initEnum = function(value, defaultValue, choice) {
	return (value && choice[value] !== undefined) ? choice[value]
			: defaultValue;
};

org.xml3d.initIntArray = function(value, defaultValue) {
	var exp = /([+\-0-9]+)/g;
	return value ? new Int32Array(value.match(exp)) : new Int32Array(defaultValue);
};

org.xml3d.initFloatArray = function(value, defaultValue) {
	var exp = /([+\-0-9eE\.]+)/g;
	return value ? new Float32Array(value.match(exp)) :  new Float32Array(defaultValue);
};

org.xml3d.initFloat3Array = function(value, defaultValue) {
	return org.xml3d.initFloatArray(value, defaultValue);
};

org.xml3d.initFloat2Array = function(value, defaultValue) {
	return org.xml3d.initFloatArray(value, defaultValue);
};

org.xml3d.initFloat4x4Array = function(value, defaultValue) {
	return org.xml3d.initFloatArray(value, defaultValue);
};

org.xml3d.initBoolArray = function(value, defaultValue) {
	return new Array();
};

org.xml3d.initAnyURI = function(node, defaultValue) {
	return org.xml3d.initString(node, defaultValue);
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

// Initialize methods
org.xml3d.event.UNHANDLED = 1;
org.xml3d.event.HANDLED = 2;




/**
 * Register class for element <Xml3dNode>
 */

org.xml3d.classInfo.Xml3dNode = function() {};
 
org.xml3d.classInfo.Xml3dNode.configure = function(node, c) {
	node.xml3ddocument = c.doc;
	node.adapters = [];

	node.addAdapter = function(adapter) {
		this.adapters.push(adapter);
	};
	node.getTextContent = function() {
		var str = "";
		var k = this.firstChild;
		while (k) {
			if (k.nodeType == 3)
				str += k.textContent;
			k = k.nextSibling;
		}
		return str;
	};
	
	node.notificationRequired = function () {
		return this.adapters.length != 0;
	};

	node.notify = function (notification) {
		for(var i= 0; i < this.adapters.length; i++)
		{
		  this.adapters[i].notifyChanged(notification);
		}
	};
	
	node.update = function() {
		//org.xml3d.debug.logInfo("Hit Update");
		// TODO  I need to be able to update...
 	};
 	
	node.setField = function(event) {
		return org.xml3d.event.UNHANDLED;
	};
};


/**
 * Object org.xml3d.classInfo.XML3DBaseType()
 * 
 * @augments org.xml3d.classInfo.Xml3dNode
 * @constructor
 * @see org.xml3d.classInfo.Xml3dNode
 */
 
org.xml3d.classInfo.XML3DBaseType = function() {
	org.xml3d.classInfo.Xml3dNode.call(this);
};

org.xml3d.classInfo.XML3DBaseType.configure = function(node, context) {
	org.xml3d.classInfo.Xml3dNode.configure(node, context);



    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	}; // End setField
	
};
org.xml3d.defineClass(org.xml3d.classInfo.XML3DBaseType, org.xml3d.classInfo.Xml3dNode);

/**
 * Object org.xml3d.classInfo.xml3d()
 * 
 * @augments org.xml3d.classInfo.XML3DBaseType
 * @constructor
 * @see org.xml3d.classInfo.XML3DBaseType
 */
 
org.xml3d.classInfo.xml3d = function() {
	org.xml3d.classInfo.XML3DBaseType.call(this);
};

org.xml3d.classInfo.xml3d.configure = function(node, context) {
	org.xml3d.classInfo.XML3DBaseType.configure(node, context);
	  node.__defineSetter__("height", 
	      function (value) {
	        //org.xml3d.debug.logInfo("Setter: " + value);
	        var oldValue = this._height;
	        if (typeof value == 'string')
	        	this._height = org.xml3d.XML3DNodeFactory.createIntFromString(value);
	        else
	        	this._height = value;
	        
	        if (this.notificationRequired())
            	this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "height", oldValue, this._height));
	      
	      }
	  );
	  node.__defineGetter__("height", 
	      function (value) {
	        return this._height;
	      }
	  );
	  node.__defineSetter__("width", 
	      function (value) {
	        //org.xml3d.debug.logInfo("Setter: " + value);
	        var oldValue = this._width;
	        if (typeof value == 'string')
	        	this._width = org.xml3d.XML3DNodeFactory.createIntFromString(value);
	        else
	        	this._width = value;
	        
	        if (this.notificationRequired())
            	this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "width", oldValue, this._width));
	      
	      }
	  );
	  node.__defineGetter__("width", 
	      function (value) {
	        return this._width;
	      }
	  );

	node._height = org.xml3d.initInt(node.getAttribute("height"), 600);
	node._width = org.xml3d.initInt(node.getAttribute("width"), 800);
	//node.definitionArea = [];
	//node.graph = [];
	node.activeView = null;
	node.getActiveView = function() {
		if (!this.activeView && this.hasAttribute("activeView"))
		{
		  this.activeView = this.xml3ddocument.resolve(this.getAttribute("activeView"));
		}
		return this.activeView;
	};


    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onclick") {
	  	  this.onclick = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "ondblclick") {
	  	  this.ondblclick = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmousedown") {
	  	  this.onmousedown = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmouseup") {
	  	  this.onmouseup = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmouseover") {
	  	  this.onmouseover = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmousemove") {
	  	  this.onmousemove = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmouseout") {
	  	  this.onmouseout = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onkeypress") {
	  	  this.onkeypress = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onkeydown") {
	  	  this.onkeydown = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onkeyup") {
	  	  this.onkeyup = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "height") {
	  	  this.height = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "width") {
	  	  this.width = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	}; // End setField
	node.createXML3DVec3 = org.xml3d.methods.xml3dCreateXML3DVec3;
	node.createXML3DRotation = org.xml3d.methods.xml3dCreateXML3DRotation;
	node.createXML3DMatrix = org.xml3d.methods.xml3dCreateXML3DMatrix;
	node.createXML3DRay = org.xml3d.methods.xml3dCreateXML3DRay;
	node.getElementByPoint = org.xml3d.methods.xml3dGetElementByPoint;
	
};
org.xml3d.defineClass(org.xml3d.classInfo.xml3d, org.xml3d.classInfo.XML3DBaseType);

/**
 * Object org.xml3d.classInfo.XML3DReferenceableType()
 * 
 * @augments org.xml3d.classInfo.XML3DBaseType
 * @constructor
 * @see org.xml3d.classInfo.XML3DBaseType
 */
 
org.xml3d.classInfo.XML3DReferenceableType = function() {
	org.xml3d.classInfo.XML3DBaseType.call(this);
};

org.xml3d.classInfo.XML3DReferenceableType.configure = function(node, context) {
	org.xml3d.classInfo.XML3DBaseType.configure(node, context);



    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	}; // End setField
	
};
org.xml3d.defineClass(org.xml3d.classInfo.XML3DReferenceableType, org.xml3d.classInfo.XML3DBaseType);

/**
 * Object org.xml3d.classInfo.XML3DDataContainerType()
 * 
 * @augments org.xml3d.classInfo.XML3DReferenceableType
 * @constructor
 * @see org.xml3d.classInfo.XML3DReferenceableType
 */
 
org.xml3d.classInfo.XML3DDataContainerType = function() {
	org.xml3d.classInfo.XML3DReferenceableType.call(this);
};

org.xml3d.classInfo.XML3DDataContainerType.configure = function(node, context) {
	org.xml3d.classInfo.XML3DReferenceableType.configure(node, context);
	  node.__defineSetter__("map", 
	      function (value) {
	        //org.xml3d.debug.logInfo("Setter: " + value);
	        var oldValue = this._map;
	        if (typeof value == 'string')
	        	this._map = org.xml3d.XML3DNodeFactory.createStringFromString(value);
	        else
	        	this._map = value;
	        
	        if (this.notificationRequired())
            	this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "map", oldValue, this._map));
	      
	      }
	  );
	  node.__defineGetter__("map", 
	      function (value) {
	        return this._map;
	      }
	  );
	  node.__defineSetter__("expose", 
	      function (value) {
	        //org.xml3d.debug.logInfo("Setter: " + value);
	        var oldValue = this._expose;
	        if (typeof value == 'string')
	        	this._expose = org.xml3d.XML3DNodeFactory.createStringFromString(value);
	        else
	        	this._expose = value;
	        
	        if (this.notificationRequired())
            	this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "expose", oldValue, this._expose));
	      
	      }
	  );
	  node.__defineGetter__("expose", 
	      function (value) {
	        return this._expose;
	      }
	  );

	node._map = org.xml3d.initString(node.getAttribute("map"), "");
	node._expose = org.xml3d.initString(node.getAttribute("expose"), "");
	//node.sources = [];


    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "map") {
	  	  this.map = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "expose") {
	  	  this.expose = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	}; // End setField
	
};
org.xml3d.defineClass(org.xml3d.classInfo.XML3DDataContainerType, org.xml3d.classInfo.XML3DReferenceableType);

/**
 * Object org.xml3d.classInfo.XML3DNestedDataContainerType()
 * 
 * @augments org.xml3d.classInfo.XML3DDataContainerType
 * @constructor
 * @see org.xml3d.classInfo.XML3DDataContainerType
 */
 
org.xml3d.classInfo.XML3DNestedDataContainerType = function() {
	org.xml3d.classInfo.XML3DDataContainerType.call(this);
};

org.xml3d.classInfo.XML3DNestedDataContainerType.configure = function(node, context) {
	org.xml3d.classInfo.XML3DDataContainerType.configure(node, context);

	//node.childContainers = [];
	node.src = null;
	node.getSrc = function() {
		if (!this.src && this.hasAttribute("src"))
		{
		  this.src = this.xml3ddocument.resolve(this.getAttribute("src"));
		}
		return this.src;
	};


    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "map") {
	  	  this.map = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "expose") {
	  	  this.expose = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	}; // End setField
	
};
org.xml3d.defineClass(org.xml3d.classInfo.XML3DNestedDataContainerType, org.xml3d.classInfo.XML3DDataContainerType);

/**
 * Object org.xml3d.classInfo.data()
 * 
 * @augments org.xml3d.classInfo.XML3DNestedDataContainerType
 * @constructor
 * @see org.xml3d.classInfo.XML3DNestedDataContainerType
 */
 
org.xml3d.classInfo.data = function() {
	org.xml3d.classInfo.XML3DNestedDataContainerType.call(this);
};

org.xml3d.classInfo.data.configure = function(node, context) {
	org.xml3d.classInfo.XML3DNestedDataContainerType.configure(node, context);

	node.script = null;
	node.getScript = function() {
		if (!this.script && this.hasAttribute("script"))
		{
		  this.script = this.xml3ddocument.resolve(this.getAttribute("script"));
		}
		return this.script;
	};


    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "map") {
	  	  this.map = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "expose") {
	  	  this.expose = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	}; // End setField
	
};
org.xml3d.defineClass(org.xml3d.classInfo.data, org.xml3d.classInfo.XML3DNestedDataContainerType);

/**
 * Object org.xml3d.classInfo.defs()
 * 
 * @augments org.xml3d.classInfo.XML3DBaseType
 * @constructor
 * @see org.xml3d.classInfo.XML3DBaseType
 */
 
org.xml3d.classInfo.defs = function() {
	org.xml3d.classInfo.XML3DBaseType.call(this);
};

org.xml3d.classInfo.defs.configure = function(node, context) {
	org.xml3d.classInfo.XML3DBaseType.configure(node, context);

	//node.children = [];


    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	}; // End setField
	
};
org.xml3d.defineClass(org.xml3d.classInfo.defs, org.xml3d.classInfo.XML3DBaseType);

/**
 * Object org.xml3d.classInfo.XML3DGraphType()
 * 
 * @augments org.xml3d.classInfo.XML3DReferenceableType
 * @constructor
 * @see org.xml3d.classInfo.XML3DReferenceableType
 */
 
org.xml3d.classInfo.XML3DGraphType = function() {
	org.xml3d.classInfo.XML3DReferenceableType.call(this);
};

org.xml3d.classInfo.XML3DGraphType.configure = function(node, context) {
	org.xml3d.classInfo.XML3DReferenceableType.configure(node, context);
	  node.__defineSetter__("visible", 
	      function (value) {
	        //org.xml3d.debug.logInfo("Setter: " + value);
	        var oldValue = this._visible;
	        if (typeof value == 'string')
	        	this._visible = org.xml3d.XML3DNodeFactory.createBooleanFromString(value);
	        else
	        	this._visible = value;
	        
	        if (this.notificationRequired())
            	this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "visible", oldValue, this._visible));
	      
	      }
	  );
	  node.__defineGetter__("visible", 
	      function (value) {
	        return this._visible;
	      }
	  );

	node._visible = org.xml3d.initBoolean(node.getAttribute("visible"), true);


    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onclick") {
	  	  this.onclick = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "ondblclick") {
	  	  this.ondblclick = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmousedown") {
	  	  this.onmousedown = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmouseup") {
	  	  this.onmouseup = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmouseover") {
	  	  this.onmouseover = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmousemove") {
	  	  this.onmousemove = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmouseout") {
	  	  this.onmouseout = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onkeypress") {
	  	  this.onkeypress = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onkeydown") {
	  	  this.onkeydown = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onkeyup") {
	  	  this.onkeyup = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "visible") {
	  	  this.visible = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	}; // End setField
	node.getWorldMatrix = org.xml3d.methods.XML3DGraphTypeGetWorldMatrix;
	
};
org.xml3d.defineClass(org.xml3d.classInfo.XML3DGraphType, org.xml3d.classInfo.XML3DReferenceableType);

/**
 * Object org.xml3d.classInfo.group()
 * 
 * @augments org.xml3d.classInfo.XML3DGraphType
 * @constructor
 * @see org.xml3d.classInfo.XML3DGraphType
 */
 
org.xml3d.classInfo.group = function() {
	org.xml3d.classInfo.XML3DGraphType.call(this);
};

org.xml3d.classInfo.group.configure = function(node, context) {
	org.xml3d.classInfo.XML3DGraphType.configure(node, context);

	node.transform = null;
	node.shader = null;
	//node.children = [];
	//node.defs = [];
	node.getTransform = function() {
		if (!this.transform && this.hasAttribute("transform"))
		{
		  this.transform = this.xml3ddocument.resolve(this.getAttribute("transform"));
		}
		return this.transform;
	};
	node.getShader = function() {
		if (!this.shader && this.hasAttribute("shader"))
		{
		  this.shader = this.xml3ddocument.resolve(this.getAttribute("shader"));
		}
		return this.shader;
	};


    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onclick") {
	  	  this.onclick = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "ondblclick") {
	  	  this.ondblclick = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmousedown") {
	  	  this.onmousedown = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmouseup") {
	  	  this.onmouseup = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmouseover") {
	  	  this.onmouseover = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmousemove") {
	  	  this.onmousemove = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmouseout") {
	  	  this.onmouseout = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onkeypress") {
	  	  this.onkeypress = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onkeydown") {
	  	  this.onkeydown = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onkeyup") {
	  	  this.onkeyup = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "visible") {
	  	  this.visible = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	}; // End setField
	node.getWorldMatrix = org.xml3d.methods.XML3DGraphTypeGetWorldMatrix;
	node.getLocalMatrix = org.xml3d.methods.groupGetLocalMatrix;
	
};
org.xml3d.defineClass(org.xml3d.classInfo.group, org.xml3d.classInfo.XML3DGraphType);

/**
 * Object org.xml3d.classInfo.XML3DGeometryType()
 * 
 * @augments org.xml3d.classInfo.XML3DGraphType
 * @constructor
 * @see org.xml3d.classInfo.XML3DGraphType
 */
 
org.xml3d.classInfo.XML3DGeometryType = function() {
	org.xml3d.classInfo.XML3DGraphType.call(this);
};

org.xml3d.classInfo.XML3DGeometryType.configure = function(node, context) {
	org.xml3d.classInfo.XML3DGraphType.configure(node, context);



    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onclick") {
	  	  this.onclick = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "ondblclick") {
	  	  this.ondblclick = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmousedown") {
	  	  this.onmousedown = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmouseup") {
	  	  this.onmouseup = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmouseover") {
	  	  this.onmouseover = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmousemove") {
	  	  this.onmousemove = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmouseout") {
	  	  this.onmouseout = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onkeypress") {
	  	  this.onkeypress = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onkeydown") {
	  	  this.onkeydown = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onkeyup") {
	  	  this.onkeyup = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "visible") {
	  	  this.visible = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	}; // End setField
	node.getWorldMatrix = org.xml3d.methods.XML3DGraphTypeGetWorldMatrix;
	
};
org.xml3d.defineClass(org.xml3d.classInfo.XML3DGeometryType, org.xml3d.classInfo.XML3DGraphType);

/**
 * Object org.xml3d.classInfo.mesh()
 * 
 * @augments org.xml3d.classInfo.XML3DGeometryType
 * @constructor
 * @see org.xml3d.classInfo.XML3DGeometryType
 */
 
org.xml3d.classInfo.mesh = function() {
	org.xml3d.classInfo.XML3DGeometryType.call(this);
};

org.xml3d.classInfo.mesh.configure = function(node, context) {
	org.xml3d.classInfo.XML3DGeometryType.configure(node, context);
	  node.__defineSetter__("type", 
	      function (value) {
	        //org.xml3d.debug.logInfo("Setter: " + value);
	        var oldValue = this._type;
	        if (typeof value == 'string')
	        	this._type = org.xml3d.XML3DNodeFactory.createEnumFromString(value);
	        else
	        	this._type = value;
	        
	        if (this.notificationRequired())
            	this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "type", oldValue, this._type));
	      
	      }
	  );
	  node.__defineGetter__("type", 
	      function (value) {
	        return this._type;
	      }
	  );

	node._type = org.xml3d.initEnum(node.getAttribute("type"), 0, org.xml3d.MeshTypes);
	//node.sources = [];
	//node.childContainers = [];
	node.src = null;
	node.getSrc = function() {
		if (!this.src && this.hasAttribute("src"))
		{
		  this.src = this.xml3ddocument.resolve(this.getAttribute("src"));
		}
		return this.src;
	};


    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onclick") {
	  	  this.onclick = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "ondblclick") {
	  	  this.ondblclick = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmousedown") {
	  	  this.onmousedown = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmouseup") {
	  	  this.onmouseup = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmouseover") {
	  	  this.onmouseover = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmousemove") {
	  	  this.onmousemove = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmouseout") {
	  	  this.onmouseout = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onkeypress") {
	  	  this.onkeypress = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onkeydown") {
	  	  this.onkeydown = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onkeyup") {
	  	  this.onkeyup = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "visible") {
	  	  this.visible = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "type") {
	  	  this.type = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	}; // End setField
	node.getWorldMatrix = org.xml3d.methods.XML3DGraphTypeGetWorldMatrix;
	
};
org.xml3d.defineClass(org.xml3d.classInfo.mesh, org.xml3d.classInfo.XML3DGeometryType);

/**
 * Object org.xml3d.classInfo.XML3DTransformProviderType()
 * 
 * @augments org.xml3d.classInfo.XML3DReferenceableType
 * @constructor
 * @see org.xml3d.classInfo.XML3DReferenceableType
 */
 
org.xml3d.classInfo.XML3DTransformProviderType = function() {
	org.xml3d.classInfo.XML3DReferenceableType.call(this);
};

org.xml3d.classInfo.XML3DTransformProviderType.configure = function(node, context) {
	org.xml3d.classInfo.XML3DReferenceableType.configure(node, context);



    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	}; // End setField
	
};
org.xml3d.defineClass(org.xml3d.classInfo.XML3DTransformProviderType, org.xml3d.classInfo.XML3DReferenceableType);

/**
 * Object org.xml3d.classInfo.transform()
 * 
 * @augments org.xml3d.classInfo.XML3DTransformProviderType
 * @constructor
 * @see org.xml3d.classInfo.XML3DTransformProviderType
 */
 
org.xml3d.classInfo.transform = function() {
	org.xml3d.classInfo.XML3DTransformProviderType.call(this);
};

org.xml3d.classInfo.transform.configure = function(node, context) {
	org.xml3d.classInfo.XML3DTransformProviderType.configure(node, context);
	  node.__defineSetter__("translation", 
	      function (value) {
	        //org.xml3d.debug.logInfo("Setter: " + value);
	        var oldValue = this._translation;
	        if (typeof value == 'string')
	        	this._translation = org.xml3d.XML3DNodeFactory.createXML3DVec3FromString(value);
	        else
	        	this._translation = value;
	        
	        if (this.notificationRequired())
            	this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "translation", oldValue, this._translation));
	      
	      }
	  );
	  node.__defineGetter__("translation", 
	      function (value) {
	        return this._translation;
	      }
	  );
	  node.__defineSetter__("scale", 
	      function (value) {
	        //org.xml3d.debug.logInfo("Setter: " + value);
	        var oldValue = this._scale;
	        if (typeof value == 'string')
	        	this._scale = org.xml3d.XML3DNodeFactory.createXML3DVec3FromString(value);
	        else
	        	this._scale = value;
	        
	        if (this.notificationRequired())
            	this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "scale", oldValue, this._scale));
	      
	      }
	  );
	  node.__defineGetter__("scale", 
	      function (value) {
	        return this._scale;
	      }
	  );
	  node.__defineSetter__("rotation", 
	      function (value) {
	        //org.xml3d.debug.logInfo("Setter: " + value);
	        var oldValue = this._rotation;
	        if (typeof value == 'string')
	        	this._rotation = org.xml3d.XML3DNodeFactory.createXML3DRotationFromString(value);
	        else
	        	this._rotation = value;
	        
	        if (this.notificationRequired())
            	this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "rotation", oldValue, this._rotation));
	      
	      }
	  );
	  node.__defineGetter__("rotation", 
	      function (value) {
	        return this._rotation;
	      }
	  );
	  node.__defineSetter__("center", 
	      function (value) {
	        //org.xml3d.debug.logInfo("Setter: " + value);
	        var oldValue = this._center;
	        if (typeof value == 'string')
	        	this._center = org.xml3d.XML3DNodeFactory.createXML3DVec3FromString(value);
	        else
	        	this._center = value;
	        
	        if (this.notificationRequired())
            	this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "center", oldValue, this._center));
	      
	      }
	  );
	  node.__defineGetter__("center", 
	      function (value) {
	        return this._center;
	      }
	  );
	  node.__defineSetter__("scaleOrientation", 
	      function (value) {
	        //org.xml3d.debug.logInfo("Setter: " + value);
	        var oldValue = this._scaleOrientation;
	        if (typeof value == 'string')
	        	this._scaleOrientation = org.xml3d.XML3DNodeFactory.createXML3DRotationFromString(value);
	        else
	        	this._scaleOrientation = value;
	        
	        if (this.notificationRequired())
            	this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "scaleOrientation", oldValue, this._scaleOrientation));
	      
	      }
	  );
	  node.__defineGetter__("scaleOrientation", 
	      function (value) {
	        return this._scaleOrientation;
	      }
	  );

	node._translation = org.xml3d.initXML3DVec3(node.getAttribute("translation"), 0, 0, 0);
	node._scale = org.xml3d.initXML3DVec3(node.getAttribute("scale"), 1, 1, 1);
	node._rotation = org.xml3d.initXML3DRotation(node.getAttribute("rotation"), 0, 0, 1, 0);
	node._center = org.xml3d.initXML3DVec3(node.getAttribute("center"), 0, 0, 0);
	node._scaleOrientation = org.xml3d.initXML3DRotation(node.getAttribute("scaleOrientation"), 0, 0, 1, 0);


    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "translation") {
	  	  this.translation = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "scale") {
	  	  this.scale = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "rotation") {
	  	  this.rotation = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "center") {
	  	  this.center = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "scaleOrientation") {
	  	  this.scaleOrientation = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	}; // End setField
	
};
org.xml3d.defineClass(org.xml3d.classInfo.transform, org.xml3d.classInfo.XML3DTransformProviderType);

/**
 * Object org.xml3d.classInfo.XML3DShaderProviderType()
 * 
 * @augments org.xml3d.classInfo.XML3DReferenceableType
 * @constructor
 * @see org.xml3d.classInfo.XML3DReferenceableType
 */
 
org.xml3d.classInfo.XML3DShaderProviderType = function() {
	org.xml3d.classInfo.XML3DReferenceableType.call(this);
};

org.xml3d.classInfo.XML3DShaderProviderType.configure = function(node, context) {
	org.xml3d.classInfo.XML3DReferenceableType.configure(node, context);

	node.script = null;
	//node.sources = [];
	//node.childContainers = [];
	node.src = null;
	node.getScript = function() {
		if (!this.script && this.hasAttribute("script"))
		{
		  this.script = this.xml3ddocument.resolve(this.getAttribute("script"));
		}
		return this.script;
	};
	node.getSrc = function() {
		if (!this.src && this.hasAttribute("src"))
		{
		  this.src = this.xml3ddocument.resolve(this.getAttribute("src"));
		}
		return this.src;
	};


    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	}; // End setField
	
};
org.xml3d.defineClass(org.xml3d.classInfo.XML3DShaderProviderType, org.xml3d.classInfo.XML3DReferenceableType);

/**
 * Object org.xml3d.classInfo.XML3DSurfaceShaderProviderType()
 * 
 * @augments org.xml3d.classInfo.XML3DShaderProviderType
 * @constructor
 * @see org.xml3d.classInfo.XML3DShaderProviderType
 */
 
org.xml3d.classInfo.XML3DSurfaceShaderProviderType = function() {
	org.xml3d.classInfo.XML3DShaderProviderType.call(this);
};

org.xml3d.classInfo.XML3DSurfaceShaderProviderType.configure = function(node, context) {
	org.xml3d.classInfo.XML3DShaderProviderType.configure(node, context);



    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	}; // End setField
	
};
org.xml3d.defineClass(org.xml3d.classInfo.XML3DSurfaceShaderProviderType, org.xml3d.classInfo.XML3DShaderProviderType);

/**
 * Object org.xml3d.classInfo.shader()
 * 
 * @augments org.xml3d.classInfo.XML3DSurfaceShaderProviderType
 * @constructor
 * @see org.xml3d.classInfo.XML3DSurfaceShaderProviderType
 */
 
org.xml3d.classInfo.shader = function() {
	org.xml3d.classInfo.XML3DSurfaceShaderProviderType.call(this);
};

org.xml3d.classInfo.shader.configure = function(node, context) {
	org.xml3d.classInfo.XML3DSurfaceShaderProviderType.configure(node, context);



    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	}; // End setField
	
};
org.xml3d.defineClass(org.xml3d.classInfo.shader, org.xml3d.classInfo.XML3DSurfaceShaderProviderType);

/**
 * Object org.xml3d.classInfo.light()
 * 
 * @augments org.xml3d.classInfo.XML3DGraphType
 * @constructor
 * @see org.xml3d.classInfo.XML3DGraphType
 */
 
org.xml3d.classInfo.light = function() {
	org.xml3d.classInfo.XML3DGraphType.call(this);
};

org.xml3d.classInfo.light.configure = function(node, context) {
	org.xml3d.classInfo.XML3DGraphType.configure(node, context);
	  node.__defineSetter__("global", 
	      function (value) {
	        //org.xml3d.debug.logInfo("Setter: " + value);
	        var oldValue = this._global;
	        if (typeof value == 'string')
	        	this._global = org.xml3d.XML3DNodeFactory.createBooleanFromString(value);
	        else
	        	this._global = value;
	        
	        if (this.notificationRequired())
            	this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "global", oldValue, this._global));
	      
	      }
	  );
	  node.__defineGetter__("global", 
	      function (value) {
	        return this._global;
	      }
	  );
	  node.__defineSetter__("intensity", 
	      function (value) {
	        //org.xml3d.debug.logInfo("Setter: " + value);
	        var oldValue = this._intensity;
	        if (typeof value == 'string')
	        	this._intensity = org.xml3d.XML3DNodeFactory.createFloatFromString(value);
	        else
	        	this._intensity = value;
	        
	        if (this.notificationRequired())
            	this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "intensity", oldValue, this._intensity));
	      
	      }
	  );
	  node.__defineGetter__("intensity", 
	      function (value) {
	        return this._intensity;
	      }
	  );

	node._global = org.xml3d.initBoolean(node.getAttribute("global"), false);
	node._intensity = org.xml3d.initFloat(node.getAttribute("intensity"), 1);
	node.shader = null;
	node.getShader = function() {
		if (!this.shader && this.hasAttribute("shader"))
		{
		  this.shader = this.xml3ddocument.resolve(this.getAttribute("shader"));
		}
		return this.shader;
	};


    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onclick") {
	  	  this.onclick = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "ondblclick") {
	  	  this.ondblclick = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmousedown") {
	  	  this.onmousedown = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmouseup") {
	  	  this.onmouseup = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmouseover") {
	  	  this.onmouseover = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmousemove") {
	  	  this.onmousemove = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmouseout") {
	  	  this.onmouseout = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onkeypress") {
	  	  this.onkeypress = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onkeydown") {
	  	  this.onkeydown = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onkeyup") {
	  	  this.onkeyup = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "visible") {
	  	  this.visible = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "global") {
	  	  this.global = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "intensity") {
	  	  this.intensity = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	}; // End setField
	node.getWorldMatrix = org.xml3d.methods.XML3DGraphTypeGetWorldMatrix;
	
};
org.xml3d.defineClass(org.xml3d.classInfo.light, org.xml3d.classInfo.XML3DGraphType);

/**
 * Object org.xml3d.classInfo.XML3DLightShaderProviderType()
 * 
 * @augments org.xml3d.classInfo.XML3DShaderProviderType
 * @constructor
 * @see org.xml3d.classInfo.XML3DShaderProviderType
 */
 
org.xml3d.classInfo.XML3DLightShaderProviderType = function() {
	org.xml3d.classInfo.XML3DShaderProviderType.call(this);
};

org.xml3d.classInfo.XML3DLightShaderProviderType.configure = function(node, context) {
	org.xml3d.classInfo.XML3DShaderProviderType.configure(node, context);



    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	}; // End setField
	
};
org.xml3d.defineClass(org.xml3d.classInfo.XML3DLightShaderProviderType, org.xml3d.classInfo.XML3DShaderProviderType);

/**
 * Object org.xml3d.classInfo.lightshader()
 * 
 * @augments org.xml3d.classInfo.XML3DLightShaderProviderType
 * @constructor
 * @see org.xml3d.classInfo.XML3DLightShaderProviderType
 */
 
org.xml3d.classInfo.lightshader = function() {
	org.xml3d.classInfo.XML3DLightShaderProviderType.call(this);
};

org.xml3d.classInfo.lightshader.configure = function(node, context) {
	org.xml3d.classInfo.XML3DLightShaderProviderType.configure(node, context);



    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	}; // End setField
	
};
org.xml3d.defineClass(org.xml3d.classInfo.lightshader, org.xml3d.classInfo.XML3DLightShaderProviderType);

/**
 * Object org.xml3d.classInfo.script()
 * 
 * @augments org.xml3d.classInfo.XML3DReferenceableType
 * @constructor
 * @see org.xml3d.classInfo.XML3DReferenceableType
 */
 
org.xml3d.classInfo.script = function() {
	org.xml3d.classInfo.XML3DReferenceableType.call(this);
};

org.xml3d.classInfo.script.configure = function(node, context) {
	org.xml3d.classInfo.XML3DReferenceableType.configure(node, context);
	// TODO: Setter for mixed value
	node.setValue = function(e) {
		var oldValue = this.value;
		this.value = e.newValue;
		
		if (this.parentNode.notificationRequired())
        	this.parentNode.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "value", oldValue, this.value));
	};
	  node.__defineSetter__("src", 
	      function (value) {
	        //org.xml3d.debug.logInfo("Setter: " + value);
	        var oldValue = this._src;
	        if (typeof value == 'string')
	        	this._src = org.xml3d.XML3DNodeFactory.createAnyURIFromString(value);
	        else
	        	this._src = value;
	        
	        if (this.notificationRequired())
            	this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "src", oldValue, this._src));
	      
	      }
	  );
	  node.__defineGetter__("src", 
	      function (value) {
	        return this._src;
	      }
	  );
	  node.__defineSetter__("type", 
	      function (value) {
	        //org.xml3d.debug.logInfo("Setter: " + value);
	        var oldValue = this._type;
	        if (typeof value == 'string')
	        	this._type = org.xml3d.XML3DNodeFactory.createStringFromString(value);
	        else
	        	this._type = value;
	        
	        if (this.notificationRequired())
            	this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "type", oldValue, this._type));
	      
	      }
	  );
	  node.__defineGetter__("type", 
	      function (value) {
	        return this._type;
	      }
	  );

	node.value = org.xml3d.initString(node.getTextContent(), null);
	node._src = org.xml3d.initAnyURI(node.getAttribute("src"), "");
	node._type = org.xml3d.initString(node.getAttribute("type"), "");


    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	// TODO: Mixed value change
	  if (attrName == "src") {
	  	  this.src = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "type") {
	  	  this.type = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	}; // End setField
	
};
org.xml3d.defineClass(org.xml3d.classInfo.script, org.xml3d.classInfo.XML3DReferenceableType);

/**
 * Object org.xml3d.classInfo.XML3DDataSourceType()
 * 
 * @augments org.xml3d.classInfo.XML3DBaseType
 * @constructor
 * @see org.xml3d.classInfo.XML3DBaseType
 */
 
org.xml3d.classInfo.XML3DDataSourceType = function() {
	org.xml3d.classInfo.XML3DBaseType.call(this);
};

org.xml3d.classInfo.XML3DDataSourceType.configure = function(node, context) {
	org.xml3d.classInfo.XML3DBaseType.configure(node, context);
	  node.__defineSetter__("name", 
	      function (value) {
	        //org.xml3d.debug.logInfo("Setter: " + value);
	        var oldValue = this._name;
	        if (typeof value == 'string')
	        	this._name = org.xml3d.XML3DNodeFactory.createStringFromString(value);
	        else
	        	this._name = value;
	        
	        if (this.notificationRequired())
            	this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "name", oldValue, this._name));
	      
	      }
	  );
	  node.__defineGetter__("name", 
	      function (value) {
	        return this._name;
	      }
	  );

	node._name = org.xml3d.initString(node.getAttribute("name"), "");


    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "name") {
	  	  this.name = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	}; // End setField
	
};
org.xml3d.defineClass(org.xml3d.classInfo.XML3DDataSourceType, org.xml3d.classInfo.XML3DBaseType);

/**
 * Object org.xml3d.classInfo.float()
 * 
 * @augments org.xml3d.classInfo.XML3DDataSourceType
 * @constructor
 * @see org.xml3d.classInfo.XML3DDataSourceType
 */
 
org.xml3d.classInfo.float = function() {
	org.xml3d.classInfo.XML3DDataSourceType.call(this);
};

org.xml3d.classInfo.float.configure = function(node, context) {
	org.xml3d.classInfo.XML3DDataSourceType.configure(node, context);
	// TODO: Setter for mixed value
	node.setValue = function(e) {
		var oldValue = this.value;
		this.value = e.newValue;
		
		if (this.parentNode.notificationRequired())
        	this.parentNode.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "value", oldValue, this.value));
	};

	node.value = org.xml3d.initFloatArray(node.getTextContent(), null);


    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "name") {
	  	  this.name = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	// TODO: Mixed value change
	}; // End setField
	
};
org.xml3d.defineClass(org.xml3d.classInfo.float, org.xml3d.classInfo.XML3DDataSourceType);

/**
 * Object org.xml3d.classInfo.float2()
 * 
 * @augments org.xml3d.classInfo.XML3DDataSourceType
 * @constructor
 * @see org.xml3d.classInfo.XML3DDataSourceType
 */
 
org.xml3d.classInfo.float2 = function() {
	org.xml3d.classInfo.XML3DDataSourceType.call(this);
};

org.xml3d.classInfo.float2.configure = function(node, context) {
	org.xml3d.classInfo.XML3DDataSourceType.configure(node, context);
	// TODO: Setter for mixed value
	node.setValue = function(e) {
		var oldValue = this.value;
		this.value = e.newValue;
		
		if (this.parentNode.notificationRequired())
        	this.parentNode.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "value", oldValue, this.value));
	};

	node.value = org.xml3d.initFloat2Array(node.getTextContent(), null);


    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "name") {
	  	  this.name = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	// TODO: Mixed value change
	}; // End setField
	
};
org.xml3d.defineClass(org.xml3d.classInfo.float2, org.xml3d.classInfo.XML3DDataSourceType);

/**
 * Object org.xml3d.classInfo.float3()
 * 
 * @augments org.xml3d.classInfo.XML3DDataSourceType
 * @constructor
 * @see org.xml3d.classInfo.XML3DDataSourceType
 */
 
org.xml3d.classInfo.float3 = function() {
	org.xml3d.classInfo.XML3DDataSourceType.call(this);
};

org.xml3d.classInfo.float3.configure = function(node, context) {
	org.xml3d.classInfo.XML3DDataSourceType.configure(node, context);
	// TODO: Setter for mixed value
	node.setValue = function(e) {
		var oldValue = this.value;
		this.value = e.newValue;
		
		if (this.parentNode.notificationRequired())
        	this.parentNode.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "value", oldValue, this.value));
	};

	node.value = org.xml3d.initFloat3Array(node.getTextContent(), null);


    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "name") {
	  	  this.name = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	// TODO: Mixed value change
	}; // End setField
	
};
org.xml3d.defineClass(org.xml3d.classInfo.float3, org.xml3d.classInfo.XML3DDataSourceType);

/**
 * Object org.xml3d.classInfo.float4()
 * 
 * @augments org.xml3d.classInfo.XML3DDataSourceType
 * @constructor
 * @see org.xml3d.classInfo.XML3DDataSourceType
 */
 
org.xml3d.classInfo.float4 = function() {
	org.xml3d.classInfo.XML3DDataSourceType.call(this);
};

org.xml3d.classInfo.float4.configure = function(node, context) {
	org.xml3d.classInfo.XML3DDataSourceType.configure(node, context);
	// TODO: Setter for mixed value
	node.setValue = function(e) {
		var oldValue = this.value;
		this.value = e.newValue;
		
		if (this.parentNode.notificationRequired())
        	this.parentNode.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "value", oldValue, this.value));
	};

	node.value = org.xml3d.initFloat4Array(node.getTextContent(), null);


    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "name") {
	  	  this.name = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	// TODO: Mixed value change
	}; // End setField
	
};
org.xml3d.defineClass(org.xml3d.classInfo.float4, org.xml3d.classInfo.XML3DDataSourceType);

/**
 * Object org.xml3d.classInfo.float4x4()
 * 
 * @augments org.xml3d.classInfo.XML3DDataSourceType
 * @constructor
 * @see org.xml3d.classInfo.XML3DDataSourceType
 */
 
org.xml3d.classInfo.float4x4 = function() {
	org.xml3d.classInfo.XML3DDataSourceType.call(this);
};

org.xml3d.classInfo.float4x4.configure = function(node, context) {
	org.xml3d.classInfo.XML3DDataSourceType.configure(node, context);
	// TODO: Setter for mixed value
	node.setValue = function(e) {
		var oldValue = this.value;
		this.value = e.newValue;
		
		if (this.parentNode.notificationRequired())
        	this.parentNode.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "value", oldValue, this.value));
	};

	node.value = org.xml3d.initFloat4x4Array(node.getTextContent(), []);


    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "name") {
	  	  this.name = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	// TODO: Mixed value change
	}; // End setField
	
};
org.xml3d.defineClass(org.xml3d.classInfo.float4x4, org.xml3d.classInfo.XML3DDataSourceType);

/**
 * Object org.xml3d.classInfo.int()
 * 
 * @augments org.xml3d.classInfo.XML3DDataSourceType
 * @constructor
 * @see org.xml3d.classInfo.XML3DDataSourceType
 */
 
org.xml3d.classInfo.int = function() {
	org.xml3d.classInfo.XML3DDataSourceType.call(this);
};

org.xml3d.classInfo.int.configure = function(node, context) {
	org.xml3d.classInfo.XML3DDataSourceType.configure(node, context);
	// TODO: Setter for mixed value
	node.setValue = function(e) {
		var oldValue = this.value;
		this.value = e.newValue;
		
		if (this.parentNode.notificationRequired())
        	this.parentNode.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "value", oldValue, this.value));
	};

	node.value = org.xml3d.initIntArray(node.getTextContent(), null);


    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "name") {
	  	  this.name = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	// TODO: Mixed value change
	}; // End setField
	
};
org.xml3d.defineClass(org.xml3d.classInfo.int, org.xml3d.classInfo.XML3DDataSourceType);

/**
 * Object org.xml3d.classInfo.bool()
 * 
 * @augments org.xml3d.classInfo.XML3DDataSourceType
 * @constructor
 * @see org.xml3d.classInfo.XML3DDataSourceType
 */
 
org.xml3d.classInfo.bool = function() {
	org.xml3d.classInfo.XML3DDataSourceType.call(this);
};

org.xml3d.classInfo.bool.configure = function(node, context) {
	org.xml3d.classInfo.XML3DDataSourceType.configure(node, context);
	// TODO: Setter for mixed value
	node.setValue = function(e) {
		var oldValue = this.value;
		this.value = e.newValue;
		
		if (this.parentNode.notificationRequired())
        	this.parentNode.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "value", oldValue, this.value));
	};

	node.value = org.xml3d.initBoolArray(node.getTextContent(), null);


    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "name") {
	  	  this.name = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	// TODO: Mixed value change
	}; // End setField
	
};
org.xml3d.defineClass(org.xml3d.classInfo.bool, org.xml3d.classInfo.XML3DDataSourceType);

/**
 * Object org.xml3d.classInfo.texture()
 * 
 * @augments org.xml3d.classInfo.XML3DDataSourceType
 * @constructor
 * @see org.xml3d.classInfo.XML3DDataSourceType
 */
 
org.xml3d.classInfo.texture = function() {
	org.xml3d.classInfo.XML3DDataSourceType.call(this);
};

org.xml3d.classInfo.texture.configure = function(node, context) {
	org.xml3d.classInfo.XML3DDataSourceType.configure(node, context);
	  node.__defineSetter__("type", 
	      function (value) {
	        //org.xml3d.debug.logInfo("Setter: " + value);
	        var oldValue = this._type;
	        if (typeof value == 'string')
	        	this._type = org.xml3d.XML3DNodeFactory.createEnumFromString(value);
	        else
	        	this._type = value;
	        
	        if (this.notificationRequired())
            	this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "type", oldValue, this._type));
	      
	      }
	  );
	  node.__defineGetter__("type", 
	      function (value) {
	        return this._type;
	      }
	  );
	  node.__defineSetter__("filterMin", 
	      function (value) {
	        //org.xml3d.debug.logInfo("Setter: " + value);
	        var oldValue = this._filterMin;
	        if (typeof value == 'string')
	        	this._filterMin = org.xml3d.XML3DNodeFactory.createEnumFromString(value);
	        else
	        	this._filterMin = value;
	        
	        if (this.notificationRequired())
            	this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "filterMin", oldValue, this._filterMin));
	      
	      }
	  );
	  node.__defineGetter__("filterMin", 
	      function (value) {
	        return this._filterMin;
	      }
	  );
	  node.__defineSetter__("filterMag", 
	      function (value) {
	        //org.xml3d.debug.logInfo("Setter: " + value);
	        var oldValue = this._filterMag;
	        if (typeof value == 'string')
	        	this._filterMag = org.xml3d.XML3DNodeFactory.createEnumFromString(value);
	        else
	        	this._filterMag = value;
	        
	        if (this.notificationRequired())
            	this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "filterMag", oldValue, this._filterMag));
	      
	      }
	  );
	  node.__defineGetter__("filterMag", 
	      function (value) {
	        return this._filterMag;
	      }
	  );
	  node.__defineSetter__("filterMip", 
	      function (value) {
	        //org.xml3d.debug.logInfo("Setter: " + value);
	        var oldValue = this._filterMip;
	        if (typeof value == 'string')
	        	this._filterMip = org.xml3d.XML3DNodeFactory.createEnumFromString(value);
	        else
	        	this._filterMip = value;
	        
	        if (this.notificationRequired())
            	this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "filterMip", oldValue, this._filterMip));
	      
	      }
	  );
	  node.__defineGetter__("filterMip", 
	      function (value) {
	        return this._filterMip;
	      }
	  );
	  node.__defineSetter__("wrapS", 
	      function (value) {
	        //org.xml3d.debug.logInfo("Setter: " + value);
	        var oldValue = this._wrapS;
	        if (typeof value == 'string')
	        	this._wrapS = org.xml3d.XML3DNodeFactory.createEnumFromString(value);
	        else
	        	this._wrapS = value;
	        
	        if (this.notificationRequired())
            	this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "wrapS", oldValue, this._wrapS));
	      
	      }
	  );
	  node.__defineGetter__("wrapS", 
	      function (value) {
	        return this._wrapS;
	      }
	  );
	  node.__defineSetter__("wrapT", 
	      function (value) {
	        //org.xml3d.debug.logInfo("Setter: " + value);
	        var oldValue = this._wrapT;
	        if (typeof value == 'string')
	        	this._wrapT = org.xml3d.XML3DNodeFactory.createEnumFromString(value);
	        else
	        	this._wrapT = value;
	        
	        if (this.notificationRequired())
            	this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "wrapT", oldValue, this._wrapT));
	      
	      }
	  );
	  node.__defineGetter__("wrapT", 
	      function (value) {
	        return this._wrapT;
	      }
	  );
	  node.__defineSetter__("wrapU", 
	      function (value) {
	        //org.xml3d.debug.logInfo("Setter: " + value);
	        var oldValue = this._wrapU;
	        if (typeof value == 'string')
	        	this._wrapU = org.xml3d.XML3DNodeFactory.createEnumFromString(value);
	        else
	        	this._wrapU = value;
	        
	        if (this.notificationRequired())
            	this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "wrapU", oldValue, this._wrapU));
	      
	      }
	  );
	  node.__defineGetter__("wrapU", 
	      function (value) {
	        return this._wrapU;
	      }
	  );
	  node.__defineSetter__("borderColor", 
	      function (value) {
	        //org.xml3d.debug.logInfo("Setter: " + value);
	        var oldValue = this._borderColor;
	        if (typeof value == 'string')
	        	this._borderColor = org.xml3d.XML3DNodeFactory.createStringFromString(value);
	        else
	        	this._borderColor = value;
	        
	        if (this.notificationRequired())
            	this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "borderColor", oldValue, this._borderColor));
	      
	      }
	  );
	  node.__defineGetter__("borderColor", 
	      function (value) {
	        return this._borderColor;
	      }
	  );

	node._type = org.xml3d.initEnum(node.getAttribute("type"), 0, org.xml3d.TextureTypes);
	node._filterMin = org.xml3d.initEnum(node.getAttribute("filterMin"), 2, org.xml3d.FilterTypes);
	node._filterMag = org.xml3d.initEnum(node.getAttribute("filterMag"), 2, org.xml3d.FilterTypes);
	node._filterMip = org.xml3d.initEnum(node.getAttribute("filterMip"), 1, org.xml3d.FilterTypes);
	node._wrapS = org.xml3d.initEnum(node.getAttribute("wrapS"), 1, org.xml3d.WrapTypes);
	node._wrapT = org.xml3d.initEnum(node.getAttribute("wrapT"), 1, org.xml3d.WrapTypes);
	node._wrapU = org.xml3d.initEnum(node.getAttribute("wrapU"), 1, org.xml3d.WrapTypes);
	node._borderColor = org.xml3d.initString(node.getAttribute("borderColor"), "");
	node.imageData = null;


    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "name") {
	  	  this.name = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "type") {
	  	  this.type = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "filterMin") {
	  	  this.filterMin = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "filterMag") {
	  	  this.filterMag = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "filterMip") {
	  	  this.filterMip = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "wrapS") {
	  	  this.wrapS = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "wrapT") {
	  	  this.wrapT = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "wrapU") {
	  	  this.wrapU = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "borderColor") {
	  	  this.borderColor = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	}; // End setField
	
};
org.xml3d.defineClass(org.xml3d.classInfo.texture, org.xml3d.classInfo.XML3DDataSourceType);

/**
 * Object org.xml3d.classInfo.XML3DImageDataProviderType()
 * 
 * @augments org.xml3d.classInfo.XML3DReferenceableType
 * @constructor
 * @see org.xml3d.classInfo.XML3DReferenceableType
 */
 
org.xml3d.classInfo.XML3DImageDataProviderType = function() {
	org.xml3d.classInfo.XML3DReferenceableType.call(this);
};

org.xml3d.classInfo.XML3DImageDataProviderType.configure = function(node, context) {
	org.xml3d.classInfo.XML3DReferenceableType.configure(node, context);



    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	}; // End setField
	
};
org.xml3d.defineClass(org.xml3d.classInfo.XML3DImageDataProviderType, org.xml3d.classInfo.XML3DReferenceableType);

/**
 * Object org.xml3d.classInfo.img()
 * 
 * @augments org.xml3d.classInfo.XML3DImageDataProviderType
 * @constructor
 * @see org.xml3d.classInfo.XML3DImageDataProviderType
 */
 
org.xml3d.classInfo.img = function() {
	org.xml3d.classInfo.XML3DImageDataProviderType.call(this);
};

org.xml3d.classInfo.img.configure = function(node, context) {
	org.xml3d.classInfo.XML3DImageDataProviderType.configure(node, context);
	  node.__defineSetter__("src", 
	      function (value) {
	        //org.xml3d.debug.logInfo("Setter: " + value);
	        var oldValue = this._src;
	        if (typeof value == 'string')
	        	this._src = org.xml3d.XML3DNodeFactory.createAnyURIFromString(value);
	        else
	        	this._src = value;
	        
	        if (this.notificationRequired())
            	this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "src", oldValue, this._src));
	      
	      }
	  );
	  node.__defineGetter__("src", 
	      function (value) {
	        return this._src;
	      }
	  );

	node._src = org.xml3d.initAnyURI(node.getAttribute("src"), "");


    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "src") {
	  	  this.src = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	}; // End setField
	
};
org.xml3d.defineClass(org.xml3d.classInfo.img, org.xml3d.classInfo.XML3DImageDataProviderType);

/**
 * Object org.xml3d.classInfo.view()
 * 
 * @augments org.xml3d.classInfo.XML3DGraphType
 * @constructor
 * @see org.xml3d.classInfo.XML3DGraphType
 */
 
org.xml3d.classInfo.view = function() {
	org.xml3d.classInfo.XML3DGraphType.call(this);
};

org.xml3d.classInfo.view.configure = function(node, context) {
	org.xml3d.classInfo.XML3DGraphType.configure(node, context);
	  node.__defineSetter__("position", 
	      function (value) {
	        //org.xml3d.debug.logInfo("Setter: " + value);
	        var oldValue = this._position;
	        if (typeof value == 'string')
	        	this._position = org.xml3d.XML3DNodeFactory.createXML3DVec3FromString(value);
	        else
	        	this._position = value;
	        
	        if (this.notificationRequired())
            	this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "position", oldValue, this._position));
	      
	      }
	  );
	  node.__defineGetter__("position", 
	      function (value) {
	        return this._position;
	      }
	  );
	  node.__defineSetter__("orientation", 
	      function (value) {
	        //org.xml3d.debug.logInfo("Setter: " + value);
	        var oldValue = this._orientation;
	        if (typeof value == 'string')
	        	this._orientation = org.xml3d.XML3DNodeFactory.createXML3DRotationFromString(value);
	        else
	        	this._orientation = value;
	        
	        if (this.notificationRequired())
            	this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "orientation", oldValue, this._orientation));
	      
	      }
	  );
	  node.__defineGetter__("orientation", 
	      function (value) {
	        return this._orientation;
	      }
	  );
	  node.__defineSetter__("fieldOfView", 
	      function (value) {
	        //org.xml3d.debug.logInfo("Setter: " + value);
	        var oldValue = this._fieldOfView;
	        if (typeof value == 'string')
	        	this._fieldOfView = org.xml3d.XML3DNodeFactory.createFloatFromString(value);
	        else
	        	this._fieldOfView = value;
	        
	        if (this.notificationRequired())
            	this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "fieldOfView", oldValue, this._fieldOfView));
	      
	      }
	  );
	  node.__defineGetter__("fieldOfView", 
	      function (value) {
	        return this._fieldOfView;
	      }
	  );

	node._position = org.xml3d.initXML3DVec3(node.getAttribute("position"), 0, 0, 0);
	node._orientation = org.xml3d.initXML3DRotation(node.getAttribute("orientation"), 0, 0, 1, 0);
	node._fieldOfView = org.xml3d.initFloat(node.getAttribute("fieldOfView"), 0.785398);


    // Node::setField
	node.setField = function(event)	{
	  var attrName = event.attrName;
	  if (attrName == "id") {
	  	  this.id = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "class") {
	  	  this.class = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "style") {
	  	  this.style = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onclick") {
	  	  this.onclick = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "ondblclick") {
	  	  this.ondblclick = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmousedown") {
	  	  this.onmousedown = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmouseup") {
	  	  this.onmouseup = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmouseover") {
	  	  this.onmouseover = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmousemove") {
	  	  this.onmousemove = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onmouseout") {
	  	  this.onmouseout = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onkeypress") {
	  	  this.onkeypress = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onkeydown") {
	  	  this.onkeydown = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "onkeyup") {
	  	  this.onkeyup = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "visible") {
	  	  this.visible = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "position") {
	  	  this.position = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "orientation") {
	  	  this.orientation = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	  if (attrName == "fieldOfView") {
	  	  this.fieldOfView = event.newValue;
		  return org.xml3d.event.HANDLED;
	  }
	}; // End setField
	node.getWorldMatrix = org.xml3d.methods.XML3DGraphTypeGetWorldMatrix;
	node.setDirection = org.xml3d.methods.viewSetDirection;
	node.setUpVector = org.xml3d.methods.viewSetUpVector;
	node.lookAt = org.xml3d.methods.viewLookAt;
	node.getDirection = org.xml3d.methods.viewGetDirection;
	node.getUpVector = org.xml3d.methods.viewGetUpVector;
	node.getViewMatrix = org.xml3d.methods.viewGetViewMatrix;
	
};
org.xml3d.defineClass(org.xml3d.classInfo.view, org.xml3d.classInfo.XML3DGraphType);


org.xml3d.methods.xml3dCreateXML3DVec3 = function() {
	return new XML3DVec3();
};

org.xml3d.methods.xml3dCreateXML3DMatrix = function () {
	return new XML3DMatrix();
};

org.xml3d.methods.xml3dCreateXML3DRotation = function() {
	return new XML3DRotation();
};

org.xml3d.methods.viewGetDirection = function() {
	return this.orientation.rotateVec3(new XML3DVec3(0,0,-1));
};

org.xml3d.methods.viewSetPosition = function(pos) {
	this.position = pos;
};

org.xml3d.methods.viewSetDirection = function(quat) {
	this.orientation = quat;
};

org.xml3d.methods.viewGetUpVector = function() {
	return this.orientation.rotateVec3(new XML3DVec3(0, 1, 0));
};

org.xml3d.methods.viewLookAt = function(vec) {
	// TODO: write lookat function
};

