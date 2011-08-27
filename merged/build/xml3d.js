// This file is a merged collection of several JavaScript Libraries (v0.4.6)
// to run an XML3D system (www.xml3d.org)
// Please see informations below for individual copyrights and licenses  

/*************************************************************************/
/*                                                                       */
/*  xml3d.js                                                             */
/*  Declarative 3D in HTML                                               */
/*                                                                       */
/*  Copyright (C) 2010                                                   */
/*  DFKI - German Research Center for Artificial Intelligence            */
/*                                                                       */
/*  This file is part of xml3d.js                                        */
/*                                                                       */
/*  xml3d.js is free software; you can redistribute it and/or modify     */
/*  under the terms of the GNU General Public License as                 */
/*  published by the Free Software Foundation; either version 2 of       */
/*  the License, or (at your option) any later version.                  */
/*                                                                       */
/*  xml3d.js is distributed in the hope that it will be useful, but      */
/*  WITHOUT ANY WARRANTY; without even the implied warranty of           */
/*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.                 */
/*  See the GNU General Public License                                   */
/*  (http://www.fsf.org/licensing/licenses/gpl.html) for more details.   */
/*                                                                       */
/*************************************************************************/

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

document.nativeGetElementById = document.getElementById;
document.getElementById = function(id) {
	var elem = document.nativeGetElementById(id);
	if(elem) {
		return elem;
	} else {
		var elems = this.getElementsByTagName("*");
		for ( var i = 0; i < elems.length; i++) {
			var node = elems[i];
			if (node.getAttribute("id") === id) {
				return node;
			}
		}
	}
	return null;
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
				infoDiv.style.backgroundColor = "rgba(255, 0, 0, 0.3)";
				
				
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
				var hTxt     = document.createTextNode("Your browser doesn't appear to support XML3D.");
				hElement.appendChild (hTxt);
				
				var pElement = document.createElement("p");
				pElement.appendChild(document.createTextNode("Please visit "));
				var link = document.createElement("a");
				link.setAttribute("href", "http://www.xml3d.org");
				link.appendChild(document.createTextNode("http://www.xml3d.org"));
				pElement.appendChild(link);
				pElement.appendChild(document.createTextNode(" to get information about browsers supporting XML3D."));
				infoDiv.appendChild (hElement);
				infoDiv.appendChild (pElement);
				
				hideDiv.parentNode.insertBefore(infoDiv, hideDiv);
			}
			
			return;
		}
		
		org.xml3d.data.configure(xml3ds);
		org.xml3d.webgl.configure(xml3ds);
		
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

/*************************************************************************/
/*                                                                       */
/*  xml3d_util.js                                                        */
/*  Utilities for XML3D								                     */
/*                                                                       */
/*  Copyright (C) 2010                                                   */
/*  DFKI - German Research Center for Artificial Intelligence            */
/* 	partly based on code originally provided by Philip Taylor, 			 */
/*  Peter Eschler, Johannes Behr and Yvonne Jung 						 */
/*  (philip.html5.org, www.x3dom.org)	 								 */
/*                                                                       */
/*  This file is part of xml3d.js                                        */
/*                                                                       */
/*  xml3d.js is free software; you can redistribute it and/or modify     */
/*  under the terms of the GNU General Public License as                 */
/*  published by the Free Software Foundation; either version 2 of       */
/*  the License, or (at your option) any later version.                  */
/*                                                                       */
/*  xml3d.js is distributed in the hope that it will be useful, but      */
/*  WITHOUT ANY WARRANTY; without even the implied warranty of           */
/*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.                 */
/*  See the GNU General Public License                                   */
/*  (http://www.fsf.org/licensing/licenses/gpl.html) for more details.   */
/*                                                                       */
/*************************************************************************/
var org;
if (!org || !org.xml3d)
  throw new Error("xml3d.js has to be included first");


if (!org.xml3d.util)
	org.xml3d.util = {};
else if (typeof org.xml3d.util != "object")
    throw new Error("org.xml3d.util already exists and is not an object");

if (!org.xml3d.debug)
    org.xml3d.debug = {};
else if (typeof org.xml3d.debug != "object")
    throw new Error("org.xml3d.debug already exists and is not an object");

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

org.xml3d.debug = {
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
		if (org.xml3d.debug.isSetup) {
			return;
		}
		try {
			if (console) {
				org.xml3d.debug.isFirebugAvailable = true;
			}
		} catch (err) {
			org.xml3d.debug.isFirebugAvailable = false;
		}
		org.xml3d.debug.setupLogContainer();
		org.xml3d.debug.isSetup = true;
	},
	activate : function() {
		org.xml3d.debug.isActive = true;
		document.body.appendChild(org.xml3d.debug.logContainer);
	},
	setupLogContainer : function() {
		org.xml3d.debug.logContainer = document.createElement("div");
		org.xml3d.debug.logContainer.id = "x3dom_logdiv";
		org.xml3d.debug.logContainer.style.border = "2px solid olivedrab";
		org.xml3d.debug.logContainer.style.height = "180px";
		org.xml3d.debug.logContainer.style.padding = "2px";
		org.xml3d.debug.logContainer.style.overflow = "auto";
		org.xml3d.debug.logContainer.style.whiteSpace = "pre-wrap";
		org.xml3d.debug.logContainer.style.fontFamily = "sans-serif";
		org.xml3d.debug.logContainer.style.fontSize = "x-small";
		org.xml3d.debug.logContainer.style.color = "#00ff00";
		org.xml3d.debug.logContainer.style.backgroundColor = "black";
	},
	doLog : function(msg, logType) {
		if (!org.xml3d.debug.isActive) {
			return;
		}
		if (org.xml3d.debug.numLinesLogged === org.xml3d.debug.maxLinesToLog) {
			msg = "Maximum number of log lines (="
					+ org.xml3d.debug.maxLinesToLog
					+ ") reached. Deactivating logging...";
		}
		if (org.xml3d.debug.numLinesLogged > org.xml3d.debug.maxLinesToLog) {
			return;
		}
		var node = document.createElement("p");
		node.style.margin = 0;
		node.innerHTML = logType + ": " + msg;
		org.xml3d.debug.logContainer.insertBefore(node,
				org.xml3d.debug.logContainer.firstChild);
		if (org.xml3d.debug.isFirebugAvailable) {
			switch (logType) {
			case org.xml3d.debug.INFO:
				console.info(msg);
				break;
			case org.xml3d.debug.WARNING:
				console.warn(msg);
				break;
			case org.xml3d.debug.ERROR:
				console.error(msg);
				break;
			case org.xml3d.debug.EXCEPTION:
				console.debug(msg);
				break;
			default:
				break;
			}
		}
		org.xml3d.debug.numLinesLogged++;
	},
	logInfo : function(msg) {
		org.xml3d.debug.doLog(msg, org.xml3d.debug.INFO);
	},
	logWarning : function(msg) {
		org.xml3d.debug.doLog(msg, org.xml3d.debug.WARNING);
	},
	logError : function(msg) {
		org.xml3d.debug.doLog(msg, org.xml3d.debug.ERROR);
	},
	logException : function(msg) {
		org.xml3d.debug.doLog(msg, org.xml3d.debug.EXCEPTION);
	},
	assert : function(c, msg) {
		if (!c) {
			org.xml3d.debug.doLog("Assertion failed in "
					+ org.xml3d.debug.assert.caller.name + ': ' + msg,
					org.xml3d.debug.WARNING);
		}
	}
};
org.xml3d.debug.setup();

/**
 * A class to parse color values
 * 
 * @author Stoyan Stefanov <sstoo@gmail.com>
 * @link http://www.phpied.com/rgb-color-parser-in-javascript/
 * @license Use it if you like it
 */
function RGBColor(color_string) {
	this.ok = false;

	// strip any leading #
	if (color_string.charAt(0) == '#') { // remove # if any
		color_string = color_string.substr(1, 6);
	}

	color_string = color_string.replace(/ /g, '');
	color_string = color_string.toLowerCase();

	// before getting into regexps, try simple matches
	// and overwrite the input
	var simple_colors = {
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
	for ( var key in simple_colors) {
		if (color_string == key) {
			color_string = simple_colors[key];
		}
	}
	// emd of simple type-in colors

	// array of color definition objects
	var color_defs = [
			{
				re : /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,
				example : [ 'rgb(123, 234, 45)', 'rgb(255,234,245)' ],
				process : function(bits) {
					return [ parseInt(bits[1]), parseInt(bits[2]),
							parseInt(bits[3]) ];
				}
			},
			{
				re : /^(\w{2})(\w{2})(\w{2})$/,
				example : [ '#00ff00', '336699' ],
				process : function(bits) {
					return [ parseInt(bits[1], 16), parseInt(bits[2], 16),
							parseInt(bits[3], 16) ];
				}
			},
			{
				re : /^(\w{1})(\w{1})(\w{1})$/,
				example : [ '#fb0', 'f0f' ],
				process : function(bits) {
					return [ parseInt(bits[1] + bits[1], 16),
							parseInt(bits[2] + bits[2], 16),
							parseInt(bits[3] + bits[3], 16) ];
				}
			} ];

	// search through the definitions to find a match
	for ( var i = 0; i < color_defs.length; i++) {
		var re = color_defs[i].re;
		var processor = color_defs[i].process;
		var bits = re.exec(color_string);
		if (bits) {
			channels = processor(bits);
			this.r = channels[0];
			this.g = channels[1];
			this.b = channels[2];
			this.ok = true;
		}

	}

	// validate/cleanup values
	this.r = (this.r < 0 || isNaN(this.r)) ? 0
			: ((this.r > 255) ? 255 : this.r);
	this.g = (this.g < 0 || isNaN(this.g)) ? 0
			: ((this.g > 255) ? 255 : this.g);
	this.b = (this.b < 0 || isNaN(this.b)) ? 0
			: ((this.b > 255) ? 255 : this.b);
	this.alpha = color_string == 'transparent' ? 0 : 1;

	// some getters
	this.toRGB = function() {
		return 'rgb(' + this.r + ', ' + this.g + ', ' + this.b + ')';
	};

	this.toHex = function() {
		var r = this.r.toString(16);
		var g = this.g.toString(16);
		var b = this.b.toString(16);
		if (r.length == 1)
			r = '0' + r;
		if (g.length == 1)
			g = '0' + g;
		if (b.length == 1)
			b = '0' + b;
		return '#' + r + g + b;
	};

	this.toGL = function() {
		return [ this.r / 255, this.g / 255, this.b / 255 ];
	};

	this.toGLAlpha = function() {
		return [ this.r / 255, this.g / 255, this.b / 255, this.alpha ];
	};

	// help
	this.getHelpXML = function() {

		var examples = new Array();
		// add regexps
		for ( var i = 0; i < color_defs.length; i++) {
			var example = color_defs[i].example;
			for ( var j = 0; j < example.length; j++) {
				examples[examples.length] = example[j];
			}
		}
		// add type-in colors
		for ( var sc in simple_colors) {
			examples[examples.length] = sc;
		}

		var xml = document.createElement('ul');
		xml.setAttribute('id', 'rgbcolor-examples');
		for ( var i = 0; i < examples.length; i++) {
			try {
				var list_item = document.createElement('li');
				var list_color = new RGBColor(examples[i]);
				var example_div = document.createElement('div');
				example_div.style.cssText = 'margin: 3px; '
						+ 'border: 1px solid black; ' + 'background:'
						+ list_color.toHex() + '; ' + 'color:'
						+ list_color.toHex();
				example_div.appendChild(document.createTextNode('test'));
				var list_item_value = document.createTextNode(' ' + examples[i]
						+ ' -> ' + list_color.toRGB() + ' -> '
						+ list_color.toHex());
				list_item.appendChild(example_div);
				list_item.appendChild(list_item_value);
				xml.appendChild(list_item);

			} catch (e) {
			}
		}
		return xml;

	};

}

org.xml3d.util.getStyle = function(oElm, strCssRule) {
	var strValue = "";
	if (document.defaultView && document.defaultView.getComputedStyle) {
		strValue = document.defaultView.getComputedStyle(oElm, "")
				.getPropertyValue(strCssRule);
	} else if (oElm.currentStyle) {
		strCssRule = strCssRule.replace(/\-(\w)/g, function(strMatch, p1) {
			return p1.toUpperCase();
		});
		strValue = oElm.currentStyle[strCssRule];
	}

	return strValue;
};

org.xml3d.setParameter = function(elementId, fieldName, value) {
	var e = document.getElementById(elementId);
	if (e) {
		var fields = e.childNodes;
		for (var i = 0; i < fields.length; i++) {
			  var field = fields[i];
			  if (field.nodeType === Node.ELEMENT_NODE && (field.name == fieldName)) {
			  	  if (typeof value === 'string')
					  {
						  while ( field.hasChildNodes() ) field.removeChild( field.lastChild );
						  field.appendChild(document.createTextNode(value));
						  return true;
					  }
			  }
			}
	}
	return false;
};

/***********************************************************************//*************************************************************************/
/*                                                                       */
/*  xml3d.js                                                             */
/*  XML3D data types (XML3DMatrix, XML3DVec, XML3DRotation)				 */
/*                                                                       */
/*  Copyright (C) 2010                                                   */
/*  DFKI - German Research Center for Artificial Intelligence            */
/* 	partly based on code originally provided by Philip Taylor, 			 */
/*  Peter Eschler, Johannes Behr and Yvonne Jung 						 */
/*  (philip.html5.org, www.x3dom.org)                                    */
/*                                                                       */
/*  This file is part of xml3d.js                                        */
/*                                                                       */
/*  xml3d.js is free software; you can redistribute it and/or modify     */
/*  under the terms of the GNU General Public License as                 */
/*  published by the Free Software Foundation; either version 2 of       */
/*  the License, or (at your option) any later version.                  */
/*                                                                       */
/*  xml3d.js is distributed in the hope that it will be useful, but      */
/*  WITHOUT ANY WARRANTY; without even the implied warranty of           */
/*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.                 */
/*  See the GNU General Public License                                   */
/*  (http://www.fsf.org/licensing/licenses/gpl.html) for more details.   */
/*                                                                       */
/*************************************************************************/

// Check, if basics have already been defined
var org;
if (!org || !org.xml3d)
	throw new Error("xml3d.js has to be included first");

// Create the XML3D data types for JS
if (!org.xml3d._native)
{
	//------------------------------------------------------------
	XML3DDataType = function()
	{
		this.ownerNode = null;
		this.attrName  = null;
	};

	XML3DDataType.prototype.setOwnerNode = function(attrName, ownerNode)
	{
		if( attrName  === undefined || attrName  == null || 
			ownerNode === undefined || ownerNode == null)
		{
			throw new Error("Passed invalid parameter values ( " +
							"attrName="  + attrName  + "; " +
							"ownerNode=" + ownerNode + 
					 	    " ) for method XML3DDataType.setOwnerNode()");
		}
		
		this.attrName  = attrName;
		this.ownerNode = ownerNode;
	};

	XML3DDataType.prototype.removeOwnerNode = function()
	{
		this.ownerNode = null;
		this.attrName  = null;
	};

	XML3DDataType.prototype.notifyOwnerNode = function(prevValue, newValue)
	{
		if(this.ownerNode != null && this.ownerNode.notificationRequired())
		{
			this.ownerNode.notify(new org.xml3d.Notification(this.ownerNode, 
															 MutationEvent.MODIFICATION, 
															 this.attrName, 
															 prevValue, 
															 newValue));
		}
	};

	//------------------------------------------------------------
	
/*
 * Returns a new 4x4 XML3DMatrix from given arguments.
 * If no arguments are given it returns an identity matrix.
 */
XML3DMatrix = function() 
{
	XML3DDataType.call(this);
	
	this._js = true;
	this._data = new Array(16);
	
	if (arguments.length == 0)
	{
		this._setMatrixInternal(1, 0, 0, 0, 
							    0, 1, 0, 0, 
							    0, 0, 1, 0, 
							    0, 0, 0, 1);
	} 
	else if (arguments.length == 1)
	{

		var m = arguments[0];
		if (m.length < 16) {
			org.xml3d.debug.logError("Tried to initialize a XML3DMatrix from a Float32Array with less than 16 members");
			return null;
		}
		this._setMatrixInternal(m[0], m[1], m[2], m[3], 
								m[4], m[5], m[6], m[7], 
								m[8], m[9], m[10], m[11], 
								m[12], m[13], m[14], m[15]);
	}
	else 
	{
		this._setMatrixInternal(arguments[0], arguments[1], arguments[2], arguments[3], 
				arguments[4], arguments[5], arguments[6], arguments[7], 
				arguments[8], arguments[9], arguments[10], arguments[11], 
				arguments[12], arguments[13], arguments[14], arguments[15]);
		
	}
};

XML3DMatrix.prototype             = new XML3DDataType();
XML3DMatrix.prototype.constructor = XML3DMatrix;

//Getter definition
XML3DMatrix.prototype.__defineGetter__("m11",  function () 
{
	return this._data[0];
});

XML3DMatrix.prototype.__defineGetter__("m12",  function () 
{
	return this._data[1];
});

XML3DMatrix.prototype.__defineGetter__("m13",  function () 
{
	return this._data[2];
});

XML3DMatrix.prototype.__defineGetter__("m14",  function () 
{
	return this._data[3];
});

XML3DMatrix.prototype.__defineGetter__("m21",  function () 
{
	return this._data[4];
});

XML3DMatrix.prototype.__defineGetter__("m22",  function () 
{
	return this._data[5];
});

XML3DMatrix.prototype.__defineGetter__("m23",  function () 
{
	return this._data[6];
});

XML3DMatrix.prototype.__defineGetter__("m24",  function () 
{
	return this._data[7];
});

XML3DMatrix.prototype.__defineGetter__("m31",  function () 
{
	return this._data[8];
});

XML3DMatrix.prototype.__defineGetter__("m32",  function () 
{
	return this._data[9];
});

XML3DMatrix.prototype.__defineGetter__("m33",  function () 
{
	return this._data[10];
});

XML3DMatrix.prototype.__defineGetter__("m34",  function () 
{
	return this._data[11];
});

XML3DMatrix.prototype.__defineGetter__("m41",  function () 
{
	return this._data[12];
});

XML3DMatrix.prototype.__defineGetter__("m42",  function () 
{
	return this._data[13];
});

XML3DMatrix.prototype.__defineGetter__("m43",  function () 
{
	return this._data[14];
});

XML3DMatrix.prototype.__defineGetter__("m44",  function () 
{
	return this._data[15];
});




//Setter definition

XML3DMatrix.prototype._setMatrixField = function(offset, value)
{
	if (isNaN(value)) {
		throw new Error("Attempted to set a bad matrix value: "+value);
	}
	
	if (this._data[offset] != value) {
		var oldValues = this._data;
		
		this._data[offset] = value;
		
		this.notifyOwnerNode(oldValues, this._data);
	}
};

XML3DMatrix.prototype.__defineSetter__('m11',  function (value) 
{
	this._setMatrixField(0, value);
});

XML3DMatrix.prototype.__defineSetter__('m12',  function (value) 
{
	this._setMatrixField(1, value);
});

XML3DMatrix.prototype.__defineSetter__('m13',  function (value) 
{
	this._setMatrixField(2, value);
});

XML3DMatrix.prototype.__defineSetter__('m14',  function (value) 
{
	this._setMatrixField(3, value);
});


XML3DMatrix.prototype.__defineSetter__('m21',  function (value) 
{
	this._setMatrixField(4, value);
});

XML3DMatrix.prototype.__defineSetter__('m22',  function (value) 
{
	this._setMatrixField(5, value);
});

XML3DMatrix.prototype.__defineSetter__('m23',  function (value) 
{
	this._setMatrixField(6, value);
});

XML3DMatrix.prototype.__defineSetter__('m24',  function (value) 
{
	this._setMatrixField(7, value);
});


XML3DMatrix.prototype.__defineSetter__('m31',  function (value) 
{
	this._setMatrixField(8, value);
});

XML3DMatrix.prototype.__defineSetter__('m32',  function (value) 
{
	this._setMatrixField(9, value);
});

XML3DMatrix.prototype.__defineSetter__('m33',  function (value) 
{
	this._setMatrixField(10, value);
});

XML3DMatrix.prototype.__defineSetter__('m34',  function (value) 
{
	this._setMatrixField(11, value);
});


XML3DMatrix.prototype.__defineSetter__('m41',  function (value) 
{
	this._setMatrixField(12, value);
});

XML3DMatrix.prototype.__defineSetter__('m42',  function (value) 
{
	this._setMatrixField(13, value);
});

XML3DMatrix.prototype.__defineSetter__('m43',  function (value) 
{
	this._setMatrixField(14, value);
});

XML3DMatrix.prototype.__defineSetter__('m44',  function (value) 
{
	this._setMatrixField(15, value);
});


/*
 * Populates this matrix with values from a given string.
 */
XML3DMatrix.prototype.setMatrixValue = function(str) 
{
	var m = /^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)$/.exec(str);

	if (m.length != 17) // m[0] is the whole string, the rest is the actual result
		throw new Error("Illegal number of elements: " + (m.length - 1) + "expected: 16");
	
	this._setMatrixInternal(m[1],  m[2],  m[3],  m[4], 
							m[5],  m[6],  m[7],  m[8], 
							m[9],  m[10], m[11], m[12], 
							m[13], m[14], m[15], m[16]);
};


XML3DMatrix.prototype._setMatrixInternal = function(m11, m12, m13, m14,
													m21, m22, m23, m24,
													m31, m32, m33, m34,
													m41, m42, m43, m44)
{
	if(isNaN(m11) || isNaN(m12) || isNaN(m13) || isNaN(m14) || 
	   isNaN(m21) || isNaN(m22) || isNaN(m23) || isNaN(m24) ||
	   isNaN(m31) || isNaN(m32) || isNaN(m33) || isNaN(m34) ||
	   isNaN(m41) || isNaN(m42) || isNaN(m43) || isNaN(m44) )
	{
		var matrixString = "( " + m11 + " " + m12 + " " + m13 + " " + m14 + "\n" +
						   		  m21 + " " + m22 + " " + m23 + " " + m24 + "\n" +
						   		  m31 + " " + m32 + " " + m33 + " " + m34 + "\n" +
						   		  m41 + " " + m42 + " " + m43 + " " + m44 + " )";
			
		throw new Error("Invalid matrix value :\n" + matrixString);
	}
	
	if((m11 != this._data[0]) || (m12 != this._data[1]) || (m13 != this._dataa[2]) || (m14 != this._data[3]) || 
	   (m21 != this._data[4]) || (m22 != this._data[5]) || (m23 != this._data[6]) || (m24 != this._data[7]) ||
	   (m31 != this._data[8]) || (m32 != this._data[9]) || (m33 != this._data[10]) || (m34 != this._data[11]) ||
	   (m41 != this._data[12]) || (m42 != this._data[13]) || (m43 != this._data[14]) || (m44 != this._data[15]) )
	{

		var oldValue = this._data;

		this._data = [m11, m12, m13, m14,
		                m21, m22, m23, m24,
		                m31, m32, m33, m34,
		                m41, m42, m43, m44];

		this.notifyOwnerNode(oldValue, this._data);
	}
};

/*
 * Multiply returns a new construct which is the result of this matrix multiplied by the 
 * argument which can be any of: XML3DMatrix, XML3DVec3, XML3DRotation.
 * This matrix is not modified.
 */
XML3DMatrix.prototype.multiply = function (that) 
{
	var a = this._data;
	
	if (that.m44 !== undefined) 
	{
		var b = that._data;
		
		return new XML3DMatrix(
				a[0] * b[0] + a[1] * b[4] + a[2] * b[8] + a[3] * b[12], 
				a[0] * b[1] + a[1] * b[5] + a[2] * b[9] + a[3] * b[13], 
				a[0] * b[2] + a[1] * b[6] + a[2] * b[10] + a[3] * b[14],
				a[0] * b[3] + a[1] * b[7] + a[2] * b[11] + a[3] * b[15], 
				
				a[4] * b[0] + a[5] * b[4] + a[6] * b[8] + a[7] * b[12], 
				a[4] * b[1] + a[5] * b[5] + a[6] * b[9] + a[7] * b[13], 
				a[4] * b[2] + a[5] * b[6] + a[6] * b[10] + a[7] * b[14], 
				a[4] * b[3] + a[5] * b[7] + a[6] * b[11] + a[7] * b[15], 
				
				a[8] * b[0] + a[9] * b[4] + a[10] * b[8] + a[11] * b[12], 
				a[8] * b[1] + a[9] * b[5] + a[10] * b[9] + a[11] * b[13], 
				a[8] * b[2] + a[9] * b[6] + a[10] * b[10] + a[11] * b[14], 
				a[8] * b[3] + a[9] * b[7] + a[10] * b[11] + a[11] * b[15], 
				
				a[12] * b[0] + a[13] * b[4] + a[14] * b[8] + a[15] * b[12], 
				a[12] * b[1] + a[13] * b[5] + a[14] * b[9] + a[15] * b[13], 
				a[12] * b[2] + a[13] * b[6] + a[14] * b[10] + a[15] * b[14], 
				a[12] * b[3] + a[13] * b[7] + a[14] * b[11] + a[15] * b[15]);
	}

	if (that.w !== undefined) 
	{
		return new XML3DRotation(a[0] * that.x + a[1] * that.y
				+ a[2] * that.z + a[3] * that.w, a[4] * that.x + a[5] * that.y
				+ a[6] * that.z + a[7] * that.w, a[8] * that.x + a[9] * that.y
				+ a[10] * that.z + a[11] * that.w, a[12] * that.x + a[13] * that.y
				+ a[14] * that.z + a[15] * that.w);
	}
	
	return new XML3DVec3(a[0] * that.x + a[1] * that.y
						+ a[2] * that.z, a[4] * that.x + a[5] * that.y
						+ a[6] * that.z, a[8] * that.x + a[9] * that.y
						+ a[10] * that.z);
};

XML3DMatrix.prototype.mulVec3 = function(that, w) {
	return new XML3DVec3(
//		this._m11 * that.x + this._m21 * that.y + this._m31 * that.z + this._m41 * w, 
//		this._m12 * that.x + this._m22 * that.y + this._m32 * that.z + this._m42 * w, 
//		this._m13 * that.x + this._m23 * that.y + this._m33 * that.z + this._m43 * w
		this._data[0] * that.x + this._data[1] * that.y + this._data[2] * that.z + this._data[3] * w, 
		this._data[4] * that.x + this._data[5] * that.y + this._data[6] * that.z + this._data[7] * w, 
		this._data[8] * that.x + this._data[9] * that.y + this._data[10] * that.z + this._data[11] * w
		);
};


XML3DMatrix.prototype.det3 = function(a1, a2, a3, b1, b2, b3,
		c1, c2, c3) {
	var d = (a1 * b2 * c3) + (a2 * b3 * c1) + (a3 * b1 * c2) - (a1 * b3 * c2)
			- (a2 * b1 * c3) - (a3 * b2 * c1);
	return d;
};
XML3DMatrix.prototype.det = function() {
	var a = this._data;
	
	var a1, a2, a3, a4, b1, b2, b3, b4, c1, c2, c3, c4, d1, d2, d3, d4;
	a1 = a[0];
	b1 = a[4];
	c1 = a[8];
	d1 = a[12];
	
	a2 = a[1];
	b2 = a[5];
	c2 = a[9];
	d2 = a[13];
	
	a3 = a[2];
	b3 = a[6];
	c3 = a[10];
	d3 = a[14];
	
	a4 = a[3];
	b4 = a[7];
	c4 = a[11];
	d4 = a[15];
	var d = +a1 * this.det3(b2, b3, b4, c2, c3, c4, d2, d3, d4) - b1
			* this.det3(a2, a3, a4, c2, c3, c4, d2, d3, d4) + c1
			* this.det3(a2, a3, a4, b2, b3, b4, d2, d3, d4) - d1
			* this.det3(a2, a3, a4, b2, b3, b4, c2, c3, c4);
	return d;
};

/*
 * Inverse returns a new matrix which is the inverse of this matrix.
 * This matrix is not modified.
 * Throws: DOMException when the matrix cannot be inverted.
 */
XML3DMatrix.prototype.inverse = function() {
	var a = this._data;
	
	var a1, a2, a3, a4, b1, b2, b3, b4, c1, c2, c3, c4, d1, d2, d3, d4;
	a1 = a[0];
	b1 = a[4];
	c1 = a[8];
	d1 = a[12];
	
	a2 = a[1];
	b2 = a[5];
	c2 = a[9];
	d2 = a[13];
	
	a3 = a[2];
	b3 = a[6];
	c3 = a[10];
	d3 = a[14];
	
	a4 = a[3];
	b4 = a[7];
	c4 = a[11];
	d4 = a[15];
	
	var rDet = this.det();
	
	if (Math.abs(rDet) < 0.000001) 
	{
		org.xml3d.debug.logInfo("Invert matrix: singular matrix, no inverse!");
		throw new Error("Invert matrix: singular matrix, no inverse!");
		return new XML3DMatrix();
	}
	rDet = 1.0 / rDet;
	return new XML3DMatrix(+this.det3(b2, b3, b4, c2, c3, c4,
			d2, d3, d4)
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
/*
 * Transpose returns a new matrix which is the transposed form of this matrix.
 * This matrix is not modified.
 */
XML3DMatrix.prototype.transpose = function() {

	return new XML3DMatrix(this._data[0], this._data[4], this._data[8],
			this._data[12], this._data[1], this._data[5], this._data[9], this._data[13], this._data[2],
			this._data[6], this._data[10], this._data[14], this._data[3], this._data[7], this._data[11],
			this._data[15]);
};

/*
 * Translate returns a new matrix which is this matrix multiplied by a translation
 * matrix containing the passed values. 
 * This matrix is not modified.
 */
XML3DMatrix.prototype.translate = function(x , y, z) 
{
	var tm = new XML3DMatrix(1, 0, 0, x, 
							 0, 1, 0, y, 
							 0, 0, 1, z, 
							 0, 0, 0, 1);
	return this.multiply(tm);
	
};

/*
 * Scale returns a new matrix which is this matrix multiplied by a scale matrix containing
 * the passed values. If the z component is undefined a 1 is used in its place. If the y 
 * component is undefined the x component value is used in its place.
 * This matrix is not modified.
 */
XML3DMatrix.prototype.scale = function(scaleX, scaleY, scaleZ) 
{
	if (!scaleZ) scaleZ = 1;
	if (!scaleY) scaleY = scaleX;
	var sm = new XML3DMatrix(scaleX,      0,  0,      0,      
			                 0,      scaleY,  0,      0, 
			                 0,           0,  scaleZ, 0, 
			                 0,           0,       0, 1);
	return this.multiply(sm);
};

/* 
 * This method returns a new matrix which is this matrix multiplied by each of 3 rotations
 * about the major axes. If the y and z components are undefined, the x value is used to 
 * rotate the object about the z axis. Rotation values are in RADIANS. 
 * This matrix is not modified.
 */
XML3DMatrix.prototype.rotate = function(rotX, rotY, rotZ) {
	var cx, cy, cz, sx, sy, sz;
	if (!rotY && !rotZ) {
		cx = Math.cos(rotX);
		sx = Math.sin(rotX);
		var rm = new XML3DMatrix(cx, sx, 0, 0, -sx, cx, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
		return this.multiply(rm);
	} else {
		cx = Math.cos(rotX);
		sx = Math.sin(rotX);
		var rm = new XML3DMatrix(1, 0, 0, 0, 0, cx, sx, 0, 0, -sx, cx, 0, 0, 0, 0, 1);
		if (rotY) {	
			cy = Math.cos(rotY);
			sy = Math.sin(rotY);
			rm = rm.multiply(new XML3DMatrix(cy, 0, -sy, 0, 0, 1, 0, 0, sy, 0, cy, 0, 0, 0, 0, 1));
		}
		if (rotZ) {			
			cz = Math.cos(rotZ);
			sz = Math.sin(rotZ);
			rm = rm.multiply(new XML3DMatrix(cz, sz, 0, 0, -sz, cz, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1));
		}
		return this.multiply(rm);
	}
};

/*
 * RotateAxisAngle returns a new matrix which is this matrix multiplied by a rotation matrix
 * with the given XML3DRotation. Rotation values are in RADIANS.
 * This matrix is not modified.
 */
XML3DMatrix.prototype.rotateAxisAngle = function(x, y, z, angle)
{
	var ca, sa, ta;
	
	ca = Math.cos(angle);
	sa = Math.sin(angle);
	
	ta = 1 - ca;
	var rm = new XML3DMatrix(ta*x*x + ca, ta*x*y + sa*z, ta*x*z - sa*y, 0, 
							 ta*x*y - sa*z, ta*y*y + ca, ta*y*z + sa*x, 0,
							 ta*x*z + sa*y, ta*y*z - sa*x, ta*z*z + ca, 0,
							 0, 0, 0, 1).transpose();
	return this.multiply(rm);
	
};

XML3DMatrix.prototype.toString = function() {
	return '[XML3DMatrix ' + this.m11 + ', ' + this.m12 + ', ' + this.m13 + ', '
			+ this.m14 + '; ' + this.m21 + ', ' + this.m22 + ', ' + this.m23
			+ ', ' + this.m24 + '; ' + this.m31 + ', ' + this.m32 + ', '
			+ this.m33 + ', ' + this.m34 + '; ' + this.m41 + ', ' + this.m42
			+ ', ' + this.m43 + ', ' + this.m44 + ']';
};

XML3DMatrix.prototype.toGL = function() {

	return [ this._data[0], this._data[4], this._data[8],
				this._data[12], this._data[1], this._data[5], this._data[9], this._data[13], this._data[2],
				this._data[6], this._data[10], this._data[14], this._data[3], this._data[7], this._data[11],
				this._data[15] ];
};

XML3DMatrix.prototype.to3x3GL = function() {
	return [this._data[0], this._data[4], this._data[8], this._data[1], this._data[5], this._data[9],
	        this._data[2], this._data[6], this._data[10]];
};

XML3DMatrix.prototype.getColumnV3 = function(colnum) {
	switch (colnum) {
	case 1: return new XML3DVec3(this._data[0], this._data[4], this._data[8]);
	case 2: return new XML3DVec3(this._data[1], this._data[5], this._data[9]);
	case 3: return new XML3DVec3(this._data[2], this._data[6], this._data[10]);
	case 4: return new XML3DVec3(this._data[3], this._data[7], this._data[11]);
	default: return null;
	}
};

//------------------------------------------------------------

XML3DVec3 = function(x, y, z) 
{	
	XML3DDataType.call(this);
	
	// Note that there is no owner node registered yet. Therefore, the setXYZ() method
	// can be used at this point since no notification can be triggered.
	var n = arguments.length;
	switch(n) {
		case 1:
			if (arguments[0] instanceof Array || arguments[0] instanceof Float32Array) {
				this._setXYZ(x[0], x[1], x[2]);
			} else {
				this._setXYZ(x, x, x);
			}
			break;
		case 3:
			this._setXYZ(x, y, z);
			break;
		default:
			this._setXYZ(0, 0, 0);
			break;
	}
};
XML3DVec3.prototype             = new XML3DDataType();
XML3DVec3.prototype.constructor = XML3DVec3;

XML3DVec3.prototype._setXYZ = function(x, y, z)
{
	if( isNaN(x) || isNaN(y) || isNaN(z))
	{
		throw new Error("XML3DVec3._setXYZ(): ( " + 
							   x + ", " + y + ", " + z + 
							   " ) are not valid vector components" );
	}
	
	var oldX = this._x;
	var oldY = this._y;
	var oldZ = this._z;
	
	if(oldX != x || oldY != y || oldZ != z)
	{
		this._x = x;
		this._y = y;
		this._z = z;
		
		this.notifyOwnerNode([oldX, oldY, oldZ], 
							 [x,    y,    z]);
	}	
};


XML3DVec3.prototype.__defineSetter__("x", function (value) 
{
	this._setXYZ(value, this._y, this._z);
});

XML3DVec3.prototype.__defineGetter__("x", function () 
{
	return this._x;
});


XML3DVec3.prototype.__defineSetter__("y", function (value) 
{
	this._setXYZ(this._x, value, this._z);
});

XML3DVec3.prototype.__defineGetter__("y", function () 
{
	return this._y;
});

XML3DVec3.prototype.__defineSetter__("z", function (value) 
{
	this._setXYZ(this._x, this._y, value);
});

XML3DVec3.prototype.__defineGetter__("z", function () 
{
	return this._z;
});


XML3DVec3.prototype.setVec3Value = function(str) 
{
	var m = /^\s*(\S+)\s+(\S+)\s+(\S+)\s*$/.exec(str);
	this._setXYZ(+m[1], +m[2], +m[3]);
};

XML3DVec3.prototype.add = function(that) {
	return new XML3DVec3(this._x + that.x, this._y + that.y,
			this._z + that.z);
};
XML3DVec3.prototype.subtract = function(that) {
	return new XML3DVec3(this._x - that.x, this._y - that.y,
			this._z - that.z);
};
XML3DVec3.prototype.multiply = function(that) {
	return new XML3DVec3(this.x * that.x, this.y * that.y,
			this.z * that.z);
};
XML3DVec3.prototype.negate = function() {
	return new XML3DVec3(-this._x, -this._y, -this._z);
};
XML3DVec3.prototype.dot = function(that) {
	return (this._x * that.x + this._y * that.y + this._z * that.z);
};
XML3DVec3.prototype.cross = function(that) {
	return new XML3DVec3(this._y * that.z - this._z * that.y,
			this._z * that.x - this._x * that.z, this._x * that.y - this._y
					* that.x);
};
/*org.xml3d.dataTypes.Vec3f.prototype.reflect = function(n) {
	var d2 = this.dot(n) * 2;
	return new XML3DVec3(this.x - d2 * n.x, this._y - d2 * n.y,
			this.z - d2 * n.z);
};*/
XML3DVec3.prototype.length = function() {
	return Math.sqrt((this._x * this._x) + (this._y * this._y) + (this._z * this._z));
};

XML3DVec3.prototype.normalize = function(that) {
	var n = this.length();
	if (n)
		n = 1.0 / n;
	else throw new Error();
	
	return new XML3DVec3(this._x * n, this._y * n, this._z * n);
};

XML3DVec3.prototype.scale = function(n) {
	return new XML3DVec3(this._x * n, this._y * n, this._z * n);
};

XML3DVec3.prototype.toGL = function() {
	return [ this._x, this._y, this._z ];
};

XML3DVec3.prototype.toString = function() {
	return "XML3DVec3(" + this._x + " " + this._y + " " + this._z + ")";
};



//-----------------------------------------------------------------


XML3DRotation = function(x, y, z, w) 
{
	XML3DDataType.call(this);
	var n = arguments.length;
	switch(n) {
	case 1:
		this.x = x[0];
		this.y = x[1];
		this.z = x[2];
		this.w = x[3];
		break;
	case 2:
		this.setAxisAngle(x,y);
		break;
	case 4:
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
		break;
	default:
		this.x = 0;
		this.y = 0;
		this.z = 0;
		this.w = 1;
		break;
	}

};
XML3DRotation.prototype             = new XML3DDataType();
XML3DRotation.prototype.constructor = XML3DRotation;



XML3DRotation.prototype.multiply = function(that) {
	return new XML3DRotation(
			this.w * that.x + this.x * that.w + this.y * that.z - this.z * that.y, 
			this.w * that.y + this.y * that.w + this.z * that.x - this.x * that.z, 
			this.w * that.z	+ this.z * that.w + this.x * that.y - this.y * that.x, 
			this.w * that.w - this.x * that.x - this.y * that.y - this.z * that.z);
};

XML3DRotation.fromMatrix = function(mat) {
	var q = new XML3DRotation();
	var trace = mat.m11 + mat.m22 + mat.m33;
	if (trace > 0) {		
		var s = 2.0 * Math.sqrt(trace + 1.0);
		q.w = 0.25 * s;
		q.x = (mat.m32 - mat.m23) / s;
		q.y = (mat.m13 - mat.m31) / s;
		q.z = (mat.m21 - mat.m12) / s;
	} else {
		if (mat.m11 > mat.m22 && mat.m11 > mat.m33) {
			var s = 2.0 * Math.sqrt(1.0 + mat.m11 - mat.m22 - mat.m33);
			q.w = (mat.m32 - mat.m23) / s;
			q.x = 0.25 * s;
			q.y = (mat.m12 + mat.m21) / s;
			q.z = (mat.m13 + mat.m31) / s;
		} else if (mat.m22 > mat.m33) {
			var s = 2.0 * Math.sqrt(1.0 + mat.m22 - mat.m11 - mat.m33);
			q.w = (mat.m13 - mat.m31) / s;
			q.x = (mat.m12 + mat.m21) / s;
			q.y = 0.25 * s;
			q.z = (mat.m23 + mat.m32) / s;
		} else {
			var s = 2.0 * Math.sqrt(1.0 + mat.m33 - mat.m11 - mat.m22);
			q.w = (mat.m21 - mat.m12) / s;
			q.x = (mat.m13 + mat.m31) / s;
			q.y = (mat.m23 + mat.m32) / s;
			q.z = 0.25 * s;
		}
	}
	return q;
};

XML3DRotation.fromBasis = function(x, y, z) {
	var normX = x.length();
	var normY = y.length();
	var normZ = z.length();

	var m = new XML3DMatrix();
	m.m11 = x.x / normX;
	m.m12 = y.x / normY;
	m.m13 = z.x / normZ;
	m.m21 = x.y / normX;
	m.m22 = y.y / normY;
	m.m23 = z.y / normZ;
	m.m31 = x.z / normX;
	m.m32 = y.z / normY;
	m.m33 = z.z / normZ;

	return XML3DRotation.fromMatrix(m);
};

XML3DRotation.axisAngle = function(axis, a) {
	var t = axis.length();
	if (t > 0.000001) {
		var s = Math.sin(a / 2) / t;
		var c = Math.cos(a / 2);
		return new XML3DRotation(axis.x * s, axis.y * s,
				axis.z * s, c);
	} else {
		return new XML3DRotation(0, 0, 0, 1);
	}
};

XML3DRotation.prototype.setAxisAngle = function(axis, a) 
{
		if(typeof axis != 'object' || isNaN(a))
		{
			throw new Error("Illegal axis and/or angle values: " +
						    "( axis=" + axis + " angle=" + a + " )");
		}
			
		var t    = axis.length();
		var oldX = this.x;
		var oldY = this.y;
		var oldZ = this.z;
		var oldW = this.w;
		
		if (t > 0.000001) 
		{
			var s = Math.sin(a / 2) / t;
			var c = Math.cos(a / 2);
			this.x = axis.x * s;
			this.y = axis.y * s;
			this.z = axis.z * s;
			this.w = c;
		} 
		else 
		{
			this.x = this.y = this.z = 0;
			this.w = 1;
		}
	
		
		if(oldX != this.x || oldY != this.y || oldZ != this.z || oldW != this.w)
		{
			this.notifyOwnerNode([oldX,   oldY,   oldZ,   oldW],
								 [this.x, this.y, this.z, this.w]);
		}
};

XML3DRotation.prototype.setAxisAngleValue = function(str) 
{
	var m = /^\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s*$/.exec(str);
	this.setAxisAngle(new XML3DVec3(+m[1], +m[2], +m[3]), +m[4]);
};

XML3DRotation.prototype.toMatrix = function() {
	var xx = this.x * this.x * 2;
	var xy = this.x * this.y * 2;
	var xz = this.x * this.z * 2;
	var yy = this.y * this.y * 2;
	var yz = this.y * this.z * 2;
	var zz = this.z * this.z * 2;
	var wx = this.w * this.x * 2;
	var wy = this.w * this.y * 2;
	var wz = this.w * this.z * 2;
	return new XML3DMatrix(1 - (yy + zz), xy - wz, xz + wy,
			0, xy + wz, 1 - (xx + zz), yz - wx, 0, xz - wy, yz + wx,
			1 - (xx + yy), 0, 0, 0, 0, 1);
};

XML3DRotation.prototype.__defineGetter__("axis", function() {
	var s = Math.sqrt(1 - this.w * this.w);
	if (s < 0.001) {
		return new XML3DVec3(0, 0, 1);
	}
	return new XML3DVec3(this.x / s, this.y / s, this.z / s);
});

XML3DRotation.prototype.__defineGetter__("angle", function() {
	var angle = 2 * Math.acos(this.w);
	var s = Math.sqrt(1 - this.w * this.w);
	if (s < 0.001) {
		return 0.0;
	}
	return angle;
});

XML3DRotation.prototype.toAxisAngle = function() {
	var angle = 2 * Math.acos(this.w);
	var s = Math.sqrt(1 - this.w * this.w);
	if (s < 0.001) {
		return [ this.x, this.y, this.z, angle ];
	}
	return [ this.x / s, this.y / s, this.z / s, angle ];
};

XML3DRotation.prototype.rotateVec3 = function(v) {
	var q00 = 2.0 * this.x * this.x;
	var q11 = 2.0 * this.y * this.y;
	var q22 = 2.0 * this.z * this.z;

	var q01 = 2.0 * this.x * this.y;
	var q02 = 2.0 * this.x * this.z;
	var q03 = 2.0 * this.x * this.w;

	var q12 = 2.0 * this.y * this.z;
	var q13 = 2.0 * this.y * this.w;

	var q23 = 2.0 * this.z * this.w;

	return new XML3DVec3((1.0 - q11 - q22) * v.x + (q01 - q23)
			* v.y + (q02 + q13) * v.z, (q01 + q23) * v.x + (1.0 - q22 - q00)
			* v.y + (q12 - q03) * v.z, (q02 - q13) * v.x + (q12 + q03) * v.y
			+ (1.0 - q11 - q00) * v.z);
};

XML3DRotation.prototype.dot = function(that) {
	return this.x * that.x + this.y * that.y + this.z * that.z + this.w
			* that.w;
};
XML3DRotation.prototype.add = function(that) {
	return new XML3DRotation(this.x + that.x, this.y + that.y,
			this.z + that.z, this.w + that.w);
};
XML3DRotation.prototype.subtract = function(that) {
	return new XML3DRotation(this.x - that.x, this.y - that.y,
			this.z - that.z, this.w - that.w);
};
XML3DRotation.prototype.multScalar = function(s) {
	return new XML3DRotation(this.x * s, this.y * s, this.z
			* s, this.w * s);
};

XML3DRotation.prototype.normalised = function(that) {
	var d2 = this.dot(that);
	var id = 1.0;
	if (d2)
		id = 1.0 / Math.sqrt(d2);
	return new XML3DRotation(this.x * id, this.y * id, this.z
			* id, this.w * id);
};

XML3DRotation.prototype.length = function() {
	return Math.sqrt(this.dot(this));
};

XML3DRotation.prototype.normalize = function(that) {
	var l = this.length();
	if (l) {
		var id = 1.0 / l;
		return new XML3DRotation(this.x * id, this.y * id, this.z * id, this.w * id);
	}
	return new XML3DRotation();
};


XML3DRotation.prototype.negate = function() {
	return new XML3DRotation(this.x, this.y, this.z, -this.w);
};
XML3DRotation.prototype.interpolate = function(that, t) {
	var cosom = this.dot(that);
	var rot1;
	if (cosom < 0.0) {
		
		cosom = -cosom;
		rot1 = that.negate();
	} else {
		rot1 = new XML3DRotation(that.x, that.y, that.z,
				that.w);
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
XML3DRotation.prototype.toString = function() {
	return "XML3DRotation(" + this.axis + ", " + this.angle + ")";
};

/** Replaces the existing rotation with one computed from the two 
 * vectors passed as arguments.
 */
XML3DRotation.prototype.setRotation = function(from, to) {
	
	var axis = from.cross(to); 
	var angle = Math.acos(from.dot(to)); 
	
	this.setAxisAngle(axis, angle); 
}; 

XML3DRotation.prototype.toGL = function() {
	return [this.x, this.y, this.z, this.w];
};


//-----------------------------------------------------------------

/** returns an XML3DBox, which is an axis-aligned box, described 
*  by two vectors min and max.
*   
*  @param min (optional) instance of XML3DVec3 for the smallest point of the box
*  @param max (optional) instance of XML3DVec3 for the biggest point of the box   
*/
XML3DBox = function(min, max) 
{
	XML3DDataType.call(this);
	if(arguments.length === 2) 
	{
		this.min = min; 
		this.max = max; 
	}
	else
	{
		this.makeEmpty(); 
	}
	
	return this; 
};

XML3DBox.prototype             = new XML3DDataType();
XML3DBox.prototype.constructor = XML3DBox;

/** @returns XML3DVec3 describing the size of the box */ 
XML3DBox.prototype.size = function() 
{
	var v = this.max.subtract(this.min);
	if(v.x < 0)
		v.x = 0; 
	if(v.y < 0)
		v.y = 0; 
	if(v.z < 0)
		v.z = 0; 
	
	return v; 
}; 

/** @returns XML3DVec3 that is the center of the box */ 
XML3DBox.prototype.center = function() 
{
	return this.min.add(this.max).scale(0.5); 
}; 

/** sets min's components to Number.MAX_VALUE and max' components to -Number.MAX_VALUE.
*/
XML3DBox.prototype.makeEmpty = function() 
{
	this.min = new XML3DVec3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE); 
	this.max = new XML3DVec3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
}; 

/** @returns whether at least one of min's components is bigger than the corresponding 
*  component in max.
*/
XML3DBox.prototype.isEmpty = function() 
{
	return (this.min.x > this.max.x 
		 || this.min.y > this.max.y
		 || this.min.z > this.max.z); 
};

/** updates the min or max accoring to the given point or bounding box. 
* 
* @param that the object used for extension, which can be a XML3DVec3 or XML3DBox
*/
XML3DBox.prototype.extend = function(that)
{
	var min, max; 
	if(that.constructor === XML3DBox)
	{	
		min = that.min; 
		max = that.max; 
	}
	else if(that.constructor === XML3DVec3)
	{
		min = that; 
		max = that; 
	}
	else
		return; 

	if(min.x < this.min.x)
		this.min.x = min.x;
	if(min.y < this.min.y)
		this.min.y = min.y; 
	if(min.z < this.min.z)
		this.min.z = min.z;
	
	if(max.x > this.max.x)
		this.max.x = max.x;
	if(max.y > this.max.y)
		this.max.y = max.y; 
	if(max.z > this.max.z)
		this.max.z = max.z;
}; 

//-----------------------------------------------------------------

/** returns an XML3DRay that has an origin and a direction.
* 
* If the arguments are not given, the ray's origin is (0,0,0) and 
* points down the negative z-axis.  
*   
*  @param origin (optional) instance of XML3DVec3 for the origin of the ray
*  @param direction (optional) instance of XML3DVec3 for the direction of the ray   
*/
XML3DRay = function(origin, direction) 
{
	XML3DDataType.call(this);
	
	switch(arguments.length) {		
	case 1: 
		this.origin = origin; 
		this.direction = new XML3DVec3(0, 0, -1); 
		break; 
		
	case 2: 
		this.origin = origin; 
		this.direction = direction; 
		
	default: 
		this.origin = new XML3DVec3(0, 0, 0);
		this.direction = new XML3DVec3(0, 0, -1);
		break; 
	}
	
	return this; 
};

XML3DRay.prototype             = new XML3DDataType();
XML3DRay.prototype.constructor = XML3DRay;

} // End createXML3DDatatypes
else {
	// Create global constructors if not available
	if(Object.prototype.constructor === XML3DVec3.prototype.constructor) {
		XML3DVec3 = function(x, y, z) {
			var v =org.xml3d._xml3d.createXML3DVec3();
			if (arguments.length == 3) {
				v.x = x;
				v.y = y;
				v.z = z;
			} 
			return v;
		};
	};
	
	if(Object.prototype.constructor === XML3DRotation.prototype.constructor) {
		XML3DRotation = function(axis, angle) {
			var v =org.xml3d._xml3d.createXML3DRotation();
			if (arguments.length == 2) {
				v.setAxisAngle(axis, angle);
			} 
			return v;
		};
	};

	if(Object.prototype.constructor === XML3DMatrix.prototype.constructor) {
		XML3DMatrix = function(m11,m12,m13,m14,m21,m22,m23,m24,m31,m32,m33,m34,m41,m42,m43,m44) {
			var m = org.xml3d._xml3d.createXML3DMatrix();
			if (arguments.length == 16) {
	            m.m11 = m11; m.m12 = m12; m.m13 = m13; m.m14 = m14;  
	            m.m21 = m21; m.m22 = m22; m.m23 = m23; m.m24 = m24;
	            m.m31 = m31; m.m32 = m32; m.m33 = m33; m.m34 = m34;
	            m.m41 = m41; m.m42 = m42; m.m43 = m43; m.m44 = m44;
			} 
			return m;
		};
	};

	// Create nice toString Functions (does not work for FF :\)
	if (XML3DVec3.prototype.toString == Object.prototype.toString) {
		XML3DVec3.prototype.toString = function() { return "XML3DVec3(" + this.x + " " + this.y + " " + this.z + ")";};
	}
	if (XML3DRotation.prototype.toString == Object.prototype.toString) {
		XML3DRotation.prototype.toString = function() { return "XML3DRotation(" + this.axis + ", " + this.angle + ")";};
	}
	if (XML3DMatrix.prototype.toString == Object.prototype.toString) {
		XML3DMatrix.prototype.toString = function() { 
			return "XML3DMatrix(" +
			+ this.m11 + ', ' + this.m12 + ', ' + this.m13 + ', ' + this.m14 + '; ' 
            + this.m21 + ', ' + this.m22 + ', ' + this.m23 + ', ' + this.m24 + '; ' 
            + this.m31 + ', ' + this.m32 + ', ' + this.m33 + ', ' + this.m34 + '; ' 
            + this.m41 + ', ' + this.m42 + ', ' + this.m43 + ', ' + this.m44
			+ ")";};
	}
}
/*************************************************************************/
/*                                                                       */
/*  xml3d_classes.js                                                     */
/*  Configures generic elements to provide XML3D IDLs					 */
/*                                                                       */
/*  Copyright (C) 2010                                                   */
/*  DFKI - German Research Center for Artificial Intelligence            */
/*                                                                       */
/*  This file is part of xml3d.js                                        */
/*                                                                       */
/*  xml3d.js is free software; you can redistribute it and/or modify     */
/*  under the terms of the GNU General Public License as                 */
/*  published by the Free Software Foundation; either version 2 of       */
/*  the License, or (at your option) any later version.                  */
/*                                                                       */
/*  xml3d.js is distributed in the hope that it will be useful, but      */
/*  WITHOUT ANY WARRANTY; without even the implied warranty of           */
/*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.                 */
/*  See the GNU General Public License                                   */
/*  (http://www.fsf.org/licensing/licenses/gpl.html) for more details.   */
/*                                                                       */
/*************************************************************************/

 // ===> THIS CODE IS GENERATED. DO NOT EDIT THIS FILE DIRECTLY <===

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


/*
 * Workaround for DOMAttrModified issues in WebKit based browsers:
 * https://bugs.webkit.org/show_bug.cgi?id=8191
 */
if(navigator.userAgent.indexOf("WebKit") != -1)
{
	var attrModifiedWorks = false;
	var listener = function(){ attrModifiedWorks = true; };
	document.documentElement.addEventListener("DOMAttrModified", listener, false);
	document.documentElement.setAttribute("___TEST___", true);
	document.documentElement.removeAttribute("___TEST___", true);
	document.documentElement.removeEventListener("DOMAttrModified", listener, false);

	if (!attrModifiedWorks)
	{
		Element.prototype.__setAttribute = HTMLElement.prototype.setAttribute;

		Element.prototype.setAttribute = function(attrName, newVal)
		{
			var prevVal = this.getAttribute(attrName);
			this.__setAttribute(attrName, newVal);
			newVal = this.getAttribute(attrName);
			if (newVal != prevVal)
			{
				var evt = document.createEvent("MutationEvent");
				evt.initMutationEvent(
						"DOMAttrModified",
						true,
						false,
						this,
						prevVal || "",
						newVal || "",
						attrName,
						(prevVal == null) ? evt.ADDITION : evt.MODIFICATION
				);
				this.dispatchEvent(evt);
			}
		};

		Element.prototype.__removeAttribute = HTMLElement.prototype.removeAttribute;
		Element.prototype.removeAttribute = function(attrName)
		{
			var prevVal = this.getAttribute(attrName);
			this.__removeAttribute(attrName);
			var evt = document.createEvent("MutationEvent");
			evt.initMutationEvent(
					"DOMAttrModified",
					true,
					false,
					this,
					prevVal,
					"",
					attrName,
					evt.REMOVAL
			);
			this.dispatchEvent(evt);
		};
	}
}


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
			//classInfo.configure(node, context);
			classInfo(node, context);
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

org.xml3d.XML3DNodeFactory.createBooleanFromString = function(value)
{
	return new Boolean(value);
};

org.xml3d.XML3DNodeFactory.createStringFromString = function(value)
{
	return new String(value);
};

org.xml3d.XML3DNodeFactory.createIntFromString = function(value)
{
	return parseInt(value);
};

org.xml3d.XML3DNodeFactory.createFloatFromString = function(value)
{
	return parseFloat(value);
};

org.xml3d.XML3DNodeFactory.createAnyURIFromString = function(value)
{
	//TODO: not implemented
	return value;
};

org.xml3d.XML3DNodeFactory.createEnumFromString = function(value)
{
	//TODO: not implemented
	return value;
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


function isEqual(val1, val2)
{
	if(val1 === val2)
	{
		return true;
	}

	if(! (val1 && val2))
	{
		return false;
	}

	if(org.xml3d.isUInt16Array(val1)   ||
	   org.xml3d.isFloatArray(val1)    ||
	   org.xml3d.isFloat2Array(val1)   ||
	   org.xml3d.isFloat3Array(val1)   ||
	   org.xml3d.isFloat4Array(val1)   ||
	   org.xml3d.isFloat4x4Array(val1) ||
	   org.xml3d.isBoolArray(val1))
	{

		if(val1.length != val2.length)
		{
			return false;
		}

		if(val1.toString() != val2.toString())
		{
			return false;
		}

		for(var i=0; i < val1.length; i++)
		{
			if(val1[i] != val2[i])
			{
				return false;
			}
		}
	}
	else if(org.xml3d.isXML3DVec3(val1))
	{
		return val1.x == val2.x &&
			   val1.y == val2.y &&
			   val1.z == val2.z;
	}
	else if(org.xml3d.isXML3DRotation(val1))
	{
		return val1.x == val2.x &&
			   val1.y == val2.y &&
			   val1.z == val2.z &&
			   val1.w == val2.w;
	}
	else
	{
		for(var i in val1)
		{
			if(val1[i] != val2[i])
			{
				return false;
			}
		}
	}
	
	if (typeof val1 == typeof val2)
		return val1 == val2;

	return true;
};


org.xml3d.XML3DDocument.prototype.onTextSet = function(e){
	if (e.target === undefined)
	{
		org.xml3d.debug.logInfo("Unhandled event on: " + e.target.localName);
		return;
	}
	try
    {
        var removedNodeParent = e.target.parentNode;
        removedNodeParent.setValue(e);
        
        if (!removedNodeParent.notificationRequired)
        	return;
        
        if (removedNodeParent.notificationRequired())
        {
        	removedNodeParent.notify(new org.xml3d.Notification(this, MutationEvent.REMOVAL, "node", e.target, ""));
        }
    }
    catch (e)
    {
        org.xml3d.debug.logError("Exception in textSet:");
        org.xml3d.debug.logException(e);
    }
};

/*
org.xml3d.XML3DDocument.prototype.onTextSet = function(e){
	if (e.target === undefined)
	{
		org.xml3d.debug.logInfo("Unhandled event on: " + e.target.localName);
		return;
	}
	try
    {
        var bindNode = e.target.parentNode;
        var oldValue = e.target.parentNode.value;

        e.target.parentNode.setValue(e);

        if (bindNode.notificationRequired() && ! isEqual(oldValue, e.target.parentNode.value))
        {
            bindNode.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "text", oldValue, e.target.parentNode.value));
        }
    }
    catch (e)
    {
        org.xml3d.debug.logError("Exception in textSet:");
        org.xml3d.debug.logException(e);
    }
};
*/




org.xml3d.XML3DDocument.prototype.onAdd = function(e) {
	try {
		org.xml3d.document.getNode(e.target);

		var parent = e.target.parentNode;
		if (parent && parent.notify) {
			parent.notify(new org.xml3d.Notification(this, MutationEvent.ADDITION, null, null, e.target));
		}
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

	try
	{
		var result;

		if(e.attrChange == MutationEvent.REMOVAL)
		{
			result = e.target.resetAttribute(e.attrName);
		}
		else if(e.attrChange == MutationEvent.MODIFICATION ||
				e.attrChange == MutationEvent.ADDITION)
		{
			result = e.target.setField(e);
		}
		else
		{
			org.xml3d.debug.logError("An unknown event for attribue " + e.attrName +
					                 " of node " + e.target.localName + " has occured");
			return;
		}


		/*if (result == org.xml3d.event.HANDLED &&
			e.target.notificationRequired()   &&
			! isEqual(e.prevValue, e.newValue))
		{
			// The removal of an attribute is also handled as MutationEvent.MODIFICATION since
			// this event is handled by resetting the internal attribute value.
			e.target.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, e.attrName, e.prevValue, e.newValue));
		}*/
	 }
	 catch (e)
	 {
		org.xml3d.debug.logError("Exception in setField:");
		org.xml3d.debug.logException(e);
	}
};

org.xml3d.XML3DDocument.prototype.onRemove = function(e)
{
	org.xml3d.debug.logInfo("Remove: "+e);

	if (e.target === undefined)
	{
		org.xml3d.debug.logInfo("Unhandled event on: " + e.target.localName);
		return;
	}
	try
    {
    	//var parent = e.target.parentNode;
		//if (parent && parent.notify) {
		//	parent.notify(new org.xml3d.Notification(this, MutationEvent.REMOVAL, null, null, e.target));

        var removedNode = e.target;

        if (removedNode.notificationRequired())
        {
            removedNode.notify(new org.xml3d.Notification(this, MutationEvent.REMOVAL, "node", e.target, ""));
        }

        /*for(var i = 0; i < removedNode.adapters.length; i++)
        {
        	var adapter = removedNode.adapters[i];
        	if(adapter.dispose)
        	{
        		adapter.dispose();
        	}
        }*/
    }
    catch (e)
    {
        org.xml3d.debug.logError("Exception in onRemove:");
        org.xml3d.debug.logException(e);
    }
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
org.xml3d.data.AdapterFactory.prototype.createAdapter = function(node) {
		return null;
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

/*
org.xml3d.initBoolean = function(value, defaultValue) {
	return value ? value == "true" : defaultValue;
};
*/

org.xml3d.initBoolean = function(value, defaultValue) {
    if (value === undefined || value == "")
		return defaultValue;
	
	if (typeof value == typeof "") {
		return value == "true" ? true : false;
	}
    return !!value;
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
	if (value)
	{
		result.setAxisAngleValue(value);
	}
	else
	{
		result.setAxisAngle(new XML3DVec3(x, y, z), angle);
	}
	return result;
};

org.xml3d.initEnum = function(value, defaultValue, choice)
{
	if(value && typeof(value) == "string" && choice[value.toLowerCase()] !== undefined)
	{
		var index = choice[value.toLowerCase()];
		return choice[index];
	}

	return choice[defaultValue];
};

org.xml3d.initIntArray = function(value, defaultValue) {
	var exp = /([+\-0-9]+)/g;
	return value ? new Int32Array(value.match(exp)) : new Int32Array(defaultValue);
};

org.xml3d.initUInt16Array = function(value, defaultValue) {
	var exp = /([+\-0-9]+)/g;
	return value ? new Uint16Array(value.match(exp)) : new Uint16Array(defaultValue);
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

org.xml3d.initFloat4Array = function(value, defaultValue) {
	return org.xml3d.initFloatArray(value, defaultValue);
};

org.xml3d.initFloat4x4Array = function(value, defaultValue) {
	return org.xml3d.initFloatArray(value, defaultValue);
};

org.xml3d.initBoolArray = function(value, defaultValue) {
	var converted = value.replace(/(true)/i, "1").replace(/(false)/i, "0");
	return new Uint8Array(converted.match(/\d/i));
};

org.xml3d.initAnyURI = function(node, defaultValue) {
	return org.xml3d.initString(node, defaultValue);
};


//-----------------------------------------------------------------------------
// Checker helper
//-----------------------------------------------------------------------------
org.xml3d.isFloat = function(value)
{
	return typeof value == "number";
};

org.xml3d.isString = function(value)
{
	return typeof value == "string";
};

org.xml3d.isInt = function(value)
{
	return typeof value == "number";
};

org.xml3d.isBoolean = function(value)
{
	return typeof value == "boolean";
};

org.xml3d.isXML3DVec3 = function(value)
{
	return typeof value == "object" && new XML3DVec3().constructor == value.constructor;
};

org.xml3d.isXML3DRotation = function(value, x, y, z, angle)
{
	return typeof value == "object" && new XML3DRotation().constructor == value.constructor;
};

org.xml3d.isEnum = function(value, choice)
{
	return (typeof value == "string" && choice[value.toLowerCase()] != undefined);
};

org.xml3d.isIntArray = function(value)
{
	return typeof value == "object" && new Int32Array().constructor == value.constructor;
};

org.xml3d.isUInt16Array = function(value)
{
	return typeof value == "object" && new Uint16Array().constructor == value.constructor;
};

org.xml3d.isFloatArray = function(value)
{
	return typeof value == "object" && new Float32Array().constructor == value.constructor;
};

org.xml3d.isFloat3Array = function(value)
{
	return org.xml3d.isFloatArray(value);
};

org.xml3d.isFloat2Array = function(value)
{
	return org.xml3d.isFloatArray(value);
};

org.xml3d.isFloat4Array = function(value)
{
	return org.xml3d.isFloatArray(value);
};

org.xml3d.isFloat4x4Array = function(value)
{
	return org.xml3d.isFloatArray(value);
};

org.xml3d.isBoolArray = function(value)
{
	return typeof value == "object" && new Uint8Array().constructor == value.constructor;
};

org.xml3d.isAnyURI = function(node)
{
	return org.xml3d.isString(node);
};

org.xml3d.elementEvents = {
        "xml3d": { "framedrawn":1 }
};
org.xml3d.configureEvents = function(node) {
    node.__proto__.__addEventListener = node.__proto__.addEventListener;
    node.__proto__.__removeEventListener = node.__proto__.removeEventListener;

    node.addEventListener = function(type, listener, useCapture) {
                
        if(org.xml3d.elementEvents[node.nodeName] 
        && type in org.xml3d.elementEvents[node.nodeName]) {
            for (i = 0; i < this.adapters.length; i++) {
                if (this.adapters[i].addEventListener) {
                    this.adapters[i].addEventListener(type, listener, useCapture);
                }
            }
        }
        else
            this.__addEventListener(type, listener, useCapture);
    };
    node.removeEventListener = function(type, listener, useCapture) {
        
        if(org.xml3d.elementEvents[node.nodeName] 
        && type in org.xml3d.elementEvents[node.nodeName]) {
            for (i = 0; i < this.adapters.length; i++) {
                if (this.adapters[i].removeEventListener) {
                    this.adapters[i].removeEventListener(type, listener, useCapture);
                }
            }
        }
        else
            this.__removeEventListener(type, listener, useCapture);
    };
};

// MeshTypes
org.xml3d.MeshTypes = {};
org.xml3d.MeshTypes["triangles"] = 0;
org.xml3d.MeshTypes[0] = "triangles";
org.xml3d.MeshTypes["trianglestrips"] = 1;
org.xml3d.MeshTypes[1] = "triangleStrips";
org.xml3d.MeshTypes["lines"] = 2;
org.xml3d.MeshTypes[2] = "lines";
org.xml3d.MeshTypes["linestrips"] = 3;
org.xml3d.MeshTypes[3] = "lineStrips";
// TextureTypes
org.xml3d.TextureTypes = {};
org.xml3d.TextureTypes["2d"] = 0;
org.xml3d.TextureTypes[0] = "2D";
org.xml3d.TextureTypes["1d"] = 1;
org.xml3d.TextureTypes[1] = "1D";
org.xml3d.TextureTypes["3d"] = 2;
org.xml3d.TextureTypes[2] = "3D";
// FilterTypes
org.xml3d.FilterTypes = {};
org.xml3d.FilterTypes["none"] = 0;
org.xml3d.FilterTypes[0] = "none";
org.xml3d.FilterTypes["nearest"] = 1;
org.xml3d.FilterTypes[1] = "nearest";
org.xml3d.FilterTypes["linear"] = 2;
org.xml3d.FilterTypes[2] = "linear";
// WrapTypes
org.xml3d.WrapTypes = {};
org.xml3d.WrapTypes["clamp"] = 0;
org.xml3d.WrapTypes[0] = "clamp";
org.xml3d.WrapTypes["repeat"] = 1;
org.xml3d.WrapTypes[1] = "repeat";
org.xml3d.WrapTypes["border"] = 2;
org.xml3d.WrapTypes[2] = "border";

// Initialize methods
org.xml3d.event.UNHANDLED = 1;
org.xml3d.event.HANDLED = 2;


/**
 * Register class for element <Xml3dNode>
 */
org.xml3d.classInfo.Xml3dNode = function(node, c)
{
    org.xml3d.configureEvents(node);
    
	node.xml3ddocument = c.doc;
	node.adapters      = [];

	node.addAdapter = function(adapter)
	{
		this.adapters.push(adapter);
	};

	node.getTextContent = function()
	{
		var str = "";
		var k   = this.firstChild;

		while(k)
		{
			if (k.nodeType == 3)
			{
				str += k.textContent;
			}

			k = k.nextSibling;
		}
		return str;
	};

	node.notificationRequired = function ()
	{
		return this.adapters.length != 0;
	};

	node.notify = function (notification)
	{
		for(var i= 0; i < this.adapters.length; i++)
		{
		  this.adapters[i].notifyChanged(notification);
		}
	};

	node.update = function()
	{
		//if (this.adapters[0])
		//	this.adapters[0].factory.ctx.redraw("xml3d::update");
 	};

	node.setField = function(event)
	{
		return org.xml3d.event.UNHANDLED;
	};

	node.evalMethod = function(evtMethod)
	{
		if (evtMethod)
			eval(evtMethod);
	};
};


/**
 * Object org.xml3d.classInfo.xml3d()
 *
 * @augments org.xml3d.classInfo.XML3DBaseType
 * @constructor
 * @see org.xml3d.classInfo.XML3DBaseType
 */
org.xml3d.classInfo.xml3d = function(node, context)
{
	org.xml3d.classInfo.Xml3dNode(node, context);

	node._id = org.xml3d.initString(node.getAttribute("id"), null);
	node._class = org.xml3d.initString(node.getAttribute("class"), null);
	node._style = org.xml3d.initString(node.getAttribute("style"), "");
	node._onclick = org.xml3d.initString(node.getAttribute("onclick"), "");
	node._ondblclick = org.xml3d.initString(node.getAttribute("ondblclick"), "");
	node._onmousedown = org.xml3d.initString(node.getAttribute("onmousedown"), "");
	node._onmouseup = org.xml3d.initString(node.getAttribute("onmouseup"), "");
	node._onmouseover = org.xml3d.initString(node.getAttribute("onmouseover"), "");
	node._onmousemove = org.xml3d.initString(node.getAttribute("onmousemove"), "");
	node._onmouseout = org.xml3d.initString(node.getAttribute("onmouseout"), "");
	node._onkeypress = org.xml3d.initString(node.getAttribute("onkeypress"), "");
	node._onkeydown = org.xml3d.initString(node.getAttribute("onkeydown"), "");
	node._onkeyup = org.xml3d.initString(node.getAttribute("onkeyup"), "");
	node._height = org.xml3d.initInt(node.getAttribute("height"), 600);
	node._width = org.xml3d.initInt(node.getAttribute("width"), 800);
	node.setOptionValue = function (name, value) {
		return false;
	};

	//node.definitionArea = [];
	//node.graph = [];
	
	
	
	node.__defineSetter__("id", function (value)
	{
		var oldValue = this._id;

		if(org.xml3d.isString(value))
		{
			this._id = value;
		}
		else
		{
			this._id = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.id))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "id", oldValue, this._id));
		}
	});

	node.__defineGetter__("id", function (value)
	{
		return this._id;
	});

	node.__defineSetter__("class", function (value)
	{
		var oldValue = this._class;

		if(org.xml3d.isString(value))
		{
			this._class = value;
		}
		else
		{
			this._class = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.class))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "class", oldValue, this._class));
		}
	});

	node.__defineGetter__("class", function (value)
	{
		return this._class;
	});

	node.__defineSetter__("style", function (value)
	{
		var oldValue = this._style;

		if(org.xml3d.isString(value))
		{
			this._style = value;
		}
		else
		{
			this._style = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.style))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "style", oldValue, this._style));
		}
	});

	node.__defineGetter__("style", function (value)
	{
		return this._style;
	});

	node.__defineSetter__("onclick", function (value)
	{
		var oldValue = this._onclick;

		if(org.xml3d.isString(value))
		{
			this._onclick = value;
		}
		else
		{
			this._onclick = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onclick))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onclick", oldValue, this._onclick));
		}
	});

	node.__defineGetter__("onclick", function (value)
	{
		return this._onclick;
	});

	node.__defineSetter__("ondblclick", function (value)
	{
		var oldValue = this._ondblclick;

		if(org.xml3d.isString(value))
		{
			this._ondblclick = value;
		}
		else
		{
			this._ondblclick = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.ondblclick))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "ondblclick", oldValue, this._ondblclick));
		}
	});

	node.__defineGetter__("ondblclick", function (value)
	{
		return this._ondblclick;
	});

	node.__defineSetter__("onmousedown", function (value)
	{
		var oldValue = this._onmousedown;

		if(org.xml3d.isString(value))
		{
			this._onmousedown = value;
		}
		else
		{
			this._onmousedown = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onmousedown))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onmousedown", oldValue, this._onmousedown));
		}
	});

	node.__defineGetter__("onmousedown", function (value)
	{
		return this._onmousedown;
	});

	node.__defineSetter__("onmouseup", function (value)
	{
		var oldValue = this._onmouseup;

		if(org.xml3d.isString(value))
		{
			this._onmouseup = value;
		}
		else
		{
			this._onmouseup = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onmouseup))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onmouseup", oldValue, this._onmouseup));
		}
	});

	node.__defineGetter__("onmouseup", function (value)
	{
		return this._onmouseup;
	});

	node.__defineSetter__("onmouseover", function (value)
	{
		var oldValue = this._onmouseover;

		if(org.xml3d.isString(value))
		{
			this._onmouseover = value;
		}
		else
		{
			this._onmouseover = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onmouseover))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onmouseover", oldValue, this._onmouseover));
		}
	});

	node.__defineGetter__("onmouseover", function (value)
	{
		return this._onmouseover;
	});

	node.__defineSetter__("onmousemove", function (value)
	{
		var oldValue = this._onmousemove;

		if(org.xml3d.isString(value))
		{
			this._onmousemove = value;
		}
		else
		{
			this._onmousemove = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onmousemove))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onmousemove", oldValue, this._onmousemove));
		}
	});

	node.__defineGetter__("onmousemove", function (value)
	{
		return this._onmousemove;
	});

	node.__defineSetter__("onmouseout", function (value)
	{
		var oldValue = this._onmouseout;

		if(org.xml3d.isString(value))
		{
			this._onmouseout = value;
		}
		else
		{
			this._onmouseout = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onmouseout))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onmouseout", oldValue, this._onmouseout));
		}
	});

	node.__defineGetter__("onmouseout", function (value)
	{
		return this._onmouseout;
	});

	node.__defineSetter__("onkeypress", function (value)
	{
		var oldValue = this._onkeypress;

		if(org.xml3d.isString(value))
		{
			this._onkeypress = value;
		}
		else
		{
			this._onkeypress = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onkeypress))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onkeypress", oldValue, this._onkeypress));
		}
	});

	node.__defineGetter__("onkeypress", function (value)
	{
		return this._onkeypress;
	});

	node.__defineSetter__("onkeydown", function (value)
	{
		var oldValue = this._onkeydown;

		if(org.xml3d.isString(value))
		{
			this._onkeydown = value;
		}
		else
		{
			this._onkeydown = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onkeydown))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onkeydown", oldValue, this._onkeydown));
		}
	});

	node.__defineGetter__("onkeydown", function (value)
	{
		return this._onkeydown;
	});

	node.__defineSetter__("onkeyup", function (value)
	{
		var oldValue = this._onkeyup;

		if(org.xml3d.isString(value))
		{
			this._onkeyup = value;
		}
		else
		{
			this._onkeyup = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onkeyup))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onkeyup", oldValue, this._onkeyup));
		}
	});

	node.__defineGetter__("onkeyup", function (value)
	{
		return this._onkeyup;
	});

	node.__defineSetter__("height", function (value)
	{
		var oldValue = this._height;

		if(org.xml3d.isInt(value))
		{
			this._height = value;
		}
		else
		{
			this._height = org.xml3d.initInt(value, 600);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.height))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "height", oldValue, this._height));
		}
	});

	node.__defineGetter__("height", function (value)
	{
		return this._height;
	});

	node.__defineSetter__("width", function (value)
	{
		var oldValue = this._width;

		if(org.xml3d.isInt(value))
		{
			this._width = value;
		}
		else
		{
			this._width = org.xml3d.initInt(value, 800);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.width))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "width", oldValue, this._width));
		}
	});

	node.__defineGetter__("width", function (value)
	{
		return this._width;
	});


	node.__defineSetter__("activeView", function (value)
	{
		var oldValue = this._activeView;
		
		if(org.xml3d.isString(value))
		{
			this.setAttribute("activeView", value);
		}
		else
		{
			this.setAttribute("activeView", org.xml3d.initString(value, ""));
		}

	    this._activeViewNode = null;

		if (this.notificationRequired() && ! isEqual(oldValue, this.activeView))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "activeView", oldValue, this.activeView));
		}
	});

	node.__defineGetter__("activeView", function (value)
	{
		return this.getAttribute("activeView");
	});

	node.resetAttribute = function(attrName)
	{
		if(attrName == "id")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.id = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "class")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.class = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "style")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.style = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onclick")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onclick = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "ondblclick")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.ondblclick = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onmousedown")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onmousedown = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onmouseup")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onmouseup = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onmouseover")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onmouseover = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onmousemove")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onmousemove = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onmouseout")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onmouseout = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onkeypress")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onkeypress = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onkeydown")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onkeydown = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onkeyup")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onkeyup = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "height")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.height = org.xml3d.initInt("", 600);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "width")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.width = org.xml3d.initInt("", 800);
			return org.xml3d.event.HANDLED;
		}

		if(attrName == "activeView")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.activeView = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}

		return org.xml3d.event.UNHANDLED;
	};

	node.getActiveViewNode = function()
	{
		if (!this._activeViewNode && this.hasAttribute("activeView"))
		{
		  this._activeViewNode = this.xml3ddocument.resolve(this.getAttribute("activeView"));
		}
		return this._activeViewNode;
	};


	// Node::setField
	node.setField = function(event)
	{
		if (event.attrName == "id")
		{
			this.id = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "class")
		{
			this.class = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "style")
		{
			this.style = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onclick")
		{
			this.onclick = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "ondblclick")
		{
			this.ondblclick = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onmousedown")
		{
			this.onmousedown = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onmouseup")
		{
			this.onmouseup = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onmouseover")
		{
			this.onmouseover = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onmousemove")
		{
			this.onmousemove = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onmouseout")
		{
			this.onmouseout = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onkeypress")
		{
			this.onkeypress = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onkeydown")
		{
			this.onkeydown = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onkeyup")
		{
			this.onkeyup = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "height")
		{
			this.height = org.xml3d.initInt(event.newValue, 600);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "width")
		{
			this.width = org.xml3d.initInt(event.newValue, 800);
			return org.xml3d.event.HANDLED;
		}

		if (event.attrName == "activeView")
		{
			this.activeView = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
	
		return org.xml3d.event.UNHANDLED;
	};

		node.createXML3DVec3 = org.xml3d.methods.xml3dCreateXML3DVec3;
		node.createXML3DRotation = org.xml3d.methods.xml3dCreateXML3DRotation;
		node.createXML3DMatrix = org.xml3d.methods.xml3dCreateXML3DMatrix;
		node.createXML3DRay = org.xml3d.methods.xml3dCreateXML3DRay;
		node.getElementByPoint = org.xml3d.methods.xml3dGetElementByPoint;
		node.generateRay = org.xml3d.methods.xml3dGenerateRay;
		node.getElementByRay = org.xml3d.methods.xml3dGetElementByRay;
		node.getBoundingBox = org.xml3d.methods.xml3dGetBoundingBox;

};
/**
 * Object org.xml3d.classInfo.data()
 *
 * @augments org.xml3d.classInfo.XML3DNestedDataContainerType
 * @constructor
 * @see org.xml3d.classInfo.XML3DNestedDataContainerType
 */
org.xml3d.classInfo.data = function(node, context)
{
	org.xml3d.classInfo.Xml3dNode(node, context);

	node._id = org.xml3d.initString(node.getAttribute("id"), null);
	node._class = org.xml3d.initString(node.getAttribute("class"), null);
	node._style = org.xml3d.initString(node.getAttribute("style"), "");
	node._map = org.xml3d.initString(node.getAttribute("map"), "");
	node._expose = org.xml3d.initString(node.getAttribute("expose"), "");

	//node.sources = [];
	//node.childContainers = [];
	
	
	
	node.__defineSetter__("id", function (value)
	{
		var oldValue = this._id;

		if(org.xml3d.isString(value))
		{
			this._id = value;
		}
		else
		{
			this._id = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.id))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "id", oldValue, this._id));
		}
	});

	node.__defineGetter__("id", function (value)
	{
		return this._id;
	});

	node.__defineSetter__("class", function (value)
	{
		var oldValue = this._class;

		if(org.xml3d.isString(value))
		{
			this._class = value;
		}
		else
		{
			this._class = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.class))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "class", oldValue, this._class));
		}
	});

	node.__defineGetter__("class", function (value)
	{
		return this._class;
	});

	node.__defineSetter__("style", function (value)
	{
		var oldValue = this._style;

		if(org.xml3d.isString(value))
		{
			this._style = value;
		}
		else
		{
			this._style = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.style))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "style", oldValue, this._style));
		}
	});

	node.__defineGetter__("style", function (value)
	{
		return this._style;
	});

	node.__defineSetter__("map", function (value)
	{
		var oldValue = this._map;

		if(org.xml3d.isString(value))
		{
			this._map = value;
		}
		else
		{
			this._map = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.map))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "map", oldValue, this._map));
		}
	});

	node.__defineGetter__("map", function (value)
	{
		return this._map;
	});

	node.__defineSetter__("expose", function (value)
	{
		var oldValue = this._expose;

		if(org.xml3d.isString(value))
		{
			this._expose = value;
		}
		else
		{
			this._expose = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.expose))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "expose", oldValue, this._expose));
		}
	});

	node.__defineGetter__("expose", function (value)
	{
		return this._expose;
	});


	node.__defineSetter__("src", function (value)
	{
		var oldValue = this._src;
		
		if(org.xml3d.isString(value))
		{
			this.setAttribute("src", value);
		}
		else
		{
			this.setAttribute("src", org.xml3d.initString(value, ""));
		}

	    this._srcNode = null;

		if (this.notificationRequired() && ! isEqual(oldValue, this.src))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "src", oldValue, this.src));
		}
	});

	node.__defineGetter__("src", function (value)
	{
		return this.getAttribute("src");
	});

	node.__defineSetter__("script", function (value)
	{
		var oldValue = this._script;
		
		if(org.xml3d.isString(value))
		{
			this.setAttribute("script", value);
		}
		else
		{
			this.setAttribute("script", org.xml3d.initString(value, ""));
		}

	    this._scriptNode = null;

		if (this.notificationRequired() && ! isEqual(oldValue, this.script))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "script", oldValue, this.script));
		}
	});

	node.__defineGetter__("script", function (value)
	{
		return this.getAttribute("script");
	});

	node.resetAttribute = function(attrName)
	{
		if(attrName == "id")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.id = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "class")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.class = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "style")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.style = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "map")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.map = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "expose")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.expose = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}

		if(attrName == "src")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.src = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "script")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.script = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}

		return org.xml3d.event.UNHANDLED;
	};

	node.getSrcNode = function()
	{
		if (!this._srcNode && this.hasAttribute("src"))
		{
		  this._srcNode = this.xml3ddocument.resolve(this.getAttribute("src"));
		}
		return this._srcNode;
	};

	node.getScriptNode = function()
	{
		if (!this._scriptNode && this.hasAttribute("script"))
		{
		  this._scriptNode = this.xml3ddocument.resolve(this.getAttribute("script"));
		}
		return this._scriptNode;
	};


	// Node::setField
	node.setField = function(event)
	{
		if (event.attrName == "id")
		{
			this.id = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "class")
		{
			this.class = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "style")
		{
			this.style = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "map")
		{
			this.map = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "expose")
		{
			this.expose = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}

		if (event.attrName == "src")
		{
			this.src = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "script")
		{
			this.script = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
	
		return org.xml3d.event.UNHANDLED;
	};


};
/**
 * Object org.xml3d.classInfo.defs()
 *
 * @augments org.xml3d.classInfo.XML3DBaseType
 * @constructor
 * @see org.xml3d.classInfo.XML3DBaseType
 */
org.xml3d.classInfo.defs = function(node, context)
{
	org.xml3d.classInfo.Xml3dNode(node, context);

	node._id = org.xml3d.initString(node.getAttribute("id"), null);
	node._class = org.xml3d.initString(node.getAttribute("class"), null);
	node._style = org.xml3d.initString(node.getAttribute("style"), "");

	//node.children = [];
	
	
	
	node.__defineSetter__("id", function (value)
	{
		var oldValue = this._id;

		if(org.xml3d.isString(value))
		{
			this._id = value;
		}
		else
		{
			this._id = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.id))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "id", oldValue, this._id));
		}
	});

	node.__defineGetter__("id", function (value)
	{
		return this._id;
	});

	node.__defineSetter__("class", function (value)
	{
		var oldValue = this._class;

		if(org.xml3d.isString(value))
		{
			this._class = value;
		}
		else
		{
			this._class = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.class))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "class", oldValue, this._class));
		}
	});

	node.__defineGetter__("class", function (value)
	{
		return this._class;
	});

	node.__defineSetter__("style", function (value)
	{
		var oldValue = this._style;

		if(org.xml3d.isString(value))
		{
			this._style = value;
		}
		else
		{
			this._style = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.style))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "style", oldValue, this._style));
		}
	});

	node.__defineGetter__("style", function (value)
	{
		return this._style;
	});


	node.resetAttribute = function(attrName)
	{
		if(attrName == "id")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.id = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "class")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.class = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "style")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.style = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}


		return org.xml3d.event.UNHANDLED;
	};


	// Node::setField
	node.setField = function(event)
	{
		if (event.attrName == "id")
		{
			this.id = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "class")
		{
			this.class = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "style")
		{
			this.style = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}

	
		return org.xml3d.event.UNHANDLED;
	};


};
/**
 * Object org.xml3d.classInfo.group()
 *
 * @augments org.xml3d.classInfo.XML3DGraphType
 * @constructor
 * @see org.xml3d.classInfo.XML3DGraphType
 */
org.xml3d.classInfo.group = function(node, context)
{
	org.xml3d.classInfo.Xml3dNode(node, context);

	node._id = org.xml3d.initString(node.getAttribute("id"), null);
	node._class = org.xml3d.initString(node.getAttribute("class"), null);
	node._style = org.xml3d.initString(node.getAttribute("style"), "");
	node._onclick = org.xml3d.initString(node.getAttribute("onclick"), "");
	node._ondblclick = org.xml3d.initString(node.getAttribute("ondblclick"), "");
	node._onmousedown = org.xml3d.initString(node.getAttribute("onmousedown"), "");
	node._onmouseup = org.xml3d.initString(node.getAttribute("onmouseup"), "");
	node._onmouseover = org.xml3d.initString(node.getAttribute("onmouseover"), "");
	node._onmousemove = org.xml3d.initString(node.getAttribute("onmousemove"), "");
	node._onmouseout = org.xml3d.initString(node.getAttribute("onmouseout"), "");
	node._onkeypress = org.xml3d.initString(node.getAttribute("onkeypress"), "");
	node._onkeydown = org.xml3d.initString(node.getAttribute("onkeydown"), "");
	node._onkeyup = org.xml3d.initString(node.getAttribute("onkeyup"), "");
	node._visible = org.xml3d.initBoolean(node.getAttribute("visible"), true);

	//node.children = [];
	//node.defs = [];
	
	
	
	node.__defineSetter__("id", function (value)
	{
		var oldValue = this._id;

		if(org.xml3d.isString(value))
		{
			this._id = value;
		}
		else
		{
			this._id = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.id))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "id", oldValue, this._id));
		}
	});

	node.__defineGetter__("id", function (value)
	{
		return this._id;
	});

	node.__defineSetter__("class", function (value)
	{
		var oldValue = this._class;

		if(org.xml3d.isString(value))
		{
			this._class = value;
		}
		else
		{
			this._class = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.class))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "class", oldValue, this._class));
		}
	});

	node.__defineGetter__("class", function (value)
	{
		return this._class;
	});

	node.__defineSetter__("style", function (value)
	{
		var oldValue = this._style;

		if(org.xml3d.isString(value))
		{
			this._style = value;
		}
		else
		{
			this._style = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.style))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "style", oldValue, this._style));
		}
	});

	node.__defineGetter__("style", function (value)
	{
		return this._style;
	});

	node.__defineSetter__("onclick", function (value)
	{
		var oldValue = this._onclick;

		if(org.xml3d.isString(value))
		{
			this._onclick = value;
		}
		else
		{
			this._onclick = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onclick))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onclick", oldValue, this._onclick));
		}
	});

	node.__defineGetter__("onclick", function (value)
	{
		return this._onclick;
	});

	node.__defineSetter__("ondblclick", function (value)
	{
		var oldValue = this._ondblclick;

		if(org.xml3d.isString(value))
		{
			this._ondblclick = value;
		}
		else
		{
			this._ondblclick = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.ondblclick))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "ondblclick", oldValue, this._ondblclick));
		}
	});

	node.__defineGetter__("ondblclick", function (value)
	{
		return this._ondblclick;
	});

	node.__defineSetter__("onmousedown", function (value)
	{
		var oldValue = this._onmousedown;

		if(org.xml3d.isString(value))
		{
			this._onmousedown = value;
		}
		else
		{
			this._onmousedown = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onmousedown))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onmousedown", oldValue, this._onmousedown));
		}
	});

	node.__defineGetter__("onmousedown", function (value)
	{
		return this._onmousedown;
	});

	node.__defineSetter__("onmouseup", function (value)
	{
		var oldValue = this._onmouseup;

		if(org.xml3d.isString(value))
		{
			this._onmouseup = value;
		}
		else
		{
			this._onmouseup = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onmouseup))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onmouseup", oldValue, this._onmouseup));
		}
	});

	node.__defineGetter__("onmouseup", function (value)
	{
		return this._onmouseup;
	});

	node.__defineSetter__("onmouseover", function (value)
	{
		var oldValue = this._onmouseover;

		if(org.xml3d.isString(value))
		{
			this._onmouseover = value;
		}
		else
		{
			this._onmouseover = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onmouseover))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onmouseover", oldValue, this._onmouseover));
		}
	});

	node.__defineGetter__("onmouseover", function (value)
	{
		return this._onmouseover;
	});

	node.__defineSetter__("onmousemove", function (value)
	{
		var oldValue = this._onmousemove;

		if(org.xml3d.isString(value))
		{
			this._onmousemove = value;
		}
		else
		{
			this._onmousemove = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onmousemove))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onmousemove", oldValue, this._onmousemove));
		}
	});

	node.__defineGetter__("onmousemove", function (value)
	{
		return this._onmousemove;
	});

	node.__defineSetter__("onmouseout", function (value)
	{
		var oldValue = this._onmouseout;

		if(org.xml3d.isString(value))
		{
			this._onmouseout = value;
		}
		else
		{
			this._onmouseout = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onmouseout))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onmouseout", oldValue, this._onmouseout));
		}
	});

	node.__defineGetter__("onmouseout", function (value)
	{
		return this._onmouseout;
	});

	node.__defineSetter__("onkeypress", function (value)
	{
		var oldValue = this._onkeypress;

		if(org.xml3d.isString(value))
		{
			this._onkeypress = value;
		}
		else
		{
			this._onkeypress = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onkeypress))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onkeypress", oldValue, this._onkeypress));
		}
	});

	node.__defineGetter__("onkeypress", function (value)
	{
		return this._onkeypress;
	});

	node.__defineSetter__("onkeydown", function (value)
	{
		var oldValue = this._onkeydown;

		if(org.xml3d.isString(value))
		{
			this._onkeydown = value;
		}
		else
		{
			this._onkeydown = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onkeydown))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onkeydown", oldValue, this._onkeydown));
		}
	});

	node.__defineGetter__("onkeydown", function (value)
	{
		return this._onkeydown;
	});

	node.__defineSetter__("onkeyup", function (value)
	{
		var oldValue = this._onkeyup;

		if(org.xml3d.isString(value))
		{
			this._onkeyup = value;
		}
		else
		{
			this._onkeyup = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onkeyup))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onkeyup", oldValue, this._onkeyup));
		}
	});

	node.__defineGetter__("onkeyup", function (value)
	{
		return this._onkeyup;
	});

	node.__defineSetter__("visible", function (value)
	{
		var oldValue = this._visible;

		if(org.xml3d.isBoolean(value))
		{
			this._visible = value;
		}
		else
		{
			this._visible = org.xml3d.initBoolean(value, true);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.visible))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "visible", oldValue, this._visible));
		}
	});

	node.__defineGetter__("visible", function (value)
	{
		return this._visible;
	});


	node.__defineSetter__("transform", function (value)
	{
		var oldValue = this._transform;
		
		if(org.xml3d.isString(value))
		{
			this.setAttribute("transform", value);
		}
		else
		{
			this.setAttribute("transform", org.xml3d.initString(value, ""));
		}

	    this._transformNode = null;

		if (this.notificationRequired() && ! isEqual(oldValue, this.transform))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "transform", oldValue, this.transform));
		}
	});

	node.__defineGetter__("transform", function (value)
	{
		return this.getAttribute("transform");
	});

	node.__defineSetter__("shader", function (value)
	{
		var oldValue = this._shader;
		
		if(org.xml3d.isString(value))
		{
			this.setAttribute("shader", value);
		}
		else
		{
			this.setAttribute("shader", org.xml3d.initString(value, ""));
		}

	    this._shaderNode = null;

		if (this.notificationRequired() && ! isEqual(oldValue, this.shader))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "shader", oldValue, this.shader));
		}
	});

	node.__defineGetter__("shader", function (value)
	{
		return this.getAttribute("shader");
	});

	node.resetAttribute = function(attrName)
	{
		if(attrName == "id")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.id = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "class")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.class = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "style")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.style = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onclick")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onclick = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "ondblclick")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.ondblclick = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onmousedown")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onmousedown = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onmouseup")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onmouseup = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onmouseover")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onmouseover = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onmousemove")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onmousemove = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onmouseout")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onmouseout = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onkeypress")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onkeypress = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onkeydown")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onkeydown = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onkeyup")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onkeyup = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "visible")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.visible = org.xml3d.initBoolean("", true);
			return org.xml3d.event.HANDLED;
		}

		if(attrName == "transform")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.transform = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "shader")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.shader = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}

		return org.xml3d.event.UNHANDLED;
	};

	node.getTransformNode = function()
	{
		if (!this._transformNode && this.hasAttribute("transform"))
		{
		  this._transformNode = this.xml3ddocument.resolve(this.getAttribute("transform"));
		}
		return this._transformNode;
	};

	node.getShaderNode = function()
	{
		if (!this._shaderNode && this.hasAttribute("shader"))
		{
		  this._shaderNode = this.xml3ddocument.resolve(this.getAttribute("shader"));
		}
		return this._shaderNode;
	};


	// Node::setField
	node.setField = function(event)
	{
		if (event.attrName == "id")
		{
			this.id = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "class")
		{
			this.class = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "style")
		{
			this.style = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onclick")
		{
			this.onclick = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "ondblclick")
		{
			this.ondblclick = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onmousedown")
		{
			this.onmousedown = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onmouseup")
		{
			this.onmouseup = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onmouseover")
		{
			this.onmouseover = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onmousemove")
		{
			this.onmousemove = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onmouseout")
		{
			this.onmouseout = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onkeypress")
		{
			this.onkeypress = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onkeydown")
		{
			this.onkeydown = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onkeyup")
		{
			this.onkeyup = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "visible")
		{
			this.visible = org.xml3d.initBoolean(event.newValue, true);
			return org.xml3d.event.HANDLED;
		}

		if (event.attrName == "transform")
		{
			this.transform = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "shader")
		{
			this.shader = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
	
		return org.xml3d.event.UNHANDLED;
	};

		node.getWorldMatrix = org.xml3d.methods.XML3DGraphTypeGetWorldMatrix;
		node.getLocalMatrix = org.xml3d.methods.groupGetLocalMatrix;
		node.getBoundingBox = org.xml3d.methods.groupGetBoundingBox;

};
/**
 * Object org.xml3d.classInfo.mesh()
 *
 * @augments org.xml3d.classInfo.XML3DGeometryType
 * @constructor
 * @see org.xml3d.classInfo.XML3DGeometryType
 */
org.xml3d.classInfo.mesh = function(node, context)
{
	org.xml3d.classInfo.Xml3dNode(node, context);

	node._id = org.xml3d.initString(node.getAttribute("id"), null);
	node._class = org.xml3d.initString(node.getAttribute("class"), null);
	node._style = org.xml3d.initString(node.getAttribute("style"), "");
	node._onclick = org.xml3d.initString(node.getAttribute("onclick"), "");
	node._ondblclick = org.xml3d.initString(node.getAttribute("ondblclick"), "");
	node._onmousedown = org.xml3d.initString(node.getAttribute("onmousedown"), "");
	node._onmouseup = org.xml3d.initString(node.getAttribute("onmouseup"), "");
	node._onmouseover = org.xml3d.initString(node.getAttribute("onmouseover"), "");
	node._onmousemove = org.xml3d.initString(node.getAttribute("onmousemove"), "");
	node._onmouseout = org.xml3d.initString(node.getAttribute("onmouseout"), "");
	node._onkeypress = org.xml3d.initString(node.getAttribute("onkeypress"), "");
	node._onkeydown = org.xml3d.initString(node.getAttribute("onkeydown"), "");
	node._onkeyup = org.xml3d.initString(node.getAttribute("onkeyup"), "");
	node._visible = org.xml3d.initBoolean(node.getAttribute("visible"), true);
	node._type = org.xml3d.initEnum(node.getAttribute("type"), 0, org.xml3d.MeshTypes);

	//node.sources = [];
	//node.childContainers = [];
	
	
	
	node.__defineSetter__("id", function (value)
	{
		var oldValue = this._id;

		if(org.xml3d.isString(value))
		{
			this._id = value;
		}
		else
		{
			this._id = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.id))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "id", oldValue, this._id));
		}
	});

	node.__defineGetter__("id", function (value)
	{
		return this._id;
	});

	node.__defineSetter__("class", function (value)
	{
		var oldValue = this._class;

		if(org.xml3d.isString(value))
		{
			this._class = value;
		}
		else
		{
			this._class = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.class))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "class", oldValue, this._class));
		}
	});

	node.__defineGetter__("class", function (value)
	{
		return this._class;
	});

	node.__defineSetter__("style", function (value)
	{
		var oldValue = this._style;

		if(org.xml3d.isString(value))
		{
			this._style = value;
		}
		else
		{
			this._style = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.style))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "style", oldValue, this._style));
		}
	});

	node.__defineGetter__("style", function (value)
	{
		return this._style;
	});

	node.__defineSetter__("onclick", function (value)
	{
		var oldValue = this._onclick;

		if(org.xml3d.isString(value))
		{
			this._onclick = value;
		}
		else
		{
			this._onclick = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onclick))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onclick", oldValue, this._onclick));
		}
	});

	node.__defineGetter__("onclick", function (value)
	{
		return this._onclick;
	});

	node.__defineSetter__("ondblclick", function (value)
	{
		var oldValue = this._ondblclick;

		if(org.xml3d.isString(value))
		{
			this._ondblclick = value;
		}
		else
		{
			this._ondblclick = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.ondblclick))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "ondblclick", oldValue, this._ondblclick));
		}
	});

	node.__defineGetter__("ondblclick", function (value)
	{
		return this._ondblclick;
	});

	node.__defineSetter__("onmousedown", function (value)
	{
		var oldValue = this._onmousedown;

		if(org.xml3d.isString(value))
		{
			this._onmousedown = value;
		}
		else
		{
			this._onmousedown = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onmousedown))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onmousedown", oldValue, this._onmousedown));
		}
	});

	node.__defineGetter__("onmousedown", function (value)
	{
		return this._onmousedown;
	});

	node.__defineSetter__("onmouseup", function (value)
	{
		var oldValue = this._onmouseup;

		if(org.xml3d.isString(value))
		{
			this._onmouseup = value;
		}
		else
		{
			this._onmouseup = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onmouseup))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onmouseup", oldValue, this._onmouseup));
		}
	});

	node.__defineGetter__("onmouseup", function (value)
	{
		return this._onmouseup;
	});

	node.__defineSetter__("onmouseover", function (value)
	{
		var oldValue = this._onmouseover;

		if(org.xml3d.isString(value))
		{
			this._onmouseover = value;
		}
		else
		{
			this._onmouseover = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onmouseover))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onmouseover", oldValue, this._onmouseover));
		}
	});

	node.__defineGetter__("onmouseover", function (value)
	{
		return this._onmouseover;
	});

	node.__defineSetter__("onmousemove", function (value)
	{
		var oldValue = this._onmousemove;

		if(org.xml3d.isString(value))
		{
			this._onmousemove = value;
		}
		else
		{
			this._onmousemove = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onmousemove))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onmousemove", oldValue, this._onmousemove));
		}
	});

	node.__defineGetter__("onmousemove", function (value)
	{
		return this._onmousemove;
	});

	node.__defineSetter__("onmouseout", function (value)
	{
		var oldValue = this._onmouseout;

		if(org.xml3d.isString(value))
		{
			this._onmouseout = value;
		}
		else
		{
			this._onmouseout = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onmouseout))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onmouseout", oldValue, this._onmouseout));
		}
	});

	node.__defineGetter__("onmouseout", function (value)
	{
		return this._onmouseout;
	});

	node.__defineSetter__("onkeypress", function (value)
	{
		var oldValue = this._onkeypress;

		if(org.xml3d.isString(value))
		{
			this._onkeypress = value;
		}
		else
		{
			this._onkeypress = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onkeypress))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onkeypress", oldValue, this._onkeypress));
		}
	});

	node.__defineGetter__("onkeypress", function (value)
	{
		return this._onkeypress;
	});

	node.__defineSetter__("onkeydown", function (value)
	{
		var oldValue = this._onkeydown;

		if(org.xml3d.isString(value))
		{
			this._onkeydown = value;
		}
		else
		{
			this._onkeydown = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onkeydown))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onkeydown", oldValue, this._onkeydown));
		}
	});

	node.__defineGetter__("onkeydown", function (value)
	{
		return this._onkeydown;
	});

	node.__defineSetter__("onkeyup", function (value)
	{
		var oldValue = this._onkeyup;

		if(org.xml3d.isString(value))
		{
			this._onkeyup = value;
		}
		else
		{
			this._onkeyup = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onkeyup))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onkeyup", oldValue, this._onkeyup));
		}
	});

	node.__defineGetter__("onkeyup", function (value)
	{
		return this._onkeyup;
	});

	node.__defineSetter__("visible", function (value)
	{
		var oldValue = this._visible;

		if(org.xml3d.isBoolean(value))
		{
			this._visible = value;
		}
		else
		{
			this._visible = org.xml3d.initBoolean(value, true);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.visible))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "visible", oldValue, this._visible));
		}
	});

	node.__defineGetter__("visible", function (value)
	{
		return this._visible;
	});

	node.__defineSetter__("type", function (value)
	{
		var oldValue = this._type;

		if(org.xml3d.isEnum(value, org.xml3d.MeshTypes))
		{
			this._type = value;
		}
		else
		{
			this._type = org.xml3d.initEnum(value, 0, org.xml3d.MeshTypes);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.type))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "type", oldValue, this._type));
		}
	});

	node.__defineGetter__("type", function (value)
	{
		return this._type;
	});


	node.__defineSetter__("src", function (value)
	{
		var oldValue = this._src;
		
		if(org.xml3d.isString(value))
		{
			this.setAttribute("src", value);
		}
		else
		{
			this.setAttribute("src", org.xml3d.initString(value, ""));
		}

	    this._srcNode = null;

		if (this.notificationRequired() && ! isEqual(oldValue, this.src))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "src", oldValue, this.src));
		}
	});

	node.__defineGetter__("src", function (value)
	{
		return this.getAttribute("src");
	});

	node.resetAttribute = function(attrName)
	{
		if(attrName == "id")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.id = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "class")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.class = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "style")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.style = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onclick")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onclick = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "ondblclick")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.ondblclick = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onmousedown")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onmousedown = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onmouseup")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onmouseup = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onmouseover")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onmouseover = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onmousemove")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onmousemove = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onmouseout")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onmouseout = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onkeypress")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onkeypress = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onkeydown")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onkeydown = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onkeyup")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onkeyup = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "visible")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.visible = org.xml3d.initBoolean("", true);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "type")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.type = org.xml3d.initEnum("", 0, org.xml3d.MeshTypes);
			return org.xml3d.event.HANDLED;
		}

		if(attrName == "src")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.src = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}

		return org.xml3d.event.UNHANDLED;
	};

	node.getSrcNode = function()
	{
		if (!this._srcNode && this.hasAttribute("src"))
		{
		  this._srcNode = this.xml3ddocument.resolve(this.getAttribute("src"));
		}
		return this._srcNode;
	};


	// Node::setField
	node.setField = function(event)
	{
		if (event.attrName == "id")
		{
			this.id = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "class")
		{
			this.class = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "style")
		{
			this.style = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onclick")
		{
			this.onclick = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "ondblclick")
		{
			this.ondblclick = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onmousedown")
		{
			this.onmousedown = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onmouseup")
		{
			this.onmouseup = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onmouseover")
		{
			this.onmouseover = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onmousemove")
		{
			this.onmousemove = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onmouseout")
		{
			this.onmouseout = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onkeypress")
		{
			this.onkeypress = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onkeydown")
		{
			this.onkeydown = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onkeyup")
		{
			this.onkeyup = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "visible")
		{
			this.visible = org.xml3d.initBoolean(event.newValue, true);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "type")
		{
			this.type = org.xml3d.initEnum(event.newValue, 0, org.xml3d.MeshTypes);
			return org.xml3d.event.HANDLED;
		}

		if (event.attrName == "src")
		{
			this.src = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
	
		return org.xml3d.event.UNHANDLED;
	};

		node.getWorldMatrix = org.xml3d.methods.XML3DGraphTypeGetWorldMatrix;
		node.getBoundingBox = org.xml3d.methods.meshGetBoundingBox;

};
/**
 * Object org.xml3d.classInfo.transform()
 *
 * @augments org.xml3d.classInfo.XML3DTransformProviderType
 * @constructor
 * @see org.xml3d.classInfo.XML3DTransformProviderType
 */
org.xml3d.classInfo.transform = function(node, context)
{
	org.xml3d.classInfo.Xml3dNode(node, context);

	node._id = org.xml3d.initString(node.getAttribute("id"), null);
	node._class = org.xml3d.initString(node.getAttribute("class"), null);
	node._style = org.xml3d.initString(node.getAttribute("style"), "");
	node._translation = org.xml3d.initXML3DVec3(node.getAttribute("translation"), 0, 0, 0);
	if(node._translation != null)
	{
		node._translation.setOwnerNode("translation", node);
	}
	node._scale = org.xml3d.initXML3DVec3(node.getAttribute("scale"), 1, 1, 1);
	if(node._scale != null)
	{
		node._scale.setOwnerNode("scale", node);
	}
	node._rotation = org.xml3d.initXML3DRotation(node.getAttribute("rotation"), 0, 0, 1, 0);
	if(node._rotation != null)
	{
		node._rotation.setOwnerNode("rotation", node);
	}
	node._center = org.xml3d.initXML3DVec3(node.getAttribute("center"), 0, 0, 0);
	if(node._center != null)
	{
		node._center.setOwnerNode("center", node);
	}
	node._scaleOrientation = org.xml3d.initXML3DRotation(node.getAttribute("scaleOrientation"), 0, 0, 1, 0);
	if(node._scaleOrientation != null)
	{
		node._scaleOrientation.setOwnerNode("scaleOrientation", node);
	}

	
	
	
	node.__defineSetter__("id", function (value)
	{
		var oldValue = this._id;

		if(org.xml3d.isString(value))
		{
			this._id = value;
		}
		else
		{
			this._id = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.id))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "id", oldValue, this._id));
		}
	});

	node.__defineGetter__("id", function (value)
	{
		return this._id;
	});

	node.__defineSetter__("class", function (value)
	{
		var oldValue = this._class;

		if(org.xml3d.isString(value))
		{
			this._class = value;
		}
		else
		{
			this._class = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.class))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "class", oldValue, this._class));
		}
	});

	node.__defineGetter__("class", function (value)
	{
		return this._class;
	});

	node.__defineSetter__("style", function (value)
	{
		var oldValue = this._style;

		if(org.xml3d.isString(value))
		{
			this._style = value;
		}
		else
		{
			this._style = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.style))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "style", oldValue, this._style));
		}
	});

	node.__defineGetter__("style", function (value)
	{
		return this._style;
	});

	node.__defineSetter__("translation", function (value)
	{
		var oldValue = this._translation;

		if(org.xml3d.isXML3DVec3(value))
		{
			this._translation = value;
		}
		else
		{
			this._translation = org.xml3d.initXML3DVec3(value, 0, 0, 0);
		}

	    if(this._translation != null)
		{
			this._translation.setOwnerNode("translation", this);
		}		

		if (this.notificationRequired() && ! isEqual(oldValue,this.translation))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "translation", oldValue, this._translation));
		}
	});

	node.__defineGetter__("translation", function (value)
	{
		return this._translation;
	});

	node.__defineSetter__("scale", function (value)
	{
		var oldValue = this._scale;

		if(org.xml3d.isXML3DVec3(value))
		{
			this._scale = value;
		}
		else
		{
			this._scale = org.xml3d.initXML3DVec3(value, 1, 1, 1);
		}

	    if(this._scale != null)
		{
			this._scale.setOwnerNode("scale", this);
		}		

		if (this.notificationRequired() && ! isEqual(oldValue,this.scale))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "scale", oldValue, this._scale));
		}
	});

	node.__defineGetter__("scale", function (value)
	{
		return this._scale;
	});

	node.__defineSetter__("rotation", function (value)
	{
		var oldValue = this._rotation;

		if(org.xml3d.isXML3DRotation(value))
		{
			this._rotation = value;
		}
		else
		{
			this._rotation = org.xml3d.initXML3DRotation(value, 0, 0, 1, 0);
		}

	    if(this._rotation != null)
		{
			this._rotation.setOwnerNode("rotation", this);
		}		

		if (this.notificationRequired() && ! isEqual(oldValue,this.rotation))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "rotation", oldValue, this._rotation));
		}
	});

	node.__defineGetter__("rotation", function (value)
	{
		return this._rotation;
	});

	node.__defineSetter__("center", function (value)
	{
		var oldValue = this._center;

		if(org.xml3d.isXML3DVec3(value))
		{
			this._center = value;
		}
		else
		{
			this._center = org.xml3d.initXML3DVec3(value, 0, 0, 0);
		}

	    if(this._center != null)
		{
			this._center.setOwnerNode("center", this);
		}		

		if (this.notificationRequired() && ! isEqual(oldValue,this.center))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "center", oldValue, this._center));
		}
	});

	node.__defineGetter__("center", function (value)
	{
		return this._center;
	});

	node.__defineSetter__("scaleOrientation", function (value)
	{
		var oldValue = this._scaleOrientation;

		if(org.xml3d.isXML3DRotation(value))
		{
			this._scaleOrientation = value;
		}
		else
		{
			this._scaleOrientation = org.xml3d.initXML3DRotation(value, 0, 0, 1, 0);
		}

	    if(this._scaleOrientation != null)
		{
			this._scaleOrientation.setOwnerNode("scaleOrientation", this);
		}		

		if (this.notificationRequired() && ! isEqual(oldValue,this.scaleOrientation))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "scaleOrientation", oldValue, this._scaleOrientation));
		}
	});

	node.__defineGetter__("scaleOrientation", function (value)
	{
		return this._scaleOrientation;
	});


	node.resetAttribute = function(attrName)
	{
		if(attrName == "id")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.id = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "class")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.class = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "style")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.style = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "translation")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.translation = org.xml3d.initXML3DVec3("", 0, 0, 0);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "scale")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.scale = org.xml3d.initXML3DVec3("", 1, 1, 1);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "rotation")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.rotation = org.xml3d.initXML3DRotation("", 0, 0, 1, 0);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "center")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.center = org.xml3d.initXML3DVec3("", 0, 0, 0);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "scaleOrientation")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.scaleOrientation = org.xml3d.initXML3DRotation("", 0, 0, 1, 0);
			return org.xml3d.event.HANDLED;
		}


		return org.xml3d.event.UNHANDLED;
	};


	// Node::setField
	node.setField = function(event)
	{
		if (event.attrName == "id")
		{
			this.id = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "class")
		{
			this.class = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "style")
		{
			this.style = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "translation")
		{
			this.translation = org.xml3d.initXML3DVec3(event.newValue, 0, 0, 0);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "scale")
		{
			this.scale = org.xml3d.initXML3DVec3(event.newValue, 1, 1, 1);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "rotation")
		{
			this.rotation = org.xml3d.initXML3DRotation(event.newValue, 0, 0, 1, 0);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "center")
		{
			this.center = org.xml3d.initXML3DVec3(event.newValue, 0, 0, 0);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "scaleOrientation")
		{
			this.scaleOrientation = org.xml3d.initXML3DRotation(event.newValue, 0, 0, 1, 0);
			return org.xml3d.event.HANDLED;
		}

	
		return org.xml3d.event.UNHANDLED;
	};


};
/**
 * Object org.xml3d.classInfo.shader()
 *
 * @augments org.xml3d.classInfo.XML3DSurfaceShaderProviderType
 * @constructor
 * @see org.xml3d.classInfo.XML3DSurfaceShaderProviderType
 */
org.xml3d.classInfo.shader = function(node, context)
{
	org.xml3d.classInfo.Xml3dNode(node, context);

	node._id = org.xml3d.initString(node.getAttribute("id"), null);
	node._class = org.xml3d.initString(node.getAttribute("class"), null);
	node._style = org.xml3d.initString(node.getAttribute("style"), "");

	//node.sources = [];
	//node.childContainers = [];
	
	
	
	node.__defineSetter__("id", function (value)
	{
		var oldValue = this._id;

		if(org.xml3d.isString(value))
		{
			this._id = value;
		}
		else
		{
			this._id = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.id))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "id", oldValue, this._id));
		}
	});

	node.__defineGetter__("id", function (value)
	{
		return this._id;
	});

	node.__defineSetter__("class", function (value)
	{
		var oldValue = this._class;

		if(org.xml3d.isString(value))
		{
			this._class = value;
		}
		else
		{
			this._class = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.class))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "class", oldValue, this._class));
		}
	});

	node.__defineGetter__("class", function (value)
	{
		return this._class;
	});

	node.__defineSetter__("style", function (value)
	{
		var oldValue = this._style;

		if(org.xml3d.isString(value))
		{
			this._style = value;
		}
		else
		{
			this._style = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.style))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "style", oldValue, this._style));
		}
	});

	node.__defineGetter__("style", function (value)
	{
		return this._style;
	});


	node.__defineSetter__("script", function (value)
	{
		var oldValue = this._script;
		
		if(org.xml3d.isString(value))
		{
			this.setAttribute("script", value);
		}
		else
		{
			this.setAttribute("script", org.xml3d.initString(value, ""));
		}

	    this._scriptNode = null;

		if (this.notificationRequired() && ! isEqual(oldValue, this.script))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "script", oldValue, this.script));
		}
	});

	node.__defineGetter__("script", function (value)
	{
		return this.getAttribute("script");
	});

	node.__defineSetter__("src", function (value)
	{
		var oldValue = this._src;
		
		if(org.xml3d.isString(value))
		{
			this.setAttribute("src", value);
		}
		else
		{
			this.setAttribute("src", org.xml3d.initString(value, ""));
		}

	    this._srcNode = null;

		if (this.notificationRequired() && ! isEqual(oldValue, this.src))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "src", oldValue, this.src));
		}
	});

	node.__defineGetter__("src", function (value)
	{
		return this.getAttribute("src");
	});

	node.resetAttribute = function(attrName)
	{
		if(attrName == "id")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.id = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "class")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.class = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "style")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.style = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}

		if(attrName == "script")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.script = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "src")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.src = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}

		return org.xml3d.event.UNHANDLED;
	};

	node.getScriptNode = function()
	{
		if (!this._scriptNode && this.hasAttribute("script"))
		{
		  this._scriptNode = this.xml3ddocument.resolve(this.getAttribute("script"));
		}
		return this._scriptNode;
	};

	node.getSrcNode = function()
	{
		if (!this._srcNode && this.hasAttribute("src"))
		{
		  this._srcNode = this.xml3ddocument.resolve(this.getAttribute("src"));
		}
		return this._srcNode;
	};


	// Node::setField
	node.setField = function(event)
	{
		if (event.attrName == "id")
		{
			this.id = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "class")
		{
			this.class = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "style")
		{
			this.style = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}

		if (event.attrName == "script")
		{
			this.script = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "src")
		{
			this.src = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
	
		return org.xml3d.event.UNHANDLED;
	};


};
/**
 * Object org.xml3d.classInfo.light()
 *
 * @augments org.xml3d.classInfo.XML3DGraphType
 * @constructor
 * @see org.xml3d.classInfo.XML3DGraphType
 */
org.xml3d.classInfo.light = function(node, context)
{
	org.xml3d.classInfo.Xml3dNode(node, context);

	node._id = org.xml3d.initString(node.getAttribute("id"), null);
	node._class = org.xml3d.initString(node.getAttribute("class"), null);
	node._style = org.xml3d.initString(node.getAttribute("style"), "");
	node._onclick = org.xml3d.initString(node.getAttribute("onclick"), "");
	node._ondblclick = org.xml3d.initString(node.getAttribute("ondblclick"), "");
	node._onmousedown = org.xml3d.initString(node.getAttribute("onmousedown"), "");
	node._onmouseup = org.xml3d.initString(node.getAttribute("onmouseup"), "");
	node._onmouseover = org.xml3d.initString(node.getAttribute("onmouseover"), "");
	node._onmousemove = org.xml3d.initString(node.getAttribute("onmousemove"), "");
	node._onmouseout = org.xml3d.initString(node.getAttribute("onmouseout"), "");
	node._onkeypress = org.xml3d.initString(node.getAttribute("onkeypress"), "");
	node._onkeydown = org.xml3d.initString(node.getAttribute("onkeydown"), "");
	node._onkeyup = org.xml3d.initString(node.getAttribute("onkeyup"), "");
	node._visible = org.xml3d.initBoolean(node.getAttribute("visible"), true);
	node._global = org.xml3d.initBoolean(node.getAttribute("global"), false);
	node._intensity = org.xml3d.initFloat(node.getAttribute("intensity"), 1);

	
	
	
	node.__defineSetter__("id", function (value)
	{
		var oldValue = this._id;

		if(org.xml3d.isString(value))
		{
			this._id = value;
		}
		else
		{
			this._id = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.id))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "id", oldValue, this._id));
		}
	});

	node.__defineGetter__("id", function (value)
	{
		return this._id;
	});

	node.__defineSetter__("class", function (value)
	{
		var oldValue = this._class;

		if(org.xml3d.isString(value))
		{
			this._class = value;
		}
		else
		{
			this._class = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.class))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "class", oldValue, this._class));
		}
	});

	node.__defineGetter__("class", function (value)
	{
		return this._class;
	});

	node.__defineSetter__("style", function (value)
	{
		var oldValue = this._style;

		if(org.xml3d.isString(value))
		{
			this._style = value;
		}
		else
		{
			this._style = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.style))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "style", oldValue, this._style));
		}
	});

	node.__defineGetter__("style", function (value)
	{
		return this._style;
	});

	node.__defineSetter__("onclick", function (value)
	{
		var oldValue = this._onclick;

		if(org.xml3d.isString(value))
		{
			this._onclick = value;
		}
		else
		{
			this._onclick = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onclick))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onclick", oldValue, this._onclick));
		}
	});

	node.__defineGetter__("onclick", function (value)
	{
		return this._onclick;
	});

	node.__defineSetter__("ondblclick", function (value)
	{
		var oldValue = this._ondblclick;

		if(org.xml3d.isString(value))
		{
			this._ondblclick = value;
		}
		else
		{
			this._ondblclick = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.ondblclick))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "ondblclick", oldValue, this._ondblclick));
		}
	});

	node.__defineGetter__("ondblclick", function (value)
	{
		return this._ondblclick;
	});

	node.__defineSetter__("onmousedown", function (value)
	{
		var oldValue = this._onmousedown;

		if(org.xml3d.isString(value))
		{
			this._onmousedown = value;
		}
		else
		{
			this._onmousedown = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onmousedown))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onmousedown", oldValue, this._onmousedown));
		}
	});

	node.__defineGetter__("onmousedown", function (value)
	{
		return this._onmousedown;
	});

	node.__defineSetter__("onmouseup", function (value)
	{
		var oldValue = this._onmouseup;

		if(org.xml3d.isString(value))
		{
			this._onmouseup = value;
		}
		else
		{
			this._onmouseup = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onmouseup))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onmouseup", oldValue, this._onmouseup));
		}
	});

	node.__defineGetter__("onmouseup", function (value)
	{
		return this._onmouseup;
	});

	node.__defineSetter__("onmouseover", function (value)
	{
		var oldValue = this._onmouseover;

		if(org.xml3d.isString(value))
		{
			this._onmouseover = value;
		}
		else
		{
			this._onmouseover = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onmouseover))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onmouseover", oldValue, this._onmouseover));
		}
	});

	node.__defineGetter__("onmouseover", function (value)
	{
		return this._onmouseover;
	});

	node.__defineSetter__("onmousemove", function (value)
	{
		var oldValue = this._onmousemove;

		if(org.xml3d.isString(value))
		{
			this._onmousemove = value;
		}
		else
		{
			this._onmousemove = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onmousemove))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onmousemove", oldValue, this._onmousemove));
		}
	});

	node.__defineGetter__("onmousemove", function (value)
	{
		return this._onmousemove;
	});

	node.__defineSetter__("onmouseout", function (value)
	{
		var oldValue = this._onmouseout;

		if(org.xml3d.isString(value))
		{
			this._onmouseout = value;
		}
		else
		{
			this._onmouseout = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onmouseout))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onmouseout", oldValue, this._onmouseout));
		}
	});

	node.__defineGetter__("onmouseout", function (value)
	{
		return this._onmouseout;
	});

	node.__defineSetter__("onkeypress", function (value)
	{
		var oldValue = this._onkeypress;

		if(org.xml3d.isString(value))
		{
			this._onkeypress = value;
		}
		else
		{
			this._onkeypress = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onkeypress))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onkeypress", oldValue, this._onkeypress));
		}
	});

	node.__defineGetter__("onkeypress", function (value)
	{
		return this._onkeypress;
	});

	node.__defineSetter__("onkeydown", function (value)
	{
		var oldValue = this._onkeydown;

		if(org.xml3d.isString(value))
		{
			this._onkeydown = value;
		}
		else
		{
			this._onkeydown = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onkeydown))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onkeydown", oldValue, this._onkeydown));
		}
	});

	node.__defineGetter__("onkeydown", function (value)
	{
		return this._onkeydown;
	});

	node.__defineSetter__("onkeyup", function (value)
	{
		var oldValue = this._onkeyup;

		if(org.xml3d.isString(value))
		{
			this._onkeyup = value;
		}
		else
		{
			this._onkeyup = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onkeyup))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onkeyup", oldValue, this._onkeyup));
		}
	});

	node.__defineGetter__("onkeyup", function (value)
	{
		return this._onkeyup;
	});

	node.__defineSetter__("visible", function (value)
	{
		var oldValue = this._visible;

		if(org.xml3d.isBoolean(value))
		{
			this._visible = value;
		}
		else
		{
			this._visible = org.xml3d.initBoolean(value, true);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.visible))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "visible", oldValue, this._visible));
		}
	});

	node.__defineGetter__("visible", function (value)
	{
		return this._visible;
	});

	node.__defineSetter__("global", function (value)
	{
		var oldValue = this._global;

		if(org.xml3d.isBoolean(value))
		{
			this._global = value;
		}
		else
		{
			this._global = org.xml3d.initBoolean(value, false);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.global))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "global", oldValue, this._global));
		}
	});

	node.__defineGetter__("global", function (value)
	{
		return this._global;
	});

	node.__defineSetter__("intensity", function (value)
	{
		var oldValue = this._intensity;

		if(org.xml3d.isFloat(value))
		{
			this._intensity = value;
		}
		else
		{
			this._intensity = org.xml3d.initFloat(value, 1);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.intensity))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "intensity", oldValue, this._intensity));
		}
	});

	node.__defineGetter__("intensity", function (value)
	{
		return this._intensity;
	});


	node.__defineSetter__("shader", function (value)
	{
		var oldValue = this._shader;
		
		if(org.xml3d.isString(value))
		{
			this.setAttribute("shader", value);
		}
		else
		{
			this.setAttribute("shader", org.xml3d.initString(value, ""));
		}

	    this._shaderNode = null;

		if (this.notificationRequired() && ! isEqual(oldValue, this.shader))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "shader", oldValue, this.shader));
		}
	});

	node.__defineGetter__("shader", function (value)
	{
		return this.getAttribute("shader");
	});

	node.resetAttribute = function(attrName)
	{
		if(attrName == "id")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.id = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "class")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.class = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "style")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.style = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onclick")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onclick = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "ondblclick")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.ondblclick = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onmousedown")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onmousedown = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onmouseup")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onmouseup = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onmouseover")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onmouseover = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onmousemove")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onmousemove = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onmouseout")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onmouseout = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onkeypress")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onkeypress = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onkeydown")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onkeydown = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onkeyup")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onkeyup = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "visible")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.visible = org.xml3d.initBoolean("", true);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "global")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.global = org.xml3d.initBoolean("", false);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "intensity")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.intensity = org.xml3d.initFloat("", 1);
			return org.xml3d.event.HANDLED;
		}

		if(attrName == "shader")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.shader = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}

		return org.xml3d.event.UNHANDLED;
	};

	node.getShaderNode = function()
	{
		if (!this._shaderNode && this.hasAttribute("shader"))
		{
		  this._shaderNode = this.xml3ddocument.resolve(this.getAttribute("shader"));
		}
		return this._shaderNode;
	};


	// Node::setField
	node.setField = function(event)
	{
		if (event.attrName == "id")
		{
			this.id = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "class")
		{
			this.class = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "style")
		{
			this.style = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onclick")
		{
			this.onclick = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "ondblclick")
		{
			this.ondblclick = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onmousedown")
		{
			this.onmousedown = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onmouseup")
		{
			this.onmouseup = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onmouseover")
		{
			this.onmouseover = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onmousemove")
		{
			this.onmousemove = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onmouseout")
		{
			this.onmouseout = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onkeypress")
		{
			this.onkeypress = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onkeydown")
		{
			this.onkeydown = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onkeyup")
		{
			this.onkeyup = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "visible")
		{
			this.visible = org.xml3d.initBoolean(event.newValue, true);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "global")
		{
			this.global = org.xml3d.initBoolean(event.newValue, false);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "intensity")
		{
			this.intensity = org.xml3d.initFloat(event.newValue, 1);
			return org.xml3d.event.HANDLED;
		}

		if (event.attrName == "shader")
		{
			this.shader = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
	
		return org.xml3d.event.UNHANDLED;
	};

		node.getWorldMatrix = org.xml3d.methods.XML3DGraphTypeGetWorldMatrix;

};
/**
 * Object org.xml3d.classInfo.lightshader()
 *
 * @augments org.xml3d.classInfo.XML3DLightShaderProviderType
 * @constructor
 * @see org.xml3d.classInfo.XML3DLightShaderProviderType
 */
org.xml3d.classInfo.lightshader = function(node, context)
{
	org.xml3d.classInfo.Xml3dNode(node, context);

	node._id = org.xml3d.initString(node.getAttribute("id"), null);
	node._class = org.xml3d.initString(node.getAttribute("class"), null);
	node._style = org.xml3d.initString(node.getAttribute("style"), "");

	//node.sources = [];
	//node.childContainers = [];
	
	
	
	node.__defineSetter__("id", function (value)
	{
		var oldValue = this._id;

		if(org.xml3d.isString(value))
		{
			this._id = value;
		}
		else
		{
			this._id = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.id))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "id", oldValue, this._id));
		}
	});

	node.__defineGetter__("id", function (value)
	{
		return this._id;
	});

	node.__defineSetter__("class", function (value)
	{
		var oldValue = this._class;

		if(org.xml3d.isString(value))
		{
			this._class = value;
		}
		else
		{
			this._class = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.class))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "class", oldValue, this._class));
		}
	});

	node.__defineGetter__("class", function (value)
	{
		return this._class;
	});

	node.__defineSetter__("style", function (value)
	{
		var oldValue = this._style;

		if(org.xml3d.isString(value))
		{
			this._style = value;
		}
		else
		{
			this._style = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.style))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "style", oldValue, this._style));
		}
	});

	node.__defineGetter__("style", function (value)
	{
		return this._style;
	});


	node.__defineSetter__("script", function (value)
	{
		var oldValue = this._script;
		
		if(org.xml3d.isString(value))
		{
			this.setAttribute("script", value);
		}
		else
		{
			this.setAttribute("script", org.xml3d.initString(value, ""));
		}

	    this._scriptNode = null;

		if (this.notificationRequired() && ! isEqual(oldValue, this.script))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "script", oldValue, this.script));
		}
	});

	node.__defineGetter__("script", function (value)
	{
		return this.getAttribute("script");
	});

	node.__defineSetter__("src", function (value)
	{
		var oldValue = this._src;
		
		if(org.xml3d.isString(value))
		{
			this.setAttribute("src", value);
		}
		else
		{
			this.setAttribute("src", org.xml3d.initString(value, ""));
		}

	    this._srcNode = null;

		if (this.notificationRequired() && ! isEqual(oldValue, this.src))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "src", oldValue, this.src));
		}
	});

	node.__defineGetter__("src", function (value)
	{
		return this.getAttribute("src");
	});

	node.resetAttribute = function(attrName)
	{
		if(attrName == "id")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.id = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "class")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.class = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "style")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.style = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}

		if(attrName == "script")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.script = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "src")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.src = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}

		return org.xml3d.event.UNHANDLED;
	};

	node.getScriptNode = function()
	{
		if (!this._scriptNode && this.hasAttribute("script"))
		{
		  this._scriptNode = this.xml3ddocument.resolve(this.getAttribute("script"));
		}
		return this._scriptNode;
	};

	node.getSrcNode = function()
	{
		if (!this._srcNode && this.hasAttribute("src"))
		{
		  this._srcNode = this.xml3ddocument.resolve(this.getAttribute("src"));
		}
		return this._srcNode;
	};


	// Node::setField
	node.setField = function(event)
	{
		if (event.attrName == "id")
		{
			this.id = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "class")
		{
			this.class = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "style")
		{
			this.style = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}

		if (event.attrName == "script")
		{
			this.script = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "src")
		{
			this.src = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
	
		return org.xml3d.event.UNHANDLED;
	};


};
/**
 * Object org.xml3d.classInfo.script()
 *
 * @augments org.xml3d.classInfo.XML3DReferenceableType
 * @constructor
 * @see org.xml3d.classInfo.XML3DReferenceableType
 */
org.xml3d.classInfo.script = function(node, context)
{
	org.xml3d.classInfo.Xml3dNode(node, context);

	node._id = org.xml3d.initString(node.getAttribute("id"), null);
	node._class = org.xml3d.initString(node.getAttribute("class"), null);
	node._style = org.xml3d.initString(node.getAttribute("style"), "");
	node.value = org.xml3d.initString(node.getTextContent(), null);
	node._src = org.xml3d.initString(node.getAttribute("src"), "");
	node._type = org.xml3d.initString(node.getAttribute("type"), "");

	
	
	
	node.__defineSetter__("id", function (value)
	{
		var oldValue = this._id;

		if(org.xml3d.isString(value))
		{
			this._id = value;
		}
		else
		{
			this._id = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.id))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "id", oldValue, this._id));
		}
	});

	node.__defineGetter__("id", function (value)
	{
		return this._id;
	});

	node.__defineSetter__("class", function (value)
	{
		var oldValue = this._class;

		if(org.xml3d.isString(value))
		{
			this._class = value;
		}
		else
		{
			this._class = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.class))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "class", oldValue, this._class));
		}
	});

	node.__defineGetter__("class", function (value)
	{
		return this._class;
	});

	node.__defineSetter__("style", function (value)
	{
		var oldValue = this._style;

		if(org.xml3d.isString(value))
		{
			this._style = value;
		}
		else
		{
			this._style = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.style))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "style", oldValue, this._style));
		}
	});

	node.__defineGetter__("style", function (value)
	{
		return this._style;
	});

	// TODO: Setter for mixed value
	node.setValue = function(e)
	{
		var oldValue = this.value;
		this.value = org.xml3d.initString(e.newValue, null);

		if (this.parentNode.notificationRequired() && ! isEqual(oldValue,this.value))
		{
	    	this.parentNode.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "value", oldValue, this.value));
		}
	};
	node.__defineSetter__("src", function (value)
	{
		var oldValue = this._src;

		if(org.xml3d.isString(value))
		{
			this._src = value;
		}
		else
		{
			this._src = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.src))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "src", oldValue, this._src));
		}
	});

	node.__defineGetter__("src", function (value)
	{
		return this._src;
	});

	node.__defineSetter__("type", function (value)
	{
		var oldValue = this._type;

		if(org.xml3d.isString(value))
		{
			this._type = value;
		}
		else
		{
			this._type = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.type))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "type", oldValue, this._type));
		}
	});

	node.__defineGetter__("type", function (value)
	{
		return this._type;
	});


	node.resetAttribute = function(attrName)
	{
		if(attrName == "id")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.id = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "class")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.class = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "style")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.style = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "src")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.src = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "type")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.type = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}


		return org.xml3d.event.UNHANDLED;
	};


	// Node::setField
	node.setField = function(event)
	{
		if (event.attrName == "id")
		{
			this.id = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "class")
		{
			this.class = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "style")
		{
			this.style = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "src")
		{
			this.src = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "type")
		{
			this.type = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}

	
		return org.xml3d.event.UNHANDLED;
	};


};
/**
 * Object org.xml3d.classInfo.float()
 *
 * @augments org.xml3d.classInfo.XML3DDataSourceType
 * @constructor
 * @see org.xml3d.classInfo.XML3DDataSourceType
 */
org.xml3d.classInfo.float = function(node, context)
{
	org.xml3d.classInfo.Xml3dNode(node, context);

	node._id = org.xml3d.initString(node.getAttribute("id"), null);
	node._class = org.xml3d.initString(node.getAttribute("class"), null);
	node._style = org.xml3d.initString(node.getAttribute("style"), "");
	node._name = org.xml3d.initString(node.getAttribute("name"), "");
	node.value = org.xml3d.initFloatArray(node.getTextContent(), null);

	
	
	
	node.__defineSetter__("id", function (value)
	{
		var oldValue = this._id;

		if(org.xml3d.isString(value))
		{
			this._id = value;
		}
		else
		{
			this._id = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.id))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "id", oldValue, this._id));
		}
	});

	node.__defineGetter__("id", function (value)
	{
		return this._id;
	});

	node.__defineSetter__("class", function (value)
	{
		var oldValue = this._class;

		if(org.xml3d.isString(value))
		{
			this._class = value;
		}
		else
		{
			this._class = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.class))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "class", oldValue, this._class));
		}
	});

	node.__defineGetter__("class", function (value)
	{
		return this._class;
	});

	node.__defineSetter__("style", function (value)
	{
		var oldValue = this._style;

		if(org.xml3d.isString(value))
		{
			this._style = value;
		}
		else
		{
			this._style = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.style))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "style", oldValue, this._style));
		}
	});

	node.__defineGetter__("style", function (value)
	{
		return this._style;
	});

	node.__defineSetter__("name", function (value)
	{
		var oldValue = this._name;

		if(org.xml3d.isString(value))
		{
			this._name = value;
		}
		else
		{
			this._name = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.name))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "name", oldValue, this._name));
		}
	});

	node.__defineGetter__("name", function (value)
	{
		return this._name;
	});

	// TODO: Setter for mixed value
	node.setValue = function(e)
	{
		var oldValue = this.value;
		this.value = org.xml3d.initFloatArray(e.newValue, null);

		if (this.parentNode.notificationRequired() && ! isEqual(oldValue,this.value))
		{
	    	this.parentNode.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "value", oldValue, this.value));
		}
	};

	node.resetAttribute = function(attrName)
	{
		if(attrName == "id")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.id = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "class")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.class = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "style")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.style = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "name")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.name = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}


		return org.xml3d.event.UNHANDLED;
	};


	// Node::setField
	node.setField = function(event)
	{
		if (event.attrName == "id")
		{
			this.id = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "class")
		{
			this.class = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "style")
		{
			this.style = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "name")
		{
			this.name = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}

	
		return org.xml3d.event.UNHANDLED;
	};


};
/**
 * Object org.xml3d.classInfo.float2()
 *
 * @augments org.xml3d.classInfo.XML3DDataSourceType
 * @constructor
 * @see org.xml3d.classInfo.XML3DDataSourceType
 */
org.xml3d.classInfo.float2 = function(node, context)
{
	org.xml3d.classInfo.Xml3dNode(node, context);

	node._id = org.xml3d.initString(node.getAttribute("id"), null);
	node._class = org.xml3d.initString(node.getAttribute("class"), null);
	node._style = org.xml3d.initString(node.getAttribute("style"), "");
	node._name = org.xml3d.initString(node.getAttribute("name"), "");
	node.value = org.xml3d.initFloat2Array(node.getTextContent(), null);

	
	
	
	node.__defineSetter__("id", function (value)
	{
		var oldValue = this._id;

		if(org.xml3d.isString(value))
		{
			this._id = value;
		}
		else
		{
			this._id = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.id))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "id", oldValue, this._id));
		}
	});

	node.__defineGetter__("id", function (value)
	{
		return this._id;
	});

	node.__defineSetter__("class", function (value)
	{
		var oldValue = this._class;

		if(org.xml3d.isString(value))
		{
			this._class = value;
		}
		else
		{
			this._class = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.class))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "class", oldValue, this._class));
		}
	});

	node.__defineGetter__("class", function (value)
	{
		return this._class;
	});

	node.__defineSetter__("style", function (value)
	{
		var oldValue = this._style;

		if(org.xml3d.isString(value))
		{
			this._style = value;
		}
		else
		{
			this._style = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.style))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "style", oldValue, this._style));
		}
	});

	node.__defineGetter__("style", function (value)
	{
		return this._style;
	});

	node.__defineSetter__("name", function (value)
	{
		var oldValue = this._name;

		if(org.xml3d.isString(value))
		{
			this._name = value;
		}
		else
		{
			this._name = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.name))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "name", oldValue, this._name));
		}
	});

	node.__defineGetter__("name", function (value)
	{
		return this._name;
	});

	// TODO: Setter for mixed value
	node.setValue = function(e)
	{
		var oldValue = this.value;
		this.value = org.xml3d.initFloat2Array(e.newValue, null);

		if (this.parentNode.notificationRequired() && ! isEqual(oldValue,this.value))
		{
	    	this.parentNode.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "value", oldValue, this.value));
		}
	};

	node.resetAttribute = function(attrName)
	{
		if(attrName == "id")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.id = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "class")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.class = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "style")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.style = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "name")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.name = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}


		return org.xml3d.event.UNHANDLED;
	};


	// Node::setField
	node.setField = function(event)
	{
		if (event.attrName == "id")
		{
			this.id = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "class")
		{
			this.class = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "style")
		{
			this.style = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "name")
		{
			this.name = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}

	
		return org.xml3d.event.UNHANDLED;
	};


};
/**
 * Object org.xml3d.classInfo.float3()
 *
 * @augments org.xml3d.classInfo.XML3DDataSourceType
 * @constructor
 * @see org.xml3d.classInfo.XML3DDataSourceType
 */
org.xml3d.classInfo.float3 = function(node, context)
{
	org.xml3d.classInfo.Xml3dNode(node, context);

	node._id = org.xml3d.initString(node.getAttribute("id"), null);
	node._class = org.xml3d.initString(node.getAttribute("class"), null);
	node._style = org.xml3d.initString(node.getAttribute("style"), "");
	node._name = org.xml3d.initString(node.getAttribute("name"), "");
	node.value = org.xml3d.initFloat3Array(node.getTextContent(), null);

	
	
	
	node.__defineSetter__("id", function (value)
	{
		var oldValue = this._id;

		if(org.xml3d.isString(value))
		{
			this._id = value;
		}
		else
		{
			this._id = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.id))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "id", oldValue, this._id));
		}
	});

	node.__defineGetter__("id", function (value)
	{
		return this._id;
	});

	node.__defineSetter__("class", function (value)
	{
		var oldValue = this._class;

		if(org.xml3d.isString(value))
		{
			this._class = value;
		}
		else
		{
			this._class = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.class))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "class", oldValue, this._class));
		}
	});

	node.__defineGetter__("class", function (value)
	{
		return this._class;
	});

	node.__defineSetter__("style", function (value)
	{
		var oldValue = this._style;

		if(org.xml3d.isString(value))
		{
			this._style = value;
		}
		else
		{
			this._style = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.style))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "style", oldValue, this._style));
		}
	});

	node.__defineGetter__("style", function (value)
	{
		return this._style;
	});

	node.__defineSetter__("name", function (value)
	{
		var oldValue = this._name;

		if(org.xml3d.isString(value))
		{
			this._name = value;
		}
		else
		{
			this._name = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.name))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "name", oldValue, this._name));
		}
	});

	node.__defineGetter__("name", function (value)
	{
		return this._name;
	});

	// TODO: Setter for mixed value
	node.setValue = function(e)
	{
		var oldValue = this.value;
		this.value = org.xml3d.initFloat3Array(e.newValue, null);

		if (this.parentNode.notificationRequired() && ! isEqual(oldValue,this.value))
		{
	    	this.parentNode.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "value", oldValue, this.value));
		}
	};

	node.resetAttribute = function(attrName)
	{
		if(attrName == "id")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.id = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "class")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.class = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "style")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.style = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "name")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.name = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}


		return org.xml3d.event.UNHANDLED;
	};


	// Node::setField
	node.setField = function(event)
	{
		if (event.attrName == "id")
		{
			this.id = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "class")
		{
			this.class = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "style")
		{
			this.style = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "name")
		{
			this.name = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}

	
		return org.xml3d.event.UNHANDLED;
	};


};
/**
 * Object org.xml3d.classInfo.float4()
 *
 * @augments org.xml3d.classInfo.XML3DDataSourceType
 * @constructor
 * @see org.xml3d.classInfo.XML3DDataSourceType
 */
org.xml3d.classInfo.float4 = function(node, context)
{
	org.xml3d.classInfo.Xml3dNode(node, context);

	node._id = org.xml3d.initString(node.getAttribute("id"), null);
	node._class = org.xml3d.initString(node.getAttribute("class"), null);
	node._style = org.xml3d.initString(node.getAttribute("style"), "");
	node._name = org.xml3d.initString(node.getAttribute("name"), "");
	node.value = org.xml3d.initFloat4Array(node.getTextContent(), null);

	
	
	
	node.__defineSetter__("id", function (value)
	{
		var oldValue = this._id;

		if(org.xml3d.isString(value))
		{
			this._id = value;
		}
		else
		{
			this._id = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.id))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "id", oldValue, this._id));
		}
	});

	node.__defineGetter__("id", function (value)
	{
		return this._id;
	});

	node.__defineSetter__("class", function (value)
	{
		var oldValue = this._class;

		if(org.xml3d.isString(value))
		{
			this._class = value;
		}
		else
		{
			this._class = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.class))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "class", oldValue, this._class));
		}
	});

	node.__defineGetter__("class", function (value)
	{
		return this._class;
	});

	node.__defineSetter__("style", function (value)
	{
		var oldValue = this._style;

		if(org.xml3d.isString(value))
		{
			this._style = value;
		}
		else
		{
			this._style = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.style))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "style", oldValue, this._style));
		}
	});

	node.__defineGetter__("style", function (value)
	{
		return this._style;
	});

	node.__defineSetter__("name", function (value)
	{
		var oldValue = this._name;

		if(org.xml3d.isString(value))
		{
			this._name = value;
		}
		else
		{
			this._name = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.name))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "name", oldValue, this._name));
		}
	});

	node.__defineGetter__("name", function (value)
	{
		return this._name;
	});

	// TODO: Setter for mixed value
	node.setValue = function(e)
	{
		var oldValue = this.value;
		this.value = org.xml3d.initFloat4Array(e.newValue, null);

		if (this.parentNode.notificationRequired() && ! isEqual(oldValue,this.value))
		{
	    	this.parentNode.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "value", oldValue, this.value));
		}
	};

	node.resetAttribute = function(attrName)
	{
		if(attrName == "id")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.id = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "class")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.class = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "style")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.style = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "name")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.name = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}


		return org.xml3d.event.UNHANDLED;
	};


	// Node::setField
	node.setField = function(event)
	{
		if (event.attrName == "id")
		{
			this.id = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "class")
		{
			this.class = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "style")
		{
			this.style = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "name")
		{
			this.name = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}

	
		return org.xml3d.event.UNHANDLED;
	};


};
/**
 * Object org.xml3d.classInfo.float4x4()
 *
 * @augments org.xml3d.classInfo.XML3DDataSourceType
 * @constructor
 * @see org.xml3d.classInfo.XML3DDataSourceType
 */
org.xml3d.classInfo.float4x4 = function(node, context)
{
	org.xml3d.classInfo.Xml3dNode(node, context);

	node._id = org.xml3d.initString(node.getAttribute("id"), null);
	node._class = org.xml3d.initString(node.getAttribute("class"), null);
	node._style = org.xml3d.initString(node.getAttribute("style"), "");
	node._name = org.xml3d.initString(node.getAttribute("name"), "");
	node.value = org.xml3d.initFloat4x4Array(node.getTextContent(), []);

	
	
	
	node.__defineSetter__("id", function (value)
	{
		var oldValue = this._id;

		if(org.xml3d.isString(value))
		{
			this._id = value;
		}
		else
		{
			this._id = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.id))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "id", oldValue, this._id));
		}
	});

	node.__defineGetter__("id", function (value)
	{
		return this._id;
	});

	node.__defineSetter__("class", function (value)
	{
		var oldValue = this._class;

		if(org.xml3d.isString(value))
		{
			this._class = value;
		}
		else
		{
			this._class = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.class))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "class", oldValue, this._class));
		}
	});

	node.__defineGetter__("class", function (value)
	{
		return this._class;
	});

	node.__defineSetter__("style", function (value)
	{
		var oldValue = this._style;

		if(org.xml3d.isString(value))
		{
			this._style = value;
		}
		else
		{
			this._style = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.style))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "style", oldValue, this._style));
		}
	});

	node.__defineGetter__("style", function (value)
	{
		return this._style;
	});

	node.__defineSetter__("name", function (value)
	{
		var oldValue = this._name;

		if(org.xml3d.isString(value))
		{
			this._name = value;
		}
		else
		{
			this._name = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.name))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "name", oldValue, this._name));
		}
	});

	node.__defineGetter__("name", function (value)
	{
		return this._name;
	});

	// TODO: Setter for mixed value
	node.setValue = function(e)
	{
		var oldValue = this.value;
		this.value = org.xml3d.initFloat4x4Array(e.newValue, []);

		if (this.parentNode.notificationRequired() && ! isEqual(oldValue,this.value))
		{
	    	this.parentNode.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "value", oldValue, this.value));
		}
	};

	node.resetAttribute = function(attrName)
	{
		if(attrName == "id")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.id = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "class")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.class = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "style")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.style = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "name")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.name = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}


		return org.xml3d.event.UNHANDLED;
	};


	// Node::setField
	node.setField = function(event)
	{
		if (event.attrName == "id")
		{
			this.id = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "class")
		{
			this.class = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "style")
		{
			this.style = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "name")
		{
			this.name = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}

	
		return org.xml3d.event.UNHANDLED;
	};


};
/**
 * Object org.xml3d.classInfo.int()
 *
 * @augments org.xml3d.classInfo.XML3DDataSourceType
 * @constructor
 * @see org.xml3d.classInfo.XML3DDataSourceType
 */
org.xml3d.classInfo.int = function(node, context)
{
	org.xml3d.classInfo.Xml3dNode(node, context);

	node._id = org.xml3d.initString(node.getAttribute("id"), null);
	node._class = org.xml3d.initString(node.getAttribute("class"), null);
	node._style = org.xml3d.initString(node.getAttribute("style"), "");
	node._name = org.xml3d.initString(node.getAttribute("name"), "");
	node.value = org.xml3d.initIntArray(node.getTextContent(), null);

	
	
	
	node.__defineSetter__("id", function (value)
	{
		var oldValue = this._id;

		if(org.xml3d.isString(value))
		{
			this._id = value;
		}
		else
		{
			this._id = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.id))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "id", oldValue, this._id));
		}
	});

	node.__defineGetter__("id", function (value)
	{
		return this._id;
	});

	node.__defineSetter__("class", function (value)
	{
		var oldValue = this._class;

		if(org.xml3d.isString(value))
		{
			this._class = value;
		}
		else
		{
			this._class = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.class))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "class", oldValue, this._class));
		}
	});

	node.__defineGetter__("class", function (value)
	{
		return this._class;
	});

	node.__defineSetter__("style", function (value)
	{
		var oldValue = this._style;

		if(org.xml3d.isString(value))
		{
			this._style = value;
		}
		else
		{
			this._style = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.style))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "style", oldValue, this._style));
		}
	});

	node.__defineGetter__("style", function (value)
	{
		return this._style;
	});

	node.__defineSetter__("name", function (value)
	{
		var oldValue = this._name;

		if(org.xml3d.isString(value))
		{
			this._name = value;
		}
		else
		{
			this._name = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.name))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "name", oldValue, this._name));
		}
	});

	node.__defineGetter__("name", function (value)
	{
		return this._name;
	});

	// TODO: Setter for mixed value
	node.setValue = function(e)
	{
		var oldValue = this.value;
		this.value = org.xml3d.initIntArray(e.newValue, null);

		if (this.parentNode.notificationRequired() && ! isEqual(oldValue,this.value))
		{
	    	this.parentNode.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "value", oldValue, this.value));
		}
	};

	node.resetAttribute = function(attrName)
	{
		if(attrName == "id")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.id = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "class")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.class = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "style")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.style = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "name")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.name = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}


		return org.xml3d.event.UNHANDLED;
	};


	// Node::setField
	node.setField = function(event)
	{
		if (event.attrName == "id")
		{
			this.id = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "class")
		{
			this.class = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "style")
		{
			this.style = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "name")
		{
			this.name = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}

	
		return org.xml3d.event.UNHANDLED;
	};


};
/**
 * Object org.xml3d.classInfo.bool()
 *
 * @augments org.xml3d.classInfo.XML3DDataSourceType
 * @constructor
 * @see org.xml3d.classInfo.XML3DDataSourceType
 */
org.xml3d.classInfo.bool = function(node, context)
{
	org.xml3d.classInfo.Xml3dNode(node, context);

	node._id = org.xml3d.initString(node.getAttribute("id"), null);
	node._class = org.xml3d.initString(node.getAttribute("class"), null);
	node._style = org.xml3d.initString(node.getAttribute("style"), "");
	node._name = org.xml3d.initString(node.getAttribute("name"), "");
	node.value = org.xml3d.initBoolArray(node.getTextContent(), null);

	
	
	
	node.__defineSetter__("id", function (value)
	{
		var oldValue = this._id;

		if(org.xml3d.isString(value))
		{
			this._id = value;
		}
		else
		{
			this._id = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.id))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "id", oldValue, this._id));
		}
	});

	node.__defineGetter__("id", function (value)
	{
		return this._id;
	});

	node.__defineSetter__("class", function (value)
	{
		var oldValue = this._class;

		if(org.xml3d.isString(value))
		{
			this._class = value;
		}
		else
		{
			this._class = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.class))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "class", oldValue, this._class));
		}
	});

	node.__defineGetter__("class", function (value)
	{
		return this._class;
	});

	node.__defineSetter__("style", function (value)
	{
		var oldValue = this._style;

		if(org.xml3d.isString(value))
		{
			this._style = value;
		}
		else
		{
			this._style = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.style))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "style", oldValue, this._style));
		}
	});

	node.__defineGetter__("style", function (value)
	{
		return this._style;
	});

	node.__defineSetter__("name", function (value)
	{
		var oldValue = this._name;

		if(org.xml3d.isString(value))
		{
			this._name = value;
		}
		else
		{
			this._name = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.name))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "name", oldValue, this._name));
		}
	});

	node.__defineGetter__("name", function (value)
	{
		return this._name;
	});

	// TODO: Setter for mixed value
	node.setValue = function(e)
	{
		var oldValue = this.value;
		this.value = org.xml3d.initBoolArray(e.newValue, null);

		if (this.parentNode.notificationRequired() && ! isEqual(oldValue,this.value))
		{
	    	this.parentNode.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "value", oldValue, this.value));
		}
	};

	node.resetAttribute = function(attrName)
	{
		if(attrName == "id")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.id = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "class")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.class = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "style")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.style = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "name")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.name = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}


		return org.xml3d.event.UNHANDLED;
	};


	// Node::setField
	node.setField = function(event)
	{
		if (event.attrName == "id")
		{
			this.id = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "class")
		{
			this.class = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "style")
		{
			this.style = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "name")
		{
			this.name = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}

	
		return org.xml3d.event.UNHANDLED;
	};


};
/**
 * Object org.xml3d.classInfo.texture()
 *
 * @augments org.xml3d.classInfo.XML3DDataSourceType
 * @constructor
 * @see org.xml3d.classInfo.XML3DDataSourceType
 */
org.xml3d.classInfo.texture = function(node, context)
{
	org.xml3d.classInfo.Xml3dNode(node, context);

	node._id = org.xml3d.initString(node.getAttribute("id"), null);
	node._class = org.xml3d.initString(node.getAttribute("class"), null);
	node._style = org.xml3d.initString(node.getAttribute("style"), "");
	node._name = org.xml3d.initString(node.getAttribute("name"), "");
	node._type = org.xml3d.initEnum(node.getAttribute("type"), 0, org.xml3d.TextureTypes);
	node._filterMin = org.xml3d.initEnum(node.getAttribute("filterMin"), 2, org.xml3d.FilterTypes);
	node._filterMag = org.xml3d.initEnum(node.getAttribute("filterMag"), 2, org.xml3d.FilterTypes);
	node._filterMip = org.xml3d.initEnum(node.getAttribute("filterMip"), 1, org.xml3d.FilterTypes);
	node._wrapS = org.xml3d.initEnum(node.getAttribute("wrapS"), 0, org.xml3d.WrapTypes);
	node._wrapT = org.xml3d.initEnum(node.getAttribute("wrapT"), 0, org.xml3d.WrapTypes);
	node._wrapU = org.xml3d.initEnum(node.getAttribute("wrapU"), 0, org.xml3d.WrapTypes);
	node._borderColor = org.xml3d.initString(node.getAttribute("borderColor"), "");

	
	
	
	node.__defineSetter__("id", function (value)
	{
		var oldValue = this._id;

		if(org.xml3d.isString(value))
		{
			this._id = value;
		}
		else
		{
			this._id = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.id))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "id", oldValue, this._id));
		}
	});

	node.__defineGetter__("id", function (value)
	{
		return this._id;
	});

	node.__defineSetter__("class", function (value)
	{
		var oldValue = this._class;

		if(org.xml3d.isString(value))
		{
			this._class = value;
		}
		else
		{
			this._class = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.class))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "class", oldValue, this._class));
		}
	});

	node.__defineGetter__("class", function (value)
	{
		return this._class;
	});

	node.__defineSetter__("style", function (value)
	{
		var oldValue = this._style;

		if(org.xml3d.isString(value))
		{
			this._style = value;
		}
		else
		{
			this._style = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.style))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "style", oldValue, this._style));
		}
	});

	node.__defineGetter__("style", function (value)
	{
		return this._style;
	});

	node.__defineSetter__("name", function (value)
	{
		var oldValue = this._name;

		if(org.xml3d.isString(value))
		{
			this._name = value;
		}
		else
		{
			this._name = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.name))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "name", oldValue, this._name));
		}
	});

	node.__defineGetter__("name", function (value)
	{
		return this._name;
	});

	node.__defineSetter__("type", function (value)
	{
		var oldValue = this._type;

		if(org.xml3d.isEnum(value, org.xml3d.TextureTypes))
		{
			this._type = value;
		}
		else
		{
			this._type = org.xml3d.initEnum(value, 0, org.xml3d.TextureTypes);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.type))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "type", oldValue, this._type));
		}
	});

	node.__defineGetter__("type", function (value)
	{
		return this._type;
	});

	node.__defineSetter__("filterMin", function (value)
	{
		var oldValue = this._filterMin;

		if(org.xml3d.isEnum(value, org.xml3d.FilterTypes))
		{
			this._filterMin = value;
		}
		else
		{
			this._filterMin = org.xml3d.initEnum(value, 2, org.xml3d.FilterTypes);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.filterMin))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "filterMin", oldValue, this._filterMin));
		}
	});

	node.__defineGetter__("filterMin", function (value)
	{
		return this._filterMin;
	});

	node.__defineSetter__("filterMag", function (value)
	{
		var oldValue = this._filterMag;

		if(org.xml3d.isEnum(value, org.xml3d.FilterTypes))
		{
			this._filterMag = value;
		}
		else
		{
			this._filterMag = org.xml3d.initEnum(value, 2, org.xml3d.FilterTypes);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.filterMag))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "filterMag", oldValue, this._filterMag));
		}
	});

	node.__defineGetter__("filterMag", function (value)
	{
		return this._filterMag;
	});

	node.__defineSetter__("filterMip", function (value)
	{
		var oldValue = this._filterMip;

		if(org.xml3d.isEnum(value, org.xml3d.FilterTypes))
		{
			this._filterMip = value;
		}
		else
		{
			this._filterMip = org.xml3d.initEnum(value, 1, org.xml3d.FilterTypes);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.filterMip))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "filterMip", oldValue, this._filterMip));
		}
	});

	node.__defineGetter__("filterMip", function (value)
	{
		return this._filterMip;
	});

	node.__defineSetter__("wrapS", function (value)
	{
		var oldValue = this._wrapS;

		if(org.xml3d.isEnum(value, org.xml3d.WrapTypes))
		{
			this._wrapS = value;
		}
		else
		{
			this._wrapS = org.xml3d.initEnum(value, 0, org.xml3d.WrapTypes);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.wrapS))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "wrapS", oldValue, this._wrapS));
		}
	});

	node.__defineGetter__("wrapS", function (value)
	{
		return this._wrapS;
	});

	node.__defineSetter__("wrapT", function (value)
	{
		var oldValue = this._wrapT;

		if(org.xml3d.isEnum(value, org.xml3d.WrapTypes))
		{
			this._wrapT = value;
		}
		else
		{
			this._wrapT = org.xml3d.initEnum(value, 0, org.xml3d.WrapTypes);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.wrapT))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "wrapT", oldValue, this._wrapT));
		}
	});

	node.__defineGetter__("wrapT", function (value)
	{
		return this._wrapT;
	});

	node.__defineSetter__("wrapU", function (value)
	{
		var oldValue = this._wrapU;

		if(org.xml3d.isEnum(value, org.xml3d.WrapTypes))
		{
			this._wrapU = value;
		}
		else
		{
			this._wrapU = org.xml3d.initEnum(value, 0, org.xml3d.WrapTypes);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.wrapU))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "wrapU", oldValue, this._wrapU));
		}
	});

	node.__defineGetter__("wrapU", function (value)
	{
		return this._wrapU;
	});

	node.__defineSetter__("borderColor", function (value)
	{
		var oldValue = this._borderColor;

		if(org.xml3d.isString(value))
		{
			this._borderColor = value;
		}
		else
		{
			this._borderColor = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.borderColor))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "borderColor", oldValue, this._borderColor));
		}
	});

	node.__defineGetter__("borderColor", function (value)
	{
		return this._borderColor;
	});


	node.resetAttribute = function(attrName)
	{
		if(attrName == "id")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.id = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "class")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.class = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "style")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.style = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "name")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.name = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "type")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.type = org.xml3d.initEnum("", 0, org.xml3d.TextureTypes);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "filterMin")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.filterMin = org.xml3d.initEnum("", 2, org.xml3d.FilterTypes);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "filterMag")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.filterMag = org.xml3d.initEnum("", 2, org.xml3d.FilterTypes);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "filterMip")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.filterMip = org.xml3d.initEnum("", 1, org.xml3d.FilterTypes);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "wrapS")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.wrapS = org.xml3d.initEnum("", 0, org.xml3d.WrapTypes);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "wrapT")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.wrapT = org.xml3d.initEnum("", 0, org.xml3d.WrapTypes);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "wrapU")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.wrapU = org.xml3d.initEnum("", 0, org.xml3d.WrapTypes);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "borderColor")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.borderColor = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}


		return org.xml3d.event.UNHANDLED;
	};


	// Node::setField
	node.setField = function(event)
	{
		if (event.attrName == "id")
		{
			this.id = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "class")
		{
			this.class = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "style")
		{
			this.style = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "name")
		{
			this.name = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "type")
		{
			this.type = org.xml3d.initEnum(event.newValue, 0, org.xml3d.TextureTypes);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "filterMin")
		{
			this.filterMin = org.xml3d.initEnum(event.newValue, 2, org.xml3d.FilterTypes);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "filterMag")
		{
			this.filterMag = org.xml3d.initEnum(event.newValue, 2, org.xml3d.FilterTypes);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "filterMip")
		{
			this.filterMip = org.xml3d.initEnum(event.newValue, 1, org.xml3d.FilterTypes);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "wrapS")
		{
			this.wrapS = org.xml3d.initEnum(event.newValue, 0, org.xml3d.WrapTypes);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "wrapT")
		{
			this.wrapT = org.xml3d.initEnum(event.newValue, 0, org.xml3d.WrapTypes);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "wrapU")
		{
			this.wrapU = org.xml3d.initEnum(event.newValue, 0, org.xml3d.WrapTypes);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "borderColor")
		{
			this.borderColor = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}

	
		return org.xml3d.event.UNHANDLED;
	};


};
/**
 * Object org.xml3d.classInfo.img()
 *
 * @augments org.xml3d.classInfo.XML3DImageDataProviderType
 * @constructor
 * @see org.xml3d.classInfo.XML3DImageDataProviderType
 */
org.xml3d.classInfo.img = function(node, context)
{
	org.xml3d.classInfo.Xml3dNode(node, context);

	node._id = org.xml3d.initString(node.getAttribute("id"), null);
	node._class = org.xml3d.initString(node.getAttribute("class"), null);
	node._style = org.xml3d.initString(node.getAttribute("style"), "");
	node._src = org.xml3d.initString(node.getAttribute("src"), "");

	
	
	
	node.__defineSetter__("id", function (value)
	{
		var oldValue = this._id;

		if(org.xml3d.isString(value))
		{
			this._id = value;
		}
		else
		{
			this._id = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.id))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "id", oldValue, this._id));
		}
	});

	node.__defineGetter__("id", function (value)
	{
		return this._id;
	});

	node.__defineSetter__("class", function (value)
	{
		var oldValue = this._class;

		if(org.xml3d.isString(value))
		{
			this._class = value;
		}
		else
		{
			this._class = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.class))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "class", oldValue, this._class));
		}
	});

	node.__defineGetter__("class", function (value)
	{
		return this._class;
	});

	node.__defineSetter__("style", function (value)
	{
		var oldValue = this._style;

		if(org.xml3d.isString(value))
		{
			this._style = value;
		}
		else
		{
			this._style = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.style))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "style", oldValue, this._style));
		}
	});

	node.__defineGetter__("style", function (value)
	{
		return this._style;
	});

	node.__defineSetter__("src", function (value)
	{
		var oldValue = this._src;

		if(org.xml3d.isString(value))
		{
			this._src = value;
		}
		else
		{
			this._src = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.src))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "src", oldValue, this._src));
		}
	});

	node.__defineGetter__("src", function (value)
	{
		return this._src;
	});


	node.resetAttribute = function(attrName)
	{
		if(attrName == "id")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.id = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "class")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.class = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "style")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.style = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "src")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.src = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}


		return org.xml3d.event.UNHANDLED;
	};


	// Node::setField
	node.setField = function(event)
	{
		if (event.attrName == "id")
		{
			this.id = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "class")
		{
			this.class = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "style")
		{
			this.style = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "src")
		{
			this.src = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}

	
		return org.xml3d.event.UNHANDLED;
	};


};
/**
 * Object org.xml3d.classInfo.video()
 *
 * @augments org.xml3d.classInfo.XML3DImageDataProviderType
 * @constructor
 * @see org.xml3d.classInfo.XML3DImageDataProviderType
 */
org.xml3d.classInfo.video = function(node, context)
{
	org.xml3d.classInfo.Xml3dNode(node, context);

	node._id = org.xml3d.initString(node.getAttribute("id"), null);
	node._class = org.xml3d.initString(node.getAttribute("class"), null);
	node._style = org.xml3d.initString(node.getAttribute("style"), "");
	node._src = org.xml3d.initString(node.getAttribute("src"), "");

	
	
	
	node.__defineSetter__("id", function (value)
	{
		var oldValue = this._id;

		if(org.xml3d.isString(value))
		{
			this._id = value;
		}
		else
		{
			this._id = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.id))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "id", oldValue, this._id));
		}
	});

	node.__defineGetter__("id", function (value)
	{
		return this._id;
	});

	node.__defineSetter__("class", function (value)
	{
		var oldValue = this._class;

		if(org.xml3d.isString(value))
		{
			this._class = value;
		}
		else
		{
			this._class = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.class))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "class", oldValue, this._class));
		}
	});

	node.__defineGetter__("class", function (value)
	{
		return this._class;
	});

	node.__defineSetter__("style", function (value)
	{
		var oldValue = this._style;

		if(org.xml3d.isString(value))
		{
			this._style = value;
		}
		else
		{
			this._style = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.style))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "style", oldValue, this._style));
		}
	});

	node.__defineGetter__("style", function (value)
	{
		return this._style;
	});

	node.__defineSetter__("src", function (value)
	{
		var oldValue = this._src;

		if(org.xml3d.isString(value))
		{
			this._src = value;
		}
		else
		{
			this._src = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.src))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "src", oldValue, this._src));
		}
	});

	node.__defineGetter__("src", function (value)
	{
		return this._src;
	});


	node.resetAttribute = function(attrName)
	{
		if(attrName == "id")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.id = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "class")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.class = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "style")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.style = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "src")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.src = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}


		return org.xml3d.event.UNHANDLED;
	};


	// Node::setField
	node.setField = function(event)
	{
		if (event.attrName == "id")
		{
			this.id = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "class")
		{
			this.class = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "style")
		{
			this.style = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "src")
		{
			this.src = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}

	
		return org.xml3d.event.UNHANDLED;
	};


};
/**
 * Object org.xml3d.classInfo.view()
 *
 * @augments org.xml3d.classInfo.XML3DGraphType
 * @constructor
 * @see org.xml3d.classInfo.XML3DGraphType
 */
org.xml3d.classInfo.view = function(node, context)
{
	org.xml3d.classInfo.Xml3dNode(node, context);

	node._id = org.xml3d.initString(node.getAttribute("id"), null);
	node._class = org.xml3d.initString(node.getAttribute("class"), null);
	node._style = org.xml3d.initString(node.getAttribute("style"), "");
	node._onclick = org.xml3d.initString(node.getAttribute("onclick"), "");
	node._ondblclick = org.xml3d.initString(node.getAttribute("ondblclick"), "");
	node._onmousedown = org.xml3d.initString(node.getAttribute("onmousedown"), "");
	node._onmouseup = org.xml3d.initString(node.getAttribute("onmouseup"), "");
	node._onmouseover = org.xml3d.initString(node.getAttribute("onmouseover"), "");
	node._onmousemove = org.xml3d.initString(node.getAttribute("onmousemove"), "");
	node._onmouseout = org.xml3d.initString(node.getAttribute("onmouseout"), "");
	node._onkeypress = org.xml3d.initString(node.getAttribute("onkeypress"), "");
	node._onkeydown = org.xml3d.initString(node.getAttribute("onkeydown"), "");
	node._onkeyup = org.xml3d.initString(node.getAttribute("onkeyup"), "");
	node._visible = org.xml3d.initBoolean(node.getAttribute("visible"), true);
	node._position = org.xml3d.initXML3DVec3(node.getAttribute("position"), 0, 0, 0);
	if(node._position != null)
	{
		node._position.setOwnerNode("position", node);
	}
	node._orientation = org.xml3d.initXML3DRotation(node.getAttribute("orientation"), 0, 0, 1, 0);
	if(node._orientation != null)
	{
		node._orientation.setOwnerNode("orientation", node);
	}
	node._fieldOfView = org.xml3d.initFloat(node.getAttribute("fieldOfView"), 0.785398);

	
	
	
	node.__defineSetter__("id", function (value)
	{
		var oldValue = this._id;

		if(org.xml3d.isString(value))
		{
			this._id = value;
		}
		else
		{
			this._id = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.id))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "id", oldValue, this._id));
		}
	});

	node.__defineGetter__("id", function (value)
	{
		return this._id;
	});

	node.__defineSetter__("class", function (value)
	{
		var oldValue = this._class;

		if(org.xml3d.isString(value))
		{
			this._class = value;
		}
		else
		{
			this._class = org.xml3d.initString(value, null);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.class))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "class", oldValue, this._class));
		}
	});

	node.__defineGetter__("class", function (value)
	{
		return this._class;
	});

	node.__defineSetter__("style", function (value)
	{
		var oldValue = this._style;

		if(org.xml3d.isString(value))
		{
			this._style = value;
		}
		else
		{
			this._style = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.style))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "style", oldValue, this._style));
		}
	});

	node.__defineGetter__("style", function (value)
	{
		return this._style;
	});

	node.__defineSetter__("onclick", function (value)
	{
		var oldValue = this._onclick;

		if(org.xml3d.isString(value))
		{
			this._onclick = value;
		}
		else
		{
			this._onclick = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onclick))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onclick", oldValue, this._onclick));
		}
	});

	node.__defineGetter__("onclick", function (value)
	{
		return this._onclick;
	});

	node.__defineSetter__("ondblclick", function (value)
	{
		var oldValue = this._ondblclick;

		if(org.xml3d.isString(value))
		{
			this._ondblclick = value;
		}
		else
		{
			this._ondblclick = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.ondblclick))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "ondblclick", oldValue, this._ondblclick));
		}
	});

	node.__defineGetter__("ondblclick", function (value)
	{
		return this._ondblclick;
	});

	node.__defineSetter__("onmousedown", function (value)
	{
		var oldValue = this._onmousedown;

		if(org.xml3d.isString(value))
		{
			this._onmousedown = value;
		}
		else
		{
			this._onmousedown = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onmousedown))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onmousedown", oldValue, this._onmousedown));
		}
	});

	node.__defineGetter__("onmousedown", function (value)
	{
		return this._onmousedown;
	});

	node.__defineSetter__("onmouseup", function (value)
	{
		var oldValue = this._onmouseup;

		if(org.xml3d.isString(value))
		{
			this._onmouseup = value;
		}
		else
		{
			this._onmouseup = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onmouseup))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onmouseup", oldValue, this._onmouseup));
		}
	});

	node.__defineGetter__("onmouseup", function (value)
	{
		return this._onmouseup;
	});

	node.__defineSetter__("onmouseover", function (value)
	{
		var oldValue = this._onmouseover;

		if(org.xml3d.isString(value))
		{
			this._onmouseover = value;
		}
		else
		{
			this._onmouseover = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onmouseover))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onmouseover", oldValue, this._onmouseover));
		}
	});

	node.__defineGetter__("onmouseover", function (value)
	{
		return this._onmouseover;
	});

	node.__defineSetter__("onmousemove", function (value)
	{
		var oldValue = this._onmousemove;

		if(org.xml3d.isString(value))
		{
			this._onmousemove = value;
		}
		else
		{
			this._onmousemove = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onmousemove))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onmousemove", oldValue, this._onmousemove));
		}
	});

	node.__defineGetter__("onmousemove", function (value)
	{
		return this._onmousemove;
	});

	node.__defineSetter__("onmouseout", function (value)
	{
		var oldValue = this._onmouseout;

		if(org.xml3d.isString(value))
		{
			this._onmouseout = value;
		}
		else
		{
			this._onmouseout = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onmouseout))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onmouseout", oldValue, this._onmouseout));
		}
	});

	node.__defineGetter__("onmouseout", function (value)
	{
		return this._onmouseout;
	});

	node.__defineSetter__("onkeypress", function (value)
	{
		var oldValue = this._onkeypress;

		if(org.xml3d.isString(value))
		{
			this._onkeypress = value;
		}
		else
		{
			this._onkeypress = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onkeypress))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onkeypress", oldValue, this._onkeypress));
		}
	});

	node.__defineGetter__("onkeypress", function (value)
	{
		return this._onkeypress;
	});

	node.__defineSetter__("onkeydown", function (value)
	{
		var oldValue = this._onkeydown;

		if(org.xml3d.isString(value))
		{
			this._onkeydown = value;
		}
		else
		{
			this._onkeydown = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onkeydown))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onkeydown", oldValue, this._onkeydown));
		}
	});

	node.__defineGetter__("onkeydown", function (value)
	{
		return this._onkeydown;
	});

	node.__defineSetter__("onkeyup", function (value)
	{
		var oldValue = this._onkeyup;

		if(org.xml3d.isString(value))
		{
			this._onkeyup = value;
		}
		else
		{
			this._onkeyup = org.xml3d.initString(value, "");
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.onkeyup))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "onkeyup", oldValue, this._onkeyup));
		}
	});

	node.__defineGetter__("onkeyup", function (value)
	{
		return this._onkeyup;
	});

	node.__defineSetter__("visible", function (value)
	{
		var oldValue = this._visible;

		if(org.xml3d.isBoolean(value))
		{
			this._visible = value;
		}
		else
		{
			this._visible = org.xml3d.initBoolean(value, true);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.visible))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "visible", oldValue, this._visible));
		}
	});

	node.__defineGetter__("visible", function (value)
	{
		return this._visible;
	});

	node.__defineSetter__("position", function (value)
	{
		var oldValue = this._position;

		if(org.xml3d.isXML3DVec3(value))
		{
			this._position = value;
		}
		else
		{
			this._position = org.xml3d.initXML3DVec3(value, 0, 0, 0);
		}

	    if(this._position != null)
		{
			this._position.setOwnerNode("position", this);
		}		

		if (this.notificationRequired() && ! isEqual(oldValue,this.position))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "position", oldValue, this._position));
		}
	});

	node.__defineGetter__("position", function (value)
	{
		return this._position;
	});

	node.__defineSetter__("orientation", function (value)
	{
		var oldValue = this._orientation;

		if(org.xml3d.isXML3DRotation(value))
		{
			this._orientation = value;
		}
		else
		{
			this._orientation = org.xml3d.initXML3DRotation(value, 0, 0, 1, 0);
		}

	    if(this._orientation != null)
		{
			this._orientation.setOwnerNode("orientation", this);
		}		

		if (this.notificationRequired() && ! isEqual(oldValue,this.orientation))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "orientation", oldValue, this._orientation));
		}
	});

	node.__defineGetter__("orientation", function (value)
	{
		return this._orientation;
	});

	node.__defineSetter__("fieldOfView", function (value)
	{
		var oldValue = this._fieldOfView;

		if(org.xml3d.isFloat(value))
		{
			this._fieldOfView = value;
		}
		else
		{
			this._fieldOfView = org.xml3d.initFloat(value, 0.785398);
		}


		if (this.notificationRequired() && ! isEqual(oldValue,this.fieldOfView))
		{
			this.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "fieldOfView", oldValue, this._fieldOfView));
		}
	});

	node.__defineGetter__("fieldOfView", function (value)
	{
		return this._fieldOfView;
	});


	node.resetAttribute = function(attrName)
	{
		if(attrName == "id")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.id = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "class")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.class = org.xml3d.initString("", null);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "style")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.style = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onclick")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onclick = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "ondblclick")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.ondblclick = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onmousedown")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onmousedown = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onmouseup")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onmouseup = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onmouseover")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onmouseover = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onmousemove")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onmousemove = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onmouseout")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onmouseout = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onkeypress")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onkeypress = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onkeydown")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onkeydown = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "onkeyup")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.onkeyup = org.xml3d.initString("", "");
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "visible")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.visible = org.xml3d.initBoolean("", true);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "position")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.position = org.xml3d.initXML3DVec3("", 0, 0, 0);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "orientation")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.orientation = org.xml3d.initXML3DRotation("", 0, 0, 1, 0);
			return org.xml3d.event.HANDLED;
		}
		if(attrName == "fieldOfView")
		{
			// An event is triggered through the corresponding setter. Therefore,
			// no further notification is required.
			this.fieldOfView = org.xml3d.initFloat("", 0.785398);
			return org.xml3d.event.HANDLED;
		}


		return org.xml3d.event.UNHANDLED;
	};


	// Node::setField
	node.setField = function(event)
	{
		if (event.attrName == "id")
		{
			this.id = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "class")
		{
			this.class = org.xml3d.initString(event.newValue, null);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "style")
		{
			this.style = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onclick")
		{
			this.onclick = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "ondblclick")
		{
			this.ondblclick = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onmousedown")
		{
			this.onmousedown = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onmouseup")
		{
			this.onmouseup = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onmouseover")
		{
			this.onmouseover = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onmousemove")
		{
			this.onmousemove = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onmouseout")
		{
			this.onmouseout = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onkeypress")
		{
			this.onkeypress = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onkeydown")
		{
			this.onkeydown = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "onkeyup")
		{
			this.onkeyup = org.xml3d.initString(event.newValue, "");
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "visible")
		{
			this.visible = org.xml3d.initBoolean(event.newValue, true);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "position")
		{
			this.position = org.xml3d.initXML3DVec3(event.newValue, 0, 0, 0);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "orientation")
		{
			this.orientation = org.xml3d.initXML3DRotation(event.newValue, 0, 0, 1, 0);
			return org.xml3d.event.HANDLED;
		}
		if (event.attrName == "fieldOfView")
		{
			this.fieldOfView = org.xml3d.initFloat(event.newValue, 0.785398);
			return org.xml3d.event.HANDLED;
		}

	
		return org.xml3d.event.UNHANDLED;
	};

		node.getWorldMatrix = org.xml3d.methods.XML3DGraphTypeGetWorldMatrix;
		node.setDirection = org.xml3d.methods.viewSetDirection;
		node.setUpVector = org.xml3d.methods.viewSetUpVector;
		node.lookAt = org.xml3d.methods.viewLookAt;
		node.getDirection = org.xml3d.methods.viewGetDirection;
		node.getUpVector = org.xml3d.methods.viewGetUpVector;
		node.getViewMatrix = org.xml3d.methods.viewGetViewMatrix;

};
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

org.xml3d.methods.viewSetDirection = function(vec) {
	var dir = vec.negate().normalize();
	if (this._upVector)
		var up = this._upVector;
	else
		var up = new XML3DVec3(0,1,0);
	var right = up.cross(dir).normalize();
	up = dir.cross(right).normalize();
	this.orientation = XML3DRotation.fromBasis(right, up, dir);

};

org.xml3d.methods.viewSetUpVector = function(up) {
	this._upVector = up.normalize();
};

org.xml3d.methods.viewGetUpVector = function() {
	return this.orientation.rotateVec3(new XML3DVec3(0, 1, 0));
};

org.xml3d.methods.viewLookAt = function(point) {
	var vector = point.subtract(this.position);
	vector = vector.normalize();
	this.setDirection(vector);
};

org.xml3d.methods.xml3dGetElementByPoint = function(x, y, hitPoint, hitNormal) {
	for (i = 0; i < this.adapters.length; i++) {
		if (this.adapters[i].getElementByPoint) {
			return this.adapters[i].getElementByPoint(x, y, hitPoint, hitNormal);
		}
	}
};

org.xml3d.methods.xml3dGenerateRay = function(x, y) {
    for (i = 0; i < this.adapters.length; i++) {
        if (this.adapters[i].generateRay) {
            return this.adapters[i].generateRay(x, y);
        }
    }
};

org.xml3d.methods.xml3dGetBoundingBox = org.xml3d.methods.groupGetBoundingBox;

org.xml3d.methods.groupGetLocalMatrix = function() { 
    
    var xfmNode = this.getTransformNode();  
    if(xfmNode)
    {
        for (i = 0; i < xfmNode.adapters.length; i++) {
            if (xfmNode.adapters[i].getMatrix) {
                var sglMat = xfmNode.adapters[i].getMatrix();                
                var xml3dMat = new XML3DMatrix(sglMat); 
                
                return xml3dMat.transpose(); 
            }
        }
    }
    
    return new XML3DMatrix(); 
}; 

/** return the bounding box that is the bounding box of all children. 
 */
org.xml3d.methods.groupGetBoundingBox = function() { 

    var bbox = new XML3DBox(); 
    var child = this.firstElementChild; 
    while(child !== null)
    {
        if(child.getBoundingBox)
            bbox.extend(child.getBoundingBox()); 
        
        child = child.nextElementSibling;
    }
    
    return bbox; 
}; 

/** returns the bounding box of this mesh in world space.
 */
org.xml3d.methods.meshGetBoundingBox = function() {

    for (i = 0; i < this.adapters.length; i++) {
        if (this.adapters[i].getBoundingBox) {
            var bbox = this.adapters[i].getBoundingBox();

            var worldMat = this.getWorldMatrix(); 
            bbox.min = worldMat.mulVec3(bbox.min, 1); 
            bbox.max = worldMat.mulVec3(bbox.max, 1);
            
            return bbox; 
        }
    }
    
    return new XML3DBox(); 
};

org.xml3d.methods.XML3DGraphTypeGetWorldMatrix = function() {
    
    var node = this; 
    
    var mat = new XML3DMatrix(); 
    
    // accumulate matrix until xml3d tag is reached 
    while(node.nodeName !== "xml3d")
    {
        if(node.nodeName === "group")
            mat = node.getLocalMatrix().multiply(mat); 
        
        node = node.parentNode; 
    }
    
    return mat; 
};
/*************************************************************************/
/*                                                                       */
/*  SpiderGL                                                             */
/*  JavaScript 3D Graphics Library on top of WebGL                       */
/*                                                                       */
/*  Copyright (C) 2010                                                   */
/*  Marco Di Benedetto                                                   */
/*  Visual Computing Laboratory                                          */
/*  ISTI - Italian National Research Council (CNR)                       */
/*  http://vcg.isti.cnr.it                                               */
/*  mailto: marco[DOT]dibenedetto[AT]isti[DOT]cnr[DOT]it                 */
/*                                                                       */
/*  This file is part of SpiderGL.                                       */
/*                                                                       */
/*  SpiderGL is free software; you can redistribute it and/or modify     */
/*  under the terms of the GNU Lesser General Public License as          */
/*  published by the Free Software Foundation; either version 2.1 of     */
/*  the License, or (at your option) any later version.                  */
/*                                                                       */
/*  SpiderGL is distributed in the hope that it will be useful, but      */
/*  WITHOUT ANY WARRANTY; without even the implied warranty of           */
/*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.                 */
/*  See the GNU Lesser General Public License                            */
/*  (http://www.fsf.org/licensing/licenses/lgpl.html) for more details.  */
/*                                                                       */
/*************************************************************************/


// version
/***********************************************************************/
const SGL_VERSION_MAJOR      = 0;
const SGL_VERSION_MINOR      = 1;
const SGL_VERSION_REVISION   = 1;
const SGL_VERSION_STRING     = SGL_VERSION_MAJOR + "." + SGL_VERSION_MINOR + "." + SGL_VERSION_REVISION;
/***********************************************************************/


// exceptions
/***********************************************************************/
function sglUnknown() {
	throw new Error("SpiderGL : UNKNOWN");
}

function sglUnsupported() {
	throw new Error("SpiderGL : UNSUPPORTED");
}

function sglUnimplemented() {
	throw new Error("SpiderGL : UNIMPLEMENTED");
}

function sglInvalidParameter() {
	throw new Error("SpiderGL : INVALID_PARAMETER");
}

function sglInvalidCall() {
	throw new Error("SpiderGL : INVALID_CALL");
}
/***********************************************************************/


// utilities
/***********************************************************************/
function sglDefineGetter(ClassName, getterName, getterFunc) {
	ClassName.prototype.__defineGetter__(getterName, getterFunc);
}

function sglDefineSetter(ClassName, setterName, setterFunc) {
	ClassName.prototype.__defineSetter__(setterName, setterFunc);
}

function sglDefineConstant(ClassName, constantName, constantValue) {
	ClassName[constantName] = constantValue;
}

function sglInherit(DerivedClassName, BaseClassName) {
	DerivedClassName.prototype = new BaseClassName();
	DerivedClassName.prototype.constructor = DerivedClassName;
}
/***********************************************************************/


// initialization - finalization
/***********************************************************************/
function sglInitialize() {
	;
}

function sglFinalize() {
	;
}

window.addEventListener("load",   function() { sglInitialize(); }, false);
window.addEventListener("unload", function() { sglFinalize();   }, false);
/***********************************************************************/


/*************************************************************************/
/*                                                                       */
/*  SpiderGL                                                             */
/*  JavaScript 3D Graphics Library on top of WebGL                       */
/*                                                                       */
/*  Copyright (C) 2010                                                   */
/*  Marco Di Benedetto                                                   */
/*  Visual Computing Laboratory                                          */
/*  ISTI - Italian National Research Council (CNR)                       */
/*  http://vcg.isti.cnr.it                                               */
/*  mailto: marco[DOT]dibenedetto[AT]isti[DOT]cnr[DOT]it                 */
/*                                                                       */
/*  This file is part of SpiderGL.                                       */
/*                                                                       */
/*  SpiderGL is free software; you can redistribute it and/or modify     */
/*  under the terms of the GNU Lesser General Public License as          */
/*  published by the Free Software Foundation; either version 2.1 of     */
/*  the License, or (at your option) any later version.                  */
/*                                                                       */
/*  SpiderGL is distributed in the hope that it will be useful, but      */
/*  WITHOUT ANY WARRANTY; without even the implied warranty of           */
/*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.                 */
/*  See the GNU Lesser General Public License                            */
/*  (http://www.fsf.org/licensing/licenses/lgpl.html) for more details.  */
/*                                                                       */
/*************************************************************************/


// DOM utilities
/*********************************************************/
function sglNodeText(domNodeID) {
	var node = document.getElementById(domNodeID);
	if (!node) return null;

	var str = "";
	var n   = node.firstChild;
	while (n) {
		if (n.nodeType == 3) {
			str += n.textContent;
		}
		n = n.nextSibling;
	}
	return str;
}

function sglLoadFile(url, callback) {
	var async = (callback) ? (true) : (false);
	var req = new XMLHttpRequest();

	if (async) {
		req.onreadystatechange = function() {
			if (req.readyState == 4) {
				if (callback) {
					callback(req.responseText);
				}
			}
		};
	}

	req.open("GET", url, async);
	req.send(null);

	var ret = null;
	if (!async) {
		ret = req.responseText;
	}

	return ret;
}

function sglGetLines(text)
{
	var allLines = text.split("\n");
	var n = allLines.length;
	var lines = [ ];
	var line = null;
	for (var i=0; i<n; ++i) {
		line = allLines[i].replace(/[ \t]+/g, " ").replace(/\s\s*$/, "");
		if (line.length > 0) {
			lines.push(line);
		}
	}
	return lines;
}
/*********************************************************/


// SglRequest
/*********************************************************/
const SGL_REQUEST_FAILED     = 0;
const SGL_REQUEST_SUCCEEDED  = 1;
const SGL_REQUEST_IDLE       = 2;
const SGL_REQUEST_ONGOING    = 3;
const SGL_REQUEST_ABORTED    = 4;
const SGL_REQUEST_QUEUED     = 5;
const SGL_REQUEST_REJECTED   = 6;
const SGL_REQUEST_CANCELLED  = 7;

/**
 * Constructs a SglRequest.
 * @class Base class for an asynchronous request.
 */
function SglRequest(onReadyCallback) {
	this._priority = null;
	this._status   = SGL_REQUEST_IDLE;
	this._queue    = null;
	this._onReady  = [ ];
	if (onReadyCallback) {
		this.addOnReadyCallback(onReadyCallback);
	}
}

SglRequest.prototype = {
	_createOnReadyCallback : function() {
		var t  = this;
		var cb = function(ok) {
			t._status = (ok) ? (SGL_REQUEST_SUCCEEDED) : (SGL_REQUEST_FAILED);
			if (t._queue) {
				t._queue._requestReady(t);
				this._queue  = null;
			}
			var n = t._onReady.length;
			for (var i=0; i<n; ++i) {
				t._onReady[i](t);
			}
		};
		return cb;
	},

	get status() {
		return this._status;
	},

	get priority() {
		return this._priority;
	},

	set priority(p) {
		this._priority = p;
		if (this._queue) {
			this._queue._updateRequest(this);
		}
	},

	get succeeded() {
		return (this._status == SGL_REQUEST_SUCCEEDED);
	},

	get failed() {
		return (this._status == SGL_REQUEST_FAILED);
	},

	addOnReadyCallback : function(f) {
		if (f) {
			this._onReady.push(f);
			if (this.isReady) {
				f(this);
			}
		}
	},

	removeOnReadyCallback : function(f) {
		var index = -1;
		var n = this._onReady.length;
		for (var i=0; i<n; ++i) {
			if (this._onReady[i] == f) {
				index = i;
				break;
			}
		}
		if (index < 0) return;
		this._onReady.splice(index, 1);
	},

	get isReady() {
		return (this.failed || this.succeeded);
	},

	get queue() {
		return this._queue;
	},

	send : function() {
		if (!this._send) return false;
		var r = this._send();
		if (r) {
			this._status = SGL_REQUEST_ONGOING;
		}
		else {
			this._status = SGL_REQUEST_FAILED;
			var cb = this._createOnReadyCallback();
			cb(false);
		}
		return r;
	},

	cancel : function() {
		if (this._status == SGL_REQUEST_QUEUED) {
			if (this._queue) {
				this._queue._removeQueuedRequest(this);
				this._queue  = null;
			}
			this._status = SGL_REQUEST_CANCELLED;
		}
	},

	abort : function() {
		this.cancel();
		if (this._status == SGL_REQUEST_ONGOING) {
			if (this._queue) {
				this._queue._removeOngoingRequest(this);
				this._queue  = null;
			}
			if (this._abort) {
				this._abort();
			}
			this._status = SGL_REQUEST_ABORTED;
		}
	}
};
/*********************************************************/


// SglTextFileRequest
/*********************************************************/
/**
 * Constructs a SglTextFileRequest.
 * @class Asynchronous text file request.
 */
function SglTextFileRequest(url, onReadyCallback) {
	SglRequest.apply(this, Array.prototype.slice.call(arguments, 1));
	this._url = url;
	this._req = null;
}

sglInherit(SglTextFileRequest, SglRequest);

sglDefineGetter(SglTextFileRequest, "url", function() {
	return this._url;
});

sglDefineGetter(SglTextFileRequest, "text", function() {
	return this._req.responseText;
});

SglTextFileRequest.prototype._send = function() {
	if (!this._url) return false;

	var req = new XMLHttpRequest();
	this._req = req;

	var cb = this._createOnReadyCallback();
	req.onreadystatechange = function() {
		if (req.readyState == 4) {
			var ok = (req.status) ? (req.status == 200) : (true);
			cb(ok);
		}
	};
	req.open("GET", this._url, true);
	req.send();

	return true;
};

SglTextFileRequest.prototype._abort = function() {
	if (!this._req) return;
	this._req.abort();
};
/*********************************************************/


// SglImageRequest
/*********************************************************/
/**
 * Constructs a SglImageRequest.
 * @class Asynchronous image request.
 */
function SglImageRequest(url, onReadyCallback) {
	SglRequest.apply(this, Array.prototype.slice.call(arguments, 1));
	this._url = url;
	this._img = null;
}

sglInherit(SglImageRequest, SglRequest);

sglDefineGetter(SglImageRequest, "url", function() {
	return this._url;
});

sglDefineGetter(SglImageRequest, "image", function() {
	return this._img;
});

SglImageRequest.prototype._send = function() {
	if (!this._url) return false;

	var img = new Image();
	this._img = img;

	var cb = this._createOnReadyCallback();
	img.onload = function() {
		cb(img.complete);
	};
	img.onerror = function() {
		cb(false);
	};
	img.src = this._url;

	return true;
};

SglImageRequest.prototype._abort = function() {
	;
};
/*********************************************************/


// SglRequestWatcher
/*********************************************************/
/**
 * Constructs a SglRequestWatcher.
 * @class Watches for requests completion.
 */
function SglRequestWatcher(reqs, onReadyCallback) {
	var n = reqs.length;

	this._onReady       = (onReadyCallback) ? (onReadyCallback) : (null);
	this._waitingReqs   = n;
	this._succeededReqs = 0;
	this._failedReqs    = 0;
	this._reqs          = reqs.slice();

	var t  = this;
	var cb = function(r) {
		if (r.succeeded) {
			t._succeededReqs++;
		}
		else if (r.failed) {
			t._failedReqs++;
		}
		t._waitingReqs--;
		if (t.isReady) {
			if (t._onReady) {
				t._onReady(t);
			}
		}
	};

	for (var i=0; i<n; ++i) {
		if (reqs[i].succeeded) {
			this._succeededReqs++;
			this._waitingReqs--;
		}
		else if (reqs[i].failed) {
			this._failedReqs++;
			this._waitingReqs--;
		}
		else {
			reqs[i].addOnReadyCallback(cb);
		}
	}

	if (this._waitingReqs <= 0) {
		if (this._onReady) {
			this._onReady(this);
		}
	}
}

SglRequestWatcher.prototype = {
	get requests() {
		return this._reqs;
	},

	get succeeded() {
		return (this._succeededReqs == this._reqs.length);
	},

	get failed() {
		if ((this._succeededReqs + this._failedReqs) < this._reqs.length) return false;
		return (this._succeededReqs < this._reqs.length);
	},

	get onReady() {
		return this._onReady;
	},

	set onReady(f) {
		this._onReady = f;
		if (this.isReady) {
			if (this._onReady) {
				this._onReady(t);
			}
		}
	},

	get isReady() {
		return ((this._succeededReqs + this._failedReqs) == this._reqs.length);
	},

	send : function() {
		var n = this._reqs.length;
		for (var i=0; i<n; ++i) {
			this._reqs[i].send();
		}
	},

	cancel : function() {
		var n = this._reqs.length;
		for (var i=0; i<n; ++i) {
			this._reqs[i].cancel();
		}
	},

	abort : function() {
		var n = this._reqs.length;
		for (var i=0; i<n; ++i) {
			this._reqs[i].abort();
		}
	}
};
/*********************************************************/


// SglRequestQueue
/*********************************************************/
/**
 * Constructs a SglRequestQueue.
 * @class Asynchronous requests scheduler.
 */
function SglRequestQueue(maxOngoing, maxQueued, onReadyCallback) {
	this._maxOngoing = (maxOngoing > 0) ? (maxOngoing) : (0);
	this._maxQueued  = (maxQueued  > 0) ? (maxQueued ) : (0);

	this._ongoing = [ ];
	this._queued  = [ ];
	this._onReady = null;
	this._minPriorityReq = null;
	this._priorityCompare = null;
	this._dirty = true;
}

SglRequestQueue.prototype = {
	_sort : function() {
		if (!this._dirty) return;

		this._dirty = false;
		this._minPriorityReq = null;
		if (this._queued.length <= 0) return;

		if (this._priorityCompare) {
			this._queued.sort(this._priorityCompare);
		}
		else {
			this._queued.sort();
		}
		if (this._queued.length > 0) {
			this._minPriorityReq = this._queued[0];
		}
	},

	_updateMinPriority : function() {
		this._minPriorityReq = null;
		var n = this._queued.length;
		if (n <= 0) return;

		this._minPriorityReq = this._queued[0];
		if (!this._dirty) return;

		for (var i=1; i<n; ++i) {
			if (this.comparePriorities(this._queued[i].priority, this._minPriorityReq.priority) <= 0) {
				this._minPriorityReq = this._queued[i];
			}
		}
	},

	_removeFromArray : function(arr, elem) {
		var index = -1;
		var n = arr.length;
		for (var i=0; i<n; ++i) {
			if (arr[i] == elem) {
				index = i;
				break;
			}
		}
		if (index < 0) return;
		arr.splice(index, 1);
	},

	_removeQueuedRequest : function(r) {
		this._removeFromArray(this._queued, r);
		if (this._queued.length <= 0) {
			this._minPriorityReq = null;
		}
		else if (r == this._minPriorityReq) {
			this._updateMinPriority();
		}
	},

	_removeOngoingRequest : function(r) {
		this._removeFromArray(this._ongoing, r);
		this._execute();
	},

	_updateRequest : function(r) {
		if (this.comparePriorities(r.priority, this._minPriorityReq.priority) <= 0) {
			this._minPriorityReq = r;
		}
		this._dirty = true;
	},

	_requestReady : function(r) {
		this._removeOngoingRequest(r);
		if (this._onReady) {
			this._onReady(r);
		}
		this._execute();
	},

	_execute : function() {
		var n = this._queued.length;
		if (n <= 0) return;
		var sendable = (this._maxOngoing > 0) ? (this._maxOngoing - this._ongoing.length) : (n)
		if (sendable <= 0) return;
		if (sendable > n) sendable = n;
		this._sort();
		var r = null;
		for (var i=0; i<sendable; ++i) {
			r = this._queued.pop();
			r.send();
		}
		if (this._queued.length > 0) {
			this._minPriorityReq = this._queued[0];
		}
	},

	comparePriorities : function(a, b) {
		if (this._priorityCompare) {
			return this._priorityCompare(a, b);
		}
		return (a - b);
	},

	get priorityCompare() {
		return this._priorityCompare;
	},

	set priorityCompare(f) {
		this._priorityCompare = f;
		this._updateMinPriority();
	},

	get onReady() {
		return this._onReady;
	},

	set onReady(f) {
		this._onReady = f;
	},

	push : function(r) {
		var ret = {
			victims : null,
			result  : false
		};
		
		if (r.queue) return ret;
		var n = this._queued.length;
		var overflow = ((this._maxQueued > 0) && (n >= this._maxQueued));

		if  (overflow) {
			if (this.comparePriorities(r.priority, this._minPriorityReq.priority) <= 0) {
				r._status = SGL_REQUEST_REJECTED;
				return ret;
			}
		}

		this._queued.push(r);
		r._queue  = this;
		r._status = SGL_REQUEST_QUEUED;
		n++;

		ret.result = true;
	
		var toKill = (this._maxQueued > 0) ? (n - this._maxQueued) : (0);
		if (toKill <= 0) {
			if (this._minPriorityReq != null) {
				if (this.comparePriorities(r.priority, this._minPriorityReq.priority) <= 0) {
					this._minPriorityReq = r;
				}
			}
			else {
				this._minPriorityReq = r;
			}
			this._dirty = true;
		}
		else {
			this._sort();
			ret.victims = this._queued.slice(0, toKill);
			this._queued.splice(0, toKill);
			for (var i=0; i<toKill; ++i) {
				ret.victims[i]._status = SGL_REQUEST_REJECTED;
				ret.victims[i]._queue  = null;
			}
		}

		this._execute();

		return ret;
	}
};
/*********************************************************/


/*************************************************************************/
/*                                                                       */
/*  SpiderGL                                                             */
/*  JavaScript 3D Graphics Library on top of WebGL                       */
/*                                                                       */
/*  Copyright (C) 2010                                                   */
/*  Marco Di Benedetto                                                   */
/*  Visual Computing Laboratory                                          */
/*  ISTI - Italian National Research Council (CNR)                       */
/*  http://vcg.isti.cnr.it                                               */
/*  mailto: marco[DOT]dibenedetto[AT]isti[DOT]cnr[DOT]it                 */
/*                                                                       */
/*  This file is part of SpiderGL.                                       */
/*                                                                       */
/*  SpiderGL is free software; you can redistribute it and/or modify     */
/*  under the terms of the GNU Lesser General Public License as          */
/*  published by the Free Software Foundation; either version 2.1 of     */
/*  the License, or (at your option) any later version.                  */
/*                                                                       */
/*  SpiderGL is distributed in the hope that it will be useful, but      */
/*  WITHOUT ANY WARRANTY; without even the implied warranty of           */
/*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.                 */
/*  See the GNU Lesser General Public License                            */
/*  (http://www.fsf.org/licensing/licenses/lgpl.html) for more details.  */
/*                                                                       */
/*************************************************************************/


// math utilities
/***********************************************************************/
const SGL_PI = Math.PI;

function sglAbs(x) {
	return Math.abs(x);
}

function sglFloor(x) {
	return Math.floor(x);
}

function sglCeil(x) {
	return Math.ceil(x);
}

function sglSqrt(x) {
	return Math.sqrt(x);
}

function sglPow(x, y) {
	return Math.pow(x, y);
}

function sglLog(x) {
	return Math.log(x);
}

function sglExp(x) {
	return Math.exp(x);
}

function sglSin(x) {
	return Math.sin(x);
}

function sglAsin(x) {
	return Math.asin(x);
}

function sglCos(x) {
	return Math.cos(x);
}

function sglAcos(x) {
	return Math.acos(x);
}

function sglTan(x) {
	return Math.tan(x);
}

function sglAtan(x) {
	return Math.atan(x);
}

function sglAtan2(y, x) {
	return Math.atan2(y, x);
}

function sglDegToRad(x) {
	return (x * (SGL_PI / 180.0));
}

function sglRadToDeg(x) {
	return (x * (180.0 / SGL_PI));
}

function sglMin(a, b) {
	return Math.min(a, b);
}

function sglMax(a, b) {
	return Math.max(a, b);
}

function sglClamp(x, min, max) {
	return ((x <= min) ? (min) : ((x >= max) ? (max) : (x)));
}

function sglRandom01() {
	return Math.random();
}

function sglMapVN(vArray, size, f, param, first, count, stride) {
	first  = (first  != undefined) ? first  : 0;
	stride = (stride != undefined) ? stride : size;
	count  = (count  != undefined) ? count  : ((vArray.length - first) / stride);

	var last = first + count * stride;
	var v    = new Array(n);

	var k = 0;
	var j = 0;
	for (var i=first; i<last; i+=stride) {
		for (j=0; j<n; ++j) {
			v[j] = vArray[i+j];
		}
		f(v, param, k++);
		for (j=0; j<n; ++j) {
			vArray[i+j] = v[j];
		}
	}
}

function sglMapV2(v2Array, f, param, first, count, stride) {
	sglMapVN(v2Array, 2, f, param, first, count, stride);
}

function sglMapV3(v3Array, f, param, first, count, stride) {
	sglMapVN(v3Array, 3, f, param, first, count, stride);
}

function sglMapV4(v4Array, f, param, first, count, stride) {
	sglMapVN(v4Array, 4, f, param, first, count, stride);
}
/***********************************************************************/


/*************************************************************************/
/*                                                                       */
/*  SpiderGL                                                             */
/*  JavaScript 3D Graphics Library on top of WebGL                       */
/*                                                                       */
/*  Copyright (C) 2010                                                   */
/*  Marco Di Benedetto                                                   */
/*  Visual Computing Laboratory                                          */
/*  ISTI - Italian National Research Council (CNR)                       */
/*  http://vcg.isti.cnr.it                                               */
/*  mailto: marco[DOT]dibenedetto[AT]isti[DOT]cnr[DOT]it                 */
/*                                                                       */
/*  This file is part of SpiderGL.                                       */
/*                                                                       */
/*  SpiderGL is free software; you can redistribute it and/or modify     */
/*  under the terms of the GNU Lesser General Public License as          */
/*  published by the Free Software Foundation; either version 2.1 of     */
/*  the License, or (at your option) any later version.                  */
/*                                                                       */
/*  SpiderGL is distributed in the hope that it will be useful, but      */
/*  WITHOUT ANY WARRANTY; without even the implied warranty of           */
/*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.                 */
/*  See the GNU Lesser General Public License                            */
/*  (http://www.fsf.org/licensing/licenses/lgpl.html) for more details.  */
/*                                                                       */
/*************************************************************************/


// 2-dimensional vector
/***********************************************************************/
function sglUndefV2(v) {
	return new Array(2);
}

function sglV2V(v) {
	return v.slice(0, 2);
}

function sglV2S(s) {
	return [ s, s ];
}

function sglV2C(x, y) {
	return [ x, y ];
}

function sglZeroV2() {
	return sglV2S(0.0);
}

function sglOneV2() {
	return sglV2S(1.0);
}

function sglV2() {
	var n = arguments.length;
	var s;
	switch (n) {
		case 1:
			if (arguments[0] instanceof Array) {
				return sglV2V(arguments[0]);
			}
			return sglV2S(arguments[0]);
		break;

		case 2:
			return sglV2V(arguments);
		break;

		default:
			return sglZeroV2();
		break;
	}
	return null;
}

function sglDupV2(v) {
	return v.slice(0, 2);
}

function sglNegV2(v) {
	return sglV2C(-v[0], -v[1]);
}

function sglAddV2(u, v) {
	return sglV2C(u[0]+v[0], u[1]+v[1]);
}

function sglAddV2S(v, s) {
	return sglV2C(v[0]+s, v[1]+s);
}

function sglAddSV2(s, v) {
	return sglAddV2S(v, s)
}

function sglSubV2(u, v) {
	return sglV2C(u[0]-v[0], u[1]-v[1]);
}

function sglSubV2S(v, s) {
	return sglV2C(v[0]-s, v[1]-s);
}

function sglSubSV2(v, s) {
	return sglV2C(s-v[0], s-v[1]);
}

function sglMulV2(u, v) {
	return sglV2C(u[0]*v[0], u[1]*v[1]);
}

function sglMulV2S(v, s) {
	return sglV2C(v[0]*s, v[1]*s);
}

function sglMulSV2(s, v) {
	return sglMulV2S(v, s);
}

function sglDivV2(u, v) {
	return sglV2C(u[0]/v[0], u[1]/v[1]);
}

function sglDivV2S(v, s) {
	return sglV2C(v[0]/s, v[1]/s);
}

function sglDivSV2(s, v) {
	return sglV2C(s/v[0], s/v[1]);
}

function sglRcpV2(v) {
	return sglDivSV2(1.0, v);
}

function sglDotV2(u, v) {
	return (u[0]*v[0] + u[1]*v[1]);
}

function sglCrossV2(u, v) {
	return (u[0]*v[1] - u[1]*v[0]);
}

function sglSqLengthV2(v) {
	return sglDotV2(v, v);
}

function sglLengthV2(v) {
	return sglSqrt(sglSqLengthV2(v));
}

function sglNormalizedV2(v) {
	var f = 1.0 / sglLengthV2(v);
	return sglMulV2S(v, f);
}

function sglSelfNegV2(v) {
	v[0] = -v[0];
	v[1] = -v[1];
	return v;
}

function sglSelfAddV2(u, v) {
	u[0] += v[0];
	u[1] += v[1];
	return u;
}

function sglSelfAddV2S(v, s) {
	v[0] += s;
	v[1] += s;
	return v;
}

function sglSelfAddSV2(s, v) {
	v[0] += s;
	v[1] += s;
	return v;
}

function sglSelfSubV2(u, v) {
	u[0] -= v[0];
	u[1] -= v[1];
	return u;
}

function sglSelfSubV2S(v, s) {
	v[0] -= s;
	v[1] -= s;
	return v;
}

function sglSelfSubSV2(v, s) {
	v[0] = s - v[0];
	v[1] = s - v[1];
	return v;
}

function sglSelfMulV2(u, v) {
	u[0] *= v[0];
	u[1] *= v[1];
	return u;
}

function sglSelfMulV2S(v, s) {
	v[0] *= s;
	v[1] *= s;
	return v;
}

function sglSelfMulSV2(s, v) {
	v[0] *= s;
	v[1] *= s;
	return v;
}

function sglSelfDivV2(u, v) {
	u[0] /= v[0];
	u[1] /= v[1];
	return u;
}

function sglSelfDivV2S(v, s) {
	u[0] /= s;
	u[1] /= s;
	return u;
}

function sglSelfDivSV2(s, v) {
	v[0] = s / v[0];
	v[1] = s / v[1];
	return v;
}

function sglSelfRcpV2(v) {
	return sglSelfDivSV2(1.0, v);
}

function sglSelfNormalizeV2(v) {
	var f = 1.0 / sglLengthV2(v);
	return sglSelfMulV2S(v, f);
}

function sglMinV2(u, v) {
	return [
		((u[0] < v[0]) ? (u[0]) : (v[0])),
		((u[1] < v[1]) ? (u[1]) : (v[1]))
	];
}

function sglMaxV2(u, v) {
	return [
		((u[0] > v[0]) ? (u[0]) : (v[0])),
		((u[1] > v[1]) ? (u[1]) : (v[1]))
	];
}

function sglV2toV3(v, z) {
	return sglV3C(v[0], v[1], z);
}

function sglV2toV4(v, z, w) {
	return sglV4C(v[0], v[1], z, w);
}
/***********************************************************************/


// 3-dimensional vector
/***********************************************************************/
function sglUndefV3(v) {
	return new Array(3);
}

function sglV3V(v) {
	return v.slice(0, 3);
}

function sglV3S(s) {
	return [ s, s, s ];
}

function sglV3C(x, y, z) {
	return [ x, y, z ];
}

function sglZeroV3() {
	return sglV3S(0.0);
}

function sglOneV3() {
	return sglV3S(1.0);
}

function sglV3() {
	var n = arguments.length;
	var s;
	switch (n) {
		case 1:
			if (arguments[0] instanceof Array) {
				return sglV3V(arguments[0]);
			}
			return sglV3S(arguments[0]);
		break;

		case 3:
			return sglV3V(arguments);
		break;

		default:
			return sglZeroV3();
		break;
	}
	return null;
}

function sglDupV3(v) {
	return v.slice(0, 3);
}

function sglNegV3(v) {
	return sglV3C(-v[0], -v[1], -v[2]);
}

function sglAddV3(u, v) {
	return sglV3C(u[0]+v[0], u[1]+v[1], u[2]+v[2]);
}

function sglAddV3S(v, s) {
	return sglV3C(v[0]+s, v[1]+s, v[2]+s);
}

function sglAddSV3(s, v) {
	return sglAddV3S(v, s)
}

function sglSubV3(u, v) {
	return sglV3C(u[0]-v[0], u[1]-v[1], u[2]-v[2]);
}

function sglSubV3S(v, s) {
	return sglV3C(v[0]-s, v[1]-s, v[2]-s);
}

function sglSubSV3(v, s) {
	return sglV3C(s-v[0], s-v[1], s-v[2]);
}

function sglMulV3(u, v) {
	return sglV3C(u[0]*v[0], u[1]*v[1], u[2]*v[2]);
}

function sglMulV3S(v, s) {
	return sglV3C(v[0]*s, v[1]*s, v[2]*s);
}

function sglMulSV3(s, v) {
	return sglMulV3S(v, s);
}

function sglDivV3(u, v) {
	return sglV3C(u[0]/v[0], u[1]/v[1], u[2]/v[2]);
}

function sglDivV3S(v, s) {
	return sglV3C(v[0]/s, v[1]/s, v[2]/s);
}

function sglDivSV3(s, v) {
	return sglV3C(s/v[0], s/v[1], s/v[2]);
}

function sglRcpV3(v) {
	return sglDivSV3(1.0, v);
}

function sglDotV3(u, v) {
	return (u[0]*v[0] + u[1]*v[1] + u[2]*v[2]);
}

function sglCrossV3(u, v) {
	return sglV3C(u[1]*v[2] - u[2]*v[1], u[2]*v[0] - u[0]*v[2], u[0]*v[1] - u[1]*v[0]);
}

function sglSqLengthV3(v) {
	return sglDotV3(v, v);
}

function sglLengthV3(v) {
	return sglSqrt(sglSqLengthV3(v));
}

function sglNormalizedV3(v) {
	var f = 1.0 / sglLengthV3(v);
	return sglMulV3S(v, f);
}

function sglSelfNegV3(v) {
	v[0] = -v[0];
	v[1] = -v[1];
	v[2] = -v[2];
	return v;
}

function sglSelfAddV3(u, v) {
	u[0] += v[0];
	u[1] += v[1];
	u[2] += v[2];
	return u;
}

function sglSelfAddV3S(v, s) {
	v[0] += s;
	v[1] += s;
	v[2] += s;
	return v;
}

function sglSelfAddSV3(s, v) {
	v[0] += s;
	v[1] += s;
	v[2] += s;
	return v;
}

function sglSelfSubV3(u, v) {
	u[0] -= v[0];
	u[1] -= v[1];
	u[2] -= v[2];
	return u;
}

function sglSelfSubV3S(v, s) {
	v[0] -= s;
	v[1] -= s;
	v[2] -= s;
	return v;
}

function sglSelfSubSV3(v, s) {
	v[0] = s - v[0];
	v[1] = s - v[1];
	v[2] = s - v[2];
	return v;
}

function sglSelfMulV3(u, v) {
	u[0] *= v[0];
	u[1] *= v[1];
	u[2] *= v[2];
	return u;
}

function sglSelfMulV3S(v, s) {
	v[0] *= s;
	v[1] *= s;
	v[2] *= s;
	return v;
}

function sglSelfMulSV3(s, v) {
	v[0] *= s;
	v[1] *= s;
	v[2] *= s;
	return v;
}

function sglSelfDivV3(u, v) {
	u[0] /= v[0];
	u[1] /= v[1];
	u[2] /= v[2];
	return u;
}

function sglSelfDivV3S(v, s) {
	u[0] /= s;
	u[1] /= s;
	u[2] /= s;
	return u;
}

function sglSelfDivSV3(s, v) {
	v[0] = s / v[0];
	v[1] = s / v[1];
	v[2] = s / v[2];
	return v;
}

function sglSelfRcpV3(v) {
	return sglSelfDivSV3(1.0, v);
}

function sglSelfCrossV3(u, v) {
	var t = sglV3C(u[1]*v[2] - u[2]*v[1], u[2]*v[0] - u[0]*v[2], u[0]*v[1] - u[1]*v[0]);
	u[0] = t[0];
	u[1] = t[1];
	u[2] = t[2];
	return u;
}

function sglSelfNormalizeV3(v) {
	var f = 1.0 / sglLengthV3(v);
	return sglSelfMulV3S(v, f);
}

function sglMinV3(u, v) {
	return [
		((u[0] < v[0]) ? (u[0]) : (v[0])),
		((u[1] < v[1]) ? (u[1]) : (v[1])),
		((u[2] < v[2]) ? (u[2]) : (v[2]))
	];
}

function sglMaxV3(u, v) {
	return [
		((u[0] > v[0]) ? (u[0]) : (v[0])),
		((u[1] > v[1]) ? (u[1]) : (v[1])),
		((u[2] > v[2]) ? (u[2]) : (v[2]))
	];
}

function sglV3toV2(v) {
	return v.slice(0, 2);
}

function sglV3toV4(v, w) {
	return sglV4C(v[0], v[1], v[2], w);
}
/***********************************************************************/


// 4-dimensional vector
/***********************************************************************/
function sglUndefV4(v) {
	return new Array(4);
}

function sglV4V(v) {
	return v.slice(0, 4);
}

function sglV4S(s) {
	return [ s, s, s, s ];
}

function sglV4C(x, y, z, w) {
	return [ x, y, z, w ];
}

function sglZeroV4() {
	return sglV4S(0.0);
}

function sglOneV4() {
	return sglV4S(1.0);
}

function sglV4() {
	var n = arguments.length;
	var s;
	switch (n) {
		case 1:
			if (arguments[0] instanceof Array) {
				return sglV4V(arguments[0]);
			}
			return sglV4S(arguments[0]);
		break;

		case 4:
			return sglV4V(arguments);
		break;

		default:
			return sglZeroV4();
		break;
	}
	return null;
}

function sglDupV4(v) {
	return v.slice(0, 4);
}

function sglNegV4(v) {
	return sglV4C(-v[0], -v[1], -v[2], -v[3]);
}

function sglAddV4(u, v) {
	return sglV4C(u[0]+v[0], u[1]+v[1], u[2]+v[2], u[3]+v[3]);
}

function sglAddV4S(v, s) {
	return sglV4C(v[0]+s, v[1]+s, v[2]+s, v[3]+s);
}

function sglAddSV4(s, v) {
	return sglAddV4S(v, s)
}

function sglSubV4(u, v) {
	return sglV4C(u[0]-v[0], u[1]-v[1], u[2]-v[2], u[3]-v[3]);
}

function sglSubV4S(v, s) {
	return sglV4C(v[0]-s, v[1]-s, v[2]-s, v[3]-s);
}

function sglSubSV4(v, s) {
	return sglV4C(s-v[0], s-v[1], s-v[2], s-v[3]);
}

function sglMulV4(u, v) {
	return sglV4C(u[0]*v[0], u[1]*v[1], u[2]*v[2], u[3]*v[3]);
}

function sglMulV4S(v, s) {
	return sglV4C(v[0]*s, v[1]*s, v[2]*s, v[3]*s);
}

function sglMulSV4(s, v) {
	return sglMulV4S(v, s);
}

function sglDivV4(u, v) {
	return sglV4C(u[0]/v[0], u[1]/v[1], u[2]/v[2], u[3]/v[3]);
}

function sglDivV4S(v, s) {
	return sglV4C(v[0]/s, v[1]/s, v[2]/s, v[3]/s);
}

function sglDivSV4(s, v) {
	return sglV4C(s/v[0], s/v[1], s/v[2], s/v[3]);
}

function sglRcpV4(v) {
	return sglDivSV4(1.0, v);
}

function sglDotV4(u, v) {
	return (u[0]*v[0] + u[1]*v[1] + u[2]*v[2] + u[3]*v[3]);
}

function sglSqLengthV4(v) {
	return sglDotV4(v, v);
}

function sglLengthV4(v) {
	return sglSqrt(sglSqLengthV4(v));
}

function sglNormalizedV4(v) {
	var f = 1.0 / sglLengthV4(v);
	return sglMulV4S(v, f);
}

function sglProjectV4(v) {
	var f = 1.0 / v[3];
	return sglV4C(v[0]*f, v[1]*f, v[2]*f, 1.0);
}

function sglSelfNegV4(v) {
	v[0] = -v[0];
	v[1] = -v[1];
	v[2] = -v[2];
	v[3] = -v[3];
	return v;
}

function sglSelfAddV4(u, v) {
	u[0] += v[0];
	u[1] += v[1];
	u[2] += v[2];
	u[3] += v[3];
	return u;
}

function sglSelfAddV4S(v, s) {
	v[0] += s;
	v[1] += s;
	v[2] += s;
	v[3] += s;
	return v;
}

function sglSelfAddSV4(s, v) {
	v[0] += s;
	v[1] += s;
	v[2] += s;
	v[3] += s;
	return v;
}

function sglSelfSubV4(u, v) {
	u[0] -= v[0];
	u[1] -= v[1];
	u[2] -= v[2];
	u[3] -= v[3];
	return u;
}

function sglSelfSubV4S(v, s) {
	v[0] -= s;
	v[1] -= s;
	v[2] -= s;
	v[3] -= s;
	return v;
}

function sglSelfSubSV4(v, s) {
	v[0] = s - v[0];
	v[1] = s - v[1];
	v[2] = s - v[2];
	v[3] = s - v[3];
	return v;
}

function sglSelfMulV4(u, v) {
	u[0] *= v[0];
	u[1] *= v[1];
	u[2] *= v[2];
	u[3] *= v[3];
	return u;
}

function sglSelfMulV4S(v, s) {
	v[0] *= s;
	v[1] *= s;
	v[2] *= s;
	v[3] *= s;
	return v;
}

function sglSelfMulSV4(s, v) {
	v[0] *= s;
	v[1] *= s;
	v[2] *= s;
	v[3] *= s;
	return v;
}

function sglSelfDivV4(u, v) {
	u[0] /= v[0];
	u[1] /= v[1];
	u[2] /= v[2];
	u[3] /= v[3];
	return u;
}

function sglSelfDivV4S(v, s) {
	u[0] /= s;
	u[1] /= s;
	u[2] /= s;
	u[3] /= s;
	return u;
}

function sglSelfDivSV4(s, v) {
	v[0] = s / v[0];
	v[1] = s / v[1];
	v[2] = s / v[2];
	v[3] = s / v[3];
	return v;
}

function sglSelfRcpV4(v) {
	return sglSelfDivSV4(1.0, v);
}

function sglSelfNormalizeV4(v) {
	var f = 1.0 / sglLengthV4(v);
	return sglSelfMulV4S(v, f);
}

function sglSelfProjectV4(v) {
	var f = 1.0 / v[3];
	v[0] *= f;
	v[1] *= f;
	v[2] *= f;
	v[3]  = 1.0;
	return v;
}

function sglMinV4(u, v) {
	return [
		((u[0] < v[0]) ? (u[0]) : (v[0])),
		((u[1] < v[1]) ? (u[1]) : (v[1])),
		((u[2] < v[2]) ? (u[2]) : (v[2])),
		((u[3] < v[3]) ? (u[3]) : (v[3]))
	];
}

function sglMaxV4(u, v) {
	return [
		((u[0] > v[0]) ? (u[0]) : (v[0])),
		((u[1] > v[1]) ? (u[1]) : (v[1])),
		((u[2] > v[2]) ? (u[2]) : (v[2])),
		((u[3] > v[3]) ? (u[3]) : (v[3]))
	];
}

function sglV4toV2(v) {
	return v.slice(0, 2);
}

function sglV4toV3(v) {
	return v.slice(0, 3);
}
/***********************************************************************/


// 4x4 matrix
/***********************************************************************/
function sglUndefM4() {
	return new Array(16);
}

function sglM4V(v) {
	return v.slice(0, 16);
}

function sglM4S(s) {
	var m = sglUndefM4();
	for (var i=0; i<16; ++i) {
		m[i] = s;
	}
	return m;
}

function sglDiagM4V(d) {
	var m = sglM4S(0.0);
	m[ 0] = d[0];
	m[ 5] = d[1];
	m[10] = d[2];
	m[15] = d[3];
	return m;
}

function sglDiagM4S(s) {
	var m = sglM4S(0.0);
	m[ 0] = s;
	m[ 5] = s;
	m[10] = s;
	m[15] = s;
	return m;
}

function sglDiagM4C(m00, m11, m22, m33) {
	return sglDiagM4V(arguments);
}

function sglZeroM4() {
	return sglM4S(0.0);
}

function sglOneM4() {
	return sglM4S(1.0);
}

function sglIdentityM4() {
	return sglDiagM4S(1.0);
}

function sglM4() {
	var n = arguments.length;
	switch (n) {
		case 1:
			if (arguments[0] instanceof Array) {
				switch (arguments[0].length) {
					case 1:
						return sglDiagM4S(arguments[0]);
					break;
					case 4:
						return sglDiagM4V(arguments[0]);
					break;
					case 16:
						return sglM4V(arguments[0]);
					break;
					default:
						return sglIdentityM4();
					break;
				}
			}
			return sglM4S(arguments[0]);
		break;

		case 4:
			return sglDiagM4V(arguments);
		break;

		case 16:
			return sglM4V(arguments);
		break;

		default:
			return sglIdentityM4();
		break;
	}
	return null;
}

function sglDupM4(m) {
	var r = sglUndefM4();

	r[ 0] = m[ 0];
	r[ 1] = m[ 1];
	r[ 2] = m[ 2];
	r[ 3] = m[ 3];

	r[ 4] = m[ 4];
	r[ 5] = m[ 5];
	r[ 6] = m[ 6];
	r[ 7] = m[ 7];

	r[ 8] = m[ 8];
	r[ 9] = m[ 9];
	r[10] = m[10];
	r[11] = m[11];

	r[12] = m[12];
	r[13] = m[13];
	r[14] = m[14];
	r[15] = m[15];

	return r;

	//return m.slice(0, 16);
	//return m.slice();
}

function sglGetElemM4(m, row, col) {
	return m[row+col*4];
}

function sglSetElemM4(m, row, col, value) {
	m[row+col*4] = value;
}

function sglGetRowM4(m, r) {
	return sglV4C(m[r+0], m[r+4], m[r+8], m[r+12]);
}

function sglSetRowM4V(m, r, v) {
	m[r+ 0] = v[0];
	m[r+ 4] = v[1];
	m[r+ 8] = v[2];
	m[r+12] = v[3];
}

function sglSetRowM4S(m, r, s) {
	m[r+ 0] = s;
	m[r+ 4] = s;
	m[r+ 8] = s;
	m[r+12] = s;
}

function sglSetRowM4C(m, r, x, y, z, w) {
	m[r+ 0] = x;
	m[r+ 4] = y;
	m[r+ 8] = z;
	m[r+12] = w;
}

function sglGetColM4(m, c) {
	var i = c * 4;
	return sglV4C(m[i+0], m[i+1], m[i+2], m[i+3]);
}

function sglSetColM4V(m, c, v) {
	var i = c * 4;
	m[i+0] = v[0];
	m[i+1] = v[1];
	m[i+2] = v[2];
	m[i+3] = v[3];
}

function sglSetColM4S(m, c, s) {
	var i = c * 4;
	m[i+0] = s;
	m[i+1] = s;
	m[i+2] = s;
	m[i+3] = s;
}

function sglSetColM4C(m, c, x, y, z, w) {
	var i = c * 4;
	m[i+0] = x;
	m[i+1] = y;
	m[i+2] = z;
	m[i+3] = w;
}

function sglM4toM3(m) {
	return [
		m[ 0], m[ 1], m[ 2],
		m[ 4], m[ 5], m[ 6],
		m[ 8], m[ 9], m[10]
	];
}

function sglIsIdentityM4(m) {
	var i = 0;
	var j = 0;
	var s = 0.0;
	for (i=0; i<4; ++i) {
		for (j=0; j<4; ++j) {
			s = m[i+j*4];
			if ((i == j)) {
				if (s != 1.0) {
					return false;
				}
			}
			else {
				if (s != 0.0) {
					return false;
				}
			}
		}
	}
	return true;
}

function sglNegM4(m) {
	var r = sglUndefM4();
	for (var i=0; i<16; ++i) {
		r[i] = -m[i];
	}
	return r;
}

function sglAddM4(a, b) {
	var r = sglUndefM4();
	for (var i=0; i<16; ++i) {
		r[i] = a[i] + b[i];
	}
	return r;
}

function sglAddM4S(m, s)
{
	var r = sglUndefM4();
	for (var i=0; i<16; ++i) {
		r[i] = m[i] + s;
	}
	return r;
}

function sglAddSM4(s, m) {
	return sglAddM4S(m, s);
}

function sglSubM4(a, b) {
	var r = sglUndefM4();
	for (var i=0; i<16; ++i) {
		r[i] = a[i] - b[i];
	}
	return r;
}

function sglSubM4S(m, s) {
	var r = sglUndefM4();
	for (var i=0; i<16; ++i) {
		r[i] = m[i] - s;
	}
	return r;
}

function sglSubSM4(s, m) {
	var r = sglUndefM4();
	for (var i=0; i<16; ++i) {
		r[i] = s - m[i];
	}
	return r;
}

function sglMulM4(a, b) {
	var a0  = a[ 0], a1  = a[ 1],  a2 = a[ 2], a3  = a[ 3],
	    a4  = a[ 4], a5  = a[ 5],  a6 = a[ 6], a7  = a[ 7],
	    a8  = a[ 8], a9  = a[ 9], a10 = a[10], a11 = a[11],
	    a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15],

	    b0  = b[ 0], b1  = b[ 1], b2  = b[ 2], b3  = b[ 3],
	    b4  = b[ 4], b5  = b[ 5], b6  = b[ 6], b7  = b[ 7],
	    b8  = b[ 8], b9  = b[ 9], b10 = b[10], b11 = b[11],
	    b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];

	var r = sglUndefM4();

	r[ 0] = a0*b0 + a4*b1 + a8*b2  + a12*b3;
	r[ 1] = a1*b0 + a5*b1 + a9*b2  + a13*b3;
	r[ 2] = a2*b0 + a6*b1 + a10*b2 + a14*b3;
	r[ 3] = a3*b0 + a7*b1 + a11*b2 + a15*b3;

	r[ 4] = a0*b4 + a4*b5 + a8*b6  + a12*b7;
	r[ 5] = a1*b4 + a5*b5 + a9*b6  + a13*b7;
	r[ 6] = a2*b4 + a6*b5 + a10*b6 + a14*b7;
	r[ 7] = a3*b4 + a7*b5 + a11*b6 + a15*b7;

	r[ 8] = a0*b8 + a4*b9 + a8*b10  + a12*b11;
	r[ 9] = a1*b8 + a5*b9 + a9*b10  + a13*b11;
	r[10] = a2*b8 + a6*b9 + a10*b10 + a14*b11;
	r[11] = a3*b8 + a7*b9 + a11*b10 + a15*b11;

	r[12] = a0*b12 + a4*b13 + a8*b14  + a12*b15;
	r[13] = a1*b12 + a5*b13 + a9*b14  + a13*b15;
	r[14] = a2*b12 + a6*b13 + a10*b14 + a14*b15;
	r[15] = a3*b12 + a7*b13 + a11*b14 + a15*b15;

	/*
	r[ 0] = a[ 0]*b[ 0] + a[ 4]*b[ 1] + a[ 8]*b[ 2] + a[12]*b[ 3];
	r[ 1] = a[ 1]*b[ 0] + a[ 5]*b[ 1] + a[ 9]*b[ 2] + a[13]*b[ 3];
	r[ 2] = a[ 2]*b[ 0] + a[ 6]*b[ 1] + a[10]*b[ 2] + a[14]*b[ 3];
	r[ 3] = a[ 3]*b[ 0] + a[ 7]*b[ 1] + a[11]*b[ 2] + a[15]*b[ 3];

	r[ 4] = a[ 0]*b[ 4] + a[ 4]*b[ 5] + a[ 8]*b[ 6] + a[12]*b[ 7];
	r[ 5] = a[ 1]*b[ 4] + a[ 5]*b[ 5] + a[ 9]*b[ 6] + a[13]*b[ 7];
	r[ 6] = a[ 2]*b[ 4] + a[ 6]*b[ 5] + a[10]*b[ 6] + a[14]*b[ 7];
	r[ 7] = a[ 3]*b[ 4] + a[ 7]*b[ 5] + a[11]*b[ 6] + a[15]*b[ 7];

	r[ 8] = a[ 0]*b[ 8] + a[ 4]*b[ 9] + a[ 8]*b[10] + a[12]*b[11];
	r[ 9] = a[ 1]*b[ 8] + a[ 5]*b[ 9] + a[ 9]*b[10] + a[13]*b[11];
	r[10] = a[ 2]*b[ 8] + a[ 6]*b[ 9] + a[10]*b[10] + a[14]*b[11];
	r[11] = a[ 3]*b[ 8] + a[ 7]*b[ 9] + a[11]*b[10] + a[15]*b[11];

	r[12] = a[ 0]*b[12] + a[ 4]*b[13] + a[ 8]*b[14] + a[12]*b[15];
	r[13] = a[ 1]*b[12] + a[ 5]*b[13] + a[ 9]*b[14] + a[13]*b[15];
	r[14] = a[ 2]*b[12] + a[ 6]*b[13] + a[10]*b[14] + a[14]*b[15];
	r[15] = a[ 3]*b[12] + a[ 7]*b[13] + a[11]*b[14] + a[15]*b[15];
	*/

	return r;

	/*
	var r = sglUndefM4();

	r[ 0] = a[ 0]*b[ 0] + a[ 4]*b[ 1] + a[ 8]*b[ 2] + a[12]*b[ 3];
	r[ 1] = a[ 1]*b[ 0] + a[ 5]*b[ 1] + a[ 9]*b[ 2] + a[13]*b[ 3];
	r[ 2] = a[ 2]*b[ 0] + a[ 6]*b[ 1] + a[10]*b[ 2] + a[14]*b[ 3];
	r[ 3] = a[ 3]*b[ 0] + a[ 7]*b[ 1] + a[11]*b[ 2] + a[15]*b[ 3];

	r[ 4] = a[ 0]*b[ 4] + a[ 4]*b[ 5] + a[ 8]*b[ 6] + a[12]*b[ 7];
	r[ 5] = a[ 1]*b[ 4] + a[ 5]*b[ 5] + a[ 9]*b[ 6] + a[13]*b[ 7];
	r[ 6] = a[ 2]*b[ 4] + a[ 6]*b[ 5] + a[10]*b[ 6] + a[14]*b[ 7];
	r[ 7] = a[ 3]*b[ 4] + a[ 7]*b[ 5] + a[11]*b[ 6] + a[15]*b[ 7];

	r[ 8] = a[ 0]*b[ 8] + a[ 4]*b[ 9] + a[ 8]*b[10] + a[12]*b[11];
	r[ 9] = a[ 1]*b[ 8] + a[ 5]*b[ 9] + a[ 9]*b[10] + a[13]*b[11];
	r[10] = a[ 2]*b[ 8] + a[ 6]*b[ 9] + a[10]*b[10] + a[14]*b[11];
	r[11] = a[ 3]*b[ 8] + a[ 7]*b[ 9] + a[11]*b[10] + a[15]*b[11];

	r[12] = a[ 0]*b[12] + a[ 4]*b[13] + a[ 8]*b[14] + a[12]*b[15];
	r[13] = a[ 1]*b[12] + a[ 5]*b[13] + a[ 9]*b[14] + a[13]*b[15];
	r[14] = a[ 2]*b[12] + a[ 6]*b[13] + a[10]*b[14] + a[14]*b[15];
	r[15] = a[ 3]*b[12] + a[ 7]*b[13] + a[11]*b[14] + a[15]*b[15];

	return r;
	*/
}

function sglMulM4S(m, s) {
	var r = sglUndefM4();
	for (var i=0; i<16; ++i) {
		r[i] = m[i] * s;
	}
	return r;
}

function sglMulSM4(s, m) {
	return sglMulM4S(m, s);
}

function sglMulM4V3(m, v, w) {
	return [
		m[ 0] * v[0] + m[ 4] * v[1] + m[ 8] * v[2] + m[12] * w,
		m[ 1] * v[0] + m[ 5] * v[1] + m[ 9] * v[2] + m[13] * w,
		m[ 2] * v[0] + m[ 6] * v[1] + m[10] * v[2] + m[14] * w /* ,
		m[ 3] * v[0] + m[ 7] * v[1] + m[11] * v[2] + m[15] * w*/
	];
}

function sglMulM4V4(m, v) {
	return [
		m[ 0] * v[0] + m[ 4] * v[1] + m[ 8] * v[2] + m[12] * v[3],
		m[ 1] * v[0] + m[ 5] * v[1] + m[ 9] * v[2] + m[13] * v[3],
		m[ 2] * v[0] + m[ 6] * v[1] + m[10] * v[2] + m[14] * v[3],
		m[ 3] * v[0] + m[ 7] * v[1] + m[11] * v[2] + m[15] * v[3]
	];
}

function sglDivM4S(m, s) {
	var r = sglUndefM4();
	for (var i=0; i<16; ++i) {
		r[i] = m[i] / s;
	}
	return r;
}

function sglDivSM4(s, m) {
	var r = sglUndefM4();
	for (var i=0; i<16; ++i) {
		r[i] = s / m[i];
	}
	return r;
}

function sglRcpM4(m) {
	return sglDivSM4(1.0, m);
}

function sglCompMulM4(a, b) {
	var r = sglUndefM4();
	for (var i=0; i<16; ++i) {
		r[i] = a[i] * b[i];
	}
	return r;
}

function sglCompDivM4(a, b) {
	var r = sglUndefM4();
	for (var i=0; i<16; ++i) {
		r[i] = a[i] / b[i];
	}
	return r;
}

function sglTransposeM4(m) {
	var r = sglUndefM4();

	r[ 0] = m[ 0];
	r[ 1] = m[ 4];
	r[ 2] = m[ 8];
	r[ 3] = m[12];
	
	r[ 4] = m[ 1];
	r[ 5] = m[ 5];
	r[ 6] = m[ 9];
	r[ 7] = m[13];
	
	r[ 8] = m[ 2];
	r[ 9] = m[ 6];
	r[10] = m[10];
	r[11] = m[14];
	
	r[12] = m[ 3];
	r[13] = m[ 7];
	r[14] = m[11];
	r[15] = m[15];
	
	return r;
}

function sglDeterminantM4(m) {
	var m0  = m[ 0], m1  = m[ 1], m2  = m[ 2], m3  = m[ 3],
	    m4  = m[ 4], m5  = m[ 5], m6  = m[ 6], m7  = m[ 7],
	    m8  = m[ 8], m9  = m[ 9], m10 = m[10], m11 = m[11],
	    m12 = m[12], m13 = m[13], m14 = m[14], m15 = m[15]

	return (
		m12 * m9 * m6 * m3 - m8 * m13 * m6 * m3 - m12 * m5 * m10 * m3 + m4 * m13 * m10 * m3 +
		m8 * m5 * m14 * m3 - m4 * m9 * m14 * m3 - m12 * m9 * m2 * m7 + m8 * m13 * m2 * m7 +
		m12 * m1 * m10 * m7 - m0 * m13 * m10 * m7 - m8 * m1 * m14 * m7 + m0 * m9 * m14 * m7 +
		m12 * m5 * m2 * m11 - m4 * m13 * m2 * m11 - m12 * m1 * m6 * m11 + m0 * m13 * m6 * m11 +
		m4 * m1 * m14 * m11 - m0 * m5 * m14 * m11 - m8 * m5 * m2 * m15 + m4 * m9 * m2 * m15 +
		m8 * m1 * m6 * m15 - m0 * m9 * m6 * m15 - m4 * m1 * m10 * m15 + m0 * m5 * m10 * m15
	);
}

function sglInverseM4(m) {
	var m0  = m[ 0], m1  = m[ 1], m2  = m[ 2], m3  = m[ 3],
	    m4  = m[ 4], m5  = m[ 5], m6  = m[ 6], m7  = m[ 7],
	    m8  = m[ 8], m9  = m[ 9], m10 = m[10], m11 = m[11],
	    m12 = m[12], m13 = m[13], m14 = m[14], m15 = m[15]

	var t = sglUndefM4();

	t[ 0] = (m9*m14*m7-m13*m10*m7+m13*m6*m11-m5*m14*m11-m9*m6*m15+m5*m10*m15);
	t[ 1] = (m13*m10*m3-m9*m14*m3-m13*m2*m11+m1*m14*m11+m9*m2*m15-m1*m10*m15);
	t[ 2] = (m5*m14*m3-m13*m6*m3+m13*m2*m7-m1*m14*m7-m5*m2*m15+m1*m6*m15);
	t[ 3] = (m9*m6*m3-m5*m10*m3-m9*m2*m7+m1*m10*m7+m5*m2*m11-m1*m6*m11);

	t[ 4] = (m12*m10*m7-m8*m14*m7-m12*m6*m11+m4*m14*m11+m8*m6*m15-m4*m10*m15);
	t[ 5] = (m8*m14*m3-m12*m10*m3+m12*m2*m11-m0*m14*m11-m8*m2*m15+m0*m10*m15);
	t[ 6] = (m12*m6*m3-m4*m14*m3-m12*m2*m7+m0*m14*m7+m4*m2*m15-m0*m6*m15);
	t[ 7] = (m4*m10*m3-m8*m6*m3+m8*m2*m7-m0*m10*m7-m4*m2*m11+m0*m6*m11);

	t[ 8] = (m8*m13*m7-m12*m9*m7+m12*m5*m11-m4*m13*m11-m8*m5*m15+m4*m9*m15);
	t[ 9] = (m12*m9*m3-m8*m13*m3-m12*m1*m11+m0*m13*m11+m8*m1*m15-m0*m9*m15);
	t[10] = (m4*m13*m3-m12*m5*m3+m12*m1*m7-m0*m13*m7-m4*m1*m15+m0*m5*m15);
	t[11] = (m8*m5*m3-m4*m9*m3-m8*m1*m7+m0*m9*m7+m4*m1*m11-m0*m5*m11);

	t[12] = (m12*m9*m6-m8*m13*m6-m12*m5*m10+m4*m13*m10+m8*m5*m14-m4*m9*m14);
	t[13] = (m8*m13*m2-m12*m9*m2+m12*m1*m10-m0*m13*m10-m8*m1*m14+m0*m9*m14);
	t[14] = (m12*m5*m2-m4*m13*m2-m12*m1*m6+m0*m13*m6+m4*m1*m14-m0*m5*m14);
	t[15] = (m4*m9*m2-m8*m5*m2+m8*m1*m6-m0*m9*m6-m4*m1*m10+m0*m5*m10);

	var s = 1.0 / (
		m12 * m9 * m6 * m3 - m8 * m13 * m6 * m3 - m12 * m5 * m10 * m3 + m4 * m13 * m10 * m3 +
		m8 * m5 * m14 * m3 - m4 * m9 * m14 * m3 - m12 * m9 * m2 * m7 + m8 * m13 * m2 * m7 +
		m12 * m1 * m10 * m7 - m0 * m13 * m10 * m7 - m8 * m1 * m14 * m7 + m0 * m9 * m14 * m7 +
		m12 * m5 * m2 * m11 - m4 * m13 * m2 * m11 - m12 * m1 * m6 * m11 + m0 * m13 * m6 * m11 +
		m4 * m1 * m14 * m11 - m0 * m5 * m14 * m11 - m8 * m5 * m2 * m15 + m4 * m9 * m2 * m15 +
		m8 * m1 * m6 * m15 - m0 * m9 * m6 * m15 - m4 * m1 * m10 * m15 + m0 * m5 * m10 * m15
	);

	for (var i=0; i<16; ++i) t[i] *= s;

	return t;
}

function sglTraceM4(m) {
	return (m[0] + m[5] + m[10] + m[15]);
}

function sglTranslationM4V(v) {
	var m = sglIdentityM4();
	m[12] = v[0];
	m[13] = v[1];
	m[14] = v[2];
	return m;
}

function sglTranslationM4C(x, y, z) {
	return sglTranslationM4V([x, y, z]);
}

function sglTranslationM4S(s) {
	return sglTranslationM4C(s, s, s);
}

function sglRotationAngleAxisM4V(angleRad, axis) {
	var ax = sglNormalizedV3(axis);
	var s  = sglSin(angleRad);
	var c  = sglCos(angleRad);
	var q   = 1.0 - c;

	var x = ax[0];
	var y = ax[1];
	var z = ax[2];

	var xx, yy, zz, xy, yz, zx, xs, ys, zs;

	xx = x * x;
	yy = y * y;
	zz = z * z;
	xy = x * y;
	yz = y * z;
	zx = z * x;
	xs = x * s;
	ys = y * s;
	zs = z * s;

	var m = sglUndefM4();

	m[ 0] = (q * xx) + c;
	m[ 1] = (q * xy) + zs;
	m[ 2] = (q * zx) - ys;
	m[ 3] = 0.0;

	m[ 4] = (q * xy) - zs;
	m[ 5] = (q * yy) + c;
	m[ 6] = (q * yz) + xs;
	m[ 7] = 0.0;

	m[ 8] = (q * zx) + ys;
	m[ 9] = (q * yz) - xs;
	m[10] = (q * zz) + c;
	m[11] = 0.0;

	m[12] = 0.0;
	m[13] = 0.0;
	m[14] = 0.0;
	m[15] = 1.0;

	return m;
}

function sglRotationAngleAxisM4C(angleRad, ax, ay, az) {
	return sglRotationAngleAxisM4V(angleRad, [ax, ay, az]);
}

function sglScalingM4V(v) {
	var m = sglIdentityM4();
	m[ 0] = v[0];
	m[ 5] = v[1];
	m[10] = v[2];
	return m;
}

function sglScalingM4C(x, y, z) {
	return sglScalingM4V([x, y, z]);
}

function sglScalingM4S(s) {
	return sglScalingM4C(s, s, s);
}

function sglLookAtM4V(position, target, up) {
	var v = sglNormalizedV3(sglSubV3(target, position));
	var u = sglNormalizedV3(up);
	var s = sglNormalizedV3(sglCrossV3(v, u));

	u = sglNormalizedV3(sglCrossV3(s, v));

	var m = sglUndefM4();

	m[ 0] =  s[0];
	m[ 1] =  u[0];
	m[ 2] = -v[0];
	m[ 3] =   0.0;

	m[ 4] =  s[1];
	m[ 5] =  u[1];
	m[ 6] = -v[1];
	m[ 7] =   0.0;

	m[ 8] =  s[2];
	m[ 9] =  u[2];
	m[10] = -v[2];
	m[11] =   0.0;

	m[12] =   0.0;
	m[13] =   0.0;
	m[14] =   0.0;
	m[15] =   1.0;

	m = sglMulM4(m, sglTranslationM4V(sglNegV3(position)));

	return m;
}

function sglLookAtM4C(positionX, positionY, positionZ, targetX, targetY, targetZ, upX, upY, upZ) {
	return sglLookAtM4V([positionX, positionY, positionZ], [targetX, targetY, targetZ], [upX, upY, upZ]);
}

function sglOrthoM4V(omin, omax) {
	var sum   = sglAddV3(omax, omin);
	var dif   = sglSubV3(omax, omin);

	var m = sglUndefM4();

	m[ 0] =      2.0 / dif[0];
	m[ 1] =               0.0;
	m[ 2] =               0.0;
	m[ 3] =               0.0;

	m[ 4] =               0.0;
	m[ 5] =      2.0 / dif[1];
	m[ 6] =               0.0;
	m[ 7] =               0.0;

	m[ 8] =               0.0;
	m[ 9] =               0.0;
	m[10] =     -2.0 / dif[2];
	m[11] =                 0.0;

	m[12] =  -sum[0] / dif[0];
	m[13] =  -sum[1] / dif[1];
	m[14] =  -sum[2] / dif[2];
	m[15] =               1.0;

	return m;
}

function sglOrthoM4C(left, right, bottom, top, zNear, zFar) {
	return sglOrthoM4V([left, bottom, zNear], [right, top, zFar]);
}

function sglFrustumM4V(fmin, fmax) {
	var sum   = sglAddV3(fmax, fmin);
	var dif   = sglSubV3(fmax, fmin);
	var t     = 2.0 * fmin[2];

	var m = sglUndefM4();
	
	m[ 0] =            t / dif[0];
	m[ 1] =                   0.0;
	m[ 2] =                   0.0;
	m[ 3] =                   0.0;

	m[ 4] =                   0.0;
	m[ 5] =            t / dif[1];
	m[ 6] =                   0.0;
	m[ 7] =                   0.0;

	m[ 8] =       sum[0] / dif[0];
	m[ 9] =       sum[1] / dif[1];
	m[10] =      -sum[2] / dif[2];
	m[11] =                  -1.0;

	m[12] =                   0.0;
	m[13] =                   0.0;
	m[14] = -t * fmax[2] / dif[2];
	m[15] =                   0.0;

	return m;
}

function sglFrustumM4C(left, right, bottom, top, zNear, zFar) {
	return sglFrustumM4V([left, bottom, zNear], [right, top, zFar]);
}

function sglPerspectiveM4(fovYRad, aspectRatio, zNear, zFar) {
	var pmin = sglUndefV4();
	var pmax = sglUndefV4();

	pmin[2] = zNear;
	pmax[2] = zFar;

	pmax[1] = pmin[2] * sglTan(fovYRad / 2.0);
	pmin[1] = -pmax[1];

	pmax[0] = pmax[1] * aspectRatio;
	pmin[0] = -pmax[0];

	return sglFrustumM4V(pmin, pmax);
}
/***********************************************************************/


// quaternion
/***********************************************************************/
function sglUndefQuat(v) {
	return new Array(4);
}

function sglQuatV(v) {
	return v.slice(0, 4);
}

function sglIdentityQuat() {
	return [ 0.0, 0.0, 0.0, 1.0 ];
}

function sglAngleAxisQuat(angleRad, axis) {
	var halfAngle = angleRad / 2.0;
	var fsin = sglSin(halfAngle);
	return [
		fsin * axis[0],
		fsin * axis[1],
		fsin * axis[2],
		sglCos(halfAngle)
	];
}

function sglM4Quat(m) {
	var trace = sglGetElemM4(m, 0, 0) + sglGetElemM4(m, 1, 1) + sglGetElemM4(m, 2, 2);
	var root = null;
	var q = sglUndefQuat();

	if (trace > 0.0) {
		root = sglSqrt(trace + 1.0);
		q[3] = root / 2.0;
		root = 0.5 / root;
		q[0] = (sglGetElemM4(m, 2, 1) - sglGetElemM4(m, 1, 2)) * root;
		q[1] = (sglGetElemM4(m, 0, 2) - sglGetElemM4(m, 2, 0)) * root;
		q[2] = (sglGetElemM4(m, 1, 0) - sglGetElemM4(m, 0, 1)) * root;
	}
	else {
		var i = 0;

		if (sglGetElemM4(m, 1, 1) > sglGetElemM4(m, 0, 0)) i = 1;
		if (sglGetElemM4(m, 2, 2) > sglGetElemM4(m, i, i)) i = 2;

		var j = (i + 1) % 3;
		var k = (j + 1) % 3;

		root = sglSqrt(sglGetElemM4(m, i, i) - sglGetElemM4(m, j, j) - sglGetElemM4(m, k, k) + 1.0);

		q[i] = root / 2.0;
		root = 0.5 / root;
		q[3] = (sglGetElemM4(m, k, j) - sglGetElemM4(m, j, k)) * root;
		q[j] = (sglGetElemM4(m, j, i) + sglGetElemM4(m, i, j)) * root;
		q[k] = (sglGetElemM4(m, k, i) + sglGetElemM4(m, i, k)) * root;
	}
	return q;
}

function sglGetQuatAngleAxis(q) {
	var v = new Array(4);

	var sqLen = sglSqLengthV4(q);
	var angle = null;

	if (sqLen > 0.0) {
		var invLen = 1.0 / sglSqrt(sqLen);
		v[0] = q[0] * invLen;
		v[1] = q[1] * invLen;
		v[2] = q[2] * invLen;
		v[3] = 2.0 * aglAcos(q[3]);
	}
	else
	{
		v[0] = 0.0;
		v[1] = 0.0;
		v[2] = 1.0;
		v[3] = 0.0;
	}

	return v;
}

function sglGetQuatRotationM4(q) {
	var tx  = 2.0 * q[0];
	var ty  = 2.0 * q[1];
	var tz  = 2.0 * q[2];
	var twx = tx * q[3];
	var twy = ty * q[3];
	var twz = tz * q[3];
	var txx = tx * q[0];
	var txy = ty * q[0];
	var txz = tz * q[0];
	var tyy = ty * q[1];
	var tyz = tz * q[1];
	var tzz = tz * q[2];

	var m = sglIdentityM4();

	sglSetElemM4(m, 0, 0, 1.0 - (tyy + tzz));
	sglSetElemM4(m, 0, 1, txy - twz);
	sglSetElemM4(m, 0, 2, txz + twy);
	sglSetElemM4(m, 1, 0, txy + twz);
	sglSetElemM4(m, 1, 1, 1.0 - (txx + tzz));
	sglSetElemM4(m, 1, 2, tyz - twx);
	sglSetElemM4(m, 2, 0, txz - twy);
	sglSetElemM4(m, 2, 1, tyz + twx);
	sglSetElemM4(m, 2, 2, 1.0 - (txx + tyy));

	return m;
}

function sglNormalizedQuat(q) {
	return sglNormalizedV4(q);
}

function sglMulQuat(q1, q2) {
	var r = sglUndefQuat();

	r[0] = p[3] * q[0] + p[0] * q[3] + p[1] * q[2] - p[2] * q[1];
	r[1] = p[3] * q[1] + p[1] * q[3] + p[2] * q[0] - p[0] * q[2];
	r[2] = p[3] * q[2] + p[2] * q[3] + p[0] * q[1] - p[1] * q[0];
	r[3] = p[3] * q[3] - p[0] * q[0] - p[1] * q[1] - p[2] * q[2];
}
/***********************************************************************/


/*************************************************************************/
/*                                                                       */
/*  SpiderGL                                                             */
/*  JavaScript 3D Graphics Library on top of WebGL                       */
/*                                                                       */
/*  Copyright (C) 2010                                                   */
/*  Marco Di Benedetto                                                   */
/*  Visual Computing Laboratory                                          */
/*  ISTI - Italian National Research Council (CNR)                       */
/*  http://vcg.isti.cnr.it                                               */
/*  mailto: marco[DOT]dibenedetto[AT]isti[DOT]cnr[DOT]it                 */
/*                                                                       */
/*  This file is part of SpiderGL.                                       */
/*                                                                       */
/*  SpiderGL is free software; you can redistribute it and/or modify     */
/*  under the terms of the GNU Lesser General Public License as          */
/*  published by the Free Software Foundation; either version 2.1 of     */
/*  the License, or (at your option) any later version.                  */
/*                                                                       */
/*  SpiderGL is distributed in the hope that it will be useful, but      */
/*  WITHOUT ANY WARRANTY; without even the implied warranty of           */
/*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.                 */
/*  See the GNU Lesser General Public License                            */
/*  (http://www.fsf.org/licensing/licenses/lgpl.html) for more details.  */
/*                                                                       */
/*************************************************************************/


// SglVec2
/***********************************************************************/
/**
 * Constructs a SglVec2.
 * @class 2-dimensional vector.
 */
function SglVec2() {
	this.v = new Array(2);
	var n = arguments.length;
	switch (n) {
		case 1:
			if (arguments[0] instanceof Array) {
				this.setVec(arguments[0]);
			}
			else if (arguments[0] instanceof SglVec2) {
				this.setVec(arguments[0].v);
			}
			else {
				this.setScalar(arguments[0]);
			}
		break;
		case 2:
			this.setVec(arguments);
		break;
		default:
			this.setZero();
		break;
	}
}

SglVec2.prototype = {
	clone : function() {
		return new SglVec2(this);
	},

	get copy() {
		return this.clone();
	},

	get x( ) { return this.v[0]; },
	set x(n) { this.v[0] = n;    },
	get y( ) { return this.v[1]; },
	set y(n) { this.v[1] = n;    },

	set : function(x, y) {
		this.v[0] = x;
		this.v[1] = y;
		return this;
	},

	setVec : function(v) {
		return this.set(v[0], v[1]);
	},

	setScalar : function(s) {
		return this.set(s, s);
	},

	setZero : function() {
		return this.setScalar(0.0);
	},

	setOne : function() {
		return this.setScalar(1.0);
	},

	at : function(i) {
		return this.v[i];
	},

	get squaredLength() {
		return this.dot(this);
	},

	get length() {
		return sglSqrt(this.squaredLength);
	},

	normalize : function() {
		var f = this.length;
		if (f > 0.0) f = 1.0 / f;
		this.v[0] *= f;
		this.v[1] *= f;
		return this;
	},

	get normalized() {
		return this.clone().normalize();
	},

	get neg() {
		return new SglVec2(-(this.v[0]), -(this.v[1]));
	},

	get abs() {
		return new SglVec2(sglAbs(this.v[0]), sglAbs(this.v[1]));
	},

	get minComp() {
		var m = this.v[0];
		if (m > this.v[1]) m = this.v[1];
		return m;
	},

	get maxComp() {
		var m = this.v[0];
		if (m < this.v[1]) m = this.v[1];
		return m;
	},

	get argMin() {
		var a = 0;
		if (this.v[a] > this.v[1]) a = 1;
		return a;
	},

	get argMax() {
		var a = 0;
		if (this.v[a] > this.v[1]) a = 1;
		return a;
	},

	add : function(v) {
		return new SglVec2(this.v[0] + v.v[0], this.v[1] + v.v[1]);
	},

	sub : function(v) {
		return new SglVec2(this.v[0] - v.v[0], this.v[1] - v.v[1]);
	},

	mul : function(v) {
		return new SglVec2(this.v[0] * v.v[0], this.v[1] * v.v[1]);
	},

	div : function(v) {
		return new SglVec2(this.v[0] / v.v[0], this.v[1] / v.v[1]);
	},

	get rcp() {
		return new SglVec2(1.0 / this.v[0], 1.0 / this.v[1]);
	},

	dot : function(v) {
		return (this.v[0] * v.v[0] + this.v[1] * v.v[1]);
	},

	cross : function(v) {
		return (this.v[0]*v.v[1] - this.v[1]*v.v[0]);
	},

	min : function(v) {
		return new SglVec2(sglMin(this.v[0], v.v[0]), sglMin(this.v[1], v.v[1]));
	},

	max : function(v) {
		return new SglVec2(sglMax(this.v[0], v.v[0]), sglMax(this.v[1], v.v[1]));
	}
};
/***********************************************************************/


// SglVec3
/***********************************************************************/
/**
 * Constructs a SglVec3.
 * @class 3-dimensional vector.
 */
function SglVec3() {
	this.v = new Array(3);
	var n = arguments.length;
	switch (n) {
		case 1:
			if (arguments[0] instanceof Array) {
				this.setVec(arguments[0]);
			}
			else if (arguments[0] instanceof SglVec3) {
				this.setVec(arguments[0].v);
			}
			else {
				this.setScalar(arguments[0]);
			}
		break;
		case 3:
			this.setVec(arguments);
		break;
		default:
			this.setZero();
		break;
	}
}

SglVec3.prototype = {
	clone : function() {
		return new SglVec3(this);
	},

	get copy() {
		return this.clone();
	},

	get x( ) { return this.v[0]; },
	set x(n) { this.v[0] = n;    },
	get y( ) { return this.v[1]; },
	set y(n) { this.v[1] = n;    },
	get z( ) { return this.v[2]; },
	set z(n) { this.v[2] = n;    },

	set : function(x, y, z) {
		this.v[0] = x;
		this.v[1] = y;
		this.v[2] = z;
		return this;
	},

	setVec : function(v) {
		return this.set(v[0], v[1], v[2]);
	},

	setScalar : function(s) {
		return this.set(s, s, s);
	},

	setZero : function() {
		return this.setScalar(0.0);
	},

	setOne : function() {
		return this.setScalar(1.0);
	},

	at : function(i) {
		return this.v[i];
	},

	get squaredLength() {
		return this.dot(this);
	},

	get length() {
		return sglSqrt(this.squaredLength);
	},

	normalize : function() {
		var f = this.length;
		if (f > 0.0) f = 1.0 / f;
		this.v[0] *= f;
		this.v[1] *= f;
		this.v[2] *= f;
		return this;
	},

	get normalized() {
		return this.clone().normalize();
	},

	get neg() {
		return new SglVec3(-(this.v[0]), -(this.v[1]), -(this.v[2]));
	},

	get abs() {
		return new SglVec3(sglAbs(this.v[0]), sglAbs(this.v[1]), sglAbs(this.v[2]));
	},

	get minComp() {
		var m = this.v[0];
		if (m > this.v[1]) m = this.v[1];
		if (m > this.v[2]) m = this.v[2];
		return m;
	},

	get maxComp() {
		var m = this.v[0];
		if (m < this.v[1]) m = this.v[1];
		if (m < this.v[2]) m = this.v[2];
		return m;
	},

	get argMin() {
		var a = 0;
		if (this.v[a] > this.v[1]) a = 1;
		if (this.v[a] > this.v[2]) a = 2;
		return a;
	},

	get argMax() {
		var a = 0;
		if (this.v[a] > this.v[1]) a = 1;
		if (this.v[a] > this.v[2]) a = 2;
		return a;
	},

	add : function(v) {
		return new SglVec3(this.v[0] + v.v[0], this.v[1] + v.v[1], this.v[2] + v.v[2]);
	},

	sub : function(v) {
		return new SglVec3(this.v[0] - v.v[0], this.v[1] - v.v[1], this.v[2] - v.v[2]);
	},

	mul : function(v) {
		return new SglVec3(this.v[0] * v.v[0], this.v[1] * v.v[1], this.v[2] * v.v[2]);
	},

	div : function(v) {
		return new SglVec3(this.v[0] / v.v[0], this.v[1] / v.v[1], this.v[2] / v.v[2]);
	},

	get rcp() {
		return new SglVec3(1.0 / this.v[0], 1.0 / this.v[1], 1.0 / this.v[2]);
	},

	dot : function(v) {
		return (this.v[0] * v.v[0] + this.v[1] * v.v[1] + this.v[2] * v.v[2]);
	},

	cross : function(v) {
		return new SglVec3(this.v[1]*v.v[2] - this.v[2]*v.v[1], this.v[2]*v.v[0] - this.v[0]*v.v[2], this.v[0]*v.v[1] - this.v[1]*v.v[0]);
	},

	min : function(v) {
		return new SglVec3(sglMin(this.v[0], v.v[0]), sglMin(this.v[1], v.v[1]), sglMin(this.v[2], v.v[2]));
	},

	max : function(v) {
		return new SglVec3(sglMax(this.v[0], v.v[0]), sglMax(this.v[1], v.v[1]), sglMax(this.v[2], v.v[2]));
	}
};
/***********************************************************************/


// SglVec4
/***********************************************************************/
/**
 * Constructs a SglVec3.
 * @class 4-dimensional vector.
 */
function SglVec4() {
	this.v = new Array(4);
	var n = arguments.length;
	switch (n) {
		case 1:
			if (arguments[0] instanceof Array) {
				this.setVec(arguments[0]);
			}
			else if (arguments[0] instanceof SglVec4) {
				this.setVec(arguments[0].v);
			}
			else {
				this.setScalar(arguments[0]);
			}
		break;
		case 4:
			this.setVec(arguments);
		break;
		default:
			this.setZero();
		break;
	}
}

SglVec4.prototype = {
	clone : function() {
		return new SglVec4(this);
	},

	get copy() {
		return this.clone();
	},

	get x( ) { return this.v[0]; },
	set x(n) { this.v[0] = n;    },
	get y( ) { return this.v[1]; },
	set y(n) { this.v[1] = n;    },
	get z( ) { return this.v[2]; },
	set z(n) { this.v[2] = n;    },
	get w( ) { return this.v[3]; },
	set w(n) { this.v[3] = n;    },

	set : function(x, y, z, w) {
		this.v[0] = x;
		this.v[1] = y;
		this.v[2] = z;
		this.v[3] = w;
		return this;
	},

	setVec : function(v) {
		return this.set(v[0], v[1], v[2], v[3]);
	},

	setScalar : function(s) {
		return this.set(s, s, s, s);
	},

	setZero : function() {
		return this.setScalar(0.0);
	},

	setOne : function() {
		return this.setScalar(1.0);
	},

	at : function(i) {
		return this.v[i];
	},

	get squaredLength() {
		return this.dot(this);
	},

	get length() {
		return sglSqrt(this.squaredLength);
	},

	normalize : function() {
		var f = this.length;
		if (f > 0.0) f = 1.0 / f;
		this.v[0] *= f;
		this.v[1] *= f;
		this.v[2] *= f;
		this.v[3] *= f;
		return this;
	},

	get normalized() {
		return this.clone().normalize();
	},

	get neg() {
		return new SglVec4(-(this.v[0]), -(this.v[1]), -(this.v[2]), -(this.v[3]));
	},

	get abs() {
		return new SglVec4(sglAbs(this.v[0]), sglAbs(this.v[1]), sglAbs(this.v[2]), sglAbs(this.v[3]));
	},

	get minComp() {
		var m = this.v[0];
		if (m > this.v[1]) m = this.v[1];
		if (m > this.v[2]) m = this.v[2];
		if (m > this.v[3]) m = this.v[3];
		return m;
	},

	get maxComp() {
		var m = this.v[0];
		if (m < this.v[1]) m = this.v[1];
		if (m < this.v[2]) m = this.v[2];
		if (m < this.v[3]) m = this.v[3];
		return m;
	},

	get argMin() {
		var a = 0;
		if (this.v[a] > this.v[1]) a = 1;
		if (this.v[a] > this.v[2]) a = 2;
		if (this.v[a] > this.v[3]) a = 2;
		return a;
	},

	get argMax() {
		var a = 0;
		if (this.v[a] > this.v[1]) a = 1;
		if (this.v[a] > this.v[2]) a = 2;
		if (this.v[a] > this.v[3]) a = 2;
		return a;
	},

	add : function(v) {
		return new SglVec4(this.v[0] + v.v[0], this.v[1] + v.v[1], this.v[2] + v.v[2], this.v[3] + v.v[3]);
	},

	sub : function(v) {
		return new SglVec4(this.v[0] - v.v[0], this.v[1] - v.v[1], this.v[2] - v.v[2], this.v[3] - v.v[3]);
	},

	mul : function(v) {
		return new SglVec4(this.v[0] * v.v[0], this.v[1] * v.v[1], this.v[2] * v.v[2], this.v[3] * v.v[3]);
	},

	div : function(v) {
		return new SglVec4(this.v[0] / v.v[0], this.v[1] / v.v[1], this.v[2] / v.v[2], this.v[3] / v.v[3]);
	},

	get rcp() {
		return new SglVec4(1.0 / this.v[0], 1.0 / this.v[1], 1.0 / this.v[2], 1.0 / this.v[3]);
	},

	dot : function(v) {
		return (this.v[0] * v.v[0] + this.v[1] * v.v[1] + this.v[2] * v.v[2] + this.v[3] * v.v[3]);
	},

	/*
	cross : function(u, v, w) {
		return null;
	},
	*/

	min : function(v) {
		return new SglVec4(sglMin(this.v[0], v.v[0]), sglMin(this.v[1], v.v[1]), sglMin(this.v[2], v.v[2]), sglMin(this.v[3], v.v[3]));
	},

	max : function(v) {
		return new SglVec4(sglMax(this.v[0], v.v[0]), sglMax(this.v[1], v.v[1]), sglMax(this.v[2], v.v[2]), sglMax(this.v[3], v.v[3]));
	}
};
/***********************************************************************/


/*************************************************************************/
/*                                                                       */
/*  SpiderGL                                                             */
/*  JavaScript 3D Graphics Library on top of WebGL                       */
/*                                                                       */
/*  Copyright (C) 2010                                                   */
/*  Marco Di Benedetto                                                   */
/*  Visual Computing Laboratory                                          */
/*  ISTI - Italian National Research Council (CNR)                       */
/*  http://vcg.isti.cnr.it                                               */
/*  mailto: marco[DOT]dibenedetto[AT]isti[DOT]cnr[DOT]it                 */
/*                                                                       */
/*  This file is part of SpiderGL.                                       */
/*                                                                       */
/*  SpiderGL is free software; you can redistribute it and/or modify     */
/*  under the terms of the GNU Lesser General Public License as          */
/*  published by the Free Software Foundation; either version 2.1 of     */
/*  the License, or (at your option) any later version.                  */
/*                                                                       */
/*  SpiderGL is distributed in the hope that it will be useful, but      */
/*  WITHOUT ANY WARRANTY; without even the implied warranty of           */
/*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.                 */
/*  See the GNU Lesser General Public License                            */
/*  (http://www.fsf.org/licensing/licenses/lgpl.html) for more details.  */
/*                                                                       */
/*************************************************************************/


// SglPlane3
/***********************************************************************/
/**
 * Constructs a SglPlane3.
 * @class Represents a plane in space.
 */
function SglPlane3(normal, offset, normalize) {
	this._normal = [ 0.0, 0.0, 1.0 ];
	this._offset = 0.0;

	if (normal && offset) {
		this.setup(normal, offset, normalize);
	}
}

SglPlane3.prototype = {
	get normal()  { return this._normal;          },
	set normal(n) { this._normal = n.slice(0, 3); },

	get offset()  { return this._offset;          },
	set offset(o) { this._offset = o.slize(0, 3); },

	clone : function() {
		return new SglPlane3(this._normal, this._offset, false);
	},

	get copy() {
		return this.clone();
	},

	setup : function(normal, offset, nomalize) {
		this._normal[0] = normal[0];
		this._normal[1] = normal[1];
		this._normal[2] = normal[2];
		this._offset    = offset;

		if (normalize) {
			var s = sglSqrt(sglDotV3(this._normal));

			if (s > 0.0) {
				s = 1.0 / s;
				sglSelfMulV3S(this._normal, s);
				this._offset    *= s;
			}
		}
	}
};
/***********************************************************************/


// SglBox3
/***********************************************************************/
/**
 * Constructs a SglBox3.
 * @class Represents an axis-aligned box in space.
 */
function SglBox3(min, max) {
	this._min = [  1.0,  1.0,  1.0 ];
	this._max = [ -1.0, -1.0, -1.0 ];

	if (min && max) {
		this.setup(min, max);
	}
}

SglBox3.prototype = {
	get min()  { return this._min;          },
	set min(m) { this._min = m.slice(0, 3); },

	get max()  { return this._max;          },
	set max(m) { this._max = m.slice(0, 3); },

	clone : function() {
		return new SglBox3(this._min, this._max);
	},

	get copy() {
		return this.clone();
	},

	setup : function(min, max) {
		for (var i=0; i<3; ++i) {
			this._min[i] = min[i];
			this._max[i] = max[i];
		}
		return this;
	},

	get isNull() {
		return (this._min[0] > this._max[0]);
	},

	get isEmpty() {
		return (
			   (this._min[0] == this._max[0])
			&& (this._min[1] == this._max[1])
			&& (this._min[2] == this._max[2])
		);
	},

	get center() {
		return sglSelfMulV3S(sglAddV3(this._min, this._max), 0.5);
	},

	get size() {
		return sglSubV3(this._max, this._min);
	},

	get squaredDiagonal() {
		var s = this.size;
		return sglDotV3(s, s);
	},

	get diagonal() {
		return sglSqrt(this.squaredDiagonal);
	},

	get facesAreas() {
		var s = this.size;
		return [
			(s[1] * s[2]),
			(s[0] * s[2]),
			(s[0] * s[1])
		];
	},

	get surfaceArea() {
		var a = this.facesArea;
		return ((a[0] + a[1] + a[2]) * 2.0);
	},

	get volume() {
		var s = this.size;
		return (s[0] * s[1] * s[2]);
	},

	offset : function(halfDelta) {
		sglSelfSubV3S(this._min[i], halfDelta);
		sglSelfAddV3S(this._max[i], halfDelta);
		return this;
	},

	corner : function(index) {
		var s = this.size;
		return [
			this._min[0] + (((index % 2)       != (0.0)) ? (1.0) : (0.0)) * s[0],
			this._min[1] + ((((index / 2) % 2) != (0.0)) ? (1.0) : (0.0)) * s[1],
			this._min[2] + (((index > 3)       != (0.0)) ? (1.0) : (0.0)) * s[2]
		];
	},

	transformed : function(matrix) {
		var b = new SglBox3();
		var p = sglMulM4V3(matrix, this.corner(0), 1.0);
		b.min = p;
		b.max = p;
		for (var i=1; i<8; ++i) {
			p = sglMulM4V3(matrix, this.corner(i), 1.0);
			b.min = sglMinV3(b.min, p);
			b.max = sglMaxV3(b.max, p);
		}
		return b;
	},

	addPoint : function(p) {
		if (this.isNull) {
			this.min = p;
			this.max = p;
		}
		else {
			this.min = sglMinV3(this.min, p);
			this.max = sglMaxV3(this.min, p);
		}
		return this;
	},

	addBox : function(b) {
		if (!b.isNull) {
			if (this.isNull) {
				this.min = b.min;
				this.max = b.max;
			}
			else {
				this.min = sglMinV3(this.min, b.min);
				this.max = sglMaxV3(this.max, b.max);
			}
		}
		return this;
	}
};
/***********************************************************************/


// SglSphere3
/***********************************************************************/
/**
 * Constructs a SglSphere3.
 * @class Represents a sphere in space.
 */
function SglSphere3(center, radius) {
	this._center = [ 0.0, 0.0, 0.0 ];
	this._radius = -1.0;

	if (center && radius) {
		this.setup(center, radius);
	}
}

SglSphere3.prototype = {
	get center()  { return this._center;          },
	set center(c) { this._center = c.slice(0, 3); },

	get radius()  { return this._redius;          },
	set radius(r) { this._radius = r;             },

	clone : function() {
		return new SglSphere3(this._center, this._radius);
	},

	get copy() {
		return this.clone();
	},

	setup : function(center, radius) {
		this._center[0] = center[0];
		this._center[1] = center[1];
		this._center[2] = center[2];
		this._radius    = radius;
		return this;
	},

	get isNull() {
		return (this._radius < 0.0);
	},

	get isEmpty() {
		return (this._radius == 0.0);
	},

	get surfaceArea() {
		return (4.0 * SGL_PI * this._radius * this._radius);
	},

	get volume() {
		return ((4.0 / 3.0) * SGL_PI * this._radius * this._radius * this._radius);
	}
};
/***********************************************************************/


/*************************************************************************/
/*                                                                       */
/*  SpiderGL                                                             */
/*  JavaScript 3D Graphics Library on top of WebGL                       */
/*                                                                       */
/*  Copyright (C) 2010                                                   */
/*  Marco Di Benedetto                                                   */
/*  Visual Computing Laboratory                                          */
/*  ISTI - Italian National Research Council (CNR)                       */
/*  http://vcg.isti.cnr.it                                               */
/*  mailto: marco[DOT]dibenedetto[AT]isti[DOT]cnr[DOT]it                 */
/*                                                                       */
/*  This file is part of SpiderGL.                                       */
/*                                                                       */
/*  SpiderGL is free software; you can redistribute it and/or modify     */
/*  under the terms of the GNU Lesser General Public License as          */
/*  published by the Free Software Foundation; either version 2.1 of     */
/*  the License, or (at your option) any later version.                  */
/*                                                                       */
/*  SpiderGL is distributed in the hope that it will be useful, but      */
/*  WITHOUT ANY WARRANTY; without even the implied warranty of           */
/*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.                 */
/*  See the GNU Lesser General Public License                            */
/*  (http://www.fsf.org/licensing/licenses/lgpl.html) for more details.  */
/*                                                                       */
/*************************************************************************/


// SglMatrixStack
/***********************************************************************/
/**
 * Constructs a SglMatrixStack.
 * @class Represents a stack of 4x4 matrices.
 */
function SglMatrixStack() {
	this._s = [ ];
	this._s.push(sglIdentityM4());
	this._n = 0;
}

SglMatrixStack.prototype = {
	clone : function() {
		var ss = new SglMatrixStack();
		ss.s = [ ];
		for (var i=0; i<(this._n+1); ++i) {
			ss._s.push(sglDupM4(this._s[i]));
		}
		return ss;
	},

	get copy() {
		return this.clone();
	},

	reset : function() {
		this._s = [ ];
		this._s.push(sglIdentityM4());
		this._n = 0;
		return this;
	},

	get size() {
		return (this._n + 1);
	},

	get top() {
		return sglDupM4(this._s[this._n]);
	},

	get topRef() {
		return this._s[this._n];
	},

	push : function() {
		this._s.push(sglDupM4(this._s[this._n]));
		this._n++;
		return this;
	},

	pop : function() {
		if (this._n > 0) {
			this._s.pop();
			this._n--;
		}
		return this;
	},

	load : function(m) {
		this._s[this._n] = sglDupM4(m);
		return this;
	},

	multiply : function(m) {
		this._s[this._n] = sglMulM4(this._s[this._n], m);
		return this;
	},

	loadIdentity : function() {
		this._s[this._n] = sglIdentityM4();
		return this;
	},

	translate : function(x, y, z) {
		return this.multiply(sglTranslationM4C(x, y, z));
	},

	rotate : function(angleRad, x, y, z) {
		return this.multiply(sglRotationAngleAxisM4C(angleRad, x, y, z));
	},

	scale : function(x, y, z) {
		return this.multiply(sglScalingM4C(x, y, z));
	},

	lookAt : function(positionX, positionY, positionZ, targetX, targetY, targetZ, upX, upY, upZ) {
		return this.multiply(sglLookAtM4C(positionX, positionY, positionZ, targetX, targetY, targetZ, upX, upY, upZ));
	},

	ortho : function(left, right, bottom, top, zNear, zFar) {
		return this.multiply(sglOrthoM4C(left, right, bottom, top, zNear, zFar));
	},

	frustum : function(left, right, bottom, top, zNear, zFar) {
		return this.multiply(sglFrustumM4C(left, right, bottom, top, zNear, zFar));
	},

	perspective : function(fovYRad, aspectRatio, zNear, zFar) {
		return this.multiply(sglPerspectiveM4(fovYRad, aspectRatio, zNear, zFar));
	}
};
/***********************************************************************/


// SglTransformStack
/***********************************************************************/
/**
 * Constructs a SglTransformStack.
 * @class Holds model, view and projection matrix stacks.
 */
function SglTransformStack() {
	this._ms = new SglMatrixStack();
	this._vs = new SglMatrixStack();
	this._ps = new SglMatrixStack();
}

SglTransformStack.prototype = {
	clone : function() {
		var xs = new SglTransformStack();
		xs._ms = this._ms.clone();
		xs._vs = this._vs.clone();
		xs._ps = this._ps.clone();
		return xs;
	},

	get copy() {
		return this.clone();
	},

	reset : function() {
		this._ms.reset();
		this._vs.reset();
		this._ps.reset();
		return this;
	},

	get model() {
		return this._ms;
	},

	get view() {
		return this._vs;
	},

	get projection() {
		return this._ps;
	},

	get modelMatrix() {
		return this.model.top;
	},

	get modelMatrixRef() {
		return this.model.topRef;
	},

	get modelMatrixTranspose() {
		return sglTransposeM4(this.modelMatrixRef);
	},

	get modelMatrixInverse() {
		return sglInverseM4(this.modelMatrixRef);
	},

	get modelMatrixInverseTranspose() {
		return sglTransposeM4(this.modelMatrixInverse);
	},

	get viewMatrix() {
		return this.view.top;
	},

	get viewMatrixRef() {
		return this.view.topRef;
	},

	get viewMatrixTranspose() {
		return sglTransposeM4(this.viewMatrixRef);
	},

	get viewMatrixInverse() {
		return sglInverseM4(this.viewMatrixRef);
	},

	get viewMatrixInverseTranspose() {
		return sglTransposeM4(this.viewMatrixInverse);
	},

	get projectionMatrix() {
		return this.projection.top;
	},

	get projectionMatrixRef() {
		return this.projection.topRef;
	},

	get projectionMatrixTranspose() {
		return sglTransposeM4(this.projectionMatrixRef);
	},

	get projectionMatrixInverse() {
		return sglInverseM4(this.projectionMatrixRef);
	},

	get projectionMatrixInverseTranspose() {
		return sglTransposeM4(this.projectionMatrixInverse);
	},

	get modelViewMatrix() {
		return sglMulM4(this.viewMatrixRef, this.modelMatrixRef);
	},

	get modelViewMatrixTranspose() {
		return sglTransposeM4(this.modelViewMatrix);
	},

	get modelViewMatrixInverse() {
		return sglInverseM4(this.modelViewMatrix);
	},

	get modelViewMatrixInverseTranspose() {
		return sglTransposeM4(this.modelViewMatrixInverse);
	},

	get viewProjectionMatrix() {
		return sglMulM4(this.projectionMatrixRef, this.viewMatrixRef);
	},

	get viewProjectionMatrixTranspose() {
		return sglTransposeM4(this.viewProjectionMatrix);
	},

	get viewProjectionMatrixInverse() {
		return sglInverseM4(this.viewProjectionMatrix);
	},

	get viewProjectionMatrixInverseTranspose() {
		return sglTransposeM4(this.viewProjectionMatrixInverse);
	},

	get modelViewProjectionMatrix() {
		return sglMulM4(this.projectionMatrixRef, sglMulM4(this.viewMatrixRef, this.modelMatrixRef));
	},

	get modelViewProjectionMatrixTranspose() {
		return sglTransposeM4(this.modelViewProjectionMatrix);
	},

	get modelViewProjectionMatrixInverse() {
		return sglInverseM4(this.modelViewProjectionMatrix);
	},

	get modelViewProjectionMatrixInverseTranspose() {
		return sglTransposeM4(this.modelViewProjectionMatrixInverse);
	},

	get worldSpaceNormalMatrix() {
		return sglM4toM3(this.modelMatrixInverseTranspose);
	},

	get viewSpaceNormalMatrix() {
		return sglM4toM3(this.modelViewMatrixInverseTranspose);
	},

	get modelSpaceViewerPosition() {
		return sglV4toV3(sglGetColM4(this.modelViewMatrixInverse, 3));
	},

	get modelSpaceViewDirection() {
		return sglNegV3(sglV4toV3(sglGetRowM4(this.modelViewMatrix, 2)));
	},

	get worldSpaceViewerPosition() {
		return sglV4toV3(sglGetColM4(this.viewMatrixInverse, 3));
	},

	get worldSpaceViewDirection() {
		return ssglNegV3(sglV4toV3(sglGetRowM4(this.viewMatrixRef, 2)));
	}
};
/***********************************************************************/


// _SglFrustumPlane
/**********************************************************/
function _SglFrustumPlane() {
	this.normal     = [ 0.0, 0.0, 1.0 ];
	this.offset     = 0.0;
	this.testVertex = [ 0, 0, 0 ];
}

_SglFrustumPlane.prototype = {
	setup : function(nx, ny, nz, off) {
		var s = 1.0 / sglSqrt(nx*nx + ny*ny + nz*nz);

		this.normal[0] = nx * s;
		this.normal[1] = ny * s;
		this.normal[2] = nz * s;

		this.offset = off * s;

		this.testVertex[0] = (this.normal[0] >= 0.0) ? (1) : (0);
		this.testVertex[1] = (this.normal[1] >= 0.0) ? (1) : (0);
		this.testVertex[2] = (this.normal[2] >= 0.0) ? (1) : (0);
	}
};
/**********************************************************/


// SglFrustum
/**********************************************************/
const SGL_OUTSIDE_FRUSTUM   = 0;
const SGL_INTERSECT_FRUSTUM = 1;
const SGL_INSIDE_FRUSTUM    = 2;

/**
 * Constructs a SglFrustum.
 * @class Holds frustum information for operations such as visibility culling.
 */
function SglFrustum(projectionMatrix, modelViewMatrix, viewport) {
	this._mvpMatrix       = sglIdentityM4();
	this._viewport        = [ 0, 0, 1, 1 ];
	this._vp              = [ 0, 0, 1, 1 ];
	this._billboardMatrix = sglIdentityM4();

	this._planes = new Array(6);
	for (var i=0; i<6; ++i) {
		this._planes[i] = new _SglFrustumPlane();
	}

	if (projectionMatrix && modelViewMatrix && viewport) {
		this.setup(projectionMatrix, modelViewMatrix, viewport);
	}
}

SglFrustum.prototype = {
	setup : function (projectionMatrix, modelViewMatrix, viewport) {
		var rot = [
			sglGetColM4(modelViewMatrix, 0),
			sglGetColM4(modelViewMatrix, 1),
			sglGetColM4(modelViewMatrix, 2)
		];

		var sc = [
			sglLengthV4(rot[0]),
			sglLengthV4(rot[1]),
			sglLengthV4(rot[2])
		];

		var scRcp = sglRcpV3(sc);

		var sMat    = sglScalingM4V(sc);
		var sMatInv = sglScalingM4V(scRcp);

		rot[0] = sglMulV4S(rot[0], scRcp[0]);
		rot[1] = sglMulV4S(rot[1], scRcp[1]);
		rot[2] = sglMulV4S(rot[2], scRcp[2]);

		var rMatInv = sglIdentityM4();
		sglSetRowM4V(rMatInv, 0, rot[0]);
		sglSetRowM4V(rMatInv, 1, rot[1]);
		sglSetRowM4V(rMatInv, 2, rot[2]);

		this._mvpMatrix       = sglMulM4(projectionMatrix, modelViewMatrix);
		this._billboardMatrix = sglMulM4(sMatInv, sglMulM4(rMatInv, sMat));
		this._viewport        = viewport.slice(0, 4);

		this._vp[0] = this._viewport[2] * 0.5;
		this._vp[1] = this._viewport[0] + this._viewport[2] * 0.5;
		this._vp[2] = this._viewport[3] * 0.5;
		this._vp[3] = this._viewport[1] + this._viewport[3] * 0.5;


		var m = this._mvpMatrix;
		var q = [ m[3], m[7], m[11] ];

		this._planes[0].setup(q[ 0] - m[ 0], q[ 1] - m[ 4], q[ 2] - m[ 8], m[15] - m[12]);
		this._planes[1].setup(q[ 0] + m[ 0], q[ 1] + m[ 4], q[ 2] + m[ 8], m[15] + m[12]);
		this._planes[2].setup(q[ 0] - m[ 1], q[ 1] - m[ 5], q[ 2] - m[ 9], m[15] - m[13]);
		this._planes[3].setup(q[ 0] + m[ 1], q[ 1] + m[ 5], q[ 2] + m[ 9], m[15] + m[13]);
		this._planes[4].setup(q[ 0] - m[ 2], q[ 1] - m[ 6], q[ 2] - m[10], m[15] - m[14]);
		this._planes[5].setup(q[ 0] + m[ 2], q[ 1] + m[ 6], q[ 2] + m[10], m[15] + m[14]);
	},

	boxVisibility : function(boxMin, boxMax) {
		var ret = SGL_INSIDE_FRUSTUM;

		var bminmax = [ boxMin, boxMax ];

		var fp = null;
		for (var i=0; i<6; ++i) {
			fp = this._planes[i];
			if (
				((fp.normal[0] * bminmax[fp.testVertex[0]][0]) +
				 (fp.normal[1] * bminmax[fp.testVertex[1]][1]) +
				 (fp.normal[2] * bminmax[fp.testVertex[2]][2]) +
				 (fp.offset)) < 0.0
			) {
				return SGL_OUTSIDE_FRUSTUM;
			}

			if (
				((fp.normal[0] * bminmax[1 - fp.testVertex[0]][0]) +
				 (fp.normal[1] * bminmax[1 - fp.testVertex[1]][1]) +
				 (fp.normal[2] * bminmax[1 - fp.testVertex[2]][2]) +
				 (fp.offset)) < 0.0
			) {
				ret = SGL_INTERSECT_FRUSTUM;
			}
		}

		return ret;
	},

	projectedSegmentSize : function(center, size) {
		var hs = size * 0.5;

		var p0 = sglV3toV4(center, 0.0);
		var p1 = [ -hs, 0.0, 0.0, 1.0 ];
		var p2 = [  hs, 0.0, 0.0, 1.0 ];

		p1 = sglMulM4V4(this._billboardMatrix, p1);
		p1 = sglAddV4(p1, p0);
		p1 = sglProjectV4(sglMulM4V4(this._mvpMatrix, p1));

		p2 = sglMulM4V4(this._billboardMatrix, p2);
		p2 = sglAddV4(p2, p0);
		p2 = sglProjectV4(sglMulM4V4(this._mvpMatrix, p2));

		/*
		p1[0] = this._vp[0] * p1[0] + this._vp[1];
		p2[0] = this._vp[0] * p2[0] + this._vp[1];
		//p1[1] = this.viewport[3] * 0.5 * p1[1] + this.viewport[1] + this.viewport[3] * 0.5;

		p2[0] = this.viewport[2] * 0.5 * p2[0] + this.viewport[0] + this.viewport[2] * 0.5;
		//p2[1] = this.viewport[3] * 0.5 * p2[1] + this.viewport[1] + this.viewport[3] * 0.5;

		var size = aglAbs(p2[0] - p1[0]);
		*/

		var sz = this._vp[0] * sglAbs(p2[0] - p1[0]);

		return sz;
	}
};

function sglBoxVisibility(modelViewProjectionMatrix, boxMin, boxMax) {
	var fc = new SglFrustum(modelViewProjectionMatrix);
	return fc.boxVisibility(boxMin, boxMax);
}
/**********************************************************/


/*************************************************************************/
/*                                                                       */
/*  SpiderGL                                                             */
/*  JavaScript 3D Graphics Library on top of WebGL                       */
/*                                                                       */
/*  Copyright (C) 2010                                                   */
/*  Marco Di Benedetto                                                   */
/*  Visual Computing Laboratory                                          */
/*  ISTI - Italian National Research Council (CNR)                       */
/*  http://vcg.isti.cnr.it                                               */
/*  mailto: marco[DOT]dibenedetto[AT]isti[DOT]cnr[DOT]it                 */
/*                                                                       */
/*  This file is part of SpiderGL.                                       */
/*                                                                       */
/*  SpiderGL is free software; you can redistribute it and/or modify     */
/*  under the terms of the GNU Lesser General Public License as          */
/*  published by the Free Software Foundation; either version 2.1 of     */
/*  the License, or (at your option) any later version.                  */
/*                                                                       */
/*  SpiderGL is distributed in the hope that it will be useful, but      */
/*  WITHOUT ANY WARRANTY; without even the implied warranty of           */
/*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.                 */
/*  See the GNU Lesser General Public License                            */
/*  (http://www.fsf.org/licensing/licenses/lgpl.html) for more details.  */
/*                                                                       */
/*************************************************************************/


// GL utilities
/***********************************************************************/
function _sglConsolidateOptions(fullOptions, usedOptions)
{
	if (usedOptions) {
		for (var attr in usedOptions) {
			fullOptions[attr] = usedOptions[attr];
		}
	}
	return fullOptions;
}
/***********************************************************************/


// SglBufferInfo
/***********************************************************************/
function sglGetBufferOptions(gl, options) {
	var opt = {
		usage : gl.STATIC_DRAW
	};
	return _sglConsolidateOptions(opt, options);
}

/**
 * Constructs a SglBufferInfo.
 * @class Holds information about a WebGL buffer object.
 */
function SglBufferInfo() {
	this.handle = null;
	this.valid  = false;
	this.target = 0;
	this.size   = 0;
	this.usage  = 0;
}

function sglBufferFromData(gl, target, values, options) {
	var opt = sglGetBufferOptions(gl, options);
	var buff = gl.createBuffer();
	gl.bindBuffer(target, buff);
	gl.bufferData(target, values, opt.usage);
	gl.bindBuffer(target, null);

	var obj = new SglBufferInfo();
	obj.handle = buff;
	obj.valid  = true;
	obj.target = target;
	obj.size   = values.sizeInBytes;
	obj.usage  = opt.usage;

	return obj;
}

function sglVertexBufferFromData(gl, values, usage) {
	return sglBufferFromData(gl, gl.ARRAY_BUFFER, values, usage);
}

function sglIndexBufferFromData(gl, values, usage) {
	return sglBufferFromData(gl, gl.ELEMENT_ARRAY_BUFFER, values, usage);
}
/***********************************************************************/


// SglShaderInfo
/***********************************************************************/
/**
 * Constructs a SglShaderInfo.
 * @class Holds information about a WebGL shader object.
 */
function SglShaderInfo() {
	this.handle = null;
	this.valid  = false;
	this.type   = 0;
	this.log    = "";
}

function sglShaderFromSource(gl, type, src) {
	var log = "";
	log += "----------------------\n";

	var shd  = gl.createShader(type);
	gl.shaderSource(shd, src);
	gl.compileShader(shd);

	log += "[SHADER LOG]\n";
	var valid = true;
	if (gl.getShaderParameter(shd, gl.COMPILE_STATUS) != 0) {
		log += "SUCCESS:\n";
	}
	else {
		valid = false;
		log += "FAIL:\n";
	}
	log += gl.getShaderInfoLog(shd);
	log += "\n";
	log += "----------------------\n";

	var obj = new SglShaderInfo();
	obj.handle = shd;
	obj.valid  = valid;
	obj.type   = type;
	obj.log    = log;

	return obj;
}

function sglVertexShaderFromSource(gl, src) {
	return sglShaderFromSource(gl, gl.VERTEX_SHADER, src);
}

function sglFragmentShaderFromSource(gl, src) {
	return sglShaderFromSource(gl, gl.FRAGMENT_SHADER, src);
}
/***********************************************************************/


// SglProgramAttributeInfo
/***********************************************************************/
/**
 * Constructs a SglProgramAttributeInfo.
 * @class Holds information about a WebGL program active attribute.
 */
function SglProgramAttributeInfo() {
	this.name       = "";
	this.nativeType = 0;
	//this.scalarType = 0;
	//this.dimensions = 0;
	this.size       = 0;
	this.location   = -1;
}
/***********************************************************************/


// SglProgramUniformInfo
/***********************************************************************/
/**
 * Constructs a SglProgramAttributeInfo.
 * @class Holds information about a WebGL program active uniform.
 */
function SglProgramUniformInfo() {
	this.name       = "";
	this.nativeType = 0;
	//this.scalarType = 0;
	//this.dimensions = 0;
	this.size       = 0;
	this.location   = -1;
}
/***********************************************************************/


// SglProgramSamplerInfo
/***********************************************************************/
/**
 * Constructs a SglProgramSamplerInfo.
 * @class Holds information about a WebGL program active sampler.
 */
function SglProgramSamplerInfo() {
	this.name       = "";
	this.nativeType = 0;
	//this.scalarType = 0;
	//this.dimensions = 0;
	this.size       = 0;
	this.location   = -1;
}
/***********************************************************************/


// SglProgramInfo
/***********************************************************************/
/**
 * Constructs a SglProgramInfo.
 * @class Holds information about a WebGL program object.
 */
function SglProgramInfo() {
	this.handle     = null;
	this.valid      = false;
	this.shaders    = [ ];
	this.attributes = new Object();
	this.uniforms   = new Object();
	this.samplers   = new Object();
	this.log        = "";
}

function sglProgramFromShaders(gl, shaders) {
	var log = "";
	log += "----------------------\n";

	var prg = gl.createProgram();
	for (var s in shaders) {
		var shd = shaders[s];
		//if (shd.valid) {
			gl.attachShader(prg, shd.handle);
		//}
	}
	gl.linkProgram(prg);

	var valid = true;
	valid = valid && (gl.getProgramParameter(prg, gl.LINK_STATUS)     != 0);

	// validation is needed when uniforms are set, so skip this.
	//gl.validateProgram(prg);
	//valid = valid && (gl.getProgramParameter(prg, gl.VALIDATE_STATUS) != 0);

	log += "[PROGRAM LOG]\n";
	if (valid) {
		log += "SUCCESS:\n";
	}
	else {
		log += "FAIL:\n";
	}
	log += gl.getProgramInfoLog(prg);
	log += "\n";
	log += "----------------------\n";

	var obj = new SglProgramInfo();
	obj.handle = prg;
	obj.valid  = valid;
	for (var s in shaders) {
		var shd = shaders[s]
		//if (shd.valid) {
			obj.shaders.push(shd);
		//}
	}
	obj.log = log;

	var attribs_count = gl.getProgramParameter(prg, gl.ACTIVE_ATTRIBUTES);
	var attr, loc, a;
	for (var i=0; i<attribs_count; ++i) {
		attr = gl.getActiveAttrib(prg, i);
		if (!attr) continue;
		a    = new SglProgramAttributeInfo();
		a.name = attr.name;
		a.nativeType = attr.type;
		a.size = attr.size;
		a.location = gl.getAttribLocation(prg, attr.name);
		obj.attributes[a.name] = a;
	}

	var uniforms_count = gl.getProgramParameter(prg, gl.ACTIVE_UNIFORMS);
	var unif, loc, u;
	for (var i=0; i<uniforms_count; ++i) {
		unif = gl.getActiveUniform(prg, i);
		if (!unif) continue;
		loc  = gl.getUniformLocation(prg, unif.name);
		if ((unif.type == gl.SAMPLER_2D) || (unif.type == gl.SAMPLER_CUBE) || (unif.type == 35682)) {
			s = new SglProgramSamplerInfo();
			s.name = unif.name;
			s.nativeType = unif.type;
			s.size = unif.size;
			s.location = loc;
			obj.samplers[s.name] = s;
		}
		else {
			u = new SglProgramUniformInfo();
			u.name = unif.name;
			u.nativeType = unif.type;
			u.size = unif.size;
			u.location = loc;
			obj.uniforms[u.name] = u;
		}
	}

	sglSetDefaultProgramBindings(gl, obj);

	return obj;
}

function sglProgramFromSources(gl, vertexSources, fragmentSources) {
	var shd = null;
	var shaders = [ ];
	for (var s in vertexSources) {
		var src = vertexSources[s];
		shd = sglVertexShaderFromSource(gl, src);
		shaders.push(shd);
	}
	for (var s in fragmentSources) {
		var src = fragmentSources[s];
		shd = sglFragmentShaderFromSource(gl, src);
		shaders.push(shd);
	}
	return sglProgramFromShaders(gl, shaders);
}

function sglSetDefaultProgramBindings(gl, programInfo) {
	var prg = programInfo.handle;

	// ensure index is sequential in "for (attr in programInfo.attributes)" loops
	var index = 0;
	for (var v in programInfo.attributes) {
		var vattr = programInfo.attributes[v];
		gl.bindAttribLocation(prg, index, vattr.name);
		vattr.location = index;
		index++;
	}
	// must relink after attributes binding
	gl.linkProgram(prg);

	// uniform locations could change after program linking, so update them
	for (var u in programInfo.uniforms) {
		var unif = programInfo.uniforms[u];
		unif.location = gl.getUniformLocation(prg, unif.name);
	}

	gl.useProgram(programInfo.handle);
	// ensure texture unit is sequential in "for (attr in programInfo.samplers)" loops
	var unit = 0;
	for (var s in programInfo.samplers) {
		var smp = programInfo.samplers[s];
		smp.location = gl.getUniformLocation(prg, smp.name);
		gl.uniform1i(smp.location, unit);
		unit++;
	}
	//gl.useProgram(null);
}

function sglProgramSynchronize(gl, programInfo) {
	var prg = programInfo.handle;

	for (var v in programInfo.attributes) {
		var vattr = programInfo.attributes[v];
		vattr.location = gl.getAttribLocation(prg, vattr.name);
	}

	for (var u in programInfo.uniforms) {
		var unif = programInfo.uniforms[u];
		unif.location = gl.getUniformLocation(prg, unif.name);
	}

	for (var s in programInfo.samplers) {
		var smp = programInfo.samplers[s];
		smp.location = gl.getUniformLocation(prg, smp.name);
	}
}
/***********************************************************************/


// SglTextureInfo
/***********************************************************************/
function sglGetTextureOptions(gl, options) {
	var opt = {
		minFilter        : gl.LINEAR,
		magFilter        : gl.LINEAR,
		wrapS            : gl.CLAMP_TO_EDGE,
		wrapT            : gl.CLAMP_TO_EDGE,
		isDepth          : false,
		depthMode        : gl.LUMINANCE,
		depthCompareMode : gl.COMPARE_R_TO_TEXTURE,
		depthCompareFunc : gl.LEQUAL,
		generateMipmap   : false,
		flipY            : true,
		premultiplyAlpha : false,
		onload           : null
	};
	return _sglConsolidateOptions(opt, options);
}

/**
 * Constructs a SglTextureInfo.
 * @class Holds information about a WebGL texture object.
 */
function SglTextureInfo() {
	this.handle           = null;
	this.valid            = false;
	this.target           = 0;
	this.format           = 0;
	this.width            = 0;
	this.height           = 0;
	this.minFilter        = 0;
	this.magFilter        = 0;
	this.wrapS            = 0;
	this.wrapT            = 0;
	this.isDepth          = false;
	this.depthMode        = 0;
	this.depthCompareMode = 0;
	this.depthCompareFunc = 0;
}

function sglTexture2DFromData(gl, internalFormat, width, height, sourceFormat, sourceType, texels, options) {
	var opt = sglGetTextureOptions(gl, options);

	// Chrome does not like texels == null
	if (!texels) {
		if (sourceType == gl.FLOAT) {
			texels = new Float32Array(width * height * 4);
		}
		else {
			texels = new Uint8Array(width * height * 4);
		}
	}

	var tex = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, tex);

	var flipYEnabled  = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);
	var flipYRequired = (opt.flipY === true);
	if (flipYEnabled != flipYRequired) {
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, ((flipYRequired) ? (1) : (0)));
	}
	gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, sourceFormat, sourceType, texels);
	if (flipYEnabled != flipYRequired) {
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, ((flipYEnabled) ? (1) : (0)));
	}

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, opt.minFilter);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, opt.magFilter);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,     opt.wrapS    );
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,     opt.wrapT    );
	if (opt.isDepth) {
		gl.texParameteri(gl.TEXTURE_2D, gl.DEPTH_TEXTURE_MODE,   opt.depthMode);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, opt.depthCompareMode);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, opt.depthCompareFunc);
	}
	if (opt.generateMipmap) {
		gl.generateMipmap(gl.TEXTURE_2D);
	}
	gl.bindTexture(gl.TEXTURE_2D, null);

	var obj = new SglTextureInfo();
	obj.handle           = tex;
	obj.valid            = true;
	obj.target           = gl.TEXTURE_2D;
	obj.format           = internalFormat;
	obj.width            = width;
	obj.height           = height;
	obj.minFilter        = opt.minFilter;
	obj.magFilter        = opt.magFilter;
	obj.wrapS            = opt.wrapS;
	obj.wrapT            = opt.wrapT;
	obj.isDepth          = opt.isDepth;
	obj.depthMode        = opt.depthMode;
	obj.depthCompareMode = opt.depthCompareMode;
	obj.depthCompareFunc = opt.depthCompareFunc;

	return obj;
}

function sglTexture2DFromImage(gl, image, options) {
	var opt = sglGetTextureOptions(gl, options);

	var tex = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, tex);

	var flipYEnabled  = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);
	var flipYRequired = (opt.flipY === true);
	if (flipYEnabled != flipYRequired) {
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, ((flipYRequired) ? (1) : (0)));
	}
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	if (flipYEnabled != flipYRequired) {
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, ((flipYEnabled) ? (1) : (0)));
	}

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, opt.minFilter);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, opt.magFilter);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,     opt.wrapS    );
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,     opt.wrapT    );
	if (opt.generateMipmap) {
		gl.generateMipmap(gl.TEXTURE_2D);
	}
	gl.bindTexture(gl.TEXTURE_2D, null);

	var obj = new SglTextureInfo();
	obj.handle           = tex;
	obj.valid            = true;
	obj.target           = gl.TEXTURE_2D;
	obj.format           = gl.RGBA;
	obj.width            = image.width;
	obj.height           = image.height;
	obj.minFilter        = opt.minFilter;
	obj.magFilter        = opt.magFilter;
	obj.wrapS            = opt.wrapS;
	obj.wrapT            = opt.wrapT;
	obj.isDepth          = false;
	obj.depthMode        = 0;
	obj.depthCompareMode = 0;
	obj.depthCompareFunc = 0;

	return obj;
}

function sglTexture2DFromUrl(gl, url, options) {
	var opt = sglGetTextureOptions(gl, options);
	var obj = new SglTextureInfo();

	var img = new Image();
	img.onload = function() {
		var texInfo = sglTexture2DFromImage(gl, img, opt);
		for (var a in texInfo) {
			obj[a] = texInfo[a];
		}
		if (opt.onload) {
			opt.onload(gl, obj, url);
		}
	};
	img.src = url;

	return obj;
}
/***********************************************************************/


/***********************************************************************/
function sglTextureCubeFromData(gl, internalFormat, width, height, sourceFormat, sourceType, facesTexels, options) {
	var opt = sglGetTextureOptions(gl, options);

	// Chrome does not like texels == null
	if (!facesTexels) {
		var tx = null;
		if (sourceType == gl.FLOAT) {
			tx = new Float32Array(width * height * 4);
		}
		else {
			tx = new Uint8Array(width * height * 4);
		}
		facesTexels = new Array(6);
		for (var i=0; i<6; ++i) {
			facesTexels[i] = tx;
		}
	}

	var tex = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);

	var flipYEnabled  = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);
	var flipYRequired = (opt.flipY === true);
	if (flipYEnabled != flipYRequired) {
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, ((flipYRequired) ? (1) : (0)));
	}
	for (var i=0; i<6; ++i) {
		gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, internalFormat, width, height, 0, sourceFormat, sourceType, facesTexels[i]);
	}
	if (flipYEnabled != flipYRequired) {
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, ((flipYEnabled) ? (1) : (0)));
	}

	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, opt.minFilter);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, opt.magFilter);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S,     opt.wrapS    );
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T,     opt.wrapT    );
	if (opt.isDepth) {
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.DEPTH_TEXTURE_MODE,   opt.depthMode);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_COMPARE_MODE, opt.depthCompareMode);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_COMPARE_FUNC, opt.depthCompareFunc);
	}
	if (opt.generateMipmap) {
		gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
	}
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

	var obj = new SglTextureInfo();
	obj.handle           = tex;
	obj.valid            = true;
	obj.target           = gl.TEXTURE_CUBE_MAP;
	obj.format           = internalFormat;
	obj.width            = width;
	obj.height           = height;
	obj.minFilter        = opt.minFilter;
	obj.magFilter        = opt.magFilter;
	obj.wrapS            = opt.wrapS;
	obj.wrapT            = opt.wrapT;
	obj.isDepth          = opt.isDepth;
	obj.depthMode        = opt.depthMode;
	obj.depthCompareMode = opt.depthCompareMode;
	obj.depthCompareFunc = opt.depthCompareFunc;

	return obj;
}

function sglTextureCubeFromImages(gl, images, options) {
	var opt = sglGetTextureOptions(gl, options);

	var tex = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);

	var flipYEnabled  = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);
	var flipYRequired = (opt.flipY === true);
	if (flipYEnabled != flipYRequired) {
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, ((flipYRequired) ? (1) : (0)));
	}
	for (var i=0; i<6; ++i) {
		gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[i]);
	}
	if (flipYEnabled != flipYRequired) {
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, ((flipYEnabled) ? (1) : (0)));
	}
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, opt.minFilter);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, opt.magFilter);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S,     opt.wrapS    );
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T,     opt.wrapT    );
	if (opt.generateMipmap) {
		gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
	}
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

	var obj = new SglTextureInfo();
	obj.handle           = tex;
	obj.valid            = true;
	obj.target           = gl.TEXTURE_CUBE_MAP;
	obj.format           = gl.RGBA;
	obj.width            = images[0].width;
	obj.height           = images[0].height;
	obj.minFilter        = opt.minFilter;
	obj.magFilter        = opt.magFilter;
	obj.wrapS            = opt.wrapS;
	obj.wrapT            = opt.wrapT;
	obj.isDepth          = false;
	obj.depthMode        = 0;
	obj.depthCompareMode = 0;
	obj.depthCompareFunc = 0;

	return obj;
}

function sglTextureCubeFromUrls(gl, urls, options) {
	var opt = sglGetTextureOptions(gl, options);
	var obj = new SglTextureInfo();

	var remaining = 6;
	var images = new Array(6);
	for (var i=0; i<6; ++i) {
		images[i] = new Image();
	}
	var watcher = function() {
		remaining--;
		if (remaining == 0) {
			var texInfo = sglTextureCubeFromImages(gl, images, opt);
			for (var a in texInfo) {
				obj[a] = texInfo[a];
			}
			if (opt.onload) {
				opt.onload(gl, obj, urls);
			}
		}
	};
	for (var i=0; i<6; ++i) {
		images[i].onload = watcher;
		images[i].src    = urls[i];
	}

	return obj;
}
/***********************************************************************/


// SglRenderbufferInfo
/***********************************************************************/
/**
 * Constructs a SglRenderbufferInfo.
 * @class Holds information about a WebGL renderbuffer object.
 */
function SglRenderbufferInfo() {
	this.handle    = null;
	this.valid     = false;
	this.target    = 0;
	this.format    = 0;
	this.width     = 0;
	this.height    = 0;
}

function sglRenderbufferFromFormat(gl, format, width, height) {
	var rb = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
	gl.renderbufferStorage(gl.RENDERBUFFER, format, width, height);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);

	var obj = new SglRenderbufferInfo();
	obj.handle = rb;
	obj.valid  = true;
	obj.target = gl.RENDERBUFFER;
	obj.format = format;
	obj.width  = width;
	obj.height = height;

	return obj;
}
/***********************************************************************/


// SglFramebufferInfo
/***********************************************************************/
function sglGetFramebufferOptions(gl, options) {
	var opt = {
		minFilter             : gl.LINEAR,
		magFilter             : gl.LINEAR,
		wrapS                 : gl.CLAMP_TO_EDGE,
		wrapT                 : gl.CLAMP_TO_EDGE,
		isDepth               : false,
		depthMode             : gl.LUMINANCE,
		depthCompareMode      : gl.COMPARE_R_TO_TEXTURE,
		depthCompareFunc      : gl.LEQUAL,
		colorsAsRenderbuffer  : false,
		depthAsRenderbuffer   : false,
		stencilAsRenderbuffer : false,
		generateColorsMipmap  : false,
		generateDepthMipmap   : false,
		generateStencilMipmap : false
	};
	return _sglConsolidateOptions(opt, options);
}

/**
 * Constructs a SglFramebufferInfo.
 * @class Holds information about a WebGL framebuffer object.
 */
function SglFramebufferInfo() {
	this.handle        = null;
	this.valid         = false;
	this.width         = 0;
	this.height        = 0;
	this.colorTargets  = [ ];
	this.depthTarget   = null;
	this.stencilTarget = null;
	this.status        = 0;
}

function sglFramebufferFromTargets(gl, colorTargets, depthTarget, stencilTarget, options) {
	var opt = sglGetFramebufferOptions(gl, options);

	var fb = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

	if ((depthTarget != undefined) && (depthTarget != null) && (depthTarget != gl.NONE)) {
		if (depthTarget.target == gl.TEXTURE_2D) {
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTarget.handle, 0);
		}
		else if (depthTarget.target == gl.RENDERBUFFER) {
			gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthTarget.handle);
		}
	}

	if ((stencilTarget != undefined) && (stencilTarget != null) && (stencilTarget != gl.NONE)) {
		if (stencilTarget.target == gl.TEXTURE_2D) {
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.TEXTURE_2D, stencilTarget.handle, 0);
		}
		else if (stencilTarget.target == gl.RENDERBUFFER) {
			gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.RENDERBUFFER, stencilTarget.handle);
		}
	}

	var cts = [ ];
	var drawBuffers = [ ];
	if ((colorTargets != undefined) && (colorTargets != null)) {
		var n = colorTargets.length;
		if (n == 0) {
			drawBuffers.push(gl.NONE);
			//gl.readBuffer(gl.NONE);
		}
		else {
			var att = gl.COLOR_ATTACHMENT0;
			for (var c in colorTargets) {
				var ct = colorTargets[c];
				if (ct.target == gl.TEXTURE_2D) {
					gl.framebufferTexture2D(gl.FRAMEBUFFER, att, gl.TEXTURE_2D, ct.handle, 0);
				}
				else if (ct.target == gl.RENDERBUFFER) {
					gl.framebufferRenderbuffer(gl.FRAMEBUFFER, att, gl.RENDERBUFFER, ct.handle);
				}
				drawBuffers.push(att);
				cts.push(ct);
				att++;
			}
		}
	}
	//gl.drawBuffers(drawBuffers);
	var fbStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	var trg = null;
	if (cts.length > 0) {
		trg = cts[0];
	}
	else if (depthTarget) {
		trg = depthTarget;
	}
	else if (stencilTarget) {
		trg = stencilTarget;
	}

	var width  = 0;
	var height = 0;
	if (trg) {
		width  = trg.width;
		height = trg.height;
	}

	var obj = new SglFramebufferInfo();
	obj.handle        = fb;
	obj.valid         = (fbStatus == gl.FRAMEBUFFER_COMPLETE);
	obj.width         = width;
	obj.height        = height;
	obj.colorTargets  = cts;
	obj.depthTarget   = (depthTarget  ) ? (depthTarget  ) : (null);
	obj.stencilTarget = (stencilTarget) ? (stencilTarget) : (null);
	obj.status        = fbStatus;

	return obj;
}

function sglFramebufferFromFormats(gl, width, height, colorFormats, depthFormat, stencilFormat, options) {
	var opt = sglGetFramebufferOptions(gl, options);

	var colorTargets = null;
	if (colorFormats) {
		opt.isDepth = false;
		colorTargets = [ ];
		var ct = null;
		if (opt.colorsAsRenderbuffer) {
			for (var c in colorFormats) {
				var cc = colorFormats[c];
				ct = sglRenderbufferFromFormat(gl, cc, width, height);
				colorTargets.push(ct);
			}
		}
		else {
			opt.generateMipmap = opt.generateColorsMipmap;
			for (var c in colorFormats) {
				var cc = colorFormats[c];
				ct = sglTexture2DFromData(gl, cc, width, height, gl.RGBA, gl.UNSIGNED_BYTE, null, opt);
				colorTargets.push(ct);
			}
		}
	}

	var depthTarget = null;
	if (depthFormat) {
		opt.isDepth = true;
		if (opt.depthAsRenderbuffer) {
			depthTarget = sglRenderbufferFromFormat(gl, depthFormat, width, height);
		}
		else {
			opt.generateMipmap = opt.generateDepthMipmap;
			depthTarget = sglTexture2DFromData(gl, depthFormat, width, height, gl.DEPTH_COMPONENT, gl.FLOAT, null, opt);
		}
	}

	var stencilTarget = null;
	if (stencilFormat) {
		opt.isDepth = false;
		if (opt.stencilAsRenderbuffer) {
			stencilTarget = sglRenderbufferFromFormat(gl, stencilFormat, width, height);
		}
		else {
			opt.generateMipmap = opt.generateStencilMipmap;
			stencilTarget = sglTexture2DFromData(gl, stencilFormat, width, height, gl.STENCIL_COMPONENT, gl.UNSIGNED_BYTE, null, opt);
		}
	}

	return sglFramebufferFromTargets(gl, colorTargets, depthTarget, stencilTarget, opt);
}
/***********************************************************************/


/*************************************************************************/
/*                                                                       */
/*  SpiderGL                                                             */
/*  JavaScript 3D Graphics Library on top of WebGL                       */
/*                                                                       */
/*  Copyright (C) 2010                                                   */
/*  Marco Di Benedetto                                                   */
/*  Visual Computing Laboratory                                          */
/*  ISTI - Italian National Research Council (CNR)                       */
/*  http://vcg.isti.cnr.it                                               */
/*  mailto: marco[DOT]dibenedetto[AT]isti[DOT]cnr[DOT]it                 */
/*                                                                       */
/*  This file is part of SpiderGL.                                       */
/*                                                                       */
/*  SpiderGL is free software; you can redistribute it and/or modify     */
/*  under the terms of the GNU Lesser General Public License as          */
/*  published by the Free Software Foundation; either version 2.1 of     */
/*  the License, or (at your option) any later version.                  */
/*                                                                       */
/*  SpiderGL is distributed in the hope that it will be useful, but      */
/*  WITHOUT ANY WARRANTY; without even the implied warranty of           */
/*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.                 */
/*  See the GNU Lesser General Public License                            */
/*  (http://www.fsf.org/licensing/licenses/lgpl.html) for more details.  */
/*                                                                       */
/*************************************************************************/


// SglVertexBuffer
/***********************************************************************/
// SglVertexBuffer(gl, info)
// SglVertexBuffer(gl, values, usage)
/**
 * Constructs a SglVertexBuffer.
 * @class Manages a WebGL vertex buffer object.
 */
function SglVertexBuffer() {
	this.gl    = arguments[0];
	this._info = null;
	if (arguments[1] instanceof SglBufferInfo) {
		this._info = arguments[1];
	}
	else {
		this._info = sglVertexBufferFromData(this.gl, arguments[1], arguments[2]);
	}
}

SglVertexBuffer.prototype = {
	get info() { return this._info; },

	destroy : function() {
		if (this._info.valid) {
			this.gl.deleteBuffer(this._info.handle);
		}
		this._info = null;
	},

	get handle() {
		return this._info.handle;
	},

	get isValid() {
		return this._info.valid;
	},

	bind : function() {
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._info.handle);
	},

	unbind : function() {
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
	}
};
/***********************************************************************/


// SglIndexBuffer
/***********************************************************************/
// SglIndexBuffer(gl, info)
// SglIndexBuffer(gl, values, usage)
/**
 * Constructs a SglIndexBuffer.
 * @class Manages a WebGL index buffer object.
 */
function SglIndexBuffer() {
	this.gl    = arguments[0];
	this._info = null;
	if (arguments[1] instanceof SglBufferInfo) {
		this._info = arguments[1];
	}
	else {
		this._info = sglIndexBufferFromData(this.gl, arguments[1], arguments[2]);
	}
}

SglIndexBuffer.prototype = {
	get info() { return this._info; },

	destroy : function() {
		if (this._info.valid) {
			this.gl.deleteBuffer(this._info.handle);
		}
		this._info = null;
	},

	get handle() {
		return this._info.handle;
	},

	get isValid() {
		return this._info.valid;
	},

	bind : function() {
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this._info.handle);
	},

	unbind : function() {
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
	}
};
/***********************************************************************/


// SglProgramAttribute
/***********************************************************************/
/**
 * Constructs a SglProgramAttribute.
 * @class Manages a program attribute.
 */
function SglProgramAttribute(program, info) {
	this._prog = program;
	this._info = info;
}

SglProgramAttribute.prototype = {
	set index(n) {
		this._prog.gl.bindAttribLocation(this._prog._info.handle, n, this._info.name)
		this._info.location = n;
	},

	get index () {
		return this._info.location;
	}
};
/***********************************************************************/


// SglProgramUniform
/***********************************************************************/
/**
 * Constructs a SglProgramUniform.
 * @class Manages a program uniform.
 */
function SglProgramUniform(program, info) {
	this._prog = program;
	this._info = info;
	this._func = null;

	var gl   = this._prog.gl;
	var type = this._info.nativeType;

	if (type == gl.BOOL) {
		this._func = function (v) { this._prog.gl.uniform1i(this._info.location, v); };
	}
	else if (type == gl.BOOL_VEC2) {
		this._func = function (v) { this._prog.gl.uniform2iv(this._info.location, v); };
	}
	else if (type == gl.BOOL_VEC3) {
		this._func = function (v) { this._prog.gl.uniform3iv(this._info.location, v); };
	}
	else if (type == gl.BOOL_VEC4) {
		this._func = function (v) { this._prog.gl.uniform4iv(this._info.location, v); };
	}
	else if (type == gl.INT) {
		this._func = function (v) { this._prog.gl.uniform1i(this._info.location, v); };
	}
	else if (type == gl.INT_VEC2) {
		this._func = function (v) { this._prog.gl.uniform2iv(this._info.location, v); };
	}
	else if (type == gl.INT_VEC3) {
		this._func = function (v) { this._prog.gl.uniform3iv(this._info.location, v); };
	}
	else if (type == gl.INT_VEC4) {
		this._func = function (v) { this._prog.gl.uniform4iv(this._info.location, v); };
	}
	else if (type == gl.FLOAT) {
		this._func = function (v) { this._prog.gl.uniform1f(this._info.location, v); };
	}
	else if (type == gl.FLOAT_VEC2) {
		this._func = function (v) { this._prog.gl.uniform2fv(this._info.location, v); };
	}
	else if (type == gl.FLOAT_VEC3) {
		this._func = function (v) { this._prog.gl.uniform3fv(this._info.location, v); };
	}
	else if (type == gl.FLOAT_VEC4) {
		this._func = function (v) { this._prog.gl.uniform4fv(this._info.location, v); };
	}
	else if (type == gl.FLOAT_MAT2) {
		this._func = function (v) { this._prog.gl.uniformMatrix2fv(this._info.location, this._prog.gl.FALSE, v); };
	}
	else if (type == gl.FLOAT_MAT3) {
		this._func = function (v) { this._prog.gl.uniformMatrix3fv(this._info.location, this._prog.gl.FALSE, v); };
	}
	else if (type == gl.FLOAT_MAT4) {
		this._func = function (v) { this._prog.gl.uniformMatrix4fv(this._info.location, this._prog.gl.FALSE, v); };
	}
	else {
		sglUnknown();
	}
}

SglProgramUniform.prototype = {
	set value(v) {
		this._func(v);
	},

	get value() {
		return this._prog.gl.getUniform(this._prog._info.handle, this._info.location);
	}
};
/***********************************************************************/


// SglProgramSampler
/***********************************************************************/
/**
 * Constructs a SglProgramSampler.
 * @class Manages a program sampler.
 */
function SglProgramSampler(program, info) {
	this._prog = program;
	this._info = info;
	this._unit = -1;

	var gl   = this._prog.gl;
	var type = this._info.nativeType;

	if (type == gl.SAMPLER_2D) {
		;
	}
	else if (type == gl.SAMPLER_CUBE) {
		;
	}
	else if (type == 35682) {
		;
	}
	else {
		sglUnknown();
	}
}

SglProgramSampler.prototype = {
	set unit(n) {
		this._prog.gl.uniform1i(this._info.location, n);
		this._unit = n;
	},

	get unit() {
		//return this._prog.gl.getUniform(this._prog._info.handle, this._info.location);
		return this._unit;
	}
};
/***********************************************************************/


// SglProgram
/***********************************************************************/
// SglProgram(gl, info)
// SglProgram(gl, [vertexSources], [fragmentSources])
/**
 * Constructs a SglProgram.
 * @class Manages a WebGL program object.
 */
function SglProgram() {
	this.gl    = arguments[0];
	this._info = null;

	if (arguments[1] instanceof SglProgramInfo) {
		this._info = arguments[1];
	}
	else {
		this._info = sglProgramFromSources(this.gl, arguments[1], arguments[2]);
	}

	this._attributes = new Object();
	for (var a in this._info.attributes) {
		this._attributes[a] = new SglProgramAttribute(this, this._info.attributes[a]);
	}

	this._uniforms = new Object();
	for (var u in this._info.uniforms) {
		this._uniforms[u] = new SglProgramUniform(this, this._info.uniforms[u]);
	}

	var unit = 0;
	this._samplers = new Object();
	for (var s in this._info.samplers) {
		this._samplers[s] = new SglProgramSampler(this, this._info.samplers[s]);
		this._samplers[s]._unit = unit;
		unit++;
	}
}

SglProgram.prototype =
{
	get info()       { return this._info;        },
	get attributes() { return this._attributes;  },
	get uniforms()   { return this._uniforms;    },
	get samplers()   { return this._samplers;    },

	destroy : function() {
		if (this._info.valid == null) return;

		var gl = this.gl;

		gl.deleteProgram(this._info.handle);
		for (var s in this._info.shaders) {
			gl.deleteShader(this._info.shaders[s].handle);
		}

		this._attributes = null;
		this._uniforms   = null;
		this._samplers   = null;

		this._info = null;
	},

	get handle() {
		return this._info.handle;
	},

	get isValid() {
		return this._info.valid;
	},

	get log() {
		var log = "";
		log += "-------------------------------------\n";
		for (var s in this._info.shaders) {
			log += this._info.shaders[s].log;
		}
		log += this._info.log;
		log += "-------------------------------------\n";
		log += "\n";
		return log;
	},

	setDefaultBindings : function() {
		sglSetDefaultProgramBindings(this.gl, this._info);
	},

	synchronize : function() {
		sglProgramSynchronize(this.gl, this._info);
	},

	bind : function() {
		this.gl.useProgram(this._info.handle);
	},

	unbind : function() {
		//this.gl.useProgram(null);
	},

	setAttributes : function(mapping) {
		var attr = null;
		for (var a in mapping) {
			attr = this._attributes[a];
			if (attr) {
				attr.index = mapping[a];
			}
		}
		this.link();
	},

	setUniforms : function(mapping) {
		var unif = null;
		for (var u in mapping) {
			unif = this._uniforms[u];
			if (unif) {
				unif.value = mapping[u];
			}
		}
	},

	setSamplers : function(mapping) {
		var smp = null;
		for (var s in mapping) {
			smp = this._samplers[s];
			if (smp != undefined) {
				smp.unit = mapping[s];
			}
		}
	}
};
/***********************************************************************/


// SglTexture2D
/***********************************************************************/
// SglTexture2D(gl, info)
// SglTexture2D(gl, internalFormat, width, height, sourceFormat, sourceType, texels, options)
// SglTexture2D(gl, image, options)
// SglTexture2D(gl, url, options)
/**
 * Constructs a SglTexture2D.
 * @class Manages a WebGL 2D texture object.
 */
function SglTexture2D() {
	this.gl    = arguments[0];
	this._info = null;

	var gl = this.gl;

	var n = arguments.length;
	if ((n == 2) || (n == 3)) {
		if (arguments[1] instanceof Image) {
			this._info = sglTexture2DFromImage(gl, arguments[1], arguments[2]);
		}
		//else if (arguments[1] instanceof String) {
		else if (typeof(arguments[1]) == "string") {
			this._info = sglTexture2DFromUrl(gl, arguments[1], arguments[2]);
		}
		else {
			this._info = arguments[1];
		}
	}
	else {
		this._info = sglTexture2DFromData(gl, arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6], arguments[7]);
	}
}

SglTexture2D.prototype = {
	get info() { return this._info; },

	destroy : function() {
		if (this._info.handle == null) return;
		this.gl.deleteTexture(this._info.handle);
		this._info = null;
	},

	get handle() {
		return this._info.handle;
	},

	get isValid() {
		return this._info.valid;
	},

	bind : function(unit) {
		this.gl.activeTexture(this.gl.TEXTURE0 + unit);
		this.gl.bindTexture(this._info.target, this._info.handle);
	},

	unbind : function(unit) {
		this.gl.activeTexture(this.gl.TEXTURE0 + unit);
		this.gl.bindTexture(this._info.target, null);
	},

	generateMipmap : function() {
		this.gl.generateMipmap(this._info.target);
	}
};
/***********************************************************************/


// SglTextureCube
/***********************************************************************/
// SglTextureCube(gl, info)
// SglTextureCube(gl, internalFormat, width, height, sourceFormat, sourceType, facesTexels, options)
// SglTextureCube(gl, images, options)
// SglTextureCube(gl, urls, options)
/**
 * Constructs a SglTextureCube.
 * @class Manages a WebGL cube texture object.
 */
function SglTextureCube() {
	this.gl    = arguments[0];
	this._info = null;

	var gl = this.gl;

	var n = arguments.length;
	if ((n == 2) || (n == 3)) {
		if (arguments[1] instanceof Array) {
			if (arguments[1][0] instanceof Image) {
				this._info = sglTextureCubeFromImages(gl, arguments[1], arguments[2]);
			}
			//else if (arguments[1] instanceof String) {
			else if (typeof(arguments[1][0]) == "string") {
				this._info = sglTextureCubeFromUrls(gl, arguments[1], arguments[2]);
			}
		}
		else {
			this._info = arguments[1];
		}
	}
	else {
		this._info = sglTextureCubeFromData(gl, arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6], arguments[7]);
	}
}

SglTextureCube.prototype = {
	get info() { return this._info; },

	destroy : function() {
		if (this._info.handle == null) return;
		this.gl.deleteTexture(this._info.handle);
		this._info = null;
	},

	get handle() {
		return this._info.handle;
	},

	get isValid() {
		return this._info.valid;
	},

	bind : function(unit) {
		this.gl.activeTexture(this.gl.TEXTURE0 + unit);
		this.gl.bindTexture(this._info.target, this._info.handle);
	},

	unbind : function(unit) {
		this.gl.activeTexture(this.gl.TEXTURE0 + unit);
		this.gl.bindTexture(this._info.target, null);
	},

	generateMipmap : function() {
		this.gl.generateMipmap(this._info.target);
	}
};
/***********************************************************************/


// SglRenderbuffer
/***********************************************************************/
// SglRenderbuffer(gl, info)
// SglRenderbuffer(gl, format, width, height)
/**
 * Constructs a SglRenderbuffer.
 * @class Manages a WebGL renderbuffer object.
 */
function SglRenderbuffer() {
	this.gl    = arguments[0];
	this._info = null;

	var gl = this.gl;

	var n = arguments.length;
	if (n == 2) {
		this._info = arguments[1];
	}
	else {
		this._info = sglRenderbufferFromFormat(gl, arguments[1], arguments[2], arguments[3]);
	}
}

SglRenderbuffer.prototype = {
	get info() { return this._info; },

	destroy : function() {
		if (this._info.handle == null) return;
		this.gl.deleteRenderbuffer(this._info.handle);
		this._info = null;
	},

	get handle() {
		return this._info.handle;
	},

	get isValid() {
		return this._info.valid;
	},

	bind : function() {
		this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this._info.handle);
	},

	unbind : function() {
		this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
	}
};
/***********************************************************************/


// SglFramebuffer
/***********************************************************************/
// SglFramebuffer(gl, info)
// SglFramebuffer(gl, width, height, colorFormats, depthFormat, stencilFormat, options)
/**
 * Constructs a SglFramebuffer.
 * @class Manages a WebGL framebuffer object.
 */
function SglFramebuffer() {
	this.gl    = arguments[0];
	this._info = null;

	var gl = this.gl;

	var n = arguments.length;
	if (n == 2) {
		this._info = arguments[1];
	}
	else {
		this._info = sglFramebufferFromFormats(gl, arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6]);
	}

	var s = null;
	var t = null;

	this._colorTargets = [ ];
	for (var c in this._info.colorTargets) {
		s = this._info.colorTargets[c];
		t = null;
		if (s.target == gl.TEXTURE_2D) {
			t = new SglTexture2D(gl, s);
		}
		else if (s.target == gl.RENDERBUFFER) {
			t = new SglRenderbuffer(gl, s);
		}
		this._colorTargets.push(t);
	}

	this._depthTarget = null;
	if (this._info.depthTarget) {
		s = this._info.depthTarget;
		t = null;
		if (s.target == gl.TEXTURE_2D) {
			t = new SglTexture2D(gl, s);
		}
		else if (s.target == gl.RENDERBUFFER) {
			t = new SglRenderbuffer(gl, s);
		}
		this._depthTarget = t;
	}

	this._stencilTarget = null;
	if (this._info.stencilTarget) {
		s = this._info.stencilTarget;
		t = null;
		if (s.target == gl.TEXTURE_2D) {
			t = new SglTexture2D(gl, s);
		}
		else if (s.target == gl.RENDERBUFFER) {
			t = new SglRenderbuffer(gl, s);
		}
		this._stencilTarget = t;
	}
}

SglFramebuffer.prototype = {
	get info()          { return this._info;          },
	get colorTargets()  { return this._colorTargets;  },
	get depthTarget()   { return this._depthTarget;   },
	get stencilTarget() { return this._stencilTarget; },

	destroy : function() {
		if (this._info.handle == null) return;
		this.gl.deleteFramebuffer(this._info.handle);
		for (var t in this._colorTargets) {
			var ct = this._colorTargets[t];
			if (ct) {
				this._colorTargets[t].destroy();
			}
		}
		if (this._depthTarget) {
			this._depthTarget.destroy();
		}
		if (this._stencilTarget) {
			this._stencilTarget.destroy();
		}
		this._info   = null;
		this.targets = null;
	},

	get handle() {
		return this._info.handle;
	},

	get isValid() {
		return this._info.valid;
	},

	get width() {
		return this._info.width;
	},

	get height() {
		return this._info.height;
	},

	bind : function(setViewport) {
		var vp = true;
		if (setViewport != undefined) vp = setViewport;

		if (vp) {
			this.gl.viewport(0, 0, this._info.width, this._info.height);
		}

		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this._info.handle);
	},

	unbind : function() {
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
	},

	bindColor : function(index, unit) {
		this._colorTargets[index].bind(unit);
	},

	unbindColor : function(index, unit) {
		this._colorTargets[index].unbind(unit);
	},

	bindDepth : function(unit) {
		this._depthTarget.bind(unit);
	},

	unbindDepth : function(unit) {
		this._depthTarget.unbind(unit);
	},

	bindStencil : function(unit) {
		this._stencilTarget.bind(unit);
	},

	unbindStencil : function(unit) {
		this._stencilTarget.unbind(unit);
	},

	generateMipmap : function(colors, depth, stencil) {
		var t = null;

		if (colors) {
			for (var c in this._colorTargets) {
				t = this._colorTargets[c];
				if (!t) continue;
				if (t.info.target == this.gl.TEXTURE_2D) {
					t.bind(0);
					t.generateMipmap();
					t.unbind(0);
				}
			}
		}

		if (depth) {
			t = this._depthTarget;
			if (t) {
				if (t.info.target == this.gl.TEXTURE_2D) {
					t.bind(0);
					t.generateMipmap();
					t.unbind(0);
				}
			}
		}

		if (stencil) {
			t = this._stencilTarget;
			if (t) {
				if (t.info.target == this.gl.TEXTURE_2D) {
					t.bind(0);
					t.generateMipmap();
					t.unbind(0);
				}
			}
		}
	},

	attachColorTarget : function(index, t) {
		if (!t) return false;
		if ((index < 0) || (index >= this._colorTargets.length)) return false;
		if ((t.width != this.width) || (t.height != this.height)) return false;

		var gl = this.gl;

		var att = this.gl.COLOR_ATTACHMENT0 + index;
		if (t.target == gl.TEXTURE_2D) {
			gl.framebufferTexture2D(gl.FRAMEBUFFER, att, gl.TEXTURE_2D, t.handle, 0);
		}
		else if (t.target == gl.RENDERBUFFER) {
			gl.framebufferRenderbuffer(gl.FRAMEBUFFER, att, gl.RENDERBUFFER, t.handle);
		}

		this._colorTargets[index] = t;

		return true;
	},

	detachColorTarget : function(index) {
		if ((index < 0) || (index >= this._colorTargets.length)) return false;

		var t = this._colorTargets[index]
		if (!t) return false;

		var gl = this.gl;

		if (t.target == gl.TEXTURE_2D) {
			gl.framebufferTexture2D(gl.FRAMEBUFFER, att, gl.TEXTURE_2D, null, 0);
		}
		else if (t.target == gl.RENDERBUFFER) {
			gl.framebufferRenderbuffer(gl.FRAMEBUFFER, att, gl.RENDERBUFFER, null);
		}

		this._colorTargets[index] = null;

		return true;
	}
};
/***********************************************************************/


/*************************************************************************/
/*                                                                       */
/*  SpiderGL                                                             */
/*  JavaScript 3D Graphics Library on top of WebGL                       */
/*                                                                       */
/*  Copyright (C) 2010                                                   */
/*  Marco Di Benedetto                                                   */
/*  Visual Computing Laboratory                                          */
/*  ISTI - Italian National Research Council (CNR)                       */
/*  http://vcg.isti.cnr.it                                               */
/*  mailto: marco[DOT]dibenedetto[AT]isti[DOT]cnr[DOT]it                 */
/*                                                                       */
/*  This file is part of SpiderGL.                                       */
/*                                                                       */
/*  SpiderGL is free software; you can redistribute it and/or modify     */
/*  under the terms of the GNU Lesser General Public License as          */
/*  published by the Free Software Foundation; either version 2.1 of     */
/*  the License, or (at your option) any later version.                  */
/*                                                                       */
/*  SpiderGL is distributed in the hope that it will be useful, but      */
/*  WITHOUT ANY WARRANTY; without even the implied warranty of           */
/*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.                 */
/*  See the GNU Lesser General Public License                            */
/*  (http://www.fsf.org/licensing/licenses/lgpl.html) for more details.  */
/*                                                                       */
/*************************************************************************/


// SglAttributeStreamJS
/***************************************************************/
/**
 * Constructs a SglAttributeStreamJS.
 * @class Holds the properties and the storage array of a vertex attribute stream.
 */
function SglAttributeStreamJS(name, size, values, byCopy) {
	this._name = name;
	this._size = size;
	this._buff = (byCopy) ? ((values) ? (values.slice()) : (null)) : (values);
}

SglAttributeStreamJS.prototype = {
	get name()       { return this._name; },
	get size()       { return this._size; },
	get buffer()     { return this._buff; },
	get length()     { return this._buff.length; },

	get : function(index) {
		return this._buff.slice(index * this._size, this._size);
	},

	set : function(index, value) {
		var k = index * this._size;
		for (var i=0; i<this._size; ++i) {
			this._buff[k++] = value[i];
		}
		return r;
	}
};
/***************************************************************/


// SglVertexStreamJS
/***************************************************************/
/**
 * Constructs a SglVertexStreamJS.
 * @class Container of vertex attribute streams.
 */
function SglVertexStreamJS() {
	this._attribs = { };
	this._length  = 0;
}

SglVertexStreamJS.prototype = {
	get attributes() { return this._attribs; },
	get length()     { return this._length;  },

	addAttribute : function(name, size, values, byCopy) {
		var attr = new SglAttributeStreamJS(name, size, values, byCopy);
		this._attribs[name] = attr;
		this._length = attr.length;
	},

	removeAttribute : function(name) {
		if (!this._attribs[name]) return;

		delete this._attribs[name];

		this._length = 0;
		for (var a in this._attribs) {
			this._length = this._attribs[a].length;
			break;
		}
	}
};
/***************************************************************/


const SGL_ARRAY_PRIMITIVE_STREAM          = 1;
const SGL_INDEXED_PRIMITIVE_STREAM        = 2;
const SGL_PACKED_INDEXED_PRIMITIVE_STREAM = 3;

const SGL_POINTS_LIST    = 1;
const SGL_LINES_LIST     = 2;
const SGL_LINE_STRIP     = 3;
const SGL_LINE_LOOP      = 4;
const SGL_TRIANGLES_LIST = 5;
const SGL_TRIANGLE_STRIP = 6;
const SGL_TRIANGLE_FAN   = 7;


// SglPrimitiveStreamJS
/***************************************************************/
/**
 * Constructs a SglPrimitiveStreamJS.
 * @class Holds the primitives stream information and storage (if any).
 */
function SglPrimitiveStreamJS(name, mode, first, length) {
	this._name = name;
	this._mode = mode;
	this._first  = (first)  ? (first)  : (0);
	this._length = (length) ? (length) : (0);
}

SglPrimitiveStreamJS.prototype = {
	get type()   { return undefined;    },
	get name()   { return this._name;   },
	get mode()   { return this._mode;   },
	get first()  { return this._first;  },
	get length() { return this._length; }
}
/***************************************************************/


// SglArrayPrimitiveStreamJS
/***************************************************************/
/**
 * Constructs a SglArrayPrimitiveStreamJS.
 * @class Holds the array primitive stream information.
 */
function SglArrayPrimitiveStreamJS(name, mode, first, count) {
	SglPrimitiveStreamJS.call(this, name, mode, first, count);
}

sglInherit(SglArrayPrimitiveStreamJS, SglPrimitiveStreamJS);

sglDefineGetter(SglArrayPrimitiveStreamJS, "type", function() {
	return SGL_ARRAY_PRIMITIVE_STREAM;
});
/***************************************************************/


// SglIndexedPrimitiveStreamJS
/***************************************************************/
/**
 * Constructs a SglIndexedPrimitiveStreamJS.
 * @class Holds the indexed primitive stream information and storage.
 */
function SglIndexedPrimitiveStreamJS(name, mode, indices, byCopy) {
	SglPrimitiveStreamJS.call(this, name, mode, 0, indices.length);

	this._buff = (byCopy) ? ((indices) ? (indices.slice()) : (null)) : (indices);
}

sglInherit(SglIndexedPrimitiveStreamJS, SglPrimitiveStreamJS);

sglDefineGetter(SglIndexedPrimitiveStreamJS, "type", function() {
	return SGL_INDEXED_PRIMITIVE_STREAM;
});

sglDefineGetter(SglIndexedPrimitiveStreamJS, "buffer", function() {
	return this._buff;
});

sglDefineGetter(SglIndexedPrimitiveStreamJS, "length", function() {
	return this._buff.length;
});
/***************************************************************/


// SglConnectivityJS
/***************************************************************/
/**
 * Constructs a SglConnectivityJS.
 * @class Container for primitive streams.
 */
function SglConnectivityJS() {
	this._prims = { };
}

SglConnectivityJS.prototype = {
	get primitives() { return this._prims; },

	addArrayPrimitives : function(name, mode, first, count) {
		var prim = new SglArrayPrimitiveStreamJS(name, mode, first, count)
		this._prims[name] = prim;
	},

	addIndexedPrimitives : function(name, mode, indices, byCopy) {
		var prim = new SglIndexedPrimitiveStreamJS(name, mode, indices, byCopy)
		this._prims[name] = prim;
	},

	removePrimitives : function(name) {
		if (!this._prims[name]) return;
		delete this._prims[name];
	}
};
/***************************************************************/


// SglMeshJS
/***************************************************************/
/**
 * Constructs a SglMeshJS.
 * @class Mesh definition with vertex stream and primitive stream.
 */
function SglMeshJS() {
	this._valid = false;
	this._vert  = new SglVertexStreamJS();
	this._conn  = new SglConnectivityJS();
}

SglMeshJS.prototype = {
	get isValid()      { return this._valid;  },
	set isValid(value) { this._valid = value; },

	get vertices()     { return this._vert; },
	get connectivity() { return this._conn; },

	addVertexAttribute : function(name, size, values, byCopy) {
		this._vert.addAttribute(name, size, values, byCopy);
	},

	removeVertexAttribute : function(name) {
		this._vert.removeAttribute(name);
	},

	addArrayPrimitives : function(name, mode, first, count) {
		this._conn.addArrayPrimitives(name, mode, first, count);
	},

	addIndexedPrimitives : function(name, mode, indices, byCopy) {
		this._conn.addIndexedPrimitives(name, mode, indices, byCopy);
	},

	removePrimitives : function(name) {
		this._conn.removePrimitives(name);
	}
};
/***************************************************************/


/*************************************************************************/
/*                                                                       */
/*  SpiderGL                                                             */
/*  JavaScript 3D Graphics Library on top of WebGL                       */
/*                                                                       */
/*  Copyright (C) 2010                                                   */
/*  Marco Di Benedetto                                                   */
/*  Visual Computing Laboratory                                          */
/*  ISTI - Italian National Research Council (CNR)                       */
/*  http://vcg.isti.cnr.it                                               */
/*  mailto: marco[DOT]dibenedetto[AT]isti[DOT]cnr[DOT]it                 */
/*                                                                       */
/*  This file is part of SpiderGL.                                       */
/*                                                                       */
/*  SpiderGL is free software; you can redistribute it and/or modify     */
/*  under the terms of the GNU Lesser General Public License as          */
/*  published by the Free Software Foundation; either version 2.1 of     */
/*  the License, or (at your option) any later version.                  */
/*                                                                       */
/*  SpiderGL is distributed in the hope that it will be useful, but      */
/*  WITHOUT ANY WARRANTY; without even the implied warranty of           */
/*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.                 */
/*  See the GNU Lesser General Public License                            */
/*  (http://www.fsf.org/licensing/licenses/lgpl.html) for more details.  */
/*                                                                       */
/*************************************************************************/


// importers
/***********************************************************************/
function sglMeshJSImportOBJFromString(mesh, text) {
	var positionsArray = [ ];
	var texcoordsArray = [ ];
	var normalsArray   = [ ];
	var indicesArray   = [ ];

	var positions = [ ];
	var texcoords = [ ];
	var normals   = [ ];
	var facemap   = { };
	var index     = 0;

	var line = null;
	var f   = null;
	var pos = 0;
	var tex = 0;
	var nor = 0;
	var x   = 0.0;
	var y   = 0.0;
	var z   = 0.0;
	var tokens = null;

	var hasPos = false;
	var hasTex = false;
	var hasNor = false;

	var lines = text.split("\n");
	for (var lineIndex in lines) {
		line = lines[lineIndex].replace(/[ \t]+/g, " ").replace(/\s\s*$/, "");

		if (line[0] == "#") continue;

		tokens = line.split(" ");
		if (tokens[0] == "v") {
			positions.push(parseFloat(tokens[1]));
			positions.push(parseFloat(tokens[2]));
			positions.push(parseFloat(tokens[3]));
		}
		else if (tokens[0] == "vt") {
			texcoords.push(parseFloat(tokens[1]));
			texcoords.push(parseFloat(tokens[2]));
		}
		else if (tokens[0] == "vn") {
			normals.push(parseFloat(tokens[1]));
			normals.push(parseFloat(tokens[2]));
			normals.push(parseFloat(tokens[3]));
		}
		else if (tokens[0] == "f") {
			if (tokens.length != 4) continue;

			for (var i=1; i<4; ++i) {
				if (!(tokens[i] in facemap)) {
					f = tokens[i].split("/");

					if (f.length == 1) {
						pos = parseInt(f[0]) - 1;
						tex = pos;
						nor = pos;
					}
					else if (f.length == 3) {
						pos = parseInt(f[0]) - 1;
						tex = parseInt(f[1]) - 1;
						nor = parseInt(f[2]) - 1;
					}
					else {
						return false;
					}

					x = 0.0;
					y = 0.0;
					z = 0.0;
					if ((pos * 3 + 2) < positions.length) {
						hasPos = true;
						x = positions[pos*3+0];
						y = positions[pos*3+1];
						z = positions[pos*3+2];
					}
					positionsArray.push(x);
					positionsArray.push(y);
					positionsArray.push(z);

					x = 0.0;
					y = 0.0;
					if ((tex * 2 + 1) < texcoords.length) {
						hasTex = true;
						x = texcoords[tex*2+0];
						y = texcoords[tex*2+1];
					}
					texcoordsArray.push(x);
					texcoordsArray.push(y);

					x = 0.0;
					y = 0.0;
					z = 1.0;
					if ((nor * 3 + 2) < normals.length) {
						hasNor = true;
						x = normals[nor*3+0];
						y = normals[nor*3+1];
						z = normals[nor*3+2];
					}
					normalsArray.push(x);
					normalsArray.push(y);
					normalsArray.push(z);

					facemap[tokens[i]] = index++;
				}

				indicesArray.push(facemap[tokens[i]]);
			}
		}
	}

	if (hasPos) {
		mesh.addVertexAttribute("position", 3, positionsArray, false);
	}
	if (hasNor) {
		mesh.addVertexAttribute("normal", 3, normalsArray, false);
	}
	if (hasTex) {
		mesh.addVertexAttribute("texcoord", 2, texcoordsArray, false);
	}

	if (indicesArray.length > 0) {
		mesh.addIndexedPrimitives("triangles", SGL_TRIANGLES_LIST, indicesArray, false);
	}

	return true;
}

function sglMeshJSImportOBJFromURL(mesh, url, asynch, callback) {
	mesh.isValid = false;

	if (!asynch) {
		var txt = sglLoadFile(url);
		mesh.isValid = sglMeshJSImportOBJFromString(mesh, txt);
		if (callback) {
			callback(mesh, url);
		}
		return mesh.isValid;
	}

	sglLoadFile(url, function(txt) {
		mesh.isValid = sglMeshJSImportOBJFromString(mesh, txt);
		if (callback) {
			callback(mesh, url);
		}
	});

	return true;
}

SglMeshJS.prototype.parseOBJ = function(txt) {
	this.isValid = sglMeshJSImportOBJFromString(this, txt);
	return this.isValid;
};

SglMeshJS.prototype.importOBJ = function(url, asynch, callback) {
	return sglMeshJSImportOBJFromURL(this, url, asynch, callback);
};

function _sglFindVertexAttributeJSON(m, name) {
	for (var a in m.vertices) {
		if (m.vertices[a].name === name) {
			return m.vertices[a];
		}
	}
	return null;
}

function _sglFindConnectivityJSON(m, name) {
	for (var a in m.connectivity) {
		if (m.connectivity[a].name === name) {
			return m.connectivity[a];
		}
	}
	return null;
}

function sglMeshJSImportJSONFromString(mesh, text) {
	var m = JSON.parse(text);
	if (!m) return false;

	var mapping = m.mapping;
	var stdMapping = null;
	for (var v in mapping) {
		if (mapping[v].name === "standard") {
			stdMapping = mapping[v];
			break;
		}
	}
	if (!stdMapping) return false;

	for (var a in stdMapping.attributes) {
		var vm = stdMapping.attributes[a];
		var vattr = _sglFindVertexAttributeJSON(m, vm.source);
		if (!vattr) continue;
		if (vattr.normalized) {
			for (var i=0, n=vattr.values.length; i<n; ++i) {
				vattr.values[i] /= 255.0;
			}
		}
		mesh.addVertexAttribute(vm.semantic, vattr.size, vattr.values, false);
	}

	var conn = _sglFindConnectivityJSON(m, stdMapping.primitives);
	if (!conn) return false;
	mesh.addIndexedPrimitives(conn.name, SGL_TRIANGLES_LIST, conn.indices, false);

	return true;
}

function sglMeshJSImportJSONFromURL(mesh, url, asynch, callback) {
	mesh.isValid = false;

	if (!asynch) {
		var txt = sglLoadFile(url);
		mesh.isValid = sglMeshJSImportJSONFromString(mesh, txt);
		if (callback) {
			callback(mesh, url);
		}
		return mesh.isValid;
	}

	sglLoadFile(url, function(txt) {
		mesh.isValid = sglMeshJSImportJSONFromString(mesh, txt);
		if (callback) {
			callback(mesh, url);
		}
	});

	return true;
}

SglMeshJS.prototype.parseJSON = function(txt) {
	this.isValid = sglMeshJSImportJSONFromString(this, txt);
	return this.isValid;
};

SglMeshJS.prototype.importJSON = function(url, asynch, callback) {
	return sglMeshJSImportJSONFromURL(this, url, asynch, callback);
};
/***********************************************************************/


/*************************************************************************/
/*                                                                       */
/*  SpiderGL                                                             */
/*  JavaScript 3D Graphics Library on top of WebGL                       */
/*                                                                       */
/*  Copyright (C) 2010                                                   */
/*  Marco Di Benedetto                                                   */
/*  Visual Computing Laboratory                                          */
/*  ISTI - Italian National Research Council (CNR)                       */
/*  http://vcg.isti.cnr.it                                               */
/*  mailto: marco[DOT]dibenedetto[AT]isti[DOT]cnr[DOT]it                 */
/*                                                                       */
/*  This file is part of SpiderGL.                                       */
/*                                                                       */
/*  SpiderGL is free software; you can redistribute it and/or modify     */
/*  under the terms of the GNU Lesser General Public License as          */
/*  published by the Free Software Foundation; either version 2.1 of     */
/*  the License, or (at your option) any later version.                  */
/*                                                                       */
/*  SpiderGL is distributed in the hope that it will be useful, but      */
/*  WITHOUT ANY WARRANTY; without even the implied warranty of           */
/*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.                 */
/*  See the GNU Lesser General Public License                            */
/*  (http://www.fsf.org/licensing/licenses/lgpl.html) for more details.  */
/*                                                                       */
/*************************************************************************/


// utilities
/***************************************************************/
function sglGLTypeSize(gl, type) {
	if (type == gl.BYTE)           return 1;
	if (type == gl.UNSIGNED_BYTE)  return 1;
	if (type == gl.SHORT)          return 2;
	if (type == gl.UNSIGNED_SHORT) return 2;
	if (type == gl.INT)            return 4;
	if (type == gl.UNSIGNED_INT)   return 4;
	if (type == gl.FLOAT)          return 4;
	return null;
}

function sglGLTypeFromWebGLArray(gl, wglArray) {
	if (wglArray instanceof Int8Array   ) return gl.BYTE;
	if (wglArray instanceof Uint8Array  ) return gl.UNSIGNED_BYTE;
	if (wglArray instanceof Int16Array  ) return gl.SHORT;
	if (wglArray instanceof Uint16Array ) return gl.UNSIGNED_SHORT;
	if (wglArray instanceof Int32Array  ) return gl.INT;
	if (wglArray instanceof Uint32Array ) return gl.UNSIGNED_INT;
	if (wglArray instanceof Float32Array) return gl.FLOAT;
	return null;
}
/***************************************************************/


// SglAttributeStreamGL
/***************************************************************/
/**
 * Constructs a SglAttributeStreamGL.
 * @class Holds the properties and the storage buffer of a vertex attribute stream.
 */
function SglAttributeStreamGL(gl, name, size, values, normalized) {
	var type   = sglGLTypeFromWebGLArray(gl, values);
	var stride = sglGLTypeSize(gl, type) * size;

	this.gl      = gl;
	this._name   = name;
	this._size   = size;
	this._type   = type;
	this._norm   = (normalized) ? (true) : (false);
	this._stride = stride;
	this._offset = 0;
	this._length = values.length / size;
	this._buff   = new SglVertexBuffer(gl, values, { usage : gl.STATIC_DRAW });
}

SglAttributeStreamGL.prototype = {
	get name()         { return this._name;   },
	get size()         { return this._size;   },
	get type()         { return this._type;   },
	get isNormalized() { return this._norm;   },
	get stride()       { return this._stride; },
	get offset()       { return this._offset; },
	get buffer()       { return this._buff;   },
	get length()       { return this._length; },

	destroy : function() {
		this._buff.destroy();
	},

	bind : function(index, baseVertex) {
		var off = ((baseVertex) ? (baseVertex) : (0)) * this._stride;
		this._buff.bind();
		this.gl.vertexAttribPointer(index, this._size, this._type, this._norm, this._stride, this._offset + off);
	},

	unbind : function(index) {
		this._buff.unbind();
	}
};
/***************************************************************/


// SglVertexStreamGL
/***************************************************************/
/**
 * Constructs a SglVertexStreamGL.
 * @class Container of vertex attribute streams.
 */
function SglVertexStreamGL(gl) {
	this.gl       = gl;
	this._attribs = new Object();
	this._length  = 0;
}

SglVertexStreamGL.prototype = {
	get attributes() { return this._attribs; },
	get length()     { return this._length;  },

	destroy : function() {
		for (var attr in this._attribs) {
			this._attribs[attr].destroy();
		}
	},

	addAttribute : function(name, size, normalized, values) {
		var attr = new SglAttributeStreamGL(this.gl, name, size, normalized, values)
		this._attribs[name] = attr;
		this._length = attr.length;
	},

	removeAttribute : function(name, doDestroy) {
		if (!this._attribs[name]) return;

		if (doDestroy) {
			this._attribs[name].destroy();
		}

		delete this._attribs[name];

		this._length = 0;
		for (var a in this._attribs) {
			this._length = this._attribs[a].length;
			break;
		}
	},

	bind : function(mapping, baseVertex) {
		var vm = null;
		for (var m in mapping) {
			vm = this._attribs[m];
			if (vm) {
				vm.bind(mapping[m], baseVertex)
			}
		}
	},

	unbind : function(mapping) {
		var vm = null;
		for (var m in mapping) {
			vm = this._attribs[m];
			if (vm) {
				vm.unbind(mapping[m])
			}
		}
	}
};
/***************************************************************/


// SglPrimitiveStreamGL
/***************************************************************/
/**
 * Constructs a SglPrimitiveStreamGL.
 * @class Holds the primitives stream information and storage (if any).
 */
function SglPrimitiveStreamGL(gl, name, mode, first, length) {
	this.gl      = gl;
	this._name   = name;
	this._mode   = mode;
	this._first  = (first)  ? (first)  : (0);
	this._length = (length) ? (length) : (0);
}

SglPrimitiveStreamGL.prototype = {
	_clampRange : function(first, count) {
		var end = this._first + this._length;

		var f = this._first + ((first >= 0) ? (first) : (0));
		if (f >= end) return null;

		var c = (count >= 0) ? (count) : (this._length);
		var vEnd = (f + c);
		if (vEnd > end) c -= vEnd - end;

		return [f, c];
	},

	_render : function(first, count) {
		;
	},

	get type()   { return undefined;    },
	get name()   { return this._name;   },
	get mode()   { return this._mode;   },
	get first()  { return this._first;  },
	get length() { return this._length; },

	destroy : function() {
		if (this._destroy) {
			this._destroy();
		}
	},

	bind : function() {
		;
	},

	unbind : function() {
		;
	},

	render : function(first, count) {
		var range = this._clampRange(first, count);
		this._render(range[0], range[1]);
	}
}
/***************************************************************/


// SglArrayPrimitiveStreamGL
/***************************************************************/
/**
 * Constructs a SglArrayPrimitiveStreamGL.
 * @class Holds the array primitive stream information.
 */
function SglArrayPrimitiveStreamGL(gl, name, mode, first, count) {
	SglPrimitiveStreamGL.call(this, gl, name, mode, first, count);
}

sglInherit(SglArrayPrimitiveStreamGL, SglPrimitiveStreamGL);

sglDefineGetter(SglArrayPrimitiveStreamGL, "type", function() {
	return SGL_ARRAY_PRIMITIVE_STREAM;
});

SglArrayPrimitiveStreamGL.prototype._render = function(first, count) {
	this.gl.drawArrays(this._mode, first, count);
}
/***************************************************************/


// SglIndexedPrimitiveStreamGL
/***************************************************************/
/**
 * Constructs a SglIndexedPrimitiveStreamGL.
 * @class Holds the indexed primitive stream information and storage.
 */
function SglIndexedPrimitiveStreamGL(gl, name, mode, indices) {
	SglPrimitiveStreamGL.call(this, gl, name, mode, 0, indices.length);

	var type   = sglGLTypeFromWebGLArray(gl, indices);
	var stride = sglGLTypeSize(gl, type);

	this._idxType = type;
	this._stride  = stride;
	this._buff    = new SglIndexBuffer(gl, indices, { usage : gl.STATIC_DRAW });
}

sglInherit(SglIndexedPrimitiveStreamGL, SglPrimitiveStreamGL);

sglDefineGetter(SglIndexedPrimitiveStreamGL, "indexType", function() {
	return this._idxType;
});

sglDefineGetter(SglIndexedPrimitiveStreamGL, "stride", function() {
	return this._stride;
});

sglDefineGetter(SglIndexedPrimitiveStreamGL, "type", function() {
	return SGL_INDEXED_PRIMITIVE_STREAM;
});

SglIndexedPrimitiveStreamGL.prototype._destroy = function() {
	this._buff.destroy();
	this._buff = null;
}

SglIndexedPrimitiveStreamGL.prototype.bind = function() {
	this._buff.bind();
}

SglIndexedPrimitiveStreamGL.prototype.unbind = function() {
	this._buff.unbind();
}

SglIndexedPrimitiveStreamGL.prototype._render = function(first, count) {
	this.gl.drawElements(this._mode, count, this._idxType, first * this._stride);
}
/***************************************************************/


// SglPackedIndexedPrimitiveStreamGL
/***************************************************************/
/**
 * Constructs a SglPackedIndexedPrimitiveStream.
 * @class Holds the packed indexed primitive stream information and storage.
 */
function SglPackedIndexedPrimitiveStreamGL(gl, name, mode, indices, blockStartingIndices, blockStartingVertices) {
	if (blockStartingIndices.length != blockStartingVertices.length) {
		sglInvalidParameter();
	}

	SglPrimitiveStreamGL.call(this, gl, name, mode, 0, indices.length);

	var type   = sglGLTypeFromWebGLArray(gl, indices);
	var stride = sglGLTypeSize(gl, type);

	this._idxType = type;
	this._stride  = stride;
	this._buff    = new SglIndexBuffer(gl, indices, { usage : gl.STATIC_DRAW });


	this._blockStartingVertices = blockStartingVertices.slice();
	var n = this._blockStartingVertices.length;

	this._blockStartingIndices = blockStartingIndices.slice();
	this._blockIndicesCount    = new Array(n);

	var start = this._blockStartingIndices[0];
	for (var i=0; i<(n-1); ++i) {
		var sIdx = this._blockStartingIndices[i+1];
		this._blockIndicesCount[i] = sIdx - start;
		start = sIdx;
	}
	this._blockIndicesCount[n-1] = indices.length - start;
}

sglInherit(SglPackedIndexedPrimitiveStreamGL, SglPrimitiveStreamGL);

sglDefineGetter(SglPackedIndexedPrimitiveStreamGL, "isPacked", function() {
	return true;
});

sglDefineGetter(SglPackedIndexedPrimitiveStreamGL, "indexType", function() {
	return this._idxType;
});

sglDefineGetter(SglPackedIndexedPrimitiveStreamGL, "stride", function() {
	return this._stride;
});

sglDefineGetter(SglPackedIndexedPrimitiveStreamGL, "type", function() {
	return SGL_PACKED_INDEXED_PRIMITIVE_STREAM;
});

sglDefineGetter(SglPackedIndexedPrimitiveStreamGL, "blocksCount", function() {
	return this._blockStartingIndices.length;
});

sglDefineGetter(SglPackedIndexedPrimitiveStreamGL, "blockStartingVertices", function() {
	return this._blockStartingVertices;
});

sglDefineGetter(SglPackedIndexedPrimitiveStreamGL, "blockStartingIndices", function() {
	return this._blockStartingIndices;
});

sglDefineGetter(SglPackedIndexedPrimitiveStreamGL, "blockIndicesCount", function() {
	return this._blockIndicesCount;
});

SglPackedIndexedPrimitiveStreamGL.prototype._destroy = function() {
	this._buff.destroy();
	this._buff = null;
}

SglPackedIndexedPrimitiveStreamGL.prototype.bind = function() {
	this._buff.bind();
}

SglPackedIndexedPrimitiveStreamGL.prototype.unbind = function() {
	this._buff.unbind();
}

SglPackedIndexedPrimitiveStreamGL.prototype._clampBlockRange = function(block, first, count) {
	var end = this._blockStartingIndices[block] + this._blockIndicesCount[block];

	var f = this._blockStartingIndices[block] + ((first >= 0) ? (first) : (0));
	if (f >= end) return null;

	var c = (count >= 0) ? (count) : (this._blockIndicesCount[block]);
	var vEnd = (f + c);
	if (vEnd > end) c -= vEnd - end;

	return [f, c];
}

SglPackedIndexedPrimitiveStreamGL.prototype.blockRanges = function(first, count) {
	var range = this._clampRange(first, count);
	var n     = this._blockStartingIndices.length;

	var firstBlock = 0;
	while ((firstBlock < n) && (range[0] < this._blockStartingIndices[firstBlock])) {
		firstBlock++;
	}
	if (firstBlock >= n) return null;

	var last = range[0] + range[1] - 1;
	var lastBlock = firstBlock;
	while ((lastBlock < n) && (last >= (this._blockStartingIndices[lastBlock] + this._blockIndicesCount[lastBlock]))) {
		lastBlock++;
	}
	if (lastBlock >= n) lastBlock = n - 1;

	var ranges = [ ];
	var f = range[0] - this._blockStartingIndices[firstBlock];
	var c = range[1];
	var e = f + range[1];
	if (e > this._blockIndicesCount[firstBlock]) c = this._blockIndicesCount[firstBlock] - this._blockStartingIndices[firstBlock];
	ranges.push([firstBlock, f, c, this._blockStartingVertices[firstBlock]]);
	for (var i=firstBlock+1; i<lastBlock; ++i) {
		ranges.push([i, 0, this._blockIndicesCount[i], this._blockStartingVertices[i]]);
	}
	if (lastBlock > firstBlock) {
		ranges.push([i, 0, range[0] + range[1] - this._blockStartingIndices[lastBlock], this._blockStartingVertices[lastBlock]]);
	}

	return ranges;
}

SglPackedIndexedPrimitiveStreamGL.prototype.renderBlock = function(block, first, count) {
	var range = this._clampBlockRange(block, first, count);
	this.gl.drawElements(this._mode, range[1], this._idxType, range[0] * this._stride);
}
/***************************************************************/


// SglConnectivityGL
/***************************************************************/
/**
 * Constructs a SglConnectivityGL.
 * @class Container of primitive streams.
 */
function SglConnectivityGL(gl) {
	this.gl     = gl;
	this._prims = new Object();
}

SglConnectivityGL.prototype = {
	get primitives() { return this._prims; },

	destroy : function() {
		for (var prim in this._prims) {
			this._prims[prim].destroy();
		}
	},

	addArrayPrimitives: function(name, mode, first, count) {
		var prim = new SglArrayPrimitiveStreamGL(this.gl, name, mode, first, count)
		this._prims[name] = prim;
	},

	addIndexedPrimitives : function(name, mode, indices) {
		var prim = new SglIndexedPrimitiveStreamGL(this.gl, name, mode, indices)
		this._prims[name] = prim;
	},

	addPackedIndexedPrimitives : function(name, mode, indices, blockStartingIndices, blockStartingVertices) {
		var prim = new SglPackedIndexedPrimitiveStreamGL(this.gl, name, mode, indices, blockStartingIndices, blockStartingVertices)
		this._prims[name] = prim;
	},

	removePrimitives : function(name, doDestroy) {
		if (!this._prims[name]) return;

		if (doDestroy) {
			this._prims[name].destroy();
		}

		delete this._prims[name];
	}
};
/***************************************************************/


// SglMeshGL
/***************************************************************/
/**
 * Constructs a SglMeshGL.
 * @class Mesh definition with vertex stream and primitive stream.
 */
function SglMeshGL(gl) {
	this.gl    = gl;
	this._vert = new SglVertexStreamGL(this.gl);
	this._conn = new SglConnectivityGL(this.gl);
}

SglMeshGL.prototype = {
	get vertices()     { return this._vert; },
	get connectivity() { return this._conn; },

	destroy : function() {
		this._vert.destroy();
		this._conn.destroy();
	},

	addVertexAttribute : function(name, size, values, normalized) {
		this._vert.addAttribute(name, size, values, normalized);
	},

	removeVertexAttribute : function(name, doDestroy) {
		this._vert.removeAttribute(name, doDestroy);
	},

	addArrayPrimitives : function(name, mode, first, count) {
		this._conn.addArrayPrimitives(name, mode, first, count);
	},

	addIndexedPrimitives : function(name, mode, indices) {
		this._conn.addIndexedPrimitives(name, mode, indices);
	},

	addPackedIndexedPrimitives : function(name, mode, indices, blockStartingIndices, blockStartingVertices) {
		this._conn.addPackedIndexedPrimitives(name, mode, indices, blockStartingIndices, blockStartingVertices);
	},

	removePrimitives : function(name, doDestroy) {
		this._conn.removePrimitives(name, doDestroy);
	}
};
/***************************************************************/


// SglMeshRenderer
/***************************************************************/
var SGL_DefaultStreamMappingPrefix = "a_";

/**
 * Constructs a SglMeshGLRenderer.
 * @class Takes charge of mesh rendering, including program attributes, uniforms and samplers bindings.
 */
function SglMeshGLRenderer(program, doSynchronize) {
	this._prog        = program;
	this._mapping     = null;
	this._meshAttrMap = null;
	this._mesh        = null;
	this._primStream  = null;
	this._phase       = 0;

	this._updateEnabledVB = false;

	if (doSynchronize) {
		this.synchronizeProgram();
	}

	this.setStreamMapping();
}

SglMeshGLRenderer.prototype = {
	_bindVertexBuffers : function(baseVertex) {
		this._mesh.vertices.bind(this._meshAttrMap, baseVertex);
	},

	_unbindVertexBuffers : function() {
		this._mesh.vertices.unbind(this._meshAttrMap);
	},

	get program() { return this.prog; },

	synchronizeProgram : function() {
		this._prog.synchronize();

		var doLink = false;
		var index = 0;
		var attr = null;
		for (var a in this._prog.attributes) {
			attr = this._prog.attributes[a];
			if (attr.index != index) {
				attr.index = index;
				doLink = true;
			}
			index++;
		}
		if (doLink) {
			this._prog.link();
		}

		var unit = 0;
		var smp = null;
		for (var s in this._prog.samplers) {
			smp = this._prog.samplers[s];
			smp.unit = unit;
			unit++;
		}
	},

	getStreamMappingFromPrefix : function(prefix) {
		var n = prefix.length;
		var mapping = new Object();
		var src = null;
		for (var attr in this._prog.attributes) {
			if (attr.substr(0, n) == prefix) {
				src = attr.substr(n);
				if (src.length > 0) {
					mapping[attr] = src;
				}
			}
		}
		return mapping;
	},

	setStreamMapping : function(mapping) {
		//if ((this._phase != 0) && (this._phase != 1)) return;

		this._updateEnabledVB = true;

		var meshAttrName = null;

		this._mapping = this.getStreamMappingFromPrefix(SGL_DefaultStreamMappingPrefix);
		for (var progAttrName in mapping) {
			meshAttrName = mapping[progAttr];
			if (this._prog.attributes[progAttrName]) {
				this._mapping[progAttrName] = meshAttrName;
			}
		}

		this._meshAttrMap = { };
		var progAttr = null;
		for (var progAttrName in this._mapping) {
			meshAttrName = this._mapping[progAttrName];
			progAttr     = this._prog.attributes[progAttrName];
			this._meshAttrMap[meshAttrName] = progAttr.index;
		}

		if (this._mesh) {
			this._bindVertexBuffers(0);
		}
	},

	setStreamMappingFromPrefix : function(prefix) {
		if (!prefix) prefix = SGL_DefaultStreamMappingPrefix;
		var mapping = this.getStreamMappingFromPrefix(prefix);
		this.setStreamMapping(mapping);
	},

	setUniforms : function(mapping) {
		if (this._phase == 0) return;
		this._prog.setUniforms(mapping);
	},

	setSamplers : function(mapping) {
		if (this._phase == 0) return;

		var samplers = { };
		var textures = { };

		var t = null;
		for (var s in mapping) {
			t = mapping[s];
			if (typeof(t) == "number") {
				samplers[s] = t;
			}
			else {
				textures[s] = t;
			}
		}

		this._prog.setSamplers(samplers);

		var smp = null;
		for (var s in textures) {
			smp = this._prog.samplers[s];
			if (smp) {
				textures[s].bind(smp.unit);
			}
		}
	},

	begin : function() {
		if (this._phase != 0) return;
		/*
		var gl = this._prog.gl;
		for (var a in this._prog.attributes) {
			gl.enableVertexAttribArray(this._prog.attributes[a].index);
		}
		*/
		this._prog.bind();
		this._phase = 1;
	},

	end : function() {
		if (this._phase != 1) return;
		this._prog.unbind();
		var gl = this._prog.gl;
		for (var a in this._prog.attributes) {
			gl.disableVertexAttribArray(this._prog.attributes[a].index);
		}
		this._phase = 0;
	},

	beginMesh : function(mesh) {
		if (this._phase != 1) return;
		this._updateEnabledVB = true;
		this._mesh = mesh;
		this._bindVertexBuffers(0);
		this._phase = 2;
	},

	endMesh : function() {
		if (this._phase != 2) return;
		this._unbindVertexBuffers();
		this._prog.gl.bindBuffer(this._prog.gl.ARRAY_BUFFER, null);
		this._mesh = null;
		this._phase = 1;
	},

	beginPrimitives : function(name) {
		if (this._phase != 2) return;
		this._primStream = this._mesh.connectivity.primitives[name];
		this._primStream.bind();
		this._phase = 3;
	},

	endPrimitives : function() {
		if (this._phase != 3) return;
		this._primStream.unbind();
		this._primStream = null;
		this._phase = 2;
	},

	render : function(first, count) {
		if (this._phase != 3) return;

		var gl = this._prog.gl;
		var vIndex = 0;

		if (this._updateEnabledVB) {
			this._updateEnabledVB = false;
			for (var progAttr in this._mapping) {
				vIndex = this._prog.attributes[progAttr].index;
				if (this._mesh.vertices.attributes[this._mapping[progAttr]]) {
					gl.enableVertexAttribArray(vIndex);
				}
				else {
					gl.disableVertexAttribArray(vIndex);
				}
			}
		}

		if (this._primStream.isPacked) {
			if (this._primStream.blocksCount > 0) {
				var blocks = this._primStream.blockRanges(first, count);
				var n = blocks.length;
				for (var i=0; i<n; ++i) {
					this._bindVertexBuffers(blocks[i][3]);
					this._primStream.renderBlock(blocks[i][0], blocks[i][1], blocks[i][2]);
				}
			}
		}
		else {
			this._primStream.render(first, count);
		}
	},

	renderMeshPrimitives : function(mesh, name, first, count) {
		this.beginMesh(mesh);
			this.beginPrimitives(name);
				this.render(first, count);
			this.endPrimitives();
		this.endMesh();
	}
};

function sglRenderMeshGLPrimitives(mesh, name, program, streamMapping, uniforms, samplers, first, count) {
	var renderer = new SglMeshGLRenderer(program);
	renderer.begin();
	if (streamMapping) renderer.setStreamMapping (streamMapping);
	if (uniforms     ) renderer.setUniforms      (uniforms     );
	if (samplers     ) renderer.setSamplers      (samplers     );
	if (name) {
		renderer.renderMeshPrimitives(mesh, name, first, count);
	}
	else {
		var primitives = mesh.connectivity.primitives;
		for (var p in primitives) {
			renderer.renderMeshPrimitives(mesh, p, first, count);
		}
	}
}
/***************************************************************/


/*************************************************************************/
/*                                                                       */
/*  SpiderGL                                                             */
/*  JavaScript 3D Graphics Library on top of WebGL                       */
/*                                                                       */
/*  Copyright (C) 2010                                                   */
/*  Marco Di Benedetto                                                   */
/*  Visual Computing Laboratory                                          */
/*  ISTI - Italian National Research Council (CNR)                       */
/*  http://vcg.isti.cnr.it                                               */
/*  mailto: marco[DOT]dibenedetto[AT]isti[DOT]cnr[DOT]it                 */
/*                                                                       */
/*  This file is part of SpiderGL.                                       */
/*                                                                       */
/*  SpiderGL is free software; you can redistribute it and/or modify     */
/*  under the terms of the GNU Lesser General Public License as          */
/*  published by the Free Software Foundation; either version 2.1 of     */
/*  the License, or (at your option) any later version.                  */
/*                                                                       */
/*  SpiderGL is distributed in the hope that it will be useful, but      */
/*  WITHOUT ANY WARRANTY; without even the implied warranty of           */
/*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.                 */
/*  See the GNU Lesser General Public License                            */
/*  (http://www.fsf.org/licensing/licenses/lgpl.html) for more details.  */
/*                                                                       */
/*************************************************************************/


// utilities
/***********************************************************************/
function sglMeshJSCalculateBBox(meshJS, attribName) {
	var attrn     = attribName || "position";

	var posAttrib = meshJS.vertices.attributes[attrn];
	var posSize   = posAttrib.size;
	var posBuffer = posAttrib.buffer;

	var bbox = new SglBox3();
	if (posSize != 3) return bbox;

	var n = posBuffer.length / posSize;
	if (n <= 0) return bbox;

	n *= posSize;

	for (var j=0; j<posSize; ++j) {
		bbox.min[j] = posBuffer[j];
		bbox.max[j] = posBuffer[j];
	}

	var val = 0.0;
	for (var i=posSize; i<n; i+=posSize) {
		for (var j=0; j<posSize; ++j) {
			val = posBuffer[i+j];
			if (bbox.min[j] > val) bbox.min[j] = val;
			if (bbox.max[j] < val) bbox.max[j] = val;
		}
	}

	return bbox;
}

SglMeshJS.prototype.calculateBoundingBox = function(attribName) {
	return sglMeshJSCalculateBBox(this, attribName);
};

function sglGLPrimitiveType(gl, primType) {
	switch (primType) {
		case SGL_POINTS_LIST    : return gl.POINTS;         break;
		case SGL_LINES_LIST     : return gl.LINES;          break;
		case SGL_LINE_STRIP     : return gl.LINE_STRIP;     break;
		case SGL_LINE_LOOP      : return gl.LINE_LOOP;      break;
		case SGL_TRIANGLES_LIST : return gl.TRIANGLES;      break;
		case SGL_TRIANGLE_STRIP : return gl.TRIANGLE_STRIP; break;
		case SGL_TRIANGLE_FAN   : return gl.TRIANGLE_FAN;   break;
		default                 : return undefined;         break;
	}
	return undefined;
}

function sglMeshJStoGL(gl, meshJS) {
	var meshGL = new SglMeshGL(gl);

	for (a in meshJS.vertices.attributes) {
		var attr = meshJS.vertices.attributes[a];
		meshGL.addVertexAttribute(attr.name, attr.size, new Float32Array(attr.buffer));
	}

	for (p in meshJS.connectivity.primitives) {
		var prim = meshJS.connectivity.primitives[p];
		var ptype = sglGLPrimitiveType(meshGL.gl, prim.mode);
		if (ptype == undefined) continue;

		switch (prim.type) {
			case SGL_ARRAY_PRIMITIVE_STREAM :
				meshGL.addArrayPrimitives(prim.name, ptype, prim.first, prim.length);
			break;
			case SGL_INDEXED_PRIMITIVE_STREAM :
				meshGL.addIndexedPrimitives(prim.name, ptype, new Uint16Array(prim.buffer));
			break;
			default :
			break;
		}
	}

	return meshGL;
}

SglMeshJS.prototype.toMeshGL = function(gl) {
	return sglMeshJStoGL(gl, this);
};

function sglPackMeshJStoGL(gl, mesh, primitives, maxVertexIndex) {
	var primName = primitives     || "triangles";
	var maxInd   = maxVertexIndex || 65000;

	var prim = mesh.connectivity.primitives[primName];

	if (!prim) return null;
	if (prim.type != SGL_INDEXED_PRIMITIVE_STREAM) return null;

	var pmode = sglGLPrimitiveType(gl, prim.mode);
	if (pmode == undefined) return null;

	var ariety   = 0;
	if (pmode === gl.TRIANGLES) {
		ariety = 3;
	}
	else if (pmode === gl.LINES) {
		ariety = 2;
	}
	else if (pmode === gl.POINTS) {
		ariety = 1;
	}
	else {
		return null;
	}

	var res   = [ ];

	var srcIndices = prim.buffer;
	var n          = srcIndices.length;
	n -= (n % ariety);

	var start = 0;

	var startVertex = 0;
	var startIndex  = 0;
	var startVertices = [ ];
	var startIndices  = [ ];

	var newIndices = [ ];
	var newAttribs = { };
	for (var a in mesh.vertices.attributes) {
		var attr  = mesh.vertices.attributes[a];
		newAttribs[a] = {
			name   : attr.name,
			size   : attr.size,
			buffer : [ ]
		};
	}

	while (start < n) {
		var indicesMap = { };
		var dstIndices = [ ];
		var vtxCount = 0;

		var indicesMap = { };
		var vtxCount   = 0;
		for (var i=start; i<n; i+=ariety) {
			var triIndices       = { };
			var newVerticesCount = 0;
			for (var j=0; j<ariety; ++j) {
				var srcIdx = srcIndices[i+j];
				if (triIndices[srcIdx] == undefined) {
					triIndices[srcIdx] = true;
					if (indicesMap[srcIdx] == undefined) {
						newVerticesCount++;
					}
				}
			}

			if ((vtxCount + newVerticesCount) <= maxInd) {
				for (var j=0; j<ariety; ++j) {
					var srcIdx = srcIndices[i+j];
					var dstIdx = indicesMap[srcIdx];
					if (dstIdx == undefined) {
						indicesMap[srcIdx] = vtxCount;
						dstIdx = vtxCount;
						vtxCount++;
					}
					dstIndices.push(dstIdx);
				}
				start += ariety;
			}
			else {
				break;
			}
		}

		if (vtxCount <= 0) break;

		var idxCount = dstIndices.length;

		for (var a in mesh.vertices.attributes) {
			var srcAttr  = mesh.vertices.attributes[a];
			var dstAttr  = newAttribs[a];
			var asize    = srcAttr.size;
			var dstBase  = dstAttr.buffer.length;
			var newArr   = new Array(vtxCount * asize);
			dstAttr.buffer = dstAttr.buffer.concat(newArr);

			var srcBuff = srcAttr.buffer;
			var dstBuff = dstAttr.buffer;
			for (var i in indicesMap) {
				var dstIdx = indicesMap[i];
				for (var c=0; c<asize; ++c) {
					dstBuff[dstBase + (dstIdx*asize+c)] = srcBuff[i*asize+c];
				}
			}
		}

		newIndices = newIndices.concat(dstIndices);

		startVertices.push(startVertex);
		startIndices.push(startIndex);

		startVertex += vtxCount;
		startIndex  += idxCount;
	}

	var m = new SglMeshGL(gl);

	for (var a in newAttribs) {
		var attr = newAttribs[a];
		m.addVertexAttribute(attr.name, attr.size, new Float32Array(attr.buffer));
	}

	if (startVertices.length == 1) {
		m.addIndexedPrimitives(primName, pmode, new Uint16Array(newIndices));
	}
	else {
		m.addPackedIndexedPrimitives(primName, pmode, new Uint16Array(newIndices), startIndices, startVertices);
	}

	return m;
}

SglMeshJS.prototype.toPackedMeshGL = function(gl, primitives, maxVertexIndex) {
	return sglPackMeshJStoGL(gl, this, primitives, maxVertexIndex);
};
/***********************************************************************/


/*************************************************************************/
/*                                                                       */
/*  SpiderGL                                                             */
/*  JavaScript 3D Graphics Library on top of WebGL                       */
/*                                                                       */
/*  Copyright (C) 2010                                                   */
/*  Marco Di Benedetto                                                   */
/*  Visual Computing Laboratory                                          */
/*  ISTI - Italian National Research Council (CNR)                       */
/*  http://vcg.isti.cnr.it                                               */
/*  mailto: marco[DOT]dibenedetto[AT]isti[DOT]cnr[DOT]it                 */
/*                                                                       */
/*  This file is part of SpiderGL.                                       */
/*                                                                       */
/*  SpiderGL is free software; you can redistribute it and/or modify     */
/*  under the terms of the GNU Lesser General Public License as          */
/*  published by the Free Software Foundation; either version 2.1 of     */
/*  the License, or (at your option) any later version.                  */
/*                                                                       */
/*  SpiderGL is distributed in the hope that it will be useful, but      */
/*  WITHOUT ANY WARRANTY; without even the implied warranty of           */
/*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.                 */
/*  See the GNU Lesser General Public License                            */
/*  (http://www.fsf.org/licensing/licenses/lgpl.html) for more details.  */
/*                                                                       */
/*************************************************************************/


// SglTrackball
/***********************************************************************/
const SGL_TRACKBALL_NO_ACTION = 0;
const SGL_TRACKBALL_ROTATE    = 1;
const SGL_TRACKBALL_PAN       = 2;
const SGL_TRACKBALL_DOLLY     = 3;
const SGL_TRACKBALL_SCALE     = 4;

/**
 * Constructs a SglTrackball object.
 * @class Interactor which implements a typical trackball controller.
 */
function SglTrackball() {
	this._matrix = sglIdentityM4();
	this._pts    = [ [0.0, 0.0], [0.0, 0.0] ];
	this._action = SGL_TRACKBALL_NO_ACTION;

	this.reset();
}

SglTrackball.prototype = {
	_projectOnSphere : function(x, y) {
		var r = 1.0;

		var z = 0.0;
		var d = sglSqrt(x*x + y*y);
		if (d < (r * 0.70710678118654752440)) {
			/* Inside sphere */
			z = sglSqrt(r*r - d*d);
		}
		else {
			/* On hyperbola */
			t = r / 1.41421356237309504880;
			z = t*t / d;
		}
		return z;
	},

	_transform : function(m, x, y, z) {
		return sglMulM4V4(m, sglV4C(x, y, z, 0.0));
	},

	_transformOnSphere : function(m, x, y) {
		var z = this._projectOnSphere(x, y);
		return this._transform(m, x, y, z);
	},

	_translate : function(offset, f) {
		var invMat = sglInverseM4(this._matrix);
		var t = sglV3toV4(offset, 0.0);
		t = sglMulM4V4(invMat, t);
		t = sglMulSV4(f, t);
		var trMat = sglTranslationM4V(t);
		this._matrix = sglMulM4(this._matrix, trMat);
	},

	get action()  { return this._action; },
	set action(a) { this._action = a     },

	get matrix() { return this._matrix; },

	reset : function () {
		this._matrix = sglIdentityM4();
		this._pts    = [ [0.0, 0.0], [0.0, 0.0] ];
		this._action = SGL_TRACKBALL_NO_ACTION
	},

	track : function(m, x, y, z) {
		this._pts[0][0] = this._pts[1][0];
		this._pts[0][1] = this._pts[1][1];
		this._pts[1][0] = x;
		this._pts[1][1] = y;

		switch (this._action) {
			case SGL_TRACKBALL_ROTATE:
				this.rotate(m);
			break;

			case SGL_TRACKBALL_PAN:
				this.pan(m);
			break;

			case SGL_TRACKBALL_DOLLY:
				this.dolly(m, z);
			break;

			case SGL_TRACKBALL_SCALE:
				this.scale(m, z);
			break;

			default:
			break;
		}
	},

	rotate : function(m) {
		if ((this._pts[0][0] == this._pts[1][0]) && (this._pts[0][1] == this._pts[1][1])) return;

		var mInv = sglInverseM4(m);

		var v0 = this._transformOnSphere(mInv, this._pts[0][0], this._pts[0][1]);
		var v1 = this._transformOnSphere(mInv, this._pts[1][0], this._pts[1][1]);

		var axis   = sglCrossV3(v0, v1);
		var angle  = sglLengthV3(axis);
		var rotMat = sglRotationAngleAxisM4V(angle, axis);

		this._matrix = sglMulM4(rotMat, this._matrix);
	},

	pan : function(m) {
		var mInv = sglInverseM4(m);
		var v0 = this._transform(mInv, this._pts[0][0], this._pts[0][1], -1.0);
		var v1 = this._transform(mInv, this._pts[1][0], this._pts[1][1], -1.0);
		var offset = sglSubV3(v1, v0);
		this._translate(offset, 2.0);
	},

	dolly : function(m, dz) {
		var mInv = sglInverseM4(m);
		var offset = this._transform(mInv, 0.0, 0.0, dz);
		this._translate(offset, 1.0);
	},

	scale : function(m, s) {
		var scaleMat = sglScalingM4C(s, s, s);
		this._matrix = sglMulM4(this._matrix, scaleMat);
	}
}
/***********************************************************************/


// SglFirstPersonCamera
/***********************************************************************/
/**
 * Constructs a SglFirstPersonCamera object.
 * The default pose is positioned at the origin, looking towards the -Z axis with 0 degrees roll.
 * The camera moves on the XZ plane, having +Y as upward axis.
 * @class Interactor which implements typical First-Person camera movements.
 */
function SglFirstPersonCamera() {
	this._position = sglZeroV3();
	this._angles   = sglZeroV3();

	this.lookAt(0.0, 0.0, 0.0, 0.0, 0.0, -1.0, 0.0);
}

SglFirstPersonCamera.prototype = {
	/**
	 * Clones the object.
	 * @return {SglFirstPersonCamera} A clone of the object.
	 * @see SglFirstPersonCamera#get:copy
	 */
	clone : function() {
		var r = new SglFirstPersonCamera();
		r._position = this._position.slice();
		r._angles   = this._angles.slice();
		return r;
	},

	/**
	 * Getter for the whole object clone.
	 * It returns a clone of the object.
	 * @name SglFirstPersonCamera#get:copy
	 * @function.
	 * @return {SglFirstPersonCamera}
	 * @see SglFirstPersonCamera#clone
	 */
	get copy() {
		return this.clone();
	},

	/**
	 * Sets camera pose.
	 * @param {number} positionX The X coordinate of the camera position.
	 * @param {number} positionY The Y coordinate of the camera position.
	 * @param {number} positionZ The Z coordinate of the camera position.
	 * @param {number} targetX   The X coordinate of the point the camera will be looking at.
	 * @param {number} targetY   The Y coordinate of the point the camera will be looking at.
	 * @param {number} targetZ   The Z coordinate of the point the camera will be looking at.
	 * @param {number} roll      The angle (in radians) of rotation around the view direction (upward vector is kepth at Y axis).
	 * @return {SglFirstPersonCamera} A self reference.
	 */
	lookAt : function(positionX, positionY, positionZ, targetX, targetY, targetZ, roll) {
		this._position = sglV3C(positionX, positionY, positionZ);

		var viewDir = sglSubV3([ targetX, targetY, targetZ ], this._position);

		this._angles[0] = sglAtan2( viewDir[1], -viewDir[2]);
		this._angles[1] = sglAtan2(-viewDir[0], -viewDir[2]);
		this._angles[2] = (roll) ? (roll) : (0.0);

		return this;
	},

	/**
	 * Translates the camera position in its frame of reference.
	 * @param {number} xOffset The amount of translation along the X axis.
	 * @param {number} yOffset The amount of translation along the Y axis.
	 * @param {number} zOffset The amount of translation along the Z axis.
	 * @return {SglFirstPersonCamera} A self reference.
	 */
	translate : function(xOffset, yOffset, zOffset) {
		var pitchMat  = sglRotationAngleAxisM4C(this._angles[0], 1.0, 0.0, 0.0);
		var yawMat    = sglRotationAngleAxisM4C(this._angles[1], 0.0, 1.0, 0.0);
		var rollMat   = sglRotationAngleAxisM4C(this._angles[2], 0.0, 0.0, 1.0);
		var rotMat    = sglMulM4(rollMat, sglMulM4(yawMat, pitchMat));
		var rotOffset = sglMulM4V4(rotMat, [ xOffset, yOffset, zOffset, 0.0 ]);

		this._position[0] += rotOffset[0];
		this._position[1] += rotOffset[1];
		this._position[2] += rotOffset[2];

		return this;
	},

	/**
	 * Translates the camera position in its frame of reference, while preserving the Y coordinate (i.e. altitude).
	 * @param {number} xOffset The amount of translation along the X axis.
	 * @param {number} yOffset The amount of translation along the Y axis.
	 * @param {number} zOffset The amount of translation along the Z axis.
	 * @return {SglFirstPersonCamera} A self reference.
	 */
	translateOnPlane : function(xOffset, yOffset, zOffset) {
		var rotMat    = sglRotationAngleAxisM4C(this._angles[1], 0.0, 1.0, 0.0);
		var rotOffset = sglMulM4V4(rotMat, [ xOffset, yOffset, zOffset, 0.0 ]);

		this._position[0] += rotOffset[0];
		this._position[1] += rotOffset[1];
		this._position[2] += rotOffset[2];

		return this;
	},

	/**
	 * Rotate the camera in its pitch-yaw-roll reference frame.
	 * @param {number} pitchOffset The amount of rotation around the X axis (in radians).
	 * @param {number} yawOffset   The amount of rotation around the Y axis (in radians).
	 * @param {number} rollOffset  The amount of rotation around the view direction (in radians).
	 * @return {SglFirstPersonCamera} A self reference.
	 */
	rotate : function(pitchOffset, yawOffset, rollOffset) {
		this._angles[0] += pitchOffset;
		this._angles[1] += yawOffset;
		this._angles[2] += rollOffset;

		return this;
	},

	/**
	 * Getter for the camera pose matrix.
	 * The camera pose is returned as a 16-element array representing a 4x4 column major transofrmation matrix.
	 * @name SglFirstPersonCamera#get:matrix
	 * @function.
	 * @return {Array}
	 */
	get matrix() {
		var pitchMat  = sglRotationAngleAxisM4C(-this._angles[0], 1.0, 0.0, 0.0);
		var yawMat    = sglRotationAngleAxisM4C(-this._angles[1], 0.0, 1.0, 0.0);
		var rollMat   = sglRotationAngleAxisM4C(-this._angles[2], 0.0, 0.0, 1.0);
		var posMat    = sglTranslationM4V(sglNegV3(this._position));
		var res       = sglMulM4(rollMat, sglMulM4(pitchMat, sglMulM4(yawMat, posMat)));

		return res;
	}
};
/***********************************************************************/


/*************************************************************************/
/*                                                                       */
/*  SpiderGL                                                             */
/*  JavaScript 3D Graphics Library on top of WebGL                       */
/*                                                                       */
/*  Copyright (C) 2010                                                   */
/*  Marco Di Benedetto                                                   */
/*  Visual Computing Laboratory                                          */
/*  ISTI - Italian National Research Council (CNR)                       */
/*  http://vcg.isti.cnr.it                                               */
/*  mailto: marco[DOT]dibenedetto[AT]isti[DOT]cnr[DOT]it                 */
/*                                                                       */
/*  This file is part of SpiderGL.                                       */
/*                                                                       */
/*  SpiderGL is free software; you can redistribute it and/or modify     */
/*  under the terms of the GNU Lesser General Public License as          */
/*  published by the Free Software Foundation; either version 2.1 of     */
/*  the License, or (at your option) any later version.                  */
/*                                                                       */
/*  SpiderGL is distributed in the hope that it will be useful, but      */
/*  WITHOUT ANY WARRANTY; without even the implied warranty of           */
/*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.                 */
/*  See the GNU Lesser General Public License                            */
/*  (http://www.fsf.org/licensing/licenses/lgpl.html) for more details.  */
/*                                                                       */
/*************************************************************************/


// canvas utilities
/***********************************************************************/
function sglGetCanvasContext(canvasID) {
	var canvas = document.getElementById(canvasID);
	if (!canvas) return null;

	var gl = canvas.getContext("experimental-webgl");
	if (!gl) return null;

	if (gl.FALSE == undefined) gl.FALSE = 0;
	if (gl.TRUE  == undefined) gl.TRUE  = 1;

	return gl;
}
/***********************************************************************/


// SglCanvasUI
/***********************************************************************/
/**
 * Constructs a SglCanvasUI.
 * @class Holds current information about the canvas object and input devices state.
 */
function SglCanvasUI(manager, handler, canvas, gl) {
	this._manager = manager;
	this._handler = handler;
	this._canvas  = canvas;

	this._timerID = null;
	this._updRate = 0.0;

	this.gl = gl;

	this.loadEvent        = null;
	this.unloadEvent      = null;
	this.keyDownEvent     = null;
	this.keyUpEvent       = null;
	this.keyPressEvent    = null;
	this.mouseDownEvent   = null;
	this.mouseUpEvent     = null;
	this.mouseMoveEvent   = null;
	this.mouseWheelEvent  = null;
	this.clickEvent       = null;
	this.dblClickEvent    = null;
	this.resizeEvent      = null;
	this.updateEvent      = null;
	this.drawEvent        = null;

	this.keysDown         = new Object();

	this.mouseButtonsDown = new Object();
	this.mousePos         = { x:0, y:0 };
	this.mousePrevPos     = { x:0, y:0 };
	this.mouseDeltaPos    = { x:0, y:0 };

	this.timeNow   = Date.now() / 1000.0;
	this.timePrev  = this.timeNow;
	this.timeDelta = 0.0;
}

SglCanvasUI.prototype = {
	get canvas() {
		return this._canvas;
	},

	get width() {
		return this._canvas.width;
	},

	get height() {
		return this._canvas.height;
	},

	get updateRate() {
		if (this._updRate <= 0.0) return 0.0;
		return this._updRate;
	},

	set updateRate(r) {
		var updR = r;
		if (updR < 0.0) updR = 0.0;
		if (updR > 1000.0) updR = 1000.0;
		if (this._updRate == updR) return;

		this._updRate = updR;

		if (this._timerID != null)
		{
			clearInterval(this._timerID);
			this._timerID = null;
		}

		if (this._updRate > 0.0)
		{
			var ms  = 1000.0 / this._updRate;
			if (ms < 1.0) ms = 1.0;
			var mgr = this._manager;

			this.timeNow   = Date.now() / 1000.0;
			this.timePrev  = this.timeNow;
			this.timeDelta = 0.0;

			this._timerID = setInterval(function() { mgr.update(); }, ms);
		}
	},

	get requestDraw() {
		var t = this;
		return (function() { t._manager.requestDraw(); });
	}
};
/***********************************************************************/


// _SglCanvasManager
/***********************************************************************/
function _SglCanvasManager(canvasID, handler, updateRate) {
	var canvas = document.getElementById(canvasID);
	if (!canvas) throw new Error("SpiderGL : Canvas not found");

	canvas.contentEditable = true;

	var gl = sglGetCanvasContext(canvasID);
	if (!gl) throw new Error("SpiderGL : Cannot get WebGL context");

	gl.pixelStorei(gl.PACK_ALIGNMENT,                     1);
	gl.pixelStorei(gl.UNPACK_ALIGNMENT,                   1);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,                true);
	gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,     false);
	gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);

	// for some strange reason, this is a workaround
	// to have Chrome work properly...
	// (anyway it should be harmless...)
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	var ui  = new SglCanvasUI(this, handler, canvas, gl);
	this.ui = ui;

	var mgr = this;

	this.gl      = gl;
	this.canvas  = canvas;
	this.handler = handler;
	//this.handler.prototype.ui = get function() { return ui };
	//this.handler.ui = get function() { return ui };
	this.handler.ui = ui;

	this._drawPending = false;
	this._drawFunc = function() {
		mgr.draw();
	};


	this.canvas.addEventListener("load",            function(e) { mgr.load        (e); }, false);
	this.canvas.addEventListener("unload",          function(e) { mgr.unload      (e); }, false);
	this.canvas.addEventListener("keydown",         function(e) { mgr.keyDown     (e); }, false);
	this.canvas.addEventListener("keyup",           function(e) { mgr.keyUp       (e); }, false);
	this.canvas.addEventListener("keypress",        function(e) { mgr.keyPress    (e); }, false);
	this.canvas.addEventListener("mousedown",       function(e) { mgr.mouseDown   (e); }, false);
	this.canvas.addEventListener("mouseup",         function(e) { mgr.mouseUp     (e); }, false);
	this.canvas.addEventListener("mousemove",       function(e) { mgr.mouseMove   (e); }, false);
	this.canvas.addEventListener("click",           function(e) { mgr.click       (e); }, false);
	this.canvas.addEventListener("dblclick",        function(e) { mgr.dblClick    (e); }, false);
	this.canvas.addEventListener("resize",          function(e) { mgr.resize      (e); }, false);

	this.canvas.addEventListener("mousewheel",      function(e) { mgr.mouseWheel  (e); }, false);
	this.canvas.addEventListener("DOMMouseScroll",  function(e) { mgr.mouseWheel  (e); }, false);

	this.canvas.addEventListener("blur",            function(e) { mgr.blur        (e); }, false);
	this.canvas.addEventListener("mouseout",        function(e) { mgr.mouseOut    (e); }, false);

	this.load();

//-- Added 17.04.11
	/*if (updateRate) {
		this.ui.updateRate = updateRate;
	}*/
	_tick();
//--
}

_SglCanvasManager.prototype = {
	_getMouseClientPos : function(e) {
		var rct = this.canvas.getBoundingClientRect();
		return {
			x : (e.clientX - rct.left),
			y : (e.clientY - rct.top )
		};
	},

	requestDraw : function() {
		if (!this._drawPending) {
			this._drawPending = true;
		//-- Added 17.04.11
			//setTimeout(this._drawFunc, 0);
			this._drawFunc();
		//--
		}
	},

	blur : function(e) {
		var doDraw = false;
		for (var button in this.ui.mouseButtonsDown) {
			if (this.ui.mouseButtonsDown[button]) {
				this.ui.mouseButtonsDown[button] = false;
				if (this.handler.mouseUp) {
					if (this.handler.mouseUp(this.gl, button, this.ui.mousePos.x, this.ui.mousePos.y) != false) {
						doDraw = true;
					}
				}
			}
		}

		for (var key in this.ui.keysDown) {
			if (this.ui.keysDown[key]) {
				this.ui.keysDown[key] = false;
				if (this.handler.keyUp) {
					// WARNING : passing 0 as keyCode
					if (this.handler.keyUp(this.gl, 0, key) != false) {
						doDraw = true;
					}
				}
			}
		}

		if (doDraw) {
			this.requestDraw();
		}
	},

	mouseOut: function(e) {
		var doDraw = false;
		for (var button in this.ui.mouseButtonsDown) {
			if (this.ui.mouseButtonsDown[button]) {
				this.ui.mouseButtonsDown[button] = false;
				if (this.handler.mouseUp) {
					if (this.handler.mouseUp(this.gl, button, this.ui.mousePos.x, this.ui.mousePos.y) != false) {
						doDraw = true;
					}
				}
			}
		}
	//---- Added 23.02.11
		if (this.handler.mouseOut)
			if (this.handler.mouseOut(this.gl) != false)
				doDraw = true;
	//----
		if (doDraw) {
			this.requestDraw();
		}
	},

	load : function() {
		this.ui.loadEvent = null;
		if (this.handler.load) {
			if (this.handler.load(this.gl) != false) {
				;
			}
		}
		this.requestDraw();
	},

	unload : function()
	{
		this.ui.unloadEvent = null;
		this.ui.updateRate = 0.0;
		if (this.handler.unload) {
			this.handler.unload(this.gl);
		}
		this.handler.ui = null;
		this.handler    = null;
		this.ui         = null;
	},

	keyDown : function(e) {
		this.ui.keyDownEvent = e;
		var keyString = String.fromCharCode(e.keyCode);
		this.ui.keysDown[keyString.toLowerCase()] = true;
		this.ui.keysDown[keyString.toUpperCase()] = true;
		this.ui.keysDown[e.keyCode] = true;
		if (this.handler.keyDown) {
			if (this.handler.keyDown(this.gl, e.keyCode, keyString) != false) {
				this.requestDraw();
			}
		}
		/*
		if (e.preventDefault) {
			e.preventDefault();
		}
		*/
	},

	keyUp : function(e) {
		this.ui.keyUpEvent = e;
		var keyString = String.fromCharCode(e.keyCode);
		this.ui.keysDown[keyString.toLowerCase()] = false;
		this.ui.keysDown[keyString.toUpperCase()] = false;
		this.ui.keysDown[e.keyCode] = false;
		if (this.handler.keyUp) {
			if (this.handler.keyUp(this.gl, e.keyCode, keyString) != false) {
				this.requestDraw();
			}
		}
		/*
		if (e.preventDefault) {
			e.preventDefault();
		}
		*/
	},

	keyPress : function(e) {
		this.ui.keyPressEvent = e;
		var keyString = String.fromCharCode(e.charCode);
		if (this.handler.keyPress) {
			if (this.handler.keyPress(this.gl, e.charCode, keyString) != false) {
				this.requestDraw();
			}
		}
		if (e.preventDefault) {
			e.preventDefault();
		}
	},

	mouseDown : function(e) {
		this.ui.mouseDownEvent = e;
		var xy = this._getMouseClientPos(e);
		var x = xy.x;
		var y = this.canvas.height - 1 - xy.y;
		this.ui.mousePrevPos.x = x;
		this.ui.mousePrevPos.y = y;
		this.ui.mousePos.x = x;
		this.ui.mousePos.y = y;
		this.ui.mouseDeltaPos.x = 0;
		this.ui.mouseDeltaPos.y = 0;
		this.ui.mouseButtonsDown[e.button] = true;
		if (this.handler.mouseDown) {
			if (this.handler.mouseDown(this.gl, e.button, x, y) != false) {
				this.requestDraw();
			}
		}
		//this.canvas.focus();
		if (e.preventDefault) {
			e.preventDefault();
		}
	},

	mouseUp : function(e) {
		this.ui.mouseUpEvent = e;
		var xy = this._getMouseClientPos(e);
		var x = xy.x;
		var y = this.canvas.height - 1 - xy.y;
		this.ui.mousePrevPos.x = x;
		this.ui.mousePrevPos.y = y;
		this.ui.mousePos.x = x;
		this.ui.mousePos.y = y;
		this.ui.mouseDeltaPos.x = 0;
		this.ui.mouseDeltaPos.y = 0;
		this.ui.mouseButtonsDown[e.button] = false;
		if (this.handler.mouseUp) {
			if (this.handler.mouseUp(this.gl, e.button, x, y) != false) {
				this.requestDraw();
			}
		}
		if (e.preventDefault) {
			e.preventDefault();
		}
	},

	mouseMove : function(e) {
		this.ui.mouseMoveEvent = e;
		var xy = this._getMouseClientPos(e);
		var x = xy.x;
		var y = this.canvas.height - 1 - xy.y;
		this.ui.mousePrevPos.x = this.ui.mousePos.x;
		this.ui.mousePrevPos.y = this.ui.mousePos.y;
		this.ui.mousePos.x = x;
		this.ui.mousePos.y = y;
		this.ui.mouseDeltaPos.x = this.ui.mousePos.x - this.ui.mousePrevPos.x;
		this.ui.mouseDeltaPos.y = this.ui.mousePos.y - this.ui.mousePrevPos.y;
		if (this.handler.mouseMove) {
			if (this.handler.mouseMove(this.gl, x, y) != false) {
				this.requestDraw();
			}
		}
		if (e.preventDefault) {
			e.preventDefault();
		}
	},

	mouseWheel : function(e) {
		this.ui.mouseWheelEvent = e;
		var xy = this._getMouseClientPos(e);
		var x = xy.x;
		var y = this.canvas.height - 1 - xy.y;
		this.ui.mousePrevPos.x = x;
		this.ui.mousePrevPos.y = y;
		this.ui.mousePos.x = x;
		this.ui.mousePos.y = y;
		this.ui.mouseDeltaPos.x = 0;
		this.ui.mouseDeltaPos.y = 0;
		if (this.handler.mouseWheel) {
			var delta = 0;
			if (!e) /* For IE. */ {
				e = window.event;
			}
			if (e.wheelDelta) /* IE/Opera. */ {
				delta = e.wheelDelta / 120;
				/* In Opera 9, delta differs in sign as compared to IE.
				 */
				if (window.opera) {
					delta = -delta;
				}
			}
			else if (e.detail) /** Mozilla case. */ {
				/** In Mozilla, sign of delta is different than in IE.
				 * Also, delta is multiple of 3.
				 */
				delta = -e.detail / 3;
			}
			/* If delta is nonzero, handle it.
			 * Basically, delta is now positive if wheel was scrolled up,
			 * and negative, if wheel was scrolled down.
			 */
			if (delta) {
				if (this.handler.mouseWheel(this.gl, delta, x, y) != false) {
					this.requestDraw();
				}
			}
		}

		/* Prevent default actions caused by mouse wheel.
		 * That might be ugly, but we handle scrolls somehow
		 * anyway, so don't bother here..
		 */
		if (e.preventDefault) {
			e.preventDefault();
		}
		//e.returnValue = false;
	},

	click : function(e) {
		this.ui.clickEvent = e;
		var xy = this._getMouseClientPos(e);
		var x = xy.x;
		var y = this.canvas.height - 1 - xy.y;
		if (this.handler.click) {
			if (this.handler.click(this.gl, e.button, x, y) != false) {
				this.requestDraw();
			}
		}
		/*
		if (e.preventDefault) {
			e.preventDefault();
		}
		*/
	},

	dblClick : function(e) {
		this.ui.dblClickEvent = e;
		var xy = this._getMouseClientPos(e);
		var x = xy.x;
		var y = this.canvas.height - 1 - xy.y;
		if (this.handler.dblClick) {
			if (this.handler.dblClick(this.gl, e.button, x, y) != false) {
				this.requestDraw();
			}
		}
		if (e.preventDefault) {
			e.preventDefault();
		}
	},

	resize : function(e) {
		this.ui.resizeEvent = e;
		if (this.handler.resize) {
			if (this.handler.resize(this.gl, this.canvas.width, this.canvas.height) != false) {
				this.requestDraw();
			}
		}
		if (e.preventDefault) {
			e.preventDefault();
		}
	},

	update : function() {
		this.ui.updateEvent = null;
		var now = Date.now() / 1000.0;
		this.ui.timePrev  = this.ui.timeNow;
		this.ui.timeNow   = now;
		this.ui.timeDelta = (this.ui.timeNow - this.ui.timePrev);
		var doDraw = true;
		if (this.handler.update) {
			doDraw = (this.handler.update(this.gl, this.ui.timeDelta) != false);
		}
		if (doDraw) {
			this.requestDraw();
		}
	},

	draw : function() {
		this.ui.drawEvent = null;
		if (this.handler.draw) {
			this.handler.draw(this.gl);
		}
		this.gl.flush();
		this._drawPending = false;
	}
};
/***********************************************************************/

//-- Added 17.04.11
function _tick() {
	for (var mgr in _SGL_RegisteredCanvas) {
		_SGL_RegisteredCanvas[mgr].update();
	}
	requestAnimFrame(_tick);
}

window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       || 
    		window.webkitRequestAnimationFrame || 
            window.mozRequestAnimationFrame    || 
            window.oRequestAnimationFrame      || 
            window.msRequestAnimationFrame     || 
            function(){
              window.setTimeout(_tick, 1000 / 30);
            };
  })();
//--

// canvas registration
/***********************************************************************/
var _SGL_RegisteredCanvas = new Object();

function _sglManageCanvas(canvasID, handler, updateRate) {
	var manager = new _SglCanvasManager(canvasID, handler, updateRate);
	_SGL_RegisteredCanvas[canvasID] = manager;
}

function _sglUnmanageCanvas(canvasID) {
	if (_SGL_RegisteredCanvas[canvasID]) {
		_SGL_RegisteredCanvas[canvasID] = null;
		delete _SGL_RegisteredCanvas[canvasID];
	}
}

function _sglManageCanvasOnLoad(canvasID, handler, updateRate) {
	window.addEventListener("load", function() { _sglManageCanvas(canvasID, handler, updateRate); }, false);
}

function _sglUnmanageCanvasOnLoad(canvasID) {
	window.addEventListener("unload", function() { _sglUnmanageCanvas(canvasID); }, false);
}

function sglRegisterCanvas(canvasID, handler, updateRate) {
	_sglManageCanvasOnLoad(canvasID, handler, updateRate);
	_sglUnmanageCanvasOnLoad(canvasID);
}

function sglRegisterLoadedCanvas(canvasID, handler, updateRate) {
	_sglManageCanvas(canvasID, handler, updateRate);
	_sglUnmanageCanvasOnLoad(canvasID);
}
/***********************************************************************/


//Check, if basics have already been defined
var org;
if (!org || !org.xml3d)
  throw new Error("xml3d.js has to be included first");


// Create global symbol org.xml3d.webgl
if (!org.xml3d.webgl)
	org.xml3d.webgl = {};
else if (typeof org.xml3d.webgl != "object")
	throw new Error("org.xml3d.webgl already exists and is not an object");

//Create global symbol org.xml3d.xflow
if (!org.xml3d.xflow)
	org.xml3d.xflow = {};
else if (typeof org.xml3d.xflow != "object")
	throw new Error("org.xml3d.xflow already exists and is not an object");

org.xml3d.webgl.MAXFPS = 30;

/**
 * Creates the XML3DHandler.
 * 
 * The Handler is the interface between the renderer, canvas and SpiderGL elements. It responds to
 * user interaction with the scene and manages redrawing of the canvas.
 */
org.xml3d.webgl.createXML3DHandler = (function() {

	function Scene(xml3dElement) {
		this.xml3d = xml3dElement;

		this.getActiveView = function() {
			var av = this.xml3d.getActiveViewNode();
			if (av == null)
			{
				av = document.evaluate('//xml3d:xml3d/xml3d:view[1]', document, function() {
					return org.xml3d.xml3dNS;
				}, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
				if (av == null)
					org.xml3d.debug.logError("No view defined.");
			}
			if (typeof av == typeof "") {
				av = this.xml3d.xml3ddocument.resolve(av);
				if (av == null)
					org.xml3d.debug.logError("Could not find view");
			}
			return av;
		};
	}
	
	/**
	 * Constructor for the XML3DHandler
	 * 
	 * @param canvas
	 * 		the HTML Canvas element that this handler will be responsible for
	 * @param gl
	 * 		the WebGL Context associated with this canvas
	 * @param scene
	 * 		the root xml3d node, containing the XML3D scene structure
	 */
	function XML3DHandler(gl, canvas, scene) {
		//Set up local variables
		this.gl = gl;
		this.scene = scene;
		this.canvas = canvas;
		this.needDraw = true;
		this.needPickingDraw = true;
		this._pickingDisabled = false; //TODO: SET BACK TO FALSE
		this.isDragging = false;
		this.timeNow   = Date.now() / 1000.0;
		this.postProcessShaders = [];
		this.events = { "mousedown":[], "mouseup":[], "click":[], "framedrawn":[], "mousemove":[], 
				"mouseout":[], "update":[], "mousewheel":[] };
		this.canvasInfo = {
				width 				: canvas.width,
				height 				: canvas.height,
				id					: canvas.id,	
				mouseButtonsDown 	: [false, false]
		};
		
		//Register listeners on canvas
		this.registerCanvasListeners(canvas);
		
		//This function is called at regular intervals by requestAnimFrame to determine if a redraw
		//is needed
		var handler = this;
		this._tick = function() {
			if (handler.update())
				handler.draw();
			
			requestAnimFrame(handler._tick);
		};
		
		this.redraw = function(reason, forcePickingRedraw) {
			if (this.needDraw !== undefined) {
				this.needDraw = true;
				this.needPickingDraw = forcePickingRedraw !== undefined ? forcePickingRedraw : true;
			} else {
				//This is a callback from a texture, don't need to redraw the picking buffers
				handler.needDraw = true;
			}
		};
		
		//Create renderer
		this.renderer = new org.xml3d.webgl.Renderer(this, canvas.clientWidth, canvas.clientHeight);
		
		//TODO: Buffer setup, move fullscreen quad out of handler
		
		//Set up internal frame buffers used for picking and post-processing
		//SpiderGL requires these buffers to be stored inside the Handler
		/*this.pickBuffer = new SglFramebuffer(gl, canvas.clientWidth, canvas.clientHeight,
				[gl.RGBA], gl.DEPTH_COMPONENT16, null,
				{ depthAsRenderbuffer : true }
		);
		this.normalPickBuffer = new SglFramebuffer(gl, canvas.clientWidth, canvas.clientHeight,
				[gl.RGBA], gl.DEPTH_COMPONENT16, null,
				{ depthAsRenderbuffer : true }
		);
		this.backBufferZero = new SglFramebuffer(gl, canvas.clientWidth, canvas.clientHeight,
				[gl.RGBA], gl.DEPTH_COMPONENT16, null,
				{ depthAsRenderbuffer : true }
		);
		this.backBufferOne = new SglFramebuffer(gl, canvas.clientWidth, canvas.clientHeight,
				[gl.RGBA], gl.DEPTH_COMPONENT16, null,
				{ depthAsRenderbuffer : true }
		);
		this.backBufferOrig = new SglFramebuffer(gl, canvas.clientWidth, canvas.clientHeight,
				[gl.RGBA], gl.DEPTH_COMPONENT16, null,
				{ depthAsRenderbuffer : true }
		);
		
		if (!this.pickBuffer.isValid || !this.normalPickBuffer.isValid || !this.backBufferZero || !this.backBufferOne)
			org.xml3d.debug.logError("Creation of a framebuffer failed");
		*/
		//This is the simple fullscreen quad used with the post-processing shaders
		//For reasons unknown to man it has to be defined here, SpiderGL won't render it 
		//properly otherwise
		var quadPositions = new Float32Array
		([
			-1.0, -1.0,
			 1.0, -1.0,
			-1.0,  1.0,
			 1.0,  1.0
		]);
		var texcoord = new Float32Array
		([
			0.0, 0.0,
			 1.0, 0.0,
			0.0,  1.0,
			 1.0,  1.0
		]);
		
		this.quadMesh = new SglMeshGL(gl);
		this.quadMesh.addVertexAttribute("position", 2, quadPositions);
		this.quadMesh.addVertexAttribute("texcoord", 2, texcoord);
		this.quadMesh.addArrayPrimitives("tristrip", gl.TRIANGLE_STRIP, 0, 4);
		//-------------------	
		
		this.gatherPostProcessShaders();
	}
	
	//Requests a WebGL context for the canvas and returns an XML3DHander for it
	function setupXML3DHandler(canvas, xml3dElement) {
		org.xml3d.debug.logInfo("setupXML3DHandler: canvas=" + canvas);
		var context = null;
		try {
			context = canvas.getContext("experimental-webgl");
			if (context) {
				return new XML3DHandler(context, canvas, new Scene(xml3dElement));
			}
		} catch (ef) {
			org.xml3d.debug.logError(ef);
			return null;
		}
	}
	
	XML3DHandler.prototype.registerCanvasListeners = function(canvas) {
		var handler = this;
		canvas.addEventListener("mousedown",       function(e) { handler.mouseDown   (e); }, false);
		canvas.addEventListener("mouseup",         function(e) { handler.mouseUp     (e); }, false);
		canvas.addEventListener("mousemove",       function(e) { handler.mouseMove   (e); }, false);
		canvas.addEventListener("click",           function(e) { handler.click       (e); }, false);
		canvas.addEventListener("mousewheel",      function(e) { handler.mouseWheel  (e); }, false);
		canvas.addEventListener("DOMMouseScroll",  function(e) { handler.mouseWheel  (e); }, false);
		canvas.addEventListener("mouseout",        function(e) { handler.mouseOut    (e); }, false);
	};

	//Initializes the SpiderGL canvas manager and renders the scene
	XML3DHandler.prototype.start = function() {
		var gl = this.gl;
		
		gl.pixelStorei(gl.PACK_ALIGNMENT,                     1);
		gl.pixelStorei(gl.UNPACK_ALIGNMENT,                   1);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,                true);
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,     true);
		gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL);
		
		this._tick();
	};
	
	XML3DHandler.prototype.gatherPostProcessShaders = function() {
		//TODO: add some kind of <postprocessing> node to the namespace?
		
		//var ppnode = document.getElementsByTagNameNS(org.xml3d.xml3dNS, 'postprocessing');
		var ppnode = document.getElementById("postprocessing_"+this.canvasId);
		//if (ppnode.length < 1)
		//	return;
		if (!ppnode)
			return;
		//ppnode = ppnode[0];
		var shader = ppnode.firstElementChild;
		
		while(shader !== null) {
			//if (shader.sp.valid)
				this.postProcessShaders.push(shader);
			
			shader = shader.nextElementSibling;
		}
	};
	//Returns the HTML ID of the canvas associated with this Handler
	XML3DHandler.prototype.getCanvasId = function() {
		return this.canvas.id;
	};

	//Returns the width of the canvas associated with this Handler
	XML3DHandler.prototype.getCanvasWidth = function() {
		return this.canvas.width;
	};

	//Returns the height of the canvas associated with this Handler
	XML3DHandler.prototype.getCanvasHeight = function() {
		return this.canvas.height;
	};

	XML3DHandler.prototype.resize = function(gl, width, height) {
		if (width < 1 || height < 1)
			return false;
		
		this.renderer.resize(width, height);
		
		return true;
	};
	
	//Binds the picking buffer and passes the request for a picking pass to the renderer
	XML3DHandler.prototype.renderPick = function(screenX, screenY) {
		if (this._pickingDisabled)
			return;
		this.renderer.renderPickingPass(screenX, this.canvas.height - screenY, this.needPickingDraw);
		this.needPickingDraw = false;
	};
	
	//Binds the normal picking buffer and passes the request for picked object normals to the renderer
	XML3DHandler.prototype.renderPickedNormals = function(pickedObj, screenX, screenY) {
		if (!pickedObj || this._pickingDisabled)
			return;	
		this.renderer.renderPickedNormals(pickedObj, screenX, screenY);
	};
	
	//Uses gluUnProject() to transform the 2D screen point to a 3D ray 
	// returns an XML3DRay
	XML3DHandler.prototype.generateRay = function(screenX, screenY) { 
		
		// setup input to unproject
		var viewport = new Array(); 
		viewport[0] = 0; 
		viewport[1] = 0; 
		viewport[2] = this.renderer.width; 
		viewport[3] = this.renderer.height;
		
		var viewMat = this.renderer.viewMatrix;
		var projMat = this.renderer.projMatrix; 
		
		var ray = new XML3DRay(); 
		
		var nearHit = new Array();
		var farHit = new Array(); 
		
		// do unprojections
		if(false === GLU.unProject(screenX, screenY, 0, 
											 viewMat, projMat, viewport, nearHit))
		{
			return ray; 
		}

		if(false === GLU.unProject(screenX, screenY, 1,
				 							 viewMat, projMat, viewport, farHit))
		{
			return ray; 
		}
		
		// calculate ray 
		
		ray.origin = this.renderer.currentView.position;  
		ray.direction = new XML3DVec3(farHit[0] - nearHit[0], 
									  farHit[1] - nearHit[1],
									  farHit[2] - nearHit[2]);
		ray.direction = ray.direction.normalize(); 
		
		return ray;
	}; 
	
	//This function is called by _tick() at regular intervals to determine if a redraw of the 
	//scene is required
	XML3DHandler.prototype.update = function() {
		for (var i=0; i<this.events.update.length; i++) {		
			if (this.events.update[i].listener.call(this.events.update[i].node) == true)
				this.needDraw = true;
		}	
		
		return this.needDraw;
	};	
	
	/**
	 * Called by _tick() to redraw the scene if needed
	 * @param gl
	 * @return
	 */
	XML3DHandler.prototype.draw = function() {
		//try {
			for (var t in this.rttBuffers) {
				this.rttBuffers[t].needDraw = true;
			}
			
			if (this.postProcessShaders.length > 0 && document.getElementById("postprocessing_"+this.canvasId).getAttribute("visible") != "false") {
				this.backBufferOrig.bind();
				
				var start = Date.now();		
				var stats = this.renderer.render(this.gl);
				
				this.backBufferOrig.unbind();
			
				this.renderShaders(this.postProcessShaders, null);
				var end = Date.now();				
			} else {
				var start = Date.now();		
				var stats = this.renderer.render(this.gl);
				var end = Date.now();				
			}
			this.dispatchFrameDrawnEvent(start, end, stats);
			this.needDraw = false;	
		//} catch (e) {
		//	org.xml3d.debug.logException(e);
		//	throw e;
		//}

	};
	
	/**
	 * Iterates through the list of shaders, ping-ponging between framebuffers and rendering them to a fullscreen quad
	 * 
	 * @param gl
	 * @param shaderArray
	 * 			The list of shaders to render
	 * @param targetFrameBuffer
	 *			The framebuffer that final result should be rendered to. If null it will be rendered to the screen.
	 * @return
	 */
	XML3DHandler.prototype.renderShaders = function(shaderArray, targetFrameBuffer) {			
		var lastBufferNum = 1;
		var currBuffer, lastBuffer;		
		
		for (var i=0; i<shaderArray.length; i++) {
			currBuffer = lastBufferNum == 0? this.backBufferOne : this.backBufferZero;
			lastBuffer = lastBufferNum == 0? this.backBufferZero : this.backBufferOne;
			lastBufferNum = (lastBufferNum + 1) % 2;		
			
			if (i == shaderArray.length-1) {
				if (!targetFrameBuffer)
					this.renderer.renderShader(this.gl, this.quadMesh, shaderArray[i], lastBuffer, this.backBufferOrig);
				else {
					targetFrameBuffer.bind();

					this.renderer.renderShader(this.gl, this.quadMesh, shaderArray[i], lastBuffer, this.backBufferOrig);
					targetFrameBuffer.unbind();
				}
			} else {
				currBuffer.bind();
				this.renderer.renderShader(this.gl, this.quadMesh, shaderArray[i], lastBuffer, this.backBufferOrig);
				currBuffer.unbind();
			}
		}
			
	};
	
	/** 
	 * Initalizes an DOM MouseEvent, picks the scene and sends the event to 
	 * the hit object, if one was hit. 
	 * 
	 *  It dispatches it on two ways: calling dispatchEvent() on the target element 
	 *  and going through the tree up to the root xml3d element invoking all 
	 *  on[type] attribute code. 
	 * 
	 * @param type the type string according to the W3 DOM MouseEvent
	 * @param button which mouse button is pressed, if any
	 * @param x the screen x-coordinate
	 * @param y the screen y-coordinate 
	 * @param (optional) event the W3 DOM MouseEvent, if present (currently not when SpiderGL's blur event occurs)
	 * @param (optional) target the element to which the event is to be dispatched. If this is 
	 * 			not given, the currentPickObj will be taken or the xml3d element, if no hit occured. 
	 * 
	 */
	XML3DHandler.prototype.dispatchMouseEvent = function(type, button, x, y, event, target) {

		// init event
		var evt = null; 
		if(event === null || event === undefined) 
		{
			evt = document.createEvent("MouseEvents");
			evt.initMouseEvent(	type,
							// canBubble, cancelable, view, detail
						   	true, true, window, 0, 
						   	// screenX, screenY, clientX, clientY 
						   	0, 0, x, y,  
						   	// ctrl, alt, shift, meta, button 
						   	false, false, false, false, button, 
						   	// relatedTarget
						   	null);
		}
		else
			evt = this.copyMouseEvent(event);

		// adapt type to not clash with events spidergl listens to 
		//evt.type = "xml3d" + type; 
		
		// find event target
		var tar = null;		
		if(target !== undefined && target !== null)
			tar = target; 
		else if(this.scene.xml3d.currentPickObj)
			tar = this.scene.xml3d.currentPickObj.node;
		else
			tar = this.scene.xml3d;
				
		// dispatch
		tar.dispatchEvent(evt);
		
		// trigger on[event] attributes 
		var ontype = "on" + type; 
		
		var currentObj = tar;
		var evtMethod = currentObj.getAttribute(ontype);
		if (evtMethod && currentObj.evalMethod) {
			evtMethod = new Function(evtMethod);
			evtMethod.call(currentObj, evt);
		}
		
		//Make sure the event method didn't remove picked object from the tree
		if (currentObj && currentObj.parentNode)
		{
			while(currentObj.parentNode && currentObj.parentNode.nodeName == "group")
			{
				currentObj = currentObj.parentNode;
				evtMethod = currentObj.getAttribute(ontype);
				if (evtMethod && currentObj.evalMethod) {
					evtMethod = new Function(evtMethod);
					evtMethod.call(currentObj, evt);
				}
			}
		}
	}; 
	
	/** 
	 * Creates an DOM mouse event based on the given event and returns it
	 * 
	 * @param event the event to copy
	 * @return the new event 
	 */
	XML3DHandler.prototype.copyMouseEvent = function(event)
	{
		evt = document.createEvent("MouseEvents");
		evt.initMouseEvent(	event.type,
						// canBubble, cancelable, view, detail
					   	event.bubbles, event.cancelable, event.view, event.detail, 
					   	// screenX, screenY, clientX, clientY 
					   	event.screenX, event.screenY, event.clientX, event.clientY,   
					   	// ctrl, alt, shift, meta, button 
					   	event.ctrlKey, event.altKey, event.shiftKey, event.metaKey, event.button,  
					   	// relatedTarget
					   	event.relatedTarget);
		
		return evt; 
	}; 
	
	
	/** 
	 * Adds position and normal attributes to the given event. 
	 * 
	 * @param event
	 * @param x
	 * @param y
	 * @return
	 */
	XML3DHandler.prototype.initExtendedMouseEvent = function(event, x, y) { 
				
		var handler = this;
		var scene = this.scene;
		
		event.__defineGetter__("normal", function() {
			handler.renderPickedNormals(scene.xml3d.currentPickObj, x, y); 
			var v = scene.xml3d.currentPickNormal.v;
			return new XML3DVec3(v[0], v[1], v[2]);
		});
		event.__defineGetter__("position", function() {return scene.xml3d.currentPickPos;});
	}; 
	
	/**
	 * This method is called each time a mouseUp event is triggered on the canvas
	 * 
	 * @param gl
	 * @param button
	 * @param x
	 * @param y
	 * @return
	 */
	XML3DHandler.prototype.mouseUp = function(evt) {	
		this.canvasInfo.mouseButtonsDown[evt.button] = false;
		var pos = this.getMousePosition(evt);
		
		if (this.isDragging)
		{
			this.needPickingDraw = true;
			this.isDragging = false;
		}
		
		this.renderPick(pos.x, pos.y); 
		
		this.initExtendedMouseEvent(evt, pos.x, pos.y); 
		this.dispatchMouseEvent("mouseup", evt.button, pos.x, pos.y, evt); 
		
		return false; // don't redraw
	};

	/**
	 * This method is called each time a mouseDown event is triggered on the canvas
	 * 
	 * @param gl
	 * @param button
	 * @param x
	 * @param y
	 * @return
	 */
	XML3DHandler.prototype.mouseDown = function(evt) {
		this.canvasInfo.mouseButtonsDown[evt.button] = true;
		var pos = this.getMousePosition(evt);
		                                 
		var scene = this.scene;
		
		var evt = this.copyMouseEvent(evt); 
		this.initExtendedMouseEvent(evt, pos.x, pos.y); 
		
		this.dispatchMouseEvent("mousedown", evt.button, pos.x, pos.y, evt); 
		
		return false; // don't redraw
	};
	
	/** 
	 * This method is called each time a click event is triggered on the canvas
	 * 
	 * @param gl
	 * @param button
	 * @param x
	 * @param y
	 * @return
	 */
	XML3DHandler.prototype.click = function(evt) {
		var pos = this.getMousePosition(evt);
		if (this.isDragging) {
			this.needPickingDraw = true;
			return;
		}
				

		this.initExtendedMouseEvent(evt, pos.x, pos.y); 		
		this.dispatchMouseEvent("click", evt.button, pos.x, pos.y, evt); 
		
		return false; // don't redraw
	}; 

	/**
	 * This method is called each time a mouseMove event is triggered on the canvas. 
	 * 
	 * This method also triggers mouseover and mouseout events of objects in the scene. 
	 * 
	 * @param gl
	 * @param x
	 * @param y
	 * @return
	 */
	XML3DHandler.prototype.mouseMove = function(evt) {
		var pos = this.getMousePosition(evt);
		
		if (this.canvasInfo.mouseButtonsDown[0]) {
			this.isDragging = true;
		}
		
		//Call any global mousemove methods		
		var evt = this.copyMouseEvent(evt); 
		this.dispatchMouseEvent("mousemove", 0, pos.x, pos.y, evt, this.scene.xml3d); 
		
		var lastObj = null;
		if(this.scene.xml3d.currentPickObj)
			lastObj = this.scene.xml3d.currentPickObj.node;

		this.renderPick(pos.x, pos.y);
		var curObj = null; 
		if(this.scene.xml3d.currentPickObj)
			curObj = this.scene.xml3d.currentPickObj.node;
		
		// trigger mouseover and mouseout
		if(curObj !== lastObj)
		{
			if (lastObj) 
			{
				//The mouse has left the last object
				this.dispatchMouseEvent("mouseout", 0, pos.x, pos.y, null, lastObj); 	
			}
			if (curObj)
			{
				//The mouse is now over a different object, so call the new object's
				//mouseover method
				this.dispatchMouseEvent("mouseover", 0, pos.x, pos.y);
			}
		}
		
		return false; // don't redraw
	};
	
	/**
	 * This method is called each time the mouse leaves the canvas
	 * 
	 * @param gl
	 * @return
	 */
	XML3DHandler.prototype.mouseOut = function(evt) {
		var pos = this.getMousePosition(evt);		
		this.dispatchMouseEvent("mouseout", 0, pos.x, pos.y, evt, this.scene.xml3d);
		
		return false; // don't redraw
	};
	
	XML3DHandler.prototype.mouseWheel = function(evt) {
		var pos = this.getMousePosition(evt);
		// note: mousewheel type not defined in DOM! 
		this.dispatchMouseEvent("mousewheel", 0, pos.x, pos.y, evt, this.scene.xml3d);
		
		return false; // don't redraw
	};

	/**
	 * Dispatches a FrameDrawnEvent to listeners
	 * 
	 * @param start
	 * @param end
	 * @param numObjDrawn
	 * @return
	 */
	XML3DHandler.prototype.dispatchFrameDrawnEvent = function(start, end, stats) {
		var event = {};
		event.timeStart = start;
		event.timeEnd = end;
		event.renderTimeInMilliseconds = end - start;
		event.numberOfObjectsDrawn = stats[0];
		event.numberOfTrianglesDrawn = Math.floor(stats[1]);
		
		for (var i in this.events.framedrawn) {
			this.events.framedrawn[i].listener.call(this.events.framedrawn[i].node, event);
		}
		
	};

	/**
	 * Add a new event listener to a node inside the XML3D scene structure.
	 * 
	 * @param node
	 * @param type
	 * @param listener
	 * @param useCapture
	 * @return
	 */
	XML3DHandler.prototype.addEventListener = function(node, type, listener, useCapture) {
		if (type in this.events) {
			var e = new Object();
			e.node = node;
			if (typeof listener == typeof "") {
				var parsed = this.parseListenerString(listener);
				e.listener = new Function("evt", parsed);
			} else {
				e.listener = listener;
			}
			e.useCapture = useCapture;
			this.events[type].push(e);
		} 
	};


	XML3DHandler.prototype.parseListenerString = function(listener) {
		var matchedListener =  "alert(Could not parse listener string "+listener+"! Only listeners of the type 'myFunction(aVariableToHoldTheEvent)' are supported!)";
		//Make sure the listener string has the form "functionName(arguments)"
		var matches = listener.match(/.*\(.*\)/);
		if (matches) {
			matchedListener = listener.substring(0, listener.indexOf('('));
			matchedListener += "(evt)";
		}
		
		return matchedListener;
	};
	XML3DHandler.prototype.removeEventListener = function(node, type, listener, useCapture) {
		if (!this.events[type]) {
			org.xml3d.debug.logError("Could not remove listener for event type "+type);
			return;
		}
		
		/* Note: below we compare the listener functions by 
		 * converting them to strings. This works on chrome 12.0.742.100 and firefox 4.0.1. 
		 * However it might not work on other browsers like IE.  
		 */  
		for (i=0; i<this.events[type].length; i++) {
			var stored = this.events[type][i];
			if (stored.node == node 
			 && String(stored.listener) == String(listener))
				this.events[type].splice(i,1);
		}
	};
	
XML3DHandler.prototype.getRenderedTexture = function (textureSrc) {
		if (!this.rttBuffers[textureSrc]) {
			var srcDataNode = document.getElementById(textureSrc.substring(1,textureSrc.length));
			if (!srcDataNode) {
				org.xml3d.debug.logError("Could not resolve texture source { "+textureSrc+" }");
				return null;
			}
			var width = srcDataNode.getAttribute("width");
			var height = srcDataNode.getAttribute("height");
			width = width ? width : 512;
			height = height ?  height : 512;
			
			var FBO = new SglFramebuffer(this.gl, width, height,
				[gl.RGBA], gl.DEPTH_COMPONENT16, null,
				{ depthAsRenderbuffer : true }
			);
			
			var shader = srcDataNode.firstElementChild;
			var sArray = [];
			while(shader !== null) {				
				sArray.push(shader);				
				shader = shader.nextElementSibling;
			}
			var container = {};
			container.fbo = FBO;
			container.shaders = sArray;
			container.needDraw = true;
			this.rttBuffers[textureSrc] = container;
		}
		var cont = this.rttBuffers[textureSrc];
		
		var fbo = cont.fbo;
		var shaders = cont.shaders;
		
		if (cont.needDraw == true)
			this.renderShaders(shaders, fbo);
		
		cont.needDraw = false;
		return fbo.colorTargets[0];
	};
	
	//Destroys the renderer associated with this Handler
	XML3DHandler.prototype.shutdown = function(scene) {
		var gl = this.gl;

		if (this.renderer) {
			this.renderer.dispose();
		}
	};
	
	XML3DHandler.prototype.getMousePosition = function(evt) {
		var rct = this.canvas.getBoundingClientRect();
		return {
			x : (evt.clientX - rct.left),
			y : (evt.clientY - rct.top )
		};
	};

	window.requestAnimFrame = (function(){
	    return  window.requestAnimationFrame       || 
	    		window.webkitRequestAnimationFrame || 
	            window.mozRequestAnimationFrame    || 
	            window.oRequestAnimationFrame      || 
	            window.msRequestAnimationFrame     || 
	            function(){
	              window.setTimeout(_tick, 1000 / org.xml3d.webgl.MAXFPS);
	            };
	  })();
	
	return setupXML3DHandler;
})();
/**********************************************
 * Class org.xml3d.webgl.XML3DShaderHandler
 * 
 * The XML3DShaderHandler is an abstraction between the renderer and WebGL. It handles the creation of shaders and 
 * management of internal shaders that have no DOM node associated with them (eg. the picking shader). No shaders are
 * stored in this class.
 * 
 **********************************************/

org.xml3d.webgl.XML3DShaderHandler = function(gl, renderer) {
	this.gl = gl;
	this.renderer = renderer;
	this.currentProgram = null;
	this.shaders = {};
};

org.xml3d.webgl.XML3DShaderHandler.prototype.getStandardShaderProgram = function(name) {
	var sources = {};
	
	if (!g_shaders[name]) {
		org.xml3d.debug.logError("Unknown shader: "+name+". Using flat shader instead.");
	} else {
		sources.vs = g_shaders[name].vertex;
		sources.fs = g_shaders[name].fragment;
	}
	
	var shaderProgram = this.createShaderFromSources(sources);	
	this.setStandardUniforms(shaderProgram);
	
	return shaderProgram;
};

org.xml3d.webgl.XML3DShaderHandler.prototype.createShaderFromSources = function(sources) {
	var gl = this.gl;
	
	if (!sources.vs || !sources.fs) {
		return this.createShaderFromSources( {vs : g_shaders["urn:xml3d:shader:flat"].vertex, 
										  fs : g_shaders["urn:xml3d:shader:flat"].fragment} );	
	}
	
	var prg = gl.createProgram();
	
	var vShader = this.compileShader(gl.VERTEX_SHADER, sources.vs);
	var fShader = this.compileShader(gl.FRAGMENT_SHADER, sources.fs);
	
	if (vShader === null || fShader === null) {
		//Use a default flat shader instead
		return this.createShaderFromSources( {vs : g_shaders["urn:xml3d:shader:flat"].vertex, 
										  fs : g_shaders["urn:xml3d:shader:flat"].fragment} );
	}
	
	//Link shader program	
	gl.attachShader(prg, vShader);
	gl.attachShader(prg, fShader);
	gl.linkProgram(prg);
	
	if (gl.getProgramParameter(prg, gl.LINK_STATUS) == 0) {
		var errorString = "Shader linking failed: \n";
		errorString += gl.getProgramInfoLog(prg);
		errorString += "\n--------\n";
		org.xml3d.debug.logError(errorString);
		gl.getError();
		
		return this.createShaderFromSources( {vs : g_shaders["urn:xml3d:shader:flat"].vertex, 
										  fs : g_shaders["urn:xml3d:shader:flat"].fragment} );
	}
	
	var programObject = { 	attributes 	: {}, 
							uniforms 	: {}, 
							samplers	: {},
							handle		: prg };
	
	gl.useProgram(prg);
	
	//Tally shader attributes
	var numAttributes = gl.getProgramParameter(prg, gl.ACTIVE_ATTRIBUTES);
	for (var i=0; i<numAttributes; i++) {
		var att = gl.getActiveAttrib(prg, i);
		if (!att) continue;
		var attInfo = {};
		attInfo.name = att.name;
		attInfo.size = att.size;
		attInfo.glType = att.type;
		attInfo.location = gl.getAttribLocation(prg, att.name);
		programObject.attributes[att.name] = attInfo;
	}

	//TODO: shader not picking up light uniforms?
	//Tally shader uniforms and samplers
	var texCount = 0;
	var numUniforms = gl.getProgramParameter(prg, gl.ACTIVE_UNIFORMS);
	for (var i=0; i<numUniforms; i++) {
		var uni = gl.getActiveUniform(prg, i);
		if (!uni) continue;
		var uniInfo = {};	
		uniInfo.name = uni.name;
		uniInfo.size = uni.size;
		uniInfo.glType = uni.type;
		uniInfo.location = gl.getUniformLocation(prg, uni.name);
		
		if (uni.type == gl.SAMPLER_2D || uni.type == gl.SAMPLER_CUBE) {
			uniInfo.texUnit = texCount;
			//this.textures[uni.name].info = uniInfo;

			programObject.samplers[uni.name] = uniInfo;
			texCount++;
		}
		else
			programObject.uniforms[uni.name] = uniInfo;
	}
	
	return programObject;
};

org.xml3d.webgl.XML3DShaderHandler.prototype.compileShader = function(type, shaderSource) {
	var gl = this.gl;
	
	var shd = gl.createShader(type);
	gl.shaderSource(shd, shaderSource);
	gl.compileShader(shd);
	
	if (gl.getShaderParameter(shd, gl.COMPILE_STATUS) == 0) {
		var errorString = "";
		if (type == gl.VERTEX_SHADER)
			errorString = "Vertex shader failed to compile: \n";
		else
			errorString = "Fragment shader failed to compile: \n";
		
		errorString += gl.getShaderInfoLog(shd) + "\n--------\n";
		org.xml3d.debug.logError(errorString);
		gl.getError();
		
		return null;
	}
	
	return shd;
};

org.xml3d.webgl.XML3DShaderHandler.prototype.setStandardUniforms = function(sp) {
	
	var gl = this.gl;
	
	var uniform = null;
	
	//Diffuse color
	uniform = sp.uniforms.diffuseColor;
	if (uniform) { 
		this.setUniform(gl, uniform, [1.0, 1.0, 1.0]);
	}
	
	//Emissive color
	uniform = sp.uniforms.emissiveColor;
	if (uniform) { 
		this.setUniform(gl, uniform, [0.0, 0.0, 0.0]);
	}
	
	//Specular color
	uniform = sp.uniforms.specularColor;
	if (uniform) { 
		this.setUniform(gl, uniform, [0.0, 0.0, 0.0]);
	}
		
	//Shininess
	uniform = sp.uniforms.shininess;
	if (uniform) { 
		this.setUniform(gl, uniform, 0.2);
	}
	
	//Transparency
	uniform = sp.uniforms.transparency;
	if (uniform) { 
		this.setUniform(gl, uniform, 0.0);
	}

	
	////org.xml3d.webgl.checkError(this.gl);
};

org.xml3d.webgl.XML3DShaderHandler.prototype.setUniformVariables = function(sp, uniforms) {
	if (this.currentProgram != sp) {
		this.gl.useProgram(sp.handle);
	}
	
	for (var name in uniforms) {
		var u = uniforms[name];
		if (u.clean)
			continue;
		
		if (sp.uniforms[name]) {
			this.setUniform(this.gl, sp.uniforms[name], u);
		}
	}
	
};

org.xml3d.webgl.XML3DShaderHandler.prototype.bindShader = function(sp) {
	this.currentProgram = sp;
	this.gl.useProgram(sp.handle);
};

org.xml3d.webgl.XML3DShaderHandler.prototype.unbindShader = function(sp) {
	this.currentProgram = null;
	this.gl.useProgram(null);
};

org.xml3d.webgl.XML3DShaderHandler.prototype.setUniform = function(gl, u, value) {
	switch (u.glType) {
		case gl.BOOL:
		case gl.INT:		
		case gl.SAMPLER_2D:	gl.uniform1i(u.location, value); break;	
		
		case gl.BOOL_VEC2: 	
		case gl.INT_VEC2:	gl.uniform2iv(u.location, value); break;
		
		case gl.BOOL_VEC3:	
		case gl.INT_VEC3:	gl.uniform3iv(u.location, value); break;
		
		case gl.BOOL_VEC4:	
		case gl.INT_VEC4:	gl.uniform4iv(u.location, value); break;
		
		case gl.FLOAT:		gl.uniform1f(u.location, value); break;
		case gl.FLOAT_VEC2:	gl.uniform2fv(u.location, value); break;
		case gl.FLOAT_VEC3:	gl.uniform3fv(u.location, value); break;
		case gl.FLOAT_VEC4:	gl.uniform4fv(u.location, value); break;
		
		case gl.FLOAT_MAT2: gl.uniformMatrix2fv(u.location, gl.FALSE, value); break;
		case gl.FLOAT_MAT3: gl.uniformMatrix3fv(u.location, gl.FALSE, value); break;
		case gl.FLOAT_MAT4: gl.uniformMatrix4fv(u.location, gl.FALSE, value); break;
		
		default:
			org.xml3d.debug.logError("Unknown uniform type "+u.glType);
			break;
	}
};

org.xml3d.webgl.XML3DShaderHandler.prototype.bindDefaultShader = function() {
	if (!this.shaders.defaultShader) {
		this.shaders.defaultShader = this.getStandardShaderProgram("urn:xml3d:shader:flat");
	}
	this.currentProgram = this.shaders.defaultShader;
	this.gl.useProgram(this.shaders.defaultShader.handle);
	
	return this.shaders.defaultShader;
};

org.xml3d.webgl.XML3DShaderHandler.prototype.unbindDefaultShader = function() {
	this.currentProgram = null;
	this.gl.useProgram(null);
};
/*******************************************
 * Class org.xml3d.webgl.XML3DBufferHandler 
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

org.xml3d.webgl.XML3DBufferHandler = function(gl, renderer) {
	this.renderer = renderer;
	this.gl = gl;
};

org.xml3d.webgl.XML3DBufferHandler.prototype.createPickingBuffer = function(width, height) {
	var gl = this.gl;
	
	if (width > 380 || height > 240) {
		var scale = 380 / width;
		width = Math.floor(width * scale);
		height = Math.floor(height * scale);
	}
	
	return this.createFrameBuffer(width, height, gl.RGBA, gl.DEPTH_COMPONENT16, null, { depthAsRenderbuffer : true } );
};

org.xml3d.webgl.XML3DBufferHandler.prototype.createShadowBuffer = function() {
	//TODO: this
};

org.xml3d.webgl.XML3DBufferHandler.prototype.createFrameBuffer = function(width, height, colorFormat, depthFormat, stencilFormat, options) {
	
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
			var ctex = org.xml3d.webgl.XML3DCreateTex2DFromData(gl, colorFormat, width, height, gl.RGBA, 
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
			var dtex = org.xml3d.webgl.XML3DCreateTex2DFromData(gl, depthFormat, width, height, 
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
			var stex = org.xml3d.webgl.XML3DCreateTex2DFromData(gl, stencilFormat, width, height, 
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
	        org.xml3d.debug.logError("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_ATTACHMENT");
	        break;
	    case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
	    	org.xml3d.debug.logError("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT");
	        break;
	    case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
	    	org.xml3d.debug.logError("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_DIMENSIONS");
	        break;
	    case gl.FRAMEBUFFER_UNSUPPORTED:
	    	org.xml3d.debug.logError("Incomplete framebuffer: FRAMEBUFFER_UNSUPPORTED");
	        break;
	    default:
	    	org.xml3d.debug.logError("Incomplete framebuffer: " + status);
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

	return fbo;
};

org.xml3d.webgl.XML3DBufferHandler.prototype.destroyFrameBuffer = function(fbo) {
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

org.xml3d.webgl.XML3DBufferHandler.prototype.fillOptions = function(options) {
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



/*************************************************************************/
/*                                                                       */
/*  xml3d_renderer.js                                                    */
/*  WebGL renderer for XML3D						                     */
/*                                                                       */
/*  Copyright (C) 2010                                                   */
/*  DFKI - German Research Center for Artificial Intelligence            */
/* 	partly based on code originally provided by Philip Taylor, 			 */
/*  Peter Eschler, Johannes Behr and Yvonne Jung 						 */
/*  (philip.html5.org, www.x3dom.org)                                    */
/*                                                                       */
/*  This file is part of xml3d.js                                        */
/*                                                                       */
/*  xml3d.js is free software; you can redistribute it and/or modify     */
/*  under the terms of the GNU General Public License as                 */
/*  published by the Free Software Foundation; either version 2 of       */
/*  the License, or (at your option) any later version.                  */
/*                                                                       */
/*  xml3d.js is distributed in the hope that it will be useful, but      */
/*  WITHOUT ANY WARRANTY; without even the implied warranty of           */
/*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.                 */
/*  See the GNU General Public License                                   */
/*  (http://www.fsf.org/licensing/licenses/gpl.html) for more details.   */
/*                                                                       */
/*************************************************************************/


org.xml3d.webgl.supported = function() {
	var canvas = document.createElement("canvas");
	canvas.width = 1;
	canvas.height = 1;
	try {
		var gl = canvas.getContext("experimental-webgl");
	} catch(e) {
		var gl = null;
	}
	return !!gl;
};

org.xml3d.webgl.configure = function(xml3ds) {
	var handlers = {};
	for(var i in xml3ds) {
		// Creates a HTML <canvas> using the style of the <xml3d> Element
		var canvas = org.xml3d.webgl.createCanvas(xml3ds[i], i);
		// Creates the gl XML3DHandler for the <canvas>  Element
		var XML3DHandler = org.xml3d.webgl.createXML3DHandler(canvas, xml3ds[i]);
		xml3ds[i].canvas = canvas;
		
		//Check for event listener attributes for the xml3d node
		if (xml3ds[i].hasAttribute("contextmenu") && xml3ds[i].getAttribute("contextmenu") == "false")
			xml3ds[i].canvas.addEventListener("contextmenu", function(e) {org.xml3d.webgl.stopEvent(e);}, false);
		if (xml3ds[i].hasAttribute("framedrawn"))
			XML3DHandler.addEventListener(xml3ds[i], "framedrawn", xml3ds[i].getAttribute("framedrawn"), false);
		
		if (xml3ds[i].hasAttribute("disablepicking"))
			XML3DHandler._pickingDisabled = xml3ds[i].getAttribute("disablepicking") == "true" ? true : false;

		XML3DHandler.start();
		handlers[i] = XML3DHandler;
		org.xml3d._rendererFound = true;
	}
	
	//Update listening should be deferred until all canvases are created and configured or it may interfere with the 
	//configuration process
	for (var i in xml3ds) {
		if (xml3ds[i].hasAttribute("onupdate"))
			handlers[i].addEventListener(xml3ds[i], "update", xml3ds[i].getAttribute("onupdate"), false);
		
	}
};

org.xml3d.webgl.stopEvent = function(ev) {
	if (ev.preventDefault)
		ev.preventDefault();
	if (ev.stopPropagation) 
		ev.stopPropagation();
	ev.returnValue = false;
};

org.xml3d.webgl.createCanvas = function(xml3dElement, index) {

	var parent = xml3dElement.parentNode;
	// Place xml3dElement inside an invisble div
	var hideDiv = parent.ownerDocument.createElement('div');
	hideDiv.style.display = "none";
	parent.insertBefore(hideDiv, xml3dElement);
	hideDiv.appendChild(xml3dElement);

	// Create canvas and append it where the xml3d element was before
	var canvas = parent.ownerDocument.createElement('canvas');
	parent.insertBefore(canvas, hideDiv);

	
	// Try to transfer all CSS attributes from the xml3d element to the canvas element
	
	// transfer style attribute as it's not in the computed style and has
	// higher priority
	if (xml3dElement.hasAttribute("style"))
		canvas.setAttribute("style", xml3dElement.getAttribute("style"));

	// First set the computed for some important attributes, they might be overwritten 
	// by class attribute later
	var sides = [ "top", "right", "bottom", "left" ];
	var colorStr = ""; var styleStr = ""; var widthStr = ""; var paddingStr = "";
	for (i in sides) {
		colorStr += org.xml3d.util.getStyle(xml3dElement, "border-" + sides[i] + "-color") + " ";
		styleStr += org.xml3d.util.getStyle(xml3dElement, "border-" + sides[i] + "-style") + " ";
		widthStr += org.xml3d.util.getStyle(xml3dElement, "border-" + sides[i] + "-width") + " ";
		paddingStr += org.xml3d.util.getStyle(xml3dElement, "padding-" + sides[i]) + " ";
	}
	canvas.style.borderColor = colorStr;
	canvas.style.borderStyle = styleStr;
	canvas.style.borderWidth = widthStr;
	canvas.style.padding = paddingStr;
	
	if(!canvas.style.width)
		canvas.style.width = org.xml3d.util.getStyle(xml3dElement, "width");
	if(!canvas.style.height)
		canvas.style.height = org.xml3d.util.getStyle(xml3dElement, "height");
	
	if (!canvas.style.backgroundColor) {
	var bgcolor = org.xml3d.util.getStyle(xml3dElement, "background-color");
	if (bgcolor && bgcolor != "transparent")
		canvas.style.backgroundColor = bgcolor;
	}

	// transfer class attributes and add xml3d-canvas-style for special canvas styling
	var classString = "xml3d-canvas-style";
	if (xml3dElement.hasAttribute("class"))
		classString = xml3dElement.getAttribute("class") + " " + classString;
	canvas.setAttribute("class", classString);


	// Width and height are can also be specified as attributes, then they have
	// the highest priority
	var h, w;
	
	if ((w = xml3dElement.getAttribute("width")) !== null) {
		canvas.style.width = w;
	} else if ((w = org.xml3d.util.getStyle(xml3dElement, "width")) != "auto"){
		canvas.style.width = w;
	}
	if ((h = xml3dElement.getAttribute("height")) !== null) {
		canvas.style.height = h;
	} else if ((h = org.xml3d.util.getStyle(xml3dElement, "height")) != "auto"){
		canvas.style.height = h;
	}
	canvas.id = "canvas"+index;
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	
	return canvas;
};


org.xml3d.webgl.checkError = function(gl, text)
{
	var error = gl.getError();
	if (error !== gl.NO_ERROR) {
		var textErr = ""+error;
		switch (error) {
		case 1280: textErr = "1280 ( GL_INVALID_ENUM )"; break;
		case 1281: textErr = "1281 ( GL_INVALID_VALUE )"; break;
		case 1282: textErr = "1282 ( GL_INVALID_OPERATION )"; break;
		case 1283: textErr = "1283 ( GL_STACK_OVERFLOW )"; break;
		case 1284: textErr = "1284 ( GL_STACK_UNDERFLOW )"; break;
		case 1285: textErr = "1285 ( GL_OUT_OF_MEMORY )"; break;
		}
		var msg = "GL error " + textErr + " occured.";
		if (text !== undefined)
			msg += " " + text;
		org.xml3d.debug.logError(msg);
	}
};

/**
 * Constructor for the Renderer.
 * 
 * The renderer is responsible for drawing the scene and determining which object was
 * picked when the user clicks on elements of the canvas.
 */
org.xml3d.webgl.Renderer = function(handler, width, height) {
	this.handler = handler;
	this.currentView = null;
	this.scene = handler.scene;
	this.factory = new org.xml3d.webgl.XML3DRenderAdapterFactory(handler, this);
	this.dataFactory = new org.xml3d.webgl.XML3DDataAdapterFactory(handler);
	this.bufferHandler = new org.xml3d.webgl.XML3DBufferHandler(handler.gl, this);
	this.shaderHandler = new org.xml3d.webgl.XML3DShaderHandler(handler.gl, this);
	this.lights = [];
	this.camera = this.initCamera();
	this.shaderMap = this._initInternalShaders();
	this.width = width;
	this.height = height;
	this.opaqueObjects = [];
	this.transparentObjects = [];
	this.allObjects = [];
	
	this.fbos = this._initFrameBuffers(handler.gl);
	
	this.collectDrawableObjects(new XML3DMatrix(), this.opaqueObjects, this.transparentObjects, this.lights, null, true);
};

org.xml3d.webgl.Renderer.prototype.initCamera = function() {
	var av = this.scene.getActiveView();

	if (av == null)
	{
		av =  document.evaluate('//xml3d:xml3d/xml3d:view[1]', document, function() {
			return org.xml3d.xml3dNS;
		}, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
		if (av == null)
			org.xml3d.debug.logError("No view defined.");
		this.currentView = av;
		return this.factory.getAdapter(av, org.xml3d.webgl.Renderer.prototype);
	}
	this.currentView = av;
	return this.factory.getAdapter(av, org.xml3d.webgl.Renderer.prototype);
};

org.xml3d.webgl.Renderer.prototype.collectDrawableObjects = function(transform,
		opaqueObjects, transparentObjects, lights, shader, visible) {
	var adapter = this.factory.getAdapter(this.scene.xml3d, org.xml3d.webgl.Renderer.prototype);
	if (adapter)
		return adapter.collectDrawableObjects(transform, opaqueObjects, transparentObjects, lights, shader, visible);
	return [];
};

org.xml3d.webgl.Renderer.prototype._initFrameBuffers = function(gl) {
	var fbos = {};
	
	fbos.picking = this.bufferHandler.createPickingBuffer(this.width, this.height);
	if (!fbos.picking.valid)
		this.handler._pickingDisabled = true;
	
	return fbos;
};

org.xml3d.webgl.Renderer.prototype._initInternalShaders = function() {
	var shaderMap = {};
	shaderMap.picking = this.shaderHandler.getStandardShaderProgram("urn:xml3d:shader:picking");
	//TODO: Shadow map, reflection, etc
	
	return shaderMap;
};

org.xml3d.webgl.Renderer.prototype.resizeCanvas = function (width, height) {
	this.width = width;
	this.height = height;
};

org.xml3d.webgl.Renderer.prototype.requestRedraw = function(reason) {
	this.handler.redraw(reason);
};

org.xml3d.webgl.Renderer.prototype.sceneTreeAddition = function(evt) {
	var adapter = this.factory.getAdapter(evt.newValue, org.xml3d.webgl.Renderer.prototype);
	
	//Traverse parent nodes to build any inherited shader and transform elements
	var transform = adapter.applyTransformMatrix(new XML3DMatrix());
	var visible = true;
	var shader = null;	
	if (adapter.getShader)
		shader = adapter.getShader();
	
	var currentNode = evt.newValue;
	var didListener = false;
	adapter.isValid = true;
	
	while (currentNode.parentNode) {
		currentNode = currentNode.parentNode;
		if (currentNode.nodeName == "group") {
			var parentAdapter = this.factory.getAdapter(currentNode, org.xml3d.webgl.Renderer.prototype);	
			
			if (!didListener) { 
				parentAdapter.listeners.push(adapter); 
				didListener = true; 
			}
			transform = parentAdapter.applyTransformMatrix(transform);
			if (!shader)
				shader = parentAdapter.getShader();
			if (currentNode.getAttribute("visible") == "false")
				visible = false;
		}
	}

	adapter.collectDrawableObjects(transform, this.opaqueObjects, this.transparentObjects, this.lights, shader, visible);
	this.requestRedraw("A node was added.");	
};

org.xml3d.webgl.Renderer.prototype.sceneTreeRemoval = function (evt) {
	//References to the adapters of the removed node are automatically cleaned up
	//as they're encountered during the render phase or notifyChanged methods
	var adapter = this.factory.getAdapter(evt.oldValue, org.xml3d.webgl.Renderer.prototype);
	if (adapter && adapter.dispose)
		adapter.dispose();
	this.requestRedraw("A node was removed.");

};

org.xml3d.webgl.Renderer.prototype.render = function() {
	var gl = this.handler.gl;
	var sp = null;
	

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
	gl.viewport(0, 0, this.width, this.height);
	//gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE,
	//		gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.DEPTH_TEST);
	
	if (this.currentView != this.scene.getActiveView())
		this.camera = this.initCamera();

	var xform = {};
	xform.view = this.camera.getViewMatrix();
	xform.proj = this.camera.getProjectionMatrix(this.width / this.height);
	
	//Setup lights
	var light, lightOn;
	var slights = this.lights;
	var elements = slights.length * 3;
	var lightParams = {
		positions : new Float32Array(elements),
		diffuseColors : new Float32Array(elements),
		ambientColors : new Float32Array(elements),
		attenuations : new Float32Array(elements),
		visible : new Float32Array(elements)
	};
	for ( var j = 0; j < slights.length; j++) {
		var light = slights[j][1];
		var params = light.getParameters(xform.view);
		if (!params)
			continue; // TODO: Shrink array
		lightParams.positions.set(params.position, j*3);
		lightParams.attenuations.set(params.attenuation, j*3);
		lightParams.diffuseColors.set(params.intensity, j*3);
		lightParams.visible.set(params.visibility, j*3);
	}
	
	var stats = { objCount : 0, triCount : 0 };
	
	//TODO: Remove sorting for opaque objects?
	//Sort opaque objects, back to front
	var zPosOpaque = [];
	this.sortObjects(this.opaqueObjects, zPosOpaque, xform, false);
	
	//Sort transparent objects, back to front
	var zPosTransparent = [];
	this.sortObjects(this.transparentObjects, zPosTransparent, xform, false);
	
	//Render opaque objects
	this.drawObjects(this.opaqueObjects, zPosOpaque, xform, lightParams, stats);
	
	//Render transparent objects
	if (this.transparentObjects.length > 0) {
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.enable(gl.BLEND);
		gl.depthMask(gl.FALSE);
	
		this.drawObjects(this.transparentObjects, zPosTransparent, xform, lightParams, stats);
		
		gl.disable(gl.BLEND);
		gl.depthMask(gl.TRUE);
	}
	
	return [stats.objCount, stats.triCount]; 
};

org.xml3d.webgl.Renderer.prototype.sortObjects = function(sourceObjectArray, sortedObjectArray, xform, backToFront) {
	for (i = 0, n = sourceObjectArray.length; i < n; i++) {
		var meshAdapter = sourceObjectArray[i];
		
		if (!meshAdapter.isValid) {
			sourceObjectArray.splice(i, 1);
			i--;
			n--;
			continue;
		}
		
		var trafo = meshAdapter._transform;
		var center = meshAdapter.bbox.center();
		center = trafo.multiply(new XML3DRotation(center.x, center.y, center.z, 1.0));
		center = xform.view.multiply(new XML3DRotation(center.x, center.y, center.z, 1.0));
		sortedObjectArray[i] = [ i, center.z ]; 
	}
	
	if (backToFront) {
		sortedObjectArray.sort(function(a, b) {
			return a[1] - b[1];
		});
	} else {
		sortedObjectArray.sort(function(a, b) {
			return b[1] - a[1];
		});
	}
};

org.xml3d.webgl.Renderer.prototype.drawObjects = function(objectArray, zPosArray, xform, lightParams, stats) {
	var objCount = 0;
	var triCount = 0;
	var parameters = {};
	
	parameters["lightPositions[0]"] = lightParams.positions;
	parameters["lightVisibility[0]"] = lightParams.visible;
	parameters["lightDiffuseColors[0]"] = lightParams.diffuseColors;
	parameters["lightAmbientColors[0]"] = lightParams.ambientColors;
	parameters["lightAttenuations[0]"] = lightParams.attenuations;
	
	for (var i = 0; i < zPosArray.length; i++) {
		var obj = objectArray[zPosArray[i][0]];
		var transform = obj._transform;
		var shape = obj;
		var shader = obj._shader;
		
		if (shape._visible == false)
			continue;
		
		//xform.model.load(transform);
		xform.model = transform;
		xform.modelView = this.camera.getModelViewMatrix(xform.model);
		parameters["modelViewMatrix"] = xform.modelView.toGL();
		parameters["modelViewProjectionMatrix"] = this.camera.getModelViewProjectionMatrix(xform.modelView).toGL();
		parameters["normalMatrix"] = this.camera.getNormalMatrixGL(xform.modelView);
		parameters["cameraPosition"] = xform.modelView.inverse().getColumnV3(3);
		
		if (!shader)
		{			
			shader = {};
			shader.program = this.shaderHandler.bindDefaultShader();
			this.shaderHandler.setUniformVariables(shader.program, parameters);
			triCount += shape.draw(shader);
			this.shaderHandler.unbindDefaultShader();
		} else {
			shader.enable(parameters);		
			triCount += shape.draw(shader);
			shader.disable();
		}
		objCount++;
	}
	
	stats.objCount = objCount;
	stats.triCount = triCount;
	
};

/**
 * Render the scene using the picking shader and determine which object, if any, was picked
 * 
 * @param x
 * @param y
 * @param needPickingDraw
 * @return
 */
org.xml3d.webgl.Renderer.prototype.renderPickingPass = function(x, y, needPickingDraw) {
		if (x<0 || y<0 || x>=this.width || y>=this.height)
			return;
		gl = this.handler.gl;
		
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbos.picking.handle);
		
		gl.enable(gl.DEPTH_TEST);
		gl.disable(gl.CULL_FACE);
		gl.disable(gl.BLEND);
		
		this.allObjects = this.opaqueObjects.concat(this.transparentObjects);
		var shader = {};
		
		if (needPickingDraw ) {
			var volumeMax = new XML3DVec3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
			var volumeMin = new XML3DVec3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

			var xform = {};
			xform.view = this.camera.getViewMatrix();
			xform.proj = this.camera.getProjectionMatrix(this.width / this.height);

			for (var i = 0; i < this.opaqueObjects.length; i++) {
				var meshAdapter = this.opaqueObjects[i];
				var trafo = meshAdapter._transform;
				this.adjustMinMax(meshAdapter.bbox, volumeMin, volumeMax, trafo);
			}
			
			this.bbMin = volumeMin;
			this.bbMax = volumeMax;
			
			shader.program = this.shaderMap.picking;
			this.shaderHandler.bindShader(shader.program);
			
			for (j = 0, n = this.allObjects.length; j < n; j++) {
				var obj = this.allObjects[j];
				var transform = obj._transform;
				var shape = obj;
				
				if (obj.isValid == false)
					continue;
				xform.model = transform;
				xform.modelView = this.camera.getModelViewMatrix(xform.model);

				var id = 1.0 - (1+j) / 255.0;

				var parameters = {
						id : id,
						min : volumeMin.toGL(),
						max : volumeMax.toGL(),
						modelMatrix : transform.toGL(),
						modelViewProjectionMatrix : this.camera.getModelViewProjectionMatrix(xform.modelView).toGL(),
						normalMatrix : this.camera.getNormalMatrixGL(xform.modelView)
				};
				
				this.shaderHandler.setUniformVariables(shader.program, parameters);
				shape.draw(shader);
			}
		}
		
		this.readPixels(false, x, y);
		this.shaderHandler.unbindShader(shader.program);
		
		gl.disable(gl.DEPTH_TEST);
		
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

/**
 * Render the picked object using the normal picking shader and return the normal at
 * the point where the object was clicked.
 * 
 * @param pickedObj
 * @param screenX
 * @param screenY
 * @return
 */
org.xml3d.webgl.Renderer.prototype.renderPickedNormals = function(pickedObj, screenX, screenY) {
	gl = this.handler.gl;
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);
	gl.disable(gl.CULL_FACE);
	gl.disable(gl.BLEND);
	
	var transform = pickedObj._transform;
	var shape = pickedObj;
	var sp = this.getStandardShaderProgram(gl, "urn:xml3d:shader:pickedNormals");
	
	var xform = {};
	xform.view = this.camera.getViewMatrix();
	xform.proj = this.camera.getProjectionMatrix(this.width / this.height);
	xform.model = transform;
	xform.modelView = this.camera.getModelViewMatrix(xform.model);
	
	var parameters = {
		modelViewMatrix : transform,
		modelViewProjectionMatrix : this.camera.getModelViewProjectionMatrix(xform.modelView).toGL(),
		normalMatrix : this.camera.getNormalMatrixGL(xform.modelView)
	};

	shader = {};
	shader.sp = sp;
	shape.render(shader, parameters);
	
	this.readPixels(true, screenX, screenY);

	gl.disable(gl.DEPTH_TEST);
};

/**
 * Reads pixels from the screenbuffer to determine picked object or normals.
 * 
 * @param normals
 * 			How the read pixel data will be interpreted.
 * @return
 */
org.xml3d.webgl.Renderer.prototype.readPixels = function(normals, screenX, screenY) {
	////org.xml3d.webgl.checkError(gl, "Before readpixels");
	var data = new Uint8Array(8);
	
	try {
		gl.readPixels(screenX, screenY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
		
		var vec = new XML3DVec3(0, 0, 0);
		vec.x = data[0] / 255;
		vec.y = data[1] / 255;
		vec.z = data[2] / 255;
		
		if(normals) {
			vec = vec.scale(2.0).subtract(new XML3DVec3(1.0));
			this.scene.xml3d.currentPickNormal = vec;
		} else {		
			var objId = 255 - data[3] - 1;
			if (objId >= 0 && data[3] > 0) {
				vec = vec.multiply(this.bbMax.subtract(this.bbMin)).add(this.bbMin);
				this.scene.xml3d.currentPickPos = vec;
				var pickedObj = this.allObjects[objId];
				this.scene.xml3d.currentPickObj = pickedObj;
			} else {
				this.scene.xml3d.currentPickPos = null;
				this.scene.xml3d.currentPickObj = null;	
			}
	}
	} catch(e) {org.xml3d.debug.logError(e);}
	
};

/**
 * Renders a single shader to a fullscreen quad

 * 
 * @param gl
 * @param quadMesh
 *     The fullscreen quad
 * @param shader
 *     The shader to be used for this pass. 
 * @param buffer
 *     The SGLTexture that the previous drawing or post-processing pass rendered to
 * @return
 */
org.xml3d.webgl.Renderer.prototype.renderShader = function(gl, quadMesh, shader, buffer, original) {
	if (!shader || !buffer || !original)
		return;
	
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
	gl.viewport(0, 0, this.width, this.height);	
	gl.disable(gl.CULL_FACE);
	
	var parameters = {};
	var samplers = {};
	var sp;
	
	if (shader === null) {
		sp = this.ppShader.program;
	} else {		
		if (!shader.setParameters) {
			shader = this.factory.getAdapter(shader, org.xml3d.webgl.Renderer.prototype);
		}
		shader.setParameters(parameters);
		if (shader.textures.length > 0) {
			var st = shader.textures;
			for (var i=0; i<st.length; i++) {
				samplers[st[i].name] = st[i].tex;
			}
		}
		sp = shader.shaderProgram;
	}

	samplers.backBuffer = buffer.colorTargets[0];
	samplers.backBufferOrig = original.colorTargets[0];
	sglRenderMeshGLPrimitives(quadMesh, "tristrip", sp, null, parameters, samplers);
};

//Helper to expand an axis aligned bounding box around another object's bounding box
org.xml3d.webgl.Renderer.prototype.adjustMinMax = function(bbox, min, max, trafo) {
	var bmin = bbox.min;
	var bmax = bbox.max;
	var bbmin = trafo.mulVec3(bmin, 1.0);
	var bbmax = trafo.mulVec3(bmax, 1.0);

	if (bbmin.x < min.x)
		min.x = bbmin.x;
	if (bbmin.y < min.y)
		min.y = bbmin.y;
	if (bbmin.z < min.z)
		min.z = bbmin.z;
	if (bbmax.x > max.x)
		max.x = bbmax.x;
	if (bbmax.y > max.y)
		max.y = bbmax.y;
	if (bbmax.z > max.z)
		max.z = bbmax.z;
};

org.xml3d.webgl.Renderer.prototype.bindDefaultShaderProgram = function(gl, name) {
	

};

/**
 * Walks through the drawable objects and destroys each shape and shader
 * @return
 */
org.xml3d.webgl.Renderer.prototype.dispose = function() {
	for ( var i = 0, n = this.drawableObjects.length; i < n; i++) {
		var shape = this.drawableObjects[i][1];
		var shader = this.drawableObjects[i][2];
		shape.dispose();
		if (shader)
			shader.dispose();
	}
};

/**
 * Requests a redraw from the handler
 * @return
 */
org.xml3d.webgl.Renderer.prototype.notifyDataChanged = function() {
	this.handler.redraw("Unspecified data change.");
};


org.xml3d.webgl.XML3DRenderAdapterFactory = function(handler, renderer) {
	org.xml3d.data.AdapterFactory.call(this);
	this.handler = handler;
	this.renderer = renderer;
};
org.xml3d.webgl.XML3DRenderAdapterFactory.prototype = new org.xml3d.data.AdapterFactory();
org.xml3d.webgl.XML3DRenderAdapterFactory.prototype.constructor = org.xml3d.webgl.XML3DRenderAdapterFactory;

org.xml3d.webgl.XML3DRenderAdapterFactory.prototype.getAdapter = function(node) {
	return org.xml3d.data.AdapterFactory.prototype.getAdapter.call(this, node, org.xml3d.webgl.Renderer.prototype);
};

org.xml3d.webgl.XML3DRenderAdapterFactory.prototype.createAdapter = function(
		node) {
	if (node.localName == "xml3d")
		return new org.xml3d.webgl.XML3DCanvasRenderAdapter(this, node);
	if (node.localName == "view")
		return new org.xml3d.webgl.XML3DViewRenderAdapter(this, node);
	if (node.localName == "defs")
		return new org.xml3d.webgl.XML3DDefsRenderAdapter(this, node);
	if (node.localName == "group")
		return new org.xml3d.webgl.XML3DGroupRenderAdapter(this, node);
	if (node.localName == "mesh")
		return new org.xml3d.webgl.XML3DMeshRenderAdapter(this, node);
	if (node.localName == "transform")
		return new org.xml3d.webgl.XML3DTransformRenderAdapter(this, node);
	if (node.localName == "shader")
		return new org.xml3d.webgl.XML3DShaderRenderAdapter(this, node);
	if (node.localName == "texture")
		return new org.xml3d.webgl.XML3DTextureRenderAdapter(this, node);
	if (node.localName == "img")
		return new org.xml3d.webgl.XML3DImgRenderAdapter(this, node);
	if (node.localName == "light")
		return new org.xml3d.webgl.XML3DLightRenderAdapter(this, node);
	if (node.localName == "lightshader")
		return new org.xml3d.webgl.XML3DLightShaderRenderAdapter(this, node);

	if (node.localName == "use") {
		var reference = node.getHref();
		return this.getAdapter(reference);
	}

	return null;
};

org.xml3d.webgl.RenderAdapter = function(factory, node) {
	org.xml3d.data.Adapter.call(this, factory, node);
};
org.xml3d.webgl.RenderAdapter.prototype = new org.xml3d.data.Adapter();
org.xml3d.webgl.RenderAdapter.prototype.constructor = org.xml3d.webgl.RenderAdapter;

org.xml3d.webgl.RenderAdapter.prototype.isAdapterFor = function(protoType) {
	return protoType == org.xml3d.webgl.Renderer.prototype;
};

org.xml3d.webgl.RenderAdapter.prototype.getShader = function() {
	return null;
};

//org.xml3d.webgl.RenderAdapter.prototype.notifyChanged = function(e) {
//	org.xml3d.debug.logWarning("Unhandled change: " + e);
//};

org.xml3d.webgl.RenderAdapter.prototype.collectDrawableObjects = function(
		transform, opaqueObjects, transparentObjects, outLights, parentShader, visible) {
	var adapter = this.factory.getAdapter(this.node, org.xml3d.webgl.Renderer.prototype);
	if (adapter._parentShader !== undefined)
		adapter._parentShader = parentShader;
	
	var child = this.node.firstElementChild;

	while (child !== null) {
			var isVisible = visible;
			var childAdapter = this.factory.getAdapter(child, org.xml3d.webgl.Renderer.prototype);
			if (childAdapter) {
				var childTransform = childAdapter.applyTransformMatrix(transform);
				if (childAdapter.parentTransform !== undefined || childAdapter._parentTransform !== undefined) {
					childAdapter.parentTransform = transform;
				}
				var shader = childAdapter.getShader();
				
				if (!shader)
					shader = parentShader;
				if (adapter.listeners) {
					adapter.listeners.push(childAdapter);
				}
				if (child.getAttribute("visible") == "false")
					isVisible = false;
				childAdapter.collectDrawableObjects(childTransform, opaqueObjects, transparentObjects, outLights, shader, isVisible);
			}
			child = child.nextElementSibling;
		}
};


org.xml3d.webgl.RenderAdapter.prototype.applyTransformMatrix = function(
		transform) {
	return transform;
};


//Adapter for <defs>
org.xml3d.webgl.XML3DDefsRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
};
org.xml3d.webgl.XML3DDefsRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DDefsRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DDefsRenderAdapter;
org.xml3d.webgl.XML3DDefsRenderAdapter.prototype.notifyChanged = function(evt) {
	
};

//Adapter for <img>
org.xml3d.webgl.XML3DImgRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.textureAdapter = factory.getAdapter(node.parentNode, org.xml3d.webgl.Renderer.prototype);
};
org.xml3d.webgl.XML3DImgRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DImgRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DImgRenderAdapter;
org.xml3d.webgl.XML3DImgRenderAdapter.prototype.notifyChanged = function(evt) {
	this.textureAdapter.notifyChanged(evt);
};


// Adapter for <transform>
org.xml3d.webgl.XML3DTransformRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.matrix = null;
	this.listeners = new Array();
	this.isValid = true;
};
org.xml3d.webgl.XML3DTransformRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DTransformRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DTransformRenderAdapter;

org.xml3d.webgl.XML3DTransformRenderAdapter.prototype.getMatrix = function() {
	if (!this.matrix) {
		var n         = this.node;
		//TODO: Port calculation away from SpiderGL
		var t = sglTranslationM4C(n.translation.x, n.translation.y, n.translation.z);
		var c = sglTranslationM4C(n.center.x, n.center.y, n.center.z);
		var nc = sglTranslationM4C(-n.center.x, -n.center.y, -n.center.z);
		var s = sglScalingM4C(n.scale.x, n.scale.y, n.scale.z);
		var r = sglRotationAngleAxisM4V(n.rotation.angle, n.rotation.axis.toGL());
		var so = sglRotationAngleAxisM4V(n.scaleOrientation.angle, n.scaleOrientation.axis.toGL() );
		
		var m = sglMulM4(sglMulM4(sglMulM4(sglMulM4(sglMulM4(t, c), r), so),s), sglInverseM4(so), nc);
		this.matrix = new XML3DMatrix(m);
	}
	return this.matrix;
};

org.xml3d.webgl.XML3DTransformRenderAdapter.prototype.notifyChanged = function(e) {
	this.matrix = null;
	this.matrix = this.getMatrix();
	for (var i=0; i<this.listeners.length; i++) {
		if (this.listeners[i].isValid)
			this.listeners[i].internalNotifyChanged("transform", this.matrix);
		else {
			this.listeners.splice(i,1);
			i--;
		}
	}
	this.factory.renderer.requestRedraw("Transformation changed.");
};
org.xml3d.webgl.XML3DTransformRenderAdapter.prototype.dispose = function() {
	this.isValid = false;
};



// Adapter for <lightshader>
org.xml3d.webgl.XML3DLightShaderRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
};
org.xml3d.webgl.XML3DLightShaderRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DLightShaderRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DLightShaderRenderAdapter;

// Utility functions
org.xml3d.webgl.calculateBoundingBox = function(tArray) {
	var bbox = new XML3DBox();
	
	if (!tArray || tArray.length < 3)
		return bbox;

	// Initialize with first position
	bbox.extend(tArray[0], tArray[1], tArray[2]);

	var val = 0.0;
	for (var i=3; i<tArray.length; i+=3) {
		bbox.extend(new XML3DVec3(tArray[i], tArray[i+1], tArray[i+2]));
	}
	return bbox;
};









// Adapter for <xml3d>
org.xml3d.webgl.XML3DCanvasRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.canvas = factory.handler.canvas;
};
org.xml3d.webgl.XML3DCanvasRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DCanvasRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DCanvasRenderAdapter;

org.xml3d.webgl.XML3DCanvasRenderAdapter.prototype.notifyChanged = function(evt) {
	if (evt.eventType == MutationEvent.ADDITION) {
		this.factory.renderer.sceneTreeAddition(evt);
	} else if (evt.eventType == MutationEvent.REMOVAL) {
		this.factory.renderer.sceneTreeRemoval(evt);
	}
	if (evt.attribute == "activeView") {
		this.factory.renderer.camera = this.factory.renderer.initCamera();
	}
};

org.xml3d.webgl.XML3DCanvasRenderAdapter.prototype.addEventListener = function(type, listener, useCapture) {
	this.factory.handler.addEventListener(this.node, type, listener, useCapture);
};

org.xml3d.webgl.XML3DCanvasRenderAdapter.prototype.removeEventListener = function(type, listener, useCapture) {
	this.factory.handler.removeEventListener(this.node, type, listener, useCapture);
};

org.xml3d.webgl.XML3DCanvasRenderAdapter.prototype.getElementByPoint = function(x, y, hitPoint, hitNormal) {
	var pickY = this.factory.handler.getCanvasHeight() - y - 1; 
		this.factory.handler.renderPick(x, pickY);
		if(hitPoint && this.node.currentPickPos)
		{
			hitPoint.x = this.node.currentPickPos.v[0]; 
			hitPoint.y = this.node.currentPickPos.v[1]; 
			hitPoint.z = this.node.currentPickPos.v[2]; 
		}
		
		if(hitNormal && this.node.currentPickObj)
		{
			this.factory.handler.renderPickedNormals(this.node.currentPickObj, x, pickY);
			hitNormal.x = this.node.currentPickNormal.v[0];
			hitNormal.y = this.node.currentPickNormal.v[1]; 
			hitNormal.z = this.node.currentPickNormal.v[2]; 
		}
		
		if(this.node.currentPickObj !== null)
			return this.node.currentPickObj.node;
		else
			return null; 
};

org.xml3d.webgl.XML3DCanvasRenderAdapter.prototype.generateRay = function(x, y) {
	
	var glY = this.factory.handler.getCanvasHeight() - y - 1; 
	return this.factory.handler.generateRay(x, glY); 		
}; 
// Adapter for <view>
org.xml3d.webgl.XML3DViewRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.zFar = 100000;
	this.zNear = 0.1;
	this.viewMatrix = null;
	this.projMatrix = null;
	this.parentTransform = null;
	this.isValid = true;
};
org.xml3d.webgl.XML3DViewRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DViewRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DViewRenderAdapter;

org.xml3d.webgl.XML3DViewRenderAdapter.prototype.getViewMatrix = function() {

	if (this.viewMatrix == null)
	{
		var negPos      = this.node.position.negate();
		this.viewMatrix = this.node.orientation.negate().toMatrix().multiply(
				new XML3DMatrix().translate(negPos.x, negPos.y, negPos.z));
				
		if (this.parentTransform) {
			this.viewMatrix = this.viewMatrix.multiply(this.parentTransform);		
		}
	}
	return this.viewMatrix;
};


org.xml3d.webgl.XML3DViewRenderAdapter.prototype.getProjectionMatrix = function(aspect) {
	if (this.projMatrix == null) {
		var fovy = this.node.fieldOfView;
		var zfar = this.zFar;
		var znear = this.zNear;
		var f = 1 / Math.tan(fovy / 2);
		this.projMatrix = new XML3DMatrix(f / aspect, 0, 0,
				0, 0, f, 0, 0, 0, 0, (znear + zfar) / (znear - zfar), 2 * znear
						* zfar / (znear - zfar), 0, 0, -1, 0);
	}
	return this.projMatrix;
};

org.xml3d.webgl.XML3DViewRenderAdapter.prototype.getModelViewMatrix = function(model) {
	//TODO: Check matrix multiplication in datatypes... transpose shouldn't be necessary here
	return this.viewMatrix.multiply(model.transpose());
};

org.xml3d.webgl.XML3DViewRenderAdapter.prototype.getNormalMatrixGL = function(modelViewMatrix) {
	var invt = modelViewMatrix.inverse().transpose();
	return invt.to3x3GL();
};

org.xml3d.webgl.XML3DViewRenderAdapter.prototype.getModelViewProjectionMatrix = function(modelViewMatrix) {
	return this.projMatrix.multiply(modelViewMatrix);
};

org.xml3d.webgl.XML3DViewRenderAdapter.prototype.notifyChanged = function(e) {
	if (e.attribute == "orientation" || e.attribute == "position")
		this.viewMatrix = null;
	else if (e.attribute == "fieldOfView")
		this.projMatrix = null;
	else {
		this.viewMatrix = null;
		this.projMatrix = null;
	}
	this.factory.handler.redraw("View changed");
};

org.xml3d.webgl.XML3DViewRenderAdapter.prototype.internalNotifyChanged = function(what, newValue) {
	if (what == "parenttransform") {
		this.parentTransform = newValue;		
		this.viewMatrix = null;
	}
};



// Adapter for <shader>
org.xml3d.webgl.XML3DShaderRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.program = null;
	this.gl = this.factory.handler.gl;
	
	this.renderer = this.factory.renderer;
	this.shaderHandler = this.renderer.shaderHandler;
	
	this.dataAdapter = this.renderer.dataFactory.getAdapter(this.node);
	if(this.dataAdapter)
		this.dataAdapter.registerObserver(this.renderer);
	else
		org.xml3d.debug.logError("Data adapter for a shader element could not be created!");
	
	//Collect textures (if any)
	this.textures = {};
	var dataTable = this.dataAdapter.createDataTable();
	for (var param in dataTable) {
		if (dataTable[param].isTexture) {
			this.textures[param] = {
				adapter : factory.getAdapter(dataTable[param].node, org.xml3d.webgl.Renderer.prototype),
				info	: { texUnit : 0 }
			};		
		} 
	}
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DShaderRenderAdapter;

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.__defineGetter__(
		"shaderProgram", (function() {
		
			if (this.program) 
				return this.program;
			
			//Create the shader program for this node
			var sources = {vs:null, fs:null};
			
			if (this.node.hasAttribute("script"))
			{
				var scriptURL = this.node.getAttribute("script");
				if (new org.xml3d.URI(scriptURL).scheme == "urn") {
					//Internal shader
					this.getStandardShaderSource(scriptURL, sources);
					this.program = this.createShaderProgram(sources);
					this.gl.useProgram(this.program.handle);
					this.shaderHandler.setStandardUniforms(this.program);
				} else {
					//User-provided shader
					var vsScript = this.node.xml3ddocument.resolve(scriptURL
							+ "-vs");
					var fsScript = this.node.xml3ddocument.resolve(scriptURL
							+ "-fs");
					if (vsScript && fsScript) {
						sources.vs = vsScript.textContent;
						sources.fs = fsScript.textContent;
					}
					
					this.program = this.createShaderProgram(sources);
				}
			} else {	
				this.program = this.createShaderProgram(sources);
			}
			
			for (var name in this.program.samplers) {
				var texInfo = this.program.samplers[name];
				if (texInfo && this.textures[name]) {
					this.textures[name].info = texInfo;
				}
			}
			
			return this.program;

}));

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.notifyChanged = function(evt) {
	if (evt.attribute == "script" && this.program) {
		this.destroy();
		
		//All uniforms need to be dirtied to make sure they're set in the new shader program
		var dataTable = this.dataAdapter.createDataTable();		
		for (var uniform in dataTable) {
			var u = dataTable[uniform];
			if (u.clean)
				u.clean = false;
		}	
	}
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.isEmpty = function(obj) {
	for (var p in obj) {
		return false;
	}
	return true;
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.getStandardShaderSource = function(scriptURL, sources) {
	//Need to check for textures to decide which internal shader to use
	var vertexColors = false;
	var dataTable = this.dataAdapter.createDataTable();	

	if (scriptURL == "urn:xml3d:shader:phong" && !this.isEmpty(this.textures))
		scriptURL = "urn:xml3d:shader:texturedphong";
	
	if (dataTable.useVertexColor && dataTable.useVertexColor.data[0] == true)
		scriptURL += "vcolor";
	
	if (scriptURL == "urn:xml3d:shader:phong" || scriptURL == "urn:xml3d:shader:phongvcolor" || scriptURL == "urn:xml3d:shader:texturedphong")
	{
		// Workaround for lack of dynamic loops on ATI cards below the HD 5000 line
		var sfrag = g_shaders[scriptURL].fragment;
		var tail = sfrag.substring(68, sfrag.length);
		var maxLights = "#ifdef GL_ES\nprecision highp float;\n" +
				"#endif\n\n const int MAXLIGHTS = "+ this.renderer.lights.length.toString() + ";\n";

		var frag = maxLights + tail;
		
		sources.vs = g_shaders[scriptURL].vertex;
		sources.fs = frag;
	} 
	else if (g_shaders[scriptURL]) {
		sources.vs = g_shaders[scriptURL].vertex;
		sources.fs = g_shaders[scriptURL].fragment;
	}
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.createShaderProgram = function(sources) {
	return this.shaderHandler.createShaderFromSources(sources);
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.bindProgram = function() {	
	this.gl.useProgram(this.shaderProgram.handle);
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.destroy = function() {
	if (this.shaderProgram)
		this.gl.deleteProgram(this.shaderProgram.handle);
	
	this.program = null;
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.dispose = function() {
	Array.forEach(this.textures, function(t) {
		t.adapter.destroy();
	});
	this.destroy();
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.enable = function(globalUniforms) {
	this.bindProgram();	
	this.setUniformVariables(globalUniforms);
	this.bindSamplers();
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.disable = function() {
	this.unbindSamplers();
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.setUniformVariables = function(globalUniforms) {
	var dataTable = this.dataAdapter.createDataTable();
	var sp = this.shaderProgram;
	var gl = this.gl;
	
	//Set shader-specific uniforms
	for (var uniform in dataTable) {
		var u = dataTable[uniform];	
		if (u.clean === true)
			continue;
		
		if (u.isTexture) {
			//Have to check for existence of uniforms in the shader, since the user is allowed to give 
			//unused parameters
			if (sp.samplers[uniform])
				this.shaderHandler.setUniform(gl, sp.samplers[uniform], this.textures[uniform].info.texUnit);
		} 
		else if (sp.uniforms[uniform]) {
			var data = u.data.length == 1 ? u.data[0] : u.data;
			this.shaderHandler.setUniform(gl, sp.uniforms[uniform], data);
		}
		
		this.dataAdapter.dataTable[uniform].clean = true;
	}
	
	//Set global uniforms (lights, space conversion matrices)
	for (var uniform in globalUniforms) {
		var uValue = globalUniforms[uniform];
		
		if (sp.uniforms[uniform]) {
			this.shaderHandler.setUniform(gl, sp.uniforms[uniform], uValue);
		}
	}
	
};


org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.bindSamplers = function() {	
	for (var name in this.textures) {
		var tex = this.textures[name];
		tex.adapter.bind(tex.info.texUnit);		
	}
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.unbindSamplers = function() {
	for (var name in this.textures) {
		var tex = this.textures[name];
		tex.adapter.unbind(tex.info.texUnit);
	}
};


org.xml3d.webgl.XML3DCreateTex2DFromData = function(gl, internalFormat, width, height, 
		sourceFormat, sourceType, texels, opt) {
	
	var info = {};
	if (!texels) {
		if (sourceType == gl.FLOAT) {
			texels = new Float32Array(width * height * 4);
		}
		else {
			texels = new Uint8Array(width * height * 4);
		}
	}
	
	var handle = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, handle);
	
	//gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, opt.wrapS);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, opt.wrapT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, opt.minFilter);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, opt.magFilter);
	
	gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, sourceFormat, sourceType, texels);
	
	if (opt.isDepth) {
		gl.texParameteri(gl.TEXTURE_2D, gl.DEPTH_TEXTURE_MODE,   opt.depthMode);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, opt.depthCompareMode);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, opt.depthCompareFunc);
	}
	if (opt.generateMipmap) {
		gl.generateMipmap(gl.TEXTURE_2D);
	}
	
	gl.bindTexture(gl.TEXTURE_2D, null);
	
	info.handle = handle;
	info.options = opt;
	info.valid = true;
	info.glType = gl.TEXTURE_2D;
	info.format = internalFormat;	
	
	return info;
};

org.xml3d.webgl.XML3DCreateTex2DFromImage = function(gl, handle, image, opt) {
	var info = {};
	gl.bindTexture(gl.TEXTURE_2D, handle);
	
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
	
	info.handle = handle;
	info.options = opt;
	info.valid = true;
	info.glType = gl.TEXTURE_2D;
	info.format = gl.RGBA;	
	
	return info;	
};

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
			minFilter 		 : dataTable[name].options.minFilter,
			magFilter		 : dataTable[name].options.magFilter,
			wrapS			 : dataTable[name].options.wrapS,
			wrapT			 : dataTable[name].options.wrapT,
			generateMipmap	 : dataTable[name].options.generateMipmap,
			flipY            : true,
			premultiplyAlpha : true	
	};
	
	//Create texture handle
	var texture = gl.createTexture();
	var info = { valid : false };
	var loaded = this.factory.handler.redraw;
	
	//Load texture img(s)
	var image = new Image();
	var texAdapter = this;
	image.onload = function() {
		
		texAdapter.info = org.xml3d.webgl.XML3DCreateTex2DFromImage(gl, texture, image, opt);
		
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


org.xml3d.webgl.XML3DMeshRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.gl = this.factory.handler.gl;
	this.isValid = false;
	this.meshIsValid = false;
	this._bbox = null;
	
	this.dataAdapter = factory.renderer.dataFactory.getAdapter(this.node);
	
	this.dataType = node.getAttribute("type");
	if (!this.dataType)
		this.dataType = "triangles";
	this.dataType = this.dataType.toLowerCase();
	
	this.mesh = this.initMeshGL();
	
	this.__defineGetter__("bbox", function() {
		return this._bbox;
	});
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DMeshRenderAdapter;

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.collectDrawableObjects = function(
		transform, opaqueObjects, transparenObjects, outLights, shader, visible) {
	if (this.isValid && this.meshIsValid) {
		this._transform = transform;
		this._shader = shader;
		
		if (!shader || !shader.hasTransparency)
			opaqueObjects.push( this );
		else
			transparentObjects.push( this );
			
		
		this._visible = visible;
	}
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.getGLTypeFromString = function(gl, typeName) {
	switch (typeName) {
		case "triangles"	: return gl.TRIANGLES;
		case "tristrips" 	: return gl.TRIANGLE_STRIP;
		case "points"		: return gl.POINTS;
		case "lines"		: return gl.LINES;
		case "linestrips"	: return gl.LINE_STRIP;
		default				: return gl.TRIANGLES;
	}
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.getGLTypeFromArray = function(gl, array) {
	if (array instanceof Int8Array   ) return gl.BYTE;
	if (array instanceof Uint8Array  ) return gl.UNSIGNED_BYTE;
	if (array instanceof Int16Array  ) return gl.SHORT;
	if (array instanceof Uint16Array ) return gl.UNSIGNED_SHORT;
	if (array instanceof Int32Array  ) return gl.INT;
	if (array instanceof Uint32Array ) return gl.UNSIGNED_INT;
	if (array instanceof Float32Array) return gl.FLOAT;
	return gl.FLOAT;
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.initMeshGL = function() {
	var meshInfo = {};
	meshInfo.vbos = {};
	var gl = this.gl;
	meshInfo.glType = this.getGLTypeFromString(gl, this.dataType);
	
	var dataTable = this.dataAdapter.createDataTable();
	
	if (dataTable.index) {
		//indexed primitives
		var mIndices = new Uint16Array(dataTable.index.data);
		var indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mIndices, gl.STATIC_DRAW);
		
		indexBuffer.length = mIndices.length;
		indexBuffer.tupleSize = dataTable.index.tupleSize;
		indexBuffer.glType = this.getGLTypeFromArray(gl, mIndices);
		
		meshInfo.vbos.index = indexBuffer;
		meshInfo.isIndexed = true;		
	} else {
		//?
		meshInfo.isIndexed = false;
	}

	for (var attr in dataTable) {
		var a = dataTable[attr];
		
		if(a.isXflow || attr == "xflowShader" || attr == "index")
			continue;
		
		var attrBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, attrBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, a.data, gl.STATIC_DRAW);
		
		attrBuffer.length = a.data.length;
		attrBuffer.tupleSize = a.tupleSize;
		attrBuffer.glType = this.getGLTypeFromArray(gl, a.data);
		
		meshInfo.vbos[attr] = attrBuffer;
	}

	this._bbox = org.xml3d.webgl.calculateBoundingBox(dataTable.position.data);
	
	this.meshIsValid = true;
	this.isValid = true;
	return meshInfo;
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.notifyChanged = function(e) {
	if (e.eventType == MutationEvent.REMOVAL) 
		this.factory.renderer.sceneTreeRemoval(e);	
	else if (e.attribute == "src") {
		this.dispose();
		this.mesh = this.initMeshGL();
	}
	else if (e.attribute == "visible")
		this._visible = e.newValue;

	this.factory.renderer.requestRedraw("Mesh attribute was changed.");
	
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.notifyDataChanged = function(e) {
	this.factory.renderer.requestRedraw("Mesh data has changed");
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.internalNotifyChanged = function(what, newValue) {
	if (what == "transform" || what == "parenttransform")
		this._transform = newValue;
	else if (what == "shader")
		this._shader = newValue;
	else if (what == "visible")
		this._visible = newValue;
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.evalOnclick = function(evtMethod) {
	if (evtMethod) {
		eval(evtMethod);
	}
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.draw = function(shader) {
	var sAttributes = shader.program.attributes;
	var gl = this.gl;
	var triCount = 0;
	
//Bind vertex buffers
	for (var name in this.mesh.vbos) {
		var shaderAttribute = sAttributes[name];
		if (!shaderAttribute)
			continue;
		
		var vbo = this.mesh.vbos[name];

		gl.enableVertexAttribArray(shaderAttribute.location);		
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.vertexAttribPointer(shaderAttribute.location, vbo.tupleSize, vbo.glType, false, 0, 0);
	}
	
//Draw the object
	if (this.mesh.isIndexed) {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.vbos.index);
		gl.drawElements(this.mesh.glType, this.mesh.vbos.index.length, gl.UNSIGNED_SHORT, 0);
		triCount = this.mesh.vbos.index.length / 3;
	} else {
		gl.drawArrays(this.mesh.glType, 0, this.mesh.vbos.position.length);
		triCount = this.mesh.vbos.position.length / 3;
	}
	
//Unbind vertex buffers
	for (var name in this.mesh.vbos) {
		var shaderAttribute = sAttributes[name];
		if (!shaderAttribute)
			continue;
		gl.disableVertexAttribArray(shaderAttribute.location);
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	
	return triCount;
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.dispose = function() {
	for (var vbo in this.mesh.vbos) {
		var buffer = this.mesh.vbos[vbo];
		this.gl.deleteBuffer(buffer);
	}	
	this.isValid = false;
	this.mesh.vbos = {};
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.getBoundingBox = function() {
	var min = new XML3DVec3(this._bbox.min[0], this._bbox.min[1], this._bbox.min[2]);
	var max = new XML3DVec3(this._bbox.max[0], this._bbox.max[1], this._bbox.max[2]);
	
	return new XML3DBox(min, max); 
};

// Adapter for <group>
org.xml3d.webgl.XML3DGroupRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.listeners = new Array();
	this.parentTransform = null;
	this._parentShader = null;
	this.isValid = true;
	this._transformAdapter = this.factory.getAdapter(this.node.getTransformNode(), org.xml3d.webgl.Renderer.prototype);
	if (this._transformAdapter)
		this._transformAdapter.listeners.push(this);
};
org.xml3d.webgl.XML3DGroupRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DGroupRenderAdapter;
org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.applyTransformMatrix = function(
		transform) {
	if (this.parentTransform !== null)
		return this.parentTransform.multiply(transform);
	
	if (this._transformAdapter)
		return this._transformAdapter.getMatrix().multiply(transform);
	
	return transform;
};

org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.evalOnclick = function(evtMethod) {
	if (evtMethod)
		eval(evtMethod);
};

org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.notifyChanged = function(evt) {
	var downstreamValue = null;
	if (evt.eventType == MutationEvent.ADDITION)
		this.factory.renderer.sceneTreeAddition(evt); 
	else if (evt.eventType == MutationEvent.REMOVAL) {
		this.factory.renderer.sceneTreeRemoval(evt);
	}
	else if (evt.attribute == "shader") {
		//Update this group node's shader then propagate the change down to its children
		this.shader = this.getShader();
		if (this.shader == null)
			downstreamValue = this._parentShader;
		else
			downstreamValue = this.shader;
		this.notifyListeners(evt.attribute, downstreamValue);
		
		this.factory.renderer.requestRedraw("Group shader changed.", false);
	}
	else if (evt.attribute == "transform") {
		//This group is now linked to a different transform node. We need to notify all 
		//of its children with the new transformation matrix
		
		var adapter = this.factory.getAdapter(this.node.getTransformNode(), org.xml3d.webgl.Renderer.prototype);
		downstreamValue = adapter.getMatrix().multiply(this.parentTransform);
		this.notifyListeners("parenttransform", downstreamValue);
		this.factory.renderer.requestRedraw("Group transform changed.");
	}
	else if (evt.attribute == "visible") {		
		this.notifyListeners("visible", evt.newValue);
		this.factory.renderer.requestRedraw("Group visibility changed.");
	}
};

/**
 * Notify this node that changes were made to its parent, then propagate these changes further down
 * to its children. The changes will eventually end at the 'leaf' nodes, which are normally meshes.
 * 
 * @param what
 * @param newValue
 * @return
 */
org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.internalNotifyChanged = function(what, newValue) {
	var downstreamValue = null;
	
	if (what == "parenttransform") {
		//This change came from a parent group node, we need to update the parentTransform and pass
		//the updated transformation matrix down to the children
		this.parentTransform = newValue;
		var adapter = this.factory.getAdapter(this.node.getTransformNode(), org.xml3d.webgl.Renderer.prototype);
		if (adapter)
			downstreamValue = adapter.getMatrix().multiply(this.parentTransform);
		else
			downstreamValue = this.parentTransform;
		
	} else if (what == "transform") {
		//This was a change to the <transform> node tied to this adapter
		if (this.parentTransform)
			downstreamValue = newValue.multiply(this.parentTransform);	
		else
			downstreamValue = newValue;
		what = "parenttransform";
		
	} else if (what == "shader") {
		this._parentShader = newValue;
		if (this.shader)
			return; //this group node's shader overrides the parent shader for all its children, so we're done
	} else if (what == "visible") {
		downstreamValue = newValue;
	}
	
	this.notifyListeners(what, downstreamValue);
};

org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.notifyListeners = function(what, newValue) {
	for (var i=0; i<this.listeners.length; i++) {
			if (this.listeners[i].isValid)
				this.listeners[i].internalNotifyChanged(what, newValue);
			else {
				this.listeners.splice(i, 1);
				i--;
			}
		}
};


org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.getShader = function()
{
	var shader = this.node.getShaderNode();

	// if no shader attribute is specified, try to get a shader from the style attribute
	if(shader == null)
	{
		var styleValue = this.node.getAttribute('style');
		if(!styleValue)
			return null;
		var pattern    = /shader\s*:\s*url\s*\(\s*(\S+)\s*\)/i;
		var result = pattern.exec(styleValue);
		if (result)
			shader = this.node.xml3ddocument.resolve(result[1]);
	}

	return this.factory.getAdapter(shader, org.xml3d.webgl.Renderer.prototype);
};

org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.dispose = function() {
	for (var child in this.node.childNodes) {
		var adapter = this.factory.getAdapter(this.node.childNodes[child], org.xml3d.webgl.Renderer.prototype);
		if (adapter)
			adapter.dispose();
	}
	this.isValid = false;
};


// Adapter for <light>
org.xml3d.webgl.XML3DLightRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.position = null;
	this.intensity = null;
	
	var intensityAttribute = node.getAttribute("intensity");
	if (intensityAttribute) {
		try {
			var flt = parseFloat(intensityAttribute);
			this.intensity = flt;
		} catch (e) {org.xml3d.debug.logWarning("Could not parse light intensity attribute ' "+intensityAttribute+" '"); }
	}
	
	this._visible = null;
	this.isValid = true;
};
org.xml3d.webgl.XML3DLightRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DLightRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DLightRenderAdapter;

org.xml3d.webgl.XML3DLightRenderAdapter.prototype.collectDrawableObjects = function(
		transform, opaqueObjects, transparentObjects, outLights, shader, visible) {
	outLights.push( [ transform, this ]);
	this._transform = transform;
	this._visible = visible;
};

org.xml3d.webgl.XML3DLightRenderAdapter.prototype.notifyChanged = function(e) {
	if (e.attribute == "visible")
		this._visible = e.newValue;
	else if (e.attribute == "intensity") {
		if (!isNaN(e.newValue))
			this.intensity = e.newValue;
		else
			org.xml3d.debug.logError("Invalid parameter for light intensity attribute: NaN");
	}
	
	this.factory.handler.redraw("Light attribute changed.");	
};

org.xml3d.webgl.XML3DLightRenderAdapter.prototype.internalNotifyChanged = function(what, newValue) {
	if (what == "transform" || what == "parenttransform")
		this._transform = newValue;
	else if (what == "visible")
		this._visible = newValue;
};

org.xml3d.webgl.XML3DLightRenderAdapter.prototype.getParameters = function(modelViewMatrix) {
	var shader = this.getLightShader();

	if(!shader)
		return null;
	
	if (this._transform)
		modelViewMatrix = modelViewMatrix.multiply(this._transform.transpose());
	if (!this.dataAdapter)
	{
		var renderer = shader.factory.renderer;
		this.dataAdapter = renderer.dataFactory.getAdapter(shader.node);
		if(this.dataAdapter)
			this.dataAdapter.registerObserver(renderer);
	}
	var params = this.dataAdapter.createDataTable();

	if (this._visible)
		var visibility = [1.0, 1.0, 1.0];
	else
		var visibility = [0.0, 0.0, 0.0];


	//Set up default values
	var pos = modelViewMatrix.multiply(new XML3DRotation(0.0, 0.0, 0.0, 1.0)).toGL();
	var aParams = {
		position 	: [pos[0]/pos[3], pos[1]/pos[3], pos[2]/pos[3]],
		attenuation : [0.0, 0.0, 1.0],
		intensity 	: [1.0, 1.0, 1.0],
		visibility 	: visibility
	};

	for (var p in params) {
		if (p == "position") {
			//Position must be multiplied with the model view matrix
			var t = [params[p].data[0], params[p].data[1],params[p].data[2], 1.0];
			t = modelViewMatrix.multiply(new XML3DRotation(t)).toGL();
			aParams[p] = [t[0]/t[3], t[1]/t[3], t[2]/t[3]];
			continue;
		}
		aParams[p] = params[p].data;
	}
	
	if (this.intensity !== null) {
		var i = aParams.intensity;
		aParams.intensity = [i[0]*this.intensity, i[1]*this.intensity, i[2]*this.intensity];
	}
	
	return aParams;
};

org.xml3d.webgl.XML3DLightRenderAdapter.prototype.getLightShader = function() {
	if (!this.lightShader) {
		var shader = this.node.getShaderNode();
		// if no shader attribute is specified, try to get a shader from the style attribute
		if(shader == null)
		{
			var styleValue = this.node.getAttribute('style');
			if(!styleValue)
				return null;
			var pattern    = /shader\s*:\s*url\s*\(\s*(\S+)\s*\)/i;
			var result = pattern.exec(styleValue);
			if (result)
				shader = this.node.xml3ddocument.resolve(result[1]);
		}
		this.lightShader = this.factory.getAdapter(shader, org.xml3d.webgl.Renderer.prototype);
	}
	return this.lightShader;
};
org.xml3d.webgl.XML3DLightRenderAdapter.prototype.dispose = function() {
	this.isValid = false;
};


/********************************** Start of the DataCollector Implementation *************************************************/

/*-----------------------------------------------------------------------
 * XML3D Data Composition Rules:
 * -----------------------------
 *
 * The elements <mesh>, <data>, <shader>, <lightshader> and any other elements that uses generic
 * data fields implements the behavior of a "DataCollector".
 *
 * The result of a DataCollector is a "datatable" - a map with "name" as key and a TypedArray
 * (https://cvs.khronos.org/svn/repos/registry/trunk/public/webgl/doc/spec/TypedArray-spec.html)
 * as value.
 *
 * The <data> element is the only DataCollector that forwards the data to parent nodes or referring nodes.
 *
 * For each DataCollector, data is collected with following algorithm:
 *
 * 1. If the "src" attribute is used, reuse the datatable of the referred <data> element and ignore the element's content
 * 2. If no "src" attribute is defined:
 *    2.1 Go through each <data> element contained by the DataCollector from top to down and apply it's datatable to the result.
 *        2.1.1 If the datatables of consecutive <data> elements define a value for the same name, the later overwrites the former.
 *    2.2 Go through each value element (int, float1, float2 etc.) and assign it's name-value pair to the datatable, overwriting
 *        existing entries.
 *
 *
 * Description of the actual Implementation:
 * -----------------------------------------
 * The DataCollector is implementation according to the Adapter concept. For each element that uses
 * generic data (<mesh>, <data>, <float>,...) a DataAdapter is instantiated. Such a DataAdapter should
 * be constructed via the "XML3DDataAdapterFactory" factory. The XML3DDataAdapterFactory manages all
 * DataAdapter instances so that for each node there is always just one DataAdapter. It is also responsible
 * for creating the corresponding DataAdapter for an element node. In addition, when a DataAdapter is constructed
 * via the factory, its init method is called which ensures that all child elements have a corresponding DataAdapter.
 * In doing so, the parent DataAdapter registers itself as observer in its child DataAdapters. When a DataCollector
 * element changes, all its observers are notified (those are generally its parent DataAdapter or other components
 * such as a renderer relying on the data of the observed element).
 */

//---------------------------------------------------------------------------------------------------------------------------

/**
 * Class org.xml3d.webgl.XML3DDataAdapterFactory
 * extends: org.xml3d.data.AdapterFactory
 *
 * XML3DDataAdapterFactory creates DataAdapter instances for elements using generic data (<mesh>, <data>, <float>,...).
 * Additionally, it manages all DataAdapter instances so that for each node there is always just one DataAdapter. When
 * it creates a DataAdapter, it calls its init method. Currently, the following elements are supported:
 *
 * <ul>
 * 		<li>mesh</li>
 * 		<li>shader</li>
 * 		<li>lightshader</li>
 * 		<li>float</li>
 * 		<li>float2</li>
 * 		<li>float3</li>
 * 		<li>float4</li>
 * 		<li>int</li>
 * 		<li>bool</li>
 * 		<li>texture</li>
 * 		<li>data</li>
 * </ul>
 *
 * @author Kristian Sons
 * @author Benjamin Friedrich
 *
 * @version  10/2010  1.0
 */

/**
 * Constructor of org.xml3d.webgl.XML3DDataAdapterFactory
 *
 * @augments org.xml3d.data.AdapterFactory
 * @constructor
 *
 * @param handler
 */
org.xml3d.webgl.XML3DDataAdapterFactory = function(handler)
{
	org.xml3d.data.AdapterFactory.call(this);
	this.handler = handler;
};
org.xml3d.webgl.XML3DDataAdapterFactory.prototype             = new org.xml3d.data.AdapterFactory();
org.xml3d.webgl.XML3DDataAdapterFactory.prototype.constructor = org.xml3d.webgl.XML3DDataAdapterFactory;

/**
 * Returns a DataAdapter instance associated with the given node. If there is already a DataAdapter created for this node,
 * this instance is returned, otherwise a new one is created.
 *
 * @param   node  element node which uses generic data. The supported elements are listed in the class description above.
 * @returns DataAdapter instance
 */
org.xml3d.webgl.XML3DDataAdapterFactory.prototype.getAdapter = function(node)
{
	return org.xml3d.data.AdapterFactory.prototype.getAdapter.call(this, node, org.xml3d.webgl.XML3DDataAdapterFactory.prototype);
};

/**
 * Creates a DataAdapter associated with the given node.
 *
 * @param   node  element node which uses generic data. The supported elements are listed in the class description above.
 * @returns DataAdapter instance
 */
org.xml3d.webgl.XML3DDataAdapterFactory.prototype.createAdapter = function(node)
{
	if (node.localName == "mesh"   ||
		node.localName == "shader" ||
		node.localName == "lightshader" )
	{
		return new org.xml3d.webgl.RootDataAdapter(this, node);
	}

	if (node.localName == "float"    ||
		node.localName == "float2"   ||
		node.localName == "float3"   ||
		node.localName == "float4"   ||
		node.localName == "float4x4" ||
		node.localName == "int"      ||
		node.localName == "bool"     )
	{
		return new org.xml3d.webgl.ValueDataAdapter(this, node);
	}
	
	if (node.localName == "img")
		return new org.xml3d.webgl.ImgDataAdapter(this, node);

	if (node.localName == "texture")
	{
		return new org.xml3d.webgl.TextureDataAdapter(this, node);
	}
			
	if (node.localName == "data")
	{
		return new org.xml3d.webgl.DataAdapter(this, node);
	}

	//org.xml3d.debug.logError("org.xml3d.webgl.XML3DDataAdapterFactory.prototype.createAdapter: " +
	//		                 node.localName + " is not supported");
	return null;
};

//---------------------------------------------------------------------------------------------------------------------------

/**
 * Class org.xml3d.webgl.DataAdapter
 * extends: org.xml3d.data.Adapter
 *
 * The DataAdapter implements the DataCollector concept and serves as basis of all DataAdapter classes.
 * In general, a DataAdapter is associated with an element node which uses generic data and should be
 * instantiated via org.xml3d.webgl.XML3DDataAdapterFactory to ensure proper functionality.
 *
 * @author Kristian Sons
 * @author Benjamin Friedrich
 *
 * @version  10/2010  1.0
 */

/**
 * Constructor of org.xml3d.webgl.DataAdapter
 *
 * @augments org.xml3d.data.Adapter
 * @constructor
 *
 * @param factory
 * @param node
 */
org.xml3d.webgl.DataAdapter = function(factory, node)
{
	org.xml3d.data.Adapter.call(this, factory, node);

	this.observers = new Array();

	/* Creates DataAdapter instances for the node's children and registers
	 * itself as observer in those children instances. This approach is needed
	 * for being notified about changes in the child elements. If the data of
	 * a children is changed, the whole parent element must be considered as
	 * changed.
	 */
	this.init = function()
	{
		var child = this.node.firstElementChild;
		while (child !== null)
		{			
			var dataCollector = this.factory.getAdapter(child, org.xml3d.webgl.XML3DDataAdapterFactory.prototype);

			if(dataCollector)
			{
				dataCollector.registerObserver(this);
			}
			
			child = child.nextElementSibling;
		}
		
		if (this.node.getSrcNode) {
			var srcElement = this.node.getSrcNode();
			if (srcElement) {
				dataCollector = this.factory.getAdapter(srcElement, org.xml3d.webgl.XML3DDataAdapterFactory.prototype);
				if (dataCollector)
					dataCollector.registerObserver(this);
			}
		}

		this.createDataTable(true);	
		
	};

};
org.xml3d.webgl.DataAdapter.prototype             = new org.xml3d.data.Adapter();
org.xml3d.webgl.DataAdapter.prototype.constructor = org.xml3d.webgl.DataAdapter;

/**
 *
 * @param aType
 * @returns
 */
org.xml3d.webgl.DataAdapter.prototype.isAdapterFor = function(aType)
{
	return aType == org.xml3d.webgl.XML3DDataAdapterFactory.prototype;
};

/**
 * Notifies all observers about data changes by calling their notifyDataChanged() method.
 */
org.xml3d.webgl.DataAdapter.prototype.notifyObservers = function(e)
{
	for(var i = 0; i < this.observers.length; i++)
	{
		this.observers[i].notifyDataChanged(e);
	}
};

/**
 * The notifyChanged() method is called by the XML3D data structure to notify the DataAdapter about
 * data changes (DOM mustation events) in its associating node. When this method is called, all observers
 * of the DataAdapter are notified about data changes via their notifyDataChanged() method.
 *
 * @param e  notification of type org.xml3d.Notification
 */
org.xml3d.webgl.DataAdapter.prototype.notifyChanged = function(e)
{
	// this is the DataAdapter where an actual change occurs, therefore
	// the dataTable must be recreated
	this.notifyDataChanged(e);
};

/**
 * Is called when the observed DataAdapter has changed. This basic implementation
 * recreates its data table and notifies all its observers about changes. The recreation
 * of the data table is necessary as the notification usually comes from a child DataAdapter.
 * This means when a child element changes, its parent changes simultaneously.
 */
org.xml3d.webgl.DataAdapter.prototype.notifyDataChanged = function(e)
{
	// Notification can only come from a child DataAdapter. That's why dataTable
	// can be merged with this instance's datatable
	this.createDataTable(true);
	this.notifyObservers(e);
};

/**
 * Registers an observer which is notified when the element node associated with the
 * data adapter changes. If the given object is already registered as observer, it
 * is ignored.
 *
 * <b>Note that there must be a notifyDataChanged() method without parameters.</b>
 *
 * @param observer
 * 			object which shall be notified when the node associated with the
 * 			DataAdapter changes
 */
org.xml3d.webgl.DataAdapter.prototype.registerObserver = function(observer)
{
	for(var i = 0; i < this.observers.length; i++)
	{
		if(this.observers[i] == observer)
		{
			org.xml3d.debug.logWarning("Observer " + observer + " is already registered");
			return;
		}
	}

	this.observers.push(observer);
};

/**
 * Unregisters the given observer. If the given object is not registered as observer, it is irgnored.
 *
 * @param observer
 * 			which shall be unregistered
 */
org.xml3d.webgl.DataAdapter.prototype.unregisterObserver = function(observer)
{
	for(var i = 0; i < this.observers.length; i++)
	{
		if(this.observers[i] == observer)
		{
			this.observers = this.observers.splice(i, 1);
			return;
		}
	}

	org.xml3d.debug.logWarning("Observer " + observer +
			                   " can not be unregistered because it is not registered");
};

/**
 * Returns datatable retrieved from the DataAdapter's children.
 * In doing so, only the cached datatables are fetched since
 * the value of the changed child should already be adapted
 * and the values of the remaining children do not vary.
 *
 * @returns datatable retrieved from the DataAdapter's children
 */
org.xml3d.webgl.DataAdapter.prototype.getDataFromChildren = function()
{
	var dataTable = new Array();

	var child = this.node.firstElementChild;
	while (child !== null)
	{
		//var childNode = this.node.childNodes[i];

		var dataCollector = this.factory.getAdapter(child, org.xml3d.webgl.XML3DDataAdapterFactory.prototype);
		
		if(! dataCollector) // This can happen, i.e. a child node in a seperate namespace
			continue;

		/* A RootAdapter must not be a chilrden of another DataAdapter.
		 * Therefore, its data is ignored, if it is specified as child.
		 * Example: <mesh>, <shader> and <lightshader> */
		if(dataCollector.isRootAdapter())
		{
			org.xml3d.debug.logWarning(child.localName +
					                   " can not be a children of another DataCollector element ==> ignored");
			continue;
		}
		var tmpDataTable = dataCollector.createDataTable();
		if(tmpDataTable)
		{
			for (key in tmpDataTable)
			{
				dataTable[key] = tmpDataTable[key];
			}
		}
		
		child = child.nextElementSibling;
	}

	return dataTable;
};

/**
 * Creates datatable. If the parameter 'forceNewInstance' is specified with 'true',
 * createDataTable() creates a new datatable, caches and returns it. If no
 * parameter is specified or 'forceNewInstance' is specified with 'false', the
 * cashed datatable is returned.<br/>
 * Each datatable has the following format:<br/>
 * <br/>
 * datatable['name']['tupleSize'] : tuple size of the data element with name 'name' <br/>
 * datatable['name']['data']      : typed array (https://cvs.khronos.org/svn/repos/registry/trunk/public/webgl/doc/spec/TypedArray-spec.html)
 * 								  associated with the data element with name 'name'
 *
 * @param   forceNewInstance
 * 				indicates whether a new instance shall be created or the cached
 * 				datatable shall be returned
 * @returns datatable
 */
org.xml3d.webgl.DataAdapter.prototype.createDataTable = function(forceNewInstance)
{
	if(forceNewInstance == undefined ? true : ! forceNewInstance)
	{
	   return this.dataTable;
	}

	var srcElement = this.node.getSrcNode();
	var dataTable;
	
	if(srcElement == null)
	{
		dataTable = this.getDataFromChildren();
	}
	else
	{
		// If the "src" attribute is used, reuse the datatable of the referred <data> element (or file)
		// and ignore the element's content
		srcElement = this.factory.getAdapter(srcElement, org.xml3d.webgl.XML3DDataAdapterFactory.prototype);
		dataTable  = srcElement.createDataTable();
	}	
	
	//Check for xflow scripts
	if (this.node.localName == "data") {
		var script = this.node.getScriptNode();
		if(script) {	
			var type = script.value.toLowerCase();
			if (org.xml3d.xflow[type]) {
				org.xml3d.xflow[type](dataTable);			
			}
			else
				org.xml3d.debug.logError("Unknown XFlow script '"+script.value+"'.");

		}
	}
	
	this.dataTable = dataTable;

	return dataTable;
};

/**
 * Indicates whether this DataAdapter is a RootAdapter (has no parent DataAdapter).
 *
 * @returns true if this DataAdapter is a RootAdapter, otherwise false.
 */
org.xml3d.webgl.DataAdapter.prototype.isRootAdapter = function()
{
	return false;
};

/**
 * Returns String representation of this DataAdapter
 */
org.xml3d.webgl.DataAdapter.prototype.toString = function()
{
	return "org.xml3d.webgl.DataAdapter";
};

//---------------------------------------------------------------------------------------------------------------------------

/**
 * Class org.xml3d.webgl.ValueDataAdapter
 * extends: org.xml3d.webgl.DataAdapter
 *
 * ValueDataAdapter represents a leaf in the DataAdapter hierarchy. A
 * ValueDataAdapter is associated with the XML3D data elements having
 * no children besides a text node such as <bool>, <float>, <float2>,... .
 *
 * @author  Benjamin Friedrich
 * @version 10/2010  1.0
 */

/**
 * Constructor of org.xml3d.webgl.ValueDataAdapter
 *
 * @augments org.xml3d.webgl.DataAdapter
 * @constructor
 *
 * @param factory
 * @param node
 */
org.xml3d.webgl.ValueDataAdapter = function(factory, node)
{
	org.xml3d.webgl.DataAdapter.call(this, factory, node);
	this.init = function()
	{
		this.createDataTable(true);
	};
};
org.xml3d.webgl.ValueDataAdapter.prototype             = new org.xml3d.webgl.DataAdapter();
org.xml3d.webgl.ValueDataAdapter.prototype.constructor = org.xml3d.webgl.ValueDataAdapter;

/**
 * Returns the tuple size of the associated XML3D data element.
 *
 * @returns the tuples size of the associated node or -1 if the tuple size
 * 			of the associated node can not be determined
 */
org.xml3d.webgl.ValueDataAdapter.prototype.getTupleSize = function()
{
	if (this.node.localName == "float" ||
		this.node.localName == "int"   ||
		this.node.localName == "bool"  )
	{
		return 1;
	}

	if (this.node.localName == "float2")
	{
		return 2;
	}

	if (this.node.localName == "float3")
	{
		return 3;
	}

	if (this.node.localName == "float4")
	{
		return 4;
	}

	if (this.node.localName == "float4x4")
	{
		return 16;
	}

	org.xml3d.debug.logWarning("Can not determine tuple size of element " + this.node.localName);
	return -1;
};

/**
 * Extracts the texture data of a node. For example:
 *
 * <code>
 *	<texture name="...">
 * 		<img src="textureData.jpg"/>
 * 	</texture
 * </code>
 *
 * In this case, "textureData.jpg" is returned as texture data.
 *
 * @param   node  XML3D texture node
 * @returns texture data or null, if the given node is not a XML3D texture element
 */
org.xml3d.webgl.ValueDataAdapter.prototype.extractTextureData = function(node)
{
	if(node.localName != "texture")
	{
		return null;
	}

	var textureChild = node.firstElementChild;
	if(textureChild.localName != "img")
	{
		org.xml3d.debug.logWarning("child of texture element is not an img element");
		return null;
	}

	return textureChild.src;
};

/**
 * Creates datatable. If the parameter 'forceNewInstance' is specified with 'true',
 * createDataTable() creates a new datatable, caches and returns it. If no
 * parameter is specified or 'forceNewInstance' is specified with 'false', the
 * cashed datatable is returned.<br/>
 * Each datatable has the following format:<br/>
 * <br/>
 * datatable['name']['tupleSize'] : tuple size of the data element with name 'name' <br/>
 * datatable['name']['data']      : typed array (https://cvs.khronos.org/svn/repos/registry/trunk/public/webgl/doc/spec/TypedArray-spec.html)
 * 								    associated with the data element with name 'name'
 *
 * @param   forceNewInstance
 * 				indicates whether a new instance shall be created or the cached
 * 				datatable shall be returned
 * @returns datatable
 */
org.xml3d.webgl.ValueDataAdapter.prototype.createDataTable = function(forceNewInstance)
{
	if(forceNewInstance == undefined ? true : ! forceNewInstance)
	{
	   return this.dataTable;
	}

	var value = this.node.value;
	var name    		 = this.node.name;
	var result 			 = new Array(1);
	var content          = new Array();
	content['tupleSize'] = this.getTupleSize();

	content['data'] = value;
	result[name]    = content;
	this.dataTable  = result;

	return result;
};

/**
 * Returns String representation of this DataAdapter
 */
org.xml3d.webgl.ValueDataAdapter.prototype.toString = function()
{
	return "org.xml3d.webgl.ValueDataAdapter";
};

//---------------------------------------------------------------------------------------------------------------------------

/**
 * Class    org.xml3d.webgl.RootDataAdapter
 * extends: org.xml3d.webgl.DataAdapter
 *
 * RootDataAdapter represents the root in the DataAdapter hierarchy (no parents).
 *
 * @author  Benjamin Friedrich
 * @version 10/2010  1.0
 */

/**
 * Constructor of org.xml3d.webgl.RootDataAdapter
 *
 * @augments org.xml3d.webgl.DataAdapter
 * @constructor
 *
 * @param factory
 * @param node
 *
 */
org.xml3d.webgl.RootDataAdapter = function(factory, node)
{
	org.xml3d.webgl.DataAdapter.call(this, factory, node);
};
org.xml3d.webgl.RootDataAdapter.prototype             = new org.xml3d.webgl.DataAdapter();
org.xml3d.webgl.RootDataAdapter.prototype.constructor = org.xml3d.webgl.RootDataAdapter;

/**
 * Indicates whether this DataAdapter is a RootAdapter (has no parent DataAdapter).
 *
 * @returns true if this DataAdapter is a RootAdapter, otherwise false.
 */
org.xml3d.webgl.RootDataAdapter.prototype.isRootAdapter = function()
{
	return true;
};

/**
 * Returns String representation of this DataAdapter
 */
org.xml3d.webgl.RootDataAdapter.prototype.toString = function()
{
	return "org.xml3d.webgl.RootDataAdapter";
};


org.xml3d.webgl.ImgDataAdapter = function(factory, node)
{
	org.xml3d.webgl.DataAdapter.call(this, factory, node);
};
org.xml3d.webgl.ImgDataAdapter.prototype             = new org.xml3d.webgl.DataAdapter();
org.xml3d.webgl.ImgDataAdapter.prototype.constructor = org.xml3d.webgl.ImgDataAdapter;

org.xml3d.webgl.ImgDataAdapter.prototype.createDataTable = function(forceNewInstance)
{};

org.xml3d.webgl.TextureDataAdapter = function(factory, node)
{
	org.xml3d.webgl.DataAdapter.call(this, factory, node);
};
org.xml3d.webgl.TextureDataAdapter.prototype             = new org.xml3d.webgl.DataAdapter();
org.xml3d.webgl.TextureDataAdapter.prototype.constructor = org.xml3d.webgl.TextureDataAdapter;

org.xml3d.webgl.TextureDataAdapter.prototype.createDataTable = function(forceNewInstance)
{
	if(forceNewInstance == undefined ? true : ! forceNewInstance)
	{
	   return this.dataTable;
	}
	var gl = this.factory.handler.gl;
	var clampToGL = function(gl, modeStr) {
		if (modeStr == "clamp")
			return gl.CLAMP_TO_EDGE;
		if (modeStr == "repeat")
			return gl.REPEAT;
		return gl.CLAMP_TO_EDGE;
	};
	
	var filterToGL = function(gl, modeStr) {
		if (modeStr == "nearest")
			return gl.NEAREST;
		if (modeStr == "linear")
			return gl.LINEAR;
		if (modeStr == "mipmap_linear")
			return gl.LINEAR_MIPMAP_NEAREST;
		if (modeStr == "mipmap_nearest")
			return gl.NEAREST_MIPMAP_NEAREST;
		return gl.LINEAR;
	};
	
	var node = this.node;
	var imgSrc = new Array();
	
	// TODO: Sampler options
	var options = ({
		/*Custom texture options would go here, SGL's default options are:

		minFilter        : gl.LINEAR,
		magFilter        : gl.LINEAR,
		wrapS            : gl.CLAMP_TO_EDGE,
		wrapT            : gl.CLAMP_TO_EDGE,
		isDepth          : false,
		depthMode        : gl.LUMINANCE,
		depthCompareMode : gl.COMPARE_R_TO_TEXTURE,
		depthCompareFunc : gl.LEQUAL,
		generateMipmap   : false,
		flipY            : true,
		premultiplyAlpha : false,
		onload           : null
		 */
		wrapS            : clampToGL(gl, node.wrapS),
		wrapT            : clampToGL(gl, node.wrapT),
		generateMipmap   : false
		
	});	

	// TODO: automatically set generateMipmap to true when mipmap dependent filters are used
	options.minFilter = filterToGL(gl, node.getAttribute("minFilter"));
	options.magFilter = filterToGL(gl, node.getAttribute("magFilter"));
	if (node.getAttribute("mipmap") == "true")
		options.generateMipmap = true;
	
	if (node.hasAttribute("textype") && node.getAttribute("textype") == "cube") {
		for (var i=0; i<node.childNodes.length; i++) {
			var child = node.childNodes[i];
			if (child.localName != "img")
				continue;
			imgSrc.push(child.src);
		}
		
		if (imgSrc.length != 6) {
			org.xml3d.debug.logError("A cube map requires 6 textures, but only "+imgSrc.length+" were found!");
			return null;
		}
		options["flipY"] = false;
		
	} else {
		var textureChild = node.firstElementChild;
		if(textureChild.localName != "img")
		{
			org.xml3d.debug.logWarning("child of texture element is not an img element");
			return null;
		}
		imgSrc.push(textureChild.src);
	}

	
	var result 			 = new Array(1);
	//var value = new SglTexture2D(gl, textureSrc, options);
	var name    		 = this.node.name;
	var content          = new Array();
	content['tupleSize'] = 1;
	
	content['options'] = options;
	content['src'] = imgSrc;
	content['isTexture'] = true;
	content['node'] = this.node;
	
	result[name]    = content;
	this.dataTable  = result;
	return result;
};

/**
 * Returns String representation of this TextureDataAdapter
 */
org.xml3d.webgl.TextureDataAdapter.prototype.toString = function()
{
	return "org.xml3d.webgl.TextureDataAdapter";
};
/***********************************************************************/

var g_shaders = {};

g_shaders["urn:xml3d:shader:matte"] = g_shaders["urn:xml3d:shader:flat"] = {
	vertex :
			 "attribute vec3 position;"
			+ "uniform mat4 modelViewProjectionMatrix;"
			+ "void main(void) {"
			+"    vec3 pos = position;\n\n //~"
			
			+ "    \ngl_Position = modelViewProjectionMatrix * vec4(pos, 1.0);"
			+ "}",
	fragment :
			"#ifdef GL_ES\n"
			+"precision highp float;\n"
			+"#endif\n\n"
		    + "uniform vec3 diffuseColor;"
			+ "void main(void) {\n"
			+ "    gl_FragColor = vec4(diffuseColor.x, diffuseColor.y, diffuseColor.z, 1.0);"
			+ "}"
};
g_shaders["urn:xml3d:shader:mattevcolor"] = g_shaders["urn:xml3d:shader:flatvcolor"] = {
		vertex :
				 "attribute vec3 position;"
				+ "attribute vec3 color;"
				+ "varying vec3 fragVertexColor;"
				+ "uniform mat4 modelViewProjectionMatrix;"
				+ "void main(void) {"
				+"    vec3 pos = position;\n\n //~"

				+ "    \nfragVertexColor = color;"
				+ "    gl_Position = modelViewProjectionMatrix * vec4(pos, 1.0);"
				+ "}",
		fragment :
				"#ifdef GL_ES\n"
				+"precision highp float;\n"
				+"#endif\n\n"
			    + "uniform vec3 diffuseColor;"
				+ "varying vec3 fragVertexColor;"
				+ "void main(void) {"
				+ "    gl_FragColor = vec4(fragVertexColor, 1.0);"
				+ "}"
	};

g_shaders["urn:xml3d:shader:phong"] = {
		vertex :

		"attribute vec3 position;\n"
		+"attribute vec3 normal;\n"

		+"varying vec3 fragNormal;\n"
		+"varying vec3 fragVertexPosition;\n"
		+"varying vec3 fragEyeVector;\n"

		+"uniform mat4 modelViewProjectionMatrix;\n"
		+"uniform mat4 modelViewMatrix;\n"
		+"uniform mat3 normalMatrix;\n"
		+"uniform vec3 eyePosition;\n"

		+"void main(void) {\n"
		+"    vec3 pos = position;\n"
		+"    vec3 norm = normal;\n\n //~"
		
		+"	  \ngl_Position = modelViewProjectionMatrix * vec4(pos, 1.0);\n"
		+"	  fragNormal = normalize(normalMatrix * norm);\n"
		+"	  fragVertexPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;\n"
		+"	  fragEyeVector = normalize(fragVertexPosition);\n"
		+"}\n",

	fragment:
	// NOTE: Any changes to this area must be carried over to the substring calculations in
	// org.xml3d.webgl.Renderer.prototype.getStandardShaderProgram
			"#ifdef GL_ES\n"
			+"precision highp float;\n"
			+"#endif\n\n"
			+"const int MAXLIGHTS = 0; \n"
	// ------------------------------------------------------------------------------------
			+"uniform float ambientIntensity;\n"
			+"uniform vec3 diffuseColor;\n"
			+"uniform vec3 emissiveColor;\n"
			+"uniform float shininess;\n"
			+"uniform vec3 specularColor;\n"
			+"uniform float transparency;\n"

			+"varying vec3 fragNormal;\n"
			+"varying vec3 fragVertexPosition;\n"
			+"varying vec3 fragEyeVector;\n"

			+"uniform vec3 lightAttenuations[MAXLIGHTS+1];\n"
			+"uniform vec3 lightPositions[MAXLIGHTS+1];\n"
			+"uniform vec3 lightDiffuseColors[MAXLIGHTS+1];\n"
			+"uniform vec3 lightVisibility[MAXLIGHTS+1];\n"

			+"void main(void) {\n"
			+"  if (transparency > 0.95) discard;\n"
			+"  vec3 color = emissiveColor;\n"
			+"	if (MAXLIGHTS < 1) {\n"
			+"      vec3 light = -normalize(fragVertexPosition);\n"
			+"      vec3 normal = fragNormal;\n"
			+"      vec3 eye = fragEyeVector;\n"
			+"      float diffuse = max(0.0, dot(normal, light)) ;\n"
			+"      diffuse += max(0.0, dot(normal, eye));\n"
			+"      float specular = pow(max(0.0, dot(normal, normalize(light+eye))), shininess*128.0);\n"
			+"      specular += pow(max(0.0, dot(normal, eye)), shininess*128.0);\n"
			+"      color = color + diffuse*diffuseColor + specular*specularColor;\n"
			+"	} else {\n"
			+"		for (int i=0; i<MAXLIGHTS; i++) {\n"
			+"			vec3 L = lightPositions[i] - fragVertexPosition;\n"
		 	+"      	vec3 N = fragNormal;\n"
		 	+"			vec3 E = fragEyeVector;\n"
			+"			float dist = length(L);\n"
		 	+"      	L = normalize(L);\n"
			+"			vec3 R = normalize(reflect(L,N));\n"
			+"			float atten = 1.0 / (lightAttenuations[i].x + lightAttenuations[i].y * dist + lightAttenuations[i].z * dist * dist);\n"
			+"			vec3 Idiff = lightDiffuseColors[i] * max(dot(N,L),0.0) * diffuseColor ;\n"
			+"			vec3 Ispec = specularColor * pow(max(dot(R,E),0.0), shininess*128.0);\n"	
			+"			color = color + (atten*(Idiff + Ispec)) * lightVisibility[i];\n"
			+"		}\n"
			+"  }\n"
			+"	gl_FragColor = vec4(color, max(0.0, 1.0 - transparency));\n"
			+"}"
};

g_shaders["urn:xml3d:shader:texturedphong"] = {
		vertex :

		"attribute vec3 position;\n"
		+"attribute vec3 normal;\n"
		+"attribute vec2 texcoord;\n"

		+"varying vec3 fragNormal;\n"
		+"varying vec3 fragVertexPosition;\n"
		+"varying vec3 fragEyeVector;\n"
		+"varying vec2 fragTexCoord;\n"

		+"uniform mat4 modelViewProjectionMatrix;\n"
		+"uniform mat4 modelViewMatrix;\n"
		+"uniform mat3 normalMatrix;\n"
		+"uniform vec3 eyePosition;\n"


		+"void main(void) {\n"
		+"    vec2 tex = texcoord;\n"
		+"    vec3 pos = position;\n"
		+"    vec3 norm = normal;\n\n //~"
		
		+"	  \ngl_Position = modelViewProjectionMatrix * vec4(pos, 1.0);\n"
		+"	  fragNormal = normalize(normalMatrix * norm);\n"
		+"	  fragVertexPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;\n"
		+"	  fragEyeVector = normalize(fragVertexPosition);\n"
		+"    fragTexCoord = tex;\n"
		+"}\n",

	fragment:
		// NOTE: Any changes to this area must be carried over to the substring calculations in
		// org.xml3d.webgl.Renderer.prototype.getStandardShaderProgram
			"#ifdef GL_ES\n"
			+"precision highp float;\n"
			+"#endif\n\n"
			+"const int MAXLIGHTS = 0; \n"
		// ------------------------------------------------------------------------------------
			+"uniform float ambientIntensity;\n"
			+"uniform vec3 diffuseColor;\n"
			+"uniform vec3 emissiveColor;\n"
			+"uniform float shininess;\n"
			+"uniform vec3 specularColor;\n"
			+"uniform float transparency;\n"
			+"uniform float lightOn;\n"
			+"uniform sampler2D diffuseTexture;\n"

			+"varying vec3 fragNormal;\n"
			+"varying vec3 fragVertexPosition;\n"
			+"varying vec3 fragEyeVector;\n"
			+"varying vec2 fragTexCoord;\n"

			+"uniform vec3 lightAttenuations[MAXLIGHTS+1];\n"
			+"uniform vec3 lightPositions[MAXLIGHTS+1];\n"
			+"uniform vec3 lightDiffuseColors[MAXLIGHTS+1];\n"
			+"uniform vec3 lightVisibility[MAXLIGHTS+1];\n"


			+"void main(void) {\n"
			+"  vec4 color = vec4(emissiveColor, 0.0);\n"
			+"	if (MAXLIGHTS < 1) {\n"
			+"      vec3 light = -normalize(fragVertexPosition);\n"
			+"      vec3 normal = fragNormal;\n"
			+"      vec3 eye = fragEyeVector;\n"
			+"      float diffuse = max(0.0, dot(normal, light)) ;\n"
			+"      diffuse += max(0.0, dot(normal, eye));\n"
			+"      float specular = pow(max(0.0, dot(normal, normalize(light-eye))), shininess*128.0);\n"
			+"      specular += pow(max(0.0, dot(normal, eye)), shininess*128.0);\n"
			+"      vec4 texDiffuse = texture2D(diffuseTexture, fragTexCoord);\n"
			+"      color += vec4(diffuse*texDiffuse.xyz+ specular*specularColor, texDiffuse.w);\n"
			+"	} else {\n"
			+"      vec4 texDiffuse = texture2D(diffuseTexture, fragTexCoord);\n"
			+"		for (int i=0; i<MAXLIGHTS; i++) {\n"
			+"			vec3 L = lightPositions[i] - fragVertexPosition;\n"
		 	+"      	vec3 N = fragNormal;\n"
		 	+"			vec3 E = fragEyeVector;\n"
			+"			float dist = length(L);\n"
		 	+"     	 	L = normalize(L);\n"
			+"			vec3 R = normalize(reflect(L,N));\n"

			+"			float atten = 1.0 / (lightAttenuations[i].x + lightAttenuations[i].y * dist + lightAttenuations[i].z * dist * dist);\n"
			+"      	vec4 texDiffuse = texture2D(diffuseTexture, fragTexCoord);\n"

			+"			vec3 Idiff = lightDiffuseColors[i] * max(dot(N,L),0.0) * texDiffuse.xyz * diffuseColor;\n"
			+"			vec3 Ispec = specularColor * pow(max(dot(R,E),0.0), shininess*128.0);\n"
			+"			color += vec4((atten*(Idiff + Ispec))*lightVisibility[i], texDiffuse.w);\n"
			+"		}\n"		
			+"  }\n"
			+"  float alpha = color.w * max(0.0, 1.0 - transparency);\n"
			+"  if (alpha < 0.1) discard;\n"
			+"	gl_FragColor = vec4(color.xyz, alpha);\n" 
			+"}"
};

g_shaders["urn:xml3d:shader:phongvcolor"] = {
		vertex :

			"attribute vec3 position;\n"
			+"attribute vec3 normal;\n"
			+"attribute vec3 color;\n"

			+"varying vec3 fragNormal;\n"
			+"varying vec3 fragVertexPosition;\n"
			+"varying vec3 fragEyeVector;\n"
			+"varying vec2 fragTexCoord;\n"
			+"varying vec3 fragVertexColor;\n"

			+"uniform mat4 modelViewProjectionMatrix;\n"
			+"uniform mat4 modelViewMatrix;\n"
			+"uniform mat3 normalMatrix;\n"
			+"uniform vec3 eyePosition;\n"

			+"void main(void) {\n"
			+"    vec3 pos = position;\n"
			+"    vec3 norm = normal;\n\n //~"
			
			+"	  \ngl_Position = modelViewProjectionMatrix * vec4(pos, 1.0);\n"
			+"	  fragNormal = normalize(normalMatrix * norm);\n"
			+"	  fragVertexPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;\n"
			+"	  fragEyeVector = normalize(fragVertexPosition);\n"
			+ "   fragVertexColor = color;\n"
			+"}\n",

		fragment:
		// NOTE: Any changes to this area must be carried over to the substring calculations in
		// org.xml3d.webgl.Renderer.prototype.getStandardShaderProgram
				"#ifdef GL_ES\n"
				+"precision highp float;\n"
				+"#endif\n\n"
				+"const int MAXLIGHTS = 0; \n"
		// ------------------------------------------------------------------------------------
				+"uniform float ambientIntensity;\n"
				+"uniform vec3 diffuseColor;\n"
				+"uniform vec3 emissiveColor;\n"
				+"uniform float shininess;\n"
				+"uniform vec3 specularColor;\n"
				+"uniform float transparency;\n"
				+"uniform float lightOn;\n"

				+"varying vec3 fragNormal;\n"
				+"varying vec3 fragVertexPosition;\n"
				+"varying vec3 fragEyeVector;\n"
				+"varying vec3 fragVertexColor;\n"

				+"uniform vec3 lightAttenuations[MAXLIGHTS+1];\n"
				+"uniform vec3 lightPositions[MAXLIGHTS+1];\n"
				+"uniform vec3 lightDiffuseColors[MAXLIGHTS+1];\n"
				+"uniform vec3 lightVisibility[MAXLIGHTS+1];\n"

				+"void main(void) {\n"
				+"  if (transparency > 0.95) discard;\n"
				+"  vec3 color = emissiveColor;\n"
				+"	if (MAXLIGHTS < 1) {\n"
				+"      vec3 light = -normalize(fragVertexPosition);\n"
				+"      vec3 normal = fragNormal;\n"
				+"      vec3 eye = fragEyeVector;\n"
				+"      float diffuse = max(0.0, dot(normal, light)) ;\n"
				+"      diffuse += max(0.0, dot(normal, eye));\n"
				+"      float specular = pow(max(0.0, dot(normal, normalize(light+eye))), shininess*128.0);\n"
				+"      specular += pow(max(0.0, dot(normal, eye)), shininess*128.0);\n"
				+"      color += diffuse*fragVertexColor + specular*specularColor;\n"
				+"	} else {\n"
				+"		for (int i=0; i<MAXLIGHTS; i++) {\n"
				+"			vec3 L = lightPositions[i] - fragVertexPosition;\n"
			 	+"      	vec3 N = fragNormal;\n"
			 	+"			vec3 E = fragEyeVector;\n"
				+"			float dist = length(L);\n"
			 	+"      	L = normalize(L);\n"
				+"			vec3 R = normalize(reflect(L,N));\n"

				+"			float atten = 1.0 / (lightAttenuations[i].x + lightAttenuations[i].y * dist + lightAttenuations[i].z * dist * dist);\n"
				+"			vec3 Idiff = lightDiffuseColors[i] * max(dot(N,L),0.0) * fragVertexColor ;\n"
				+"			vec3 Ispec = specularColor * pow(max(dot(R,E),0.0), shininess*128.0);\n"
				+"			color += (atten*(Idiff + Ispec))*lightVisibility[i];\n"
				+"		}\n"
				+"  }\n"
				+"	gl_FragColor = vec4(color, max(0.0, 1.0 - transparency));\n"
				+"}"
	};

g_shaders["urn:xml3d:shader:picking"] = {
		vertex:

		"attribute vec3 position;\n"
		+ "uniform mat4 modelMatrix;\n"
		+ "uniform mat4 modelViewProjectionMatrix;\n"
		+ "uniform vec3 min;\n"
		+ "uniform vec3 max;\n"

		+ "varying vec3 worldCoord;\n"
		+ "void main(void) {\n"
		+ "    worldCoord = (modelMatrix * vec4(position, 1.0)).xyz;\n"
		+ "    vec3 diff = max - min;\n"
		+ "    worldCoord = worldCoord - min;\n"
		+ "    worldCoord = worldCoord / diff;"
		+ "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);\n"
		+ "}" ,

		fragment:


		"#ifdef GL_ES\n"
		+"precision highp float;\n"
		+"#endif\n\n"
		+"uniform float id;"
		+ "varying vec3 worldCoord;\n"

		+ "void main(void) {\n"
		+ "    gl_FragColor = vec4(worldCoord, id);\n"
		+ "}\n"
	};

g_shaders["urn:xml3d:shader:pickedNormals"] = {
		vertex:

		"attribute vec3 position;\n"
		+ "attribute vec3 normal;\n"
		+ "uniform mat4 modelViewMatrix;\n"
		+ "uniform mat4 modelViewProjectionMatrix;\n"
		+ "uniform mat3 normalMatrix;\n"

		+ "varying vec3 fragNormal;\n"
		
		+ "void main(void) {\n"
		+ "	   fragNormal = normalize(normalMatrix * normal);\n"
		+ "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);\n"
		+ "}" ,

		fragment:


		"#ifdef GL_ES\n"
		+"precision highp float;\n"
		+"#endif\n\n"
		
		+ "varying vec3 fragNormal;\n"

		+ "void main(void) {\n"
		+ "    gl_FragColor = vec4((fragNormal+1.0)/2.0, 1.0);\n"
		+ "}\n"
	};

/**
 * Begin XFlow scripts
 * 
 * XFlow scripts can create vertex data or alter it through CPU scripts and/or shaders.
 * 
 */
org.xml3d.xflow.plane = function(dataTable) {
	var segments = dataTable.segments;
	segments = segments !== undefined && segments.data ? segments.data[0] : 1;	
	if (segments <= 0)
		return;
	
	var numVertices = (segments+1)*(segments+1);
	var numIndices = (segments*segments) * 6;
	var index = new Int32Array(numIndices); 
	var position = new Float32Array(numVertices*3); 
	var normal = new Float32Array(numVertices*3); 
	var texcoord = new Float32Array(numVertices*2);
	
	var quadLength = 2 / segments;
	
	for (var i=0; i<segments+1; i++)
	for (var j=0; j<segments+1; j++) {
		var x = -1.0 + i*quadLength;
		var y = -1.0 + j*quadLength;
		var u = i / segments;
		var v = j / segments;
		var ind = j * (segments+1) + i;
		
		position.set([x, 0, y], ind*3);
		normal.set([0,1,0], ind*3);
		texcoord.set([u,v], ind*2);		
	}
	
	var quadIndex = 0;
	
	for (var i=0; i<segments; i++)
	for (var j=0; j<segments; j++) {
		var i0 = j * (segments+1) + i;
		var i1 = i0 + 1;
		var i2 = (j+1) * (segments+1) + i;
		var i3 = i2 + 1;
		
		index.set([i0, i1, i2, i2, i1, i3], quadIndex);
		quadIndex += 6;
	}

	dataTable.index = { data : index, tupleSize : 1 };
	dataTable.position = { data : position, tupleSize : 3};
	dataTable.normal = { data : normal, tupleSize : 3 };
	dataTable.texcoord = { data : texcoord, tupleSize : 2 };		
};

org.xml3d.xflow.box = function(dataTable) {
	var segments = dataTable.segments;
	var size = dataTable.size;
	segments = segments !== undefined && segments.data ? segments.data[0] : 1;
	size = size !== undefined && size.data ? size.data[0] : 2.0;
	
	if (segments <= 0 || size <= 0)
		return;
	
	var halfSize = size / 2.0;
	var numTrianglesPerFace = segments * segments * 2;
	var numIndicesPerFace = numTrianglesPerFace * 3;
	var numIndices = numIndicesPerFace * 6;
	var numVerticesPerFace = (segments+1)*(segments+1);
	var numVertices = numVerticesPerFace * 6;
	
	var quadLength = size / segments;
	var index = new Int32Array(numIndices); 
	var position = new Float32Array(numVertices*3); 
	var normal = new Float32Array(numVertices*3); 
	var texcoord = new Float32Array(numVertices*2);
	
	var faceNormals = [ [0,-1,0],
	                    [0,1,0],
	                    [-1,0,0],
	                    [1,0,0],
	                    [0,0,-1],
	                    [0,0,1]
	                  ];
	
	for (var k=0; k<6; k++) {
		for (var i=0; i<segments+1; i++)
		for (var j=0; j<segments+1; j++) {
			var x = -halfSize + i*quadLength;
			var y = -halfSize + j*quadLength;
			
			var ind = j * (segments+1) + i + k*numVerticesPerFace;
			
			var u = i/segments;
			var v = j/segments;
			
			switch (k) {
			case 0:
				position.set([x, -halfSize, y], ind*3); break;
			case 1:
				position.set([x, halfSize, y], ind*3); break;
			case 2:
				position.set([-halfSize, x, y], ind*3); break;
			case 3:
				position.set([halfSize, x, y], ind*3); break;
			case 4:
				position.set([x, y, -halfSize], ind*3); break;
			case 5:
				position.set([x, y, halfSize], ind*3); break;
			}
			
			normal.set(faceNormals[k], ind*3);
			texcoord.set([u, v], ind*2);			
		}	
	}
	
	var quadIndex = 0;
	
	for (var k=0; k<6; k++) {
		for (var i=0; i<segments; i++)
		for (var j=0; j<segments; j++) {
			var i0 = j * (segments+1) + i + k*numVerticesPerFace;
			var i1 = i0 + 1;
			var i2 = (j+1) * (segments+1) + i + k*numVerticesPerFace;
			var i3 = i2 + 1;
			
			index.set([i0, i1, i2, i2, i1, i3], quadIndex);
			quadIndex += 6;
		}
	}
	
	dataTable.index = { data : index, tupleSize : 1 };
	dataTable.position = { data : position, tupleSize : 3};
	dataTable.normal = { data : normal, tupleSize : 3 };
	dataTable.texcoord = { data : texcoord, tupleSize : 2 };                   
};

org.xml3d.xflow.sphere = function(dataTable) {
	var segments = dataTable.segments;
	segments = segments !== undefined && segments.data ? segments.data[0] : 1;
	
	if (segments <= 0)
		return;
	
	var numTriangles = segments * segments * 2;
	var numIndices = numTriangles * 3;
	var numVertices = (segments+1)*(segments+1);

	var index = new Int32Array(numIndices); 
	var position = new Float32Array(numVertices*3); 
	var normal = new Float32Array(numVertices*3); 
	var texcoord = new Float32Array(numVertices*2);
	
	for (var i=0; i<segments+1; i++)
	for (var j=0; j<segments+1; j++) {
		var u = i/segments;
		var v = j/segments;
		
		var theta = u*Math.PI;
		var phi = v*Math.PI*2;
		
		var x = Math.sin(theta) * Math.cos(phi);
		var y = Math.cos(theta);
		var z = -Math.sin(theta) * Math.sin(phi);
		
		var ind = j * (segments+1) + i;
		var n = new XML3DVec3(x,y,z).normalize();
		
		position.set([x,y,z], ind*3);
		normal.set([n.x, n.y, n.z], ind*3);
		texcoord.set([v, 1-u], ind*2);
	}
	
	var quadIndex = 0;
	
	for (var i=0; i<segments; i++)
	for (var j=0; j<segments; j++) {
		var i0 = j * (segments+1) + i;
		var i1 = i0 + 1;
		var i2 = (j+1) * (segments+1) + i;
		var i3 = i2 + 1;
		
		index.set([i0, i1, i2, i2, i1, i3], quadIndex);
		quadIndex += 6;
	}

	dataTable.index = { data : index, tupleSize : 1 };
	dataTable.position = { data : position, tupleSize : 3};
	dataTable.normal = { data : normal, tupleSize : 3 };
	dataTable.texcoord = { data : texcoord, tupleSize : 2 };
};

org.xml3d.xflow.cylinder = function(dataTable) {
	var segments = dataTable.segments;
	segments = segments !== undefined && segments.data ? segments.data[0] : 1;
	
	if (segments <= 0)
		return;
	
	var numTrianglesCap = segments - 2;
	var numTrianglesSide = segments*segments * 2;
	var numTriangles = numTrianglesSide + 2*numTrianglesCap;
	var numIndices = numTriangles * 3;
	
	var numVerticesCap = segments;
	var numVerticesSide = (segments+1)*(segments+1);
	var numVertices = numVerticesSide + numVerticesCap*2;
	
	var index = new Int32Array(numIndices); 
	var position = new Float32Array(numVertices*3); 
	var normal = new Float32Array(numVertices*3); 
	var texcoord = new Float32Array(numVertices*2);
	
	//Create vertices for body
	for (var i=0; i<segments+1; i++)
	for (var j=0; j<segments+1; j++) {
		var u = i/segments;
		var v = j/segments;
		
		var x = Math.sin(u * 2 * Math.PI);
		var y = Math.cos(u * 2 * Math.PI);
		var z = (v - 0.5)*2;
		
		var ind = j * (segments+1) + i;
		var n = new XML3DVec3(x,0,y).normalize();
		
		position.set([x,z,y], ind*3);
		normal.set([n.x, n.y, n.z], ind*3);
		texcoord.set([u,v], ind*2);
	}
	
	//Create vertices for caps
	for( var k=0; k<2; k++)
    for( var i=0; i<segments; i++) {
    	var u = i/segments;
		
    	var x = Math.sin(u * 2 * Math.PI);
		var y = Math.cos(u * 2 * Math.PI);
		var z = (k - 0.5)*2;
		
		var ind = i + k*numVerticesCap + numVerticesSide;
		
		position.set([x,z,y], ind*3);
		if (k==1)
			normal.set([0,-1,0], ind*3);
		else
			normal.set([0,1,0], ind*3);
		texcoord.set([x,y], ind*2);
    }
	
	var quadIndex = 0;
	
	//Create triangles for body
	for (var i=0; i<segments; i++)
	for (var j=0; j<segments; j++) {
		var i0 = j * (segments+1) + i;
		var i1 = i0 + 1;
		var i2 = (j+1) * (segments+1) + i;
		var i3 = i2 + 1;
		
		index.set([i0, i1, i2, i2, i1, i3], quadIndex);
		quadIndex += 6;
	}
	
	//Create triangles for caps
	for( var k=0; k<2; k++)
    for( var i=0; i<(segments-2); i++) {
    	var i0 = numVerticesSide + k*numVerticesCap;
    	var i1 = i0 + i + 1;
    	var i2 = i1 + 1;
    	
    	index.set([i0,i1,i2], quadIndex);
    	quadIndex += 3;
    }
	
	dataTable.index = { data : index, tupleSize : 1 };
	dataTable.position = { data : position, tupleSize : 3};
	dataTable.normal = { data : normal, tupleSize : 3 };
	dataTable.texcoord = { data : texcoord, tupleSize : 2 };
};

org.xml3d.xflow.ripple = function(dataTable) {
	if (!dataTable.position || !dataTable.strength || !dataTable.wavelength || ! dataTable.phase) {
		org.xml3d.debug.logError("Missing data for XFlow Ripple script!");
		return;
	}
	
	var sd = 
		 "\n uniform float strength;\n"
		+"uniform float wavelength;\n"
		+"uniform float phase;\n";
	
	var sb = 
		 " 	  float dist = sqrt(pos.x*pos.x + pos.z*pos.z);\n"
		+"    float height = sin(dist * wavelength + phase)*strength;\n"
		+"    pos = vec3(pos.x, pos.y+height, pos.z);\n"
		//TODO: Normals
		;
	
	if (dataTable.xflowShader) {
		dataTable.xflowShader.declarations += sd;
		dataTable.xflowShader.body += sb;
	} else {
		dataTable.xflowShader = {};
		dataTable.xflowShader.body = sb;
		dataTable.xflowShader.declarations = sd;
		dataTable.xflowShader.body = sb;
		dataTable.xflowShader.uniforms = {};		
	}
	
	dataTable.xflowShader.uniforms["strength"] = dataTable.strength;
	dataTable.xflowShader.uniforms["wavelength"] = dataTable.wavelength;
	dataTable.xflowShader.uniforms["phase"] = dataTable.phase;
	delete dataTable.strength;
	delete dataTable.wavelength;
	delete dataTable.phase;

};

org.xml3d.xflow.morphing = function(dataTable) {
	if (!dataTable.position1 || !dataTable.position2 || !dataTable.weight1 || ! dataTable.weight2) {
		org.xml3d.debug.logError("Missing data for XFlow Morphing script!");
		return;
	}
	
	var sd = 
		"\n attribute vec3 position1;\n"
		+"attribute vec3 position2;\n"
		+"uniform float weight1;\n"
		+"uniform float weight2;\n";
	
	var sb = 
		"   pos = mix(pos, position1, weight1);\n"
	   +"   pos = mix(pos, position2, weight2);\n"
		//TODO: Normals
		;
	
	if (dataTable.xflowShader) {
		dataTable.xflowShader.declarations += sd;
		dataTable.xflowShader.body += sb;
	} else {
		dataTable.xflowShader = {};
		dataTable.xflowShader.body = sb;
		dataTable.xflowShader.declarations = sd;
		dataTable.xflowShader.body = sb;
		dataTable.xflowShader.uniforms = {};		
	}
	
	dataTable.xflowShader.uniforms["weight1"] = dataTable.weight1;
	dataTable.xflowShader.uniforms["weight2"] = dataTable.weight2;
	delete dataTable.weight1;
	delete dataTable.weight2;	
	
};

org.xml3d.xflow.noise = function(dataTable) {
	if (!dataTable.strength || !dataTable.position) {
		org.xml3d.debug.logError("Missing parameters for XFlow Noise script!");
		return;
	}
	var sd = 
		"uniform vec3 strength;\n"
		+"uniform float weight2;\n"
		+"float rand(vec3 co, vec3 pos){\n"
	    +"return fract(sin(dot(co.xy ,vec2(11.9898,69.233)) * dot(pos, co)) * 43758.5453);\n"
	    +"}\n";
	
	var sb = "";
	
	if (dataTable.seed) {
		var snum = dataTable.seed.data[0];
		sb += "vec3 seed = vec3(0.63, "+snum+", 1.5);\n";
		dataTable.xflowShader.uniforms["seed"] = dataTable.seed;
		delete dataTable.seed;
	} else {
		sb += "vec3 seed = vec3("+Math.random()*5+", "+Math.random()*3+", "+Math.random()*4+");\n";
	}
	
	sb += "pos = pos + rand(seed, pos)*strength;\n";
	//TODO: Normals
	
	if (dataTable.xflowShader) {
		dataTable.xflowShader.declarations += sd;
		dataTable.xflowShader.body += sb;
	} else {
		dataTable.xflowShader = {};
		dataTable.xflowShader.body = sb;
		dataTable.xflowShader.declarations = sd;
		dataTable.xflowShader.body = sb;
		dataTable.xflowShader.uniforms = {};		
	}
	
	dataTable.xflowShader.uniforms["strength"] = dataTable.strength;
	delete dataTable.strength;	
	
};

org.xml3d.xflow.displace = function(dataTable) {

	//TODO: Texture lookup in vertex shader is not yet supported in WebGL
	delete dataTable.diffuseTexture;
	delete dataTable.strength;
	return;
	
	if (!dataTable.strength || !dataTable.diffuseTexture) {
		org.xml3d.debug.logError("Missing parameters for XFlow Displace script!");
		return;
	}
	
	var sd = "uniform sampler2D diffuseTexture;\n"
		+ "uniform float strength;\n"
		+ "attribute vec2 texcoord;\n";
	
	var sb = "vec4 d = texture2D(diffuseTexture, texcoord);\n";
	sb += "pos += norm * strength * ((d.x + d.y + d.z) / 3.0 * d.w);\n";
	
	if (dataTable.xflowShader) {
		dataTable.xflowShader.declarations += sd;
		dataTable.xflowShader.body += sb;
	} else {
		dataTable.xflowShader = {};
		dataTable.xflowShader.body = sb;
		dataTable.xflowShader.declarations = sd;
		dataTable.xflowShader.body = sb;
		dataTable.xflowShader.uniforms = {};		
	}
	
	dataTable.xflowShader.uniforms["strength"] = dataTable.strength;
	delete dataTable.strength;
	dataTable.xflowShader.uniforms["diffuseTexture"] = dataTable.diffuseTexture;
	delete dataTable.diffuseTexture;
	
};

org.xml3d.xflow.smoothing = function(dataTable) {
	//Can't do smoothing in a vertex shader as it's not parallel
	
	var numVertices = dataTable.position.data.length / 3;
	var numTriangles = dataTable.index.data.length / 3;
	
	var newNorm = new Float32Array(numVertices*3); 
	
	for (var i = 0; i<numTriangles; i++) {
		var index0 = dataTable.index.data[i*3];
		var index1 = dataTable.index.data[i*3+1];
		var index2 = dataTable.index.data[i*3+2];
		
		var pos1 = new XML3DVec3(dataTable.position.data[index0], dataTable.position.data[index0+1],
				dataTable.position.data[index0+2]);
		var pos2 = new XML3DVec3(dataTable.position.data[index1], dataTable.position.data[index1+1],
				dataTable.position.data[index1+2]);
		var pos3 = new XML3DVec3(dataTable.position.data[index2], dataTable.position.data[index2+1],
				dataTable.position.data[index2+2]);
		
		var norm = (pos2.subtract(pos1)).cross(pos3.subtract(pos1));
		
		var n = [norm.x, norm.y, norm.z];
		
		newNorm.set(n, index0);
		newNorm.set(n, index1);
		newNorm.set(n, index2);
	}
	
	dataTable.normal = { data : newNorm, tupleSize : 3 };
	
};

org.xml3d.xflow.uv = function(dataTable) {
	
	if (!dataTable.scale || !dataTable.translate) {
		org.xml3d.debug.logError("Missing parameters for XFlow UV script!");
		return;
	}
	
	var sd = "uniform vec2 scale;\n";
	sd += "uniform vec2 translate;\n";
	
	var sb = "tex = tex * scale + translate;\n";
	
	if (dataTable.xflowShader) {
		dataTable.xflowShader.declarations += sd;
		dataTable.xflowShader.body += sb;
	} else {
		dataTable.xflowShader = {};
		dataTable.xflowShader.body = sb;
		dataTable.xflowShader.declarations = sd;
		dataTable.xflowShader.body = sb;
		dataTable.xflowShader.uniforms = {};		
	}
	dataTable.xflowShader.uniforms["scale"] = dataTable.scale;
	delete dataTable.scale;
	dataTable.xflowShader.uniforms["translate"] = dataTable.translate;
	delete dataTable.translate;
};

org.xml3d.xflow.tangent = function(dataTable) {
	
	var numVertices = dataTable.position.data.length / 3;
	var numTriangles = dataTable.index.data.length / 3;
	var tangents = new Float32Array(numVertices*3);
	
	var tan1 = new Float32Array(numVertices*3);
	
	for (var i = 0; i<numTriangles; i++) {
	try {
		var index0 = dataTable.index.data[i*3];
		var index1 = dataTable.index.data[i*3 + 1];
		var index2 = dataTable.index.data[i*3 + 2];
		
		var pos1 = new XML3DVec3(dataTable.position.data[index0], dataTable.position.data[index0+1],
				dataTable.position.data[index0+2]);
		var pos2 = new XML3DVec3(dataTable.position.data[index1], dataTable.position.data[index1+1],
				dataTable.position.data[index1+2]);
		var pos3 = new XML3DVec3(dataTable.position.data[index2], dataTable.position.data[index2+1],
				dataTable.position.data[index2+2]);
		var q1 = pos2.subtract(pos1);
		var q2 = pos3.subtract(pos1);
		
		var ti0 = 2*index0;
		var ti1 = 2*index1;
		var ti2 = 2*index2;
		
		var tex1 = new XML3DVec3(dataTable.texcoord.data[ti0], dataTable.texcoord.data[ti0+1], 0);
		var tex2 = new XML3DVec3(dataTable.texcoord.data[ti1], dataTable.texcoord.data[ti1+1], 0);
		var tex3 = new XML3DVec3(dataTable.texcoord.data[ti2], dataTable.texcoord.data[ti2+1], 0);
		var u1 = tex2.subtract(tex1);
		var u2 = tex3.subtract(tex1);
		
		var r = 1.0 / (u1.x * u2.y - u2.x * u1.y);
		var sdir = new XML3DVec3( (u2.y*q1.x - u1.y*q2.x)*r, (u2.y*q1.y - u1.y*q2.y)*r, (u2.y*q1.z - u1.y*q2.z)*r );
		var tdir = new XML3DVec3( (u1.x*q2.x - u2.x*q1.x)*r, (u1.x*q2.y - u2.x*q1.y)*r, (u1.x*q2.z - u2.x*q1.z)*r );
		
		tan1.set([ tan1[index0]+sdir.x, tan1[index0+1]+sdir.y, tan1[index0+2]+sdir.z ], index0);
		tan1.set([ tan1[index1]+sdir.x, tan1[index1+1]+sdir.y, tan1[index1+2]+sdir.z ], index1);
		tan1.set([ tan1[index2]+sdir.x, tan1[index2+1]+sdir.y, tan1[index2+2]+sdir.z ], index2);

	}catch(e) {
	}
	}
	
	for (var i = 0; i<numVertices; i++) {
		try {
		var n = new XML3DVec3(dataTable.normal.data[i], dataTable.normal.data[i+1],
				dataTable.normal.data[i+2]);
		var t = new XML3DVec3(tan1[i], tan1[i+1], tan1[i+2]);
		//var t2 = new XML3DVec3(tan2[i], tan2[i+1], tan2[i+2]);
		
		var tangent = (t.subtract(n).scale(n.dot(t))).normalize();
		tangents.set(tangent.toGL(), i);
		} catch (e) {
			var ef = e;
		}

	}
	
	dataTable.tangent = { data : tangents, tupleSize : 3 };

};

org.xml3d.xflow.skinning = function(dataTable, dataAdapter) {
	if (!dataTable.bindPose || !dataTable.boneIndices || !dataTable.boneWeights || !dataTable.pose || !dataTable.normal) {
		org.xml3d.debug.logError("Missing parameters for XFlow Skinning script!");
		return;
	}
	dataTable.bindPose.isXFlow = true;
	dataTable.boneIndices.isXFlow = true;
	dataTable.boneWeights.isXFlow = true;
	dataTable.pose.isXFlow = true;
	
	var bindPose = new Array();
	var pose = new Array();
	var numMatrices = dataTable.bindPose.data.length / 16;
	
	if (dataTable.pose.data.length != dataTable.bindPose.data.length)
		return;
	
	
	
	var sd = "uniform mat4 pose["+numMatrices+"];\n"
		+ "uniform mat4 bindPose["+numMatrices+"];\n"
		+ "attribute vec4 boneIndex;\n"
		+ "attribute vec4 boneWeight;\n";
	var sb = "";
	
	sb += "vec4 nPos = vec4(0.0);\n";
	sb += "vec4 nNorm = vec4(0.0);\n";
	sb += "vec4 index = boneIndex;\n";
	sb += "vec4 weight = boneWeight;\n";
	
	sb += "for (int i = 0; i<4; i++) { \n";
	sb += "   if (index.x < "+numMatrices+".0) {\n";
	sb += "      vec4 bindPos =  bindPose[int(index.x)] * vec4(position.xyz, 1.0);\n";
	sb += "      vec4 bindNorm = bindPose[int(index.x)] * vec4(normal.xyz, 0.0);\n";
	sb += "      vec4 posePos = pose[int(index.x)] * vec4(bindPos.xyz, 1.0);\n";
	sb += "      vec4 poseNorm = pose[int(index.x)] * vec4(bindNorm.xyz, 0.0);\n";
	sb += "      nPos += posePos * weight.x;\n";
	sb += "      nNorm += poseNorm * weight.x;\n";
	sb += "   }\n";
	sb += "   index = index.yzwx;\n";
	sb += "   weight = weight.yzwx;\n";
	sb += "}\n";
	
	sb += "float restWeight = 1.0 - (boneWeight.x + boneWeight.y + boneWeight.z + boneWeight.w);\n";
	sb += "nPos = nPos + vec4(position, 0.0) * restWeight;\n";
	sb += "nNorm = nNorm + vec4(normal, 0.0) * restWeight;\n";
	
	sb += "pos = nPos.xyz;\n";
	sb += "norm = nNorm.xyz;\n";

	
	if (dataTable.xflowShader) {
		dataTable.xflowShader.declarations += sd;
		dataTable.xflowShader.body += sb;
	} else {
		dataTable.xflowShader = {};
		dataTable.xflowShader.body = sb;
		dataTable.xflowShader.declarations = sd;
		dataTable.xflowShader.body = sb;
		dataTable.xflowShader.uniforms = {};		
	}	
	
	
	dataTable.xflowShader.uniforms["pose[0]"] = dataTable.pose;
	dataTable.xflowShader.uniforms["bindPose[0]"] = dataTable.bindPose;
	dataTable.boneIndex = { data : new Uint16Array(dataTable.boneIndices.data), tupleSize : 4 };
	//delete dataTable.boneIndices;
	dataTable.boneWeight = { data : dataTable.boneWeights.data, tupleSize : 4 };
};

org.xml3d.xflow.forwardkinematics = function(dataTable) {
	if (!dataTable.parent || !dataTable.transform) {
		org.xml3d.debug.logError("Missing parameters for XFlow Forward Kinematics script!");
		return;
	}
	dataTable.parent.isXFlow = true;
	dataTable.transform.isXFlow = true;
	var parent = dataTable.parent.data;
	var transform = new Array();
	var numJoints = dataTable.transform.data.length / 16;
	var newPose = new Array();
	
	for (var i=0; i < numJoints*16;) {
		var matTransform = new XML3DMatrix(dataTable.transform.data.subarray(i, i+16));
		transform.push(matTransform);
		newPose.push(new XML3DMatrix());
		i+=16;
	}
	
	if (parent.length != numJoints)
		return;
	
	for (var i=0; i < numJoints; i++) {
		var parentIndex = parent[i];
		var curParentMatrix = new XML3DMatrix();
		
		if ( (parentIndex >= 0) && (parentIndex < numJoints)) {
			curParentMatrix = newPose[parentIndex];
		}
		
		var curMatrix = transform[i];
		curMatrix = curMatrix.multiply(curParentMatrix);
		
		newPose[i] = curMatrix;
	}
	var newPoseArray = new Float32Array(dataTable.transform.data.length);
	for (var i=0; i<numJoints; i++) {
		newPoseArray.set(newPose[i].transpose().toGL(), i*16);
	}
	
	dataTable.pose = { data : newPoseArray, tupleSize : 16 };
	
};

org.xml3d.xflow.matrixinterpolator = function(dataTable) {
	if (!dataTable.weight) {
		org.xml3d.debug.logError("Missing parameters for XFlow Matrix Interpolator script!");
		return;
	}
	dataTable.weight.isXFlow = true;
	var weights = dataTable.weight.data;
	//var transform = dataTable.transform.data;
	
	var weightValue = weights[0];
	var index1 = Math.floor(weightValue);
	var index2 = index1 + 1;
	
	
	
	var p1 = "transform"+index1;
	var p2 = "transform"+index2;
	
	var pose1 = dataTable[p1].data;
	var pose2 = dataTable[p2].data;
	
	if (pose1.length != pose2.length)
		return;
	
	var newPose = new Float32Array(pose1.length);
	var numMatrices = pose1.length / 16;
	
	var bv = weightValue - index1;
	var onembv = 1 - bv;
	
	for (var i=0; i < numMatrices*16;) {
		newPose[i] = pose1[i] * onembv + pose2[i] * bv;
		newPose[i+1] = pose1[i+1] * onembv + pose2[i+1] * bv;
		newPose[i+2] = pose1[i+2] * onembv + pose2[i+2] * bv;
		newPose[i+3] = pose1[i+3] * onembv + pose2[i+3] * bv;
		newPose[i+4] = pose1[i+4] * onembv + pose2[i+4] * bv;
		newPose[i+5] = pose1[i+5] * onembv + pose2[i+5] * bv;
		newPose[i+6] = pose1[i+6] * onembv + pose2[i+6] * bv;
		newPose[i+7] = pose1[i+7] * onembv + pose2[i+7] * bv;
		newPose[i+8] = pose1[i+8] * onembv + pose2[i+8] * bv;
		newPose[i+9] = pose1[i+9] * onembv + pose2[i+9] * bv;
		newPose[i+10] = pose1[i+10] * onembv + pose2[i+10] * bv;
		newPose[i+11] = pose1[i+11] * onembv + pose2[i+11] * bv;
		newPose[i+12] = pose1[i+12] * onembv + pose2[i+12] * bv;
		newPose[i+13] = pose1[i+13] * onembv + pose2[i+13] * bv;
		newPose[i+14] = pose1[i+14] * onembv + pose2[i+14] * bv;
		newPose[i+15] = pose1[i+15] * onembv + pose2[i+15] * bv;
		
		i += 16;
	}
	
	dataTable.transform = { data : newPose, tupleSize : 16 };
	for (var i=0;;i++) {
		if (dataTable["transform"+i]) {
			delete dataTable["transform"+i];
		}
		else
			break;
	}
	
};

org.xml3d.xflow.instance = function(dataTable) {
	
	if ((!dataTable.pose && !dataTable.transform) || !dataTable.texcoord || !dataTable.index) {
		org.xml3d.debug.logError("Missing parameters for XFlow Instance script!");
		return;
	}
	
	if (dataTable.transform && !dataTable.pose) {
		dataTable.pose = dataTable.transform;
	}
	dataTable.pose.isXFlow = true;
	var index = dataTable.index.data;
	var position = dataTable.position.data;
	var normal = dataTable.normal.data;
	var texcoord = dataTable.texcoord.data;
	var pose = dataTable.pose.data;
	var size = 1;
	if (dataTable.size) {
		size = dataTable.size.data[0];
	}
	
	var numIndices = index.length;
	var numVertices = position.length / 3;
	var numInstances = pose.length / 16;
	
	var newIndex = new Int32Array(numIndices * numInstances);
	var newPos = new Float32Array(numVertices*3 * numInstances);
	var newNorm = new Float32Array(numVertices*3 * numInstances);
	var newTexcoord = new Float32Array(numVertices*2 * numInstances);
	
	for (var j=0; j<numInstances; j++) {
		var matrix = new XML3DMatrix(pose.subarray(j*16, (j*16)+16)).transpose();
		
		for (var i=0; i < numIndices; i++) {
			var curIndex = index[i];
			curIndex += j * numVertices;
			
			var instanceIndex = j * numIndices + i;
			
			newIndex.set([curIndex], instanceIndex);
		}	
		
		for (var i=0; i < numVertices; i++) {
			var curPos = new XML3DVec3(position[i*3], position[i*3+1], position[i*3+2]);
			var curNorm = new XML3DVec3(normal[i*3], normal[i*3+1], normal[i*3+2]);
			
			var transformedPos = matrix.mulVec3b(curPos, 1).scale(size);
			var transformedNorm = matrix.mulVec3b(curNorm, 1);
			
			var instanceIndex = j * numVertices*3 + i*3;
			var texindex = j * numVertices*2 + i*2;
			
			newPos.set(transformedPos.toGL(), instanceIndex);
			newNorm.set(transformedNorm.normalize().toGL(), instanceIndex);
			newTexcoord.set([texcoord[i*2], texcoord[i*2+1]], texindex);
		}	
	}
	
	dataTable.index = { data : newIndex, tupleSize : 1 };
	dataTable.position = { data : newPos, tupleSize : 3 };
	dataTable.normal = { data : newNorm, tupleSize : 3 };
	dataTable.texcoord = { data : newTexcoord, tupleSize : 2 };
	if (dataTable.size)
		delete dataTable.size;
	

};
/*************************************************************************/
/*                                                                       */
/*  xml3d_scene_controller.js                                            */
/*  Navigation method for XML3D						                     */
/*                                                                       */
/*  Copyright (C) 2010                                                   */
/*  DFKI - German Research Center for Artificial Intelligence            */
/*                                                                       */
/*  This file is part of xml3d.js                                        */
/*                                                                       */
/*  xml3d.js is free software; you can redistribute it and/or modify     */
/*  under the terms of the GNU General Public License as                 */
/*  published by the Free Software Foundation; either version 2 of       */
/*  the License, or (at your option) any later version.                  */
/*                                                                       */
/*  xml3d.js is distributed in the hope that it will be useful, but      */
/*  WITHOUT ANY WARRANTY; without even the implied warranty of           */
/*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.                 */
/*  See the GNU General Public License                                   */
/*  (http://www.fsf.org/licensing/licenses/gpl.html) for more details.   */
/*                                                                       */
/*************************************************************************/

//Check, if basics have already been defined
var org;
if (!org || !org.xml3d)
  throw new Error("xml3d.js has to be included first");

if (!org.xml3d.util)
	org.xml3d.util = {};
else if (typeof org.xml3d.util != "object")
	throw new Error("org.xml3d.util already exists and is not an object");

org.xml3d.util.Timer = function() {
	this.start();
};

org.xml3d.util.Timer.prototype.restart = function() {
	var prevTime = this.time;
	this.start();
	return this.time - prevTime;
};

org.xml3d.util.Timer.prototype.start = function() {
	this.time = new Date().getTime();
};


org.xml3d.Camera = function(view) {
	this.view = view;
};

org.xml3d.Camera.prototype.__defineGetter__("orientation", function() { return this.view.orientation; });
org.xml3d.Camera.prototype.__defineGetter__("position", function() { return this.view.position; });
org.xml3d.Camera.prototype.__defineSetter__("orientation", function(orientation) { /*org.xml3d.debug.logError("Orientation: " + orientation);*/ this.view.orientation = orientation; });
org.xml3d.Camera.prototype.__defineSetter__("position", function(position) { this.view.position = position; });
org.xml3d.Camera.prototype.__defineGetter__("direction", function() { return this.view.getDirection(); });
org.xml3d.Camera.prototype.__defineGetter__("upVector", function() { return this.view.getUpVector(); });
org.xml3d.Camera.prototype.__defineGetter__("fieldOfView", function() { return this.view.fieldOfView; });

org.xml3d.Camera.prototype.rotateAroundPoint = function(q0, p0) {
	//org.xml3d.debug.logError("Orientation: " + this.orientation.multiply(q0).normalize());
	var tmp = this.orientation.multiply(q0);
	tmp.normalize();
	this.orientation = tmp;
	var trans = new XML3DRotation(this.inverseTransformOf(q0.axis), q0.angle).rotateVec3(this.position.subtract(p0));
	this.position = p0.add(trans);
};

org.xml3d.Camera.prototype.lookAround = function(rotSide, rotUp, upVector) {
	//org.xml3d.debug.logError("Orientation: " + this.orientation.multiply(q0).normalize());
	var check = rotUp.multiply(this.orientation);
	var tmp;
	if( Math.abs(upVector.dot(check.rotateVec3(new XML3DVec3(0,0,-1)))) > 0.95 )
		tmp = rotSide;
    else
	    tmp = rotSide.multiply(rotUp);
	tmp.normalize();
	tmp = tmp.multiply(this.orientation);
	tmp.normalize();
	this.orientation = tmp;
};

org.xml3d.Camera.prototype.rotate = function(q0) {
	this.orientation = this.orientation.multiply(q0).normalize();
};

org.xml3d.Camera.prototype.translate = function(t0) {
	this.position = this.position.add(t0);
};

org.xml3d.Camera.prototype.inverseTransformOf = function(vec) {
	return this.orientation.rotateVec3(vec);
};

org.xml3d.Xml3dSceneController = function(xml3d) {
	this.webgl = typeof(xml3d.style) !== 'object';
	
	this.xml3d = xml3d;
	this.canvas = this.webgl ?  xml3d.canvas : xml3d;
	
	var view = this.getView();
	if (!view)
	{
		org.xml3d.debug.logWarning("No view found, rendering disabled!");
		if (xml3d.update)
			xml3d.update(); // TODO: Test
	}
	if (!this.xml3d || !view)
	{
		org.xml3d.debug.logError("Could not initialize Camera Controller.");
		return;
	}
	
	this.camera = new org.xml3d.Camera(view);
	this.timer = new org.xml3d.util.Timer();
	this.prevPos = {x: -1, y: -1};
	
	this.mode = "examine";
	this.revolveAroundPoint = new XML3DVec3(0, 0, 0);
	this.rotateSpeed = 1;
	this.zoomSpeed = 20;
	this.spinningSensitivity = 0.3;
	this.isSpinning = false;
	
	this.upVector = this.camera.upVector;
	
	this.moveSpeedElement = document.getElementById("moveSpeed");
	this.useKeys = document.getElementById("useKeys");
	
	var navigations = xml3d.getElementsByTagName("navigation");
	
	if(navigations.length > 0)
	{
		var config = navigations[0];
		this.mode = config.getAttribute("mode");

		if(this.mode == "none")
			return;
		
		if(this.mode != "walk" && this.mode != "examine" )
			this.mode = "examine";

		if(config.getAttribute("resolveAround")){
			org.xml3d.debug.logWarning("resolveAround is obsolete. Use 'revolveAround' instead!");
			this.revolveAroundPoint.setVec3Value(config.getAttribute("resolveAround"));
		}
		if(config.getAttribute("revolveAround")){
			this.revolveAroundPoint.setVec3Value(config.getAttribute("revolveAround"));
		}
		if(config.getAttribute("speed"))
		{
			this.zoomSpeed *= config.getAttribute("speed");
		}
	}

	this.attach();
};

org.xml3d.Xml3dSceneController.prototype.setCamera = function(newCamera) {
	this.camera = new org.xml3d.Camera(newCamera);
	this.upVector = this.camera.upVector;
};

org.xml3d.Xml3dSceneController.prototype.setRevolvePoint = function(vec) {
	this.revolveAroundPoint = vec;
};

org.xml3d.Xml3dSceneController.prototype.attach = function() {
	var self = this;
	this._evt_mousedown = function(e) {self.mousePressEvent(e);};
	this._evt_mouseup = function(e) {self.mouseReleaseEvent(e);};
	this._evt_mousemove = function(e) {self.mouseMoveEvent(e);};
	this._evt_contextmenu = function(e) {self.stopEvent(e);};
	this._evt_keydown = function(e) {self.keyHandling(e);};
	
	this.canvas.addEventListener("mousedown", this._evt_mousedown, false);
	document.addEventListener("mouseup", this._evt_mouseup, false);
	document.addEventListener("mousemove",this._evt_mousemove, false);
	this.canvas.addEventListener("contextmenu", this._evt_contextmenu, false);
	if (this.useKeys)
		document.addEventListener("keydown", this._evt_keydown, false);
};

org.xml3d.Xml3dSceneController.prototype.detach = function() {
	this.canvas.removeEventListener("mousedown", this._evt_mousedown, false);
	document.removeEventListener("mouseup", this._evt_mouseup, false);
	document.removeEventListener("mousemove",this._evt_mousemove, false);
	this.canvas.removeEventListener("contextmenu", this._evt_contextmenu, false);
	if (this.useKeys)
		document.removeEventListener("keydown", this._evt_keydown, false);
};

org.xml3d.Xml3dSceneController.prototype.__defineGetter__("width", function() { return this.canvas.width;});
org.xml3d.Xml3dSceneController.prototype.__defineGetter__("height", function() { return this.canvas.height;});

org.xml3d.Xml3dSceneController.prototype.getView = function() {
	//var activeView = null;
	var activeView = this.xml3d.activeView; //? this.xml3d.activeView : this.xml3d.getAttribute("activeView");
	org.xml3d.debug.logWarning("Active View: " + activeView);
	
	if (typeof activeView=="string")
	{
		if (activeView.indexOf('#') == 0)
			activeView = activeView.replace('#', '');
		org.xml3d.debug.logWarning("Trying to resolve view '" + activeView +"'");
		activeView = document.getElementById(activeView);
	}
	
	// if activeView is not defined or the reference is not valid
	// use the first view element
	if (!activeView)
	{
		org.xml3d.debug.logWarning("No view referenced. Trying to use first view.");
		activeView =  document.evaluate('//xml3d:xml3d//xml3d:view[1]', document, function() {
			return org.xml3d.xml3dNS;
		}, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
	}
	
	if(!activeView)
	{
		// no view present at all
		// create new one and append it to defs element
		org.xml3d.debug.logWarning("No view defined. Trying to create view.");
		
		// create it
		activeView = document.createElementNS(org.xml3d.xml3dNS, "view");
		
		var id = "created_org.xml3d.Xml3dSceneController.view_"; 
		id += "" + Math.random(); 
		activeView.setAttribute("id", id); 
		
		// append it to defs 
		var defsEl =  document.evaluate('//xml3d:xml3d//xml3d:defs[1]', document, function() {
			return org.xml3d.xml3dNS;
		}, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
		
		if(!defsEl)
		{
			defsEl = document.createElementNS(org.xml3d.xml3dNS, "defs");
			this.xml3d.appendChild(defsEl); 
		}
		
		defsEl.appendChild(activeView);
	}
	
	return activeView;
};

org.xml3d.Xml3dSceneController.prototype.stopEvent = function(ev) {
	if (ev.preventDefault)
		ev.preventDefault();
	if (ev.stopPropagation) 
		ev.stopPropagation();
	ev.returnValue = false;
};

org.xml3d.Xml3dSceneController.prototype.update = function() {
	if (this.animation || this.needUpdate) {
		this.needUpdate = false;
		if (this.xml3d.update)
			this.xml3d.update();
	}
};

org.xml3d.Xml3dSceneController.prototype.NO_MOUSE_ACTION = 0;
org.xml3d.Xml3dSceneController.prototype.TRANSLATE = 1;
org.xml3d.Xml3dSceneController.prototype.DOLLY = 2;
org.xml3d.Xml3dSceneController.prototype.ROTATE = 3;
org.xml3d.Xml3dSceneController.prototype.LOOKAROUND = 4;

org.xml3d.Xml3dSceneController.prototype.mousePressEvent = function(event) {

	ev = event || window.event;

	var button = (ev.which || ev.button);
	switch (button) {
		case 1:
			if(this.mode == "examine")
				this.action = this.ROTATE;
			else
				this.action = this.LOOKAROUND;
			break;
		case 2:
			this.action = this.TRANSLATE;
			break;
		case 3:
			this.action = this.DOLLY;
			break;
		default:
			this.action = this.NO_MOUSE_ACTION;
	}
	
	this.prevPos.x = ev.pageX;
	this.prevPos.y = ev.pageY;

	this.stopEvent(event);
	return false;
};

org.xml3d.Xml3dSceneController.prototype.mouseReleaseEvent = function(event) {
	this.stopEvent(event);
	
	//if (this.action == this.ROTATE && this.mouseSpeed > this.spinningSensitivity)
	//	this.startSpinning();
	
	this.action = this.NO_MOUSE_ACTION;
	return false;
};

org.xml3d.Xml3dSceneController.prototype.startSpinning = new function() {
	this.isSpinning = true;
	// TODO
};

org.xml3d.Xml3dSceneController.prototype.computeMouseSpeed = function(event) {
	var dx = (event.pageX - this.prevPos.x);
	var dy = (event.pageY - this.prevPos.y);
	var dist = Math.sqrt(+dx*dx + dy*+dy);
	this.delay = this.timer.restart();
	if (this.delay == 0)
	    this.mouseSpeed = dist;
	  else
	    this.mouseSpeed = dist/this.delay;
	org.xml3d.debug.logWarning("Mouse speed: " + this.mouseSpeed);
};

org.xml3d.Xml3dSceneController.prototype.mouseMoveEvent = function(event, camera) {

	ev = event || window.event;
	if (!this.action)
		return;
	switch(this.action) {
		case(this.TRANSLATE):
			var f = 2.0* Math.tan(this.camera.fieldOfView/2.0) / this.height;
			var dx = f*(ev.pageX - this.prevPos.x);
			var dy = f*(ev.pageY - this.prevPos.y);
			var trans = new XML3DVec3(dx, dy, 0.0);
			this.camera.translate(this.camera.inverseTransformOf(trans));
			break;
		case(this.DOLLY):
			var dy = this.zoomSpeed * (ev.pageY - this.prevPos.y) / this.height;
			this.camera.translate(this.camera.inverseTransformOf(new XML3DVec3(0, 0, dy)));
			break;
		case(this.ROTATE):
			
			var dx = -this.rotateSpeed * (ev.pageX - this.prevPos.x) * 2.0 * Math.PI / this.width;
			var dy = -this.rotateSpeed * (ev.pageY - this.prevPos.y) * 2.0 * Math.PI / this.height;

			var mx = new XML3DRotation(new XML3DVec3(0,1,0), dx);
			var my = new XML3DRotation(new XML3DVec3(1,0,0), dy);
			//this.computeMouseSpeed(ev);
			this.camera.rotateAroundPoint(mx.multiply(my), this.revolveAroundPoint);
			break;
		case(this.LOOKAROUND):
			var dx = -this.rotateSpeed * (ev.pageX - this.prevPos.x) * 2.0 * Math.PI / this.width;
			var dy = this.rotateSpeed * (ev.pageY - this.prevPos.y) * 2.0 * Math.PI / this.height;
			var cross = this.upVector.cross(this.camera.direction);

			var mx = new XML3DRotation( this.upVector , dx);
			var my = new XML3DRotation( cross , dy);
			
			this.camera.lookAround(mx, my, this.upVector);
			break;
	}
	
	if (this.action != this.NO_MOUSE_ACTION)
	{
		this.needUpdate = true;
		this.prevPos.x = ev.pageX;
		this.prevPos.y = ev.pageY;
		event.returnValue = false;
        
		this.update();
	}
	this.stopEvent(event);
	return false;
};



// -----------------------------------------------------
// key movement
// -----------------------------------------------------

org.xml3d.Xml3dSceneController.prototype.keyHandling = function(e) {
	var KeyID = e.keyCode;
	if (KeyID == 0) {
		switch (e.which) {
		case 119:
			KeyID = 87;
			break; // w
		case 100:
			KeyID = 68;
			break; // d
		case 97:
			KeyID = 65;
			break; // a
		case 115:
			KeyID = 83;
			break; // s
		}
	}

	var xml3d = this.xml3d;
	// alert(xml3d);
	var camera = this.camera;
	var dir = camera.direction;
	if (xml3d) {
		switch (KeyID) {
		case 38: // up
		case 87: // w
			camera.position = camera.position.add(dir.scale(this.zoomSpeed));
			break;
		case 39: // right
		case 68: // d
			var np = camera.position;
			np.x -= dir.z * this.zoomSpeed;
			np.z += dir.x * this.zoomSpeed;
			camera.position = np;
			break;
		case 37: // left
		case 65: // a
			var np = camera.position;
			np.x += dir.z * this.zoomSpeed;
			np.z -= dir.x * this.zoomSpeed;
			camera.position = np;
			break;
		case 40: // down
		case 83: // s
			camera.position = camera.position.subtract(dir.scale(this.zoomSpeed));
			break;

		default:
			return;
		}
		this.needUpdate = true;
	}
	this.stopEvent(e);
};

//-----------------------------------------------------
//attach/detach of all controllers
//-----------------------------------------------------
org.xml3d.Xml3dSceneController.attachAllControllers = function() { 
	
	org.xml3d.debug.logInfo("Attaching all active controllers to xml3d elements."); 
	
	var xml3dList = Array.prototype.slice.call( document.getElementsByTagNameNS(org.xml3d.xml3dNS, 'xml3d') );
	for(var node in xml3dList) {
		org.xml3d.Xml3dSceneController.controllers[node].attach(); 
	}
};

org.xml3d.Xml3dSceneController.detachAllControllers = function() { 
	
	org.xml3d.debug.logInfo("Detaching all active controllers from xml3d elements."); 
	
	var xml3dList = Array.prototype.slice.call( document.getElementsByTagNameNS(org.xml3d.xml3dNS, 'xml3d') );
	for(var node in xml3dList) {
		org.xml3d.Xml3dSceneController.controllers[node].detach(); 
	}
};

//-----------------------------------------------------
//loading/unloading
//-----------------------------------------------------

(function() {

	var onload = function() {
		if (!org.xml3d._rendererFound)
			return;
			
		var xml3dList = Array.prototype.slice.call( document.getElementsByTagNameNS(org.xml3d.xml3dNS, 'xml3d') );

		org.xml3d.Xml3dSceneController.controllers = new Array();
		for(var node in xml3dList) {
			org.xml3d.debug.logInfo("Attaching Controller to xml3d element.");
			org.xml3d.Xml3dSceneController.controllers[node] = new org.xml3d.Xml3dSceneController(xml3dList[node]);
		};
	};
	var onunload = function() {
		for(var i in org.xml3d.Xml3dSceneController.controllers)
		{
			org.xml3d.Xml3dSceneController.controllers[i].detach();
		}
	};
	
	window.addEventListener('load', onload, false);
	window.addEventListener('unload', onunload, false);
	window.addEventListener('reload', onunload, false);

})();

/***********************************************************************/