(function () {

    var module = XML3D.webgl;

    module.events.available.push("click", "dblclick", "mousedown", "mouseup", "mouseover", "mousemove", "mouseout", "mousewheel");

    XML3D.extend(module.CanvasHandler.prototype, {
        /**
         * @param {MouseEvent} event  The original event
         * @param {Element} target  target to dispatch on
         * @param {object}     opt    Options
         */
        dispatchMouseEvent:function (event, target, opt) {
            opt = opt || {};
            target = target || this.xml3dElem;
            var x = opt.x !== undefined ? opt.x : event.clientX;
            var y = opt.y !== undefined ? opt.y : event.clientY;
            var noCopy = opt.noCopy || false;

            // Copy event to avoid DOM dispatch errors (cannot dispatch event more
            // than once)
            event = noCopy ? event : this.copyMouseEvent(event);
            this.initExtendedMouseEvent(event, x, y);

            target.dispatchEvent(event);
        },

        /**
         * @param {MouseEvent} event the event to copy
         * @return {MouseEvent} the new event
         */
        copyMouseEvent:function (event) {
            var evt = document.createEvent("MouseEvents");
            evt.initMouseEvent(event.type,
                // canBubble, cancelable, view, detail
                event.bubbles, event.cancelable, event.view, event.detail,
                // screenX, screenY, clientX, clientY
                event.screenX, event.screenY, event.clientX, event.clientY,
                // ctrl, alt, shift, meta, button
                event.ctrlKey, event.altKey, event.shiftKey, event.metaKey, event.button,
                // relatedTarget
                event.relatedTarget);
            if (event.dataTransfer)
                evt.data = {url:event.dataTransfer.getData("URL"), text:event.dataTransfer.getData("Text")};
            // override preventDefault to actually prevent the default of the original event
            evt.preventDefault = function(){
                event.preventDefault();
            };
            return evt;
        },

        createMouseEvent:function (type, opts) {
            opts = opts || {};
            var event = document.createEvent("MouseEvents");
            event.initMouseEvent(type,
                opts.canBubble !== undefined ? opts.canBubble : true,
                opts.cancelable !== undefined ? opts.cancelable : true,
                opts.view || window,
                opts.detail != undefined ? opts.detail : 0,
                opts.screenX != undefined ? opts.screenX : 0,
                opts.screenY != undefined ? opts.screenY : 0,
                opts.clientX != undefined ? opts.clientX : 0,
                opts.clientY != undefined ? opts.clientY : 0,
                opts.ctrl != undefined ? opts.ctrl : false,
                opts.alt != undefined ? opts.alt : false,
                opts.shift != undefined ? opts.shift : false,
                opts.meta != undefined ? opts.meta : false,
                opts.button != undefined ? opts.button : 0,
                opts.relatedTarget);
            return event;
        },

        /**
         * Adds position and normal attributes to the given event.
         *
         * @param {Event} event
         * @param {number} x
         * @param {number} y
         * @return {XML3DVec3}
         */
        initExtendedMouseEvent:function (event, x, y) {

            var handler = this;
            var xml3dElem = this.xml3dElem;

            (function () {
                var cachedPosition = undefined;
                var cachedNormal = undefined;

                event.__defineGetter__("normal", function () {
                    if (cachedNormal !== undefined) return cachedNormal;
                    var norm = (handler.getWorldSpaceNormalByPoint(x, y));
                    cachedNormal = norm ? new window.XML3DVec3(norm[0], norm[1], norm[2]) : null;
                    return cachedNormal;
                });
                event.__defineGetter__("position", function () {
                    if (!cachedPosition) {
                        var pos = handler.getWorldSpacePositionByPoint(x, y);
                        cachedPosition = pos ? new window.XML3DVec3(pos[0], pos[1], pos[2]) : null;
                    }
                    return cachedPosition;
                });

            })();


        },

        setMouseMovePicking:function (isEnabled) {
        },

        /**
         * @param {MouseEvent} evt
         * @param {object?} opt
         */
        dispatchMouseEventOnPickedObject:function (evt, opt) {
            opt = opt || {};
            var pos = this.getMousePosition(evt);

            var picked = null;
            if (!opt.omitUpdate)
                picked = this.getPickObjectByPoint(pos.x, pos.y);

            this.dispatchMouseEvent(evt, picked && picked.node, pos);
        },

        getMousePosition:function (evt) {
            var rct = this.canvas.getBoundingClientRect();
            return {
                x:(evt.clientX - rct.left),
                y:(evt.clientY - rct.top)
            };
        },


        /**
         * @param {MouseEvent} evt
         */
        mouseup:function (evt) {
            this.dispatchMouseEventOnPickedObject(evt, {omitUpdate : !this.renderOptions.pickingEnabled});
        },

        /**
         * @param {MouseEvent} evt
         */
        mousedown:function (evt) {
            this.dispatchMouseEventOnPickedObject(evt, {omitUpdate : !this.renderOptions.pickingEnabled});
        },


        /**
         * @param {MouseEvent} evt
         */
        click:function (evt) {
            // Click follows always 'mouseup' => no update of pick object needed
            // Felix: Removed optimization, as this resulted in passing 'null' as event target.
            this.dispatchMouseEventOnPickedObject(evt /*, { omitUpdate:true } */);
        },

        /**
         * @param {MouseEvent} evt
         */
        dblclick:function (evt) {
            // Click follows always 'mouseup' => no update of pick object needed
            // Felix: Removed optimization, as this resulted in passing 'null' as event target.
            this.dispatchMouseEventOnPickedObject(evt /*, { omitUpdate:true } */);
        },

        /**
         * This method is called each time a mouseMove event is triggered on the
         * canvas.
         *
         * This method also triggers mouseover and mouseout events of objects in the
         * scene.
         *
         * @param {MouseEvent} evt
         */
        mousemove:function (evt) {
            var pos = this.getMousePosition(evt);
            this.dispatchMouseEventOnPickedObject(evt, {omitUpdate : !this.renderOptions.mouseMovePickingEnabled});
            if (!this.renderOptions.mouseMovePickingEnabled)
                return;

            var curObj = this.renderer.pickedObject ? this.renderer.pickedObject.node : null;

            // trigger mouseover and mouseout
            if (curObj !== this.lastPickObj) {
                if (this.lastPickObj) {
                    // The mouse has left the last object
                    this.dispatchMouseEvent(this.createMouseEvent("mouseout", {
                        clientX:pos.x,
                        clientY:pos.y,
                        button:evt.button
                    }), this.lastPickObj);
                    if (!curObj) { // Nothing picked, this means we enter the xml3d canvas
                        this.dispatchMouseEvent(this.createMouseEvent("mouseover", {
                            clientX:pos.x,
                            clientY:pos.y,
                            button:evt.button
                        }), this.xml3dElem);
                    }
                }
                if (curObj) {
                    // The mouse is now over a different object, so call the new
                    // object's mouseover method
                    this.dispatchMouseEvent(this.createMouseEvent("mouseover", {
                        clientX:pos.x,
                        clientY:pos.y,
                        button:evt.button
                    }), curObj);
                    if (!this.lastPickObj) { // Nothing was picked before, this means we leave the xml3d canvas
                        this.dispatchMouseEvent(this.createMouseEvent("mouseout", {
                            clientX:pos.x,
                            clientY:pos.y,
                            button:evt.button
                        }), this.xml3dElem);
                    }
                }

                this.lastPickObj = curObj;
            }
        },

        /**
         * @param {MouseEvent} evt
         */
        mouseout:function (evt) {
            var pos = this.getMousePosition(evt);
            this.dispatchMouseEvent(evt, this.lastPickObj, pos);
        },

        /**
         * @param {MouseEvent} evt
         */
        mouseover:function (evt) {
            var pos = this.getMousePosition(evt);
            this.dispatchMouseEventOnPickedObject(evt, {omitUpdate : !this.renderOptions.mouseMovePickingEnabled});
        },

        /**
         * @param {MouseEvent} evt
         */
        mousewheel:function (evt) {
            var pos = this.getMousePosition(evt);
            // note: mousewheel type is not W3C standard, used in WebKit!
            this.dispatchMouseEventOnPickedObject(evt);
        }

    });

}());
