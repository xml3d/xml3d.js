xml3d.js
========

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

#### Build ####
The xml3d.js is separated into several files. To build, run the ant script
'build.xml' located in the 'build' folder. From Eclipse IDE the build can also
be started by running 'Run As->Ant build' from the files context menu.

### Change log ###
4.3 - 18.20.2012
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
