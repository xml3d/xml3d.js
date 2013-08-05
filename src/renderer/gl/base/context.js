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
    };
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
        }
    });

    webgl.GLContext = GLContext;

}(XML3D.webgl));
