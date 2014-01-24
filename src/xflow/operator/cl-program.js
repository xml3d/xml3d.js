(function () {
    "use strict";

    Xflow.CLProgram = function (operatorList) {
        this.cl = operatorList.graph.cl;

        if (!this.cl) {
            return;
        }

        this.list = operatorList;
        this.entry = operatorList.entries[0];
        this.operator = this.entry.operator;

        this.kernelParamMap = {inputs: [], outputs: []};
        this.kernelFunctionParams = [];
        this.kernelCode = null;
        this.kernelProgram = null;
        this.mainProgram = null;


    };

    var helperParamMap = {
        'texture': {type: "uint", params: ["width", "height"]},
        'buffer': {type: "uint", params: ["length"]}
    };


    function KernelParam(cl, name, xflowType, clType, entryValue, isInput) {
        this.cl = cl;
        this.name = name;
        this.type = clType || null;
        this.isInput = !!isInput;
        this.needsMemObject = false;
        this.hasMemObject = false;
        this.memObjectSize = null;
        this.arg = null;
        this.clFunctionParam = null;
        this.xflowType = xflowType;
        this.helperMap = null;
        this.helpers = [];
        this.entryValue = entryValue || null;
        this.val = null;

        this.prepareParam();
        this.initHelperParams();
        this.initKernelArg();
        this.updateValue(this.entryValue);

    }

    KernelParam.prototype = {
        prepareParam: function () {
            var helperMap;
            var xflowDataTypes = Xflow.DATA_TYPE;
            var kernelFuncParam = [];
            var addressSpace = '';
            var declarations = '';

            if (!this.type) {
                switch (this.xflowType) {
                    case xflowDataTypes.TEXTURE:
                    {
                        helperMap = helperParamMap.texture;
                        this.type = "uchar4*";
                        addressSpace = "__global";
                        this.needsMemObject = true;
                    }
                        break;
                    case xflowDataTypes.INT:
                    {
                        this.type = "int";
                    }
                        break;
                    case xflowDataTypes.FLOAT:
                    {
                        this.type = "float";
                    }
                        break;
                    default:
                        return;
                }

                this.helperMap = helperMap;
            }

            // Arranging parameter parts
            if (addressSpace) {
                kernelFuncParam.push(addressSpace);
            }

            if (this.isInput) {
                declarations = 'const';
            }

            if (declarations) {
                kernelFuncParam.push(declarations);
            }

            kernelFuncParam.push(this.type);
            kernelFuncParam.push(this.name);
            this.clFunctionParam = kernelFuncParam.join(' ');
        },

        initHelperParams: function () {
            var helperVal;
            var self = this;
            var helperMap = this.helperMap;

            if (helperMap && this.isInput) {
                helperMap.params.forEach(function (p) {
                    var pName = self.name + '_' + p;
                    if (p === "width") {
                        helperVal = self.entryValue.width;
                    } else if (p === "height") {
                        helperVal = self.entryValue.height;
                    } else if (p === "length") {
                        helperVal = self.entryValue.length;
                    }
                    self.helpers.push(new KernelParam(self.cl, pName, null, helperMap.type, new Uint32Array([helperVal])));
                });
            }
        },
        initKernelArg: function () {
            if (this.needsMemObject) {
                this.allocateMemObject();
            } else {
                this.arg = this.entryValue;
            }
        },

        allocateMemObject: function () {
            var clAPI = this.cl.API;
            var clCtx = this.cl.ctx;
            var paramType = this.type;
            var byteSize = parseInt(paramType.substring(paramType.length - 2, paramType.length - 1), 10);
            var memObjectMode = this.isInput ? 'r' : 'w';
            var entryValue = this.entryValue;
            var memObjectSize, memObject;

            if (this.hasMemObject) {
                this.arg.release();
            }

            if (this.xflowType === Xflow.DATA_TYPE.TEXTURE) { // Texture is a special case
                memObjectSize = entryValue.width * entryValue.height * byteSize;
            } else {
                memObjectSize = entryValue.length * byteSize;
            }

            memObject = clAPI.createBuffer(memObjectSize, memObjectMode, clCtx);

            this.memObjectSize = memObjectSize;
            this.arg = memObject;

            this.hasMemObject = true;
            this.needsMemObject = false;

        },

        updateValue: function (entry) {
            if (this.hasMemObject) {
                this.val = entry.data;
                this.entryValue = entry;
            } else {
                this.arg = this.entryValue = entry;
            }
        }
    };


    Xflow.CLProgram.prototype.run = function (programData) {
        var operatorData = prepareOperatorData(this.list, 0, programData);

        applyDefaultOperation(this.entry, programData, operatorData, this);

    };

    function prepareOperatorData(list, idx, programData) {
        var doIterate, i;
        var data = programData.operatorData[0];
        var entry = list.entries[idx];
        var mapping = entry.operator.mapping;

        data.iterFlag = {};

        for (i = 0; i < mapping.length; ++i) {
            doIterate = (entry.isTransferInput(i) || list.isInputIterate(entry.getDirectInputIndex(i)));
            data.iterFlag[i] = doIterate;
        }

        data.iterateCount = list.getIterateCount(programData);

        return data;
    }

    function applyDefaultOperation(entry, programData, operatorData, program) {
        if (program.operator.evaluate && program.operator.evaluate instanceof Array) {
            assembleFunctionArgs(entry, programData, program);

            if (program.kernelCode === null) {
                prepareWebCLKernel(programData, program);
                program.mainProgram = createMainWebCLProgram(program);
            }

            program.mainProgram();
        }
    }

    function assembleFunctionArgs(entry, programData, program) {
        var d, dataEntry, i;
        var kernelFunctionParams = program.kernelFunctionParams;
        var outputs = program.operator.outputs;

        kernelFunctionParams.length = 0;

        for (i = 0; i < outputs.length; ++i) {
            d = outputs[i];
            dataEntry = programData.outputs[entry.getOutputIndex(i)].dataEntry;

            prepareKernelParameter(d, !!(d.source), program, kernelFunctionParams, dataEntry, i);
        }

        addInputToArgs(entry, programData, program, kernelFunctionParams);
    }

    function addInputToArgs(entry, programData, program, kernelFunctionParams) {
        var mapEntry, dataEntry, i;
        var mapping = entry.operator.mapping;

        for (i = 0; i < mapping.length; ++i) {
            mapEntry = mapping[i];
            dataEntry = programData.getDataEntry(entry.getDirectInputIndex(i));

            prepareKernelParameter(mapEntry, !!(mapEntry.source), program, kernelFunctionParams, dataEntry, i);
        }
    }

    function prepareKernelParameter(param, input, program, functionParams, arg, i) {
        var kernelParams;
        var entryVal = arg ? arg.getValue() : null;

        if (input) {
            kernelParams = program.kernelParamMap.inputs;
        } else {
            kernelParams = program.kernelParamMap.outputs;
        }

        if (kernelParams[i]) {
            kernelParams[i].updateValue(entryVal);
            return;
        }

        kernelParams[i] = new KernelParam(program.cl, param.name, param.type, null, entryVal, input);

        functionParams.push(kernelParams[i].clFunctionParam);

        kernelParams[i].helpers.forEach(function (p) {
            functionParams.push(p.clFunctionParam);
        });
    }


    /** KERNEL CODE PREPARATION **/

    function prepareWebCLKernel(programData, program) {
        var kernelCode;
        var kernelManager = program.cl.kernelManager;
        var inputKernel = program.operator.evaluate;
        var kernelName = program.kernelName = program.operator.name.split('xflow.')[1];

        if (!inputKernel) {
            return false;
        }

        kernelCode = program.kernelCode = prepareKernelCode(kernelName, inputKernel, program);

        try {
            kernelManager.register(kernelName, kernelCode);
        } catch (e) {
            return false;
        }

        program.kernelProgram = kernelManager.getKernel(program.kernelName);

        return true;
    }

    function prepareKernelCode(kernelName, inputKernel, program) {
        var result, innerKernelCode;

        result = createKernelHeader(kernelName, program);

        if (!result) {
            return false;
        }

        result += '{\n';

        innerKernelCode = createInnerKernelCode(program);

        if (!innerKernelCode) {
            return false;
        }

        result += innerKernelCode;
        result += inputKernel.join('\n');
        result += '\n}';

        return result;
    }

    function createKernelHeader(kernelName, program) {
        var functionHeader = [];

        functionHeader.push("__kernel void");
        functionHeader.push(kernelName + '(');
        functionHeader.push(program.kernelFunctionParams.join(', '));
        functionHeader.push(')');

        return functionHeader.join(' ');
    }

    function createInnerKernelCode(program) {
        var codeLines = [];

        var firstInput = program.kernelParamMap.inputs[0];

        if (firstInput.type === "uchar4*") {
            // Add "iterators"
            codeLines.push("int x = get_global_id(0);");
            codeLines.push("int y = get_global_id(1);");

            // Add bounds checkers
            codeLines.push("if (x >= " + firstInput.name + "_width || y >= " + firstInput.name + "_height) return;");

            // Add input iterator
            codeLines.push("int " + firstInput.name + "_i = y * " + firstInput.name + "_width + x;");

        } else { // Else, assuming that the first input is an 1-dimensional buffer

            codeLines.push("int " + firstInput.name + "_i = get_global_id(0);");

            codeLines.push("if (int " + firstInput.name + "_i >= " + firstInput.name + "_length) return;");
        }

        return codeLines.join('\n');

    }


    /** MAIN PROGRAM INITIALISATION **/

    function createMainWebCLProgram(program) {
        var cl = program.cl;
        var kernelManager = cl.kernelManager;
        var cmdQueue = cl.cmdQueue;
        var memObjects = {inputs: [], outputs: []};
        var assembledArgs = assembleKernelArguments(program.kernelParamMap,memObjects);
        var WSSizes = computeWorkGroupSize(program.kernelParamMap.inputs[0]);
        var kernel = program.kernelProgram;

        return function () {
            var i, len, memObj, args;
            var inputMemObjs = memObjects.inputs;
            var outputMemObjs = memObjects.outputs;

            if (!kernel) {
                return false;
            }

            args = assembledArgs.map(function (a) {
                return a.arg;
            });
            kernelManager.setArgs.apply(null, [kernel].concat(args));

            try {
                // Write the buffer to OpenCL device memory
                len = inputMemObjs.length;
                for (i = 0; i < len; i++) {
                    memObj = inputMemObjs[i];
                    cmdQueue.enqueueWriteBuffer(memObj.arg, false, 0, memObj.arg.getInfo(WebCL.MEM_SIZE), memObj.val, []);
                }

                // Execute (enqueue) kernel
                cmdQueue.enqueueNDRangeKernel(kernel, WSSizes[1].length, [], WSSizes[1], WSSizes[0], []);

                // Read the result buffer from OpenCL device
                len = outputMemObjs.length;
                for (i = 0; i < len; i++) {
                    memObj = outputMemObjs[i];
                    cmdQueue.enqueueReadBuffer(memObj.arg, false, 0, memObj.arg.getInfo(WebCL.MEM_SIZE), memObj.val, []);
                }

                cmdQueue.finish(); //Finish all the operations

            } catch (e) {
                return false;
            }

            return true;
        };
    }

    function mapKernelArgument(param, kernelArgs, memObjects) {
        kernelArgs.push(param);

        if (param.hasMemObject) {
            memObjects.push(param);
            param.helpers.forEach(function (p) {
                kernelArgs.push(p);
            });
        }
    }


    function assembleKernelArguments(paramMap, memObjects) {
        var outputs = paramMap.outputs;
        var inputs = paramMap.inputs;
        var kernelArgs = [];

        outputs.forEach(function (p) {
            mapKernelArgument(p, kernelArgs, memObjects.outputs);
        });

        inputs.forEach(function (p) {
            mapKernelArgument(p, kernelArgs, memObjects.inputs);
        });

        return kernelArgs;
    }

    function computeWorkGroupSize(targetInput) {
        var localWS, globalWS;
        var entryVal = targetInput.entryValue;

        if (targetInput.xflowType === Xflow.DATA_TYPE.TEXTURE) {
            localWS = [16, 4];
            globalWS = [Math.ceil(entryVal.width / localWS[0]) * localWS[0],
                Math.ceil(entryVal.height / localWS[1]) * localWS[1]];
        } else {
            localWS = [16];
            globalWS = [Math.ceil(entryVal.length / localWS[0]) * localWS[0]];
        }

        return [localWS, globalWS];
    }


}());