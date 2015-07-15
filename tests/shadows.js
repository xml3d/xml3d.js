module("Shadows", {});

test("light matrices", 21, function () {

    var changeFunction = function (f) {
        return function (scene) {
            scene.ownerDocument.defaultView[f]();
            return scene;
        }
    };

    stop();

    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/shadow-spot.html");

    var checkInit = frameLoaded.then(function (doc) {return doc.querySelector("xml3d")}).then(promiseOneSceneCompleteAndRendered).then(function (s) {
        var lights = getWebGLFactory(s).getScene().lights;
        equal(lights._lights.length, 1, "Light in light manger");
        ok("spot" in lights._models, "Has spot light");
        var actual = XML3D.math.mat4.create();
        var expected = new XML3D.Mat4();

        var light = lights._lights[0];

        expected = expected.translate([0, 0, 10]);
        light.getWorldMatrix(actual);
        QUnit.closeMatrix(actual, expected, EPSILON, "RenderLight World matrix");

        expected = expected.invert();
        var spot = lights._models.spot.lightModels[0];
        spot.getLightViewMatrix(actual);
        QUnit.closeMatrix(actual, expected, EPSILON, "LightViewMatrix");

        // Depends on how the near/far plane is calculated. Thus this is just for regression:
        expected = [2.4142074584960938, 0, 0, 0, 0, 2.4142074584960938, 0, 0, 0, 0, -1.2035882472991943, -1, 0, 0, -2.204, 0];
        spot.getLightProjectionMatrix(actual);
        QUnit.closeMatrix(actual, expected, EPSILON, "LightProjectionMatrix");

        spot.getLightViewProjectionMatrix(actual);

        var params = {};
        lights.fillGlobalParameters(params, true);
        QUnit.closeMatrix(params.spotLightMatrix, actual, EPSILON, "spotLightMatrix");

        QUnit.closeArray(params.spotLightPosition, [0, 0, 10], EPSILON, "spotLightPosition");
        QUnit.closeArray(params.spotLightDirection, [0, 0, -1], EPSILON, "spotLightDirection");

        return s;
    });

    var setPosition = checkInit.then(changeFunction("setPosition")).then(promiseSceneRendered).then(function (s) {
        var lights = getWebGLFactory(s).getScene().lights;

        var light = lights._lights[0];
        var actual = XML3D.math.mat4.create();
        var expected = new XML3D.Mat4();

        expected = expected.translate([0, 0, 10]);
        light.getWorldMatrix(actual);
        QUnit.closeMatrix(actual, expected, EPSILON, "setPosition::RenderLight World matrix");

        expected = expected.translate([1, 1, 1]).invert();
        var spot = lights._models.spot.lightModels[0];
        spot.getLightViewMatrix(actual);
        QUnit.closeMatrix(actual, expected, EPSILON, "setPosition::LightViewMatrix");

        // Depends on how the near/far plane is calculated. Thus this is just for regression:
        expected = [2.4142074584960938, 0, 0, 0, 0, 2.4142074584960938, 0, 0, 0, 0, -1.1847789287567139, -1, 0, 0, -2.184778928756714, 0 ];
        spot.getLightProjectionMatrix(actual);
        QUnit.closeMatrix(actual, expected, EPSILON, "setPosition::LightProjectionMatrix");

        spot.getLightViewProjectionMatrix(actual);

        var params = {};
        lights.fillGlobalParameters(params, true);
        QUnit.closeMatrix(params.spotLightMatrix, actual, EPSILON, "setPosition::spotLightMatrix");

        QUnit.closeArray(params.spotLightPosition, [1, 1, 11], EPSILON, "setPosition::spotLightPosition");
        QUnit.closeArray(params.spotLightDirection, [0, 0, -1], EPSILON, "setPosition::spotLightDirection");

        return s;
    });

    var setDirection = setPosition.then(changeFunction("setDirection")).then(promiseSceneRendered).then(function (s) {
        var lights = getWebGLFactory(s).getScene().lights;

        var light = lights._lights[0];
        var actual = XML3D.math.mat4.create();
        var expected = new XML3D.Mat4();

        expected = expected.translate([0, 0, 10]);
        light.getWorldMatrix(actual);
        QUnit.closeMatrix(actual, expected, EPSILON, "setDirection::RenderLight World matrix");

        expected = expected.translate([1,1,1]).rotateX(-0.1).invert();
        var spot = lights._models.spot.lightModels[0];
        spot.getLightViewMatrix(actual);
        QUnit.closeMatrix(actual, expected, EPSILON, "setDirection::LightViewMatrix");

        // Depends on how the near/far plane is calculated. Thus this is just for regression:
        expected = [2.4142074584960938, 0, 0, 0, 0, 2.4142074584960938, 0, 0, 0, 0, -1.1646840572357178, -1, 0, 0, -2.1646840572357178, 0 ];
        spot.getLightProjectionMatrix(actual);
        QUnit.closeMatrix(actual, expected, EPSILON, "setDirection::LightProjectionMatrix");

        spot.getLightViewProjectionMatrix(actual);

        var params = {};
        lights.fillGlobalParameters(params, true);
        QUnit.closeMatrix(params.spotLightMatrix, actual, EPSILON, "setDirection::spotLightMatrix");

        QUnit.closeArray(params.spotLightPosition, [1, 1, 11], EPSILON, "setDirection::spotLightPosition");
        QUnit.closeArray(params.spotLightDirection, [0, -0.1, -0.995], EPSILON, "setDirection::spotLightDirection");

        return s;
    });

    setDirection.fin(QUnit.start).done();
});

