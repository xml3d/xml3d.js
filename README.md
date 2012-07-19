xml3d.js
========

#### XML3D ####

xml3d.js is a [XML3D](http://www.xml3d.org) implementation based on WebGL and JavaScript. The aim of XML3D is to make the development of 3D-Web applications as easy
as developing web pages. Every web developer who knows how to use the DOM (or jQuery) should also be able to use XML3D.

XML3D is also an evaluation platform of the W3C Community Group [Declarative 3D for the Web](http://www.w3.org/community/declarative3d/)

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


#### Build ####
The xml3d.js is separated into several files. To build, run the ant script
'build.xml' located in the 'build' folder. From Eclipse IDE the build can also
be started by running 'Run As->Ant build' from the files context menu.


