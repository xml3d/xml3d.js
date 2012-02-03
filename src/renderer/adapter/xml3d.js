
// Adapter for <xml3d>
xml3d.webgl.XML3DCanvasRenderAdapter = function(factory, node) {
	xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.canvas = factory.handler.canvas;
    this.processListeners();
};
xml3d.webgl.XML3DCanvasRenderAdapter.prototype = new xml3d.webgl.RenderAdapter();
xml3d.webgl.XML3DCanvasRenderAdapter.prototype.constructor = xml3d.webgl.XML3DCanvasRenderAdapter;

xml3d.webgl.XML3DCanvasRenderAdapter.prototype.notifyChanged = function(evt) {
	if (evt.eventType == MutationEvent.ADDITION) {
		this.factory.renderer.sceneTreeAddition(evt);
	} else if (evt.eventType == MutationEvent.REMOVAL) {
		this.factory.renderer.sceneTreeRemoval(evt);
	}
	if (evt.attribute == "activeView") {
		this.factory.renderer.camera = this.factory.renderer.initCamera();
	}
};

xml3d.webgl.XML3DCanvasRenderAdapter.prototype.processListeners  = function() {
    var attributes = this.node.attributes;
    for (var index in attributes) {
        var att = attributes[index];
        if (!att.name)
            continue;

        var type = att.name;
        if (type.match(/onmouse/) || type == "onclick") {
            var eventType = type.substring(2);
            this.node.addEventListener(eventType, new Function(att.value), false);
        }
    }
};

xml3d.webgl.XML3DCanvasRenderAdapter.prototype.dispatchEvent = function(evt) {
    var res = this.node.dispatchEvent(evt);
};

xml3d.webgl.XML3DCanvasRenderAdapter.prototype.getElementByPoint = function(x, y, hitPoint, hitNormal) { 
		this.factory.handler.renderPick(x, y);
		if(hitPoint && this.node.currentPickPos)
		{
			xml3d.copyVector(hitPoint, this.node.currentPickPos);
		}
		
		if(hitNormal && this.node.currentPickObj)
		{
			this.factory.handler.renderPickedNormals(this.node.currentPickObj, x, y);
			xml3d.copyVector(hitNormal, this.node.currentPickNormal);
		}
		
		if(this.node.currentPickObj)
			return this.node.currentPickObj.node;
		else
			return null; 
};

xml3d.webgl.XML3DCanvasRenderAdapter.prototype.generateRay = function(x, y) {
	
	var glY = this.factory.handler.getCanvasHeight() - y - 1; 
	return this.factory.handler.generateRay(x, glY); 		
}; 