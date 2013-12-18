XML3D.shaders.register("positionShader", {
    vertex : [
        "attribute vec3 position;",
        "attribute vec3 normal;",
        "uniform mat4 modelMatrix;",
        "uniform mat4 modelMatrixN;",
        "uniform mat4 modelViewProjectionMatrix;",

        "varying vec3 pos;",
        "varying vec3 norm;",

        "void main(void) {",
        "    pos = (modelMatrix * vec4(position, 1.0)).xyz;",
        "    norm = (modelMatrixN * vec4(normal, 0.0)).xyz;",
        "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragment : [
        "#extension GL_EXT_draw_buffers : require",
        "varying vec3 pos;",
        "varying vec3 norm;",
        "uniform vec3 color;",
        "void main(void) {",
        "    gl_FragData[0] = vec4(pos, 1);",
        "    gl_FragData[1] = vec4(norm, 1.0);",
        "    gl_FragData[2] = vec4(color, 1.0);",
        "    gl_FragData[3] = vec4(1.0, 0.0, 0.0, 1.0);",
        "}"
    ].join("\n"),

    uniforms : {}
});

XML3D.shaders.register("compositeShader", {

    vertex: [
        "attribute vec3 position;",

        "void main(void) {",
        "   gl_Position = vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragment: [
        "uniform sampler2D ct0;",
        "uniform sampler2D ct1;",
        "uniform sampler2D ct2;",
        "uniform sampler2D ct3;",
        "uniform sampler2D db;",
        "uniform vec2 canvasSize;",
        "void main(void) {",
        "    vec2 screenUV = gl_FragCoord.xy / canvasSize.xy;",
        "    gl_FragColor = vec4(texture2D(ct3, screenUV).rgb, 1);",
        "}"
    ].join("\n"),

    uniforms: {
        canvasSize : [512, 512]
    },

    samplers: {
        ct0: null,
        ct1: null,
        ct2: null,
        ct3: null,
        db: null
    }
});

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
        var colorTargetHandles = []
        var ctex = new XML3D.webgl.GLTexture(gl);
        ctex.createTex2DFromData(gl.RGBA, width, height, gl.RGBA, gl.FLOAT, opt);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, ctex.handle, 0);
        colorTargetHandles[0] = ctex;

        ctex = new XML3D.webgl.GLTexture(gl);
        ctex.createTex2DFromData(gl.RGBA, width, height, gl.RGBA, gl.FLOAT, opt);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + 1, gl.TEXTURE_2D, ctex.handle, 0);
        colorTargetHandles[1] = ctex;

        ctex = new XML3D.webgl.GLTexture(gl);
        ctex.createTex2DFromData(gl.RGBA, width, height, gl.RGBA, gl.FLOAT, opt);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + 2, gl.TEXTURE_2D, ctex.handle, 0);
        colorTargetHandles[2] = ctex;

        ctex = new XML3D.webgl.GLTexture(gl);
        ctex.createTex2DFromData(gl.RGBA, width, height, gl.RGBA, gl.FLOAT, opt);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + 3, gl.TEXTURE_2D, ctex.handle, 0);
        colorTargetHandles[3] = ctex;

        drawBuffersExt.drawBuffersWEBGL([
            gl.COLOR_ATTACHMENT0,
            gl.COLOR_ATTACHMENT0 + 1,
            gl.COLOR_ATTACHMENT0 + 2,
            gl.COLOR_ATTACHMENT0 + 3
        ]);

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

    var DeferredPipeline = function (context, scene) {
        if (!context.extensions['WEBGL_draw_buffers']
            || !context.extensions['OES_texture_float']
            || !context.extensions['WEBGL_depth_texture'])
            XML3D.debug.logError("Deferred shading is not supported due to missing WebGL extensions. Sorry!");

        webgl.RenderPipeline.call(this, context);

        scene.addEventListener(webgl.Scene.EVENT_TYPE.SHADER_CHANGED, this.onShaderChange.bind(this));
        this.gbufferPass = null;
        this.shadePass = null;

        this.createRenderPasses();
    };

    XML3D.createClass(DeferredPipeline, webgl.RenderPipeline);

    XML3D.extend(DeferredPipeline.prototype, {
        init: function () {
            var context = this.context;
            this.gbufferTarget = createFrameBuffer(context);
            this.gbufferPass.init(context);
            this.shadePass.init(context)
        },

        onShaderChange: function (event) {
            // Get new list of attributes and build render targets.
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
            var c_worldToViewMatrix = XML3D.math.mat4.create();
            var c_projectionMatrix = XML3D.math.mat4.create();
            var c_programSystemUniforms = ["viewMatrix", "projectionMatrix", "screenWidth", "cameraPosition"];

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
                scene.getActiveView().getWorldToViewMatrix(c_worldToViewMatrix);
                scene.getActiveView().getProjectionMatrix(c_projectionMatrix, aspect);

                systemUniforms["viewMatrix"] = c_worldToViewMatrix;
                systemUniforms["projectionMatrix"] = c_projectionMatrix;
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
                    self.renderObjectsToActiveBuffer(objectList, scene, systemUniforms, c_programSystemUniforms);
                });

                target.unbind();
            }
        }()),

        renderObjectsToActiveBuffer: (function () {
            var tmpModelMatrix = XML3D.math.mat4.create();
            var tmpModelMatrixN = XML3D.math.mat4.create();
            var tmpModelView = XML3D.math.mat4.create();
            var tmpModelViewProjection = XML3D.math.mat4.create();
            var tmpModelViewN = XML3D.math.mat3.create();
            var c_objectSystemUniforms = ["modelMatrix", "modelMatrixN", "modelViewMatrix", "modelViewProjectionMatrix", "modelViewMatrixN"];

            return function (objectArray, scene, systemUniforms, sceneParameterFilter) {
                //var program = objectArray[0].getProgram();
                var program = this.pipeline.getShader("position");
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

                    program.setSystemUniformVariables(c_objectSystemUniforms, systemUniforms);

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
            this.pipeline.addShader("composite", context.programFactory.getProgramByName("compositeShader"));
            this.screenQuad = new XML3D.webgl.FullscreenQuad(context);
            this.canvasSize = new Float32Array([context.canvasTarget.width, context.canvasTarget.height]);
            this.uniformsDirty = true;
        },

        setNonVolatileShaderUniforms: (function() {
            var c_systemUniformNames = ["db", "ct0", "ct1", "ct2", "ct3", "canvasSize"];

            return function(program) {
//                if (!this.uniformsDirty) {
//                    return;
//                }
                var uniforms = {};
                uniforms["canvasSize"] = this.canvasSize;
                uniforms["db"] = [this.pipeline.gbufferTarget.depthTargetHandle];
                uniforms["ct0"] = [this.pipeline.gbufferTarget.colorTargetHandles[0]];
                uniforms["ct1"] = [this.pipeline.gbufferTarget.colorTargetHandles[1]];
                uniforms["ct2"] = [this.pipeline.gbufferTarget.colorTargetHandles[2]];
                uniforms["ct3"] = [this.pipeline.gbufferTarget.colorTargetHandles[3]];
                program.setSystemUniformVariables(c_systemUniformNames, uniforms);
                this.uniformsDirty = false;
            }
        })(),

        render: function () {
            var gl = this.pipeline.context.gl;
            this.output.bind();
            gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
            var program = this.pipeline.getShader("composite");
            program.bind();
            this.setNonVolatileShaderUniforms(program);
            this.screenQuad.draw(program);
            program.unbind();
//            this.output.unbind();
        }
    });

    webgl.DeferredShadingPass = ShadePass;

}(XML3D.webgl));

