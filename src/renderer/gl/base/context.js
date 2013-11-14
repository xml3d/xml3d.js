(function(webgl){

    /**
     * Contex that includes all GL related resources / handlers
     * @param {WebGLRenderingContext} gl
     * @param {number} id
     * @param {number} width
     * @param {number} height
     * @constructor
     */
    var GLContext = function(gl, id, width, height) {
        this.gl = gl;
        this.id = id;
        this.canvasTarget = new XML3D.webgl.GLCanvasTarget(this, width, height);
        this.programFactory = new XML3D.webgl.ProgramFactory(this);
        this.stats = {
            materials: 0,
            meshes: 0
        };
        this.extensions = populateExtensions(gl);

    };

    var EXTENSIONS = GLContext.EXTENSIONS = {};
    EXTENSIONS.STANDARD_DERIVATES = 'OES_standard_derivatives';


    XML3D.extend(GLContext.prototype, {
        getXflowEntryWebGlData: function (entry) {
            return XML3D.webgl.getXflowEntryWebGlData(entry, this.id);
        },
        requestRedraw: function(reason) {
            //handler.redraw(reason, forcePicking);
        },
        handleResizeEvent: function(width, height) {
            this.canvasTarget = new XML3D.webgl.GLCanvasTarget(this, width, height);
        },
        getStatistics: function() {
            return this.stats;
        },
        getExtensionByName: function(name) {
            return this.extensions[name];
        }
    });

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

    webgl.GLContext = GLContext;

}(XML3D.webgl));
