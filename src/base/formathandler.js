(function() {

    /**
     * A format handler is provide functionality for detecting format of resources
     * and providing format-specific services.
     * FormatHandlers are registered with XML3D.base.resourceManager.registerFormat() function.
     * @constructor
     */
    var FormatHandler = function() {
        this.factories = {}; // a map from an aspect name to a factory class
    };

    FormatHandler.prototype.registerFactoryClass = function(factoryClass) {
        if (!factoryClass.aspect || !XML3D.isSuperclassOf(XML3D.base.AdapterFactory, factoryClass))
            throw new Error("factoryClass must be a subclass of XML3D.base.AdapterFactory");
        this.factories[factoryClass.aspect] = factoryClass;
    }

    /**
     * Returns true if response data format is supported.
     * response, responseType, and mimetype values are returned by XMLHttpRequest.
     * Data type of the response is one of ArrayBuffer, Blob, Document, String, Object.
     * responseType is one of "", "arraybuffer", "blob", "document", "json", "text"
     *
     * @override
     * @param {Object} response
     * @param {string} responseType
     * @param {string} mimetype
     * @return {Boolean}
     */
    FormatHandler.prototype.isFormatSupported = function(response, responseType, mimetype) {
        return false;
    }

    /**
     * Converts response data to format data.
     * Default implementation returns value of response.
     *
     * @override
     * @param {Object} response
     * @param {string} responseType
     * @param {string} mimetype
     * @return {Object}
     */
    FormatHandler.prototype.getFormatData = function(response, responseType, mimetype) {
        return response;
    }

    /**
     * Extracts data for a fragment from document data and fragment reference.
     *
     * @override
     * @param {Object} documentData
     * @param {string} fragment Fragment without pound key which defines the part of the document
     * @return {*}
     */
    FormatHandler.prototype.getFragmentData = function(documentData, fragment) {
        if (!fragment)
            return documentData;
        return null;
    }

    // Export
    XML3D.base.FormatHandler = FormatHandler;

    /**
     * XMLFormatHandler supports all XML and HTML-based documents.
     * @constructor
     */
    var XMLFormatHandler = function() {
    }

    XMLFormatHandler.prototype.isFormatSupported = function(response, responseType, mimetype) {
        return response && response.nodeType === 9 && (mimetype === "application/xml" || mimetype === "text/xml");
    }

    XMLFormatHandler.prototype.getFormatData = function(response, responseType, mimetype) {
        return response;
    }

    XMLFormatHandler.prototype.getFragmentData = function(documentData, fragment) {
        return documentData.querySelectorAll("*[id="+fragment+"]")[0];
    }

    XML3D.createClass(XMLFormatHandler, FormatHandler);

    // Export
    XML3D.base.XMLFormatHandler = XMLFormatHandler;

    var XML3DFormatHandler = function() {
    }

    XML3DFormatHandler.prototype.isFormatSupported = function(response, responseType, mimetype) {
        var supported = XMLFormatHandler.prototype.isFormatSupported.call(this, response, responseType, mimetype);
        // FIXME add check by searching for 'xml3d' tags in the document
        return supported;
    }

    XML3DFormatHandler.prototype.getFormatData = function(response, responseType) {
        // Configure all xml3d elements:
        var xml3dElements = response.querySelectorAll("xml3d");
        for(var i = 0; i < xml3dElements.length; ++i) {
            XML3D.config.element(xml3dElements[i]);
        }

        return response;
    }

    XML3D.createClass(XML3DFormatHandler, XMLFormatHandler);

    // Export
    XML3D.base.XML3DFormatHandler = XML3DFormatHandler;

    var JSONFormatHandler = function() {
    }

    JSONFormatHandler.prototype.isFormatSupported = function(response, responseType, mimetype) {
        return mimetype === "application/json";
    }

    JSONFormatHandler.prototype.getFormatData = function(response, responseType, mimetype) {
        return response;
    }

    XML3D.createClass(JSONFormatHandler, FormatHandler);

    // Export
    XML3D.base.JSONFormatHandler = JSONFormatHandler;

    var BinaryFormatHandler = function() {
    }

    XML3D.createClass(BinaryFormatHandler, FormatHandler);

    // Export
    XML3D.base.BinaryFormatHandler = BinaryFormatHandler;

}());
