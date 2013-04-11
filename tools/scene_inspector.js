if(!XML3D) 
    XML3D = {};

XML3D.SceneInspector = function(xml3d) {
    var self = this;
    this.xml3d = xml3d;
    if(!this.xml3d)
        return;

    this.inspect = function(event){
        var button = (event.which || event.button);
        if(button == 2){
            var node = this.xml3d.getElementByPoint(event.pageX, event.pageY);
            var path = "";
            while(node && node != xml3d){
                path += " >> " + node + " (ID: " + node.id + ")";
                node = node.parentNode;
            }
            XML3D.debug.logInfo("Mouse: " + pt.x + " " + pt.y + " => " + path);
        }
    };

    this.xml3d.addEventListener("mouseup",
    function(event){ self.inspect(event); }, false);
};
