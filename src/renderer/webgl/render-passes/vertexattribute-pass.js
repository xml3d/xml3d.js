var SceneRenderPass = require("./scene-pass.js");

var VertexAttributePass = function (renderInterface, output, opt) {
    SceneRenderPass.call(this, renderInterface, output, opt);
    this._program = this.renderInterface.context.programFactory.getProgramByName(opt.programName);
};

XML3D.createClass(VertexAttributePass, SceneRenderPass);

XML3D.extend(VertexAttributePass.prototype, {
    render: function (scene) {
        var gl = this.renderInterface.context.gl;
        var target = this.output;
        var width = target.getWidth();
        var height = target.getHeight();
        var aspect = width / height;

        target.bind();
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);

        scene.updateReadyObjectsFromActiveView(aspect);

        this.renderObjectsToActiveBuffer(scene.ready, scene, target, scene.systemUniforms, [], {
            transparent: false,
            program: this._program
        });

        target.unbind();
    }
});

module.exports = VertexAttributePass;

