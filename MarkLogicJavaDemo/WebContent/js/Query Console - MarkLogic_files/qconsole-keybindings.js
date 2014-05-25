/* Copyright 2002-2014 MarkLogic Corporation.  All Rights Reserved. */

    qconsole.bindings = {
               "CTRL+ENTER": function() {
                   qconsole.runQueryAs();
               }, 
               "CTRL+SHIFT+O": function() {
                   // Run in Auto Mode
            	   $("#results-type-auto").click();
                   qconsole.runQueryAs('auto');
               },                
               "CTRL+SHIFT+R": function() {
                   // Run in Raw Mode
            	   $("#results-type-raw").click();
                   qconsole.runQueryAs('raw');
               }, 
               "CTRL+SHIFT+E": function() {
            	   // Explore content source 
            	   qconsole.Explorer.browseSource();                    
               },
               "CTRL+SHIFT+S": function() {
               		// stop running query
               		qconsole.stopQuery();                   
               },           
               "CTRL+ALT+SHIFT+ENTER": function() {
            	   // Run Query as Profile
                   qconsole.setupAndProfileQuery();
               },              
               "ALT+=": function() {
                   // Add a query
                   qconsole.keybindFuncAddQuery();
               }, 
               "ALT+-": function() {
                   // Close current query tab
                   qconsole.keybindFuncCloseTab();
               },               
               "CTRL+ALT+W": function() {
                   // new workspace
                   qconsole.createNewWorkspace();
               }, 
               "CTRL+SHIFT+ALT+W": function() {
                   // clone workspace
                   qconsole.cloneWorkspace();
               },              
               "CTRL+SHIFT+SPACE": function() {
                   // Move the mode bar,  from middle to top,  from top to middle,  from bottom to middle
                   qconsole.toggleModeBar();
               }, //Fixme: Mac opens a Firefox menu 
               "CTRL+SHIFT+ALT+ARROW_LEFT": function() {
                   // Change selected query tab, previous tab (tab does not have to be in focus)
                   qconsole.tabsObj.openPrevTab();
               }, 
               "CTRL+SHIFT+ALT+ARROW_RIGHT": function() {
                   // Change selected query tab, next tab (tab does not have to be in focus)
                   qconsole.tabsObj.openNextTab();
               },                     
               "ALT+,": function() {
                   // Run or Profile a Query (switches to Results if on Explore)
                   qconsole.runQuery();
               }, 
               "ALT+.": function() {
            	   // Explore Content Source (switches to tab)
            	   qconsole.Explorer.browseSource();          
               }, 
               "ALT+/": function() {
            	   // Profile a Query (switches to tab) 
                   qconsole.setupAndProfileQuery();
               }, 
               "CTRL+ALT+H": function() {
                   // History expand/minimize
                   $('#history-overlay').toggle();
               }, 
               "CTRL+ALT+.": function() {
                   // Stop query - not currently available
               },
               "CTRL+ALT+'": function() {
                   // code mode
                   qconsole.displayCodeMode();
               },
       		   "CTRL+A": function() {       			   
                   qconsole.keybindFuncSelectOutput(); 
               }
    };
    
    var bindingsMAC = {
            "CTRL+ENTER": function() {
                qconsole.runQueryAs();
            },
            "CTRL+SHIFT+O": function() {
                // Run in Auto Mode
         	   $("#results-type-auto").click();
                qconsole.runQueryAs('auto');
            },                
            "CTRL+SHIFT+R": function() {
                // Run in Raw Mode
         	   $("#results-type-raw").click();
                qconsole.runQueryAs('raw');
            },
            "CTRL+SHIFT+E": function() {
          	    // Explore content source 
          	    qconsole.Explorer.browseSource();                    
            },     
            "CTRL+SHIFT+S": function() {
            	// stop running query
            	qconsole.stopQuery();                   
            },               
            "CTRL+OPTION+SHIFT+ENTER": function() {
                // Run Query as Profile
            	qconsole.setupAndProfileQuery();
            },       
            "OPTION+=": function() {
                // Add a query
                qconsole.keybindFuncAddQuery();
            }, 
            "OPTION+-": function() {
                // Close current query tab
                qconsole.keybindFuncCloseTab();
            },               
            "CTRL+OPTION+W": function() {
                // new workspace
                qconsole.createNewWorkspace();
            }, 
            "CTRL+SHIFT+OPTION+W": function() {
                // clone workspace
                qconsole.cloneWorkspace();
            },              
            "CTRL+SHIFT+SPACE": function() {
                // Move the mode bar,  from middle to top,  from top to middle,  from bottom to middle
                qconsole.toggleModeBar();
            }, 
            "CTRL+OPTION+SHIFT+ARROW_LEFT": function() {
                // Change selected query tab, previous tab (tab does not have to be in focus)
                qconsole.tabsObj.openPrevTab();
            }, 
            "CTRL+OPTION+SHIFT+ARROW_RIGHT": function() {
                // Change selected query tab, next tab (tab does not have to be in focus)
                qconsole.tabsObj.openNextTab();
            }, 
            "OPTION+,": function() {
            	// Run or Profile a Query (switches to Results if on Explore)
                qconsole.showQueryPane();
            }, 
            "OPTION+.": function() {
            	// Explore Content Source (switches to tab)
                qconsole.setupAndBrowseSource();          
            }, 
            "OPTION+/": function() {
            	// Profile a Query (switches to tab)
                qconsole.setupAndProfileQuery();
            }, 
            "CTRL+OPTION+H": function() {
                // History expand/minimize
                $('#history-overlay').toggle();
            }, 
            "CTRL+OPTION+.": function() {
                // Stop query - not currently available
            },
            "CTRL+OPTION+'": function() {
                // code mode
                qconsole.displayCodeMode();
            },
    		"CTRL+A": function() {
                qconsole.keybindFuncSelectOutput(); 
            }
    };

    qconsole.workspaceBindings = {
            "ARROW_UP": function() {
                // If query list has focus in workspace, select query above.
                qconsole.keybindFuncPrevQuery(); 
            }, 
            "ARROW_DOWN": function() {
                // If query list has focus in workspace, select query below.
                qconsole.keybindFuncNextQuery();
            }
    };

    // for handling of pasting into the editor... we use this to sanitize pasted query of control characters
    qconsole.onPasteBindings = {
            "CTRL+V": function() { 
            	setTimeout(function() {
            		var cursor = qconsole.editor.getCursor();
            		qconsole.sanitizeQuery();
            		qconsole.editor.setCursor(cursor);  // put the cursor back to where it was before sanitizing
            	},100);
            }
    };
    
    // MAC VERSION for handling of pasting into the editor... we use this to sanitize pasted query of control characters
    qconsole.onPasteBindingsMAC = {
            "COMMAND+V": function() { 
            	setTimeout(function() {
            		var cursor = qconsole.editor.getCursor();
            		qconsole.sanitizeQuery();
            		qconsole.editor.setCursor(cursor);  // put the cursor back to where it was before sanitizing
            	},100);
            }
    };
        
    if($ml.browser.os.mac()) { 
        qconsole.bindings = bindingsMAC;
        qconsole.onPasteBindings = qconsole.onPasteBindingsMAC;
    }
    