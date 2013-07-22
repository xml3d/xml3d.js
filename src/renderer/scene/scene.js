(function (webgl) {

    /**
     *
     * @constructor
     * @extends Pager
     */
    var Scene = function () {
        webgl.Pager.call(this);

        this.boundingBox = new XML3D.math.bbox.create();
        this.lights = {
            queue: [],
            point: [],
            directional: [],
            spot: [],
            length: function () {
                return this.point.length + this.directional.length + this.spot.length;
            }
        };
        this.shaderInfos = [];
        /** @type RenderView */
        this.activeView = null;
        this.rootNode = this.createRootNode();
    };
    XML3D.createClass(Scene, webgl.Pager);

    Scene.NODE_TYPE = {
        GROUP:  "group",
        OBJECT: "object",
        LIGHT:  "light",
        VIEW:   "view"
    };

    Scene.EVENT_TYPE = {
        VIEW_CHANGED: "view_changed",
        LIGHT_STRUCTURE_CHANGED: "light_structure_changed",
        LIGHT_VALUE_CHANGED: "light_value_changed",
        SCENE_STRUCTURE_CHANGED: "scene_structure_changed"
    };


    var empty = function () {
    };

    XML3D.extend(Scene.prototype, {
        /**
         * @returns {RenderView}
         */
        getActiveView: function () {
            return this.activeView;
        },
        /**
         * @param {RenderView} view
         */
        setActiveView: function (view) {
            if(view != this.activeView) {
                if(!view)
                    throw new Error("Active view must not be null");
                this.activeView = view;
                this.dispatchEvent({type: Scene.EVENT_TYPE.VIEW_CHANGED, newView: this.activeView });
            }
        },
        createRenderObject: function (opt) {
            var pageEntry = this.getPageEntry(webgl.RenderObject.ENTRY_SIZE);
            var renderObject = new webgl.RenderObject(this, pageEntry, opt);
            return renderObject;
        },

        createRenderGroup: function (opt) {
            var pageEntry = this.getPageEntry(webgl.RenderGroup.ENTRY_SIZE);
            return new webgl.RenderGroup(this, pageEntry, opt);
        },

        createRenderView: function (opt) {
            var pageEntry = this.getPageEntry(webgl.RenderView.ENTRY_SIZE);
            return new webgl.RenderView(this, pageEntry, opt);
        },

        createRenderLight: function (opt) {
            var pageEntry = this.getPageEntry(webgl.RenderLight.ENTRY_SIZE);
            var renderLight = new webgl.RenderLight(this, pageEntry, opt);
            return renderLight;
        },
        createShaderInfo: function (opt) {
            return new webgl.ShaderInfo(this, opt);
        },

        createRootNode: function () {
            var pageEntry = this.getPageEntry(webgl.RenderGroup.ENTRY_SIZE);
            var root = new webgl.RenderGroup(this, pageEntry, {});
            root.setWorldMatrix(XML3D.math.mat4.create());
            root.setLocalMatrix(XML3D.math.mat4.create());
            root.transformDirty = false;
            root.shaderDirty = false;
            root.visible = true;
            root.shaderHandle = new XML3D.base.AdapterHandle("not_found");
            root.shaderHandle.status = XML3D.base.AdapterHandle.STATUS.NOT_FOUND;
            return root;
        },
        updateBoundingBox: function () {
            if (this.rootNode.boundingBoxDirty) {
                this.activeView.setProjectionDirty();
            }
            this.rootNode.getWorldSpaceBoundingBox(this.boundingBox);
        },
        getBoundingBox: function (bb) {
            this.updateBoundingBox();
            XML3D.math.bbox.copy(bb, this.boundingBox);
        }

    });


    webgl.Scene = Scene;

})(XML3D.webgl);
