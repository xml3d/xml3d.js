(function(webgl){

    /**
     * Contex that includes all GL related resources / handlers
     * @param {WebGLRenderingContext} gl
     * @param {number} id
     * @constructor
     */
    var GLContext = function(gl, id) {
        this.gl = gl;
        this.id = id;
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