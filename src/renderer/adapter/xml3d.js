// Adapter for <xml3d>
(function() {
	var XML3DCanvasRenderAdapter = function(factory, node) {
		xml3d.webgl.RenderAdapter.call(this, factory, node);
		this.factory = factory;
	    this.processListeners();
	};
	xml3d.createClass(XML3DCanvasRenderAdapter, xml3d.webgl.RenderAdapter);
	
	XML3DCanvasRenderAdapter.prototype.notifyChanged = function(evt) {
		if (evt.type == 0) {
			this.factory.renderer.sceneTreeAddition(evt);
		} else if (evt.type == 2) {
			this.factory.renderer.sceneTreeRemoval(evt);
		}
		
		var target = evt.internalType || evt.attrName || evt.wrapped.attrName;
		
		if (target == "activeView") {
			this.factory.renderer.activeViewChanged();
		}
	};
	
	XML3DCanvasRenderAdapter.prototype.processListeners  = function() {
	    var attributes = this.node.attributes;
	    for (var index in attributes) {
	        var att = attributes[index];
	        if (!att.name)
	            continue;
	
	        var type = att.name;
	        if (type.match(/onmouse/) || type == "onclick") {
	            var eventType = type.substring(2);
	            this.node.addEventListener(eventType, new Function("evt", att.value), false);
	        }
	    }
	};
	
	XML3DCanvasRenderAdapter.prototype.getElementByPoint = function(x, y, hitPoint, hitNormal) { 
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
				return this.node.currentPickObj;
			else
				return null; 
	};
	
	XML3DCanvasRenderAdapter.prototype.generateRay = function(x, y) {
		
		var glY = this.factory.handler.getCanvasHeight() - y - 1; 
		return this.factory.handler.generateRay(x, glY); 		
	}; 
	xml3d.webgl.XML3DCanvasRenderAdapter = XML3DCanvasRenderAdapter;

}());