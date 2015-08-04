var mat4 = require("gl-matrix").mat4;
var assert = require("assert");


/** @const */
var WORLD_MATRIX_OFFSET = 0;
var LOCAL_MATRIX_OFFSET = 16;

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

    // Hierarchy
    this.parent = null;
    this.children = [];

    // Transformations
    this._localMatrix = new Float32Array(this.page.buffer, (this.offset + LOCAL_MATRIX_OFFSET) * Float32Array.BYTES_PER_ELEMENT, 16);
    this._worldMatrix = new Float32Array(this.page.buffer, (this.offset + WORLD_MATRIX_OFFSET) * Float32Array.BYTES_PER_ELEMENT, 16);
    mat4.identity(this._localMatrix);

    /**
     * Can we rely on current WorldMatrix?
     * @type {boolean}
     */
    this.worldMatrixDirty = true;

    // Visibility
    this.localVisible = true;
    // The global visibility depends on visibility of parents
    this.visible = true;

    // Will also evaluate the visibility
    this.setParent(opt.parent || scene.rootNode);

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
        if(dest) {
            mat4.copy(dest, this._worldMatrix);
        }
        return this._worldMatrix;
    },

    updateWorldMatrix: function () {
        if (this.parent) {
            var parentMatrix = this.parent.getWorldMatrix();
            XML3D.math.mat4.multiply(this._worldMatrix, parentMatrix, this._localMatrix);
        } else {
            mat4.copy(this._worldMatrix, this._localMatrix);
        }
        this.worldTransformationChanged();
    },

    worldTransformationChanged: function() {},

    setLocalMatrix: function (newVal) {
        mat4.copy(this._localMatrix, newVal);
        this.onTransformDirty();
    },

    getLocalMatrix: function () {
        return this._localMatrix;
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
