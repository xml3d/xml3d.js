// -----------------------------------------------------------------------------
// Class XML3Document
// -----------------------------------------------------------------------------
org.xml3d.XML3DDocument = function(parentDocument) {
    this.parentDocument = parentDocument;
    this.factory = new org.xml3d.XML3DNodeFactory();
    this.onload = function() {
        alert("on load");
    };
    this.onerror = function() {
        alert("on error");
    };
};

org.xml3d.XML3DDocument.prototype.initXml3d = function(xml3dElement) {

    if (xml3dElement._xml3dNode !== undefined)
        return;

    xml3dNode = this.getNode(xml3dElement);
    xml3dElement.addEventListener('DOMNodeRemoved', this.onRemove, true);
    xml3dElement.addEventListener('DOMNodeInserted', this.onAdd, true);
    xml3dElement.addEventListener('DOMAttrModified', this.onSet, true);
    xml3dElement.addEventListener('DOMCharacterDataModified', this.onTextSet, true);

};


function isEqual(val1, val2)
{
    if(val1 === val2)
    {
        return true;
    }

    if(! (val1 && val2))
    {
        return false;
    }

    if(org.xml3d.isUInt16Array(val1)   ||
       org.xml3d.isFloatArray(val1)    ||
       org.xml3d.isFloat2Array(val1)   ||
       org.xml3d.isFloat3Array(val1)   ||
       org.xml3d.isFloat4Array(val1)   ||
       org.xml3d.isFloat4x4Array(val1) ||
       org.xml3d.isBoolArray(val1))
    {

        if(val1.length != val2.length)
        {
            return false;
        }

        if(val1.toString() != val2.toString())
        {
            return false;
        }

        for(var i=0; i < val1.length; i++)
        {
            if(val1[i] != val2[i])
            {
                return false;
            }
        }
    }
    else if(org.xml3d.isXML3DVec3(val1))
    {
        return val1.x == val2.x &&
               val1.y == val2.y &&
               val1.z == val2.z;
    }
    else if(org.xml3d.isXML3DRotation(val1))
    {
        return val1.x == val2.x &&
               val1.y == val2.y &&
               val1.z == val2.z &&
               val1.w == val2.w;
    }
    else
    {
        for(var i in val1)
        {
            if(val1[i] != val2[i])
            {
                return false;
            }
        }
    }

    if (typeof val1 == typeof val2)
        return val1 == val2;

    return true;
};


org.xml3d.XML3DDocument.prototype.onTextSet = function(e){
    if (e.target === undefined)
    {
        org.xml3d.debug.logInfo("Unhandled event on: " + e.target.localName);
        return;
    }
    try
    {
        var removedNodeParent = e.target.parentNode;
        removedNodeParent.setValue(e);

        if (!removedNodeParent.notificationRequired)
            return;

        if (removedNodeParent.notificationRequired())
        {
            removedNodeParent.notify(new org.xml3d.Notification(this, MutationEvent.REMOVAL, "node", e.target, ""));
        }
    }
    catch (e)
    {
        org.xml3d.debug.logError("Exception in textSet:");
        org.xml3d.debug.logException(e);
    }
};

/*
org.xml3d.XML3DDocument.prototype.onTextSet = function(e){
    if (e.target === undefined)
    {
        org.xml3d.debug.logInfo("Unhandled event on: " + e.target.localName);
        return;
    }
    try
    {
        var bindNode = e.target.parentNode;
        var oldValue = e.target.parentNode.value;

        e.target.parentNode.setValue(e);

        if (bindNode.notificationRequired() && ! isEqual(oldValue, e.target.parentNode.value))
        {
            bindNode.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, "text", oldValue, e.target.parentNode.value));
        }
    }
    catch (e)
    {
        org.xml3d.debug.logError("Exception in textSet:");
        org.xml3d.debug.logException(e);
    }
};
*/




org.xml3d.XML3DDocument.prototype.onAdd = function(e) {
    try {
        org.xml3d.document.getNode(e.target);

        var parent = e.target.parentNode;
        if (parent && parent.notify) {
            parent.notify(new org.xml3d.Notification(this, MutationEvent.ADDITION, null, null, e.target));
        }
    } catch (e) {
        org.xml3d.debug.logError("Exception in configuring node:");
        org.xml3d.debug.logException(e);
    }
};

org.xml3d.XML3DDocument.prototype.onSet = function(e) {
    if (e.target === undefined)
    {
        org.xml3d.debug.logInfo("Unhandled event on: " + e.target.localName);
        return;
    }

    try
    {
        var result;

        if(e.attrChange == MutationEvent.REMOVAL)
        {
            result = e.target.resetAttribute(e.attrName);
        }
        else if(e.attrChange == MutationEvent.MODIFICATION ||
                e.attrChange == MutationEvent.ADDITION)
        {
            result = e.target.setField(e);
        }
        else
        {
            org.xml3d.debug.logError("An unknown event for attribue " + e.attrName +
                                     " of node " + e.target.localName + " has occured");
            return;
        }


        /*if (result == org.xml3d.event.HANDLED &&
            e.target.notificationRequired()   &&
            ! isEqual(e.prevValue, e.newValue))
        {
            // The removal of an attribute is also handled as MutationEvent.MODIFICATION since
            // this event is handled by resetting the internal attribute value.
            e.target.notify(new org.xml3d.Notification(this, MutationEvent.MODIFICATION, e.attrName, e.prevValue, e.newValue));
        }*/
     }
     catch (e)
     {
        org.xml3d.debug.logError("Exception in setField:");
        org.xml3d.debug.logException(e);
    }
};

org.xml3d.XML3DDocument.prototype.onRemove = function(e)
{
    org.xml3d.debug.logInfo("Remove: "+e);

    if (e.target === undefined)
    {
        org.xml3d.debug.logInfo("Unhandled event on: " + e.target.localName);
        return;
    }
    try
    {
        //var parent = e.target.parentNode;
        //if (parent && parent.notify) {
        //  parent.notify(new org.xml3d.Notification(this, MutationEvent.REMOVAL, null, null, e.target));

        var removedNode = e.target;

        if (removedNode.notificationRequired())
        {
            removedNode.notify(new org.xml3d.Notification(this, MutationEvent.REMOVAL, "node", e.target, ""));
        }

        /*for(var i = 0; i < removedNode.adapters.length; i++)
        {
            var adapter = removedNode.adapters[i];
            if(adapter.dispose)
            {
                adapter.dispose();
            }
        }*/
    }
    catch (e)
    {
        org.xml3d.debug.logError("Exception in onRemove:");
        org.xml3d.debug.logException(e);
    }
};

org.xml3d.XML3DDocument.prototype.onunload = function(xml3dElement) {
};

org.xml3d.XML3DDocument.prototype.getNode = function(element) {
    if (element._configured !== undefined)
        return element;

    var ctx = {
            assert : org.xml3d.debug.assert,
            log : org.xml3d.debug.logInfo,
            factory : this.factory,
            doc : this
        };
    return this.factory.create(element, ctx);
};

org.xml3d.XML3DDocument.prototype.resolve = function(uriStr) {
        return org.xml3d.URIResolver.resolve(this, uriStr);
};

org.xml3d.XML3DDocument.prototype.nativeGetElementById = document.getElementById;

org.xml3d.XML3DDocument.prototype.getElementById = function(id) {
    return document.getElementById(id);
};