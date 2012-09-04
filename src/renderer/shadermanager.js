(function() {

    /***************************************************************************
     * Class XML3D.webgl.XML3DShaderManager
     *
     * The XML3DShaderManager is an abstraction between the renderer and WebGL.
     * It handles the creation and management of all shaders used in the scene,
     * including internal shaders (eg. picking shader).
     *
     **************************************************************************/
    var TEXTURE_STATE = {
        INVALID : -1,
        UNLOADED : 0,
        LOADED : 1,
        VALID : 2
    };

    var TextureInfo = function(handle, opt) {
        opt = opt || {};
        this.handle = handle;
        this.status = opt.status || TEXTURE_STATE.INVALID;
        this.onload = opt.onload;
        this.unit = opt.unit || 0;
        this.image = opt.image || null;
        this.config = opt.config || null;
    };

    TextureInfo.prototype.setLoaded = function() {
        if (this.status != TEXTURE_STATE.UNLOADED)
            XML3D.debug.logError("Trying to set Texture with state " + this.status + " to 'loaded'");
        this.status = TEXTURE_STATE.LOADED;
        if (this.onload)
            this.onload.call(this);
    };

    var InvalidTexture = function() {
        this.status = TEXTURE_STATE.INVALID;
    };

    /**
     * @constructor
     * @param {WebGLProgram} program
     * @param {{ fragment: string, vertex: string }} sources
     */
    var ProgramObject = function(program, sources) {
        this.attributes = {};
        this.uniforms = {};
        this.samplers = {};
        this.handle = program;
        this.needsLights = true;
        this.vSource = sources.vertex;
        this.fSource = sources.fragment;
    };

    var XML3DShaderManager = function(renderer, dataFactory, factory) {
        this.renderer = renderer;
        this.gl = renderer.gl;
        this.dataFactory = dataFactory;
        this.factory = factory;

        this.shaderCache = {
            fragment : {},
            vertex : {}
        };

        this.currentProgram = null;

        /** @type {Object.<String,ProgramObject>} */
        this.shaders = {};

        this.createDefaultShaders();
    };

    /**
     * @param {Array!} directives
     * @param {string!} source
     * @returns {string}
     */
    XML3DShaderManager.addDirectivesToSource = function(directives, source) {
        var fragment = "";
        Array.forEach(directives, function(v) {
            fragment += "#define " + v + "\n";
        });
        return fragment + "\n" + source;
    };

    XML3DShaderManager.prototype.createDefaultShaders = function() {
        this.createFallbackShader();
        this.createPickingShader();
    };

    /**
     * Always create a default flat shader as a fallback for error handling
     */
    XML3DShaderManager.prototype.createFallbackShader = function() {
        var desc = XML3D.shaders.getScript("matte");
        var mat = this.createMaterialFromShaderDescriptor(desc);
        var fallbackShader = mat.getProgram();
        this.bindShader(fallbackShader);
        this.setUniform(fallbackShader.uniforms["diffuseColor"], [ 1, 0, 0 ]);
        this.unbindShader(fallbackShader);
        this.shaders["defaultShader"] = fallbackShader;
    };

    /**
     * Create picking shaders
     */
    XML3DShaderManager.prototype.createPickingShader = function() {
        this.shaders["pickobjectid"] = this.getStandardShaderProgram("pickobjectid");
        this.shaders["pickedposition"] = this.getStandardShaderProgram("pickedposition");
        this.shaders["pickedNormals"] = this.getStandardShaderProgram("pickedNormals");
    };

    /**
     * @param descriptor
     * @returns {Material}
     */
    XML3DShaderManager.prototype.createMaterialFromShaderDescriptor = function(descriptor) {
        var result = new Material(this);
        XML3D.extend(result, descriptor);
        return result;
    };

    /**
     *
     * @param shaderAdapter
     * @param lights
     * @returns {string}
     */
    XML3DShaderManager.prototype.createShader = function(shaderAdapter, lights) {
        if (!shaderAdapter || !shaderAdapter.node.script) {
            return "defaultShader";
        }

        var shaderNode = shaderAdapter.node;
        var shaderId = shaderNode.id;
        var program = this.shaders[shaderId];

        if (program)
            return shaderId;

        var scriptURI = new XML3D.URI(shaderNode.script);
        if (scriptURI.scheme != "urn") {
            return "defaultShader";
        }

        var descriptor = XML3DShaderManager.getShaderDescriptor(scriptURI.path);
        var material = this.createMaterialFromShaderDescriptor(descriptor);
        var dataTable = shaderAdapter.requestData(material.getRequestFields());

        program = material.getProgram(lights, dataTable);
        this.shaders[shaderId] = program;
        this.gl.useProgram(program.handle);

        this.setUniformsFromComputeResult(program, dataTable);
        this.createTexturesFromComputeResult(program, dataTable);
        XML3D.webgl.checkError(this.gl, "setSamplers");
        return shaderId;
    };

    /**
     * @param {string} path
     * @returns
     */
    XML3DShaderManager.getShaderDescriptor = function(path) {
        var shaderName = path.substring(path.lastIndexOf(':') + 1);
        return XML3D.shaders.getScript(shaderName);
    };

    XML3DShaderManager.prototype.getStandardShaderProgram = function(name) {
        var sources = {};

        sources = XML3D.shaders.getScript(name);
        if (!sources || !sources.vertex) {
            sources = {};
            XML3D.debug.logError("Unknown shader: " + name + ". Using flat shader instead.");
        }

        var shaderProgram = this.createProgramFromSources(sources);

        return shaderProgram;
    };

    /**
     *
     * @param {{fragment: string, vertex: string}!} sources
     * @returns {ProgramObject}
     */
    XML3DShaderManager.prototype.createProgramFromSources = function(sources) {
        var gl = this.gl;

        if (!sources.vertex || !sources.fragment) {
            return this.shaders["defaultShader"];
        }

        var sc = this.shaderCache;
        var vertexShader = sc.vertex[sources.vertex];
        if (!vertexShader) {
            vertexShader = sc.vertex[sources.vertex] = XML3DShaderManager.createWebGLShaderFromSource(gl, gl.VERTEX_SHADER, sources.vertex);
        }
        var fragmentShader = sc.fragment[sources.fragment];
        if (!fragmentShader) {
            fragmentShader = sc.fragment[sources.fragment] = XML3DShaderManager.createWebGLShaderFromSource(gl, gl.FRAGMENT_SHADER, sources.fragment);
        }

        if (!vertexShader || !fragmentShader) {
            // Use a default flat shader instead
            return this.shaders["defaultShader"];
        }

        var prg = gl.createProgram();

        // Link shader program
        gl.attachShader(prg, vertexShader);
        gl.attachShader(prg, fragmentShader);
        gl.linkProgram(prg);

        if (gl.getProgramParameter(prg, gl.LINK_STATUS) == 0) {
            var errorString = "Shader linking failed: \n";
            errorString += gl.getProgramInfoLog(prg);
            errorString += "\n--------\n";
            XML3D.debug.logError(errorString);
            gl.getError();

            return this.shaders["defaultShaders"];
        }

        var programObject = new ProgramObject(prg, sources);
        gl.useProgram(prg);

        // Tally shader attributes
        var numAttributes = gl.getProgramParameter(prg, gl.ACTIVE_ATTRIBUTES);
        for ( var i = 0; i < numAttributes; i++) {
            var att = gl.getActiveAttrib(prg, i);
            if (!att)
                continue;
            var attInfo = {};
            attInfo.name = att.name;
            attInfo.size = att.size;
            attInfo.glType = att.type;
            attInfo.location = gl.getAttribLocation(prg, att.name);
            programObject.attributes[att.name] = attInfo;
        }

        // Tally shader uniforms and samplers
        var numUniforms = gl.getProgramParameter(prg, gl.ACTIVE_UNIFORMS);
        for ( var i = 0; i < numUniforms; i++) {
            var uni = gl.getActiveUniform(prg, i);
            if (!uni)
                continue;
            var uniInfo = {};
            uniInfo.name = uni.name;
            uniInfo.size = uni.size;
            uniInfo.glType = uni.type;
            uniInfo.location = gl.getUniformLocation(prg, uni.name);

            if (uni.type == gl.SAMPLER_2D || uni.type == gl.SAMPLER_CUBE) {
                programObject.samplers[uni.name] = uniInfo;
            } else
                programObject.uniforms[uni.name] = uniInfo;
        }

        programObject.changes = [];
        return programObject;
    };

    /**
     * @param {number} type
     * @param {string} shaderSource
     * @returns {WebGLShader|null}
     */
    XML3DShaderManager.createWebGLShaderFromSource = function(gl, type, shaderSource) {
        var shd = gl.createShader(type);
        gl.shaderSource(shd, shaderSource);
        gl.compileShader(shd);

        if (gl.getShaderParameter(shd, gl.COMPILE_STATUS) == 0) {
            var errorString = "";
            if (type == gl.VERTEX_SHADER)
                errorString = "Vertex shader failed to compile: \n";
            else
                errorString = "Fragment shader failed to compile: \n";

            errorString += gl.getShaderInfoLog(shd) + "\n--------\n";
            XML3D.debug.logError(errorString);
            gl.getError();
            return null;
        }

        return shd;
    };

    XML3DShaderManager.prototype.recompileShader = function(shaderAdapter, lights) {
        var shaderName = shaderAdapter.node.id;
        var shader = this.shaders[shaderName];
        if (shader) {
            this.destroyShader(shader);
            delete this.shaders[shaderName];
            this.createShader(shaderAdapter, lights);
        }
    };

    XML3DShaderManager.prototype.shaderDataChanged = function(adapter, request, changeType) {
        var program = this.shaders[adapter.node.id];
        var result = request.getResult();
        this.bindShader(program);
        this.setUniformsFromComputeResult(program, result);
        this.createTexturesFromComputeResult(program, result);
        this.renderer.requestRedraw("Shader data changed");
        // Store the change, it will be applied the next time the shader is
        // bound
        /*if (attrName == "src") {
            // A texture source was changed
            if (textureName) {
                var sampler = shader.samplers[textureName];
                if (sampler)
                    shader.samplers[textureName] = this.replaceTexture(adapter, sampler);
            } else
                XML3D.debug.logError("Couldn't apply change because of a missing texture name");

        } else {
            if (attrName == "transparency")
                shader.hasTransparency = newValue > 0;

            shader.changes.push({
                type : "uniform",
                name : attrName,
                newValue : newValue
            });
        }*/

    };

    XML3DShaderManager.prototype.getShaderById = function(shaderId) {
        var sp = this.shaders[shaderId];
        if (!sp) {
            var shaderAdapter = this.factory.getAdapter(document.getElementById(shaderId));
            if (shaderAdapter) {
                // This must be a shader we haven't created yet (maybe it was
                // just added or
                // was not assigned to a group until now
                this.createShader(shaderAdapter, this.renderer.lights);
                if (this.shaders[shaderId])
                    return this.shaders[shaderId];
            }

            XML3D.debug.logError("Could not find the shader [ " + shaderId + " ]");
            sp = this.shaders["default"];
        }
        return sp;
    };

    /**
     *
     */
    XML3DShaderManager.prototype.setUniformsFromComputeResult = function(programObject, data) {
        var dataMap = data.getOutputMap();
        var uniforms = programObject.uniforms;
        for ( var name in uniforms) {
            var entry = dataMap[name];
            if (entry) {
                var v = entry.getValue();
                this.setUniform(uniforms[name], (v.length == 1) ? v[0] : v);
            }
        }
    };

    XML3DShaderManager.prototype.setUniformVariables = function(shader, uniforms) {
        for ( var name in uniforms) {
            var u = uniforms[name];

            if (u.value)
                u = u.value;
            if (u.clean)
                continue;
            if (u.length == 1)
                u = u[0]; // Either a single float, int or bool

            if (shader.uniforms[name]) {
                this.setUniform(shader.uniforms[name], u);
            }
        }

    };

    XML3DShaderManager.prototype.bindShader = function(shader) {
        var sp = (typeof shader == typeof "") ? this.getShaderById(shader) : shader;

        if (this.currentProgram != sp.handle) {
            this.currentProgram = sp.handle;
            this.gl.useProgram(sp.handle);
        }

        var samplers = sp.samplers;
        for ( var tex in samplers) {
            this.bindTexture(samplers[tex]);
        }
    };

    XML3DShaderManager.prototype.updateShader = function(sp) {
        this.bindShader(sp);
        // Apply any changes encountered since the last time this shader was
        // rendered
        for ( var i = 0, l = sp.changes.length; i < l; i++) {
            var change = sp.changes[i];
            if (change.type == "uniform" && sp.uniforms[change.name]) {
                this.setUniform(sp.uniforms[change.name], change.newValue);
            }
        }
        sp.changes = [];
    };

    XML3DShaderManager.prototype.unbindShader = function(shader) {
        // TODO: unbind samplers (if any)
        var sp = (typeof shader == typeof "") ? this.getShaderById(shader) : shader;
        var samplers = sp.samplers;
        for ( var tex in samplers) {
            this.unbindTexture(samplers[tex]);
        }

        this.currentProgram = null;
        this.gl.useProgram(null);
    };

    var rc = window.WebGLRenderingContext;

    XML3DShaderManager.prototype.setUniform = function(u, value) {
        var gl = this.gl;
        switch (u.glType) {
        case rc.BOOL:
        case rc.INT:
        case rc.SAMPLER_2D:
            gl.uniform1i(u.location, value);
            break;

        case 35671: // gl.BOOL_VEC2
        case 35667:
            gl.uniform2iv(u.location, value);
            break; // gl.INT_VEC2

        case 35672: // gl.BOOL_VEC3
        case 35668:
            gl.uniform3iv(u.location, value);
            break; // gl.INT_VEC3

        case 35673: // gl.BOOL_VEC4
        case 35669:
            gl.uniform4iv(u.location, value);
            break; // gl.INT_VEC4

        case 5126:
            gl.uniform1f(u.location, value);
            break; // gl.FLOAT
        case 35664:
            gl.uniform2fv(u.location, value);
            break; // gl.FLOAT_VEC2
        case 35665:
            gl.uniform3fv(u.location, value);
            break; // gl.FLOAT_VEC3
        case 35666:
            gl.uniform4fv(u.location, value);
            break; // gl.FLOAT_VEC4

        case 35674:
            gl.uniformMatrix2fv(u.location, gl.FALSE, value);
            break;// gl.FLOAT_MAT2
        case 35675:
            gl.uniformMatrix3fv(u.location, gl.FALSE, value);
            break;// gl.FLOAT_MAT3
        case 35676:
            gl.uniformMatrix4fv(u.location, gl.FALSE, value);
            break;// gl.FLOAT_MAT4

        default:
            XML3D.debug.logError("Unknown uniform type " + u.glType);
            break;
        }
    };

    XML3DShaderManager.prototype.destroyShader = function(shader) {
        for ( var tex in shader.samplers) {
            this.destroyTexture(shader.samplers[tex]);
        }

        this.gl.deleteProgram(shader.handle);
    };

    /**
     *
     * @param {ProgramObject} programObject
     * @param {Xflow.ComputeResult} result
     */
    XML3DShaderManager.prototype.createTexturesFromComputeResult = function(programObject, result) {
        var texUnit = 0;
        var samplers = programObject.samplers;
        for ( var name in samplers) {
            var sampler = samplers[name];
            var entry = result.getOutputData(name);

            if (!entry) {
                sampler.info = new InvalidTexture();
                continue;
            }

            this.createTextureFromEntry(entry, sampler, texUnit);
            texUnit++;
        }
    };

    /**
     *
     * @param {Xflow.TextureEntry} entry
     * @param sampler
     * @param {number} texUnit
     */
    XML3DShaderManager.prototype.createTextureFromEntry = function(texEntry, sampler, texUnit) {
        var img = texEntry.getImage();
        if (img) {
            var renderer = this.renderer;
            var info = new TextureInfo(this.gl.createTexture(), {
                status : img.complete ? TEXTURE_STATE.LOADED : TEXTURE_STATE.UNLOADED,
                onload : function() {
                    renderer.requestRedraw.call(renderer, "Texture loaded");
                },
                unit : texUnit,
                image : img,
                config : texEntry.getSamplerConfig()
            });
            sampler.info = info;
        } else {
            sampler.info = new InvalidTexture();
            XML3D.debug.logWarning("No image found for texture: " + sampler);
        }
    };

    XML3DShaderManager.prototype.replaceTexture = function(adapter, texture) {
        this.destroyTexture(texture);
        var dtable = adapter.requestData([ texture.name ]);
        var dtopt = dtable[texture.name].getValue();

        // FIX ME PLEASE
        dtopt.imageAdapter.image = null;

        this.createTexture(dtopt, texture, texture.texUnit);

        return texture;

    };

    XML3DShaderManager.prototype.createTex2DFromData = function(internalFormat, width, height, sourceFormat, sourceType, texels, opt) {
        var gl = this.gl;
        var info = {};
        if (!texels) {
            if (sourceType == gl.FLOAT) {
                texels = new Float32Array(width * height * 4);
            } else {
                texels = new Uint8Array(width * height * 4);
            }
        }

        var handle = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, handle);

        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, opt.wrapS);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, opt.wrapT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, opt.minFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, opt.magFilter);

        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, sourceFormat, sourceType, texels);

        if (opt.isDepth) {
            gl.texParameteri(gl.TEXTURE_2D, gl.DEPTH_TEXTURE_MODE, opt.depthMode);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, opt.depthCompareMode);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, opt.depthCompareFunc);
        }
        if (opt.generateMipmap) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        gl.bindTexture(gl.TEXTURE_2D, null);

        info.handle = handle;
        info.options = opt;
        info.status = TEXTURE_STATE.VALID;
        info.glType = gl.TEXTURE_2D;
        info.format = internalFormat;

        return info;
    };

    XML3DShaderManager.prototype.createTex2DFromImage = function(info) {
        var gl = this.gl;
        var opt = info.config || {};
        var image = info.image;

        gl.bindTexture(gl.TEXTURE_2D, info.handle);

        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, opt.wrapS);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, opt.wrapT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, opt.minFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, opt.magFilter);

        if (!this.isPowerOfTwo(image.width) || !this.isPowerOfTwo(image.height)) {
            // Scale up the texture to the next highest power of two dimensions.
            var canvas = document.createElement("canvas");
            canvas.width = this.nextHighestPowerOfTwo(image.width);
            canvas.height = this.nextHighestPowerOfTwo(image.height);
            var ctx = canvas.getContext("2d");
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height); // stretch
            // to
            // fit
            // ctx.drawImage(image, 0, 0, image.width, image.height); //centered
            // with transparent padding around edges
            image = canvas;
        }

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        if (opt.generateMipmap) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        gl.bindTexture(gl.TEXTURE_2D, null);

        info.status = TEXTURE_STATE.VALID;
        info.glType = gl.TEXTURE_2D;
        info.format = gl.RGBA;

        return info;
    };

    /**
     *
     * @param {WebGLSampler} tex
     */
    XML3DShaderManager.prototype.bindTexture = function(tex) {
        var info = tex.info;
        var gl = this.gl;

        switch (info.status) {
        case TEXTURE_STATE.VALID:
            gl.activeTexture(gl.TEXTURE0 + info.unit + 1);
            gl.bindTexture(info.glType, info.handle);
            // Should not be here, since the texunit is static
            this.setUniform(tex, info.unit + 1);
            break;
        case TEXTURE_STATE.LOADED:
            // console.dir("Creating '"+ tex.name + "' from " + info.image.src);
            // console.dir(info);
            this.createTex2DFromImage(info);
            this.bindTexture(tex);
            break;
        case TEXTURE_STATE.UNLOADED:
            gl.activeTexture(gl.TEXTURE0 + info.unit + 1);
            gl.bindTexture(gl.TEXTURE_2D, null);
            this.setUniform(tex, info.unit + 1);
        }
        ;
    };

    XML3DShaderManager.prototype.unbindTexture = function(tex) {
        this.gl.activeTexture(this.gl.TEXTURE1 + tex.info.unit);
        this.gl.bindTexture(tex.info.glType, null);
    };

    XML3DShaderManager.prototype.destroyTexture = function(tex) {
        if (tex.info && tex.info.handle)
            this.gl.deleteTexture(tex.info.handle);
    };

    XML3DShaderManager.prototype.isPowerOfTwo = function(dimension) {
        return (dimension & (dimension - 1)) == 0;
    };

    XML3DShaderManager.prototype.nextHighestPowerOfTwo = function(x) {
        --x;
        for ( var i = 1; i < 32; i <<= 1) {
            x = x | x >> i;
        }
        return x + 1;
    };
    XML3D.webgl.XML3DShaderManager = XML3DShaderManager;
}());