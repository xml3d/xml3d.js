Folder: src/
========

This folder contains all sources files used to generate the final **xml3d.js** library.


Subfolders:
* [asset](asset/) - Implementation of the XML3D asset concept
* [base](base/) - Base systems used throughout xml3d.js, such as resource manager, base adapter classes etc.
* [contrib](contrib/) - External libraries
* [data](data/) - The data adpater - the connecting piece between XML3D and Xflow for inline nodes as well as external resources
* [interface](interface/) - Connection of XML3D with the DOM 
* [math](math/) - A small collection of math functions to complement glMatrix
* [renderer](renderer/) - The rendering implementation. WebGL specific code should stay in here.
* [types](types/) - External types used by XML3D, such as Boundingbox, Vec3, Matrix or Data Observer
* [until](utils/) - Misc. utility functions used throughout xml3d.js
* [xflow](xflow/) - All code related to the Xflow library. Independent of most other source code.
