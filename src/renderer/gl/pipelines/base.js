(function (webgl) {

    var RenderPipeline = function (context) {
        this.renderPasses = [];
        this.shaders = {};
        this.context = context;
    };

    XML3D.extend(RenderPipeline.prototype, {

        init: function() {
            var context = this.context;
            this.renderPasses.forEach(function(pass) {
                if (pass.init) {
                    pass.init(context);
                }
            });
        },

        addRenderPass: function(pass, position) {
            if (position !== undefined) {
                this.renderPasses = this.renderPasses.splice(position, 0, pass);
            } else {
                this.renderPasses.push(pass);
            }
            pass.setRenderPipeline(this);
        },

        removeRenderPass: function(pass) {
            var passPos = this.renderPasses.indexOf(pass);
            if(passPos != -1) {
                this.renderPasses.splice(passPos, 1);
            }
        },

        render : function(scene) {
            for (var i=0; i < this.renderPasses.length; i++) {
                this.renderPasses[i].renderTree(scene);
            }
        },

        getShader: function(name) {
            return this.shaders[name];
        },

        addShader: function(name, shader) {
            this.shaders[name] = shader;
        }

    });

    webgl.RenderPipeline = RenderPipeline;

})(XML3D.webgl);
