
var utils = require("./utils.js");
var SystemNotifier = require("../system/system-notifier.js");
var GL = require("../constants.js");

//noinspection JSValidateJSDoc
/**
 * @param {WebGLRenderingContext} gl
 * @param {Number} type
 * @param {string} shaderSource
 * @return {WebGLShader}
 */
var createWebGLShaderFromSource = function (gl, type, shaderSource) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    if (gl.getShaderParameter(shader, GL.COMPILE_STATUS) == 0) {
        var message = gl.getShaderInfoLog(shader);
        var errorString = "";
        if (type == GL.VERTEX_SHADER)
            errorString = "Vertex shader failed to compile: \n"; else
            errorString = "Fragment shader failed to compile: \n";

        errorString += message + "\n--------\n";
        errorString += "Shader Source:\n--------\n";
        errorString += XML3D.debug.formatSourceCode(shaderSource);
        gl.getError();
        SystemNotifier.sendEvent('glsl', {
                glslType: "compile_error",
                shaderType: type == GL.VERTEX_SHADER ? "vertex" : "fragment",
                code: shaderSource,
                message: message
            });

        throw new Error(errorString)
    }
    return shader;
};

//noinspection JSValidateJSDoc
/**
 * @param {WebGLRenderingContext} gl
 * @param vertexSources
 * @param fragmentSources
 * @returns {WebGLProgram}
 */
var createProgramFromSources = function (gl, vertexSources, fragmentSources) {
    var shd, s, src;
    var shaders = [];
    for (s in vertexSources) {
        src = vertexSources[s];
        shd = createWebGLShaderFromSource(gl, GL.VERTEX_SHADER, src);
        shaders.push(shd);
    }
    for (s in fragmentSources) {
        src = fragmentSources[s];
        shd = createWebGLShaderFromSource(gl, GL.FRAGMENT_SHADER, src);
        shaders.push(shd);
    }
    return createProgramFromShaders(gl, shaders);
};

//noinspection JSValidateJSDoc
/**
 * @param {WebGLRenderingContext} gl
 * @param {Object} shaders
 * @return {WebGLProgram}
 */
var createProgramFromShaders = function (gl, shaders) {
    var program = gl.createProgram();
    for (var s in shaders) {
        var shader = shaders[s];
        gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, GL.LINK_STATUS) == 0) {
        var message = gl.getProgramInfoLog(program);
        var errorString = "Shader linking failed: \n";
        errorString += message;
        errorString += "\n--------\n";
        gl.getError();
        SystemNotifier.sendEvent('glsl', {glslType: "link_error", message: message});
        throw new Error(errorString);
    }
    return program;
};

var tally = function (gl, handle, programObject) {
    var i;
    // Tally shader attributes
    var numAttributes = gl.getProgramParameter(handle, gl.ACTIVE_ATTRIBUTES);
    for (i = 0; i < numAttributes; i++) {
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
    for (i = 0; i < numUniforms; i++) {
        var uni = gl.getActiveUniform(handle, i);
        if (!uni)
            continue;
        var uniInfo = {};
        uniInfo.name = uni.name;
        uniInfo.size = uni.size;
        uniInfo.glType = uni.type;
        uniInfo.location = gl.getUniformLocation(handle, uni.name);

        var name = uniInfo.name;

        // Remove array identifier from name, this is handled by size
        if (name.substring(name.length - 3) == "[0]") {
            name = name.substring(0, name.length - 3); // Remove [0]
        }

        if (uni.type == gl.SAMPLER_2D || uni.type == gl.SAMPLER_CUBE) {
            // Set all texture units to -1 to be bound during rendering
            uniInfo.cachedUnits = new Int32Array(uniInfo.size);
            uniInfo.cachedUnits.fill(-1);
            uniInfo.textures = [];

            programObject.samplers[name] = uniInfo;
        } else {
            programObject.uniforms[name] = uniInfo;
        }
    }

};

var uniqueObjectId = utils.getUniqueCounter();
var c_existingPrograms = new WeakMap();

var getExistingProgram = function(gl, sources) {
    if (!c_existingPrograms.has(gl)) {
        c_existingPrograms.set(gl, []);
    }

    var existing = c_existingPrograms.get(gl);
    for (var i=0; i < existing.length; i++) {
        //If two programs share the exact same source code we can re-use the compiled shader
        var prg = existing[i];
        if (prg.sources.vertex == sources.vertex && prg.sources.fragment == sources.fragment) {
            return prg;
        }
    }
    return null;
};

/**
 * @constructor
 * @param {WebGLRenderingContext} gl
 * @param {{ fragment: string, vertex: string }} sources
 */
var ProgramObject = function (gl, sources) {
    this.gl = gl;
    this.sources = sources;

    this.id = -1;
    this.attributes = {};
    this.uniforms = {};
    this.samplers = {};
    this.defaultUniforms = {};
    this.handle = null;
    this.create();
};

XML3D.extend(ProgramObject.prototype, {
    create: function () {
        XML3D.debug.logDebug("Create shader program: ", this.id);

        var existing = c_existingPrograms.get(this.gl);
        this.handle = createProgramFromSources(this.gl, [this.sources.vertex], [this.sources.fragment]);
        this.id = uniqueObjectId();
        existing.push(this);

        if (!this.handle)
            return;
        SystemNotifier.sendEvent('glsl', {glslType: "success"});
        this.bind();
        tally(this.gl, this.handle, this);
    },

    bind: function () {
        if (!this.handle) {
            XML3D.debug.logError("Trying to bind invalid GLProgram.");
        }
        this.gl.useProgram(this.handle);
    },

    unbind: function () {
    }, isValid: function () {
        return !!this.handle;
    }, setUniformVariables: function (envNames, sysNames, inputCollection) {
        var i, base, override, name;
        if (envNames && inputCollection.envBase) {
            base = inputCollection.envBase;
            override = inputCollection.envOverride;
            if (envNames == true) {
                //Set all uniforms in the input collection
                for (name in base) {
                    this.setUniformVariable(name, override && override[name] !== undefined ? override[name] : base[name]);
                }
            } else {
                //Set only those uniforms specified in envNames
                i = envNames.length;
                while (i--) {
                    name = envNames[i];
                    this.setUniformVariable(name, override && override[name] !== undefined ? override[name] : base[name]);
                }
            }

        }
        if (sysNames && inputCollection.sysBase) {
            i = sysNames.length;
            base = inputCollection.sysBase;
            while (i--) {
                name = sysNames[i];
                this.setUniformVariable(name, base[name]);
            }
        }
    }, setUniformVariable: function (name, value) {
        if (value === undefined) return;
        if (this.uniforms[name]) {
            utils.setUniform(this.gl, this.uniforms[name], value);
        } else if (this.samplers[name]) {
            this.setUniformSampler(this.samplers[name], value);
        }
    },

    /**
     * Sets the texture units from the textures associated with the sampler
     * @param sampler
     * @returns {boolean}
     */
    setSamplerFromTextures: function (sampler) {
        var textures = sampler.textures;
        var cachedUnits = sampler.cachedUnits;
        var textureUnitsChanged = false;

        for (var i = 0, ii = textures.length; i < ii; i++) {
            var unit = textures[i].unit;

            // If texture is not bound to a texture unit (-1), bind it now
            if (unit == -1) {
                unit = textures[i]._bind();
            }
            cachedUnits[i] = unit;
            textureUnitsChanged = true;
        }
        if (textureUnitsChanged) {
            utils.setUniform(this.gl, sampler, cachedUnits);
        }
    },

    setSamplerFromArray: function(sampler, arr) {
        var cachedUnits = sampler.cachedUnits;
        var textureUnitsChanged = false;

       for (var i = 0, ii = arr.length; i < ii; i++) {
            var unit = arr[i];
            if (unit != cachedUnits[i]) {
                cachedUnits[i] = unit;
                textureUnitsChanged = true;
            }
        }
        if (textureUnitsChanged) {
            utils.setUniform(this.gl, sampler, cachedUnits);
            XML3D.debug.logDebug("Setting global texture units:", sampler.name, cachedUnits, this.id);
        }
    },

    /**
     *
     * @param {Object} sampler
     * @param {Array.<GLTexture>|Int32Array} value
     */
    setUniformSampler: function (sampler, value) {
        XML3D.debug.assert(value && sampler);
        // Textures are always an array value
        XML3D.debug.assert(Array.isArray(value), "Program::setUniformSampler: Unexpected value.");
        // We have at least one entry
        XML3D.debug.assert(value.length, "Program::setUniformSampler: No entry in value.");

        /**
         * Value can either be an array of GLTextures that know their current texture unit,
         * otherwise a typed array containing the texture units we have to bind.
         * @type {boolean}
         */
        var hasTextures = value[0].unit != undefined;

        if(hasTextures) {
            sampler.textures = value;
            this.setSamplerFromTextures(sampler);
        } else {
            this.setSamplerFromArray(sampler, value);
        }
    }
});

module.exports = {
    ProgramObject : ProgramObject,
    getExistingProgram : getExistingProgram
};

