module("WebGL Video", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            // code injection to get XML3D object of the loaded document
            var script = document.createElement("script");
            script.text = "document.XML3D = XML3D;";
            that.doc.body.appendChild(script);
            start();
        };
        loadDocument("scenes/video.html", this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Check video", function() {
    ok(this.doc.XML3D !== undefined, "Access to XML3D object of loaded scene");
    var video = this.doc.getElementById("myvideo");
    ok(video !== undefined, "Access to the XML3D video element of the loaded scene");

    var doc = this.doc;
    var htmlVideo = null;

    var expected = new Image();


    function waitForPlayingVideo(event) {
        var r = XML3DTestLib.callAdapterFunc(video, {getValue : []});
        ok(r.length == 1, "Access to HTML video element");
        htmlVideo = r[0];
        start();

        expected.onload = function(e) {
            start();
            // make video frame snapshot
            var canvas = document.createElement("canvas");
            canvas.width = htmlVideo.videoWidth;
            canvas.height = htmlVideo.videoHeight;
            doc.body.appendChild(canvas);

            var ctx = canvas.getContext("2d");
            ctx.drawImage(htmlVideo, 0, 0, htmlVideo.videoWidth, htmlVideo.videoHeight);

            var image = new Image();
            image.onload = function (e) {
                // finally compare
                // FIXME: Currently encoded video is not fully equal with the image
                QUnit.imageClose(image, expected, 17, "Correct video frame");
                start();
            }
            image.src = canvas.toDataURL("image/png");
            stop();
        }
        expected.src = "./scenes/textures/green.png";
        stop();
    }

    var firstError = true;
    video.addEventListener('canplay', waitForPlayingVideo);
    video.addEventListener('error', function(event) {
        if (firstError) {
            video.src = "textures/green.ogv";
            firstError = false;
        } else {
            ok(false, "HTML Video loading failed");
        }
    });

    video.src="textures/green.mp4";
    stop();
});
