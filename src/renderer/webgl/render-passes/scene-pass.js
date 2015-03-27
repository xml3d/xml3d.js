var BaseRenderPass = require("./base.js");
var Options = require("../../../utils/options.js");
var GLBackfaceRenderTarget = require("../base/backfacerendertarget.js");
var OctreeNode = require("../volume/octreenode.js");
var mat4 = require("gl-matrix").mat4;
var mat3 = require("gl-matrix").mat3;

var OPTION_FACECULLING = "renderer-faceculling";
var OPTION_FRONTFACE = "renderer-frontface";

Options.register(OPTION_FACECULLING, "none");
Options.register(OPTION_FRONTFACE, "ccw");

/**
 * @constructor
 */
var SceneRenderPass = function (renderInterface, output, opt) {
    BaseRenderPass.call(this, renderInterface, output, opt);

    var context = renderInterface.context;
    /**
     * @type {function}
     */
    this.setFaceCulling = getGlobalFaceCullingSetter(Options.getValue(OPTION_FACECULLING));
    /**
     * @type {function}
     */
    this.setFrontFace = getGlobalFrontFaceSetter(Options.getValue(OPTION_FRONTFACE));

    if (!context.backfaceTarget) {
        context.backfaceTarget = new GLBackfaceRenderTarget(context);
    }
    /**
     * Program for volume rendering
     * @type {GLProgramObject}
     */
    this.backfaceProgram = context.programFactory.getBackfaceProgram();

    var that = this;
    Options.addObserver(OPTION_FACECULLING, function (key, value) {
        that.setFaceCulling = getGlobalFaceCullingSetter(value);
    });
    Options.addObserver(OPTION_FRONTFACE, function (key, value) {
        that.setFrontFace = getGlobalFrontFaceSetter(value);
    });
};

XML3D.createClass(SceneRenderPass, BaseRenderPass, {
    setGLStates: function () {
        var gl = this.renderInterface.context.gl;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
        this.setFaceCulling(gl);
        this.setFrontFace(gl);
        gl.enable(gl.DEPTH_TEST);
    }, /**
     * @param Array
     */
    renderObjectsToActiveBuffer: (function () {
        var tmpModelMatrix = mat4.create();
        var tmpModelMatrixN = mat3.create();
        var tmpModelView = mat4.create();
        var tmpModelViewProjection = mat4.create();
        var tmpModelViewN = mat3.create();
        var c_objectSystemUniforms = ["modelMatrix", "modelMatrixN", "modelViewMatrix", "modelViewProjectionMatrix", "modelViewMatrixN"];

        return function (objectArray, scene, target, systemUniforms, sceneParameterFilter, opt) {
            var objCount = 0;
            var primitiveCount = 0;
            var stats = opt.stats || {};
            var transparent = opt.transparent === true || false;
            var gl = this.renderInterface.context.gl;
            var program = opt.program || objectArray[0].getProgram();

            if (objectArray.length == 0) {
                return stats;
            }

            if (transparent) {
                gl.enable(gl.BLEND);
                if (this.isVolume(objectArray[0])) {
                    // TODO(ksons): Set other blendfunc if not premultiply alpha
                    // source colour is already pre-multiplied with alpha (XML3D sets gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL in true)
                    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // back-to-front
                } else {
                    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                }
            }

            // At this point, we guarantee that the RenderObject has a valid shader
            program.bind();

            //Set global data that is shared between all objects using this shader
            program.setSystemUniformVariables(sceneParameterFilter, systemUniforms);

            var prevOverride = null;

            for (var i = 0, n = objectArray.length; i < n; i++) {
                var obj = objectArray[i];

                var octreeNode;
                if (obj instanceof OctreeNode) {
                    octreeNode = obj;
                    obj = obj.renderObject;
                }

                if (!obj.visible) {
                    continue;
                }

                var mesh = obj.mesh;
                XML3D.debug.assert(mesh, "We need a mesh at this point.");

                obj.getWorldMatrix(tmpModelMatrix);
                systemUniforms["modelMatrix"] = tmpModelMatrix;

                obj.getModelMatrixN(tmpModelMatrixN);
                systemUniforms["modelMatrixN"] = tmpModelMatrixN;

                obj.getModelViewMatrix(tmpModelView);
                systemUniforms["modelViewMatrix"] = tmpModelView;

                obj.getModelViewProjectionMatrix(tmpModelViewProjection);
                systemUniforms["modelViewProjectionMatrix"] = tmpModelViewProjection;

                obj.getModelViewMatrixN(tmpModelViewN);
                systemUniforms["modelViewMatrixN"] = tmpModelViewN;

                systemUniforms["screenWidth"] = target.width; // TODO: Use coord instead?

                program.setSystemUniformVariables(c_objectSystemUniforms, systemUniforms);

                var override = mesh.uniformOverride;
                if (this.isVolume(obj)) {
						this.setVolumeParameters(octreeNode, override, program, gl);
                }

                program.changeUniformVariableOverride(prevOverride, override);
                prevOverride = mesh.uniformOverride;

                primitiveCount += mesh.draw(program);
                objCount++;

                if (this.isVolume(obj)) {
                    this.resetVolumeParameters(obj);
                }

                if (transparent) {
                    gl.disable(gl.BLEND);
                }

            }
            program.changeUniformVariableOverride(prevOverride, null);

            program.unbind();
            stats.objects += objCount;
            stats.primitives += primitiveCount;
            return stats;
        }
    }()),

        isVolume: function (obj) {
			return obj.drawable.getType() == "volume";
		},

		setVolumeParameters: function (octreeNode, override, program, gl) {
			var mesh = octreeNode.renderObject.mesh;
			mesh.buffers["position"] = octreeNode.positionBuffer;

			if (program.descriptor.name == "raycaster") {
				override = octreeNode.addVolumeOverrides(override);
				var actualProgram = program.program;

                if (program.samplers["volumeData"] && program.samplers["backface"]) {
                    if (octreeNode.volumeDataTexture) {
                        actualProgram.setUniformVariable("volumeData", [octreeNode.volumeDataTexture]);
                    }
                    actualProgram.setUniformVariable("noiseFunction", [mesh.noiseTexture]);
                    actualProgram.setUniformVariable("backface", [this.renderInterface.context.backfaceTarget.backfaceSamplerTexture]);
                }



                // TODO(ksons): Widgets do not belong into xml3d.js => Rewrite
                // var shaderElemId = octreeNode.renderObject.shaderHandle.adapter.node.attributes.id.value;
                //if (XML3D.webgl.transferFunctionWidgets) {
				//	var widget = XML3D.webgl.transferFunctionWidgets[shaderElemId];
				//	if (widget && program.samplers["transferFunction"]) {
				//		var tfTexture = program.samplers["transferFunction"].texture[0].handle;
				//		gl.bindTexture(gl.TEXTURE_2D, tfTexture);
				//		gl.texImage2D (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, widget);
				//		gl.bindTexture(gl.TEXTURE_2D, null);
				//	}
				//}
				program.bind();
			}
		},

		resetVolumeParameters: function (obj) {
			obj.mesh.buffers["position"] = obj.drawable.positionBuffer;
		},

		renderOpaqueObjectsToBackfaceBuffer: function (opaqueObjects, scene, target, systemUniforms, c_programSystemUniforms,  gl) {
			var objectArray = [];
			for (var shaderId in opaqueObjects) {
				objectArray.push.apply(objectArray, opaqueObjects[shaderId]);
			}
			if (objectArray.length > 0) {
				gl.cullFace( gl.BACK );
				this.renderObjectsToActiveBuffer(objectArray, scene, target, systemUniforms, c_programSystemUniforms,  { program: this.backfaceProgram });
			}
        },

		renderVolumeBackSideToBackfaceBuffer: function (volumeObj, scene, target, systemUniforms, c_programSystemUniforms,  gl) {
			gl.cullFace( gl.FRONT );
			this.renderObjectsToActiveBuffer([volumeObj], scene, target, systemUniforms, c_programSystemUniforms, { program: this.backfaceProgram });
		},

		renderBackfacePass: function (volumeObj, opaqueObjects, scene, target, systemUniforms, c_programSystemUniforms,  gl) {
			target.unbind();
			this.renderInterface.context.backfaceTarget.bind();
			this.renderOpaqueObjectsToBackfaceBuffer(opaqueObjects, scene, target, systemUniforms, c_programSystemUniforms, gl);
			this.renderVolumeBackSideToBackfaceBuffer(volumeObj, scene, target, systemUniforms, c_programSystemUniforms,gl);
			this.renderInterface.context.backfaceTarget.unbind();
			target.bind();
        },

		renderColorPass: function (volumeObj, scene, target, systemUniforms, c_programSystemUniforms, gl, opts) {
			gl.cullFace( gl.BACK );
			this.renderObjectsToActiveBuffer([volumeObj], scene, target, systemUniforms, c_programSystemUniforms, opts);
		},

		drawVolumeObject: function (volumeObj, opaqueObjects, scene, target, systemUniforms, c_programSystemUniforms, opts) {
			if (!volumeObj.visible) {
				return;
			}

			var gl = this.renderInterface.context.gl;
			gl.enable( gl.CULL_FACE );
			this.renderBackfacePass(volumeObj, opaqueObjects, scene, target, systemUniforms, c_programSystemUniforms, gl);
			this.renderColorPass(volumeObj, scene, target, systemUniforms, c_programSystemUniforms, gl, opts);
			gl.disable( gl.CULL_FACE );
		}
});

function getGlobalFrontFaceSetter(mode) {
    if (mode.toLowerCase() == "cw") {
        return function (gl) {
            gl.frontFace(gl.CW);
        };
    }
    return function (gl) {
        gl.frontFace(gl.CCW);
    };
}

function getGlobalFaceCullingSetter(mode) {
    //noinspection FallthroughInSwitchStatementJS
    switch (mode.toLowerCase()) {
        case "back":
            return function (gl) {
                gl.enable(gl.CULL_FACE);
                gl.cullFace(gl.BACK);
            };
            break;
        case "front":
            return function (gl) {
                gl.enable(gl.CULL_FACE);
                gl.cullFace(gl.FRONT);
            };
            break;
        case "both":
            return function (gl) {
                gl.enable(gl.CULL_FACE);
                gl.cullFace(gl.FRONT_AND_BACK);
            };
            break;
        case "none":
        default:
            return function (gl) {
                gl.disable(gl.CULL_FACE);
            };
    }
}

module.exports = SceneRenderPass;
