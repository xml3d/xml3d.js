(function (ns) {

    XML3D.shaders = XML3D.materials = require("./webgl/materials/");
    XML3D.webgl = require("./webgl");
    XML3D.renderer = require("./renderer");
    require("../xflow/utils/math.js")(XML3D.math);
    require("../xflow/operator/default");

}(module));
