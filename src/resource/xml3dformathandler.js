var XML3DDataAdapterFactory = require("../data/adapter/factory.js");
var RenderAdapterFactory = require("../renderer/renderer/adapter/factory.js");
var config = require("../interface/elements.js").config;

/**
 *
 * @constructor
 * @extends FormatHandler
 */
var XML3DFormatHandler = function () {
    XML3D.resource.FormatHandler.call(this);
    this.renderAdapterFactories = {};
    this.dataAdapterFactory = new XML3DDataAdapterFactory();
};
XML3D.createClass(XML3DFormatHandler, XML3D.resource.FormatHandler);

XML3DFormatHandler.prototype.isFormatSupported = function (response) {
    if (response.headers.has("Content-Type")) {
        return response.headers.get("Content-Type") === "application/xml";
    }
    if (response.url.match(/\.xml/)) {
        return true;
    }
};

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

XML3DFormatHandler.prototype.getFragmentData = function (documentData, fragment) {
    return documentData.querySelector("*[id='" + fragment + "']");
};

XML3DFormatHandler.prototype.getAdapter = function(node, aspect, canvasId) {
    if (aspect === "scene") {
        if (canvasId === undefined) {
            throw new Error("A canvas ID corresponding to an XML3D element must be provided when creating an adapter with the 'scene' aspect");
        }
        if (!this.renderAdapterFactories[canvasId]) {
            this.renderAdapterFactories[canvasId] = new RenderAdapterFactory(canvasId);
        }
        return this.renderAdapterFactories[canvasId].getAdapter(node);
    }
    if (aspect === "data") {
        return this.dataAdapterFactory.getAdapter(node);
    }

    throw new Error("Encountered an unknown aspect '"+aspect+"'");
};

XML3DFormatHandler.prototype.getFactory = function(aspect, canvasId) {
    if (aspect === "scene") {
        if (!this.renderAdapterFactories[canvasId]) {
            this.renderAdapterFactories[canvasId] = new RenderAdapterFactory(canvasId);
        }
        return this.renderAdapterFactories[canvasId];
    }
};

var xml3dFormatHandler = new XML3DFormatHandler();
XML3D.resource.registerFormat(xml3dFormatHandler);
XML3D.xml3dFormatHandler = xml3dFormatHandler;

module.exports = {
    XML3DFormatHandler : XML3DFormatHandler
};