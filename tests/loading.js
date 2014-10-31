module("Loading tests", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            that.win = document.getElementById("xml3dframe").contentWindow;
            start();
        };
        loadDocument("scenes/data-loading.html"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Data Loading", function() {

    var mesh = this.doc.querySelector("mesh"),
        data = this.doc.querySelector("#inlineData"),
        shader = this.doc.querySelector("shader"),
        img = this.doc.querySelector("#testImg"),
        swapData = this.doc.querySelector("#swapData"),
        swapImg = this.doc.querySelector("#swapImg");

    equal(mesh.complete, true, "Mesh is complete");
    equal(data.complete, true, "Data is complete");
    equal(shader.complete, img.complete, "Shader complete is identical with img.complete");
    var randKey = "?rand=" + Math.random();

    var step = 0;
    var loadTestStep = function(e){
        step++;
        if(step == 1){
            mesh.addEventListener('load', loadTestStep);
            data.addEventListener('load', loadTestStep);
            data.src = "xml/meshes.xml" + randKey + "#simpleMesh";
            equal(data.complete, false, "After data.src change, data.complete is false");
            equal(mesh.complete, false, "After data.src change, mesh.complete is also false");
        }
        if(step == 2){
            equal(e.target, data, "Data dispatched a load event");
            equal(data.complete, true, "data.complete is now true");
        }
        if(step == 3){
            equal(e.target, mesh, "Mesh also dispatched a load event");
            equal(mesh.complete, true, "mesh.complete is now true");
            mesh.src = "xml/otherMeshes.xml" + randKey + "#simpleMesh";
            equal(data.complete, true, "After mesh.src change, data.complete is still true");
            equal(mesh.complete, false, "After mesh.src change, mesh.complete is false");
        }
        if(step == 4){
            equal(e.target, mesh, "Mesh dispatched another load event");
            equal(mesh.complete, true, "mesh.complete is now true");
            shader.addEventListener('load', loadTestStep);
            img.src = "textures/magenta.png" + randKey;
            equal(shader.complete, false, "After img.src change, shader.complete is false");
        }
        if(step == 5) {
            equal(e.target, shader, "Shader dispatched its very first textureload event");
            equal(shader.complete, true, "shader.complete is now true");
            swapImg.src = "textures/water.jpg" + randKey;
            shader.src = "#swapData";
            equal(swapData.complete, false, "After swapImg.src change, swapData.complete is false");
            equal(shader.complete, false, "After hooking shader with swapData, shader.complete is also false");
        }
        if(step == 6){
            equal(e.target, shader, "Shader dispatched another load event");
            equal(shader.complete, true, "shader.complete is now true");
            start();
        }
    }
    loadTestStep();
    stop();


});

