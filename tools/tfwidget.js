/*  TransferFunctionWidget class
	  general info:
		 transfer functions are used for volumetric objects
		 current implementation only supports one-dimensional transfer functions
	  class info:
		 this class is used to create transfer function widget inside html div provided in a parameter
		 the widget allows user to change transfer function at run-time
	  how to use:
		 after page is loaded call ==>
			new XML3D.webgl.TransferFunctionWidget(shaderElementId, tfWidgetDivId)
*/
(function() {
	"use strict";
	
	XML3D.transferFunctionWidgets = {};
	
    /**
     * @constructor
     */
	var TransferFunctionWidget = function(shaderElementId, tfWidgetDivId) {
	
		this.parentDiv = document.getElementById(tfWidgetDivId);
		if (!this.parentDiv) {
			XML3D.debug.logError("Transfer function widget could not be created because parent div (id = " + tfWidgetDivId + 
						") was not found in the document!"); 
			return;
		}
		
		this.shaderElementId = shaderElementId;
		var shaderElement = document.getElementById(shaderElementId);
		this.context = this.getContextForElement(shaderElement);
		this.tfData = shaderElement.getResult(["transferFunction"]).getValue("transferFunction");
		
		this._initTransferFunctionWidget(); 
    };
	
	var colorChannels = {
        Red:   "#F00",
		Green: "#0F0",
		Blue:  "#00F",
		Alpha: "#777"
	};
	
	var chessSquareSize = 5;
	var tfViewDefaultHeight   = 20;
	var tfEditorDefaultHeight = 256;
	var tfDefaultSaveImgFileName = "transfer_function.png";
	var tfDefaultSaveTextFileName = "transfer_function.tf";
	
    var p = TransferFunctionWidget.prototype;
	
	p._initTransferFunctionWidget = function() {
		if (!this.initDone) {
			this.initDone = true;
			this._initParameters();
			this._createDOMElementsForWidget();
		
			this._createTFChessBackground();
			this.applyImageToWidget();
		}
	};
	
	p._initParameters = function() {
		this.tfViewHeight   = tfViewDefaultHeight;
		this.tfEditorHeight = tfEditorDefaultHeight;
		this.tfWidth = 0;
		this.selectedColorChannel   = 0;
		
		this.startTracking = false;
		this.trackX = 0;
	};
	
	p._createDOMElementsForWidget = function() {
		var viewCanvasBackgroundSize = chessSquareSize * 2;
		this.tfViewCanvas = this._createCanvas(viewCanvasBackgroundSize, viewCanvasBackgroundSize);
		this.tfEditorCanvas = this._createCanvas(0, this.tfEditorHeight);
						
		this.colorChannelsCombo = document.createElement("select");
		this._addColorChannelsToCombo(this.colorChannelsCombo);
		
		this.bSave = this._createButton("Save");
		this.bOpen = this._createButton("Open");
		this.chbFormat = this._createCheckBox("Text format");
		
		this.parentDiv.appendChild(this.tfViewCanvas);
		this.parentDiv.appendChild(document.createElement("br"));
		this.parentDiv.appendChild(this.tfEditorCanvas);
		this.parentDiv.appendChild(document.createElement("br"));
		this.parentDiv.appendChild(this.colorChannelsCombo);
		this.parentDiv.appendChild(this.bSave);
		this.parentDiv.appendChild(this.bOpen);
		this.parentDiv.appendChild(this.chbFormat.checkbox);
		this.parentDiv.appendChild(this.chbFormat.label);
		
		this.addEventListeners();
	};
	
	p._createTFChessBackground = function() {
		var context = this.tfViewCanvas.getContext("2d");
		context.beginPath();
		
		context.fillRect(0, 0, chessSquareSize, chessSquareSize);
		context.fillRect(chessSquareSize, chessSquareSize, chessSquareSize, chessSquareSize);
		
		context.fillStyle="#000";
		context.stroke();
		context.closePath();
		
		var base64 = this.tfViewCanvas.toDataURL();
		this.tfViewCanvas.style.backgroundImage = "url("+base64+")";	
	};
	
	p.applyImageToWidget = function(tfImage) {
		this.tfWidth = (tfImage) ? tfImage.width : this.tfData.width;
		this.tfViewCanvas.width = this.tfWidth;
		this.tfViewCanvas.height = this.tfViewHeight;
		this.tfEditorCanvas.width = this.tfWidth;
		
		if (tfImage) {
			var context = this.tfViewCanvas.getContext("2d");
			context.drawImage(tfImage, 0, 0, tfImage.width, 1, 0, 0, this.tfWidth, this.tfViewHeight); 
			this.tfData = context.getImageData(0, 0, this.tfWidth, 1);	
		}
		
		this.applyDataToWidget();
	};
	
	p.applyDataToWidget = function() {
		this._drawToViewCanvas();
		this._drawColorChannels();
	};

	p._createCanvas = function(width, height) {
		var newCanvas = document.createElement("canvas");
		newCanvas.width = width;
		newCanvas.height = height;
		newCanvas.style.outline = "1px solid black";
		return newCanvas;
	};
	
	p._createButton = function(text) {
		var newButton = document.createElement("button");
		newButton.textContent = text;
		newButton.style.marginLeft = "5px";
		return newButton;
	};	

	p._createCheckBox = function(text) {
		var id = "checkboxFor"+this.shaderElementId;
		var newCheckbox = document.createElement("input");
		newCheckbox.type = "checkbox";
		newCheckbox.id = id;
		newCheckbox.name = "name";
		newCheckbox.style.marginLeft = "5px";

		var newLabel = document.createElement("label")
		newLabel.htmlFor = id;
		newLabel.textContent = text;
		newLabel.style.marginLeft = "5px";

		return { checkbox: newCheckbox,
				 label:    newLabel };
	};
	
	p._addColorChannelsToCombo = function(combo) {
		var optionItem;
		
		for (var channel in colorChannels) {
			optionItem = document.createElement("option");
			optionItem.text = channel;
			combo.options.add(optionItem);
		}
	};	
	
	p.addEventListeners = function() {
		var that = this;
		
		this.tfEditorCanvas.addEventListener("mousedown", function(event){ that.onMouseDown(event); }, false);
		this.tfEditorCanvas.addEventListener("mousemove", function(event){ that.onMouseMove(event); }, false); // TODO maybe add listener to the document (not to canvas)
		//document.addEventListener("mousemove", function(event){ that.onMouseMove(event); }, false);		   // this makes work with widget more convenient, but so far bug with coordinates exists
		document.addEventListener("mouseup", function(event){ that.onMouseUp(); }, false);
		this.colorChannelsCombo.addEventListener("change", function(event){ that.changeColorChannel(event); }, false);
		
		this.bSave.addEventListener("click", function(){ that.saveCurrentTFToFile(); }, false);
		this.bOpen.addEventListener("click", function(){ that.openTFFromFile(); }, false);
	};
	
	p.changeColorChannel = function(list) {
		this.selectedColorChannel = list.target.selectedIndex;
	};	
	
	p.saveCurrentTFToFile = function() {
		// there are no easy ways to create SaveFileDialog in Javascript
		// possible ways suppose hacking with server headers (content-disposition attachment) and complicated client server POST / GET interactions
		// that is why flash widgets were created, e.g. ==>
		//		http://www.gieson.com/Library/projects/utilities/opensave/ 
		//		https://github.com/dcneiner/Downloadify
		// for simplicity we do not support SaveFileDialog, but just save file with default name in Downloads folder
		
		if (!this.saveToFileLink) {
			this.saveToFileLink = document.createElement("a");
			this.saveToFileLink.style.display = "none";
			this.parentDiv.appendChild(this.saveToFileLink); // without this save does not work in Firefox
			this.saveToFileCanvas = this._createCanvas(0, 1);
		}
		
		if (this.chbFormat.checkbox.checked)
			this.saveToTextFile();
		else
			this.saveToImgFile();
			
		// another way to save TF - open in new window, where user will be able to chose file location (using standard popup menu)
		// window.open(this.base64, "transfer_function.png"); 
	};
	
	p.saveToImgFile = function() {
		this.saveToFileLink.download = tfDefaultSaveImgFileName;
		
		this.saveToFileCanvas.width = this.tfWidth;
		var context = this.saveToFileCanvas.getContext("2d");
		context.putImageData(this.tfData, 0, 0);
		
		this.saveToFileLink.href = this.saveToFileCanvas.toDataURL();
		this.saveToFileLink.click();
	};
	
	p.saveToTextFile = function() {
		this.saveToFileLink.download = tfDefaultSaveTextFileName;
		var data = this.tfData.data;
		
		var content = "1DTF\r\n";
		content += (data.length/4)+"\r\n";
		
		for (var i=0; i<data.length; i+=4)
			content += data[i]+" "+data[i+1]+" "+data[i+2]+" "+data[i+3]+"\r\n";
		
		this.saveToFileLink.setAttribute('href', 'data:text/csv;base64,' + window.btoa(content));
		this.saveToFileLink.click(); 
	};
	
	p.openTFFromFile = function() {
		this._getFileDialog().click();
	};
	
	p._getFileDialog = function() {
		if (!this.openFileDialog) {
			var that = this;
			this.openFileDialog = document.createElement("input");
			this.openFileDialog.type = "file";
			this.openFileDialog.addEventListener("change", function(event){ that._loadTFFromFile(event); }, false);
		}
		
		if (this.chbFormat.checkbox.checked)
			this.openFileDialog.accept = ".tf";
		else
			this.openFileDialog.accept = "image/*";
			
		return this.openFileDialog;
	};
	
	p._loadTFFromFile = function(event) {
		var file = event.target.files[0];
		var objectURL = window.URL.createObjectURL(file);
		
		if (file.type.indexOf("image/") == 0)
			this._loadTFFromImgFile(objectURL);
		else {
			var fileExtension = "";
			var fileName = file.name;
			if (fileName.lastIndexOf(".") > 0) {
				fileExtension = fileName.substring(fileName.lastIndexOf(".") + 1, fileName.length);
			}
			if (fileExtension == "tf") {
				this._loadTFFromTextFile(objectURL);
			}
			else {
				alert("You must select an image file or *.tf file.");
			}
		}
	};

	p._loadTFFromImgFile = function(objectURL){
		var that = this;
		var image = document.createElement("img");
		image.src = objectURL;
		image.onload = function(event)
		{
			that.applyImageToWidget(event.target);
			that.updateTexture();
		};
	};
	
	p._loadTFFromTextFile = function(objectURL){
		var that = this;
		var xhr;
		xhr = new XMLHttpRequest;
		xhr.open("GET", objectURL, true);
		xhr.responseType = "blob";
		
		xhr.onload = function() {
			var file = xhr.response;
			var reader = new FileReader();

			reader.onloadend = function(evt) {
				if (evt.target.readyState == FileReader.DONE) { 
					var str_ = evt.target.result;
							
					var lines = str_.split('\n');
					var iline = 2;
					
					if (lines[0].trim().toLowerCase() != "1dtf")
						return;
					
					var tfWidth = Number(lines[1].trim());
					
					var lineData;
					var k = 0;
					
					if (that.tfData.width != tfWidth) {
						var context = that.tfViewCanvas.getContext("2d");
						that.tfData = context.createImageData(tfWidth, 1);
					}
					
					var data = that.tfData.data;
					
					var maxLine = Math.min(iline+tfWidth, lines.length);
					
					while (iline < maxLine) {
						lineData = lines[iline].trim().split(" ");
						data[k++] = lineData[0];
						data[k++] = lineData[1];
						data[k++] = lineData[2];
						data[k++] = lineData[3];
						iline++;
					}
					
					that.applyImageToWidget();
					that.updateTexture();
				}
			}

			reader.readAsText(file);
		}
		return xhr.send(null);
	};
	
	p._drawColorChannels = function() {
		var context = this.tfEditorCanvas.getContext("2d");
		context.clearRect(0, 0, this.tfWidth, this.tfEditorHeight);
		context.lineWidth = 1;

		var idx = 0;
		for (var channel in colorChannels) {
			this._drawChannel(context, idx++, colorChannels[channel]);
		}
	};
	
	p._drawChannel = function(context, n, color) {
		context.beginPath();
		
		var y = this.tfEditorHeight - this.tfData.data[n];
		
		var prevY = y;
		var prevX = 0;
		var i;
		
		for (var x=1; x<this.tfWidth; x++) {
			i = 4*(x-1);
			y = this.tfEditorHeight - this.tfData.data[i+n];
		
			context.moveTo(prevX, prevY);
			context.lineTo(x, y);
			prevX = x;
			prevY = y;
		}
			
		context.strokeStyle = color;
		context.stroke();
		context.closePath();
	};
	
	p.onMouseDown = function(event){
		this.startTracking = true;
		
		var rect = event.target.getBoundingClientRect();	
		this.trackX = (event.clientX - rect.left);
		//console.log("trackX " + trackX);
		this.onMouseMove(event);
	};
	
	p.onMouseMove = function(event){
		if (!this.startTracking) { return; }

		var rect = event.target.getBoundingClientRect();
		var start_, end_;
		
		var X = (event.clientX - rect.left)+1;
		var Y = this.tfEditorHeight - (event.clientY - rect.top) - 1;
		
		if (X < this.trackX) {
			start_ = X;
			end_ = this.trackX;
		}
		else {
			start_ = this.trackX;
			end_ = X;
		}
		
		start_ = Math.round(start_);
		end_ = Math.round(end_);
		var k;
		//console.log("start_ end_ " + start_ + " " + end_);
		
		for (var i=start_; i<=end_; i++) {
			k = 4*(i-1);
			this.tfData.data[k+this.selectedColorChannel] = Y;
		}
		
		this.trackX = X;
		
		this.applyDataToWidget();
		this.updateTexture();
	};
	
	p._drawToViewCanvas = function() {
		var context = this.tfViewCanvas.getContext("2d");
		for (var i=0; i<=this.tfViewHeight; i++) {
			context.putImageData(this.tfData,0,i);
		}
	};
	
	p.onMouseUp = function(event) {
		this.startTracking = false;
	};
	
	p.getWebGLAdapter = function(elem) {
		if (elem._configured) {
			for (var i in elem._configured.adapters) {
				if (i.indexOf("webgl") == 0) {
					return elem._configured.adapters[i];
				}
			}
		}
		return null;
	};

	p.getContextForElement = function(elem) {
		var adapter = this.getWebGLAdapter(elem);
		var factory = adapter ? adapter.factory : null;
		var renderer = factory ? factory.getRenderer() : null;
		return renderer ? renderer.context : null;
	};
	
	p.updateTexture = function() {
		XML3D.webgl.transferFunctionWidgets[this.shaderElementId] = this.tfData;
		this.context.requestRedraw("Transfer function for volume was updated from widget.");
	};
	
	// Export to XML3D namespace
    XML3D.TransferFunctionWidget = TransferFunctionWidget;

}());
