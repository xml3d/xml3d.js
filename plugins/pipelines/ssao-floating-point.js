XML3D.shaders.register("positionShader", {
    vertex : [
        "attribute vec3 position;",
        "uniform mat4 modelMatrix;",
        "uniform mat4 modelViewProjectionMatrix;",

        "varying vec3 worldCoord;",

        "void main(void) {",
        "    worldCoord = (modelMatrix * vec4(position, 1.0)).xyz;",
        "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragment : [
        "varying vec3 worldCoord;",

        "void main(void) {",
        "    gl_FragColor = vec4(worldCoord, 1.0);",
        "}"
    ].join("\n"),

    uniforms : {}
});

XML3D.shaders.register("normalShader", {
    vertex : [
        "attribute vec3 position;",
        "attribute vec3 normal;",
        "uniform mat4 modelViewProjectionMatrix;",
        "uniform mat4 modelMatrix;",

        "varying vec3 fragNormal;",

        "void main(void) {",
        "    fragNormal = (modelMatrix * vec4(normal, 0.0)).xyz;",
        "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragment : [
        "varying vec3 fragNormal;",

        "void main(void) {",
        "   gl_FragColor = vec4((normalize(fragNormal)+1.0)/2.0, 1.0);",
        "}"
    ].join("\n"),

    uniforms : {}
});

XML3D.shaders.register("boxblur", {

    vertex: [
        "attribute vec3 position;",

        "void main(void) {",
        "   gl_Position = vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragment: [
        "uniform sampler2D sInTexture;",
        "uniform vec2 canvasSize;",
        "uniform vec2 blurOffset;",

        "const float blurSize = 1.0/512.0;",

        "void main(void) {",
        "   vec2 texcoord = (gl_FragCoord.xy / canvasSize.xy);",
        "   vec4 sum = vec4(0.0);",
        "   float blurSizeY = blurOffset.y / canvasSize.y;",
        "   float blurSizeX = blurOffset.x / canvasSize.x;",

        "   sum += texture2D(sInTexture, vec2(texcoord.x, texcoord.y - 1.5*blurSizeY));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x, texcoord.y - 2.0*blurSizeY));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x, texcoord.y - blurSizeY));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x, texcoord.y + blurSizeY));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x, texcoord.y + 2.0*blurSizeY));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x, texcoord.y + 1.5*blurSizeY));",

        "   sum += texture2D(sInTexture, vec2(texcoord.x - 1.5*blurSizeX, texcoord.y));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x - 2.0*blurSizeX, texcoord.y));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x - blurSizeX, texcoord.y));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x + blurSizeX, texcoord.y));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x + 2.0*blurSizeX, texcoord.y));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x + 1.5*blurSizeX, texcoord.y));",

        "    gl_FragColor = sum / 12.0;",
        "}"
    ].join("\n"),

    uniforms: {
        canvasSize : [512, 512],
        blurOffset : [1.0, 1.0]
    },

    samplers: {
        sInTexture : null
    }
});

XML3D.shaders.register("ssao-positions", {

    vertex : [
        "attribute vec2 position;",

        "void main(void) {",
        "    gl_Position = vec4(position, 0.0, 1.0);",
        "}"
    ].join("\n"),

    fragment : [
        "#ifdef GL_ES",
          "precision highp float;",
        "#endif",

        "uniform vec2 canvasSize;",
        "uniform sampler2D sPositionTex;",
        "uniform sampler2D sNormalTex;",
        "uniform sampler2D sRandomNormals;",
        "uniform vec2 uRandomTexSize;",
        "uniform float uSampleRadius;",
        "uniform float uScale;",
        "uniform float uBias;",
        "uniform float uIntensity;",
        "uniform vec2 uConstVectors[4];",
        "uniform mat4 viewMatrix;",

        "vec3 getPosition(vec2 uv) {",
            "return texture2D(sPositionTex, uv).xyz;",
        "}",

        "float calcAmbientOcclusion(vec2 screenUV, vec2 uvOffset, vec3 origin, vec3 cnorm) {",
        "	vec3 diff = getPosition(screenUV + uvOffset) - origin;",
        "	vec3 v = normalize(diff);",
        "	float dist = length(diff) * uScale;",
        "	return max(0.0, dot(cnorm, v) - uBias) * (1.0/(1.0 + dist)) * uIntensity;",
        "}",

         "void main(void) {",
        "   vec2 screenUV = gl_FragCoord.xy / canvasSize.xy;",
        "	vec2 rand = normalize(texture2D(sRandomNormals, gl_FragCoord.xy / uRandomTexSize).xy * 2.0 - 1.0 ) ;",
        "   vec3 norm = normalize(texture2D(sNormalTex, screenUV).xyz * 2.0 - 1.0 );",
        "	vec3 origin = getPosition(screenUV);",
        "	float radius = uSampleRadius / (viewMatrix * vec4(origin,1.0)).z;",
        "	float ao = 0.0;",

        "	const int iterations = 4;",
        "	for (int i = 0; i < iterations; ++i) {",
        "		vec2 coord1 = reflect(uConstVectors[i], rand) * radius;",
        "		vec2 coord2 = vec2(coord1.x*0.707 - coord1.y*0.707, coord1.x*0.707 + coord1.y*0.707);",
        "		ao += calcAmbientOcclusion(screenUV, coord1*0.25, origin, norm);",
        "		ao += calcAmbientOcclusion(screenUV, coord2*0.5, origin, norm);",
        "		ao += calcAmbientOcclusion(screenUV, coord1*0.75, origin, norm);",
        "		ao += calcAmbientOcclusion(screenUV, coord2, origin, norm);",
        "	}",
        "	ao /= float(iterations)*4.0;",
        "   gl_FragColor = vec4(ao, ao, ao, 1.0);",

        "}"
    ].join("\n"),

    uniforms: {
        canvasSize      : [512, 512],
        uConstVectors   : [1,0, -1,0, 0,1, 0,-1],
        uRandomTexSize  : [64,64],
        uSampleRadius   : 0.5,
        uScale			: 2.0,
        uBias			: 0.1,
        uIntensity		: 1.0
    },

    samplers: {
        sPositionTex   : null,
        sNormalTex	   : null,
        sRandomNormals : null
    },

     attributes: {
    }
});

XML3D.shaders.register("compositeSSAO", {

    vertex: [
        "attribute vec3 position;",

        "void main(void) {",
        "   gl_Position = vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragment: [

        "uniform sampler2D ssaoTexture;",
        "uniform sampler2D forwardTexture;",
        "uniform vec2 canvasSize;",

        "void main(void) {",
        "    vec2 screenUV = gl_FragCoord.xy / canvasSize.xy;",
        "	 vec3 ssaoColor = texture2D(ssaoTexture, screenUV).rgb;",
        "	 vec3 forwardColor = texture2D(forwardTexture, screenUV).rgb;",
        "    gl_FragColor = vec4(forwardColor * (1.0 - ssaoColor.r), 1.0);",
        "}"
    ].join("\n"),

    uniforms: {
        canvasSize : [512, 512]
    },

    samplers: {
        ssaoTexture : null,
        forwardTexture : null
    }
});

(function (webgl) {

    var PositionPass = function (pipeline, output, opt) {
        webgl.BaseRenderPass.call(this, pipeline, output, opt);
    };
    XML3D.createClass(PositionPass, webgl.BaseRenderPass);

    XML3D.extend(PositionPass.prototype, {
        init: function(context) {
            var shader = context.programFactory.getProgramByName("positionShader");
            this.pipeline.addShader("positions", shader);
        },

        render: (function () {
            return function (scene) {
                var gl = this.pipeline.context.gl,
                    target = this.pipeline.getRenderTarget(this.output);

                target.bind();
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                gl.viewport(0, 0, target.getWidth(), target.getHeight());
                gl.enable(gl.DEPTH_TEST);

                this.renderObjectsToActiveBuffer(scene.ready, scene);
                target.unbind();
            }
        }()),

        renderObjectsToActiveBuffer: (function () {
            var tmpModel = XML3D.math.mat4.create(),
                tmpModelViewProjection = XML3D.math.mat4.create(),
                c_uniformCollection = {envBase: {}, envOverride: null, sysBase: {}},
                c_systemUniformNames = ["modelMatrix", "modelViewProjectionMatrix"];

            return function (objectArray, scene) {
                if (objectArray.length == 0) {
                    return;
                }

                var program = this.pipeline.getShader("positions");
                program.bind();

                for (var i = scene.firstOpaqueIndex, n = objectArray.length; i < n; i++) {
                    var obj = objectArray[i];
                    if (!obj.isVisible())
                        continue;

                    var mesh = obj.mesh;
                    XML3D.debug.assert(mesh, "We need a mesh at this point.");

                    obj.getWorldMatrix(tmpModel);
                    c_uniformCollection.sysBase["modelMatrix"] = tmpModel;

                    obj.getModelViewProjectionMatrix(tmpModelViewProjection);
                    c_uniformCollection.sysBase["modelViewProjectionMatrix"] = tmpModelViewProjection;

                    program.setUniformVariables(null, c_systemUniformNames, c_uniformCollection);
                    mesh.draw(program);
                }
            }
        }())

    });


    webgl.PositionPass = PositionPass;

}(XML3D.webgl));

(function (webgl) {

    var NormalPass = function (pipeline, output, opt) {
        webgl.BaseRenderPass.call(this, pipeline, output, opt);
    };
    XML3D.createClass(NormalPass, webgl.BaseRenderPass);

    XML3D.extend(NormalPass.prototype, {
        init: function(context) {
            var shader = context.programFactory.getProgramByName("normalShader");
            this.pipeline.addShader("normals", shader);
        },

        render: (function () {
            return function (scene) {
                var gl = this.pipeline.context.gl,
                    target = this.pipeline.getRenderTarget(this.output);

                target.bind();
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                gl.viewport(0, 0, target.getWidth(), target.getHeight());
                gl.enable(gl.DEPTH_TEST);

                this.renderObjectsToActiveBuffer(scene.ready, scene);
                target.unbind();
            }
        }()),

        renderObjectsToActiveBuffer: (function () {
            var tmpModel = XML3D.math.mat4.create(),
                tmpModelViewProjection = XML3D.math.mat4.create(),
                c_uniformCollection = {envBase: {}, envOverride: null, sysBase: {}},
                c_systemUniformNames = ["modelMatrix", "modelViewProjectionMatrix"];

            return function (objectArray, scene) {
                if (objectArray.length == 0) {
                    return;
                }

                var program = this.pipeline.getShader("normals");
                program.bind();

                for (var i = scene.firstOpaqueIndex, n = objectArray.length; i < n; i++) {
                    var obj = objectArray[i];
                    if (!obj.isVisible())
                        continue;

                    var mesh = obj.mesh;
                    XML3D.debug.assert(mesh, "We need a mesh at this point.");

                    obj.getWorldMatrix(tmpModel);
                    c_uniformCollection.sysBase["modelMatrix"] = tmpModel;

                    obj.getModelViewProjectionMatrix(tmpModelViewProjection);
                    c_uniformCollection.sysBase["modelViewProjectionMatrix"] = tmpModelViewProjection;

                    program.setUniformVariables(null, c_systemUniformNames, c_uniformCollection);
                    mesh.draw(program);
                }
            }
        }())

    });


    webgl.NormalPass = NormalPass;

}(XML3D.webgl));

(function(webgl){

    var BoxBlurPass = function (pipeline, output, opt) {
        webgl.BaseRenderPass.call(this, pipeline, output, opt);
        this.blurOffset = [1.0, 1.0];
    };

    XML3D.createClass(BoxBlurPass, webgl.BaseRenderPass, {
        init: function(context) {
            var shaderH = context.programFactory.getProgramByName("boxblur");
            this.pipeline.addShader("boxblur", shaderH);
            this.screenQuad = new XML3D.webgl.FullscreenQuad(context);
            this.uniformsDirty = true;
        },

        updateBlurOffset: function() {
            this.blurOffset[0] += 0.005;
            if (this.blurOffset[0] > 3.0) {
                this.blurOffset[0] = 0.0;
            }
            this.blurOffset[1] = this.blurOffset[0];
        },

        setNonVolatileShaderUniforms: (function() {
            var c_uniformCollection = {},
                c_systemUniformNames = ["canvasSize", "sInTexture", "blurOffset"];

            return function() {
                if (!this.uniformsDirty) {
                    return;
                }
                var program = this.pipeline.getShader("boxblur");
                var target = this.pipeline.getRenderTarget(this.output);
                program.bind();
                target.bind();
                c_uniformCollection["canvasSize"] = [target.width, target.height];
                c_uniformCollection["sInTexture"] = this.pipeline.getRenderTarget(this.inputs.sInTexture).colorTarget;
                c_uniformCollection["blurOffset"] = this.blurOffset;
                program.setSystemUniformVariables(c_systemUniformNames, c_uniformCollection);
                program.unbind();
                target.unbind();
                this.uniformsDirty = false;
            }
        })(),

        render: function(scene) {
            var gl = this.pipeline.context.gl;
            var target = this.pipeline.getRenderTarget(this.output);
            target.bind();

            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.disable(gl.DEPTH_TEST);

            var program = this.pipeline.getShader("boxblur");
            program.bind();
            this.setNonVolatileShaderUniforms();

            this.screenQuad.draw(program);

            program.unbind();
            target.unbind();
        }

    });

    webgl.BoxBlurPass = BoxBlurPass;

}(XML3D.webgl));


(function (webgl) {

    window.SSAOParameters = {};
    window.SSAOParameters.scale = 0.06;
    window.SSAOParameters.intensity = 1.3;
    window.SSAOParameters.bias = 0.01;
    window.SSAOParameters.radius = 17;


    var SSAOPass = function (pipeline, output, opt) {
        webgl.BaseRenderPass.call(this, pipeline, output, opt);
    };
    XML3D.createClass(SSAOPass, webgl.BaseRenderPass);

    XML3D.extend(SSAOPass.prototype, {
        init: function(context) {
            var shader = context.programFactory.getProgramByName("ssao-positions");
            this.pipeline.addShader("ssao-positions", shader);

            this.randomVectorTexture = this.createRandomVectorTexture(context);
            this.loadRandomVectorImage();
            this.screenQuad = new XML3D.webgl.FullscreenQuad(context);
            this.uniformsDirty = true;
        },

        createRandomVectorTexture: function(context) {
            var gl = context.gl;
            var tex = new XML3D.webgl.GLTexture(gl);
            tex.createTex2DFromData(gl.RGBA, 64,64, gl.RGBA, gl.UNSIGNED_BYTE,
            { wrapS : gl.REPEAT,
              wrapT : gl.REPEAT,
              minFilter : gl.LINEAR,
              magFilter : gl.LINEAR});
            tex.isTexture = true;
            return tex;
        },

        loadRandomVectorImage: function() {
                var img = new Image();
                img.src = "resources/textures/random-normals.png";
                var gl = this.pipeline.context.gl;
                var texhandle = this.randomVectorTexture.handle;

                img.onload = function() {
                    gl.bindTexture(gl.TEXTURE_2D, texhandle);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                }
        },

        render: (function () {
            return function (scene) {
                var gl = this.pipeline.context.gl,
                    target = this.pipeline.getRenderTarget(this.output);

                target.bind();
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                gl.viewport(0, 0, target.getWidth(), target.getHeight());
                gl.disable(gl.DEPTH_TEST);

                this.renderObjectsToActiveBuffer(scene.ready, scene, target);
                target.unbind();
            }
        }()),

        //TODO: Separate uniforms that have to be set each frame from the rest
        setNonVolatileShaderUniforms: (function() {
            var c_systemUniformNames = ["canvasSize", "sPositionTex", "sNormalTex", "sRandomNormals", "uRandomTexSize",
                    "uScale", "uBias", "uIntensity", "uSampleRadius", "uConstVectors"];

            return function() {
                if (!this.uniformsDirty) {
                    return;
                }
                var uniforms = {};
                var program = this.pipeline.getShader("ssao-positions");
                program.bind();
                var target = this.pipeline.getRenderTarget(this.output);
                uniforms["canvasSize"] = [target.width, target.height];
                uniforms["sPositionTex"] = this.pipeline.getRenderTarget(this.inputs.positionTexture).colorTarget;
                uniforms["sNormalTex"] = this.pipeline.getRenderTarget(this.inputs.normalTexture).colorTarget;
                uniforms["sRandomNormals"] = this.randomVectorTexture;
                uniforms["uRandomTexSize"] = [64,64];
                uniforms["uScale"] = window.SSAOParameters.scale;
                uniforms["uBias"] = window.SSAOParameters.bias;
                uniforms["uIntensity"] = window.SSAOParameters.intensity;
                uniforms["uSampleRadius"] = window.SSAOParameters.radius;
                uniforms["uConstVectors"] = [1,0, -1,0, 0,1, 0,-1];
                program.setSystemUniformVariables(c_systemUniformNames, uniforms);
                program.unbind();
                this.uniformsDirty = false;
            }
        })(),

        renderObjectsToActiveBuffer: (function () {
            var c_viewMat_tmp = XML3D.math.mat4.create(),
                c_systemUniformNames = ["viewMatrix"],
                c_uniformCollection = {envBase: {}, envOverride: null, sysBase: {}};

            return function (objectArray, scene, target) {
                if (objectArray.length == 0) {
                    return;
                }

                var program = this.pipeline.getShader("ssao-positions");

                program.bind();
                this.setNonVolatileShaderUniforms();
                scene.getActiveView().getWorldToViewMatrix(c_viewMat_tmp);
                c_uniformCollection.sysBase["viewMatrix"] = c_viewMat_tmp;
                program.setUniformVariables(null, c_systemUniformNames, c_uniformCollection);

                this.screenQuad.draw(program);

                program.unbind();
                target.unbind();
            }
        }())

    });


    webgl.SSAOPass = SSAOPass;

}(XML3D.webgl));

(function (webgl) {

    var SSAOCompositePass = function(pipeline, output, opt) {
        webgl.BaseRenderPass.call(this, pipeline, output, opt);
        this.screenQuad = {};
    };

    XML3D.createClass(SSAOCompositePass, webgl.BaseRenderPass, {
        init: function(context) {
            var shader = context.programFactory.getProgramByName("compositeSSAO");
            this.pipeline.addShader("compositeShader", shader);
            this.screenQuad = new XML3D.webgl.FullscreenQuad(context);
            this.canvasSize = new Float32Array([context.canvasTarget.width, context.canvasTarget.height]);
            this.uniformsDirty = true;
        },

        setNonVolatileShaderUniforms: (function() {
            var c_systemUniformNames = ["ssaoTexture", "forwardTexture", "canvasSize"];

            return function() {
                if (!this.uniformsDirty) {
                    return;
                }
                var uniforms = {};
                var program = this.pipeline.getShader("compositeShader");
                var target = this.pipeline.getRenderTarget(this.output);
                program.bind();
                uniforms["canvasSize"] = [target.width, target.height];
                uniforms["ssaoTexture"] = this.pipeline.getRenderTarget(this.inputs.ssaoTexture).colorTarget;
                uniforms["forwardTexture"] = this.pipeline.getRenderTarget(this.inputs.forwardTexture).colorTarget;
                program.setSystemUniformVariables(c_systemUniformNames, uniforms);
                program.unbind();
                this.uniformsDirty = false;
            }
        })(),

        render: function(scene) {
                var gl = this.pipeline.context.gl;
                var target = this.pipeline.getRenderTarget(this.output);
                target.bind();

                gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

                var program = this.pipeline.getShader("compositeShader");
                program.bind();
                this.setNonVolatileShaderUniforms();

                this.screenQuad.draw(program);

                program.unbind();
                target.unbind();
        }
    });

    webgl.SSAOCompositePass = SSAOCompositePass;

}(XML3D.webgl));

(function (webgl) {

    var SSAOPostRenderPipeline = function (context) {
        webgl.RenderPipeline.call(this, context);
        this.createRenderPasses();
        this.ext = {};
        this.ext.OES_texture_float = context.gl.getExtension('OES_texture_float');
    };

    XML3D.createClass(SSAOPostRenderPipeline, webgl.RenderPipeline);

    XML3D.extend(SSAOPostRenderPipeline.prototype, {
        init: function() {
            // Create render targets
            var context = this.context;
            var positionBuffer = new webgl.GLRenderTarget(context, {
                width: context.canvasTarget.width,
                height: context.canvasTarget.height,
                colorFormat: context.gl.RGBA,
                colorType: context.gl.FLOAT,
                depthFormat: context.gl.DEPTH_COMPONENT16,
                stencilFormat: null,
                depthAsRenderbuffer: true
            });

            this.addRenderTarget("positionBuffer", positionBuffer);

            var normalBuffer = new webgl.GLRenderTarget(context, {
                width: context.canvasTarget.width,
                height: context.canvasTarget.height,
                colorFormat: context.gl.RGBA,
                colorType: context.gl.FLOAT,
                depthFormat: context.gl.DEPTH_COMPONENT16,
                stencilFormat: null,
                depthAsRenderbuffer: true
            });
            this.addRenderTarget("normalBuffer", normalBuffer);
            var backBuffer = new webgl.GLRenderTarget(context, {
                width: context.canvasTarget.width,
                height: context.canvasTarget.height,
                colorFormat: context.gl.RGBA,
                depthFormat: context.gl.DEPTH_COMPONENT16,
                stencilFormat: null,
                depthAsRenderbuffer: true
            });
            this.addRenderTarget("backBufferOne", backBuffer);

            var backBufferTwo = new webgl.GLRenderTarget(context, {
                width: context.canvasTarget.width,
                height: context.canvasTarget.height,
                colorFormat: context.gl.RGBA,
                depthFormat: context.gl.DEPTH_COMPONENT16,
                stencilFormat: null,
                depthAsRenderbuffer: true
            });
            this.addRenderTarget("backBufferTwo", backBufferTwo);
            this.addRenderTarget("screen", context.canvastarget); // Already available in context object

            this.renderPasses.forEach(function(pass) {
                if (pass.init) {
                    pass.init(context);
                }
            });
        },

        createRenderPasses: function() {
            var normalPass = new XML3D.webgl.NormalPass(this, "normalBuffer");
            this.addRenderPass(normalPass);

            var positionPass = new XML3D.webgl.PositionPass(this, "positionBuffer");
            this.addRenderPass(positionPass);

            var ssaoPass = new XML3D.webgl.SSAOPass(this, "backBufferOne", {inputs: { positionTexture:"positionBuffer", normalTexture:"normalBuffer" } });
            this.addRenderPass(ssaoPass);

            var boxBlurPass = new XML3D.webgl.BoxBlurPass(this, "backBufferTwo", {inputs: { sInTexture:"backBufferOne" }});
            this.addRenderPass(boxBlurPass);

            var forwardPass = new XML3D.webgl.ForwardRenderPass(this, "backBufferOne");
            this.addRenderPass(forwardPass);

            var ssaoCompositePass = new XML3D.webgl.SSAOCompositePass(this, "screen", {inputs: { ssaoTexture:"backBufferTwo", forwardTexture:"backBufferOne" }});
            this.addRenderPass(ssaoCompositePass);
        },

        render: function(scene) {
            scene.update();
            scene.updateReadyObjectsFromActiveView(this.context.canvasTarget.width / this.context.canvasTarget.height);
            this.renderPasses.forEach(function(pass) {
                pass.render(scene);
            });
        }
    });

    webgl.SSAOPostRenderPipeline = SSAOPostRenderPipeline;

})(XML3D.webgl);
