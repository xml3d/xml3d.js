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

        this.helperParamMap = {
            'texture': {type: "uint", params: ["width", "height"]},
            'buffer': {type: "uint", params: ["length"]}
        };
    };

    Xflow.CLProgram.prototype.run = function (programData) {
        var operatorData = prepareOperatorData(this.list, 0, programData);

        applyDefaultOperation(this.entry, programData, operatorData, this);

    };

    function applyDefaultOperation(entry, programData, operatorData, program) {
        if (program.operator.evaluate && program.operator.evaluate instanceof Array) {
            assembleFunctionArgs(entry, programData, program);

            if (program.kernelCode === null) {
                //console.log("Preparing WebCL kernel for:", entry.operator.name);
                prepareWebCLKernel(programData, program);
                //console.log("Creating main WebCL program...");
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

            //console.log("Output_" + i + ":", d);
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

            //console.log("Input_" + i + ":", mapEntry);
            prepareKernelParameter(mapEntry, !!(mapEntry.source), program, kernelFunctionParams, dataEntry, i);
        }
    }


    function isSameType(a,b) {
        return a.toString() === b.toString();
    }

    function prepareKernelParameter(param, input, program, functionParams, arg, i) {
        var paramType, helperMap, kernelParams;
        var resultParam = [];
        var addressSpace = '';
        var declarations = '';
        var entryVal = arg ? arg.getValue() : null;

        if (input) {
            kernelParams = program.kernelParamMap.inputs;
        } else {
            kernelParams = program.kernelParamMap.outputs;
        }

        if (kernelParams[i]) {
            kernelParams[i].val = entryVal;
            if (isSameType(kernelParams[i].arg, kernelParams[i].val)) {
                kernelParams[i].arg = kernelParams[i].val;
            }
            return;
        }


        // Mapping Xflow types to WebCL types
        if (param.type === Xflow.DATA_TYPE.TEXTURE) {
            helperMap = program.helperParamMap['texture'];
            paramType = "uchar4*";
            addressSpace = "__global";

        } else if (param.type === Xflow.DATA_TYPE.INT) {
            paramType = "int";
        } else {
            return;
        }

        kernelParams[i] = {type: paramType, name: param.name, helpers: [], val: entryVal};


        // Arranging parameter parts
        if (addressSpace) {
            resultParam.push(addressSpace);
        }

        if (input) {
            declarations = 'const';
        }

        if (declarations) {
            resultParam.push(declarations);
        }

        resultParam.push(paramType);
        resultParam.push(param.name);


        functionParams.push(resultParam.join(' '));

        if (helperMap && input) {

            helperMap.params.forEach(function (p) {
                var pName = param.name + '_' + p;

                kernelParams[kernelParams.length - 1].helpers.push({type: helperMap.type, name: pName});
                functionParams.push(helperMap.type + ' ' + pName);
            });
        }

        //console.log("Prepared kernel paramater:", kernelParams[kernelParams.length - 1]);

    }

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


    /** KERNEL CODE PREPARATION **/

    function prepareWebCLKernel(programData, program) {
        var kernelCode;
        var kernelManager = program.cl.kernelManager;
        var inputKernel = program.operator.evaluate;
        var kernelName = program.kernelName = program.operator.name.split('xflow.')[1];

        if (!inputKernel) {
            return false;
        }

        //console.log(kernelName, inputKernel);

        kernelCode = program.kernelCode = prepareKernelCode(kernelName, inputKernel, program);

        try {
            kernelManager.register(kernelName, kernelCode);
        } catch (e) {
            console.log(e.name, e.message);
            return false;
        }

        program.kernelProgram = kernelManager.getKernel(program.kernelName);

        //console.log(program.operator.outputs);
        //console.log(program.operator.params);

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

        //console.log(result);

        return result;
    }

    function createKernelHeader(kernelName, program) {
        //console.log("Creating kernel header...");
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

        //console.log("KernelFunction params", program.kernelFunctionParams);
        //console.log("KernelParamMap", program.kernelParamMap);

        var memObjects = {inputs: [], outputs: []};

        var preparedArgs = prepareKernelArguments(program.kernelParamMap, cl, memObjects);


        var WSSizes = computeWorkGroupSize(program.kernelParamMap.inputs[0]);

        var kernel = program.kernelProgram;

        //console.log("WS Sizes:", WSSizes);

        return function () {
            var i, len, memObj, args;
            var inputMemObjs = memObjects.inputs;
            var outputMemObjs = memObjects.outputs;

            if (!kernel) {
                return false;
            }

            args = preparedArgs.map(function (a) {
                return a.arg;
            });
            kernelManager.setArgs.apply(null, [kernel].concat(args));

            try {
                // Write the buffer to OpenCL device memory
                len = inputMemObjs.length;
                for (i = 0; i < len; i++) {
                    memObj = inputMemObjs[i];
                    cmdQueue.enqueueWriteBuffer(memObj.arg, false, 0, memObj.arg.getInfo(WebCL.MEM_SIZE), memObj.val.data, []);
                }

                // Execute (enqueue) kernel
                cmdQueue.enqueueNDRangeKernel(kernel, WSSizes[1].length, [], WSSizes[1], WSSizes[0], []);

                // Read the result buffer from OpenCL device
                len = outputMemObjs.length;
                for (i = 0; i < len; i++) {
                    memObj = outputMemObjs[i];
                    cmdQueue.enqueueReadBuffer(memObj.arg, false, 0, memObj.arg.getInfo(WebCL.MEM_SIZE), memObj.val.data, []);
                }

                cmdQueue.finish(); //Finish all the operations

            } catch (e) {
                console.log(e.name, e.message);

                return false;
            }

            return true;
        };
    }

    function prepareCLMemObject(param, cl, kernelArgs, memObjects) {
        var memObject, memObjectSize;
        var memObjectMode = param.input ? 'r' : 'w';

        var clAPI = cl.API;
        var clCtx = cl.ctx;

        var paramType = param.type;
        var byteSize = parseInt(paramType.substring(paramType.length - 2, paramType.length - 1), 10);
        var entryVal = param.val;//param.dataEntry ? param.dataEntry.getValue() : null;

        if (paramType === "uchar4*") { // Texture is a special case
            //console.log("Creating uint4* buffer");
            memObjectSize = entryVal.width * entryVal.height * 4;
            memObject = clAPI.createBuffer(memObjectSize, memObjectMode, clCtx);

            param.arg = memObject;
            //param.val = entryVal;

            kernelArgs.push(param);

            if (param.helpers.length > 0) {
                param.helpers.forEach(function (p) {
                    //console.log(p);
                    if (p.name.indexOf("width") !== -1) {
                        p.val = entryVal.width;
                        initialiseCLType(p, kernelArgs);
                    } else if (p.name.indexOf("height") !== -1) {
                        p.val = entryVal.height;
                        initialiseCLType(p, kernelArgs);
                    }
                });
            }
        } else {
            //console.log("Creating", paramType, "buffer");
            memObjectSize = entryVal.length * byteSize;
            memObject = clAPI.createBuffer(memObjectSize, memObjectMode, clCtx);

            param.arg = memObject;
            //param.val = entryVal;

            kernelArgs.push(param);

            if (param.helpers.length > 0) {
                param.helpers.forEach(function (p) {
                    //console.log(p);
                    if (p.name.indexOf("length") !== -1) {
                        p.val = entryVal.length;
                        initialiseCLType(p, kernelArgs);
                    }
                });
            }
        }

        // Storing pointer to param with the accompanying memObject
        memObjects.push(param);
    }

    function initialiseCLType(param, kernelArgs) {
        var paramType = param.type;
        var entryVal = param.val;//param.dataEntry ? param.dataEntry.getValue() : null || param.val;

        if (paramType === 'uint') {
            if (!(entryVal instanceof Uint32Array)) {
                entryVal = new Uint32Array([entryVal]);
            }
        } else if (paramType === 'int') {
            //console.log("dataEntry", param.dataEntry);
            if (!(entryVal instanceof Int32Array)) {
                entryVal = new Int32Array([entryVal]);
            }
        }
        param.arg = entryVal;

        kernelArgs.push(param);
    }

    function initialiseCLArgument(param, cl, kernelArgs, memObjects) {
        if (param.type.match(/\d\*$/)) {
            prepareCLMemObject(param, cl, kernelArgs, memObjects);
        } else {
            initialiseCLType(param, kernelArgs);
        }

    }

    function prepareKernelArguments(paramMap, cl, memObjects) {
        var outputs = paramMap.outputs;
        var inputs = paramMap.inputs;
        var kernelArgs = [];

        //console.log("Preparing arguments for kernel program...");

        outputs.forEach(function (p) {
            initialiseCLArgument(p, cl, kernelArgs, memObjects.outputs);
        });

        inputs.forEach(function (p) {
            initialiseCLArgument(p, cl, kernelArgs, memObjects.inputs);
        });

        //console.log("Prepared arguments:", kernelArgs);

        return kernelArgs;
    }

    function computeWorkGroupSize(targetInput) {
        var localWS, globalWS;
        var inputVal = targetInput.val;

        if (targetInput.type === "uchar4*") {
            localWS = [16, 4];
            globalWS = [Math.ceil(inputVal.width / localWS[0]) * localWS[0],
                Math.ceil(inputVal.height / localWS[1]) * localWS[1]];
        } else {
            localWS = [16];
            globalWS = [Math.ceil(inputVal.length / localWS[0]) * localWS[0]];
        }

        return [localWS, globalWS];
    }


}());