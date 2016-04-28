# Introduction

This documentation introduces how to use XML3D and accelerated Xflow operators. It describes in detail how application developers can use XML3D to declare 3D scenes in the Web-site source code and how DOM API can be used to create and modify scenes during run-time. It moreover explains how to employ hardware acceleration for Xflow, the data-flow that is used by XML3D for complex computations.

This document will be updated as new features are implemented. 

## Background and Detail

These guides relate to the 3D-UI-XML3D implementation of the [3D-UI Generic Enabler](http://catalogue.fiware.org/enablers/3d-ui-xml3d) which is part of the Advanced WebUI chapter. Please find more details about this Generic Enabler in the according [Architecture](http://forge.fiware.org/plugins/mediawiki/wiki/fiware/index.php/Advanced_Web_UI_Architecture) and [Open Specification](http://wiki.fiware.org/FIWARE.OpenSpecification.WebUI.3D-UI) documents. 

# User Guide

Users experience the 3D environment provided in XML3D as soon as they open a web page containing XML3D content.

Depending on the camera controller that is used by the scene, users can navigate through the environment using mouse and keyboard input.

__Examine Mode__: The camera will stay focused one one point of the scene. Pressing and holding Left mouse button will rotate the camera around this point when moving the mouse. The camera will change its distance to the point when moving the mouse while pressing and holding the Right mouse button.

__Walk Mode__: The camera will pretty much behave like known from first-person games. Pressing and holding the Left mouse button will rotate the camera around its center point. The user can navigate freely through the scene by using W, A, S and D keys. 

# Programmers Guide

There are two ways to create a 3D scene in XML3D: Either you can declare it in an XML-like manner directly in the Web site's source, or create it dynamically with JavaScript coe.

The steps to create a 3D scene are as follows:

* Create a HTML Web-Page
* Link `xml3d.js` and `camera.js` as described in the [Installation Guide](installation_guide.md)
* Add an xml3d-Element and compose your scene from the nodes given in the Specification
* Upload your Web-page to a web server, using for example an FTP client, or by copying your application to the document root folder of a locally installed server. 
	
## Adding a mesh in the declarative way

We have already established, that all our 3D content is placed inside an ``<xml3d>`` element, so let's start with that:

```
	<html>
		<head>
			<script type="text/javascript" src="http://www.xml3d.org/xml3d/script/xml3d.js"></script>
			<script type="text/javascript" src="http://www.xml3d.org/xml3d/script/tools/camera.js"></script>
			<title>My very first XML3D teapot</title>
		</head>
		<body>
			 <xml3d>
			 </xml3d>
		</body>
	</html>
```

To add some 3D geometry to our scene, we use the ``<mesh>`` element. Just as with ``<img>``, the ``<mesh>`` element links an external file containing the 3D geometry data. Here is one of these files for the good ol' teapot.

Before you continue, please download the ``teapot.json`` mesh file from here: [teapot.json](http://xml3d.org/xml3d/tutorial/files/teapot.json)

To do so, click the link with the right mouse button and select "Save Link as ... ".

Save the file as "teapot.json" in a sub-folder of your application called "resources".

Including the mesh is now fairly simple:

```
	<xml3d>
		<mesh src="resource/teapot.json"></mesh>
	</xml3d>
```

To have the mesh appear nicely in the view of the camera, we have to consider the following:

* the XML3D viewpoint by default is set at the origin of 3D space (x=y=z=0), looking at direction (0,0, -1), so in negative z direction.
* most meshes tend to be places around the origin as well 

So consequently: our viewpoint is right next to the surface to the mesh.

Let's change the viewpoint to get some distance to the object. XML3D provides the <view> element to define the viewpoint of the scene:

```
	<xml3d>
		<view style="transform: translate3d(0px, 0px, 100px)"></view>
		<mesh src="resource/teapot.xml#mesh"></mesh>
	</xml3d>
```

Since our viewpoint looks into the direction (0,0,-1), we move along the z coordinate to get some distance, thus the new position (0,0,100).

Now we start to recognize our teapot, but it's still a bit high up, not quite inside the center. We could now simplt move the viewpoint up a bit again. However, thanks to relativity, there is a second option: Let's move the mesh instead.

In order to move the mesh, we first have to wrap it inside a <group> element. The group element can enclose multiple <mesh> and other <group> elements and transform all of it's content.

To declare the transformation, we simply use CSS 3D Transformations :

```
	<xml3d>
	   <view style="transform: translate3d(0px, 0px, 100px)"></view>
	   <group  style="transform: translate3d(0px,-20px, 0px)">
		 <mesh src="resource/teapot.xml#mesh"></mesh>
	   </group>
	</xml3d>
```
The declared transformation moves the teapot downwards, placing it nicely centered in the viewport. Most scenes will also need a light source of some kind. Usually a default directional light is all you need to get started:

```
	<xml3d>
	   <light model="urn:xml3d:light:directional"></light> 
	   <view style="transform: translate3d(0px, 0px, 100px)"></view>
	   <group  style="transform: translate3d(0px,-20px, 0px)">
		 <mesh src="resource/teapot.xml#mesh"></mesh>
	   </group>
	</xml3d>
```

## Composition of complex assets from several meshes

Single meshes are very limited when it comes to the declaration of more complex model concepts. For example, one can only assign one single shader to meshes. Also, one may think of models where only parts should be transformable individually by rigid body transformations, like for example a helicopter with moving rotor blades. This could be solved by adding the respective meshes independently in distinct group nodes. However, this potentially adds a lot of ``<group>`` and ``<mesh>`` nodes to the DOM for basically one single object. For this case, XML3D comes with a more powerful approach: Externally defined assets.

Assets are basically a container for a list of ``<assetmesh>`` elements that define which meshes should be part of the resulting assets. An ``<assetmesh>`` can reference an external JSON or XML file just as also done by a ``<mesh>`` node, and carry own translations and shaders. ``<assetdata>`` elements can be used to specify extra sets of data, which may be used by the ``<assetmesh>`` via the includes attribute. Data that is included by meshes overrides data introduced by the mesh and can therefore be used for individual configuration.

An asset definition could look like this: 

```
	<!-- External Asset Definition -->

	<asset id="exampleAsset">
	<assetdata name="config">
	  <float3 name="diffuseColor">0.5 0.5 0</float3>
	</assetdata>
	<assetmesh src="mesh1.json" material="meshdata.xml#shader1" transform="meshdata.xml#localTransform1"></assetmesh>
	<assetmesh src="mesh2.json" material="meshdata.xml#shader2" transform="meshdata.xml#localTransform2" includes="config"></assetmesh>
	</asset>
```

Here, we introduce an asset called exampleAsset. It consists of two meshes, each defined in separate JSON files. Shaders and transformations are assigned from a shared definition file called ``meshdata.xml``. Mesh2 in addition includes the "configuration" ``<assetdata>`` and overwrites the diffuse color which may already be set by ``meshdata.xml#shader2``.

Assets that are defined in the above way are not yet added to the scene, and thus not yet rendered. To have them actually appear in the, one has to create an instance using the <model> element:

```
  <!-- Instance of asset with default parameters -->
  <model src="asset.xml#exampleAsset"></model>

  <!-- Instance of asset with custom diffuse color -->
  <model src="asset.xml#exampleAsset>
    <assetdata name="config">
      <float3 name="diffuseColor">0.7 0.7 1.0</float3>
    </assetdata>
  </model>
```

Here, we can notice two things: First, an asset that is referenced by a ``<model>`` tag does not necessarily need to be defined within the same document as the model, but can be stored elsewhere, keeping DOM and memory consumption small. Second, also ``<model>`` elements can contain ``<assetdata>`` nodes. These ``<assetdata>`` nodes overwrite the values of the nodes with the same name specified in the ``<asset>`` itself. Thus, the code above will render two models in the scene: First, an instance of the asset exactly as given in the definition with a yellow appearance, second an instance which is also an instance of the default asset, but with a individually configured blueish diffuse color. If an asset contains several ``<assetdata>`` nodes, or an ``<assetdata>`` node contains more than one parameter, one can also operate just on the subset of those which one wants to change. 

### Nested Assets: Hierarchies

Assets can be combined to more complex Nested Asset Hierarchies just by assembling asset nodes as one would expect in a scene graph. To do so, just add one or more asset nodes as child node of the parent asset elements. Rules as described above apply: All of the child assets are instantiated as defined within the asset, that is, if you specify a source for your child asset, the instance of your asset hierarchy will contain an instance of your referenced asset. But asset hierarchies offer more: They can be considered as templates for more complex models by adding child asset nodes, but leaving the respective source empty. Adding the actual instantiated asset to your model can then be done during model instantiation.

This may sound complicated at first, but let's have a look at the following example:

This is our Asset definition:

```
  <!-- asset definition -->
  <asset id = "nestedAsset">
    <assetmesh src="someExternalMesh.json"></assetmesh>

    <!-- asset within asset definition -->
    <asset name="slots">
      <asset name="leftSlot"></asset>
      <asset name="rightSlot"></asset>
    </asset>
  </asset>
```

As you see, the difference to our flat assets before is an asset called slots, that in turn contains two other assets leftSlot and rightSlot . As they do not contain any ``<assetmesh>`` element, there will also no geometry be rendered when instantiating nestedAsset. By adding a name to our child assets, we can now access them within our model tag:

Our instance of our nested asset may look like this now:

```
  <!-- model instance -->
  <model src="#nestedAsset">

    <!-- set appearance of child asset via src -->
    <asset name="slots.leftSlot" src="myExternalAsset_1.xml#asset" transform="#someTransform"></asset>

  </model>
```

See how we added data to our left slot? We addressed our slot asset by it's name, and it's child leftSlot by its name as well. This works the same way as extending data for asset configuration in our examples for shader color. The externally referenced asset would now have to include some ``<assetmesh>`` data, that would then be rendered as child node of our overall asset. Note that we can also position our child asset relative to our parent asset by specifying a ``<transform>`` directly in the child asset. 

## Dynamic Creation of XML3D Scenes in JavaScript

XML3D scenes can be created and modified during runtime. This can be done by the standard DOM API of the browser, or by popular frameworks such as jQuery. Basically every tool library that can be used to create dynamic Web-sites can also be employed to modify XML3D scenes.

New elements are created using the normal browser functions:

```
   document.createElement(elementName)
```

with elementName corresponding to the nodes given in the XML3D Open API Specification

A new mesh contained in a group node can thus be created and added to the scene by the following code:

```
// Create a group and mesh to be added by the scene
var group = document.createElement("group");
var mesh = document.createElement("mesh");
mesh.type= "triangles";
mesh.src = "#meshData";
group.appendChild(mesh);
// Get the XML3D element via jquery and append the new group
$("xml3d").append(group);
```

This code will create the following XML3D tree:

```
 <xml3d>
   <group>
    <mesh type="triangles" src="#meshData"></mesh>
   </group>
 </xml3d>
```

As soon as the new group node was inserted in the DOM, it will automatically be rendered in the 3D view. Transformations applied to group nodes can be changed as follows:

```
var transform = $(group.transform); // retrieve a transformation via jQuery
transform.translation = new XML3D.Vec3(1,2,3); // Translation and Scale can be assigned as vectors
transform.rotation = new XML3D.AxisAngle(0,1,0, 0.5*Math.PI) // Rotations can be assigned as axis angle
```

Updating transformation attributes automatically renders the frame and displays the applied changes. 

### Observing Status of loaded Resources

When adding XML3D nodes to a scene, all referenced resources, i.e. mesh data, data flows, textures etc. are loaded from their specified location. That means that even if the node was successfully created in the DOM, the resources that are represented by the node may not be completely loaded. This information can be important, though, for example when trying to perform computations on the newly added geometry.

For this, XML3D offers an event load that can be attached to ``<xml3d>, <mesh>, <asset>, <model>, <material>, <data>`` and ``<dataflow>`` elements. An event listener to the load event can be attached either by using ``.addEventListener()``, or by specifying the event handling function via onload:

```
/* onload */
<asset id="myAsset" onload="handleLoadedAsset(this);" ></asset>

/* Event Listener */
var newAsset = document.createElement("asset");
newAsset.src = "myAsset.xml#asset",
newAsser.addEventListener("load", handleLoadedAsset, false);
```

The event will be fired depending on the element:

* ``<xml3d>`` : the event is fired when all external resources (mesh data, textures etc.) have been completely loaded
* ``<mesh>, <material>, <data>, <dataflow>`` : the event is fired when all generic data (including textures) connected to these nodes has been loaded. If one of these elements includes a complex sub-graph of nested external resources, the event is fired only once all these resources have been loaded.
* ``<asset>, <model>`` : the event is fired once the src-model and all <model> <assetdata> and <assetmesh> children have been completely loaded. 

For the xml3d element, the load event fires whenever all external resources finished loading. Thus when an external reference is modified that results in the loading of a (non-cached) external resource, the load event will fire again, once this resource (an all other loading resources) have finished loading.

For all other element, the load event will fire again whenever any potentially external reference (such as a src attribute) within the content of the element is modified.

In addition to load events, all these elements provide the complete property which returns false if resources are currently loading for the element and true if everything has been loaded. 