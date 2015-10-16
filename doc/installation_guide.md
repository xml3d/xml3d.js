# Introduction

The purpose of this documentation is to provide information how to use XML3D in 3D Web-application and how to enable WebCl for Xflow. 

# System Requirements

There are no special requirements to the system for XML3D. A standard desktop PC, Laptop or even mobile device is sufficient.

To be fully functional, XML3D applications need to be deployed to a web server. Otherwise loading remote resources, like for examples meshes that are provided in .xml or .json format, will fail. 

## Hardware Requirements
The following requirements must be fulfilled for hardware accelerated Xflow:

* CPU:
	* x86 compatible with SSE3 extensions or later 
* GPU:
	* Requires the appropriate OpenCL drivers. You can find a list of available drivers for different platforms here: [http://www.khronos.org/conformance/adopters/conformant-products#opencl](http://www.khronos.org/conformance/adopters/conformant-products#opencl)

## Operating System Support

xml3d.js is supported in any browser that supports WebGL.

For hardware accelerated Xflow, we currently support the following platforms:

* Windows: It does not work on 64-bit Firefox, though, but that is not even available through regular distribution channels. 

* Ubuntu: Works on 32-bit Firefox with 32-bit OpenCL drivers, and as of Firefox 19, it also works with 64-bit Firefox and OpenCL. 

* Mac OS X 

## Software Requirements

* Web browser that supports OpenGL to display the XML3D scene
* Latest version of Nokia's WebCL Extension for FireFox
* OpenCL SDK 

# Software Installation and Configuration

XML3D does not need to be installed on the system, but is available as polyfill implementation xml3d.js and can be linked to the webpage by the following link:

```
   <script type='text/javascript' src='http://www.xml3d.org/xml3d/script/xml3d.js'>
```
XML3D provides also a camera controller that allows basic mouse- and keyboard interaction:

```
   <script type='text/javascript' src='http://www.xml3d.org/xml3d/script/tools/camera.js'>
```

## Installing WebCL for hardware accelerated Xflow

### Installing instructions for Ubuntu 14.04 + firefox 32 

* install NVIDIA's OpenCL SDK (https://developer.nvidia.com/cuda-downloads)
* register to Intel's OpenCL SDK(https://makebettercode.com/opencl/?utm_campaign=2014%20Intel%20DPD&utm_source=Intel.com&utm_medium=link&utm_content=Intel%20SDK%20for%20OpenCL%20Applications%202014%20_Intel.com_na&utm_term=Opencl)
* Download 64-bit Ubuntu* (Host)
* Run intel_sdk_for_ocl_applications_2014_ubuntu_4.6.0.92_x64/install.sh 
* install Nokia's extension (http://webcl.nokiaresearch.com/extensions/firefox/multiplatform/latest/webcl-1.0.xpi) 

### Installing instructions for Win8 + firefox 32

* install Intel's OpenCL SDK (http://software.intel.com/en-us/vcsource/tools/opencl-sdk)
* install NVIDIA's OpenCL SDK (https://developer.nvidia.com/cuda-downloads)
* install AMD's OpenCL SDK (http://developer.amd.com/tools-and-sdks/heterogeneous-computing/amd-accelerated-parallel-processing-app-sdk/downloads/)
* install Nokia's extension (http://webcl.nokiaresearch.com/extensions/firefox/multiplatform/latest/webcl-1.0.xpi)

# Sanity Check Procedures

* Follow the user guide tutorial in the [User Guide](user_guide.md)
	* Your browser should display a teapot model.
	* If no teapot model is displayed, perform the Sanity Checks above
	* If your browser displays the error message "Your Browser does not support WebGL", switch to a browser that supports WebGL 

* check that you have WebCL&WebGL enabled (http://webcl.nokiaresearch.com/) 

## End to End testing
N/A

## List of Running Processes
N/A

## Network interfaces Up & Open
N/A

# Diagnosis Procedures

## Resource Availability

### XML3D with software Xflow

* Check if the web site is hosted by a web server
	* The address bar of your browser should display an address that starts with 'http:/'
	* The application should NOT be loaded directly from the file system, i.e. browser prompting 'file:/' at the beginning of the address. Otherwise loading external resources, e.g. for meshes, may fail. 

* Check if the XML3D script is loaded correctly:
	* Open your Web-page that uses XML3D
	* Open the browser debug console
	* Type "XML3D.version"
	* The console should show the current version number of xml3d.js . If it prints an error ("Namespace XML3D is not defined"), the script was not loaded correctly 

* Check if Camera script is loaded correctly:
	* Open your Web-page that uses camera.js camera controller and the browser debug console
	* Type "XML3D.Camera"
	* If the script was not loaded correctly, the console will prompt undefined as result. 

* If objects in your page are not rendered, or not rendered correctly, check the correctness of the XML3D DOM tree:
	* All XML3D nodes (<group>, <transform>, <view>, etc.) must be child nodes of the '<xml3d>' node
	* There must be only one '<xml3d>' element per page
	* Check if id values of referenced elements are correct, and references are given with the '#'-operator. That is, a transform with id myTransform must be referenced via #myTransform
	* Check if external references are loaded correctly. If the URL of external documents is incorrect or the documents are no longer available, the console will print a 404 error 

* If objects that contain Xflow animations are not animated or displayed incorrect, check if the XML3D operators are applied correctly:
	* Check if <data>-elements that work as source for the computation are resolved correctly. If not, console will print an error ( "Could not find data element for ID" )
	* Check if there are any inconsistencies in your Xflow tree. Check if introduced variables are used by their correct name. If not, console will print an error that variable names are not defined in the tree 

		
### Hardware accelerated Xflow
* If sanity checks for hardware acceleration fail, check if OpenCL is working correctly. 

## Remote Service Access
N/A

## Resource Consumption
N/A

## I/O Flows
N/A

