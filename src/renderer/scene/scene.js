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
        /** DOM node relevant for 'xml3dsystem' events */
        this.systemDomNode = null;
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
        SCENE_SHAPE_CHANGED: "scene_shape_changed",
        SCENE_STRUCTURE_CHANGED: "scene_structure_changed",
        DRAWABLE_STATE_CHANGED: "drawable_state_changed"
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
        /**
         * @param opt
         * @returns {webgl.RenderObject}
         */
        createRenderObject: function (opt) {
            var pageEntry = this.getPageEntry(webgl.RenderObject.ENTRY_SIZE);
            return new webgl.RenderObject(this, pageEntry, opt);
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
            return new webgl.RenderLight(this, pageEntry, opt);
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
                // TODO: There should always be an active view
                this.activeView && this.activeView.setProjectionDirty();
            }
            this.rootNode.getWorldSpaceBoundingBox(this.boundingBox);
        },
        getBoundingBox: function (bb) {
            this.updateBoundingBox();
            XML3D.math.bbox.copy(bb, this.boundingBox);
        },
        createDrawable: function(obj) {
            throw new Error("Scene::createDrawable not implemented");
        },
        requestRedraw: function(reason) {
            throw new Error("Scene::requestRedraw not implemented");
        },
        traverse: function(callback) {
            this.rootNode.traverse(callback);
        },

        /**
         * Returns all objects intersected by the given ray, based on their bounding boxes
         * @param ray
         * @returns {Array} An array of RenderObjects that were hit by this ray
         */
        findRayIntersections: function(ray) {
            var intersections = [];
            this.rootNode.findRayIntersections(ray, intersections);
            return intersections;
        }
    });

    webgl.Scene = Scene;

    webgl.SystemNotifier = {
        node: null,
        setNode: function(node){
            this.node = node;
        },
        sendEvent: function(type, data){
            if(this.node){
                var event = document.createEvent('CustomEvent');
                data.systemtype = type;
                event.initCustomEvent('xml3dsystem', true, true, data);
                this.node.dispatchEvent(event);
            }
        }
    }


})(XML3D.webgl);
