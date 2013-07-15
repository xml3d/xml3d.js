(function (webgl) {

    var ProgramFactory = function (context) {
        this.context = context;
        this.programs = {
            fallback: null,
            picking: {
                id: null,
                normal: null,
                position: null
            }
        }
    };

    XML3D.extend(ProgramFactory.prototype, {

        getProgramByName: function (name) {
            var sources = XML3D.shaders.getScript(name);
            if (!sources || !sources.vertex) {
                XML3D.debug.logError("Unknown shader: ", name);
                return null;
            }
            sources.fragment = webgl.addFragmentShaderHeader(sources.fragment);
            return new webgl.GLProgramObject(this.context.gl, sources);
        },
        getFallbackProgram: function () {
            if (!this.programs.fallback) {
                var matte = XML3D.shaders.getScript("matte");
                var material = new webgl.Material(this.context);
                XML3D.extend(material, matte);
                this.programs.fallback = material.getProgram();
                this.programs.fallback.bind();
                webgl.setUniform(this.context.gl, this.programs.fallback.uniforms["diffuseColor"], [ 1, 0, 0 ]);
                this.programs.fallback.unbind();
            }
            return this.programs.fallback;
        },
        getPickingObjectIdProgram: function () {
            var picking = this.programs.picking;
            if (!picking.id) {
                picking.id = this.getProgramByName("pickobjectid");
            }
            return picking.id;
        },
        getPickingPositionProgram: function () {
            var picking = this.programs.picking;
            if (!picking.position) {
                picking.position = this.getProgramByName("pickedposition");
            }
            return picking.position;
        },
        getPickingNormalProgram: function () {
            var picking = this.programs.picking;
            if (!picking.normal) {
                picking.normal = this.getProgramByName("pickedNormals");
            }
            return picking.normal;
        }

    });

    webgl.ProgramFactory = ProgramFactory;

}(XML3D.webgl));