Folder: src/
========

This folder contains all sources files used to generate the final **xml3d.js** library.


Subfolders:
* [asset](asset/) - Implementation of the XML3D asset concept
* [base](base/) - Base adapter classes.
* [contrib](contrib/) - External libraries
* [data](data/) - The data adpaters - the connecting piece between XML3D and Xflow for inline nodes as well as external resources
* [interface](interface/) - Connection of XML3D with the DOM 
* [math](math/) - A small collection of math functions to complement glMatrix
* [renderer](renderer/) - The rendering implementation. WebGL specific code should stay in here.
* [resource](resource/) - Classes related to loading external resources and resolving connections between DOM elements or documents
* [types](types/) - Math types provided by XML3D, such as Box, Vec3, Matrix or Data Observer
* [until](utils/) - Misc. utility functions used throughout xml3d.js
* [xflow](xflow/) - All code related to the Xflow data processing library. Independent of most other source code.
