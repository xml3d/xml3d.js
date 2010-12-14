/*************************************************************************/
/*                                                                       */
/*  xml3d_physics.js                                                     */
/*  Communication with physics simulation plugin 						 */
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
//-------------------------------------------------------------------
// XML3D Physics loader
//-------------------------------------------------------------------

var xml3dPhysics;
if(xml3dPhysics)
	throw new Error("xml3d_physics.js already included");
	
xml3dPhysics = document.createElement('object');
xml3dPhysics.setAttribute('type', 'application/xml3d-physics');
xml3dPhysics.setAttribute('width', '0');
xml3dPhysics.setAttribute('height', '0');
document.body.appendChild(xml3dPhysics);

//-------------------------------------------------------------------
// XPath functions

function __physicsNSResolver(prefix) {  
	var ns = {  
		'xhtml' : 'http://www.w3.org/1999/xhtml',  
		'xml3d': 'http://www.xml3d.org/2009/xml3d',
		'physics' : "http://www.xml3d.org/2010/physics"
	};  
	return ns[prefix] || null;
}  
var __physicsXPathEvaluator = new XPathEvaluator(); 
function __physicsEvaluateXPath(expr) {  
	var result = __physicsXPathEvaluator.evaluate(expr, document, 
		__physicsNSResolver, XPathResult.ANY_TYPE, null);  
	var found = [];  
	var res;  
	while (res = result.iterateNext())  
		found.push(res);  
	return found;  
}

/*	function returning only one object */
function __physicsEvaluateXPath1(expr) {  
	var result = __physicsXPathEvaluator.evaluate(expr, document, 
		__physicsNSResolver, XPathResult.ANY_TYPE, null);  
	return result.iterateNext();
}
function __physicsEvaluateXPathOnObject1(object, expr) {
	var xPathExpression = __physicsXPathEvaluator.createExpression(expr, __physicsNSResolver);  
	var result = xPathExpression.evaluate(object, XPathResult.ANY_TYPE, null);
	var attr = result.iterateNext();
	if(attr) return attr.value;
	else return '';
}

//-------------------------------------------------------------------
// Physics transform manipulation funcion

// Using __physicsUpdateTransform, instead of direct commands to the
// document, also prevents Firefox from using old javascript update 
// commands to be propagated in documents, that are opened after a 
// previous plugin instance.
function __physicsUpdateTransform(id, translation, rotation) {
	var obj = document.getElementById(id);
	if(!obj) {
		return;
	}
	obj.setAttribute('translation', translation);
	obj.setAttribute('rotation', rotation);
}

//-------------------------------------------------------------------
// initialize plugin

// Wait for initialization until plugin has finished initalizing.
function __physicsInitializeWait() {
	if(typeof xml3dPhysics.initialize == 'undefined' ||
		!xml3dPhysics.initialize){
		window.setTimeout(__physicsInitializeWait, 50);
	} else {
		xml3dPhysics.initialize();
	}
}
__physicsInitializeWait();

//-------------------------------------------------------------------
// DOM event handlers

/*function __physicsAttrMod(event) {
	alert("setattr");
}*/

function __physicsNodeInserted(event) {
	if(event.target.tagName == "group") {
		var parentNode = event.target.parentNode;
		var parentNodePhysicsId = parentNode.getAttribute('physics:id');
		if(parentNodePhysicsId.length == 0)
			return;
			
		xml3dPhysics.domGroupInserted(event.target, parentNodePhysicsId);
	}
}

function __physicsNodeRemoved(event) {
	if(event.target.tagName == "group") {
		var node = event.target;
		var nodePhysicsId = node.getAttribute('physics:id');
		if(nodePhysicsId.length == 0)
			return;
		
		xml3dPhysics.domGroupRemoved(nodePhysicsId);
	}
}

if(!document.implementation.hasFeature('MutationEvents','2.0') && !window.MutationEvent)
	alert("Warning: DOM2 mutation events not supported.");

var __physicsXml3dElements = document.getElementsByTagName("xml3d");
if(__physicsXml3dElements.length) {
	__physicsXml3dElements[0].addEventListener('DOMNodeInserted', __physicsNodeInserted, false);
	__physicsXml3dElements[0].addEventListener('DOMNodeRemoved', __physicsNodeRemoved, false);
}

//-------------------------------------------------------------------
// Extend interface

xml3dPhysics.getPhysicsObjectByElement = function(element) {
	if(element.tagName != 'group') return null;
	var physicsId = __physicsEvaluateXPathOnObject1(element, '@physics:id');
	if(!physicsId || !physicsId.length) return null;
	return this.getPhysicsObjectByPhysicsId(physicsId);
}

//-------------------------------------------------------------------
// Ghost object callbacks

var __physicsGhostCallbacks = new Array();

function __physicsGhostCallback(ghostId, objId) {
	var func = __physicsGhostCallbacks[ghostId];
	if(func) 
		func(objId);
}

function physicsSetGhostEventListener(ghostId, func) {
	__physicsGhostCallbacks[ghostId] = func;
}

//-------------------------------------------------------------------
