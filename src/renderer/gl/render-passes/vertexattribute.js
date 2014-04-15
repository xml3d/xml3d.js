(function (webgl) {

    var VertexAttributePass = function (renderInterface, output, opt) {
		webgl.BaseRenderPass.call(this, renderInterface, output, opt);
		this._program = this.renderInterface.context.programFactory.getProgramByName(opt.programName);
    };

    XML3D.createClass(VertexAttributePass, webgl.SceneRenderPass);

    XML3D.extend(VertexAttributePass.prototype, {
        render: function (scene) {
                var gl = this.renderInterface.context.gl;
                var target = this.output;
                var width = target.getWidth();
                var height = target.getHeight();
                var aspect = width / height;

                target.bind();
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                gl.viewport(0, 0, target.getWidth(), target.getHeight());
                gl.enable(gl.DEPTH_TEST);

                scene.updateReadyObjectsFromActiveView(aspect);

                this.renderObjectsToActiveBuffer(scene.ready, scene, target, scene.systemUniforms, [], { transparent: false, program: this._program });

                target.unbind();
            }
    });

    webgl.VertexAttributePass = VertexAttributePass;

}(XML3D.webgl));
