xml3d.js
========

[![Build Status](https://travis-ci.org/xml3d/xml3d.js.svg?branch=develop)](https://travis-ci.org/xml3d/xml3d.js)

#### XML3D ####

xml3d.js is a [XML3D](http://www.xml3d.org) implementation based on WebGL and JavaScript. The aim of XML3D is to make the development of 3D-Web applications as easy
as developing web pages. Every web developer who knows how to use the DOM (or jQuery) should also be able to use XML3D.

XML3D is also an evaluation platform of the W3C Community Group [Declarative 3D for the Web](http://www.w3.org/community/declarative3d/)

#### Examples ####
<a href="http://www.xml3d.org/xml3d/demos/19_RubiksCube/"><img src="http://www.xml3d.org/xml3d/demos/thumbs/rubik.jpg"/></a>
<a href="http://www.xml3d.org/xml3d/demos/25_Chess/"><img src="http://www.xml3d.org/xml3d/demos/thumbs/chess.png"/></a>
<a href="http://www.xml3d.org/xml3d/demos/12_MarsCity/marscity.xhtml"><img src="http://www.xml3d.org/xml3d/demos/thumbs/marscity.jpg?s"/></a>
<a href="http://www.xml3d.org/xml3d/demos/32_WorldBank/"><img src="http://www.xml3d.org/xml3d/demos/thumbs/worldbank.jpg"/></a>
<a href="http://xml3d.github.com/xml3d-museum/"><img src="http://www.xml3d.org/xml3d/demos/thumbs/museum.jpg"/></a>
<a href="http://xml3d.github.com/xml3d-examples/examples/gangnam/style.html"><img src="http://www.xml3d.org/xml3d/demos/thumbs/gangnam.jpg"/></a>
<a href="http://xml3d.github.io/xml3d-examples/examples/xflowAR/ar_flying_teapot.html"><img src="http://www.xml3d.org/xml3d/demos/thumbs/ar.jpg"/></a>
<a href="http://xml3d.github.io/xml3d-examples/examples/shade-tv/index.html"><img src="http://xml3d.org/xml3d/demos/thumbs/shade-js-tv.png"/></a>

#### Usage ####

Download the [library](http://www.xml3d.org/xml3d/script/xml3d.js) and include it in your xhtml.

```html
<script src="http://www.xml3d.org/xml3d/script/xml3d.js"></script>
```

If a standard navigation mode is sufficient for your web application, you can
include the camera controller that comes with xml3d.js:

```html
<script src="http://www.xml3d.org/xml3d/script/xml3d.js"></script>
<script src="http://www.xml3d.org/xml3d/script/tools/camera.js"></script>
```

#### Testing ####
We have an extensive [test suite](http://xml3d.github.com/xml3d.js/tests/) and some [known issues](https://github.com/xml3d/xml3d.js/wiki/Known-issues).

#### How to build ####
Clone a copy of the main xml3d.js git repo by running:

```bash
git clone git://github.com/xml3d/xml3d.git
```

Enter the xml3d.js directory and run the build script:
```bash
cd xml3d.js && npm run build
```
The built version of xml3d.js will be put in the `build/output/` subdirectory

### Documentation ###
We have an overview documentation in each subfolder of the project:
* [build](build/) - The build system of xml3d.js.
* [src](src/) - The actual source code of the xml3d.js library
* [tests](tests/) - The test suite
* [tools](tools/) - Several tools that can be used optionally with xml3d.js


### Change log ###
4.8 -
* Recursive Assets - [demo](http://xml3d.github.io/xml3d-examples/examples/recursiveAsset/recursive.html), [doc](https://github.com/xml3d/xml3d.js/wiki/Assets-and-Model), [issue](https://github.com/xml3d/xml3d.js/issues/76)
* Load Events - [doc](https://github.com/xml3d/xml3d.js/wiki/Events#load)
* [iOS 8 Support](https://github.com/xml3d/xml3d.js/issues/75)
* New build system based on [grunt](http://gruntjs.com/)
* Improved texture filtering - [doc](https://github.com/xml3d/xml3d.js/wiki/Textures)
* Issues: [9](https://github.com/xml3d/xml3d.js/issues/9), [46](https://github.com/xml3d/xml3d.js/issues/46), [56](https://github.com/xml3d/xml3d.js/issues/56), [74](https://github.com/xml3d/xml3d.js/issues/74), [75](https://github.com/xml3d/xml3d.js/issues/75), [76](https://github.com/xml3d/xml3d.js/issues/76), [77](https://github.com/xml3d/xml3d.js/issues/77), [79](https://github.com/xml3d/xml3d.js/issues/79), [82](https://github.com/xml3d/xml3d.js/issues/82)

4.7 - 17.10.2014
* Assets / Configurable Instances - [demo](http://xml3d.github.io/xml3d-examples/examples/assets/assets.html), [slides](http://xml3d.org/xml3d/slides/web3d-instancing/)
* [shade.js](http://xml3d.org/xml3d/papers/shade.js/) integration (beta) - [demo](http://xml3d.github.io/xml3d-examples/examples/shade-tv/index.html), [slides](http://xml3d.org/xml3d/slides/pg-shade.js/)
* Shadow Maps - [demo](http://xml3d.github.io/xml3d-examples/examples/meshlab/meshlab.html)
* More options for texture filtering
* Bugfixes: [#69](https://github.com/xml3d/xml3d.js/issues/69), [#71](https://github.com/xml3d/xml3d.js/issues/71)

4.6 - 15.04.2014
* [Custom RenderTrees and the RenderInterface](https://github.com/xml3d/xml3d.js/wiki/Custom-RenderTrees-and-the-RenderInterface)
* Added Screen-space Ambient Occlusion to standard render pipeline
* Added system to set renderer-specific [options](https://github.com/xml3d/xml3d.js/wiki/Options)
* Infrastructure for [WebCL-based Xflow operators](https://github.com/xml3d/xml3d.js/wiki/WebCL-API)

4.5 - 14.11.2013
* Full support for HTML encoding, all [demos](http://xml3d.github.io/xml3d-examples/) in HTML now
* Set data values efficiently using TypedArray - [demo](http://xml3d.github.io/xml3d-examples/examples/scriptValue/scriptValue.html), [doc](https://github.com/xml3d/xml3d.js/wiki/How-to-efficiently-set-Xflow-input-with-TypedArrays)
* Override shader attributes on a per-object basis - [demo](http://xml3d.github.io/xml3d-examples/examples/shaderOverrides/index.html)
* Improved Error Messages
* Reuse of Xflow graphs using new `<dataflow>` element - [demo](http://xml3d.github.io/xml3d-examples/examples/xflowSkin/xflow-skin.html), [doc](https://github.com/xml3d/xml3d.js/wiki/How-to-use-Xflow#wiki-Dataflows)
* Many performance improvements, e.g. Frustum Culling and Paging
* Support for mult-touch events
* Dynamic near/far clip planes that adapt to scene size
* [#24](https://github.com/xml3d/xml3d.js/issues/24): WebWorker support for MeshLoader plug-ins - [demo](http://localhost:8080/xml3d-examples/examples/openctm/openctm.html)
* [#25](https://github.com/xml3d/xml3d.js/issues/25): Smarter handling of cached resources


4.4 - 23.04.2013
* Image Processing with Xflow (also as standalone library) - [demo](http://xml3d.github.io/xml3d-examples/examples/xflowIP/pixel-wise.html)
* Transformations as Xflow sink
  * Augemented Reality (AR) - [demo](http://xml3d.github.io/xml3d-examples/examples/xflowAR/ar_flying_teapot.xhtml)
  * Keyframe animations
* Generalized resources for meshes, shaders, etc.
  * Support for [XML](http://xml3d.github.com/xml3d-examples/examples/externalXml/externalXml.xhtml) and [JSON](http://xml3d.github.io/xml3d-examples/examples/suzanne/suzanne.xhtml)
  * External loader plug-ins: [OpenCTM](http://xml3d.github.io/xml3d-examples/examples/openctm/openctm.xhtml) and [MeshLab](http://xml3d.github.io/xml3d-examples/examples/meshlab/meshlab.xhtml)
* [Xflow API](): Observer Xflow graph from JavaScript
* Canvas resizing [demo](http://xml3d.github.io/xml3d-examples/examples/canvasresizing/resizing.xhtml)
* Issues: Fixed [#2](https://github.com/xml3d/xml3d.js/issues/2), Fixed [#3](https://github.com/xml3d/xml3d.js/issues/3)

4.3 - 18.12.2012
* [Xflow](https://github.com/xml3d/xml3d.js/wiki/Xflow) support, including
  * Skinning - [demo](http://xml3d.github.com/xml3d-examples/examples/xflowSkin/xflow-skin.xhtml) &amp; [demo](http://xml3d.github.com/xml3d-examples/examples/gangnam/style.xhtml)
  * Sequential Morphing - [demo](http://xml3d.github.com/xml3d-examples/examples/xflowSequentialMorph/xflow-morph.xhtml)
  * Mechanism for custom operators - [demo](http://xml3d.github.com/xml3d-examples/examples/facemorph/facemorph.xhtml) &amp; [demo](http://xml3d.github.com/xml3d-examples/examples/xflowWave/xflow-wave.xhtml)
  * Prototypes - [demo](http://xml3d.github.com/xml3d-examples/examples/xflowPrototypes/xflow-prototypes.xhtml)
* External references in XML format - [demo](http://xml3d.github.com/xml3d-examples/examples/externalXml/externalXml.xhtml)
* ['onload' event](https://github.com/xml3d/xml3d.js/wiki/Events) for &lt;xml3d&gt; element
* Support for video textures - [demo](http://xml3d.github.com/xml3d-examples/examples/video/video.xhtml)
* Support to use a webcam stream as video texture via WebRTC API - [demo](http://xml3d.github.com/xml3d-examples/examples/webcam/webcam.xhtml)
* Support of spot lights - [demo](http://xml3d.github.com/xml3d-examples/examples/spotLight/index.xhtml)
* Support of CSS 3D Transforms in _style_ attribute - [demo](http://xml3d.github.com/xml3d-examples/examples/cssTransform/css-transform.xhtml)
* Improved debug output

4.2 - 14.09.2012
* Hardware accelerated object picking expanded to 16,7 mio objects
* Emissive texture map support in diffuse and phong shader - [demo](http://xml3d.github.com/xml3d-examples/examples/candle/candle.xhtml)
* Specular map support in phong shader - [demo](http://xml3d.github.com/xml3d-museum/)
* New mechanism for custom shaders - [demo](http://xml3d.github.com/xml3d-examples/examples/eyelight/eyelight.xhtml)
* Support of directional lights (finally) - [demo](http://xml3d.github.com/xml3d-examples/examples/directionalLight/index.xhtml)
* Support of external data resources in JSON format - [demo](http://xml3d.github.com/xml3d-examples/examples/suzanne/suzanne.xhtml)
* New mechanism to register loaders for external formats - [demo](http://xml3d.github.com/xml3d-examples/examples/meshlab/meshlab.xhtml)

4.1 - 19.07.2012
* Initial release on GitHub
#
