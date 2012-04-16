XML3D.data = XML3D.data || {};


/********************************** Start of the DataCollector Implementation *************************************************/

/*-----------------------------------------------------------------------
 * XML3D Data Composition Rules:
 * -----------------------------
 *
 * The elements <mesh>, <data>, <shader>, <lightshader> and any other elements that uses generic
 * data fields implements the behavior of a "DataCollector".
 *
 * The result of a DataCollector is a "datatable" - a map with "name" as key and a TypedArray
 * (https://cvs.khronos.org/svn/repos/registry/trunk/public/webgl/doc/spec/TypedArray-spec.html)
 * as value.
 *
 * The <data> element is the only DataCollector that forwards the data to parent nodes or referring nodes.
 *
 * For each DataCollector, data is collected with following algorithm:
 *
 * 1. If the "src" attribute is used, reuse the datatable of the referred <data> element and ignore the element's content
 * 2. If no "src" attribute is defined:
 *    2.1 Go through each <data> element contained by the DataCollector from top to down and apply it's datatable to the result.
 *        2.1.1 If the datatables of consecutive <data> elements define a value for the same name, the later overwrites the former.
 *    2.2 Go through each value element (int, float1, float2 etc.) and assign it's name-value pair to the datatable, overwriting
 *        existing entries.
 *
 *
 * Description of the actual Implementation:
 * -----------------------------------------
 * The DataCollector is implementation according to the Adapter concept. For each element that uses
 * generic data (<mesh>, <data>, <float>,...) a DataAdapter is instantiated. Such a DataAdapter should
 * be constructed via the "XML3DDataAdapterFactory" factory. The XML3DDataAdapterFactory manages all
 * DataAdapter instances so that for each node there is always just one DataAdapter. It is also responsible
 * for creating the corresponding DataAdapter for an element node. In addition, when a DataAdapter is constructed
 * via the factory, its init method is called which ensures that all child elements have a corresponding DataAdapter.
 * In doing so, the parent DataAdapter registers itself as observer in its child DataAdapters. When a DataCollector
 * element changes, all its observers are notified (those are generally its parent DataAdapter or other components
 * such as a renderer relying on the data of the observed element).
 */

//---------------------------------------------------------------------------------------------------------------------------

var ProviderEntry = function() {
    this.consumers = new Array();

    this.registerConsumer = function(consumer) {
        var length = this.consumers.length;
        for(var i = 0; i < length; i++)
        {
            if(this.consumers[i] == consumer)
            {
                XML3D.debug.logWarning("Consumer " + consumer + " is already registered");
                return;
            }
        }
        this.consumers.push(consumer);
    };

    this.notifyDataChanged = function(e) {
        var length = this.consumers.length;
        for(var i = 0; i < length; i++)
        {
            this.consumers[i].notifyDataChanged(this);
        }
    };

    this.getValue = function() {
        XML3D.debug.logError("ProviderEntry::getValue needs to be overwritten");
    };
};

var ProcessTable = function(handler, names, callback) {
    this.handler = handler;
    this.fieldNames = names;
    this.callback = callback;
    /**
     * Contains named ProviderEntries
     */
    this.providers = {};

    this.register = function() {
        for(a in this.providers) {
            this.providers[a].registerConsumer(this);
        }
    };

    this.notifyDataChanged = function(provider) {
        if (this.callback)
            this.callback.call(this.handler, this.providers, provider);
    };

    this.toString = function() {
        var result = "ProcessTable(";
        result += this.fieldNames.join(" ");
        result += ")";
        return result;
    };
};

var Sequence = function(entry1, entry2) {
    ProviderEntry.call(this);
    this.data = [];

    this.push = function(entry) {
        var key = entry.key;
        if(key === undefined)
            throw "No key in entry for sequence";
        var length = this.data.length;
        for(var i = 0; i<length; i++) {
            if (this.data[i].key == key) {
                this.data.splice(i, 1, entry);
                return;
            }
        }
        this.data.push(entry);
        this.data.sort(function(a, b) {
            return a.key - b.key;
        });
    };

    this.interpolate = function(t, interp) {
        if (t <= this.data[0].key)
            return this.data[0].value;
        if (t >= this.data[this.data.length - 1])
            return this.data[this.data.length - 1].value;
        for ( var i = 0; i < this.data.length - 1; ++i)
            if (this.data[i].key < t && t <= this.data[i + 1].key) {
                return interp(this.data[i].value, this.data[i + 1].value,
                        (t - this.data[i].key) / (this.data[i + 1].key - this.data[i].key));
            }
    };

    this.getValue = function() {
        return this;
    };

    this.push(entry1);
    this.push(entry2);
};
XML3D.createClass(Sequence, ProviderEntry);

/**
 * Class ScriptOutput is a single, named output of a script.
 * It's the entry in the provider map of a
 * ProcessTable
 * @implements ProviderEntry
 *
 */
var ScriptOutput = function(script, name) {
    ProviderEntry.call(this);
    this.script = script;
    this.name = name;
    this.data = {}; // Attached user data
    this.script.registerConsumer(this);

    this.getValue = function() {
        return this.script.getValue(this.name);
    };

    this.getTupleSize = function() {
        return this.script.getTupleSize(this.name);
    };

    this.toString = function() {
            return this.name + ": " + this.script.toString();
    };
};

XML3D.createClass(ScriptOutput, ProviderEntry);


//---------------------------------------------------------------------------------------------------------------------------

/**
 * Class XML3D.data.DataAdapter
 * extends: XML3D.data.Adapter
 *
 * The DataAdapter implements the DataCollector concept and serves as basis of all DataAdapter classes.
 * In general, a DataAdapter is associated with an element node which uses generic data and should be
 * instantiated via XML3D.data.XML3DDataAdapterFactory to ensure proper functionality.
 *
 * @author Kristian Sons
 * @author Benjamin Friedrich
 *
 * @version  10/2010  1.0
 */

/**
 * Constructor of XML3D.data.DataAdapter
 *
 * @augments XML3D.data.Adapter
 * @constructor
 *
 * @param factory
 * @param node
 */
XML3D.data.DataAdapter = function(factory, node)
{
	XML3D.data.Adapter.call(this, factory, node);

	this.observers = new Array();
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



	this.init = function()
	{
		var xflow = this.resolveScript();
		if(xflow)
		    this.scriptInstance = new XML3D.data.ScriptInstance(this, xflow);

		this.buildMap();
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


/**
 * The notifyChanged() method is called by the XML3D data structure to notify the DataAdapter about
 * data changes (DOM mustation events) in its associating node. When this method is called, all observers
 * of the DataAdapter are notified about data changes via their notifyDataChanged() method.
 *
 * @param e  notification of type XML3D.Notification
 */
XML3D.data.DataAdapter.prototype.notifyChanged = function(e)
{
	// this is the DataAdapter where an actual change occurs, therefore
	// the dataTable must be recreated
	this.notifyDataChanged(e);
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
                if (inTable instanceof Sequence) {
                    // There is already a sequence, merging will be done
                    // in Sequence
                    inTable.push(newEntry);
                } else {
                    if (inTable.key != newEntry.key) {
                        // Two different keys: create a sequence
                        result[output] = new Sequence(inTable, newEntry);
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
    for(input in inputs) {
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
    for(output in result) {
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

XML3D.data.DataAdapter.prototype.requestInputData = function(handler, nameArray, table, callback) {
    table = table || new ProcessTable(handler, nameArray, callback);
    this.forEachChildAdapter(function(adapter) {
        adapter.requestOutputData(handler, nameArray, table, null);
    });
    if (callback)
        callback.call(handler, table.providers);
    return table;
};

XML3D.data.DataAdapter.prototype.requestOutputData = function(handler, nameArray, table, callback) {
    table = table || new ProcessTable(handler, nameArray, callback);
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
            da = this.factory.getAdapter(srcElement, XML3D.data.XML3DDataAdapterFactory.prototype);
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
                var scriptProvider = new ScriptOutput(provider.script, provider.scriptOutputName);
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

