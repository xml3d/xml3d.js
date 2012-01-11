/**********************************************
 * Class org.xml3d.webgl.XML3DShaderHandler
 *
 * The XML3DShaderHandler is an abstraction between the renderer and WebGL. It handles the creation of shaders and
 * management of internal shaders that have no DOM node associated with them (eg. the picking shader). No shaders are
 * stored in this class.
 *
 **********************************************/

org.xml3d.webgl.XML3DShaderHandler = function(gl, renderer) {
    this.gl = gl;
    this.renderer = renderer;
    this.currentProgram = null;
    this.shaders = {};
};

org.xml3d.webgl.XML3DShaderHandler.prototype.getStandardShaderProgram = function(name) {
    var sources = {};

    if (!g_shaders[name]) {
        org.xml3d.debug.logError("Unknown shader: "+name+". Using flat shader instead.");
    } else {
        sources.vs = g_shaders[name].vertex;
        sources.fs = g_shaders[name].fragment;
    }

    var shaderProgram = this.createShaderFromSources(sources);
    this.setStandardUniforms(shaderProgram);

    return shaderProgram;
};

org.xml3d.webgl.XML3DShaderHandler.prototype.createShaderFromSources = function(sources) {
    var gl = this.gl;

    if (!sources.vs || !sources.fs) {
        return this.createShaderFromSources( {vs : g_shaders["urn:xml3d:shader:flat"].vertex,
                                          fs : g_shaders["urn:xml3d:shader:flat"].fragment} );
    }

    var prg = gl.createProgram();

    var vShader = this.compileShader(gl.VERTEX_SHADER, sources.vs);
    var fShader = this.compileShader(gl.FRAGMENT_SHADER, sources.fs);

    if (vShader === null || fShader === null) {
        //Use a default flat shader instead
        return this.createShaderFromSources( {vs : g_shaders["urn:xml3d:shader:flat"].vertex,
                                          fs : g_shaders["urn:xml3d:shader:flat"].fragment} );
    }

    //Link shader program
    gl.attachShader(prg, vShader);
    gl.attachShader(prg, fShader);
    gl.linkProgram(prg);

    if (gl.getProgramParameter(prg, gl.LINK_STATUS) == 0) {
        var errorString = "Shader linking failed: \n";
        errorString += gl.getProgramInfoLog(prg);
        errorString += "\n--------\n";
        org.xml3d.debug.logError(errorString);
        gl.getError();

        return this.createShaderFromSources( {vs : g_shaders["urn:xml3d:shader:flat"].vertex,
                                          fs : g_shaders["urn:xml3d:shader:flat"].fragment} );
    }

    var programObject = {
            attributes     : {},
            uniforms     : {},
            samplers    : {},
            handle        : prg,
            vSource        : sources.vs,
            fSource        : sources.fs
    };

    gl.useProgram(prg);

    //Tally shader attributes
    var numAttributes = gl.getProgramParameter(prg, gl.ACTIVE_ATTRIBUTES);
    for (var i=0; i<numAttributes; i++) {
        var att = gl.getActiveAttrib(prg, i);
        if (!att) continue;
        var attInfo = {};
        attInfo.name = att.name;
        attInfo.size = att.size;
        attInfo.glType = att.type;
        attInfo.location = gl.getAttribLocation(prg, att.name);
        programObject.attributes[att.name] = attInfo;
    }

    //TODO: shader not picking up light uniforms?
    //Tally shader uniforms and samplers
    var texCount = 0;
    var numUniforms = gl.getProgramParameter(prg, gl.ACTIVE_UNIFORMS);
    for (var i=0; i<numUniforms; i++) {
        var uni = gl.getActiveUniform(prg, i);
        if (!uni) continue;
        var uniInfo = {};
        uniInfo.name = uni.name;
        uniInfo.size = uni.size;
        uniInfo.glType = uni.type;
        uniInfo.location = gl.getUniformLocation(prg, uni.name);

        if (uni.type == gl.SAMPLER_2D || uni.type == gl.SAMPLER_CUBE) {
            uniInfo.texUnit = texCount;
            programObject.samplers[uni.name] = uniInfo;
            texCount++;
        }
        else
            programObject.uniforms[uni.name] = uniInfo;
    }

    return programObject;
};

org.xml3d.webgl.XML3DShaderHandler.prototype.compileShader = function(type, shaderSource) {
    var gl = this.gl;

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
        org.xml3d.debug.logError(errorString);
        gl.getError();

        return null;
    }

    return shd;
};

org.xml3d.webgl.XML3DShaderHandler.prototype.setStandardUniforms = function(sp) {

    var gl = this.gl;

    var uniform = null;

    //Diffuse color
    uniform = sp.uniforms.diffuseColor;
    if (uniform) {
        this.setUniform(gl, uniform, [1.0, 1.0, 1.0]);
    }

    //Emissive color
    uniform = sp.uniforms.emissiveColor;
    if (uniform) {
        this.setUniform(gl, uniform, [0.0, 0.0, 0.0]);
    }

    //Specular color
    uniform = sp.uniforms.specularColor;
    if (uniform) {
        this.setUniform(gl, uniform, [0.0, 0.0, 0.0]);
    }

    //Shininess
    uniform = sp.uniforms.shininess;
    if (uniform) {
        this.setUniform(gl, uniform, 0.2);
    }

    //Transparency
    uniform = sp.uniforms.transparency;
    if (uniform) {
        this.setUniform(gl, uniform, 0.0);
    }


    //org.xml3d.webgl.checkError(this.gl);
};

org.xml3d.webgl.XML3DShaderHandler.prototype.setUniformVariables = function(sp, uniforms) {
    if (this.currentProgram != sp) {
        this.gl.useProgram(sp.handle);
    }

    for (var name in uniforms) {
        var u = uniforms[name];
        if (u.clean)
            continue;

        if (sp.uniforms[name]) {
            this.setUniform(this.gl, sp.uniforms[name], u);
        }
    }

};

org.xml3d.webgl.XML3DShaderHandler.prototype.bindShader = function(sp) {
    this.currentProgram = sp;
    this.gl.useProgram(sp.handle);
};

org.xml3d.webgl.XML3DShaderHandler.prototype.unbindShader = function(sp) {
    this.currentProgram = null;
    this.gl.useProgram(null);
};

org.xml3d.webgl.XML3DShaderHandler.prototype.setUniform = function(gl, u, value) {
    switch (u.glType) {
        case gl.BOOL:
        case gl.INT:
        case gl.SAMPLER_2D:    gl.uniform1i(u.location, value); break;

        case gl.BOOL_VEC2:
        case gl.INT_VEC2:    gl.uniform2iv(u.location, value); break;

        case gl.BOOL_VEC3:
        case gl.INT_VEC3:    gl.uniform3iv(u.location, value); break;

        case gl.BOOL_VEC4:
        case gl.INT_VEC4:    gl.uniform4iv(u.location, value); break;

        case gl.FLOAT:        gl.uniform1f(u.location, value); break;
        case gl.FLOAT_VEC2:    gl.uniform2fv(u.location, value); break;
        case gl.FLOAT_VEC3:    gl.uniform3fv(u.location, value); break;
        case gl.FLOAT_VEC4:    gl.uniform4fv(u.location, value); break;

        case gl.FLOAT_MAT2: gl.uniformMatrix2fv(u.location, gl.FALSE, value); break;
        case gl.FLOAT_MAT3: gl.uniformMatrix3fv(u.location, gl.FALSE, value); break;
        case gl.FLOAT_MAT4: gl.uniformMatrix4fv(u.location, gl.FALSE, value); break;

        default:
            org.xml3d.debug.logError("Unknown uniform type "+u.glType);
            break;
    }
};

org.xml3d.webgl.XML3DShaderHandler.prototype.bindDefaultShader = function() {
    if (!this.shaders.defaultShader) {
        this.shaders.defaultShader = this.getStandardShaderProgram("urn:xml3d:shader:flat");
    }
    this.currentProgram = this.shaders.defaultShader;
    this.gl.useProgram(this.shaders.defaultShader.handle);

    return this.shaders.defaultShader;
};

org.xml3d.webgl.XML3DShaderHandler.prototype.unbindDefaultShader = function() {
    this.currentProgram = null;
    this.gl.useProgram(null);
};
