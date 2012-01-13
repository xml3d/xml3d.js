
// Adapter for <xml3d>
org.xml3d.webgl.XML3DCanvasRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.canvas = factory.handler.canvas;
	this.processListeners();
};
org.xml3d.webgl.XML3DCanvasRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DCanvasRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DCanvasRenderAdapter;

org.xml3d.webgl.XML3DCanvasRenderAdapter.prototype.notifyChanged = function(evt) {
	if (evt.eventType == MutationEvent.ADDITION) {
		this.factory.renderer.sceneTreeAddition(evt);
	} else if (evt.eventType == MutationEvent.REMOVAL) {
		this.factory.renderer.sceneTreeRemoval(evt);
	}
	if (evt.attribute == "activeView") {
		this.factory.renderer.camera = this.factory.renderer.initCamera();
	}
};

org.xml3d.webgl.XML3DCanvasRenderAdapter.prototype.processListeners  = function() {
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

org.xml3d.webgl.XML3DCanvasRenderAdapter.prototype.dispatchEvent = function(evt) {
	var res = this.node.dispatchEvent(evt);
};

org.xml3d.webgl.XML3DCanvasRenderAdapter.prototype.getElementByPoint = function(x, y, hitPoint, hitNormal) { 
		this.factory.handler.renderPick(x, y);
		if(hitPoint && this.node.currentPickPos)
		{
			org.xml3d.copyVector(hitPoint, this.node.currentPickPos);
		}
		
		if(hitNormal && this.node.currentPickObj)
		{
			this.factory.handler.renderPickedNormals(this.node.currentPickObj, x, y);
			org.xml3d.copyVector(hitNormal, this.node.currentPickNormal);
		}
		
		if(this.node.currentPickObj)
			return this.node.currentPickObj.node;
		else
			return null; 
};

org.xml3d.webgl.XML3DCanvasRenderAdapter.prototype.generateRay = function(x, y) {
	
	var glY = this.factory.handler.getCanvasHeight() - y - 1; 
	return this.factory.handler.generateRay(x, glY); 		
}; 