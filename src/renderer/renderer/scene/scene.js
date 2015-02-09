var Pager = require("./pager.js");
var RenderObject = require("./renderobject.js");
var RenderView = require("./renderview.js");
var RenderGroup = require("./rendergroup.js");
var RenderLight = require("./renderlight.js");
var MaterialConfiguration = require("./material-configuration");
var C = require("./constants.js");

/**
 *
 * @constructor
 * @extends Pager
 */
var Scene = function () {
    Pager.call(this);

    this.boundingBox = new XML3D.math.bbox.create();
    this.lights = {
        queue: [], point: [], directional: [], spot: [], length: function () {
            return this.point.length + this.directional.length + this.spot.length;
        }
    };

    /** @type RenderView */
    this.activeView = null;
    this.rootNode = this.createRootNode();
};
XML3D.createClass(Scene, Pager);


XML3D.extend(Scene.prototype, {
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
            this.dispatchEvent({type: C.EVENT_TYPE.VIEW_CHANGED, newView: this.activeView});
        }
    },
    /**
     * @param {object?} opt
     * @returns {RenderObject}
     */
    createRenderObject: function (opt) {
        var pageEntry = this.getPageEntry(RenderObject.ENTRY_SIZE);
        return new RenderObject(this, pageEntry, opt);
    },

    createRenderGroup: function (opt) {
        var pageEntry = this.getPageEntry(RenderGroup.ENTRY_SIZE);
        return new RenderGroup(this, pageEntry, opt);
    },

    createRenderView: function (opt) {
        var pageEntry = this.getPageEntry(RenderView.ENTRY_SIZE);
        return new RenderView(this, pageEntry, opt);
    },

    createRenderLight: function (opt) {
        var pageEntry = this.getPageEntry(RenderLight.ENTRY_SIZE);
        return new RenderLight(this, pageEntry, opt);
    },

    createMaterialConfiguration: function(model, data, opt) {
        return new MaterialConfiguration(model, data, opt);
    },

    createRootNode: function () {
        var pageEntry = this.getPageEntry(RenderGroup.ENTRY_SIZE);
        var root = new RenderGroup(this, pageEntry, {
            material: new MaterialConfiguration(
                {"type": "urn", "urn": new XML3D.URI("urn:xml3d:shader:matte")},
                null,
                {name: "default"}
            )
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
    }
});

module.exports = Scene;
