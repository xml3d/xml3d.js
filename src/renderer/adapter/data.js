

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

/**
 * Class xml3d.webgl.XML3DDataAdapterFactory
 * extends: xml3d.data.AdapterFactory
 *
 * XML3DDataAdapterFactory creates DataAdapter instances for elements using generic data (<mesh>, <data>, <float>,...).
 * Additionally, it manages all DataAdapter instances so that for each node there is always just one DataAdapter. When
 * it creates a DataAdapter, it calls its init method. Currently, the following elements are supported:
 *
 * <ul>
 * 		<li>mesh</li>
 * 		<li>shader</li>
 * 		<li>lightshader</li>
 * 		<li>float</li>
 * 		<li>float2</li>
 * 		<li>float3</li>
 * 		<li>float4</li>
 * 		<li>int</li>
 * 		<li>bool</li>
 * 		<li>texture</li>
 * 		<li>data</li>
 * </ul>
 *
 * @author Kristian Sons
 * @author Benjamin Friedrich
 *
 * @version  10/2010  1.0
 */

/**
 * Constructor of xml3d.webgl.XML3DDataAdapterFactory
 *
 * @augments xml3d.data.AdapterFactory
 * @constructor
 *
 * @param handler
 */
xml3d.webgl.XML3DDataAdapterFactory = function(handler)
{
	xml3d.data.AdapterFactory.call(this);
	this.handler = handler;
};
xml3d.webgl.XML3DDataAdapterFactory.prototype             = new xml3d.data.AdapterFactory();
xml3d.webgl.XML3DDataAdapterFactory.prototype.constructor = xml3d.webgl.XML3DDataAdapterFactory;

/**
 * Returns a DataAdapter instance associated with the given node. If there is already a DataAdapter created for this node,
 * this instance is returned, otherwise a new one is created.
 *
 * @param   node  element node which uses generic data. The supported elements are listed in the class description above.
 * @returns DataAdapter instance
 */
xml3d.webgl.XML3DDataAdapterFactory.prototype.getAdapter = function(node)
{
	return xml3d.data.AdapterFactory.prototype.getAdapter.call(this, node, xml3d.webgl.XML3DDataAdapterFactory.prototype);
};

/**
 * Creates a DataAdapter associated with the given node.
 *
 * @param   node  element node which uses generic data. The supported elements are listed in the class description above.
 * @returns DataAdapter instance
 */
xml3d.webgl.XML3DDataAdapterFactory.prototype.createAdapter = function(node)
{
	if (node.localName == "mesh"   ||
		node.localName == "shader" ||
		node.localName == "lightshader" )
	{
		return new xml3d.webgl.RootDataAdapter(this, node);
	}

	if (node.localName == "float"    ||
		node.localName == "float2"   ||
		node.localName == "float3"   ||
		node.localName == "float4"   ||
		node.localName == "float4x4" ||
		node.localName == "int"      ||
		node.localName == "bool"     )
	{
		return new xml3d.webgl.ValueDataAdapter(this, node);
	}
	
	if (node.localName == "img")
		return new xml3d.webgl.ImgDataAdapter(this, node);

	if (node.localName == "texture")
	{
		return new xml3d.webgl.TextureDataAdapter(this, node);
	}
			
	if (node.localName == "data")
	{
		return new xml3d.webgl.DataAdapter(this, node);
	}

	//xml3d.debug.logError("xml3d.webgl.XML3DDataAdapterFactory.prototype.createAdapter: " +
	//		                 node.localName + " is not supported");
	return null;
};

//---------------------------------------------------------------------------------------------------------------------------

/**
 * Class xml3d.webgl.DataAdapter
 * extends: xml3d.data.Adapter
 *
 * The DataAdapter implements the DataCollector concept and serves as basis of all DataAdapter classes.
 * In general, a DataAdapter is associated with an element node which uses generic data and should be
 * instantiated via xml3d.webgl.XML3DDataAdapterFactory to ensure proper functionality.
 *
 * @author Kristian Sons
 * @author Benjamin Friedrich
 *
 * @version  10/2010  1.0
 */

/**
 * Constructor of xml3d.webgl.DataAdapter
 *
 * @augments xml3d.data.Adapter
 * @constructor
 *
 * @param factory
 * @param node
 */
xml3d.webgl.DataAdapter = function(factory, node)
{
	xml3d.data.Adapter.call(this, factory, node);

	this.observers = new Array();

	/* Creates DataAdapter instances for the node's children and registers
	 * itself as observer in those children instances. This approach is needed
	 * for being notified about changes in the child elements. If the data of
	 * a children is changed, the whole parent element must be considered as
	 * changed.
	 */
	this.init = function()
	{
		var child = this.node.firstElementChild;
		while (child !== null)
		{			
			var dataCollector = this.factory.getAdapter(child, xml3d.webgl.XML3DDataAdapterFactory.prototype);

			if(dataCollector)
			{
				dataCollector.registerObserver(this);
			}
			
			child = child.nextElementSibling;
		}
		
		if (this.node.src) {
			var srcElement = xml3d.URIResolver.resolve(this.node.src);
			if (srcElement) {
				dataCollector = this.factory.getAdapter(srcElement, xml3d.webgl.XML3DDataAdapterFactory.prototype);
				if (dataCollector)
					dataCollector.registerObserver(this);
			}
		}

		this.createDataTable(true);	
		
	};

};
xml3d.webgl.DataAdapter.prototype             = new xml3d.data.Adapter();
xml3d.webgl.DataAdapter.prototype.constructor = xml3d.webgl.DataAdapter;

/**
 *
 * @param aType
 * @returns
 */
xml3d.webgl.DataAdapter.prototype.isAdapterFor = function(aType)
{
	return aType == xml3d.webgl.XML3DDataAdapterFactory.prototype;
};

/**
 * Notifies all observers about data changes by calling their notifyDataChanged() method.
 */
xml3d.webgl.DataAdapter.prototype.notifyObservers = function(e)
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
 * @param e  notification of type xml3d.Notification
 */
xml3d.webgl.DataAdapter.prototype.notifyChanged = function(e)
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
xml3d.webgl.DataAdapter.prototype.notifyDataChanged = function(e)
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
xml3d.webgl.DataAdapter.prototype.registerObserver = function(observer)
{
	for(var i = 0; i < this.observers.length; i++)
	{
		if(this.observers[i] == observer)
		{
			xml3d.debug.logWarning("Observer " + observer + " is already registered");
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
xml3d.webgl.DataAdapter.prototype.unregisterObserver = function(observer)
{
	for(var i = 0; i < this.observers.length; i++)
	{
		if(this.observers[i] == observer)
		{
			this.observers = this.observers.splice(i, 1);
			return;
		}
	}

	xml3d.debug.logWarning("Observer " + observer +
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
xml3d.webgl.DataAdapter.prototype.getDataFromChildren = function()
{
	var dataTable = new Array();

	var child = this.node.firstElementChild;
	while (child !== null)
	{
		//var childNode = this.node.childNodes[i];

		var dataCollector = this.factory.getAdapter(child, xml3d.webgl.XML3DDataAdapterFactory.prototype);
		
		if(! dataCollector) // This can happen, i.e. a child node in a seperate namespace
			continue;

		/* A RootAdapter must not be a chilrden of another DataAdapter.
		 * Therefore, its data is ignored, if it is specified as child.
		 * Example: <mesh>, <shader> and <lightshader> */
		if(dataCollector.isRootAdapter())
		{
			xml3d.debug.logWarning(child.localName +
					                   " can not be a children of another DataCollector element ==> ignored");
			continue;
		}
		var tmpDataTable = dataCollector.createDataTable();
		if(tmpDataTable)
		{
			for (key in tmpDataTable)
			{
				dataTable[key] = tmpDataTable[key];
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
xml3d.webgl.DataAdapter.prototype.createDataTable = function(forceNewInstance)
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
		var rsrc = xml3d.URIResolver.resolve(src);
		rsrc = this.factory.getAdapter(rsrc, xml3d.webgl.XML3DDataAdapterFactory.prototype);
		if (!rsrc) {
			xml3d.debug.logError("Could not find mesh data with src '"+src+"'");
			this.dataTable = {};
			return;
		}
		dataTable  = rsrc.createDataTable();
	}	
	
	//Check for xflow scripts
	if (this.node.localName == "data") {
		var script = this.node.script;
		if(script != "") {	
			var type = script.value.toLowerCase();
			if (xml3d.xflow[type]) {
				xml3d.xflow[type](dataTable);			
			}
			else
				xml3d.debug.logError("Unknown XFlow script '"+script.value+"'.");

		}
	}
	
	this.dataTable = dataTable;

	return dataTable;
};

/**
 * Indicates whether this DataAdapter is a RootAdapter (has no parent DataAdapter).
 *
 * @returns true if this DataAdapter is a RootAdapter, otherwise false.
 */
xml3d.webgl.DataAdapter.prototype.isRootAdapter = function()
{
	return false;
};

/**
 * Returns String representation of this DataAdapter
 */
xml3d.webgl.DataAdapter.prototype.toString = function()
{
	return "xml3d.webgl.DataAdapter";
};

//---------------------------------------------------------------------------------------------------------------------------

/**
 * Class xml3d.webgl.ValueDataAdapter
 * extends: xml3d.webgl.DataAdapter
 *
 * ValueDataAdapter represents a leaf in the DataAdapter hierarchy. A
 * ValueDataAdapter is associated with the XML3D data elements having
 * no children besides a text node such as <bool>, <float>, <float2>,... .
 *
 * @author  Benjamin Friedrich
 * @version 10/2010  1.0
 */

/**
 * Constructor of xml3d.webgl.ValueDataAdapter
 *
 * @augments xml3d.webgl.DataAdapter
 * @constructor
 *
 * @param factory
 * @param node
 */
xml3d.webgl.ValueDataAdapter = function(factory, node)
{
	xml3d.webgl.DataAdapter.call(this, factory, node);
	this.init = function()
	{
		this.createDataTable(true);
	};
};
xml3d.webgl.ValueDataAdapter.prototype             = new xml3d.webgl.DataAdapter();
xml3d.webgl.ValueDataAdapter.prototype.constructor = xml3d.webgl.ValueDataAdapter;

/**
 * Returns the tuple size of the associated XML3D data element.
 *
 * @returns the tuples size of the associated node or -1 if the tuple size
 * 			of the associated node can not be determined
 */
xml3d.webgl.ValueDataAdapter.prototype.getTupleSize = function()
{
	if (this.node.localName == "float" ||
		this.node.localName == "int"   ||
		this.node.localName == "bool"  )
	{
		return 1;
	}

	if (this.node.localName == "float2")
	{
		return 2;
	}

	if (this.node.localName == "float3")
	{
		return 3;
	}

	if (this.node.localName == "float4")
	{
		return 4;
	}

	if (this.node.localName == "float4x4")
	{
		return 16;
	}

	xml3d.debug.logWarning("Can not determine tuple size of element " + this.node.localName);
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
xml3d.webgl.ValueDataAdapter.prototype.extractTextureData = function(node)
{
	if(node.localName != "texture")
	{
		return null;
	}

	var textureChild = node.firstElementChild;
	if(!textureChild || textureChild.localName != "img")
	{
		xml3d.debug.logWarning("child of texture element is not an img element");
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
xml3d.webgl.ValueDataAdapter.prototype.createDataTable = function(forceNewInstance)
{
	if(forceNewInstance == undefined ? true : ! forceNewInstance)
	{
	   return this.dataTable;
	}

	var value = this.node.value;
	var name    		 = this.node.name;
	var result 			 = new Array(1);
	var content          = new Array();
	content['tupleSize'] = this.getTupleSize();

	content['data'] = value;
	result[name]    = content;
	this.dataTable  = result;

	return result;
};

/**
 * Returns String representation of this DataAdapter
 */
xml3d.webgl.ValueDataAdapter.prototype.toString = function()
{
	return "xml3d.webgl.ValueDataAdapter";
};

//---------------------------------------------------------------------------------------------------------------------------

/**
 * Class    xml3d.webgl.RootDataAdapter
 * extends: xml3d.webgl.DataAdapter
 *
 * RootDataAdapter represents the root in the DataAdapter hierarchy (no parents).
 *
 * @author  Benjamin Friedrich
 * @version 10/2010  1.0
 */

/**
 * Constructor of xml3d.webgl.RootDataAdapter
 *
 * @augments xml3d.webgl.DataAdapter
 * @constructor
 *
 * @param factory
 * @param node
 *
 */
xml3d.webgl.RootDataAdapter = function(factory, node)
{
	xml3d.webgl.DataAdapter.call(this, factory, node);
};
xml3d.webgl.RootDataAdapter.prototype             = new xml3d.webgl.DataAdapter();
xml3d.webgl.RootDataAdapter.prototype.constructor = xml3d.webgl.RootDataAdapter;

/**
 * Indicates whether this DataAdapter is a RootAdapter (has no parent DataAdapter).
 *
 * @returns true if this DataAdapter is a RootAdapter, otherwise false.
 */
xml3d.webgl.RootDataAdapter.prototype.isRootAdapter = function()
{
	return true;
};

/**
 * Returns String representation of this DataAdapter
 */
xml3d.webgl.RootDataAdapter.prototype.toString = function()
{
	return "xml3d.webgl.RootDataAdapter";
};


xml3d.webgl.ImgDataAdapter = function(factory, node)
{
	xml3d.webgl.DataAdapter.call(this, factory, node);
};
xml3d.webgl.ImgDataAdapter.prototype             = new xml3d.webgl.DataAdapter();
xml3d.webgl.ImgDataAdapter.prototype.constructor = xml3d.webgl.ImgDataAdapter;

xml3d.webgl.ImgDataAdapter.prototype.createDataTable = function(forceNewInstance)
{};

xml3d.webgl.TextureDataAdapter = function(factory, node)
{
	xml3d.webgl.DataAdapter.call(this, factory, node);
};
xml3d.webgl.TextureDataAdapter.prototype             = new xml3d.webgl.DataAdapter();
xml3d.webgl.TextureDataAdapter.prototype.constructor = xml3d.webgl.TextureDataAdapter;

xml3d.webgl.TextureDataAdapter.prototype.createDataTable = function(forceNewInstance)
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
			xml3d.debug.logError("A cube map requires 6 textures, but only "+imgSrc.length+" were found!");
			return null;
		}
		options["flipY"] = false;
		
	} else {
		var textureChild = node.firstElementChild;
		if(!textureChild || textureChild.localName != "img")
		{
			xml3d.debug.logWarning("child of texture element is not an img element");
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
xml3d.webgl.TextureDataAdapter.prototype.toString = function()
{
	return "xml3d.webgl.TextureDataAdapter";
};
/***********************************************************************/
