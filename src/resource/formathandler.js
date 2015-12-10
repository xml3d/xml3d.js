
/**
 * A format handler is provide functionality for detecting format of resources
 * and providing format-specific services.
 * FormatHandlers are registered with XML3D.resource.registerFormat() function.
 * @constructor
 */
var FormatHandler = function() {
};

//noinspection JSUnusedLocalSymbols
/**
 * Returns true if response data format is supported.
 * response is a Response object as defined by the Fetch API.
 * This function should not read the body of the response without cloning it first.
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
FormatHandler.prototype.getFormatData = function (response) {
    return Promise.resolve(response);
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
 * Returns an Adapter for the given aspect. Should be overridden.
 * @param {Object} data
 * @param {String} aspect
 * @param {?Number} canvasId
 * @returns {Adapter}
 */
FormatHandler.prototype.getAdapter = function(data, aspect, canvasId) {
    return null;
};

module.exports = FormatHandler;
