var Resource = require("../base/resourcemanager.js").Resource;
var sendAdapterEvent = require("../utils/misc.js").sendAdapterEvent;
var callAdapterFunc = require("../utils/misc.js").callAdapterFunc;
var CSS = require("../utils/css.js");

var Vec3 = require("../types/vec3.js");
var Quat = require("../types/quat.js");
var Mat4 = require("../types/mat4.js");
var AxisAngle = require("../types/axisangle.js");
var vec3 = require("gl-matrix").vec3;

var methods = {};

methods.xml3dGetElementByRay = function(ray, hitPoint, hitNormal) {
    XML3D.flushDOMChanges();
    XML3D.flushCSSChanges();
    var adapters = this._configured.adapters || {};
    for (var adapter in adapters) {
        if (adapters[adapter].getElementByRay) {
            return adapters[adapter].getElementByRay(ray, hitPoint, hitNormal);
        }
    }
    return null;
};

methods.viewGetViewMatrix = function() {
    XML3D.flushDOMChanges();
    var adapters = this._configured.adapters || {};
    for ( var adapter in adapters) {
        if (adapters[adapter].getViewMatrix) {
            return adapters[adapter].getViewMatrix();
        }
    }
    // Fallback implementation
    var result = new XML3D.Mat4();
    var cssMatrix = CSS.getCSSMatrix(this);
    if(cssMatrix) {
        CSS.convertCssToMat4(cssMatrix, result);
    }
    return result.invert();
};

methods.viewGetProjectionMatrix = function() {
    XML3D.flushDOMChanges();
    var adapters = this._configured.adapters || {};
    for ( var adapter in adapters) {
        if (adapters[adapter].getProjectionMatrix) {
            return adapters[adapter].getProjectionMatrix();
        }
    }
    return null;
};

methods.xml3dGetElementByPoint = function(x, y, hitPoint, hitNormal) {
    XML3D.flushDOMChanges();
    XML3D.flushCSSChanges();
    var adapters = this._configured.adapters || {};
    for (var adapter in adapters) {
        if (adapters[adapter].getElementByPoint) {
            return adapters[adapter].getElementByPoint(x, y, hitPoint, hitNormal);
        }
    }
    return null;
};

methods.xml3dGenerateRay = function(x, y) {
    var adapters = this._configured.adapters || {};
    for (var adapter in adapters) {
        if (adapters[adapter].generateRay) {
            return adapters[adapter].generateRay(x, y);
        }
    }
    return new XML3D.Ray();
};

methods.groupGetLocalMatrix = function() {
    XML3D.flushDOMChanges();
    var adapters = this._configured.adapters || {};
    for ( var adapter in adapters) {
        if (adapters[adapter].getLocalMatrix) {
            return adapters[adapter].getLocalMatrix();
        }
    }
    return new Mat4();
};

/**
 * return the bounding box of the owning space in world space
 */
methods.getWorldBoundingBox = function() {
    XML3D.flushDOMChanges();
    // Visibility influences bounding box
    XML3D.flushCSSChanges();
    var adapters = this._configured.adapters || {};
    for (var adapter in adapters) {
        if (adapters[adapter].getWorldBoundingBox) {
            return adapters[adapter].getWorldBoundingBox();
        }
    }
    return new XML3D.Box();
};

/**
 * return the bounding box of the owning space in local space (object BB)
 */
methods.getLocalBoundingBox = function() {
    XML3D.flushDOMChanges();
    // Visibility influences bounding box
    XML3D.flushCSSChanges();
    var adapters = this._configured.adapters || {};
    for (var adapter in adapters) {
        if (adapters[adapter].getLocalBoundingBox) {
            return adapters[adapter].getLocalBoundingBox();
        }
    }
    return new XML3D.Box();
};

methods.xml3dGetRenderInterface = function() {
    XML3D.flushDOMChanges();
    var adapters = this._configured.adapters || {};
    for ( var adapter in adapters) {
        if (adapters[adapter].getRenderInterface) {
            return adapters[adapter].getRenderInterface();
        }
    }
    return {};
};


methods.XML3DGraphTypeGetWorldMatrix = function() {
    XML3D.flushDOMChanges();
    var adapters = this._configured.adapters || {};
    for (var adapter in adapters) {
        if (adapters[adapter].getWorldMatrix) {
            return adapters[adapter].getWorldMatrix();
        }
    }
    return new Mat4();
};

methods.videoPlay = function() {
    sendAdapterEvent(this, {play: []});
};

methods.videoPause = function() {
    sendAdapterEvent(this, {pause: []});
};

methods.XML3DNestedDataContainerTypeGetOutputNames =
methods.XML3DShaderProviderTypeGetOutputNames =
methods.meshGetOutputNames = function() {
    XML3D.flushDOMChanges();
    var dataAdapter = Resource.getAdapter(this, "data");
    if(dataAdapter){
        return dataAdapter.getOutputNames();
    }
    return null;
};

methods.XML3DNestedDataContainerTypeGetResult =
methods.XML3DShaderProviderTypeGetResult =
methods.meshGetResult = function(filter) {
    XML3D.flushDOMChanges();
    var dataAdapter = Resource.getAdapter(this, "data");
    if(dataAdapter){
        var result = dataAdapter.getComputeResult(filter);
        if(!result) return null;
        return new window.XML3DDataResult(result);
    }
    return null;
};

methods.XML3DNestedDataContainerTypeGetOutputChannelInfo =
    methods.XML3DShaderProviderTypeGetOutputChannelInfo =
        methods.meshGetOutputChannelInfo = function (name) {
            XML3D.flushDOMChanges();
            var dataAdapter = Resource.getAdapter(this, "data");
            if (dataAdapter) {
                var result = dataAdapter.getOutputChannelInfo(name);
                if (!result) return null;
                return new window.XML3DDataChannelInfo(result.type, result.origin, result.originalName,
                    result.seqLength, result.seqMinKey, result.seqMaxKey);
            }
            return null;
        };
// TODO: Get rid of these
methods.XML3DNestedDataContainerTypeGetComputeInfo =
    methods.XML3DShaderProviderTypeGetComputeInfo =
        methods.meshGetComputeInfo = function () {
            XML3D.flushDOMChanges();
            XML3D.debug.logError(this.nodeName + "::getComputeInfo is not implemeted yet.");
            return null;
        };

methods.XML3DNestedDataContainerTypeGetProtoInfo =
    methods.XML3DShaderProviderTypeGetProtoInfo =
        methods.meshGetProtoInfo = function () {
            XML3D.flushDOMChanges();
            XML3D.debug.logError(this.nodeName + "::getProtoInfo is not implemeted yet.");
            return null;
        };

methods.XML3DNestedDataContainerTypeIsOutputConnected =
    methods.XML3DShaderProviderTypeIsOutputConnected =
        methods.meshIsOutputConnected = function () {
            XML3D.flushDOMChanges();
            XML3D.debug.logError(this.nodeName + "::isOutputConnected is not implemeted yet.");
            return false;
        };


function createValues(result, names) {
    var values = {};
    for (var i in names) {
        var name = names[i];
        var data = result.getOutputData(name) && result.getOutputData(name).getValue();
        if (data)
            values[name] = data;
    }
    return values;
}

/** Register data listener for data fields specified by names.
 *
 * @param names   single name or array of names that are monitored.
 * @param callback function that is called when selected data are changed.
 * @return {Boolean}
 */
methods.dataAddOutputFieldListener = function(names, callback) {
    XML3D.flushDOMChanges();
    if (!names)
        return false;

    // check if names is a single string, and convert it to array then
    var typeOfNames = Object.prototype.toString.call(names).slice(8, -1);
    if (typeOfNames === "String") {
        names = [names];
    }
    if (names.length == 0)
        return false;

    var request = callAdapterFunc(this, {
        getComputeRequest : [names, function(request, changeType) {
            callback(createValues(request.getResult(), names));
        }
        ]});
    if (request.length == 0)
        return false;
    var result = request[0].getResult();
    var values = createValues(result, names);
    if (Object.keys(values).length)
        callback(values);
    return true;
};

methods.XML3DDataSourceTypeSetScriptValue = function(data){
    var configData = this._configured;

    if(!configData)
        return;

    if(this.textContent != "[value set by script]")
        this.textContent = "[value set by script]";
    XML3D.flushDOMChanges();
    configData.scriptValue = data;

    var dataAdapter = Resource.getAdapter(this, "data");
    if(dataAdapter)
        dataAdapter.setScriptValue(data);

};

methods.volumeGetBoundingBox        = methods.deprecatedGetBoundingBoxLocal; // Does this belong here?
methods.volumeGetOutputNames 		= methods.meshGetOutputNames;
methods.volumeGetOutputChannelInfo	= methods.meshGetOutputChannelInfo;
methods.volumeGetComputeInfo 		= methods.meshGetComputeInfo;
methods.volumeGetProtoInfo 			= methods.meshGetProtoInfo;
methods.volumeIsOutputConnected 	= methods.meshIsOutputConnected;
methods.volumeGetResult 			= methods.meshGetResult;

module.exports = methods;
