/**
 *  MarkLogic mlux
 *  
 *  Copyright 2010-2014 MarkLogic Corporation. All Rights Reserved.
 *   
 *  MarkLogic library for MarkLogic common and shared functions, objects, etc. 
 *  It requires mlux-console.js
 *
 **/


/**
 * MarkLogic namespace  
 *
 * */
(function(){

    this.MarkLogic = this.MarkLogic || {};
    this.$ml = this.MarkLogic;

    //this.$ = jQuery.noConflict();

    if (this.MarkLogic.version) {
        return;
    }

    $.extend(this.MarkLogic, {
        version: "0.1.0",
        jquery: "1.4.3",
        fun: {},
        ui: {},
        client: {}
    }); 

})();


/**
 * Common functions of MarkLogic.fun 
 */
(function(fun){
	
    $.extend(fun, { 

    }); 

})(MarkLogic.fun);


/**
 *  MarkLogic.fun.browser.os
 *  providing OS information of the browser.
 **/
(function(fun){

    fun.browser = fun.browser || {};

    $.extend(fun.browser, {
        os: {
            name: function () {
                 var osName = 'Unknown OS';
                 if (navigator.appVersion.indexOf("Win")!=-1) {  
                     osName="Windows";
                     return osName; 
                 }
                 if (navigator.appVersion.indexOf("Mac")!=-1) { 
                     osName="MacOS";
                     return osName; 
                 }
                 if (navigator.appVersion.indexOf("X11")!=-1) { 
                     osName="UNIX";
                     return osName; 
                 } 
                 if (navigator.appVersion.indexOf("Linux")!=-1) { 
                     osName="Linux";
                     return osName; 
                 } 
                 return osName; 
            },

            win: function () {
                 if (navigator.appVersion.indexOf("Win")!=-1) { 
                     return true; 
                 } 
                 return false; 
            },

            mac: function () {
                 if (navigator.appVersion.indexOf("Mac")!=-1) { 
                     return true; 
                 } 
                 return false; 
            },

            linux: function () {
                 if (navigator.appVersion.indexOf("Linux")!=-1) { 
                     return true; 
                 } 
                 return false; 
            },

            x11: function () {
                 if (navigator.appVersion.indexOf("X11")!=-1) { 
                     return true; 
                 } 
                 return false; 
            }
        }
    });

    //Shortcut when use with $ml 
    $ml.browser = $ml.browser || {};
    $.extend(true, $ml.browser, fun.browser);

    // Use as jQuery extension 
    $.extend(true, $.browser, fun.browser);

})(MarkLogic.fun);


/**
 *  MarkLogic.fun.json
 *  A collection of JSON related methods 
 **/
(function(fun){

    $.extend(fun, {
        json: {
            /**
             * This method parses a JSON text to produce an object or array.
             * It can throw a SyntaxError exception.
             * @param text: text string to parse
             * @param reviver: optional callback function that can filter and transform results
             * @return: JSON object
             * */  
            parse: function(text, reviver) {
                return JSON.parse(text, reviver);
            },

            /**
             * This method serializes a JSON object into a string
             * @param value: JSON object to serialize
             * @param replacer: optional. function / array / string. 
             *      It determines how object values are stringified for objects. 
             * @param space: optional.
             * @return: string 
             * */  
            stringify: function(value, replacer, space) {
                return JSON.stringify(value, replacer, space);
            },

            serialize: function(value, replacer, space) {
                return JSON.stringify(value, replacer, space);
            },
            
            /**
             * get partial object from an object 
             **/   
            getObject: function(name, obj) {
                var nameSplit = name.split(".") || new Array();
                for (var i =0, limit = nameSplit.length; i < limit; i++) {
                    if (i === limit-1) {
                        return obj[nameSplit[i]];
                    }
                    obj = obj[nameSplit[i]];
                }
            },

            /**
             * allocate object constructor 
             * Usage: var a = new Allocate(args);
             * @param args: json object
             * @return
             * */  
           Allocate: function(args) {
                if(typeof args === "object"){
                    $.extend(this, args);
                } else if (typeof args === "string") {
                    try{ 
                        var argsObj = fun.json.parse(args) || {}; 
                        $.extend(this, argsObj);
                    }catch(e) {
                    }
                } else {
                    return;
                } 
           }
        }

    });

    $.extend(fun.json.Allocate.prototype, {
        
        /**
         *  Get a property value
         *  @param name:  string, a property name to get
         *  @return: property value 
         **/  
        get: function(name) {
            if (typeof name !== "string") return false;

            var selfObj = this || {};
            var nameSplit = name.split(".") || [];       
            for (var i = 0, limit = nameSplit.length; i < limit; i++) {
                if (i === limit - 1) {
                    return selfObj[nameSplit[i]];
                } 
                selfObj = selfObj[nameSplit[i]] || {}; // empty obj a crutch for cases like get("x.y") where even x doesn't exist
            }
        },

        /**
         *  Set a property
         *  @param name:  a property name to set
         *  @param value:  a property value to set 
         *  @return: entire property object
         **/  
        set: function(name, value) {
            if (typeof name !== "string") return false;
            
            var selfObj = this || {};
            var nameSplit = name.split(".") || [];
            var oldValue;
            
            // ensure that a path to the leaf exists
            for (var i = 0, limit = nameSplit.length; i < limit; i++) {
                if (i === limit - 1) {
                    // leaf
                    oldValue = selfObj[nameSplit[i]];
                    selfObj[nameSplit[i]] = value;
                    this.changed(name, oldValue, value);
                } else {
                    // non-leaf
                    if (!selfObj[nameSplit[i]]) {
                        selfObj[nameSplit[i]] = {}; // TODO: check if nameSplit[i] starts with digit, and create array instead
                    }
                    selfObj = selfObj[nameSplit[i]];
                }
            
            }
            return this;
        },

        /**
        *  Append to an array
        *  @param name: a property name, must point to an array
        *  @param value: a property value to append
        *  @return: ?
        **/
        append: function(name, value) {
            var arr = this.get(name);
            arr.push(value);
            this.changed(name, undefined, arr); // want to avoid copying the entire array, just to pass it as oldValue...
        },

        /**
        *  mark a property as changed (normally, you wouldn't call this directly, but if you modify something outside of mlux, you need to call it)
        * @param name: the property name that changed
        * @param oldValue: the previous value
        * @param newValue: the new value
        * @return: none
        */
        changed: function(name, oldValue, newValue) {
            if (!this._onchange) this._onchange = {};
            var listeners = this._onchange[name] || [];
            for (var j = 0; j < listeners.length; j++) {
                listeners[j](name, oldValue, newValue);
            }
        },

        /**
         *  watch a property. 
         *  @param name: a property name to watch 
         *  @param callback: a callback function on change of a property, with signature (mluxpath, oldVal, newval)
         *  @return: an object with an unwatch method that can be called later
         **/  
        onchange: function(name, callback) {
            if (!this._onchange) this._onchange = {};
            var callbacks = this._onchange[name];
            if (!callbacks) {
                this._onchange[name] = [callback];
            } else {
                this._onchange[name].push(callback);
            }
            
            return {
                unwatch: function(){
                    // TODO:
                    //callbacks[name].splice($.inArray(callbacks[name], callback), 1);
                }
            };
        },

        /**
         *  Remove a property
         *  @param name: a property name to remove
         *  @return: true if removed, false if not removed
         **/  
        remove: function(name) {
            var oldValue = this[name] || '';
            if(this._onWatch){
                this._onWatch(name, oldValue, undefined);
            }
            return delete this[name];
        },

        /**
         *  Serialize JSON object into a string 
         *  @return: string 
         **/  
        serialize: function() {
            return fun.json.serialize(this);
        }

    });

    // Shortcut when use with $ml 
    $ml.json = $ml.json || {};
    $.extend(true, $ml.json, fun.json);

    // Use as jQuery extension 
    $.json = $.json || {};
    $.extend(true, $.json, fun.json);

})(MarkLogic.fun);


/**
 * MarkLogic.client namespace  
 *
 * */
(function($ml){

    $ml.client = $ml.client || {};

})(MarkLogic);


/**
 *  MarkLogic.client.AppUtil 
 *  Application utility object
 */
(function(client){
   
    client.AppUtil = function(appObj) {
        this.setApp(appObj);
    }; 
	
    $.extend(client.AppUtil.prototype, { 

        _appObj: {},

        setApp: function(appObj) {
            this._appObj = appObj;
            return this._appObj;
        },

        getApp: function() {
            return this._appObj;
        },

        setEnv: function (branch) {
            var app = this.getApp();
            $.extend(app.env,
                     $ml.fun.json.getObject('defaults', app.envAll),
                     $ml.fun.json.getObject(branch, app.envAll));
            return true;
        },

        getEnv: function (str) {
            var app = this.getApp();
            return $ml.fun.json.getObject(str, app.env);
        },

        setLanguage: function (language) {
        },

        getLanguage: function () {
            var lang = '';
            return lang;
        },

        load: function() {
        },

        unload: function() {
            // provent memory leaking
            $(window).unload(function() {
                $('*').unbind();
            });
        },

        addComponent: function(name, obj) {
            var app = this.getApp();
//            if (typeof app.components === 'undefined') {
//                app.components = new function() {
//                }
//            } 
            switch (typeof obj) {
                case 'function': 
                    app.components[name] = obj; 
                    break;
                default: 
                    if (!app.components[name]) 
                        app.components[name] = obj; 
                    break;
            }
            return true;
        },

        getComponent: function(name) {
            var app = this.getApp();
            return app.components[name]; 
        },

        log : function(){
            //dev branch or attach _debug=1
            if (this.getEnv('branch') == 'dev') {
                $('#log').append('<p>' + $.makeArray(arguments).join(", ") + "</p>")
            }
        }
    });
    
})(MarkLogic.client);


/**
 *  MarkLogic.client.Model 
 *  Client Model object
 */
(function(client){
   
    client.Model = function(appUtil) {
        this.appUtil = appUtil;
    }; 
	
    $.extend(client.Model.prototype, { 
    });


})(MarkLogic.client);


/**
 *  MarkLogic.client.AJAX 
 *  urlName: string, name of url used in environment object such as 'query.request'.
 *  The additional parameters can be passed in by adding name and value pairs into options.params as $.ajax. 
 *  otherwise, set urlName = ''
 *  options: object, additional optional arguments to pass into ajax call as $.ajax
 *  To pass in all arguments in options, set urlName=''
 *  To overwrite the defaults, put them in options
 */
(function(client){
   
    client.AJAX = function(appUtil) {
        this.appUtil = appUtil;
    }; 
	
    $.extend(client.AJAX.prototype, { 

        get: function(urlName, options){
            //default
            var obj = {
                url: '',
                type: 'GET',
                success:function(response, status, xhr){
                    var contentType = xhr.getResponseHeader("content-type") || "";
                    // write a message into log  
                },
                error:function(xhr, status, e){
                    var errorMessage = 'Error: communication could not be established with the server'; 
                    // write a message into log  
                }
            };
            if (typeof options === 'object') {
                $.extend(true, obj, options);
            }
            if (urlName !== '') {
                var url = this.appUtil.getEnv(urlName);
                if (url == '' || url == null) {
                    url = urlName;
                }
                /*url += '?pid=' + '5068101229147883363';
                url += '&v=' + this.appUtil.getEnv('version'); 
                if (this.appUtil.getEnv('branch') == 'dev') {
                    var date = new Date();
                    url += '&t=' + date.getTime(); 
                }*/
                
                // Hack from BMO
                if (options.params)  {
                    url += options.params;
                }
                $.extend(true, obj, {url: url});
            }            
            return $.ajax(obj);
        },

        post: function(urlName, options){
            //default
            var obj = {
                url: '',
                type: 'POST',
                contentType: 'application/json',
                dataType: 'json',
                success:function(response, status, xhr){
                    var contentType = xhr.getResponseHeader("content-type") || "";
                    //if (contentType.indexOf('json') > -1) {
                        // handle json here
                        if(options && options.success ){
                            options.success(response);
                        }
                    //} 
                    //if (contentType.indexOf('html') > -1) {
                        //handle html;
                    //}
                },
                error:function(xhr, status, e){
                    if(options && options.error){
                        options.error({
                             status: status,
                             msg: 'network error'+e
                        });
                    }
                }
            };
            if (typeof options === 'object') {
                $.extend(true, obj, options);
            }
            if (urlName !== '') {
                var url = this.appUtil.getEnv(urlName);
                if (url == '' || url == null) {
                    url = urlName;
                }
                /*url += '?pid=' + '5068101229147883363';
                url += '&v=' + this.appUtil.getEnv('version'); 
                if (this.appUtil.getEnv('branch') == 'dev') {
                    var date = new Date();
                    url += '&t=' + date.getTime(); 
                }*/
                
                // Hack from BMO
                if (options.params)  {
                    url += options.params;
                }
                $.extend(true, obj, {url: url});
            } 
            $.ajax(obj);
            return;
        },

        update: function(urlName, options) {
            var url = this.appUtil.getEnv(urlName);
            url += '?action=' + 'update';
            url += '&pid=' + '5068101229147883363';
            url += '&v=' + this.appUtil.getEnv('version'); 
            if (this.appUtil.getEnv('branch') == 'dev') {
                var date = new Date();
                url += '&t=' + date.getTime(); 
            }

            $.ajax({
                url: url,
                type: 'POST',
                contentType: 'application/json',
                cache: false,
                success:function(page){
                    if(options && options.success ){
                        options.success(page);
                    }
                },
                error:function(xhr, status, e){
                    if(options && options.error){
                        options.error({
                             status: status,
                             msg: 'network error'+e
                        });
                    }
                }
            });
            return;
        },

        remove: function(urlName, options){
            //default
            var obj = {
                url: '?action=' + 'delete',
                type: 'GET',
                success:function(response, status, xhr){
                    var contentType = xhr.getResponseHeader("content-type") || "";
                    //if (contentType.indexOf('json') > -1) {
                        // handle json here
                        if(options && options.success ){
                            options.success(response);
                        }
                    //} 
                    //if (contentType.indexOf('html') > -1) {
                        //handle html;
                    //}
                },
                error:function(xhr, status, e){
                    if(options && options.error){
                        options.error({
                             status: status,
                             msg: 'network error'+e
                        });
                    }
                }
            };
            if (typeof options === 'object') {
                $.extend(true, obj, options);
            }
            if (urlName !== '') {
                var url = this.appUtil.getEnv(urlName);
                if (url == '' || url == null) {
                    url = urlName;
                }
                /*url += '?pid=' + '5068101229147883363';
                url += '&v=' + this.appUtil.getEnv('version'); 
                if (this.appUtil.getEnv('branch') == 'dev') {
                    var date = new Date();
                    url += '&t=' + date.getTime(); 
                }*/
                
                // Hack from BMO
                if (options.params)  {
                    url += options.params;
                }
                $.extend(true, obj, {url: url});
            } 
            $.ajax(obj);
            return;
        }
    });
    
})(MarkLogic.client);

