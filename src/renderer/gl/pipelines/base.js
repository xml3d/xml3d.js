(function (webgl) {

    var RenderPipeline = function (context) {
        this.renderPasses = [];
        this.targets = {};
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

        addRenderTarget: function(name, target) {
            if (this.targets[name]) {
                XML3D.debug.logWarning("Render pipeline already contains a target with name '"+name+"', it will be overwritten!");
            }
            this.targets[name] = target;
        },

        getRenderTarget: function(name) {
            if (name === "screen") {
                return this.context.canvasTarget;
            }
            return this.targets[name];
        },

        render : function(scene) {
            for (var i=0; i < this.renderPasses.length; i++) {
                this.renderPasses[i].render(scene);
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
