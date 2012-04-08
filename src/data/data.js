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

    this.__defineGetter__("value", function() {
        console.error("Using deprecated getter");
        return this.script.getValue(this.name);
    });

    this.__defineGetter__("tupleSize", function() {
        return this.script.getTupleSize(this.name);
    });
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
	    var node = this.node;
		var child = node.firstElementChild;
		while (child !== null)
		{
			var dataCollector = this.factory.getAdapter(child, XML3D.data.XML3DDataAdapterFactory.prototype);

			if(dataCollector)
			{
				dataCollector.registerConsumer(this);
			}

			child = child.nextElementSibling;
		}

		if (node.src) {
			var srcElement = XML3D.URIResolver.resolve(node.src,node.ownerDocument);
			if (srcElement) {
				dataCollector = this.factory.getAdapter(srcElement, XML3D.data.XML3DDataAdapterFactory.prototype);
				if (dataCollector)
					dataCollector.registerConsumer(this);
			}
		}

		var xflow = this.resolveScript();
		if(xflow)
		    this.scriptInstance = new XML3D.data.ScriptInstance(this, xflow);

		this.buildMap();
		this.createDataTable(true);

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
 * Notifies all observers about data changes by calling their notifyDataChanged() method.
 */
XML3D.data.DataAdapter.prototype.notifyObservers = function(e)
{
	for(var i = 0; i < this.observers.length; i++)
	{
		this.observers[i].notifyDataChanged(e);
	}
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

/**
 * Is called when the observed DataAdapter has changed. This basic implementation
 * recreates its data table and notifies all its observers about changes. The recreation
 * of the data table is necessary as the notification usually comes from a child DataAdapter.
 * This means when a child element changes, its parent changes simultaneously.
 */
XML3D.data.DataAdapter.prototype.notifyDataChanged = function(e)
{
	// Notification can only come from a child DataAdapter. That's why dataTable
	// can be merged with this instance's datatable
	this.createDataTable(true);
	this.notifyObservers(e);
};

/**
 * Registers an observer which is notified when the element node associated with the
 * data adapter changes. If the given object is already registered as observer, it
 * is ignored.
 *
 * <b>Note that there must be a notifyDataChanged() method without parameters.</b>
 *
 * @param observer
 * 			object which shall be notified when the node associated with the
 * 			DataAdapter changes
 */
XML3D.data.DataAdapter.prototype.registerConsumer = function(observer)
{
	for(var i = 0; i < this.observers.length; i++)
	{
		if(this.observers[i] == observer)
		{
			XML3D.debug.logWarning("Observer " + observer + " is already registered");
			return;
		}
	}

	this.observers.push(observer);
};

/**
 * Unregisters the given observer. If the given object is not registered as observer, it is irgnored.
 *
 * @param observer
 * 			which shall be unregistered
 */
XML3D.data.DataAdapter.prototype.unregisterConsumer = function(observer)
{
	for(var i = 0; i < this.observers.length; i++)
	{
		if(this.observers[i] == observer)
		{
			this.observers = this.observers.splice(i, 1);
			return;
		}
	}

	XML3D.debug.logWarning("Observer " + observer +
			                   " can not be unregistered because it is not registered");
};

/**
 * Returns datatable retrieved from the DataAdapter's children.
 * In doing so, only the cached datatables are fetched since
 * the value of the changed child should already be adapted
 * and the values of the remaining children do not vary.
 *
 * @returns datatable retrieved from the DataAdapter's children
 */
XML3D.data.DataAdapter.prototype.getDataFromChildren = function()
{
	var dataTable = {};

	var child = this.node.firstElementChild;
	while (child !== null) {
        // var childNode = this.node.childNodes[i];

        var dataCollector = this.factory.getAdapter(child, XML3D.data.XML3DDataAdapterFactory.prototype);

        if (dataCollector) {// Can be null for a foreign node

            /*
             * A SinkAdapter must not be a chilrden of another DataAdapter.
             * Therefore, its data is ignored, if it is specified as child.
             * Example: <mesh>, <shader> and <lightshader>
             */
            if (dataCollector.isSinkAdapter()) {
                XML3D.debug.logWarning(child.localName + " can not be a children of another DataCollector element ==> ignored");
            } else {
                var tmpDataTable = dataCollector.createDataTable();
                if (tmpDataTable) {
                    for (key in tmpDataTable) {
                        if (dataTable[key]) { // We have to merge
                            var targetSeq = dataTable[key].sequence;
                            tmpDataTable[key].sequence.forEach(function(entry, index) {
                                var found = false;
                                for ( var i = 0; i < targetSeq.length; i++) {
                                    if (targetSeq[i].key == entry.key) { // Existing key: replace it
                                        targetSeq[i].value = entry.value;
                                        found = true;
                                        break;
                                    }
                                }
                                if (!found) { // New key: add it
                                    targetSeq.push(entry);
                                    // TODO: Need to re-sort by key
                                }
                            });
                        } else
                            dataTable[key] = tmpDataTable[key];
                    }
                }
            }
        }
        child = child.nextElementSibling;
    }

    return dataTable;
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

XML3D.data.DataAdapter.prototype.requestOutputData = function(handler, nameArray, table, callback) {
    table = table || new ProcessTable(handler, nameArray, callback);
    this.populateProcessTable(table);
    //console.log(table);
    table.register();

    if (callback)
        callback.call(handler, table.providers);
};

XML3D.data.DataAdapter.prototype.forEachChildAdapter = function(f) {
    var node = this.node;
    if (node.src) {
        var srcElement = XML3D.URIResolver.resolve(node.src,node.ownerDocument);
        if (srcElement) {
            da = this.factory.getAdapter(srcElement, XML3D.data.XML3DDataAdapterFactory.prototype);
            if (da)
                f(da);
        }
    } else {
        for (var child = this.node.firstElementChild; child !== null; child = child.nextElementSibling) {
            var ca = this.factory.getAdapter(child, XML3D.data.XML3DDataAdapterFactory.prototype);
            if(ca)
                f(ca);
        }
    }
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
 * Creates datatable. If the parameter 'forceNewInstance' is specified with 'true',
 * createDataTable() creates a new datatable, caches and returns it. If no
 * parameter is specified or 'forceNewInstance' is specified with 'false', the
 * cashed datatable is returned.<br/>
 * Each datatable has the following format:<br/>
 * <br/>
 * datatable['name']['tupleSize'] : tuple size of the data element with name 'name' <br/>
 * datatable['name']['data']      : typed array (https://cvs.khronos.org/svn/repos/registry/trunk/public/webgl/doc/spec/TypedArray-spec.html)
 * 								  associated with the data element with name 'name'
 *
 * @param   forceNewInstance
 * 				indicates whether a new instance shall be created or the cached
 * 				datatable shall be returned
 * @returns datatable
 */
XML3D.data.DataAdapter.prototype.createDataTable = function(forceNewInstance)
{
	if(forceNewInstance == undefined ? true : ! forceNewInstance)
	{
	   return this.dataTable;
	}

	var src = this.node.src;
	var dataTable;

	if(src == "")
	{
		dataTable = this.getDataFromChildren();
	}
	else
	{
		// If the "src" attribute is used, reuse the datatable of the referred <data> element (or file)
		// and ignore the element's content
		var rsrc = XML3D.URIResolver.resolve(src, this.node.ownerDocument);
		rsrc = this.factory.getAdapter(rsrc, XML3D.data.XML3DDataAdapterFactory.prototype);
		if (!rsrc) {
			XML3D.debug.logError("Could not find mesh data with src '"+src+"'");
			this.dataTable = {};
			return;
		}
		dataTable  = rsrc.createDataTable();
	}

	//Check for xflow scripts
	/*if (this.node.localName == "data") {
		var script = this.node.script;
		if(script != "") {
			var type = script.value.toLowerCase();
			if (XML3D.xflow[type]) {
				XML3D.xflow[type](dataTable);
			}
			else
				XML3D.debug.logError("Unknown XFlow script '"+script.value+"'.");

		}
	}*/

	this.dataTable = dataTable;

	return dataTable;
};


/**
 * Indicates whether this DataAdapter is a SinkAdapter (has no parent DataAdapter).
 *
 * @returns true if this DataAdapter is a SinkAdapter, otherwise false.
 */
XML3D.data.DataAdapter.prototype.isSinkAdapter = function()
{
	return false;
};

/**
 * Returns String representation of this DataAdapter
 */
XML3D.data.DataAdapter.prototype.toString = function()
{
	return "XML3D.data.DataAdapter";
};

//---------------------------------------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------------------------------

/***********************************************************************/
