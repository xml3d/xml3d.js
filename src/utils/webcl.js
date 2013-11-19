//TODO: This file is work in progress! Helpful API methods concerning WebCL will be added when needed. Please provide feedback!

/**
 * WebCL API
 * 
 * @author Toni Dahl
 */

(function (namespace, undefined) {

    "use strict";

    var platforms,
        devices = {"CPU": [], "GPU": []},
        ctx = null,

        WebCLNamespaceAvailable = false,
        OpenCLDriversAvailable = false,

        DEFAULT_DEVICE = "CPU";

    /**
     *
     * @param msg
     * @constructor
     */

    function WebCLError(msg) {
        if (msg && typeof msg !== "string") {
            throw new TypeError();
        }

        this.name = "WebCLError";
        this.message = msg || "WebCL error.";
        this.stack = (new Error()).stack;
    }

    WebCLError.prototype = Object.create(Error.prototype);
    WebCLError.prototype.constructor = WebCLError;


    /**
     *
     * @returns {boolean}
     */

    function hasWebCLNamespace() {
        WebCLNamespaceAvailable = window.WebCL && WebCL.getPlatforms ? true : false;

        return WebCLNamespaceAvailable;

    }

    /**
     *
     * @returns {boolean}
     */

    function hasOpenCLDrivers() {
        OpenCLDriversAvailable = true;

        try {
            WebCL.getPlatforms();
        } catch (e) {
            OpenCLDriversAvailable = false;
        }

        return OpenCLDriversAvailable;

    }

    /**
     *
     * @returns {boolean}
     */

    function isAvailable() {
        return hasWebCLNamespace() && hasOpenCLDrivers();
    }


    /**
     *
     */

    function init() {
        // Checking if WebCL is available in the users system
        if (!hasWebCLNamespace()) {
            XML3D.debug.logWarning("WebCL: Error: Unfortunately your system does not support WebCL. " +
                "WebCL namespace is not available.");
            return;
        }

        if (!hasOpenCLDrivers()) {
            XML3D.debug.logWarning("WebCL: Error: Unfortunately your system does not support WebCL. " +
                "OpenCL drivers are not working properly.");
            return;
        }

        platforms = WebCL.getPlatforms();

        // Creating default context
        createContext({devices: getDevicesByType(DEFAULT_DEVICE)});

    }

    /**
     *
     * @returns {Array}
     */

    function getPlatforms() {
        return platforms;
    }

    /**
     *
     * @param type
     * @param platform
     * @returns {Array}
     */

    function getPlatformDevicesByType(type, platform) {
        var deviceArr = [];

        try {
        if (type === "CPU") {
            deviceArr = platform.getDevices(WebCL.DEVICE_TYPE_CPU);
        } else if (type === "GPU") {
            deviceArr = platform.getDevices(WebCL.DEVICE_TYPE_GPU);
        } else if (type === "ALL") {
            deviceArr = platform.getDevices(WebCL.DEVICE_TYPE_ALL);
        }

        }catch(e){
            return deviceArr;
        }

        return deviceArr;
    }

    /**
     *
     * @param type
     * @returns {Array}
     */

    function getDevicesByType(type) {
        var deviceArr = [], i;

        function push(v) {
            deviceArr.push(v);
        }

        for (i = platforms.length; i--;) {
            getPlatformDevicesByType(type, platforms[i]).forEach(push);
        }

        return deviceArr;
    }

    /**
     *
     * @param device
     * @returns {*}
     */

    function getDevicePlatform(device) {
        var platform;

        try {
            platform = device.getInfo(WebCL.DEVICE_PLATFORM);
        } catch (e) {
            return false;
        }

        return platform;
    }

    /**
     *
     * @param properties
     * @returns {*}
     */

    function createContext(properties) {
        var defaultProps = {
            devices: getDevicesByType(DEFAULT_DEVICE)
        };

        properties = properties || defaultProps;

        try {
            ctx = WebCL.createContext(properties);
        } catch (e) {
            return false;
        }

        return ctx;
    }

    /**
     *
     * @returns {*}
     */

    function getContext() {
        return ctx;
    }


    /**
     *
     * @param codeStr
     * @returns {*}
     */

    function createProgram(codeStr) {
        var program;

        try {
            program = ctx.createProgram(codeStr);
        } catch (e) {
            XML3D.debug.logError("WebCL: Failed to build WebCL program: " +
                program.getProgramBuildInfo(devices[0], WebCL.CL_PROGRAM_BUILD_STATUS) +
                ":  " + program.getProgramBuildInfo(devices[0], WebCL.CL_PROGRAM_BUILD_LOG));
            return false;
        }

        try {
            program.build([devices[0]], "");
        } catch (e) {
            XML3D.debug.logError("WebCL: Failed to build a WebCL program: " +
                program.getProgramBuildInfo(devices[0], WebCL.CL_PROGRAM_BUILD_STATUS) +
                ":  " + program.getProgramBuildInfo(devices[0], WebCL.CL_PROGRAM_BUILD_LOG));
            return false;
        }

        return program;
    }

    /**
     *
     * @param program
     * @param name
     * @returns {*}
     */

    function createKernel(program, name) {
        var kernel;

        try {
            kernel = program.createKernel(name);
        } catch (e) {
            XML3D.debug.logError("WebCL: Failed to create a WebCL kernel.");
        }

        return kernel;
    }

    /**
     *
     * @param device
     * @returns {*}
     */

    function createCommandQueue(device) {
        var cmdQueue;

        try {
            cmdQueue = ctx.createCommandQueue(device);
        } catch (e) {
            return false;
        }

        return cmdQueue;
    }

    /**
     *
     * @param size
     * @param type
     * @returns {*}
     */

    function createBuffer(size, type) {

        if(type === "r"){
            return ctx.createBuffer(WebCL.CL_MEM_READ_ONLY, size);
        } else if(type === "w") {
            return ctx.createBuffer(WebCL.CL_MEM_WRITE_ONLY, size);
        } else if(type === "rw"){
            return ctx.createBuffer(WebCL.CL_MEM_READ_WRITE, size);
        }

        return false;
    }

    /**
     *
     * @constructor
     */

    var KernelManager = function () {
        var kernels = {};

        return {

            /**
             *
             * @param name
             * @param codeStr
             */

            register: function (name, codeStr) {
                if (kernels.hasOwnProperty(name)) {
                    XML3D.debug.logWarning("WebCL: Kernel with a same name is already defined.");
                    return;
                }

                if (typeof name !== "string" || typeof codeStr !== "string") {
                    XML3D.debug.logWarning("WebCL: Kernel name and code must be a string!");
                    return;
                }

                var program, kernel;

                program = createProgram(codeStr);
                if(program){
                    kernel = createKernel(program, name);
                }

                if(kernel && !kernels.hasOwnProperty(name)){
                    kernels[name] = kernel;
                }

            },

            /**
             *
             * @param name
             */
            unRegister: function(name) {
                if(kernels.hasOwnProperty(name)){
                    kernels[name].releaseCLResources();
                    delete kernels[name];
                }
            },

            /**
             *
             * @param name
             * @returns {*}
             */

            getKernel: function (name) {
                if (typeof name !== "string") {
                    return false;
                }

                if (kernels.hasOwnProperty(name)) {
                    return kernels[name];
                }

                return false;
            },

            /**
             *
             * @returns {boolean}
             */

            setArgs: function(){
                if(arguments.length < 2) {
                    return false;
                }

                var kernelName = arguments[0],
                    kernel = this.getKernel(kernelName),
                    args = arguments.slice(1),
                    i = args.length;

                if(!kernel){
                    return false;
                }

                while(i--){
                    kernel.setArgs(i, args[i]);
                }

                return true;

            }
        };
    };


    /**
     * API
     *
     */

    namespace['webcl'] = {
        init: init,
        createContext: createContext,
        createProgram: createProgram,
        createKernel: createKernel,
        createCommandQueue: createCommandQueue,
        createBuffer: createBuffer,

        getContext: getContext,
        getPlatforms: getPlatforms,
        getDevicesByType: getDevicesByType,
        getDevicePlatform: getDevicePlatform,

        kernels: new KernelManager(),

        isAvailable: isAvailable
    };


}(XML3D = XML3D || {}));