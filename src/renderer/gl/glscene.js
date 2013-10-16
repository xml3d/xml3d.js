(function (webgl) {

    var StateMachine = window.StateMachine;

    var omitCulling = (function () {
        var params = {},
            p = window.location.search.substr(1).split('&');

        p.forEach(function (e, i, a) {
            var keyVal = e.split('=');
            params[keyVal[0].toLowerCase()] = decodeURIComponent(keyVal[1]);
        });
        return params.hasOwnProperty("xml3d_noculling");
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
        this.lightsNeedUpdate = true;
        this.systemUniforms = {};
        this.addListeners();
    };
    var EVENT_TYPE = webgl.Scene.EVENT_TYPE;

    XML3D.createClass(GLScene, webgl.Scene);

    GLScene.LIGHT_PARAMETERS = ["pointLightPosition", "pointLightAttenuation", "pointLightIntensity", "pointLightOn",
         "directionalLightDirection", "directionalLightIntensity", "directionalLightOn",
         "spotLightAttenuation", "spotLightPosition", "spotLightIntensity", "spotLightDirection",
         "spotLightOn", "spotLightSoftness", "spotLightCosFalloffAngle", "spotLightCosSoftFalloffAngle"];


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
            if(this.lightsNeedUpdate){
                this.lightsNeedUpdate = false;
                this.updateLightParameters();
            }

            this.updateObjectsForRendering();
            // Make sure that shaders are updates AFTER objects
            // Because unused shader closures are cleared on updae
            this.updateShaders();
        },
        updateLightParameters: function(){
            var parameters = this.systemUniforms, lights = this.lights;

            var pointLightData = { position: [], attenuation: [], intensity: [], on: [] };
            lights.point.forEach(function (light, index) {
                light.getLightData(pointLightData, index);
            });
            parameters["pointLightPosition"] = pointLightData.position;
            parameters["pointLightAttenuation"] = pointLightData.attenuation;
            parameters["pointLightIntensity"] = pointLightData.intensity;
            parameters["pointLightOn"] = pointLightData.on;

            var directionalLightData = { direction: [], intensity: [], on: [] };
            lights.directional.forEach(function (light, index) {
                light.getLightData(directionalLightData, index);
            });
            parameters["directionalLightDirection"] = directionalLightData.direction;
            parameters["directionalLightIntensity"] = directionalLightData.intensity;
            parameters["directionalLightOn"] = directionalLightData.on;

            var spotLightData = { position: [], attenuation: [], direction: [], intensity: [], on: [], softness: [], falloffAngle: [], castShadow: [], lightMatrix: [] };
            lights.spot.forEach(function (light, index) {
                light.getLightData(spotLightData, index);
            });
            parameters["spotLightAttenuation"] = spotLightData.attenuation;
            parameters["spotLightPosition"] = spotLightData.position;
            parameters["spotLightIntensity"] = spotLightData.intensity;
            parameters["spotLightDirection"] = spotLightData.direction;
            parameters["spotLightOn"] = spotLightData.on;
            parameters["spotLightSoftness"] = spotLightData.softness;
            parameters["spotLightCosFalloffAngle"] = spotLightData.falloffAngle.map(Math.cos);
            parameters["spotLightCastShadow"] = spotLightData.castShadow;
            parameters["spotLightMatrix"] = spotLightData.lightMatrix;

            var softFalloffAngle = spotLightData.softness.slice();
            for (var i = 0; i < softFalloffAngle.length; i++)
                softFalloffAngle[i] = softFalloffAngle[i] * (1.0 - spotLightData.softness[i]);
            parameters["spotLightCosSoftFalloffAngle"] = softFalloffAngle.map(Math.cos);
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
                    obj.inFrustum = omitCulling ? true : c_frustumTest.isBoxVisible(c_bbox);
                };
            }
        }()),
        updateReadyObjectsFromMatrices: function (worldToViewMatrix, projectionMatrix) {
            var readyObjects = this.ready;
            for(var i = 0, l = readyObjects.length; i < l; i++) {
                var obj = readyObjects[i];
                obj.updateModelViewMatrix(worldToViewMatrix);
                obj.updateNormalMatrix();
                obj.updateModelViewProjectionMatrix(projectionMatrix);
            };
        },
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
                this.lightsNeedUpdate = true;
                this.shaderFactory.setLightStructureDirty();
            });
            this.addEventListener( EVENT_TYPE.LIGHT_VALUE_CHANGED, function(event){
                this.lightsNeedUpdate = true;
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
