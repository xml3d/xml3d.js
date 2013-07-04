(function() {

    /***************************************************************************
     * Class XML3D.webgl.XML3DShaderManager
     *
     * The XML3DShaderManager is an abstraction between the renderer and WebGL.
     * It handles the creation and management of all shaders used in the scene,
     * including internal shaders (eg. picking shader).
     *
     **************************************************************************/

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
        var maxTextureUnit = 0;
        this.nextTextureUnit = function() {
            return maxTextureUnit++;
        }
    };

    var XML3DShaderManager = function(renderer, canvasId) {
        this.renderer = renderer;
        this.gl = renderer.gl;
        this.canvasId = canvasId;

        this.shaderCache = {
            fragment : {},
            vertex : {}
        };

        this.currentProgram = null;

        /** @type {Object.<String,ProgramObject>} */
        this.shaders = {};

        this.createDefaultShaders();
    };

    XML3DShaderManager.FRAGMENT_HEADER = [
        "#ifdef GL_FRAGMENT_PRECISION_HIGH",
        "precision highp float;",
        "#else",
        "precision mediump float;",
        "#endif // GL_FRAGMENT_PRECISION_HIGH",
        "\n"
    ].join("\n");

    XML3DShaderManager.addFragmentShaderHeader = function(fragmentShaderSource) {
        return XML3DShaderManager.FRAGMENT_HEADER + fragmentShaderSource;
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
        XML3DShaderManager.setUniform(this.gl, fallbackShader.uniforms["diffuseColor"], [ 1, 0, 0 ]);
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
     * @returns {Object}
     */
    XML3DShaderManager.prototype.createShader = function(shaderAdapter, lights) {
        if (!shaderAdapter || !shaderAdapter.node.script) {
            return { url: "defaultShader", program: this.shaders["defaultShader"]  };
        }

        var shaderNode = shaderAdapter.node;
        var uri = new XML3D.URI("#" + shaderNode.id);
        var shaderURL = uri.getAbsoluteURI(shaderNode.ownerDocument.documentURI).toString();

        var program = this.shaders[shaderURL];

        if (program && !lights.structureChanged) {
            return { url: shaderURL, program: program };
        }

        var scriptURI = new XML3D.URI(shaderNode.script);
        if (scriptURI.scheme != "urn") {
            return { url: "defaultShader", program: this.shaders["defaultShader"]  };
        }

        var descriptor = XML3DShaderManager.getShaderDescriptor(scriptURI.path);
        var material = this.createMaterialFromShaderDescriptor(descriptor);
        var dataTable = shaderAdapter.requestData(material.getRequestFields());

        program = material.getProgram(lights, dataTable);

        if (!program) {
             XML3D.debug.logError("Unknown shader URI: " + scriptURI + ". Using default shader instead.");
            return { url: "defaultShader", program: this.shaders["defaultShader"]  };
        }

        this.shaders[shaderURL] = program;
        this.gl.useProgram(program.handle);

        var canvasId = shaderAdapter.factory.canvasId;

        this.setUniformsFromComputeResult(program, dataTable, canvasId, { force: true });
        this.updateTextureDataFromComputeResult(program, dataTable, canvasId, { force: true });
        return { url: shaderURL, program: program };
    };

    /**
     * @param {string} path
     * @returns {string}
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

        sources.fragment = XML3DShaderManager.addFragmentShaderHeader(sources.fragment);

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
        this.currentProgram = prg;
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

            var name = uniInfo.name;
            // Need to discuss how to sort out the consequences of doing this in the renderer first --Chris
            if(name.substring(name.length-3) == "[0]") {
                name = name.substring(0, name.length -3); // Remove [0]
            }

            if (uni.type == gl.SAMPLER_2D || uni.type == gl.SAMPLER_CUBE) {
                uniInfo.unit = programObject.nextTextureUnit();
                uniInfo.texture = new XML3D.webgl.GLTexture(gl);
                programObject.samplers[name] = uniInfo;
            } else
                programObject.uniforms[name] = uniInfo;
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

    /**
     *
     * @param {Object} shaderAdapter
     * @param {ProgramObject} programObject
     * @param {Array.<string>} names
     */
    XML3DShaderManager.prototype.resetUniformVariables = function(shaderAdapter, programObject, names)
    {
        if(!shaderAdapter)
            return;
        var result = shaderAdapter.computeRequest.getResult();
        for(var i in names) {
            var name = names[i];
            var entry = result.getOutputData(name);
            if(entry) {
                XML3DShaderManager.setUniform(this.gl, programObject.uniforms[name], entry.getValue());
            }
        }
    }

    XML3DShaderManager.prototype.recompileShader = function(shaderAdapter, lights) {
        var shaderName = shaderAdapter.node.id;
        var shader = this.shaders[shaderName];
        if (shader) {
            this.disposeShader(shader);
            delete this.shaders[shaderName];
            this.createShader(shaderAdapter, lights);
        }
    };

    XML3DShaderManager.prototype.shaderDataChanged = function(adapter, request, changeType) {
        var canvasId = adapter.factory.canvasId;
        var shaderId = new XML3D.URI("#" + adapter.node.id).getAbsoluteURI(adapter.node.ownerDocument.documentURI).toString();
        var program = this.shaders[shaderId];
        if(!program) return; // No Program - probably invalid shader
        var result = request.getResult();
        this.bindShader(program);
        this.setUniformsFromComputeResult(program, result, canvasId);
        this.updateTextureDataFromComputeResult(program, result, canvasId);
        if(program.material) {
            program.material.parametersChanged(result.getOutputMap());
            program.hasTransparency = program.material.isTransparent;
        }
        this.renderer.requestRedraw("Shader data changed");
    };

    XML3DShaderManager.prototype.getShaderByURL = function(url) {
        var sp = this.shaders[url];
        if (!sp) {
            var shaderAdapter = XML3D.base.resourceManager.getAdapter(document.getElementById(url), XML3D.webgl, this.canvasId);
            if (shaderAdapter) {
                // This must be a shader we haven't created yet (maybe it was
                // just added or
                // was not assigned to a group until now
                var shaderInfo = this.createShader(shaderAdapter, this.renderer.lights);
                if (shaderInfo.url == url)
                    return shaderInfo.program;
            }

            XML3D.debug.logError("Could not find the shader [ " + url + " ]");
            sp = this.shaders["default"];
        }
        return sp;
    };

    /**
     * @param {ProgramObject} programObject
     * @param {Xflow.ComputeResult} data
     * @param {Object?} opt
     */
    XML3DShaderManager.prototype.setUniformsFromComputeResult = function(programObject, data, canvasId, opt) {
        var dataMap = data.getOutputMap();
        var uniforms = programObject.uniforms;
        var opt = opt || {};

        var force = opt.force || false;

        for ( var name in uniforms) {
            var entry = dataMap[name];

            if(!entry)
                continue;

            var webglData = XML3D.webgl.getXflowEntryWebGlData(entry, canvasId);

            if(force || webglData.changed) {
                XML3DShaderManager.setUniform(this.gl, uniforms[name], entry.getValue());
                webglData.changed = 0;
            }
        }
    };

    /**
     * @param {ProgramObject} programObject
     * @param {Xflow.ComputeResult} result
     * @param {Object?} opt options
     */
    XML3DShaderManager.prototype.updateTextureDataFromComputeResult = function(programObject, result, canvasId, opt) {
        var samplers = programObject.samplers;

        var opt = opt || {};
        var force = opt.force || false;

        for ( var name in samplers) {
            var sampler = samplers[name];
            var entry = result.getOutputData(name);

            if (!entry) {
                sampler.texture.failed();
                continue;
            }

            var webglData = XML3D.webgl.getXflowEntryWebGlData(entry, canvasId);

            if(force || webglData.changed) {
                sampler.texture.updateFromTextureEntry(entry);
                webglData.changed = 0;
            }
        }
    };

    XML3DShaderManager.prototype.setUniformVariables = function(shader, uniforms) {
        for ( var name in uniforms) {
            var u = uniforms[name];

            if (u.value)
                u = u.value;

            if (shader.uniforms[name]) {
                XML3DShaderManager.setUniform(this.gl, shader.uniforms[name], u);
            }
        }

    };

    /**
     *
     * @param {ProgramObject} programObject
     */
    XML3DShaderManager.prototype.bindShader = function(programObject) {
        var sp = (typeof programObject == typeof "") ? this.getShaderById(programObject) : programObject;

        if (this.currentProgram != sp.handle) {
            this.currentProgram = sp.handle;
            this.gl.useProgram(sp.handle);
        }

        var samplers = sp.samplers;
        for ( var tex in samplers) {
            this.bindSampler(samplers[tex]);
        }
    };

    /** Assumes, the shader is already bound **/
    XML3DShaderManager.prototype.updateActiveShader = function(sp) {
        // Apply any changes encountered since the last time this shader was
        // rendered
        for ( var i = 0, l = sp.changes.length; i < l; i++) {
            var change = sp.changes[i];
            if (change.type == "uniform" && sp.uniforms[change.name]) {
                XML3DShaderManager.setUniform(this.gl, sp.uniforms[change.name], change.newValue);
            }
        }
        sp.changes = [];
    };

    XML3DShaderManager.prototype.unbindShader = function(shader) {
        // TODO: unbind samplers (if any)
        var sp = (typeof shader == typeof "") ? this.getShaderByURL(shader) : shader;
        var samplers = sp.samplers;
        for ( var tex in samplers) {
            this.unbindTexture(samplers[tex]);
        }

        this.currentProgram = null;
        this.gl.useProgram(null);
    };

    var rc = window.WebGLRenderingContext;

    /**
     * Set uniforms for active program
     * @param gl
     * @param u
     * @param value
     * @param {boolean=} transposed
     */
    XML3DShaderManager.setUniform = function(gl, u, value, transposed) {

        switch (u.glType) {
        case rc.BOOL:
        case rc.INT:
        case rc.SAMPLER_2D:
            if (value.length)
                gl.uniform1i(u.location, value[0]);
            else
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
            if (value.length != null)
                gl.uniform1fv(u.location, value);
            else
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
            gl.uniformMatrix2fv(u.location, transposed || false, value);
            break;// gl.FLOAT_MAT2
        case 35675:
            gl.uniformMatrix3fv(u.location, transposed || false, value);
            break;// gl.FLOAT_MAT3
        case 35676:
            gl.uniformMatrix4fv(u.location, transposed || false, value);
            break;// gl.FLOAT_MAT4

        default:
            XML3D.debug.logError("Unknown uniform type " + u.glType);
            break;
        }
    };

    XML3DShaderManager.prototype.disposeShader = function(shader) {
        for ( var tex in shader.samplers) {
            shader.samplers[tex].texture.destroy();
        }
        this.gl.deleteProgram(shader.handle);
    };

    // TODO: Remove here
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
        info.glType = gl.TEXTURE_2D;
        info.format = internalFormat;

        return info;
    };

   /**
     *
     * @param {Object} sampler
     */
    XML3DShaderManager.prototype.bindSampler = function(sampler) {
        var texture = sampler.texture;
        var gl = this.gl;

        if (texture.canBind()) {
            texture.bind(sampler.unit);
            // FIXME: Should not be here, since the texunit is static
            XML3DShaderManager.setUniform(gl, sampler, texture.unit + 1);
        } else {
            texture.unbind(sampler.unit);
        }
    };

    XML3D.webgl.XML3DShaderManager = XML3DShaderManager;
}());
