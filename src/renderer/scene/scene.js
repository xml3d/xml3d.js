(function(webgl) {

    var StateMachine = window.StateMachine;

    var Scene = function(shaderFactory) {
        webgl.Pager.call(this);

        this.firstOpaqueIndex = 0;
        this.boundingBox = new XML3D.webgl.BoundingBox();
        this.lights = {
            changed : true,
            structureChanged : true,
            point: { length: 0, intensity: [], position: [], attenuation: [], visibility: [] },
            directional: { length: 0, intensity: [], direction: [], visibility: [] },
            spot: { length: 0, intensity: [], direction: [], attenuation: [], visibility: [], position: [], falloffAngle: [], softness: [] },
            length: function() {
                return this.point.length + this.directional.length + this.spot.length;
            }
        };
        this.activeView = null;
        this.shaderFactory = shaderFactory;
        this.rootNode = this.createRootNode();
        this.clear();
    };
    XML3D.createClass(Scene, webgl.Pager);

    XML3D.extend(Scene.prototype, {

        getActiveView : function() {
            return this.activeView;
        },

        setActiveView : function(view) {
            this.activeView = view;
        },
        remove : function(obj) {
            var index = this.queue.indexOf(obj);
            if (index != -1) {
                this.queue.splice(index, 1);
            }
            index = this.ready.indexOf(obj);
            if (index != -1) {
                this.ready.splice(index, 1);
                if(index < this.firstOpaqueIndex)
                    this.firstOpaqueIndex--;
            }
        },
        clear : function() {
            this.ready = [];
            this.queue = [];
        },
        moveFromQueueToReady : function(obj) {
            var index = this.queue.indexOf(obj);
            if (index != -1) {
                this.queue.splice(index, 1);
                if(obj.shader.hasTransparency) {
                    this.ready.unshift(obj);
                    this.firstOpaqueIndex++;
                }
                else {
                    this.ready.push(obj);
                }
            }
        },
        moveFromReadyToQueue : function(obj) {
            var index = this.ready.indexOf(obj);
            if (index != -1) {
                this.ready.splice(index, 1);
                if(index < this.firstOpaqueIndex)
                    this.firstOpaqueIndex--;
                this.queue.push(obj);
            }
        },
        update : function() {
            this.updateLights(this.lights);
            this.shaderFactory.update();
            this.consolidate();
        },
        consolidate : function() {
            this.queue.slice().forEach(function(obj) {
                while (obj.can('progress') && obj.progress() == StateMachine.Result.SUCCEEDED ) {};
                if(obj.current == "NoMesh") {
                    if (obj.dataComplete() !== StateMachine.Result.SUCCEEDED) {
                        obj.dataNotComplete();
                    }
                }
            });
        },
        updateLights : function(lights) {
            if (lights.structureChanged) {
                //shaderManager.removeAllShaders();
                this.forEach(function(obj) { obj.lightsChanged(lights); }, this);
                lights.structureChanged = false;
            } else {
                this.queue.forEach(function(obj) {
                    if (obj.current == "NoLights")
                        obj.lightsChanged(lights);
                }, this);
            }
        },
        forEach : function(func, that) {
            this.queue.slice().forEach(func, that);
            this.ready.slice().forEach(func, that);
        },


        createRenderObject : function(opt) {
            var pageEntry = this.getPageEntry(webgl.RenderObject.ENTRY_SIZE);
            var renderObject = new webgl.RenderObject(this, pageEntry, opt);
            this.queue.push(renderObject);
            return renderObject;
        },

        createRenderGroup : function(opt) {
            var pageEntry = this.getPageEntry(webgl.RenderGroup.ENTRY_SIZE);
            return new webgl.RenderGroup(this, pageEntry, opt);
        },

        createRenderView : function(opt) {
            var pageEntry = this.getPageEntry(webgl.RenderView.ENTRY_SIZE);
            return new webgl.RenderView(this, pageEntry, opt);
        },

        createRenderLight : function(opt) {
            var pageEntry = this.getPageEntry(webgl.RenderLight.ENTRY_SIZE);
            this.addLightDataOffsetToPageEntry(pageEntry, opt.lightType);
            this.lights.structureChanged = true;
            return new webgl.RenderLight(this, pageEntry, opt);
        },

        addLightDataOffsetToPageEntry : function(pageEntry, lightType) {
            var lightObj = this.lights[lightType];
            pageEntry.lightOffset = lightObj.length++;
        },

        createRootNode : function() {
            var pageEntry = this.getPageEntry(webgl.RenderGroup.ENTRY_SIZE);
            var root = new webgl.RenderGroup(this, pageEntry, {});
            root.setWorldMatrix(XML3D.math.mat4.create());
            root.setLocalMatrix(XML3D.math.mat4.create());
            root.transformDirty = false;
            root.shaderDirty = false;
            root.visible = true;
            root.shaderHandle = new XML3D.base.AdapterHandle("not_found");
            root.shaderHandle.status = XML3D.base.AdapterHandle.STATUS.NOT_FOUND;
            this.rootNode = root;
            return root;
        },
        updateBoundingBox : function() {
            if (this.rootNode.boundingBoxDirty) {
                this.activeView.setProjectionDirty();
            }
            this.rootNode.getWorldSpaceBoundingBox(this.boundingBox);
        },
        updateReadyObjectsFromActiveView : (function() {
            var c_viewMat_tmp = XML3D.math.mat4.create();
            var c_projMat_tmp = XML3D.math.mat4.create();

            return function(aspectRatio) {
                this.getActiveView().getViewMatrix(c_viewMat_tmp);

                this.ready.forEach(function (obj) {
                    obj.updateModelViewMatrix(c_viewMat_tmp);
                    obj.updateNormalMatrix();
                });

                this.updateBoundingBox();
                this.getActiveView().getProjectionMatrix(c_projMat_tmp, aspectRatio);

                this.ready.forEach(function (obj) {
                    obj.updateModelViewProjectionMatrix(c_projMat_tmp);
                });
            }
        }()),

        getBoundingBox : function(bb) {
            XML3D.math.vec3.copy(bb.min, this.boundingBox.min);
            XML3D.math.vec3.copy(bb.max, this.boundingBox.max);
        }});




    webgl.Scene = Scene;

})(XML3D.webgl);
