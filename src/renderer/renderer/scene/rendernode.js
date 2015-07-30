/** @const */
var WORLD_MATRIX_OFFSET = 0;
var LOCAL_MATRIX_OFFSET = 16;

var IDENT = XML3D.math.mat4.create();


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
    this.children = [];
    this.parent = null;

    this.setLocalMatrix(IDENT);

    /**
     * Can we rely on current WorldMatrix?
     * @type {boolean}
     */
    this.worldMatrixDirty = true;


    this.setParent(opt.parent || scene.rootNode);

    this.localVisible = true;
    // The global visibility depends on visibility of parents
    this.visible = true;
    this.evaluateVisibility();
};

XML3D.extend(RenderNode.prototype, {

    getChildren: function () {
        return this.children;
    },

    evaluateVisibility: function() {
        var oldVisible = this.visible;
        if(this.parent && !this.parent.visible) {
            this.visible = false;
        } else {
            this.visible = this.localVisible;
        }
        if(oldVisible !== this.visible) {
            this.visibilityChanged();
            this.scene.requestRedraw && this.scene.requestRedraw("Visibility changed.");
        }
    },

    setLocalVisible: function(newVisible) {
        if (this.localVisible === newVisible) {
            return;
        }
        this.localVisible = newVisible;
        this.evaluateVisibility();
    },

    // Needs to be overwritten
    visibilityChanged: function() {},

    getParent: function () {
        return this.parent;
    },

    setParent: function (parent) {
        this.parent = parent;
        if (parent && parent.addChild) {
            parent.addChild(this);
        }
        // Reevaluate visibility, which might change due to
        // invisibility of parent
        this.evaluateVisibility();
    },

    traverse: function (callback) {
        callback(this);
        this.children.forEach(function (child) {
            child.traverse(callback);
        })
    },

    /**
     * @param {Mat4} source
     * @param {number} offset
     */
    setMat4InPage: function(source, offset) {
        var o = this.offset + offset;
        for(var i = 0; i < 16; i++, o++) {
            this.page[o] = source[i];
        }
    },

    /**
     * @param {Mat4} dest
     * @param {number} offset
     */
    getMat4FromPage: function(dest, offset) {
        var o = this.offset + offset;
        for(var i = 0; i < 16; i++, o++) {
            dest[i] = this.page[o];
        }
    },

    getWorldMatrix: function (dest) {
        if (this.worldMatrixDirty) {
            this.updateWorldMatrix();
            this.worldMatrixDirty = false;
        }
        this.getMat4FromPage(dest, WORLD_MATRIX_OFFSET);
    },

    updateWorldMatrix: function () {
        var tmp_worldMatrix = XML3D.math.mat4.create();
        if (this.parent) {
            this.parent.getWorldMatrix(tmp_worldMatrix);
            XML3D.math.mat4.multiplyOffset(tmp_worldMatrix, 0, this.page, this.offset + LOCAL_MATRIX_OFFSET, tmp_worldMatrix, 0);
        } else {
            this.getLocalMatrix(tmp_worldMatrix);
        }
        this.setMat4InPage(tmp_worldMatrix, WORLD_MATRIX_OFFSET);
        this.worldTransformationChanged();
    },

    worldTransformationChanged: function() {},

    setLocalMatrix: function (source) {
        this.setMat4InPage(source, LOCAL_MATRIX_OFFSET);
        this.onTransformDirty();
    },

    getLocalMatrix: function (dest) {
        this.getMat4FromPage(dest, LOCAL_MATRIX_OFFSET);
    },

    onTransformDirty: function () {
        this.worldMatrixDirty = true;
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
