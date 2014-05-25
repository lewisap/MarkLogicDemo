/**
 *   MarkLogic mlux.1.0.0
 *   This file requires jquery.js and mlux.js
 *  
 *    Copyright 2010-2014 MarkLogic Corporation. All Rights Reserved.
 *   
 **/


/**
 * MarkLogic.ui namespace object for MarkLogic common UI objects 
 *
 * */
(function(ui){

    ui = ui || {};

    if (ui.version) {
        return;
    }

    $.extend(ui, {
        version: "0.1.0",
        jquery: "1.4.3",
        mlux: "0.1.0 "
    });

})(MarkLogic.ui);


/**
 * MarkLogic.ui.shortcutKeys object
 *
 * */  
(function(ui){
    $.extend(ui, {
        /**
         * Default key map, works for windows and linux 
         * Key codes here are from jQuery's event.which.
         * Only included the keys in current use 
         **/
        keyCode: { 
            'ARROW_LEFT': 37, 
            'LEFT': 37,
            'ARROW_UP': 38, 
            'UP': 38,
            'ARROW_RIGHT': 39, 
            'RIGHT': 39,
            'ARROW_DOWN': 40, 
            'DOWN': 40,
            'ALT': 18,
            'OPTION': 18,            
            'BACKSPACE': 8,
            'CAPS_LOCK': 20,
            'COMMA': 188,
            ',': 188, 
            'COMMAND': 91,
            'COMMAND_LEFT': 91, // COMMAND
            'CMD': 91,
            'WINDOWS': 91, // COMMAND
            'COMMAND_RIGHT': 93,
            'CTRL': 17, 
            'DELETE': 46,
            'END': 35,
            'ENTER': 13,
            'ESCAPE': 27,
            'HOME': 36,
            'INSERT': 45,
            'MENU': 93, // COMMAND RIGHT
            'PAGE_DOWN': 34,
            'PAGE_UP': 33,
            'PERIOD': 190,
            '.': 190, 
            'SHIFT': 16,
            'SPACE': 32,
            'TAB': 9,
            ';': 59, 
            '=': 187, 
            '-': 189, 
            '/': 191,
            "'": 222 
        },

        /**
         * Specific keys codes for MAC
         * Key codes here are from jQuery's event.which.
         * Only included the keys in current use
         **/
        keyCodeFirefoxMAC: {
            '=': 61,
            'CMD': 224,
            '-': 109
        },

        /**
         * Specific keys codes for IE 
         * Key codes here are from jQuery's event.which.
         * Only included the keys in current use
         **/
        keyCodeFirefoxWin: {
            '=': 107,
            '-': 109
        },

        modifiers: {
            16: 'SHIFT',
            17: 'CTRL',
            18: 'ALT/Option'
        },

        getKeyCodeMap: function() {
            var keyCode = ui.keyCode;
            if ($ml.browser.os.mac()) {                
                if ($.browser.mozilla) {  
                    $.extend(true, keyCode, ui.keyCodeFirefoxMAC);
                }
            }
            if ($ml.browser.os.win()) {      
                if ($.browser.mozilla) {  
                    $.extend(true, keyCode, ui.keyCodeFirefoxWin);
                }
            }
            
            return keyCode;
        },

        getKeyCodeFromChar: function(charArray) {
            var ret = new Array();
            var keyCode = ui.getKeyCodeMap();

            for (var i in charArray) {
                var mapped = keyCode[charArray[i].toUpperCase()];
                if (mapped != undefined) {
                    ret[i] = mapped;
                } else {
                    ret[i] = charArray[i].toUpperCase().charCodeAt(0);
                }
            }
            return ret;
        },

        getCharFromKeyCode: function(keyCodeArray) {
            var ret = new Array();
            var keyCode = ui.getKeyCodeMap();
            for (var i in keyCodeArray) {
                for (var key in keyCode) {
                    if (keyCode[key] == keyCodeArray[i]) {
                        ret[i] = key;
                        break;
                    }
                }

                if (ret[i] === undefined) {
                    ret[i] = String.fromCharCode(keyCodeArray[i]);
                } 
            }
            return ret;
        },

        /*
         * Handle shortcut keys 
         **/  
        ShortcutKeys: function(element, obj, propagate, preventDefault) {
            var sKey = this;
            this.element = element;
            this.obj = obj;
            this.keyFired = false;
            
            this.propagate = (propagate !== undefined) ? propagate : false;
            this.preventDefault = (preventDefault !== undefined) ? preventDefault : true;
            
            //check if the focus on any form element
            var formElements  = new Array("input", "select", "textarea", "button");
            var onFormElement = false;
            for (var i in formElements) {
                $(formElements[i]).focus( function () {
                    onFormElement = true;
                });
                $(formElements[i]).blur( function () {
                    onFormElement = false;
                });
            }

            // get key code of the keys of obj. 
            var objKeys = {};
            for (var key in obj) {
                 var iKeys = key.split("+");
                 iKeys = ui.getKeyCodeFromChar(iKeys);
                 objKeys[key] = iKeys.sort();
            }
            
            var currentKeys 			= new Array(),
                currentModifiers 		= new Array(),
                _handleKeyUp,
                keyPressedMaxDuration 	= 3500,  // duration in ms
                keyPressTracking 		= {};
            
            // check if any keys have been pressed for longer than the 
            // maximum duration allowed.  If so, clear them.
            // This change was implemented to fix issues around "sticky keys"
            // occurring when we were not able to catch key-up events due
            // to losing browser window context.
            var keyPressDurationCheck = setInterval(function() {
            	$.each(keyPressTracking,function(key,timePressed) {
            		var currentTime = new Date().getTime();
            		if ((currentTime - timePressed) > keyPressedMaxDuration) 
            			_handleKeyUp(key);
            	})
            }, 1000);
            
            _handleKeyUp = function(key) {
            	if (onFormElement) return;
                var index = $.inArray(parseInt(key), currentKeys);
                if (index > -1) {
                    currentKeys.splice(index, 1);                        
                    sKey.keyFired = false;
                    if (keyPressTracking[key])
                    	delete keyPressTracking[key];
                }

                // Some modifiers do not have keydown or keyup events 
                currentKeys.sort();
                currentModifiers.sort();
                var mLength = currentModifiers.length,
                    kLength = currentKeys.length;
                var length = mLength >= kLength ? mLength : kLength;
                for (var i = 0; i < length; i++) {
                    if (currentKeys[i] != currentModifiers[i]) {
                        currentKeys = new Array();
                        currentModifiers = new Array();
                        keyPressTracking = {};
                        break;
                    }
                }
            }
            
            var keyEventsObj = {

                keyup:  function(event) { 
                	_handleKeyUp(event.which);
                }, 

                keypress:  function(event) { 
                    if (onFormElement) return;

                    // The keyCode of right keypad keys is 0
                    if (event.which == 0) {
                       currentKeys = new Array();
                    }
                }, 

                keydown: function(event) {
                    if (onFormElement) return;

                    var which = event.which;
                    if($.inArray(which, currentKeys) == -1) {
                        currentKeys.push(which);
                        currentKeys.sort();
                        if (!keyPressTracking[key])
                        	keyPressTracking[which] = new Date().getTime();
                    }

                    if (ui.modifiers[which] != undefined) {
                        if($.inArray(which, currentModifiers) == -1) {
                            currentModifiers.push(which);
                            currentModifiers.sort();
                            if (!keyPressTracking[key])
                            	keyPressTracking[which] = new Date().getTime();
                        }
                    }

                    var currentKeyStr = '';
                    var keyComboFound;
                    
                    for (var key in objKeys) {
                        keyComboFound = true;                                 
                        for (var i = 0, limit = objKeys[key].length; i < limit; i++) {
                            if (($.inArray(objKeys[key][i], currentKeys) == -1) || (currentKeys.length !== limit)) {
                                keyComboFound = false;
                                break;
                            }
                        }
                                                
                        if (keyComboFound) {
                            event.currentKeyStr = key;
                            // trigger bound function in timeout so it doesn't effect code execution
                            setTimeout(function() { obj[key](event); },1);
                            sKey.keyFired = true;
                            if (sKey.propagate == false) { 
                                event.stopPropagation();
                            }
                            if (sKey.preventDefault == true) {
                                event.preventDefault(); 
                                return false;  // prevent browser default behavior for key combo
                            }
                            
                        }                         
                    }
                }
            }; 

            $(element).bind(keyEventsObj); 
        }   

    });

})(MarkLogic.ui);


/**
 * This object presents a string in a short format '...' + <last segment of the string>
 * str: string, orignal string
 * maxLen: target string length
 * return: short string format
 **/
(function(ui){
    $.extend(ui, {
        shortStringLeft: function(str, maxLen) {
            str = $.trim(str);
            if (arguments.length <= 1) {
                return str;
            }
            if (typeof str != 'string') {
                return str;
            }
            if (str.length <= maxLen) {
                return str;
            }
            var strLen = str.length;
            return '...' + str.substring(strLen-maxLen-1, strLen);
        },
        shortStringRight: function(str, maxLen) {
            str = $.trim(str);
            if (arguments.length <= 1) {
                return str;
            }
            if (typeof str != 'string') {
                return str;
            }
            if (str.length <= maxLen) {
                return str;
            }
            var strLen = str.length;
            return str.substring(0, maxLen-1) + '...';
        }
    });

})(MarkLogic.ui);


/**
 *i jQuery plugins
 */
(function(ui){
    
    jQuery.fn.shortcutKeys = function(obj,propagate, preventDefault) {
        return new ui.ShortcutKeys(this, obj, propagate, preventDefault);
    };

    jQuery.fn.message = function(options) {
        var conf = { 
                    modal: true,
                    show: "blind",
                    hide: "explode",
                    width: 300,
                    height: 'auto',
                    minWidth: 150,
                    minHeight: 150,
                    title: 'MarkLogic',
                    buttons: {
                        /*Ok: function() {
                            $( this ).dialog( "close" );
                        }*/
                    }
            };
        $.extend(true, conf, options);

        this.dialog(conf);

        return this;
    };

    jQuery.fn.confirmation = function(options) {
        var conf = { 
                    modal: true,
                    show: "blind",
                    hide: "explode",
                    width: 300,
                    height: 'auto',
                    minWidth: 150,
                    minHeight: 150,
                    title: 'MarkLogic',
                    buttons: {
                        /*No: function() {
                            $( this ).dialog( "close" );
                        },
                        Yes: function() {
                            $( this ).dialog( "close" );
                        }*/
                    }
            };
        $.extend(true, conf, options);

        this.dialog(conf);

        return this;
    };
    
    
    jQuery.fn.midellipsis = function()
	{
		return this.each(function()
		{
            if (this.children.length) return;  // if this item has HTML, this plugin won't work, so return
            var _render, self, parent, width, parentWidth, parentWidthWOElem, parentHTML, text, numberOfPixelsOver, numberOfCharactersAvail,
			_truncateMid = function(fullStr, strLen, separator) {
                if (fullStr.length <= strLen) return fullStr;
    
                separator = separator || ' &hellip; ';
    
                var sepLen = (separator === ' &hellip; ') ? 3 : separator.length,
                    charsToShow = strLen - sepLen,
                    frontChars = Math.ceil(charsToShow/2),
                    backChars = Math.floor(charsToShow/2);
    
                return fullStr.substr(0, frontChars) + 
                       separator + 
                       fullStr.substr(fullStr.length - backChars);
            },
			_numCharactersFitContainer = function(container) {
				var span		 = $('<span></span>'), 
					numCharsFit  = 0,
					fits 		 = true,
					maxWidth	 = parseInt($(container).attr("data-width")),
					origContents = $(container).html(),
					contentsArray = origContents.split('');
				
				$(container).html('');
				$(container).append(
					span.css("white-space", "nowrap")
				);
				
				if (span.width() < maxWidth) {
					while (fits){
						$(span).html(span.html() + contentsArray[numCharsFit]);
						if (span.width() > maxWidth) {
							fits = false;
							break;
						} else {
							numCharsFit++;
						}
					}
				}    	    
				
				$(container).html(origContents);  // restore container contents
				
				return numCharsFit;
			},
            _jQObjectToHTML = function(obj) {
        	    return $('<div>').append(obj.eq(0).clone()).html();
            };
			
			self = $(this);
			parent = $(this).parent();
            _render = function(obj) {
				if (self.attr('data-html') === undefined) {
					self.attr('title',self.text());
					self.attr('data-html',self.html());	
					// set styles
					if (parent[0].tagName === "TD") {
						parent.css("position","relative");	
						self.css("position","absolute");	
					}
					parent.css("white-space","nowrap");					
					self.css("white-space","nowrap");
					self.css("overflow","hidden");
				}
				
				// size parent contents without this element's text
				parentHTML = parent.html();
				parent.html(parent.html().replace(_jQObjectToHTML(self),''));
				parentWidthWOElem	= parent.html('<span class="sizer">' + parent.html() + '</span>').find('.sizer').width();
				parent.html(parentHTML);
				
				self = parent.find(".mid-ellipsis");
				self.html(self.attr('data-html'));  // set to full string length
				parentWidth   		= parent.width();
				width         		= self.width();
				
				if (width > (parentWidth - parentWidthWOElem)) {
					numberOfPixelsOver = width - parentWidth;
					self.attr('data-width',width - (numberOfPixelsOver + parentWidthWOElem));
					numberOfCharactersAvail = _numCharactersFitContainer(self);
					text = _truncateMid(self.attr('data-html'), numberOfCharactersAvail);
					self.html(text);
				}
            };
			$(window).resize(function() {
				_render();
			});
			_render();
		});
	};    
    
    

})(MarkLogic.ui);
