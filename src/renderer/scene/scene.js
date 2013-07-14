(function (webgl) {

    /**
     *
     * @constructor
     * @extends Pager
     */
    var Scene = function () {
        webgl.Pager.call(this);

        this.boundingBox = new XML3D.webgl.BoundingBox();
        this.lights = {
            changed: true,
            structureChanged: true,
            point: { length: 0, intensity: [], position: [], attenuation: [], visibility: [] },
            directional: { length: 0, intensity: [], direction: [], visibility: [] },
            spot: { length: 0, intensity: [], direction: [], attenuation: [], visibility: [], position: [], falloffAngle: [], softness: [] },
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
        GROUP: 1,
        OBJECT: 2,
        LIGHT: 3,
        VIEW: 4
    }

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
                this.viewChanged();
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
            this.addLightDataOffsetToPageEntry(pageEntry, opt.lightType);
            this.lights.structureChanged = true;
            return new webgl.RenderLight(this, pageEntry, opt);
        },
        createShaderInfo: function (opt) {
            return new webgl.ShaderInfo(this, opt);
        },

        addLightDataOffsetToPageEntry: function (pageEntry, lightType) {
            var lightObj = this.lights[lightType];
            pageEntry.lightOffset = lightObj.length++;
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
            XML3D.math.vec3.copy(bb.min, this.boundingBox.min);
            XML3D.math.vec3.copy(bb.max, this.boundingBox.max);
        },
        viewChanged: empty,
        addChildEvent: empty,
        removeChildEvent: empty

    });


    webgl.Scene = Scene;

})(XML3D.webgl);
