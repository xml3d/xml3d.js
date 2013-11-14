XML3D.webgl = {
    toString: function () {
        return "webgl";
    },
    supported: (function() {
        var canvas = document.createElement("canvas");

        return function () {
            try {
                return !!(window.WebGLRenderingContext && (canvas.getContext('experimental-webgl')));
            } catch (e) {
                return false;
            }
        };
    }()),
    MAX_PICK_BUFFER_DIMENSION : 512
};
