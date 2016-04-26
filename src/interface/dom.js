var config = require("./elements.js").config;
var classInfo = require("./configuration.js").classInfo;

var doc = {};
var nativeGetElementById = document.getElementById;
doc.getElementById = function(id) {
    var elem = nativeGetElementById.call(this, id);
    if (elem) {
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
var nativeCreateElementNS = document.createElementNS;
doc.createElementNS = function(ns, name) {
    var r = nativeCreateElementNS.call(this, ns, name);
    if (ns == XML3D.xml3dNS || classInfo[name.toLowerCase()]) {
        config.element(r);
    }
    return r;
};
var nativeCreateElement = document.createElement;
doc.createElement = function(name) {
    var r = nativeCreateElement.call(this, name);
    if (classInfo[name.toLowerCase()] ) {
        config.element(r);
    }
    return r;
};
//var nativeRegisterElement = document.registerElement;
//doc.registerElement = function(tagName, opt) {
//    var r = nativeRegisterElement.call(this, tagName, opt);
//    var matches = document.querySelectorAll(tagName);
//    // Detach and re-attach all matching web component instances to re-initialize them
//    for (var i=0; i < matches.length; i++) {
//        var parent = matches[i].parentNode;
//        parent.removeChild(matches[i]);
//        parent.appendChild(matches[i]);
//    }
//    return r;
//};

XML3D.extend(window.document, doc);
