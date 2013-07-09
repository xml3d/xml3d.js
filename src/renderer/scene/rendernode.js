(function() {
    /** @const */
    var WORLD_MATRIX_OFFSET = 0;

    /**
     * @constructor
     * @param {Scene} scene
     * @param {Object} pageEntry
     * @param {Object} opt
     */
    var RenderNode = function(scene, pageEntry, opt) {
        opt = opt || {};
        this.scene = scene;
        this.setParent(opt.parent || scene.rootNode);
        this.page = pageEntry.page || 0;
        this.offset = pageEntry.offset || 0;
        this.localVisible = opt.visible;
        this.visible = this.localVisible !== undefined ? this.localVisible : this.getParent() ? this.getParent().isVisible() : true;
        this.transformDirty = true;
        this.children = [];
    };

    XML3D.extend(RenderNode.prototype, {

        getChildren: function() {
            return this.children;
        },

        getParent: function() {
            return this.parent;
        },

        setParent: function(parent) {
            this.parent = parent;
            if (parent && parent.addChild) {
                parent.addChild(this);
            }
        },

        getWorldMatrix: function(dest) {
            if (this.transformDirty) {
                this.parent.getWorldMatrix(dest);
                this.updateWorldMatrix(dest);
            }
            var o = this.offset + WORLD_MATRIX_OFFSET;
            for(var i = 0; i < 16; i++, o++) {
                dest[i] = this.page[o];
            }
        },

        setWorldMatrix: function(source) {
            var o = this.offset + WORLD_MATRIX_OFFSET;
            for(var i = 0; i < 16; i++, o++) {
                this.page[o] = source[i];
            }
            this.transformDirty = false;
        },

        isVisible: function() {
            return this.visible;
        },

        setTransformDirty: function() {
            this.transformDirty = true;
        },

        setLocalVisible: function(newVal) {
            this.localVisible = newVal;
            if (this.parent.isVisible()) {
                // if parent is not visible this group is also invisible
                this.setVisible(newVal);
            }
        },

        setVisible: function(newVal) {
            var downstream = newVal;
            if (this.localVisible === false) {
                downstream = false;
            }
            this.visible = downstream;
            this.children.forEach(function(obj) {
                obj.setVisible(downstream);
            });
        },

        remove: function() {
            this.parent.removeChild(this);
            this.dispose && this.dispose();
        }

    });

    XML3D.webgl.RenderNode = RenderNode;
})();
