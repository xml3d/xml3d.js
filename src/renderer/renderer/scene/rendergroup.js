var RenderNode = require("./rendernode.js");
var Constants = require("./constants.js");
var Frustum = require("../tools/frustum.js").Frustum;
var vec3 = require("gl-matrix").vec3;
var mat4 = require("gl-matrix").mat4;

var NODE_TYPE = Constants.NODE_TYPE;
var EVENT_TYPE = Constants.EVENT_TYPE;

/** @const */
var WORLD_MATRIX_OFFSET = 0;
/** @const */
var LOCAL_MATRIX_OFFSET = WORLD_MATRIX_OFFSET + 16;
/** @const */
var WORLD_BB_OFFSET = LOCAL_MATRIX_OFFSET + 16;
/** @const */
var ENTRY_SIZE = WORLD_BB_OFFSET + 6;


   /** @const */
    var CLIPPLANE_NEAR_MIN = 0.01;

    /** @const */
    var DEFAULT_FIELDOFVIEW = 45 / 180 * Math.PI;
/**
 *
 * @constructor
 * @extends {RenderNode}
 */
var RenderGroup = function (scene, pageEntry, opt) {
    RenderNode.call(this, NODE_TYPE.GROUP, scene, pageEntry, opt);
    opt = opt || {};

    /**
     * The material attached to this group
     * @type {MaterialConfiguration|null}
     */
    this._material = opt.material || null;
    this._zIndex = opt.zIndex || "0";
    this.boundingBoxDirty = false;
    this.setWorldSpaceBoundingBox(XML3D.Box.EMPTY_BOX);
};
RenderGroup.ENTRY_SIZE = ENTRY_SIZE;

XML3D.createClass(RenderGroup, RenderNode);

XML3D.extend(RenderGroup.prototype, {
    getLocalMatrix: function (dest) {
        var o = this.offset + LOCAL_MATRIX_OFFSET;
        for (var i = 0; i < 16; i++, o++) {
            dest[i] = this.page[o];
        }
    },

    setLocalMatrix: function (source) {
        var o = this.offset + LOCAL_MATRIX_OFFSET;
        for (var i = 0; i < 16; i++, o++) {
            this.page[o] = source[i];
        }
        this.setTransformDirty();
        this.setBoundingBoxDirty();
    },

    getWorldSpaceBoundingBox: function (bbox) {
        if (this.boundingBoxDirty) {
            this.updateWorldSpaceBoundingBox();
        }
        var o = this.offset + WORLD_BB_OFFSET;
        bbox.data[0] = this.page[o];
        bbox.data[1] = this.page[o + 1];
        bbox.data[2] = this.page[o + 2];
        bbox.data[3] = this.page[o + 3];
        bbox.data[4] = this.page[o + 4];
        bbox.data[5] = this.page[o + 5];
    },

    setWorldSpaceBoundingBox: function (bbox) {
        var o = this.offset + WORLD_BB_OFFSET;
        this.page[o] = bbox.data[0];
        this.page[o + 1] = bbox.data[1];
        this.page[o + 2] = bbox.data[2];
        this.page[o + 3] = bbox.data[3];
        this.page[o + 4] = bbox.data[4];
        this.page[o + 5] = bbox.data[5];
    },


    updateWorldSpaceBoundingBox: (function () {
        var childBB = new XML3D.Box();

        return function () {
            var localBB = new XML3D.Box();

            for (var i = 0, j = this.children.length; i < j; i++) {
                var obj = this.children[i];
                obj.getWorldSpaceBoundingBox(childBB);
                localBB.extend(childBB);
            }
            this.setWorldSpaceBoundingBox(localBB);
            this.boundingBoxDirty = false;
        }
    })(),

    addChild: function (child) {
        this.children.push(child);
        this.setBoundingBoxDirty();
        this.scene.emit(EVENT_TYPE.SCENE_STRUCTURE_CHANGED, child, false);
    },

    removeChild: function (child) {
        var index = this.children.indexOf(child);
        if (index != -1) {
            this.children.splice(index, 1);
        }
        this.scene.emit(EVENT_TYPE.SCENE_STRUCTURE_CHANGED, child, true);
    },

    getChildren: function () {
        return this.children;
    },

    updateWorldMatrix: function (sourceMat4) {
        var page = this.page;
        var offset = this.offset;
        XML3D.math.mat4.multiplyOffset(page, offset + WORLD_MATRIX_OFFSET, page, offset + LOCAL_MATRIX_OFFSET, sourceMat4, 0);
        this.transformDirty = false;
    },

    setTransformDirty: function () {
        if (this.transformDirty) {
            //We can be sure all child nodes are already set to transformDirty from here
            return;
        }
        this.transformDirty = true;
        var children = this.children;
        for(var i = 0, l = children.length; i < l; i++) {
            children[i].setTransformDirty();
        }
    },

    /**
     * @param {MaterialConfiguration|null} material
     */
    setMaterial: function (material) {
        if(this._material === material)
            return;
        this._material = material;
        this.children.forEach(function (obj) {
            obj.parentMaterialChanged && obj.parentMaterialChanged();
        });
    },

    setZIndex: function(zIndex){
        this._zIndex = zIndex;
    },

    parentMaterialChanged: function () {
        if (this._material) {
            // Local material overrides anything coming from upstream
            return;
        }
        this.children.forEach(function (obj) {
            obj.parentMaterialChanged && obj.parentMaterialChanged();
        });
    },

    /**
     * @returns {MaterialConfiguration}
     */
    getMaterial: function () {
        return this._material || this.parent.getMaterial();
    },

    /**
     * A group propagates its visibility
     */
    visibilityChanged: function () {
        var children = this.children;
        for (var i = 0, l = children.length; i < l; i++) {
            children[i].evaluateVisibility();
        }
    },



    setBoundingBoxDirty: function () {
        this.boundingBoxDirty = true;
        if (this.parent) {
            this.parent.setBoundingBoxDirty();
        }
    },

    findRayIntersections: (function () {
        var bbox = new XML3D.Box();

        return function (ray, intersections) {
            this.getWorldSpaceBoundingBox(bbox);
            if (ray.intersects(bbox)) {
                for (var i = 0; i < this.children.length; i++) {
                    this.children[i].findRayIntersections(ray, intersections);
                }
            }
        }
    })()

});

// Export
module.exports = RenderGroup;

