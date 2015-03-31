var TextureManager = require("texture-manager").SimpleTextureManager;
var GLTexture = require("./texture.js").GLTexture;
var GLCubeMap = require("./texture.js").GLCubeMap;
var GLCanvasTarget = require("./rendertarget.js").GLCanvasTarget;
var ProgramFactory = require("./../shader/programfactory.js");
var XC = require("../../../xflow/interface/constants.js");

var CONTEXT_OPTIONS = {
    alpha: true, premultipliedAlpha: false, antialias: true, stencil: true, preserveDrawingBuffer: true
};

/**
 * @param {HTMLCanvasElement!} canvas
 */
function getContextForCanvas(canvas) {
    try {
        return canvas.getContext('experimental-webgl', CONTEXT_OPTIONS);
    } catch (e) {
        return null;
    }
}

/**
 * Context that includes all GL related resources / handlers
 * @param {HTMLCanvasElement!} canvas
 * @param {number} id
 * @constructor
 */
var GLContext = function (canvas, id) {
    this.gl = getContextForCanvas(canvas);
    this.id = id;
    this.canvasTarget = new GLCanvasTarget(this, canvas.clientWidth, canvas.clientHeight);
    this.programFactory = new ProgramFactory(this);
    this.textureManager = new TextureManager({ units: this.gl.getParameter(WebGLRenderingContext.MAX_COMBINED_TEXTURE_IMAGE_UNITS )});
    this.stats = {
        materials: 0, meshes: 0
    };
    this.extensions = populateExtensions(this.gl);

};

var EXTENSIONS = GLContext.EXTENSIONS = {};
EXTENSIONS.STANDARD_DERIVATES = 'OES_standard_derivatives';
EXTENSIONS.MULTIPLE_RENDER_TARGETS = 'WEBGL_draw_buffers';
EXTENSIONS.DEPTH_TEXTURE = 'WEBGL_depth_texture';
EXTENSIONS.FLOAT_COLOR_BUFFER = 'WEBGL_color_buffer_float';
EXTENSIONS.FLOAT_TEXTURES = 'OES_texture_float';
EXTENSIONS.UINT32_INDICES = 'OES_element_index_uint';

XML3D.extend(GLContext.prototype, {
    getXflowEntryWebGlData: function (entry) {
        return getXflowEntryWebGlData(entry, this.id);
    },

    requestRedraw: function (reason) {
        //handler.redraw(reason, forcePicking);
    },

    handleResizeEvent: function (width, height) {
        this.canvasTarget = new GLCanvasTarget(this, width, height);
    },

    getStatistics: function () {
        return this.stats;
    },

    getExtensionByName: function (name) {
        return this.extensions[name];
    } ,

    createTexture: function() {
        return new GLTexture(this);
    } ,
    createCubeMap: function() {
        return new GLCubeMap(this);
    }
});


function getXflowEntryWebGlData(entry, canvasId){
    if(!entry) return null;
    if(!entry.userData.webglData)
        entry.userData.webglData = {};
    if(!entry.userData.webglData[canvasId])
        entry.userData.webglData[canvasId] = {
            changed : XC.DATA_ENTRY_STATE.CHANGED_NEW
        };
    return entry.userData.webglData[canvasId];
}

/**
 * @param {WebGLRenderingContext} gl
 * @returns {{}}
 */
function populateExtensions(gl) {
    var result = {};
    for (var name in EXTENSIONS) {
        var extensionName = EXTENSIONS[name];
        var ext = gl.getExtension(extensionName);
        if (!ext) {
            XML3D.debug.logInfo(extensionName, "is not supported on your graphics card");
        } else {
            result[extensionName] = ext;
        }
    }
    return result;
}

module.exports = GLContext;


