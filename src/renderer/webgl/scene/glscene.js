var Scene = require("./../../renderer/scene/scene.js");
var DrawableFactory = require("./drawable-factory.js");
var C = require("./../../renderer/scene/constants.js");
var FrustumTest = require("./../../renderer/tools/frustum.js").FrustumTest;
var ShaderComposerFactory = require("../materials/shadercomposerfactory.js");
var Options = require("../../../utils/options.js");
var ShadowMapService = require("../materials/shadowmap-service");

var OPTION_FRUSTUM_CULLING = "renderer-frustumCulling";
var OPTION_SHADEJS_EXTRACT_UNIFORMS = "shadejs-extractUniformExpressions";
var OPTION_SHADEJS_TRANSFORM_SPACES = "shadejs-transformSpaces";
var OPTION_SHADEJS_CACHE = "shadejs-cache";


// All the shader flags
var FLAGS = {};
FLAGS[OPTION_SHADEJS_EXTRACT_UNIFORMS] = {defaultValue: false, recompileOnChange: true};
FLAGS[OPTION_SHADEJS_TRANSFORM_SPACES] = {defaultValue: true, recompileOnChange: true};
FLAGS[OPTION_FRUSTUM_CULLING] = {defaultValue: true, recompileOnChange: false};
FLAGS[OPTION_SHADEJS_CACHE] = {defaultValue: true, recompileOnChange: false};

for (var flag in FLAGS) {
    Options.register(flag, FLAGS[flag].defaultValue);
}


/**
 *
 * @param {GLContext} context
 * @extends {Scene}
 * @constructor
 */
var GLScene = function (context) {
    Scene.call(this);
    this.context = context;
    this.shaderFactory = new ShaderComposerFactory(context);
    this.drawableFactory = new DrawableFactory();

    this.shadowMapService = new ShadowMapService(context, this);
    /**
     * @type {Array.<RenderObject>}
     */
    this.ready = [];
    this.queue = [];
    this.lightsNeedUpdate = true;
    this.systemUniforms = {};
    this.deferred = window['XML3D_DEFERRED'] || false;
    this.colorClosureSignatures = [];
    this.doFrustumCulling = !!Options.getValue(OPTION_FRUSTUM_CULLING);
    this.addListeners();
};

XML3D.createClass(GLScene, Scene);

function removeSafe(arr, obj) {
    var index = arr.indexOf(obj);
    if (index != -1) {
        arr.splice(index, 1);
        return true;
    }
    return false;
}

XML3D.extend(GLScene.prototype, {
    remove: function (obj) {
        removeSafe(this.queue, obj);
        removeSafe(this.ready, obj);
    },

    clear: function () {
        this.ready = [];
        this.queue = [];
    },

    moveFromQueueToReady: function (obj) {
        if (removeSafe(this.queue, obj)) {
            this.ready.push(obj);
        }
    },

    moveFromReadyToQueue: function (obj) {
        if (removeSafe(this.ready, obj)) {
            this.queue.push(obj);
        }
    },

    update: function () {
        if (this.lightsNeedUpdate) {
            this.lightsNeedUpdate = false;
            this.updateLightParameters();
        }
        this.updateObjectsForRendering();

        // Render shadow maps if necessary
        this.shadowMapService.updateForRendering();

        // Make sure that shaders are updates AFTER objects
        // Because unused shader closures are cleared on update
        this.updateShaders();
    }, updateLightParameters: function () {
        var parameters = this.systemUniforms;

        this.lights.fillGlobalParameters(parameters);
        this.shadowMapService.fillGlobalParameters(parameters);

        // Derived parameters that are implementation specific.
        // TODO: Put those to an appropriate place
        var spotLightFalloffAngle = parameters["spotLightFalloffAngle"];
        var spotLightSoftness = parameters["spotLightSoftness"];
        if(spotLightFalloffAngle) {
            // Map both parameters into cosinus space
            var spotLightCosSoftFalloffAngle = [];
            var spotLightCosFalloffAngle = [];
            for (var i = 0; i < spotLightFalloffAngle.length; i++) {
                spotLightCosFalloffAngle[i] = Math.cos(spotLightFalloffAngle[i]);
                spotLightCosSoftFalloffAngle[i] = Math.cos(spotLightFalloffAngle[i] * (1.0 - spotLightSoftness[i]));
            }
            parameters["spotLightCosFalloffAngle"] = spotLightCosFalloffAngle;
            parameters["spotLightCosSoftFalloffAngle"] = spotLightCosSoftFalloffAngle;
        }


    },

    updateSystemUniforms: function (names) {
        this.shaderFactory.updateSystemUniforms(names, this);
    },

    updateShaders: function () {
        this.shaderFactory.update(this);
    },

    updateObjectsForRendering: function () {
        this.forEach(function (obj) {
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
        var c_frustumTest = new FrustumTest();

        return function (aspectRatio) {
            var activeView = this.getActiveView(), readyObjects = this.ready;

            // Update all MV matrices
            activeView.getWorldToViewMatrix(c_worldToViewMatrix);
            readyObjects.forEach(function (obj) {
                obj.updateModelViewMatrix(c_worldToViewMatrix);
                obj.updateModelMatrixN();
                obj.updateModelViewMatrixN();
            });

            this.updateBoundingBox();


            activeView.getProjectionMatrix(c_projMat_tmp, aspectRatio);
            activeView.getViewToWorldMatrix(c_viewToWorldMatrix);

            var frustum = activeView.getFrustum();
            c_frustumTest.set(frustum, c_viewToWorldMatrix);

            for (var i = 0, l = readyObjects.length; i < l; i++) {
                var obj = readyObjects[i];
                obj.updateModelViewProjectionMatrix(c_projMat_tmp);
                obj.getWorldSpaceBoundingBox(c_bbox);
                obj.inFrustum = this.doFrustumCulling ? c_frustumTest.isBoxVisible(c_bbox) : true;
            }
        }
    }()),
    updateReadyObjectsFromMatrices: function (worldToViewMatrix, projectionMatrix) {
        var readyObjects = this.ready;
        for (var i = 0, l = readyObjects.length; i < l; i++) {
            var obj = readyObjects[i];
            obj.updateModelViewMatrix(worldToViewMatrix);
            obj.updateModelMatrixN();
            obj.updateModelViewProjectionMatrix(projectionMatrix);
        }
    },
    addListeners: function () {
        this.addEventListener(C.EVENT_TYPE.SCENE_STRUCTURE_CHANGED, function (event) {
            if (event.newChild !== undefined) {
                this.addChildEvent(event.newChild);
            } else if (event.removedChild !== undefined) {
                this.removeChildEvent(event.removedChild);
            }
        });
        this.addEventListener(C.EVENT_TYPE.VIEW_CHANGED, function (/*event*/) {
            this.context.requestRedraw("Active view changed.");
        });
        this.addEventListener(C.EVENT_TYPE.LIGHT_STRUCTURE_CHANGED, function (/*event*/) {
            this.lightsNeedUpdate = true;
            this.shaderFactory.setLightStructureDirty();
            this.context.requestRedraw("Light structure changed.");
        });
        this.addEventListener(C.EVENT_TYPE.LIGHT_VALUE_CHANGED, function (event) {
            this.lightsNeedUpdate = true;
            this.shaderFactory.setLightValueChanged();
            this.lights.lightValueChanged(event.light);
            this.context.requestRedraw("Light value changed.");
        });
        Options.addObserver(this.onFlagsChange.bind(this));
    },

    addChildEvent: function (child) {
        if (child.type == C.NODE_TYPE.OBJECT) {
            this.queue.push(child);
            this.context.requestRedraw("Object was added to scene.");
        }
    },

    removeChildEvent: function (child) {
        if (child.type == C.NODE_TYPE.OBJECT) {
            this.remove(child);
            child.dispose();
            this.context.requestRedraw("Object was removed from scene.");
        }
    },

    handleResizeEvent: function (/*width, height*/) {
        this.getActiveView().setProjectionDirty();
    },

    createDrawable: function (obj) {
        return this.drawableFactory.createDrawable(obj, this.context);
    },

    requestRedraw: function (reason) {
        return this.context.requestRedraw(reason);
    },

    onFlagsChange: function (key, value) {
        if (FLAGS[key] && FLAGS[key].recompileOnChange)
            this.shaderFactory.setShaderRecompile();
        if (key == OPTION_FRUSTUM_CULLING) {
            this.doFrustumCulling = !!value;
        }
    }
});
module.exports = GLScene;

