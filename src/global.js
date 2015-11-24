var assign = require("lodash.assign");
var create = require("lodash.create");

if (window.XML3D !== undefined) {
    throw new Error("Tried to define the XML3D namespace a second time. Please ensure xml3d.js is only loaded once!");
}
/** @namespace * */
var XML3D = XML3D || {};
var Xflow = Xflow || {};
window.XML3D = XML3D;
window.Xflow = Xflow;

XML3D.version = '%VERSION%';
/** @const */
XML3D.xml3dNS = 'http://www.xml3d.org/2009/xml3d';
/** @const */
XML3D.xhtmlNS = 'http://www.w3.org/1999/xhtml';
/** @const */
XML3D.webglNS = 'http://www.xml3d.org/2009/xml3d/webgl';
XML3D._xml3d = document.createElementNS(XML3D.xml3dNS, "xml3d");
XML3D._parallel = XML3D._parallel != undefined ? XML3D._parallel : false;
XML3D.xhtml = !!(document.doctype && new XMLSerializer().serializeToString(document.doctype).match(/xhtml/i));

XML3D.createElement = function(tagName) {
    return document.createElementNS(XML3D.xml3dNS, tagName);
};

XML3D.extend = assign;

/**
 *
 * @param {Object} obj Constructor
 * @param {Object} parent Parent class
 * @param {Object=} methods Methods to add to the class
 * @return {Object!}
 */
XML3D.createClass = function(obj, parent, methods) {
    if(!parent) {
        assign(obj.prototype, methods);
    } else {
        obj.prototype = create(parent.prototype, methods);
    }
    return obj;
};

XML3D.debug = require("./utils/debug.js");
XML3D.util = require("./utils/misc.js");
XML3D.options = require("./utils/options.js");
XML3D.materials = require("./renderer/webgl/materials/urn/registery.js");
XML3D.resource = require("./base/resourcemanager.js").Resource; //Required for the test library because the RM needs to "belong" to the same document as the XML3D element in order to resolve references correctly
XML3D.extend(XML3D.resource, require("./resource/resourcefetcher.js").Resource);
XML3D.resource.registerFormat = require("./resource/resourcefetcher.js").registerFormat;
XML3D.resource.URI = require("./utils/uri.js").URI;
//XML3D.resource.FormatHandler
//XML3D.resource.JSONFormatHandler
//XML3D.resource.AdapterFactory
XML3D.webcl = require("./utils/webcl.js").webcl;
XML3D.math = require("gl-matrix");
require("./math/math.js")(XML3D.math);

XML3D.Mat2 = require("./types/mat2.js");
XML3D.Mat3 = require("./types/mat3.js");
XML3D.Mat4 = require("./types/mat4.js");
XML3D.Vec2 = require("./types/vec2.js");
XML3D.Vec3 = require("./types/vec3.js");
XML3D.Vec4 = require("./types/vec4.js");
XML3D.AxisAngle = require("./types/axisangle.js");
XML3D.Quat = require("./types/quat.js");
XML3D.Ray = require("./types/ray.js");
XML3D.Box = require("./types/box.js");

XML3D.extend(window, require("./types/data-observer.js"));

Xflow.registerOperator = require("./xflow/operator/operator.js").registerOperator;
Xflow.constants = require("./xflow/interface/constants.js");
XML3D.extend(Xflow, require("./xflow/interface/graph.js"));
XML3D.extend(Xflow, require("./xflow/interface/data.js"));
Xflow.ComputeRequest = require("./xflow/interface/request.js").ComputeRequest;

XML3D.webgl = {};
XML3D.webgl.BaseRenderTree = require("./renderer/webgl/render-trees/base.js");
XML3D.webgl.BaseRenderPass = require("./renderer/webgl/render-passes/base.js");

require("./xflow/operator/default");

module.exports = {
    XML3D : XML3D,
    Xflow : Xflow
};
