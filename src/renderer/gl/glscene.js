(function (webgl) {

    var StateMachine = window.StateMachine;

    var shouldCull = (function () {
        var params = {},
            p = window.location.search.substr(1).split('&');

        p.forEach(function (e, i, a) {
            var keyVal = e.split('=');
            params[keyVal[0].toLowerCase()] = decodeURIComponent(keyVal[1]);
        });
        return params.hasOwnProperty("xml3d_culling");
    }());


    /**
     *
     * @param {GLContext} context
     * @extends {Scene}
     * @constructor
     */
    var GLScene = function (context) {
        webgl.Scene.call(this);
        this.context = context;
        this.shaderFactory = new webgl.ShaderComposerFactory(context);
        this.drawableFactory = new webgl.DrawableFactory(context);
        this.firstOpaqueIndex = 0;

        /**
         * @type {Array.<RenderObject>}
         */
        this.ready = [];
        this.queue = [];
        this.addListeners();
    };
    var EVENT_TYPE = webgl.Scene.EVENT_TYPE;

    XML3D.createClass(GLScene, webgl.Scene);


    XML3D.extend(GLScene.prototype, {
        remove: function (obj) {
            var index = this.queue.indexOf(obj);
            if (index != -1) {
                this.queue.splice(index, 1);
            }
            index = this.ready.indexOf(obj);
            if (index != -1) {
                this.ready.splice(index, 1);
                if (index < this.firstOpaqueIndex)
                    this.firstOpaqueIndex--;
            }
        },
        clear: function () {
            this.ready = [];
            this.queue = [];
        },
        moveFromQueueToReady: function (obj) {
            var index = this.queue.indexOf(obj);
            if (index != -1) {
                this.queue.splice(index, 1);
                if (obj.hasTransparency()) {
                    this.ready.unshift(obj);
                    this.firstOpaqueIndex++;
                }
                else {
                    this.ready.push(obj);
                }
            }
        },
        moveFromReadyToQueue: function (obj) {
            var index = this.ready.indexOf(obj);
            if (index != -1) {
                this.ready.splice(index, 1);
                if (index < this.firstOpaqueIndex)
                    this.firstOpaqueIndex--;
                this.queue.push(obj);
            }
        },
        update: function () {
            this.updateObjectsForRendering();
            this.updateShaders();
        },

        updateShaders: function() {
            this.shaderFactory.update(this);
        },

        updateObjectsForRendering: function () {
            var that = this;
            this.forEach(function(obj) {
                obj.updateForRendering();
            });
        },
        forEach: function (func, that) {
            this.queue.slice().forEach(func, that);
            this.ready.slice().forEach(func, that);
        },
        updateReadyObjectsFromActiveView: (function () {
            var c_worldToViewMatrix = XML3D.math.mat4.create();
            var c_viewToWorldMatrix = XML3D.math.mat4.create();
            var c_projMat_tmp = XML3D.math.mat4.create();
            var c_bbox = XML3D.math.bbox.create();
            var c_frustumTest = new XML3D.webgl.FrustumTest();

            return function (aspectRatio) {
                var activeView = this.getActiveView(),
                    readyObjects = this.ready;

                // Update all MV matrices
                activeView.getWorldToViewMatrix(c_worldToViewMatrix);
                readyObjects.forEach(function (obj) {
                    obj.updateModelViewMatrix(c_worldToViewMatrix);
                    obj.updateNormalMatrix();
                });

                this.updateBoundingBox();


                activeView.getProjectionMatrix(c_projMat_tmp, aspectRatio);
                activeView.getViewToWorldMatrix(c_viewToWorldMatrix);

                var frustum = activeView.getFrustum();
                c_frustumTest.set(frustum,c_viewToWorldMatrix);

                for(var i = 0, l = readyObjects.length; i < l; i++) {
                    var obj = readyObjects[i];
                    obj.updateModelViewProjectionMatrix(c_projMat_tmp);
                    obj.getWorldSpaceBoundingBox(c_bbox);
                    obj.inFrustum = shouldCull ? c_frustumTest.isBoxVisible(c_bbox) : true;
                };
            }
        }()),
        addListeners: function() {
            this.addEventListener( EVENT_TYPE.SCENE_STRUCTURE_CHANGED, function(event){
                if(event.newChild !== undefined) {
                    this.addChildEvent(event.newChild);
                } else if (event.removedChild !== undefined) {
                    this.removeChildEvent(event.removedChild);
                }
            });
            this.addEventListener( EVENT_TYPE.VIEW_CHANGED, function(event){
                this.context.requestRedraw("Active view changed.");
            });
            this.addEventListener( EVENT_TYPE.LIGHT_STRUCTURE_CHANGED, function(event){
                this.shaderFactory.setLightStructureDirty();
            });
            this.addEventListener( EVENT_TYPE.LIGHT_VALUE_CHANGED, function(event){
                this.shaderFactory.setLightValueChanged();
                this.context.requestRedraw("Light value changed.");
            });
        },
        addChildEvent: function(child) {
            if(child.type == webgl.Scene.NODE_TYPE.OBJECT) {
                this.queue.push(child);
                this.context.requestRedraw("Object was added to scene.");
            }
        },
        removeChildEvent: function(child) {
            if(child.type == webgl.Scene.NODE_TYPE.OBJECT) {
                this.remove(child);
                child.dispose();
                this.context.requestRedraw("Object was removed from scene.");
            }
        },
        handleResizeEvent: function(width, height) {
            this.getActiveView().setProjectionDirty();
        },
        createDrawable: function(obj) {
            return this.drawableFactory.createDrawable(obj);
        },
        requestRedraw: function(reason) {
            return this.context.requestRedraw(reason);
        }
    });
    webgl.GLScene = GLScene;

}(XML3D.webgl));
