XML3D.webgl = {
    toString: function () {
        return "webgl";
    },
    supported: (function() {
        var canvas = document.createElement("canvas");

        return function () {
            try {
                var hasContextClass = !!(window.WebGLRenderingContext);
                if (hasContextClass) {
                    var context = canvas.getContext('experimental-webgl');
                    if (!!context) {
                        var renderer = context.getParameter(context.RENDERER);
                        // IE 11 does not work yet :-(
                        return renderer !== "Internet Explorer";
                    }
                }
                return false;
            } catch (e) {
                return false;
            }
        };
    }()),
    MAX_PICK_BUFFER_DIMENSION : 512
};
