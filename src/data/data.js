XML3D.data = XML3D.data || {};


(function() {

/**
 * Constructor of XML3D.data.DataAdapter
 * The DataAdapter implements the DataCollector concept and serves as basis of all DataAdapter classes.
 * In general, a DataAdapter is associated with an element node which uses generic data and should be
 * instantiated via XML3D.data.XML3DDataAdapterFactory to ensure proper functionality.
 *
 * @extends XML3D.data.Adapter
 * @constructor
 *
 * @param factory
 * @param node
 */
XML3D.data.DataAdapter = function(factory, node)
{
	XML3D.data.Adapter.call(this, factory, node);

	this.cachedOutputs = null;
	this.nameMap = {};

	/* Creates DataAdapter instances for the node's children and registers
	 * itself as observer in those children instances. This approach is needed
	 * for being notified about changes in the child elements. If the data of
	 * a children is changed, the whole parent element must be considered as
	 * changed.
	 */

	this.buildMap = function() {
	    var map = this.node.map;
        if(map) {
            var entries = map.split(/\s+/);
            for(var i = 0; i< entries.length; i++) {
                var entry = entries[i].split(/\s*:=\s*/);
                this.nameMap[entry[1]] = entry[0];
            }
        }
	};
};
XML3D.data.DataAdapter.prototype             = new XML3D.data.Adapter();
XML3D.data.DataAdapter.prototype.constructor = XML3D.data.DataAdapter;

/**
 *
 * @param aType
 * @returns
 */
XML3D.data.DataAdapter.prototype.isAdapterFor = function(aType)
{
	return aType == XML3D.data.XML3DDataAdapterFactory.prototype;
};

XML3D.data.DataAdapter.prototype.init = function()
{
    var xflow = this.resolveScript();
    if(xflow)
        this.scriptInstance = new XML3D.data.ScriptInstance(this, xflow);

    this.buildMap();
};

/**
 * The notifyChanged() method is called by the XML3D data structure to notify the DataAdapter about
 * data changes (DOM mustation events) in its associating node. When this method is called, all observers
 * of the DataAdapter are notified about data changes via their notifyDataChanged() method.
 *
 * @param e  notification of type XML3D.Notification
 */
XML3D.data.DataAdapter.prototype.notifyChanged = function(e)
{
    XML3D.debug.logWarning("not handled change in data adapter: " + e);
};

XML3D.data.DataAdapter.prototype.getInputs = function() {
    if (this.cachedInputs)
        return this.cachedInputs;

    var result = {};
    this.forEachChildAdapter(function(adapter) {
        var other = adapter.getOutputs();
        for (var output in other) {
            var inTable = result[output];
            var newEntry = other[output];

            if(inTable) {
                if (inTable instanceof XML3D.data.Sequence) {
                    // There is already a sequence, merging will be done
                    // in Sequence
                    inTable.push(newEntry);
                } else {
                    if (inTable.key != newEntry.key) {
                        // Two different keys: create a sequence
                        result[output] = new XML3D.data.Sequence(inTable, newEntry);
                    }
                    else {
                        // Two different keys: overwrite
                        result[output] = newEntry;
                    }
                };
            } else
                result[output] = other[output];
        };
    });
    this.cachedInputs = result;
    return result;
};

XML3D.data.DataAdapter.prototype.getOutputs = function() {
    var result = {};

    // All inputs get propagated as outputs, but
    var inputs = this.getInputs();
    for(var input in inputs) {
        result[input] = inputs[input];
    }

    // if they get overridden by a script output
    var xflow = this.resolveScript();
    if(xflow && xflow.outputs) {
        var outputs = xflow.outputs;
        for ( var i = 0; i < outputs.length; i++) {
            result[outputs[i].name] = { script: this.scriptInstance, scriptOutputName: outputs[i].name };
        }
    }

    // At the end we apply renaming
    for(var output in result) {
        var newName = this.nameMap[output];
        if(newName) {
            result[newName] = result[output];
            delete result[output];
        }
    }
    return result;
};

XML3D.data.DataAdapter.prototype.resolveScript = function() {
    if (this.xflow)
        return this.xflow;

    var script = this.node.script;

    if(!script)
        return null;

    var pos = script.indexOf("urn:xml3d:xflow:");
    var urnfrag = "";

    if (pos === 0) {
        urnfrag = script.substring(16, script.length);
        XML3D.debug.logWarning("URN: " + script);
    } else {
        var sn = XML3D.URIResolver.resolve(script, this.node.ownerDocument);
        if(!sn)
            return null;
        pos = sn.textContent.indexOf("urn:xml3d:xflow:");
        if (pos=== 0)
            urnfrag =  sn.textContent.substring(16, sn.textContent.length);
    }

    this.xflow = XML3D.xflow.getScript(urnfrag);
    if(this.xflow === undefined) {
        XML3D.debug.logWarning("No xflow script registered with name: " + urnfrag);
        return null;
    }
    return this.xflow;
};

/**
 * @param handler
 * @param nameArray
 * @param table {XML3D.data.ProcessTable}
 * @param callback
 * @returns
 */
XML3D.data.DataAdapter.prototype.requestInputData = function(handler, nameArray, table, callback) {
    table = table || new XML3D.data.ProcessTable(handler, nameArray, callback);
    this.forEachChildAdapter(function(adapter) {
        adapter.requestOutputData(handler, nameArray, table, null);
    });
    if (callback)
        callback.call(handler, table.providers);
    return table;
};

/**
 * @param handler
 * @param nameArray
 * @param table {XML3D.data.ProcessTable}
 * @param callback
 * @returns
 */
XML3D.data.DataAdapter.prototype.requestOutputData = function(handler, nameArray, table, callback) {
    table = table || new XML3D.data.ProcessTable(handler, nameArray, callback);
    this.populateProcessTable(table);
    //console.log(table);
    table.register();

    if (callback)
        callback.call(handler, table.providers);
    else
    	return table.providers;
};

/**
 * Calls parameter func for each child element. This includes the child
 * elements of a referenced data element, if src is defined
 * @param func The function to call
 */
XML3D.data.DataAdapter.prototype.forEachChildAdapter = function(func) {
    var node = this.node;
    if (node.src) {
        var srcElement = XML3D.URIResolver.resolve(node.src,node.ownerDocument);
        if (srcElement) {
            var da = this.factory.getAdapter(srcElement, XML3D.data.XML3DDataAdapterFactory.prototype);
            if (da)
                func(da);
        }
    } else {
        for (var child = this.node.firstElementChild; child !== null; child = child.nextElementSibling) {
            var ca = this.factory.getAdapter(child, XML3D.data.XML3DDataAdapterFactory.prototype);
            if(ca)
                func(ca);
        }
    }
};


XML3D.data.DataAdapter.prototype.populateProcessTable = function(table) {
    var src = this.node.src, resolved;

    var outputs = this.getOutputs();
    var fields = table.fieldNames;
    for(var i = 0; i < fields.length; i++){
        var field = fields[i];
        var provider = outputs[field];
        if(provider) {
            if(provider.script) {
                var scriptProvider = new XML3D.data.ScriptOutput(provider.script, provider.scriptOutputName);
                table.providers[field] = scriptProvider;
            } else {
                table.providers[field] = provider;
            }
        } else {
            // No error here: requested field might be optional. Consumer
            // has to decide.
            //XML3D.debug.logDebug("Did not find requested input: " + field)
        }
    }

};

/**
 * Returns String representation of this DataAdapter
 */
XML3D.data.DataAdapter.prototype.toString = function()
{
	return "XML3D.data.DataAdapter";
};

}());
