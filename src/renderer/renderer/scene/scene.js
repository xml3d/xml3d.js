var Pager = require("./pager.js");
var RenderObject = require("./renderobject.js");
var RenderView = require("./renderview.js");
var RenderGroup = require("./rendergroup.js");
var RenderLight = require("./renderlight.js");
var MaterialConfiguration = require("./material-configuration.js");
var LightManager = require("../lights/light-manager.js");
var C = require("./constants.js");
var InputNode = require("../../../xflow/interface/graph.js").InputNode;
var DataNode = require("../../../xflow/interface/graph.js").DataNode;
var BufferEntry = require("../../../xflow/interface/data.js").BufferEntry;
var XC = require("../../../xflow/interface/constants.js");
var URI = require("../../../utils/uri.js").URI;
var EventEmitter = require('events').EventEmitter;

/**
 * @param {XML3DDataAdapter} systemDataAdapter
 * @extends {EventEmitter}
 * @constructor
 */
var Scene = function (systemDataAdapter) {
    EventEmitter.call(this);
    this.boundingBox = new XML3D.math.bbox.create();
    this.lights = new LightManager();
    this.pager = new Pager();
    this.systemDataAdapter = systemDataAdapter;

    /** @type RenderView */
    this.activeView = null;

    /** @type MaterialConfiguration */
    this._defaultMaterial = null;

    this.rootNode = this.createRootNode();
    this.setRendererIndependentData();
};

XML3D.createClass(Scene, EventEmitter, {
    /**
     * @returns {RenderView}
     */
    getActiveView: function () {
        return this.activeView;
    }, /**
     * @param {RenderView} view
     */
    setActiveView: function (view) {
        if (view != this.activeView) {
            if (!view)
                throw new Error("Active view must not be null");
            this.activeView = view;
            this.emit(C.EVENT_TYPE.VIEW_CHANGED, this.activeView);
        }
    },
    /**
     * @param {object?} opt
     * @returns {RenderObject}
     */
    createRenderObject: function (opt) {
        var pageEntry = this.pager.getPageEntry(RenderObject.ENTRY_SIZE);
        return new RenderObject(this, pageEntry, opt);
    },

    createRenderGroup: function (opt) {
        var pageEntry = this.pager.getPageEntry(RenderGroup.ENTRY_SIZE);
        return new RenderGroup(this, pageEntry, opt);
    },

    createRenderView: function (opt) {
        var pageEntry = this.pager.getPageEntry(RenderView.ENTRY_SIZE);
        return new RenderView(this, pageEntry, opt);
    },

    createRenderLight: function (opt) {
        var pageEntry = this.pager.getPageEntry(RenderLight.ENTRY_SIZE);
        return new RenderLight(this, pageEntry, opt);
    },

    createMaterialConfiguration: function(model, data, opt) {
        return new MaterialConfiguration(model, data, opt);
    },

    createRootNode: function () {
        var pageEntry = this.pager.getPageEntry(RenderGroup.ENTRY_SIZE);
        var root = new RenderGroup(this, pageEntry, {
            material: this.getDefaultMaterial()
        });
        root.setWorldMatrix(XML3D.math.mat4.create());
        root.setLocalMatrix(XML3D.math.mat4.create());
        root.transformDirty = false;
        root.visible = true;
        return root;
    },

    updateBoundingBox: function () {
        if (this.rootNode.boundingBoxDirty) {
            // TODO: There should always be an active view
            this.activeView && this.activeView.setProjectionDirty();
        }
        this.rootNode.getWorldSpaceBoundingBox(this.boundingBox);
    },

    getBoundingBox: function (bb) {
        this.updateBoundingBox();
        XML3D.math.bbox.copy(bb, this.boundingBox);
    },

    createDrawable: function (/*obj*/) {
        throw new Error("Scene::createDrawable not implemented");
    },

    requestRedraw: function (/*reason*/) {
        throw new Error("Scene::requestRedraw not implemented");
    },

    traverse: function (callback) {
        this.rootNode.traverse(callback);
    },

    /**
     * Returns all objects intersected by the given ray, based on their bounding boxes
     * @param ray
     * @returns {Array} An array of RenderObjects that were hit by this ray
     */
    findRayIntersections: function (ray) {
        var intersections = [];
        this.rootNode.findRayIntersections(ray, intersections);
        return intersections;
    },

    getDefaultMaterial: function() {
        if(!this._defaultMaterial) {
            var inputNode = new InputNode();
            inputNode.data = new BufferEntry(XC.DATA_TYPE.FLOAT3, new Float32Array([1, 0, 0]));
            inputNode.name = "diffuseColor";

            var data = new DataNode(false);
            data.appendChild(inputNode);

            this._defaultMaterial = this.createMaterialConfiguration(
                {"type": "urn", "urn": new URI("urn:xml3d:material:matte")},
                data,
                {name: "default"}
            );
        }
        return this._defaultMaterial;
    },

    setRendererIndependentData: function () {
        // TODO(jasu): forEach
        for (var child in this.systemDataAdapter.xflowDataNode._children) {
            //Here we set rendered-independent values
            // TODO: Check if there is an easier way to set values, add a DataNode::getChildByName (xml3d.js\src\xflow\interface\graph.js)
            if (this.systemDataAdapter.xflowDataNode._children[child].name == "_system_time") {
                this.systemDataAdapter.xflowDataNode._children[child].data.setValue(new Float32Array([performance.now()]));

            }
        }
    }



});

module.exports = Scene;
