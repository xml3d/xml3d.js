(function (webgl) {

    function createFrameBuffer(context) {
        var gl = context.gl;
        var drawBuffersExt = context.extensions["WEBGL_draw_buffers"]
        var width = context.canvasTarget.width;
        var height = context.canvasTarget.height;
        var handle = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, handle);

        var opt = {
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE,
            minFilter: gl.NEAREST,
            magFilter: gl.NEAREST,
            isDepth: true
        };
        //depth component
        var dtex = new XML3D.webgl.GLTexture(gl);
        dtex.createTex2DFromData(gl.DEPTH_COMPONENT, width, height, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, opt);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, dtex.handle, 0);
        var depthTargetHandle = dtex;
        opt.isDepth = false;

        //color attachments
        var targetCount = 8;
        var colorTargetHandles = [];
        var attachments = [];
        for (var i = 0; i < targetCount; ++i) {
            var ctex = new XML3D.webgl.GLTexture(gl);
            var attachment = gl.COLOR_ATTACHMENT0 + i;
            ctex.createTex2DFromData(gl.RGBA, width, height, gl.RGBA, gl.FLOAT, opt);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, ctex.handle, 0);
            colorTargetHandles[i] = ctex;
            attachments[i] = attachment;
        }

        drawBuffersExt.drawBuffersWEBGL(attachments);

        var fbStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        switch (fbStatus) {
            case gl.FRAMEBUFFER_COMPLETE:
                break;
            case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
                XML3D.debug.logError("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_ATTACHMENT");
                break;
            case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
                XML3D.debug.logError("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT");
                break;
            case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
                XML3D.debug.logError("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_DIMENSIONS");
                break;
            case gl.FRAMEBUFFER_UNSUPPORTED:
                XML3D.debug.logError("Incomplete framebuffer: FRAMEBUFFER_UNSUPPORTED");
                break;
            default:
                XML3D.debug.logError("Incomplete framebuffer: " + fbStatus);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return {
            frameBuffer: handle,
            depthTargetHandle: depthTargetHandle,
            colorTargetHandles: colorTargetHandles,
            bind: function () {
                gl.bindFramebuffer(gl.FRAMEBUFFER, handle);
                gl.viewport(0, 0, width, height);
            },
            unbind: function () {
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            },
            getWidth: function () {
                return width;
            },
            getHeight: function () {
                return height;
            }
        }
    }

    var c_SystemUpdate = {
        "pointLightOn": {
            staticValue : "MAX_POINTLIGHTS",
            staticSize: ["pointLightOn", "pointLightAttenuation", "pointLightIntensity", "pointLightPosition"]
        },
        "directionalLightOn" : {
            staticValue: "MAX_DIRECTIONALLIGHTS",
            staticSize: ["directionalLightOn", "directionalLightIntensity", "directionalLightDirection" ]
        },
        "spotLightOn" : {
            staticValue: "MAX_SPOTLIGHTS",
            staticSize: ["spotLightOn", "spotLightAttenuation", "spotLightIntensity",
                "spotLightPosition", "spotLightDirection", "spotLightCosFalloffAngle", "spotLightCosSoftFalloffAngle", "spotLightCastShadow", "spotLightShadowBias", "spotLightShadowMap", "spotLightMatrix"]
        }
    };
    var targetNames = ["deferred0", "deferred1", "deferred2", "deferred3", "deferred4", "deferred5", "deferred6", "deferred7"];

    var DeferredPipeline = function (context, scene) {
        if (!context.extensions['WEBGL_draw_buffers']
            || !context.extensions['OES_texture_float']
            || !context.extensions['WEBGL_depth_texture'])
            XML3D.debug.logError("Deferred shading is not supported due to missing WebGL extensions. Sorry!");

        webgl.RenderPipeline.call(this, context);
        this.scene = scene;
        scene.addEventListener(webgl.Scene.EVENT_TYPE.SHADER_CHANGED, this.onShaderChange.bind(this));
        scene.addEventListener(webgl.ShaderComposerFactory.EVENT_TYPE.MATERIAL_INITIALIZED, this.onShaderChange.bind(this));

        scene.addEventListener(webgl.Scene.EVENT_TYPE.LIGHT_VALUE_CHANGED, this.onLightChange.bind(this));
        scene.addEventListener(webgl.Scene.EVENT_TYPE.LIGHT_STRUCTURE_CHANGED, this.onLightChange.bind(this));
        this.gbufferPass = null;
        this.shadePass = null;

        this.createRenderPasses();
    };

    XML3D.createClass(DeferredPipeline, webgl.RenderPipeline);

    XML3D.extend(DeferredPipeline.prototype, {
        init: function () {
            var context = this.context;
            this.createLightPassProgram(this.scene);
            this.gbufferTarget = createFrameBuffer(context);
            this.gbufferPass.init(context);
            this.shadePass.init(context)
        },

        createLightPassProgram: function (scene) {
            var contextData = {
                "this" : webgl.getJSSystemConfiguration(this.context),
                "global.shade" :[{"extra": {"type": "object", "kind": "any", "global": true, "info": {}}}]
            };

            var systemUniforms = scene.systemUniforms, systemInfo = contextData["this"].info;
            for(var systemSource in c_SystemUpdate){
                var entry = c_SystemUpdate[systemSource];
                var length = systemUniforms[systemSource] && systemUniforms[systemSource].length;
                systemInfo[entry.staticValue].staticValue = length;
                for(var i = 0; i < entry.staticSize.length; ++i)
                    systemInfo[entry.staticSize[i]].staticSize = length;
            }

            var contextInfo = contextData["global.shade"][0].extra.info;

            for (var i = 0; i < targetNames.length; ++i) {
                var paramName = targetNames[i];
                contextInfo[paramName] = { type: Shade.TYPES.OBJECT, kind: Shade.OBJECT_KINDS.TEXTURE, source: Shade.SOURCES.UNIFORM};
            }

            var aast = Shade.getLightPassAast(scene.colorClosureSignatures, contextData);
            var glslShader = Shade.compileFragmentShader(aast);
            var source = {
                fragment: glslShader.source,
                vertex: [
                    "attribute vec3 position;",

                    "void main(void) {",
                    "   gl_Position = vec4(position, 1.0);",
                    "}"
                ].join("\n")
            };
            this.uniformSetter = glslShader.uniformSetter;
            this.lightPassProgram = new XML3D.webgl.GLProgramObject(this.context.gl, source);
            console.log(source.fragment);
        },

        onShaderChange: function (event) {
            this.createLightPassProgram(event.target);
            this.onLightChange(event);
        },

        onLightChange: function (event) {
            this.setUniformVariables([], webgl.GLScene.LIGHT_PARAMETERS, {
                envBase: {},
                sysBase: event.target.systemUniforms
            }, this.lightPassProgram.setUniformVariable.bind(this.lightPassProgram));
        },

        createRenderPasses: function() {
            this.gbufferPass = new webgl.GBufferPass(this);
            this.shadePass = new webgl.DeferredShadingPass(this);
            this.addRenderPass(this.gbufferPass);
            this.addRenderPass(this.shadePass);
        },

        render: function (scene) {
            this.gbufferPass.setProcessed(false);
            this.shadePass.setProcessed(false);
            webgl.RenderPipeline.prototype.render.call(this, scene);
        },

        setUniformVariables: function (envNames, sysNames, inputCollection) {
            this.uniformSetter(envNames, sysNames, inputCollection, this.lightPassProgram.setUniformVariable.bind(this.lightPassProgram));
        }

    });

    webgl.DeferredPipeline = DeferredPipeline;

    var GBufferPass = function (pipeline) {
        webgl.BaseRenderPass.call(this, pipeline);
    };

    XML3D.createClass(GBufferPass, webgl.BaseRenderPass);

    XML3D.extend(GBufferPass.prototype, {
        init: function(context) {
            this.output = this.pipeline.gbufferTarget;
            this.pipeline.addShader("position", context.programFactory.getProgramByName("positionShader"));
        },

        render: (function () {
            var worldToViewMatrix = XML3D.math.mat4.create();
            var projectionMatrix = XML3D.math.mat4.create();
            var programSystemUniforms = ["viewMatrix", "projectionMatrix", "screenWidth", "cameraPosition"];

            return function (scene) {
                var gl = this.pipeline.context.gl,
                    target = this.output,
                    systemUniforms = scene.systemUniforms,
                    width = target.getWidth(),
                    height = target.getHeight(),
                    aspect = width / height;

                target.bind();
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
                gl.viewport(0, 0, width, height);
                gl.enable(gl.DEPTH_TEST);

                scene.updateReadyObjectsFromActiveView(aspect);
                scene.getActiveView().getWorldToViewMatrix(worldToViewMatrix);
                scene.getActiveView().getProjectionMatrix(projectionMatrix, aspect);

                systemUniforms["viewMatrix"] = worldToViewMatrix;
                systemUniforms["projectionMatrix"] = projectionMatrix;
                systemUniforms["cameraPosition"] = scene.getActiveView().getWorldSpacePosition();
                systemUniforms["screenWidth"] = width;

                var programIdObjectsMapping = [];
                scene.ready.forEach(function (obj) {
                    if (obj.inFrustum === false)
                        return;
                    var program = obj.getProgram();
                    programIdObjectsMapping[program.id] = programIdObjectsMapping[program.id] || [];
                    programIdObjectsMapping[program.id].push(obj);
                });
                var self = this;
                programIdObjectsMapping.forEach(function (objectList) {
                    self.renderObjectsToActiveBuffer(objectList, scene, systemUniforms, programSystemUniforms);
                });

                target.unbind();
            }
        }()),

        renderObjectsToActiveBuffer: (function () {
            var modelMatrix = XML3D.math.mat4.create();
            var modelMatrixN = XML3D.math.mat3.create();
            var modelView = XML3D.math.mat4.create();
            var modelViewProjection = XML3D.math.mat4.create();
            var modelViewN = XML3D.math.mat3.create();
            var objectSystemUniformNames = ["modelMatrix", "modelMatrixN", "modelViewMatrix", "modelViewProjectionMatrix", "modelViewMatrixN"];

            return function (objectArray, scene, systemUniforms, sceneParameterFilter) {
                var program = objectArray[0].getProgram();
//                var program = this.pipeline.getShader("position");
                if (objectArray.length === 0) {
                    return;
                }

                // At this point, we guarantee that the RenderObject has a valid shader
                program.bind();

                //Set global data that is shared between all objects using this shader
                program.setSystemUniformVariables(sceneParameterFilter, systemUniforms);


                for (var i = 0, n = objectArray.length; i < n; i++) {
                    var obj = objectArray[i];

                    var mesh = obj.mesh;
                    XML3D.debug.assert(mesh, "We need a mesh at this point.");

                    obj.getWorldMatrix(modelMatrix);
                    systemUniforms["modelMatrix"] = modelMatrix;

                    obj.getModelMatrixN(modelMatrixN);
                    systemUniforms["modelMatrixN"] = modelMatrixN;

                    obj.getModelViewMatrix(modelView);
                    systemUniforms["modelViewMatrix"] = modelView;

                    obj.getModelViewProjectionMatrix(modelViewProjection);
                    systemUniforms["modelViewProjectionMatrix"] = modelViewProjection;

                    obj.getModelViewMatrixN(modelViewN);
                    systemUniforms["modelViewMatrixN"] = modelViewN;

                    program.setSystemUniformVariables(objectSystemUniformNames, systemUniforms);

                    mesh.draw(program);
                }

                program.unbind();
            }
        }())
    });

    webgl.GBufferPass = GBufferPass;

    var ShadePass = function (pipeline) {
        webgl.BaseRenderPass.call(this, pipeline);
    };

    XML3D.createClass(ShadePass, webgl.BaseRenderPass);

    XML3D.extend(ShadePass.prototype, {
        init: function(context) {
            this.output = context.canvasTarget;
            this.screenQuad = new XML3D.webgl.FullscreenQuad(context);
            this.canvasSize = new Float32Array([context.canvasTarget.width, context.canvasTarget.height]);
            this.uniformsDirty = true;
        },

        render: (function () {
            var systemUniformNames = ["viewMatrix", "coords", "projectionMatrix", "cameraPosition"];
            var worldToViewMatrix = XML3D.math.mat4.create();
            var projectionMatrix = XML3D.math.mat4.create();
            return function (scene) {
                var gl = this.pipeline.context.gl;
                var aspect = this.output.width / this.output.height;

                var renderTargetUniforms= {};
                for (var i = 0; i < targetNames.length; ++i)
                    renderTargetUniforms[targetNames[i]] = [this.pipeline.gbufferTarget.colorTargetHandles[i]];

                scene.getActiveView().getWorldToViewMatrix(worldToViewMatrix);
                scene.getActiveView().getProjectionMatrix(projectionMatrix, aspect);
                var systemUniforms = {};
                systemUniforms["viewMatrix"] = worldToViewMatrix;
                systemUniforms["projectionMatrix"] = projectionMatrix;
                systemUniforms["cameraPosition"] = scene.getActiveView().getWorldSpacePosition();
                systemUniforms["coords"] = [this.output.width, this.output.height, 1];

                this.output.bind();
                gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
                var program = this.pipeline.lightPassProgram;
                program.bind();

                this.pipeline.setUniformVariables(targetNames, systemUniformNames, {
                    envBase: renderTargetUniforms,
                    sysBase: systemUniforms
                });

                this.screenQuad.draw(program);
                program.unbind();
            }
        })()
    });

    webgl.DeferredShadingPass = ShadePass;

}(XML3D.webgl));

