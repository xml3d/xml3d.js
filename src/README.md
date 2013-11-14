Folder: src/
========

This folder contains all sources files used to generate the final **xml3d.js** library, as well the **xflip.js** library.


Subfolders:
* [base](base/) - Base systems used throughout xml3d.js, such as resource manager, base adapter classes etc.
* [contrib](contrib/) - External libraries
* [data](data/) - The data adpater - the connecting piece between XML3D and Xflow for inline nodes as well as external resources
* [interfaces](interfaces/) - Connection of XML3D with the DOM 
* [math](math/) - ... what does this folder do exactly? 
* [renderer](renderer/) - The rendering implementation. WebGL specific code should stay in here.
* [types](types/) - External types used by XML3D, such as Boundingbox, Vec3, Matrix or Data Observer
* [until](utiles/) - All the stuff were we don't know where to place it.
* [xflip](xflip/) - Xflip implementation, a library for images process with Xflow. Not related to xml3d.js
* [xflow](xflow/) - All code related to the Xflow library. Independent of most other source code.
