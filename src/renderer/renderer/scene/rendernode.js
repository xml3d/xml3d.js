/** @const */
var WORLD_MATRIX_OFFSET = 0;

/**
 * @constructor
 * @param type
 * @param {Scene} scene
 * @param {Object} pageEntry
 * @param {Object} opt
 */
var RenderNode = function (type, scene, pageEntry, opt) {
    opt = opt || {};

    this.scene = scene;
    this.type = type;
    this.name = opt.name || "";
    this.page = pageEntry.page;
    this.offset = pageEntry.offset;
    this.entrySize = pageEntry.size;
    this.transformDirty = true;
    this.children = [];
    this.setParent(opt.parent || scene.rootNode);
};

XML3D.extend(RenderNode.prototype, {

    getChildren: function () {
        return this.children;
    },

    getParent: function () {
        return this.parent;
    },

    setParent: function (parent) {
        this.parent = parent;
        if (parent && parent.addChild) {
            parent.addChild(this);
        }
    },

    traverse: function (callback) {
        callback(this);
        this.children.forEach(function (child) {
            child.traverse(callback);
        })
    },

    getWorldMatrix: function (dest) {
        if (this.transformDirty) {
            this.parent.getWorldMatrix(dest);
            this.updateWorldMatrix(dest);
        }
        var o = this.offset + WORLD_MATRIX_OFFSET;
        for (var i = 0; i < 16; i++, o++) {
            dest[i] = this.page[o];
        }
    },

    setWorldMatrix: function (source) {
        var o = this.offset + WORLD_MATRIX_OFFSET;
        for (var i = 0; i < 16; i++, o++) {
            this.page[o] = source[i];
        }
        this.transformDirty = false;
        if (this.setBoundingBoxDirty) {
            this.setBoundingBoxDirty();
        }
    },

    setTransformDirty: function () {
        this.transformDirty = true;
    },

    remove: function () {
        this.parent.removeChild(this);
        this.scene.pager.freePageEntry({page: this.page, offset: this.offset, size: this.entrySize});
    },

    findRayIntersections: function (/* ray, closestIntersection*/) {
        //This function is overridden by groups and drawables
    }

});

module.exports = RenderNode;
