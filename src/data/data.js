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

	/* Creates DataAdapter instances for the node's children and registers
	 * itself as observer in those children instances. This approach is needed
	 * for being notified about changes in the child elements. If the data of
	 * a children is changed, the whole parent element must be considered as
	 * changed.
	 */
	this.init = function()
	{
	    var node = this.node;
		var child = node.firstElementChild;
		while (child !== null)
		{
			var dataCollector = this.factory.getAdapter(child, XML3D.data.XML3DDataAdapterFactory.prototype);

			if(dataCollector)
			{
				dataCollector.registerObserver(this);
			}

			child = child.nextElementSibling;
		}

		if (node.src) {
			var srcElement = XML3D.URIResolver.resolve(node.src,node.ownerDocument);
			if (srcElement) {
				dataCollector = this.factory.getAdapter(srcElement, XML3D.data.XML3DDataAdapterFactory.prototype);
				if (dataCollector)
					dataCollector.registerObserver(this);
			}
		}

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
XML3D.data.DataAdapter.prototype.registerObserver = function(observer)
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
XML3D.data.DataAdapter.prototype.unregisterObserver = function(observer)
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

/**
 * Class XML3D.data.ValueDataAdapter
 * extends: XML3D.data.DataAdapter
 *
 * ValueDataAdapter represents a leaf in the DataAdapter hierarchy. A
 * ValueDataAdapter is associated with the XML3D data elements having
 * no children besides a text node such as <bool>, <float>, <float2>,... .
 *
 * @author  Benjamin Friedrich
 * @version 10/2010  1.0
 */

/**
 * Constructor of XML3D.data.ValueDataAdapter
 *
 * @augments XML3D.data.DataAdapter
 * @constructor
 *
 * @param factory
 * @param node
 */
XML3D.data.ValueDataAdapter = function(factory, node)
{
	XML3D.data.DataAdapter.call(this, factory, node);
	this.init = function()
	{
		this.createDataTable(true);
	};
};
XML3D.data.ValueDataAdapter.prototype             = new XML3D.data.DataAdapter();
XML3D.data.ValueDataAdapter.prototype.constructor = XML3D.data.ValueDataAdapter;

/**
 * Returns the tuple size of the associated XML3D data element.
 *
 * @returns the tuples size of the associated node or -1 if the tuple size
 * 			of the associated node can not be determined
 */
XML3D.data.ValueDataAdapter.prototype.getTupleSize = function()
{
    switch(this.node.localName) {
        case "float":
        case "int":
        case "bool":
            return 1;
        case "float2":
            return 2;
        case "float3":
            return 3;
        case "float4":
        case "int4":
            return 4;
        case "float4x4":
            return 16;
    }

	XML3D.debug.logWarning("Can not determine tuple size of element " + this.node.localName);
	return -1;
};

/**
 * Extracts the texture data of a node. For example:
 *
 * <code>
 *	<texture name="...">
 * 		<img src="textureData.jpg"/>
 * 	</texture
 * </code>
 *
 * In this case, "textureData.jpg" is returned as texture data.
 *
 * @param   node  XML3D texture node
 * @returns texture data or null, if the given node is not a XML3D texture element
 */
XML3D.data.ValueDataAdapter.prototype.extractTextureData = function(node)
{
	if(node.localName != "texture")
	{
		return null;
	}

	var textureChild = node.firstElementChild;
	if(!textureChild || textureChild.localName != "img")
	{
		XML3D.debug.logWarning("child of texture element is not an img element");
		return null;
	}

	return textureChild.src;
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
 * 								    associated with the data element with name 'name'
 *
 * @param   forceNewInstance
 * 				indicates whether a new instance shall be created or the cached
 * 				datatable shall be returned
 * @returns datatable
 */
XML3D.data.ValueDataAdapter.prototype.createDataTable = function(forceNewInstance)
{
	if(forceNewInstance == undefined ? true : ! forceNewInstance)
	{
	   return this.dataTable;
	}

	var entry = {};
	entry.name = this.node.name;
	entry.value = this.node.value;
	entry.sequence = [];
	entry.sequence.push({key: +this.node.seqnr, value: this.node.value});
	entry.tupleSize = this.getTupleSize();

	this.dataTable  = {};
	this.dataTable[entry.name] = entry;
	return this.dataTable;
};

/**
 * Returns String representation of this DataAdapter
 */
XML3D.data.ValueDataAdapter.prototype.toString = function()
{
	return "XML3D.data.ValueDataAdapter";
};

//---------------------------------------------------------------------------------------------------------------------------

/**
 * Class    XML3D.data.SinkDataAdapter
 * extends: XML3D.data.DataAdapter
 *
 * SinkDataAdapter represents the sink in the data hierarchy (no parents).
 *
 * @author  Benjamin Friedrich
 * @version 10/2010  1.0
 */

/**
 * Constructor of XML3D.data.SinkDataAdapter
 *
 * @augments XML3D.data.DataAdapter
 * @constructor
 *
 * @param factory
 * @param node
 *
 */
XML3D.data.SinkDataAdapter = function(factory, node)
{
	XML3D.data.DataAdapter.call(this, factory, node);
};
XML3D.data.SinkDataAdapter.prototype             = new XML3D.data.DataAdapter();
XML3D.data.SinkDataAdapter.prototype.constructor = XML3D.data.SinkDataAdapter;

/**
 * Indicates whether this DataAdapter is a SinkAdapter (has no parent DataAdapter).
 *
 * @returns true if this DataAdapter is a SinkAdapter, otherwise false.
 */
XML3D.data.SinkDataAdapter.prototype.isSinkAdapter = function()
{
	return true;
};

/**
 * Returns String representation of this DataAdapter
 */
XML3D.data.SinkDataAdapter.prototype.toString = function()
{
	return "XML3D.data.SinkDataAdapter";
};


XML3D.data.ImgDataAdapter = function(factory, node)
{
	XML3D.data.DataAdapter.call(this, factory, node);
};
XML3D.data.ImgDataAdapter.prototype             = new XML3D.data.DataAdapter();
XML3D.data.ImgDataAdapter.prototype.constructor = XML3D.data.ImgDataAdapter;

XML3D.data.ImgDataAdapter.prototype.createDataTable = function(forceNewInstance)
{};

XML3D.data.TextureDataAdapter = function(factory, node)
{
	XML3D.data.DataAdapter.call(this, factory, node);
};
XML3D.data.TextureDataAdapter.prototype             = new XML3D.data.DataAdapter();
XML3D.data.TextureDataAdapter.prototype.constructor = XML3D.data.TextureDataAdapter;

XML3D.data.TextureDataAdapter.prototype.createDataTable = function(forceNewInstance)
{
	if(forceNewInstance == undefined ? true : ! forceNewInstance)
	{
	   return this.dataTable;
	}
	var gl = this.factory.handler.gl;
	var clampToGL = function(gl, modeStr) {
		if (modeStr == "clamp")
			return gl.CLAMP_TO_EDGE;
		if (modeStr == "repeat")
			return gl.REPEAT;
		return gl.CLAMP_TO_EDGE;
	};

	var filterToGL = function(gl, modeStr) {
		if (modeStr == "nearest")
			return gl.NEAREST;
		if (modeStr == "linear")
			return gl.LINEAR;
		if (modeStr == "mipmap_linear")
			return gl.LINEAR_MIPMAP_NEAREST;
		if (modeStr == "mipmap_nearest")
			return gl.NEAREST_MIPMAP_NEAREST;
		return gl.LINEAR;
	};

	var node = this.node;
	var imgSrc = new Array();

	// TODO: Sampler options
	var options = ({
		/*Custom texture options would go here, SGL's default options are:

		minFilter        : gl.LINEAR,
		magFilter        : gl.LINEAR,
		wrapS            : gl.CLAMP_TO_EDGE,
		wrapT            : gl.CLAMP_TO_EDGE,
		isDepth          : false,
		depthMode        : gl.LUMINANCE,
		depthCompareMode : gl.COMPARE_R_TO_TEXTURE,
		depthCompareFunc : gl.LEQUAL,
		generateMipmap   : false,
		flipY            : true,
		premultiplyAlpha : false,
		onload           : null
		 */
		wrapS            : clampToGL(gl, node.wrapS),
		wrapT            : clampToGL(gl, node.wrapT),
		generateMipmap   : false

	});

	// TODO: automatically set generateMipmap to true when mipmap dependent filters are used
	options.minFilter = filterToGL(gl, node.getAttribute("minFilter"));
	options.magFilter = filterToGL(gl, node.getAttribute("magFilter"));
	if (node.getAttribute("mipmap") == "true")
		options.generateMipmap = true;

	if (node.hasAttribute("textype") && node.getAttribute("textype") == "cube") {
		for (var i=0; i<node.childNodes.length; i++) {
			var child = node.childNodes[i];
			if (child.localName != "img")
				continue;
			imgSrc.push(child.src);
		}

		if (imgSrc.length != 6) {
			XML3D.debug.logError("A cube map requires 6 textures, but only "+imgSrc.length+" were found!");
			return null;
		}
		options["flipY"] = false;

	} else {
		var textureChild = node.firstElementChild;
		if(!textureChild || textureChild.localName != "img")
		{
			XML3D.debug.logWarning("child of texture element is not an img element");
			return null; // TODO: Should always return a result
		}
		imgSrc.push(textureChild.src);
	}

	// TODO: Is this correct, do we use it as Array?
	var result 			 = new Array(1);
	//var value = new SglTexture2D(gl, textureSrc, options);
	var name    		 = this.node.name;
	var content          = new Array();
	content['tupleSize'] = 1;

	content['options'] = options;
	content['src'] = imgSrc;
	content['isTexture'] = true;
	content['node'] = this.node;

	result[name]    = content;
	this.dataTable  = result;
	return result;
};

/**
 * Returns String representation of this TextureDataAdapter
 */
XML3D.data.TextureDataAdapter.prototype.toString = function()
{
	return "XML3D.data.TextureDataAdapter";
};
/***********************************************************************/
