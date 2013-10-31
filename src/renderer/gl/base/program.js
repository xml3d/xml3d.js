(function (webgl) {

    /**
     * @param {WebGLRenderingContext} gl
     * @param {number} type
     * @param {string} shaderSource
     * @returns {WebGLShader|null}
     */
    var createWebGLShaderFromSource = function (gl, type, shaderSource) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);

        if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) == 0) {
            var message = gl.getShaderInfoLog(shader);
            var errorString = "";
            if (type == gl.VERTEX_SHADER)
                errorString = "Vertex shader failed to compile: \n";
            else
                errorString = "Fragment shader failed to compile: \n";

            errorString += message + "\n--------\n";
            errorString += "Shader Source:\n--------\n";
            errorString += XML3D.debug.formatSourceCode(shaderSource);
            gl.getError();
            webgl.SystemNotifier.sendEvent('glsl',
                {glslType: "compile_error", shaderType : type == gl.VERTEX_SHADER ? "vertex" : "fragment",
                    code: shaderSource, message: message });

            throw new Error(errorString)
        }
        return shader;
    };

    var createProgramFromSources = function (gl, vertexSources, fragmentSources) {
        var shd = null;
        var shaders = [ ];
        for (var s in vertexSources) {
            var src = vertexSources[s];
            shd = createWebGLShaderFromSource(gl, gl.VERTEX_SHADER, src);
            shaders.push(shd);
        }
        for (var s in fragmentSources) {
            var src = fragmentSources[s];
            shd = createWebGLShaderFromSource(gl, gl.FRAGMENT_SHADER, src);
            shaders.push(shd);
        }
        return createProgramFromShaders(gl, shaders);
    }

    var createProgramFromShaders = function (gl, shaders) {
        var program = gl.createProgram();
        for (var s in shaders) {
            var shader = shaders[s];
            gl.attachShader(program, shader);
        }
        gl.linkProgram(program);
        if (gl.getProgramParameter(program, gl.LINK_STATUS) == 0) {
            var message = gl.getProgramInfoLog(program);
            var errorString = "Shader linking failed: \n";
            errorString += message;
            errorString += "\n--------\n";
            gl.getError();
            webgl.SystemNotifier.sendEvent('glsl',
                {glslType: "link_error", message: message });
            throw new Error(errorString);
        }
        return program;
    }

    var tally = function (gl, handle, programObject) {
        // Tally shader attributes
        var numAttributes = gl.getProgramParameter(handle, gl.ACTIVE_ATTRIBUTES);
        for (var i = 0; i < numAttributes; i++) {
            var att = gl.getActiveAttrib(handle, i);
            if (!att)
                continue;
            var attInfo = {};
            attInfo.name = att.name;
            attInfo.size = att.size;
            attInfo.glType = att.type;
            attInfo.location = gl.getAttribLocation(handle, att.name);
            programObject.attributes[att.name] = attInfo;
        }


        // Tally shader uniforms and samplers
        var numUniforms = gl.getProgramParameter(handle, gl.ACTIVE_UNIFORMS);
        for (var i = 0; i < numUniforms; i++) {
            var uni = gl.getActiveUniform(handle, i);
            if (!uni)
                continue;
            var uniInfo = {};
            uniInfo.name = uni.name;
            uniInfo.size = uni.size;
            uniInfo.glType = uni.type;
            uniInfo.location = gl.getUniformLocation(handle, uni.name);

            var name = uniInfo.name;
            // Need to discuss how to sort out the consequences of doing this in the renderer first --Chris
            if (name.substring(name.length - 3) == "[0]") {
                name = name.substring(0, name.length - 3); // Remove [0]
            }

            if (uni.type == gl.SAMPLER_2D || uni.type == gl.SAMPLER_CUBE) {
                uniInfo.unit = [];
                uniInfo.texture = [];
                for(var j = 0; j < uniInfo.size; j++) {
                    uniInfo.unit[j] = programObject.nextTextureUnit();
                    uniInfo.texture[j] = new XML3D.webgl.GLTexture(gl);
                }
                webgl.setUniform(gl, uniInfo, uniInfo.unit);
                programObject.samplers[name] = uniInfo;
            } else
                programObject.uniforms[name] = uniInfo;
        }

    };

    var uniqueObjectId = (function() {
        var c_counter = 0;
        return function() {
            return c_counter++;
        }
    }());

    /**
     * @constructor
     * @param {WebGLRenderingContext} gl
     * @param {{ fragment: string, vertex: string }} sources
     */
    var ProgramObject = function (gl, sources) {
        this.gl = gl;
        this.sources = sources;

        this.id = uniqueObjectId();
        this.attributes = {};
        this.uniforms = {};
        this.samplers = {};
        this.needsLights = true;
        this.handle = null;
        this.texturesBinded = false;


        var maxTextureUnit = 0;
        this.nextTextureUnit = function () {
            return maxTextureUnit++;
        }

        this.create();
    };

    XML3D.extend(ProgramObject.prototype, {
        create: function () {
            XML3D.debug.logDebug("Create shader program: ", this.id);
            this.handle = createProgramFromSources(this.gl, [this.sources.vertex], [this.sources.fragment]);
            if (!this.handle)
                return;
            webgl.SystemNotifier.sendEvent('glsl', {glslType: "success"});
            this.bind();
            tally(this.gl, this.handle, this);
        },
        bind: function () {
            if (!this.handle) {
                XML3D.debug.logError("Trying to bind invalid GLProgram.");
            }
            this.gl.useProgram(this.handle);
            for(var s in this.samplers) {
                var sampler = this.samplers[s];
                if(sampler.texture) {
                    for(var i = 0; i < sampler.texture.length; i++) {
                        sampler.texture[i] && sampler.texture[i].bind(sampler.unit[i]);
                    }
                }
            }
            this.texturesBinded = true;
        },
        unbind: function () {
            //this.gl.useProgram(null);
            this.texturesBinded = false;
        },
        isValid: function() {
            return !!this.handle;
        },
        setUniformVariables: function(envNames, sysNames, inputCollection){
            var i, base, override;
            if(envNames && inputCollection.envBase){
                i = envNames.length; base = inputCollection.envBase; override = inputCollection.envOverride;
                while(i--){
                    var name = envNames[i];
                    this.setUniformVariable(name,override && override[name] !== undefined ? override[name] : base[name]);
                }
            }
            if(sysNames && inputCollection.sysBase){
                i = sysNames.length; base = inputCollection.sysBase;
                while(i--){
                    var name = sysNames[i];
                    this.setUniformVariable(name, base[name]);
                }
            }
        },
        setUniformVariable: function(name, value){
            if(value === undefined) return;
            if(this.uniforms[name]){
                webgl.setUniform(this.gl, this.uniforms[name], value);
            }
            else if(this.samplers[name]){
                var sampler = this.samplers[name];

                if (value && sampler.texture !== value) {
                    sampler.texture = value;
                    for(var i = 0; i < sampler.texture.length; i++) {
                        sampler.texture[i] && sampler.texture[i].bind(sampler.unit[i]);
                    }
                }
            }
        }
    });

    webgl.GLProgramObject = ProgramObject;

}(XML3D.webgl));
