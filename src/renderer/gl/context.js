(function(webgl){

    /**
     * Contex that includes all GL related resources / handlers
     * @param {WebGLRenderingContext} gl
     * @param {number} id
     * @constructor
     */
    var GLContext = function(gl, id, height, width) {
        this.gl = gl;
        this.id = id;
        this.canvasTarget = new XML3D.webgl.GLCanvasTarget(this, height, width);
        this.programFactory = new XML3D.webgl.ProgramFactory(this);
    };
    XML3D.extend(GLContext.prototype, {
        getXflowEntryWebGlData: function (entry) {
            return XML3D.webgl.getXflowEntryWebGlData(entry, this.id);
        },
        requestRedraw: function(reason, forcePicking) {
            //handler.redraw(reason, forcePicking);
        }
    });

    webgl.GLContext = GLContext;

}(XML3D.webgl));