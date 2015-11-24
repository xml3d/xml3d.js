var AdapterFactory = require("./adapter.js").AdapterFactory;
var registerFormat = require("../resource/resourcefetcher.js").registerFormat;
var config = require("../interface/elements.js").config;

/**
 * A format handler is provide functionality for detecting format of resources
 * and providing format-specific services.
 * FormatHandlers are registered with XML3D.base.registerFormat() function.
 * @constructor
 */
var FormatHandler = function() {
    this.factoryClasses = {}; // a map from an aspect name to a factory class
    this.factoryCache = {}; // maps unique keys (aspect + "_" + canvasId) to the factory instance
};

FormatHandler.prototype.registerFactoryClass = function (factoryClass) {
    if (!factoryClass.prototype.aspect )
        throw new Error("factoryClass must be a subclass of XML3D.base.AdapterFactory");
    this.factoryClasses[factoryClass.prototype.aspect] = factoryClass;
};

FormatHandler.prototype.getFactoryClassByAspect = function (aspect) {
    return this.factoryClasses[aspect];
};

FormatHandler.prototype.getFactory = function (aspect, canvasId) {
    canvasId = canvasId || 0;
    var key = aspect + "_" + canvasId;
    var factory = this.factoryCache[key];
    if (!factory) {
        var factoryClass = this.getFactoryClassByAspect(aspect);
        if (!factoryClass)
            return null;
        factory = new factoryClass(canvasId);
        this.factoryCache[key] = factory;
    }
    return factory;
};

//noinspection JSUnusedLocalSymbols
/**
 * Returns true if response data format is supported.
 * response, responseType, and mimetype values are returned by XMLHttpRequest.
 * Data type of the response is one of ArrayBuffer, Blob, Document, String, Object.
 * responseType is one of "", "arraybuffer", "blob", "document", "json", "text"
 *
 * @override
 * @param {Object} response
 * @return {Boolean}
 */
FormatHandler.prototype.isFormatSupported = function (response) {
    return false;
};

/**
 * Converts response data to format data.
 * Default implementation returns value of response.
 *
 * @override
 * @param {Object} response
 * @param {function} callback
 * @return {Object}
 */
FormatHandler.prototype.getFormatData = function (response, callback) {
    callback(response);
};

/**
 * Extracts data for a fragment from document data and fragment reference.
 *
 * @override
 * @param {Object} documentData
 * @param {string} fragment Fragment without pound key which defines the part of the document
 * @return {*}
 */
FormatHandler.prototype.getFragmentData = function (documentData, fragment) {
    if (!fragment)
        return documentData;
    return null;
};

/**
 * XMLFormatHandler supports all XML and HTML-based documents.
 * @constructor
 * @extends FormatHandler
 */
var XMLFormatHandler = function () {
    FormatHandler.call(this);
};
XML3D.createClass(XMLFormatHandler, FormatHandler);

XMLFormatHandler.prototype.isFormatSupported = function (response) {
    if (response.headers.has("Content-Type")) {
        return response.headers.get("Content-Type") === "application/xml";
    }
    if (response.url.match(/\.xml/)) {
        return true;
    }
};

XMLFormatHandler.prototype.getFormatData = function (response, callback) {
    callback(response);
};

XMLFormatHandler.prototype.getFragmentData = function (documentData, fragment) {
    return documentData.querySelectorAll("*[id='" + fragment + "']")[0];
};


/**
 *
 * @constructor
 * @extends FormatHandler
 */
var XML3DFormatHandler = function () {
    XMLFormatHandler.call(this);
};
XML3D.createClass(XML3DFormatHandler, XMLFormatHandler);

XML3DFormatHandler.prototype.getFormatData = function (response, callback) {
    response.text().then(function(responseText) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(responseText, "text/xml");

        var xml3dElements = doc.querySelectorAll("xml3d");
        for (var i = 0; i < xml3dElements.length; ++i) {
            config.element(xml3dElements[i]);
        }
        callback(doc);
    });
};

/**
 * @constructor
 * @extends FormatHandler
 */
var JSONFormatHandler = function () {
    FormatHandler.call(this);
};
XML3D.createClass(JSONFormatHandler, FormatHandler);

JSONFormatHandler.prototype.isFormatSupported = function (response) {
    if (response.headers.has("Content-Type")) {
        return response.headers.get("Content-Type") === "application/json";
    }
    if (response.url.match(/\.json/)) {
        return true;
    }
};

var xml3dFormatHandler = new XML3DFormatHandler();
registerFormat(xml3dFormatHandler);
XML3D.xml3dFormatHandler = xml3dFormatHandler;
XML3D.resource.FormatHandler = FormatHandler;
XML3D.resource.JSONFormatHandler = JSONFormatHandler;

module.exports = {
    JSONFormatHandler: JSONFormatHandler,
    XMLFormatHandler: XMLFormatHandler,
    XML3DFormatHandler: XML3DFormatHandler,
    FormatHandler: FormatHandler,
    xml3dFormatHandler: xml3dFormatHandler
};
