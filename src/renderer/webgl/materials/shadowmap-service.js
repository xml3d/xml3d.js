var EVENT_TYPE = require("../../renderer/scene/constants.js").EVENT_TYPE;
var Targets = require("../base/rendertarget");

var LightPass = require("../render-passes/light-pass");
var PointLightPass = require("../render-passes/pointlight-pass");

/**
 * @param {GLContext} context
 * @param {GLScene} scene
 * @constructor
 */
var ShadowMapService = function (context, scene) {
    this.context = context;
    scene.addEventListener(EVENT_TYPE.LIGHT_STRUCTURE_CHANGED, this.onLightStructureChanged.bind(this));
    scene.addEventListener(EVENT_TYPE.LIGHT_VALUE_CHANGED, this.onLightValueChanged.bind(this));
    scene.addEventListener(EVENT_TYPE.SCENE_SHAPE_CHANGED, this.onSceneShapeChanged.bind(this));

    this.shadowMapInfos = [];
    this.dirty = true;
};

XML3D.extend(ShadowMapService.prototype, {
    onLightStructureChanged: function (event) {
        var light = event.light, remove = light.removed, shadowMapInfos = this.shadowMapInfos;
        if (remove) {
            removeLight(shadowMapInfos, light);
        } else {
            if (lightNeedsShadowMap(light)) {
                addLight(shadowMapInfos, light);
                this.requestRendering("light added");
            }
        }
    },

    onLightValueChanged: function () {
        this.requestRendering("light value changed");
    },

    onSceneShapeChanged: function () {
        this.requestRendering("scene shape changed");
    },

    requestRendering: function(reason) {
        this.dirty = true;
    },

    updateForRendering: function() {
        if(this.dirty) {
            var shadowMaps = this.shadowMapInfos;
            for (var i = 0; i < shadowMaps.length; i++) {
                shadowMaps[i].pass.renderScene();
            }
            this.dirty = false;
        }
    },

    fillGlobalParameters: function(globals) {
        var shadowUnits = mergeShadowParameters(this.shadowMapInfos)
        XML3D.extend(globals, shadowUnits);
    }

});

function lightNeedsShadowMap(light) {
    return !!light.model.getParameter("castShadow")[0];
}

function addLight(shadowMapInfos, light) {
    var context = light.scene.context;
    var passInfo = createPassInfo(light, context);
    shadowMapInfos.push(passInfo);
}


function removeLight(shadowMapInfos, light) {
    for (var i = 0; i < shadowMapInfos.length; i++) {
        if (shadowMapInfos[i].light === light) {
            shadowMapInfos.splice(index, 1);
            // TODO: Free pass and other resources, free texture slot
            return;
        }
    }
}

function createPassInfo(light, context) {
    var size = Math.max(context.canvasTarget.width, context.canvasTarget.height) * 2;
    var params = {
        width: size,
        height: size,
        colorFormat: context.gl.RGBA,
        depthFormat: context.gl.DEPTH_COMPONENT16,
        stencilFormat: null,
        depthAsRenderbuffer: true
    };

    var pass = light.model.id == "point" ? createPointLightPass(light, context, params) : createLightPass(light, context, params);
    pass.init(context);

    // Bind target in order to create texture map
    pass.output.bind();

    // TODO: Better way to fix the texture unit?
    var unitEntry = context.textureManager.getEntry(pass.output.colorTarget.handle.id);
    unitEntry.fixed = true;

    pass.output.unbind();

    return {
        light: light, pass: pass, slot: unitEntry.slot
    };
}


function createLightPass(light, context, params) {
    var lightFramebuffer = new Targets.GLRenderTarget(context, params);
    return new LightPass({context: context}, lightFramebuffer, light);
}

function createPointLightPass(light, context, params) {
    var lightFramebuffer = new Targets.GLCubeMapRenderTarget(context, params);
    return new PointLightPass({context: context}, lightFramebuffer, light);
}

function mergeShadowParameters(shadowMapInfos) {
    var result = {};
    ["spot", "point", "directional"].forEach(function(model) {
        var sameModel = shadowMapInfos.filter(function(info) { return info.light.model.id == model; })
        result[model + "LightShadowMap"] = sameModel.map(function (info) {
            return info.slot;
        });
    });
    return result;
}

module.exports = ShadowMapService;
