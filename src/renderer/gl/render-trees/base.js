(function (webgl) {
    "use strict";

    var BaseRenderTree = function (renderInterface) {
        this.mainRenderPass = null;
        this.renderInterface = renderInterface;
    };

    XML3D.extend(BaseRenderTree.prototype, {
        render: function(scene) {
            this.mainRenderPass.renderTree(scene);
        }
    });

    webgl.BaseRenderTree = BaseRenderTree;

})(XML3D.webgl);
