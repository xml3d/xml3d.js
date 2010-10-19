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

org.xml3d.xml3dNS = 'http://www.xml3d.org/2009/xml3d';
org.xml3d.xhtmlNS = 'http://www.w3.org/1999/xhtml';
org.xml3d.webglNS = 'http://www.xml3d.org/2009/xml3d/webgl';
org.xml3d._xml3d = document.createElementNS(org.xml3d.xml3dNS, "xml3d");
org.xml3d._native = !!org.xml3d._xml3d.style; 
org.xml3d._rendererFound = false;

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

document.nativeGetElementById = document.getElementById;
document.getElementById = function(id) {
	var elem = document.nativeGetElementById(id);
	if(elem)
	{
		return elem;
	} else {
		return this.evaluate('//*[@id="' + id + '"]', this, function() {
			return org.xml3d.xml3dNS;
		}, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
	}
};

(function() {
	var onload = function() {
		
		
		
		// Find all the XML3D tags in the document
		var xml3ds = document.getElementsByTagNameNS(org.xml3d.xml3dNS, 'xml3d');
		xml3ds = Array.map(xml3ds, function(n) { return n; });
		
		var activateLog = false;
		for (var i = 0; i < xml3ds.length; i++) {
			var showLog = xml3ds[i].getAttributeNS(org.xml3d.webglNS, "showLog");
			if (showLog !== null && showLog == "true") {
				activateLog = true;
				break;
			}
		}
		if (activateLog) {
			org.xml3d.debug.activate();
		}
		if(org.xml3d.debug)
			org.xml3d.debug.logInfo("Found " + xml3ds.length + " xml3d nodes...");
		
		if (xml3ds.length) {
			org.xml3d._xml3d = xml3ds[0];
			if (org.xml3d._native) {
				if(org.xml3d.debug)
					org.xml3d.debug.logInfo("Using native implementation.");
				org.xml3d._rendererFound = true;
				return;
			}
		}
		
		if (!org.xml3d.webgl) {
			if(org.xml3d.debug)
				org.xml3d.debug.logInfo("No WebGL renderer included.");
			return;
		}
		
		if (!org.xml3d.webgl.supported()) 
		{
			if(org.xml3d.debug)
			{
				org.xml3d.debug.logWarning("Could not initialise WebGL, sorry :-(");
			}
			
			for(var i = 0; i < xml3ds.length; i++) 
			{
				// Place xml3dElement inside an invisble div
				var hideDiv      = document.createElementNS(org.xml3d.xhtmlNS, 'div');
				var xml3dElement = xml3ds[i];
				
				xml3dElement.parentNode.insertBefore(hideDiv, xml3dElement);
				hideDiv.appendChild(xml3dElement);
				hideDiv.style.display = "none";
	
				var infoDiv = document.createElementNS(org.xml3d.xhtmlNS, 'div');
				infoDiv.setAttribute("class", xml3dElement.getAttribute("class"));
				infoDiv.setAttribute("style", xml3dElement.getAttribute("style"));
				infoDiv.style.border = "2px solid red";
				infoDiv.style.color  = "red";
				infoDiv.style.padding = "10px";
				
				
				var width = xml3dElement.getAttribute("width");
				if( width !== null) 
				{
					infoDiv.style.width = width;
				} 
				
				var height = xml3dElement.getAttribute("height");
				if( height !== null) 
				{
					infoDiv.style.height = height;
				} 
	
				var hElement = document.createElement("h3");
				var hTxt     = document.createTextNode("Your browser doesn't support XML3D.");
				hElement.appendChild (hTxt);
				
				var pElement = document.createElement("p");
				var pTxt     = document.createTextNode(
						"Please visit http://xml3d.org/ to get a native XML3D implementation or " +
						"http://get.webgl.org/ to get information about WebGL supporting browsers.");
				pElement.appendChild (pTxt);
				
				infoDiv.appendChild (hElement);
				infoDiv.appendChild (pElement);
				
				hideDiv.parentNode.insertBefore(infoDiv, hideDiv);
			}
			
			return;
		}
		
		
		org.xml3d.data.configure(xml3ds);
		org.xml3d.webgl.configure(xml3ds);
		/*for (i = 0; i < xml3ds.length; i++) {
		
			var x3dcanvas = org.xml3d.document.createCanvas(xml3ds[i]);
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
		}*/
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
		if (org.xml3d.document)
			org.xml3d.document.onunload();
	};
	window.addEventListener('load', onload, false);
	window.addEventListener('unload', onunload, false);
	window.addEventListener('reload', onunload, false);

})();

//Some helper function. We don't have global constructors for 
//all implementations
createXML3DVec3 = function() {
	if (org.xml3d._xml3d === undefined) {
		return new XML3DVec3(); 
	}
	return org.xml3d._xml3d.createXML3DVec3();
};

createXML3DRotation = function() {
	if (org.xml3d._xml3d === undefined) {
		return new XML3DRotation(); 
	}
	return org.xml3d._xml3d.createXML3DRotation();
};

