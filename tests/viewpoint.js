module("Viewpoint", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/viewpoint.xhtml" + window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Remove and add viewpoints", function() {
    var xml3dElement = this.doc.getElementById("xml3DElem"),
        views = this.doc.getElementById("views"),
        meshGroup = this.doc.getElementById("mesh");

    xml3dElement.removeChild(meshGroup);

    xml3dElement.appendChild(meshGroup);

    while(views.firstChild){
        views.removeChild(views.firstChild);
    }


    var newGroup = this.doc.createElementNS(XML3D.xml3dNS, "group");
    newGroup.setAttribute("style", "transform: translateY(3)");
    var newView = this.doc.createElementNS(XML3D.xml3dNS, "view");
    newView.id = "newView";
    newGroup.appendChild(newView);

    views.appendChild(newGroup);
    xml3dElement.activeView = "#newView";

});
