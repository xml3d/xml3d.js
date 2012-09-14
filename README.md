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


