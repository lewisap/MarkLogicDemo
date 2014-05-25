 /* Copyright 2002-2014 MarkLogic Corporation.  All Rights Reserved. */

var qconsole = {
    editorId: 'query',
    barMode: 'center',              // top, bottom, center, custom
    barPosition: .5,				// percentage as decimal representing top alignment in %, so .5 = the bar is at 50% of page height, centered within the middle
    viewResultMode: 'query',        // query, browse
    sidebar: 'on',
    sidebarView: 'workspace',       // workspace or snippets
    maxNameLength: 50,              // when users try to rename
    tabHoverDelay: 500,
    msgBoxTimeout: 2000,
    editorHightlight: true,             // override by highlight url param and its cookie
    workspaces: [],
    workspaceDropdownOn: false,
    minWSNamesHeight: 60,
    workspaceLoaded: false,
    historyDropdownOn: false,
    importing: false,
    browsingFile: '',
    searchQueryOutput: '',
    searchQueryOutputCursor: undefined,
    resultsFormat: 'auto',
    evalResults: null,
    profileResults: null,
    profileDefaultSortColumn: "shallow-percent",
    tabsObj: {},
    serverInteractionsObj: {},
    queryExecuting: null,
    unloading: false,
    cookieExpDays: 356,
    outputSelected: undefined
};


qconsole.load = function() {

    qconsole.addInteractions();
    qconsole.Explorer.addInteractions();
    qconsole.setBarMode(qconsole.barMode);

    qconsole.serverInteractionsObj = new qconsole.ServerInteractions();
    qconsole.serverInteractionsObj.getAllWorkspaces();

    // setup tooltips
    qconsole.setupTooltips();

    $(window).resize( function() {
        qconsole.resize();
    });

    $(window).bind('beforeunload', function() {
        qconsole.unloading = true;
        if (!qconsole.importing)
            qconsole.save();
    });

    setTimeout(function() {
        qconsole.resize();
        qconsole.editor.getWrapperElement().style.height = '100%';
    }, 100);
};

/* saves the currently active query */
qconsole.save = function() {
    var currentWorkspace = qconsole.getCurrentWorkspace();
    var currentTab = qconsole.tabsObj.getSelectedTab();
    var currentQuery = currentWorkspace.getQuery(currentTab.id);
    currentWorkspace.updateTabFrontQuery(currentTab.content,false);   // save async so we can be sure save completes
    currentQuery.save(false);
};

qconsole.loadWorkspaceDropdown = function() {
    var j, len;
    var currentWorkspace = qconsole.getCurrentWorkspace();

    // update UI with workspace info
    $("#workspace-names").html("");
    var current = '';
    for (j=0, len = qconsole.workspaces.length; j < len; j++) {
        current = qconsole.workspaces[j].active ? ' current' : '';

        if (qconsole.workspaces[j].name.length > qconsole.workspaces[j].nameDisplayLength)
            var workspaceName = qconsole.workspaces[j].name.substr(0,qconsole.workspaces[j].nameDisplayLength) + '...';
        else
            var workspaceName = qconsole.workspaces[j].name;

        $("#workspace-names").append('<div id="workspace-doc-' + qconsole.workspaces[j].id + '" class="workspace-name' + current + '">' + workspaceName + '</div>');
    }
};

// pull the first line and look for a comment.  If it exists, then create a name from it
// TO DO: re-activate function, currently not in use.
qconsole.updateBufferName = function(query) {
    var bufferName = "";
    commentStartPos = query.indexOf("(:", 0);
    if (commentStartPos > -1) {
        commentStartPos = commentStartPos + 2;  // skip over comments character
        commentEndPos = query.indexOf(":)", commentStartPos);
        // enforce max name size
        if (commentEndPos > qconsole.maxQueryNameLength)
            commentEndPos = qconsole.maxQueryNameLength;
        if (commentEndPos > -1)
            bufferName = query.substr(commentStartPos,commentEndPos - commentStartPos - 1);
        else return;
    } else return;
};

qconsole.getCurrentWorkspace = function() {
    var i, len;
    for (i=0, len = this.workspaces.length; i < len; i++) {
        if (this.workspaces[i].active) {
            return this.workspaces[i];
        }
    }
};

qconsole.getCurrentWorkspaceID = function() {
    var i, len;
    for (i=0, len = qconsole.workspaces.length; i < len; i++) {
        if (this.workspaces[i].active) {
            return i;
        }
    }
};

qconsole.getWorkspaceArrayLoc = function(id) {
    var i, len;
    for (i=0, len = this.workspaces.length; i < len; i++) {
        if (this.workspaces[i].id == id) {
            return i;
        }
    }
    return false;
};

qconsole.deleteWorkspace = function(workspace) {
    // remove from UI
    var wsID = workspace.id;
    $("#workspace-doc-" + workspace.id).remove();

    // close workspace and all tabs
    workspace.isDeleting = true;  // flags workspace for deletion, so queries know they don't need to bother saving state
    workspace.close();

    // remove it from the workspaces array
    arrayLoc = this.getWorkspaceArrayLoc(workspace.id);
    this.workspaces.splice(arrayLoc,1);

    qconsole.serverInteractionsObj.deleteWorkspace(wsID,function(workspace) {
        if (qconsole.workspaces.length == 0) {
             qconsole.serverInteractionsObj.newWorkspace(function(workspace) {
                 qconsole.workspaces[0] = new qconsole.Workspace(workspace);
                 // load the new workspace
                 qconsole.workspaces[0].load();
                 // update workspace dropdown list
                 qconsole.loadWorkspaceDropdown();
            });
        } else {
            // load the first workspace
            qconsole.workspaces[0].load();
            // update workspace dropdown list
            qconsole.loadWorkspaceDropdown();
        }
    });

};



qconsole.addInteractions = function() {

    /***  Global Interactions ***/
    // divider bar click interactions
    $(".divider-bar-position input").dblclick(function(e) {
        e.stopPropagation();  // make sure we don't propagate to "results-settings-bar" function
    });
    // divider bar click interactions
    $("#page-number").dblclick(function(e) {
        e.stopPropagation();  // make sure we don't propagate to "results-settings-bar" function
    });
    $("#run-btn").dblclick(function(e) {
        e.stopPropagation();  // make sure we don't propagate to "results-settings-bar" function
    });
    $("#results-type a").dblclick(function(e) {
        e.stopPropagation();  // make sure we don't propagate to "results-settings-bar" function
    });
    $("#navigation-buttons").dblclick(function(e) {
        e.stopPropagation();  // make sure we don't propagate to "results-settings-bar" function
    });
    $("#browse-source").dblclick(function(e) {
        e.stopPropagation();  // make sure we don't propagate to "results-settings-bar" function
    });
    $("#browse-pagination-btns").dblclick(function(e) {
        e.stopPropagation();  // make sure we don't propagate to "results-settings-bar" function
    });
    $("#browse-pagination-displaying").dblclick(function(e) {
        e.stopPropagation();  // make sure we don't propagate to "results-settings-bar" function
    });
    $("#output-type-menu").dblclick(function(e) {
    	e.stopPropagation();  // make sure we don't propagate to "results-settings-bar" function
    });
    
    $(".results-settings-bar").not("#button-space").dblclick(function(e) {
    	if ($(e.target).closest('#button-space').length === 0 && e.target.id !== 'button-space')
    		qconsole.toggleModeBar();
    });   
    
    $(".results-settings-bar").draggable({ axis: "y", containment: "#application-space", cancel: ".results-settings-bar #button-space" });    
    
    $(".results-settings-bar").on( "drag", function( event, ui ) {
    	var container 	= $('#application-space');
    	if (ui.position && ui.position.top && ui.position.top >= 0) {
        	qconsole.barPosition = ui.position.top / container.height();
        	qconsole.barMode = "custom";
        	qconsole.resize();
    	}
    } );
    

    // handle double click for text inputs
    $(".new-workspace-name").live("dblclick click",function(e) {
        qconsole.workspaceDropdownOn = false;
        $("#workspace-dropdown").hide();
        e.stopPropagation();
    });
    $(".new-query-name").live("dblclick click",function(e) {
        qconsole.workspaceDropdownOn = false;
        $("#workspace-dropdown").hide();
        e.stopPropagation();
    });

    // stop double click behavior on explore controls
    $("#button-back, #button-forward, #browse-source, #browse-pagination-btns, #browse-pagination-displaying, .divider-bar-position").dblclick(function(e) {
        e.stopPropagation();  // make sure we don't propagate to "results-settings-bar" function
    });


    /***  Results Panes Interactions ***/
    // results type setup
    /*
    if ( $("#results-type a").hasClass('selected') ) {
        qconsole.resultsFormat = $('#results-type a.selected').attr("format");
    }
    */
    


    /**** Query View UI ****/
    $(".data-source").change(function() {
    	qconsole.Explorer.wipeExploreUI();
        qconsole.appServerChange($(this).val());
    });
    
    $('#query-type').on('change',function (e) {
    	qconsole.modeChange($(this).val());
    	qconsole.editor.setOption('mode', $(this).find('[value=' + $(this).val() + ']').attr('title'));
    });        

    $("#query-results a").click(function (e) {    	
		$("#query-results a").removeClass("selected");
		$(this).addClass("selected");
		qconsole.resultsFormat = $(this).attr("format");
		// bubbles up to li.tab-button click method, running displayQueryResults()
    });    
    
    $("#output-type-menu li.tab-button").click(function(e) {
        switch($(this).attr("id"))
        { 
        case 'query-results':
        	qconsole.resultsFormat = $('#query-results a.selected').attr("format");
        	break;
        case 'profile-results':
        	qconsole.resultsFormat = "profiling";
        	break;
        case 'explore-results':
        	qconsole.resultsFormat = "browse";
        	break;
        default: 
        	break;
        }
        $("#output-type-menu .tab-button").removeClass("selected");
        $(this).addClass("selected");
    
        // render any previously returned results
        qconsole.displayOutputView(qconsole.resultsFormat);	
        qconsole.displayQueryResults();
     });

    $('#run-btn').click(function() {
    	qconsole.runQuery();
    });

    /***  UI interactions ***/
    $('#filter-box').focus(function() {
        if ($(this).val() == "filter") {
            $(this).val("");
        }
    });
    $('#filter-box').blur(function() {
        if ($(this).val() == "") {
            $(this).val("filter");
        }
    });


    $('#sidebar-workspace-btn').click(function() {
        qconsole.toggleSidebar();
    });

    /** WORKSPACE UI **/
    $("#workspace-content").hover(function() {
        // if we're not editing a query name, then add focus to the box (used for keybindings)
        if (($(this).find('.new-query-name').length == 0) && ($('.new-workspace-name').length == 0))
            $("#workspace-content").focus();
    });

    $("#workspace-title").click(function() {
        if (!qconsole.workspaceDropdownOn) {
        	var wsNamesHeight, wsNamesHeightMin = qconsole.minWSNamesHeight;
            $("#workspace-dropdown").show();
            
            $("#workspace-dropdown #workspace-names").css("height","");
            // adjust height to ensure it doesn't overflow screen
            if ( ($("#workspace-names").height() + $("#workspace-actions").height() + parseInt($("#workspace-dropdown").css("top").replace('px',''))) > $(window).height()) {
            	wsNamesHeight = $(window).height() - parseInt($("#workspace-dropdown").css("top").replace('px','')) - $("#workspace-actions").height() - 20;
            	if (wsNamesHeight > wsNamesHeightMin)
            		$("#workspace-dropdown #workspace-names").height(wsNamesHeight);
            	else
            		$("#workspace-dropdown #workspace-names").height(wsNamesHeightMin);
            }

            qconsole.workspaceDropdownOn = true;
            setTimeout(function() {
                if (!qconsole.hoveringWorkspaceDropdown) {
                    qconsole.workspaceDropdownOn = false;
                    $("#workspace-dropdown").hide();
                }
            }, 2500);
        } else {
            $("#workspace-dropdown").hide();
            qconsole.workspaceDropdownOn = false;
        }
    });

    // handles display of drop-down on hover.  Adds delay of close when not hovering on box
    $("#workspace-dropdown, #workspace-title").hover(function() {
        qconsole.hoveringWorkspaceDropdown = true;
    },
    function() {
        qconsole.hoveringWorkspaceDropdown = false;
        setTimeout(function() {
            if (!qconsole.hoveringWorkspaceDropdown) {
                $("#workspace-dropdown").hide();
                qconsole.workspaceDropdownOn = false;
            }
        }, 1000);
    });

    $("#workspace-title-text").dblclick(function(e) {
        // hide dropdown, we're editing the title, not selecting a workspace
        qconsole.workspaceDropdownOn = false;
        $("#workspace-dropdown").hide();
        var currentWorkspace = qconsole.getCurrentWorkspace();

        $(this).attr("currentWorkspaceName",currentWorkspace.name);
        $(this).html("<input type='text' class='new-workspace-name' value='" + currentWorkspace.name + "' />");
        $(".new-workspace-name").select();
        $("input.new-workspace-name").keyup(function(e) {
            if (e.keyCode == "13") {  // enter key was pressed
                if (/\S/.test($(this).val())) {  // string is not empty and not just whitespace

                    currentWorkspace.name = $(this).val();

                    if (currentWorkspace.name.length > currentWorkspace.nameDisplayLength)
                        var workspaceName = currentWorkspace.name.substr(0,currentWorkspace.nameDisplayLength) + '...';
                    else
                        var workspaceName = currentWorkspace.name;
                    $(this).parent().html(workspaceName);

                    // rename it's menu item
                    var worspaceID = qconsole.getCurrentWorkspaceID();
                    $("#workspace-doc-" + worspaceID).html($(this).val());
                    currentWorkspace.save();
                    qconsole.loadWorkspaceDropdown();
                } else {
                    $(this).parent().html($(this).parent().attr("currentWorkspaceName"));
                }
            }
        });
        $("input.new-workspace-name").focusout(function() {
            if (/\S/.test($(this).val())) {  // string is not empty and not just whitespace
                var currentWorkspace = qconsole.getCurrentWorkspace();
                currentWorkspace.name = $(this).val();

                if (currentWorkspace.name.length > currentWorkspace.nameDisplayLength)
                    var workspaceName = currentWorkspace.name.substr(0,currentWorkspace.nameDisplayLength) + '...';
                else
                    var workspaceName = currentWorkspace.name;
                $(this).parent().html(workspaceName);

                // rename it's menu item
                var worspaceID = qconsole.getCurrentWorkspaceID();
                $("#workspace-doc-" + worspaceID).html($(this).val());
                currentWorkspace.save();
                qconsole.loadWorkspaceDropdown();
            } else {
                $(this).parent().html($(this).parent().attr("currentWorkspaceName"));
            }
        });
        e.stopPropagation();
    });

    $("#workspace-dropdown div.workspace-name").live('click',function() {
        var currentWorkspace = qconsole.getCurrentWorkspace();
        var wsSwitchID = $(this).attr("id").replace("workspace-doc-","");
        // close drop-down
        qconsole.workspaceDropdownOn = false;
        $("#workspace-dropdown").hide();

        if (currentWorkspace.id !== wsSwitchID) {
            qconsole.switchWorkspaces(wsSwitchID);
        }
    });

    // workspace actions
    $("#workspace-dropdown div.workspace-action-new").click(function() {
           // close drop-down
        qconsole.workspaceDropdownOn = false;
        $("#workspace-dropdown").hide();

        qconsole.createNewWorkspace();
    });
    $("#workspace-dropdown div.workspace-action-clone").click(function() {
           // close drop-down
        qconsole.workspaceDropdownOn = false;
        $("#workspace-dropdown").hide();

        qconsole.cloneWorkspace();
    });

    $("#workspace-dropdown div.workspace-action-delete").click(qconsole.confirmDeleteWorkspace);
    $("#workspace-dropdown div.workspace-action-export").click(qconsole.exportWorkspace);
    $("#workspace-dropdown div.workspace-action-import").click(qconsole.importWorkspace);
    $("#import-workspace").click(qconsole.closeImportWorkspace);

    // workspace query list actions
    $("#query-list li").live('click',function(ev) {
        if (!$(this).hasClass("current")) {
            // stopPropagation does not work with live() events, work around added
            var myDeleteIcon = $(this).children(".delete-icon")[0];
            if (ev.target == myDeleteIcon) {
                return true;
            }
            var currentWorkspace = qconsole.getCurrentWorkspace();
            // remove focus and saves query as focus=false
            if ($("#query-list li.current").length > 0)
            	currentWorkspace.unfocusQuery($("#query-list li.current").attr('id').replace('query-doc-',''));
            // activate new query
            currentWorkspace.activateQuery($(this).attr('id').replace('query-doc-',''));
        }
    });

    $(".delete-icon").live('click',function() {
        var answer = confirm("Are you sure you want to delete this query from your Workspace?")
        if (answer){
            var currentWorkspace = qconsole.getCurrentWorkspace();
            currentWorkspace.removeQuery($(this).parent().attr('id').replace('query-doc-',''));
        }
    });

    $(".query-doc-name").live('dblclick',function() {
        var currentWorkspace = qconsole.getCurrentWorkspace();
        var queryID = $(this).parent().parent().attr('id').replace('query-doc-','');
        var renamedQuery = currentWorkspace.getQuery(queryID);

        $(this).html("<input type='text' class='new-query-name' value='" + renamedQuery.name + "' maxlength='" + qconsole.maxNameLength + "' />");
        $(".new-query-name").select();
        $("input.new-query-name").keyup(function(e) {
            if (e.keyCode == "13") {  // enter key was pressed
                if (/\S/.test($(this).val())) {  // string is not empty and not just whitespace

                    renamedQuery.setProperty('name',$(this).val());
                    renamedQuery.save();  // save to database
                    $(this).parent().html(renamedQuery.getNameForUI());

                    // update the tab with the new name
                    qconsole.tabsObj.updateTabNameByID(queryID,renamedQuery.name);
                } else {
                    $(this).parent().html(renamedQuery.getNameForUI());
                }
            }
        });
        $("input.new-query-name").focusout(function() {
            if (/\S/.test($(this).val())) {  // string is not empty and not just whitespace
                renamedQuery.setProperty('name',$(this).val());
                renamedQuery.save();  // save to database
                $(this).parent().html(renamedQuery.getNameForUI());

                // update the tab with the new name
                qconsole.tabsObj.updateTabNameByID(queryID,renamedQuery.name);
            } else {
                $(this).parent().html(renamedQuery.getNameForUI());
            }
        });
    });

    $("#add-query-btn").click(function() {
        var currentWorkspace = qconsole.getCurrentWorkspace();
        currentWorkspace.addQuery();
    });


    /*********************************/
    /******  CODE MIRROR & TABS ******/
    /*********************************/
    // load the tabs obj. for workspace query

    qconsole.codeMirrorResponseObj.set = function(content) {
        qconsole.editor.setValue(content);
        qconsole.editor.clearHistory();
    }
    qconsole.codeMirrorResponseObj.get = function() {
        return qconsole.editor.getValue();
    }

    // replaces the onChange method with our "change" function call
    qconsole.editor.setOption("onChange", function (n) {
        qconsole.codeMirrorResponseObj.change(qconsole.editor.getValue());
    });
    
    // "Find" functionality in CodeMirror output
    $("#search-content-box .close-find-icon").click(function() {
        $("#search-content-box-container").css("display","none");
        $("#search-content-box-input").val('');
        qconsole.searchQueryOutput = '';
        qconsole.searchQueryOutputCursor = undefined;      
    });
    $("#search-content-box-input").keyup(function(e) {
        if (e.keyCode == "13") {  // enter key was pressed
            if (/\S/.test($(this).val())) {  // string is not empty and not just whitespace                        
                qconsole.searchQueryNextOutput($(this).val());                        
            }
        }
    });                
    

    qconsole.tabsObj = new qconsole.Tabs("#tab-space", qconsole.codeMirrorResponseObj);
    
    /**** Click ****/
    qconsole.tabsObj.onEvent("onclick", function(tab) {
        var currentWorkspace = qconsole.getCurrentWorkspace();
        currentWorkspace.activateQuery(tab.id);
    });

    /**** Open ****/
    qconsole.tabsObj.onEvent("onopen", function(tab) {
    });

    /**** Hover ****/
    qconsole.tabsObj.onEvent("onhover", function(tab) {
        var guidID = qconsole.tabsObj.buildUpGUIid(tab.id);
    	var tabEl = $("#" + guidID);
    	if (!tabEl.hasClass('selected') && tab.content !== undefined) {
    		tabEl.attr("showtooltip","true");
            setTimeout(function() {
                if ($("#" + guidID).attr("showtooltip") == "true") {
                    $("body").append("<div class='qconsole-tooltip' id='tab-tooltip-" + guidID + "'><p></p></div>");
                    $("#tab-tooltip-" + guidID).position({
                        of: $('#' + guidID),
                        my: 'left top+5',
                        at: 'left bottom',
                        //offset: '0 5', // offset no longer support, folded into my/at properties ie 'left-10 top+20'
                        collision: "none none"
                    });
                    $("#tab-tooltip-" + guidID + " p").html(qconsole.nl2br($('<div/>').text(tab.content).html()));
                    $("#tab-tooltip-" + guidID).css("display","block");
                }
            }, qconsole.tabHoverDelay);		
    	}
    });
    qconsole.tabsObj.onEvent("offhover", function(tab) {
        var guidID = qconsole.tabsObj.buildUpGUIid(tab.id);
        $("#tab-tooltip-" + guidID).css("display","none");
        $("#" + guidID).attr("showtooltip","false");
        $("#tab-tooltip-" + guidID).remove();
    });


    /**** Close - fires ONLY when the tab is closed via the UI 'x' button on a tab ****/
    qconsole.tabsObj.onEvent("onclose", function(tab) {
        var activeTabClosing = tab.isFront;

        var currentWorkspace = qconsole.getCurrentWorkspace();
        if (!currentWorkspace.isClosing) {
            queryToCloseTab = currentWorkspace.getQuery(tab.id);
            queryToCloseTab.setProperty('focus',false);
            queryToCloseTab.setProperty('active',false);
            queryToCloseTab.setProperty('content',tab.content);
            queryToCloseTab.setProperty('taborder',undefined);
            queryToCloseTab.save();
            //  qconsole.updateTabOrder();  // updates all tabs' order to new position in tabs within the Workspace obj.
        }

        // remove overlay too
        var guidID = qconsole.tabsObj.buildUpGUIid(tab.id);
        $("#tab-tooltip-" + guidID).css("display","none");
        $("#tab-tooltip-" + guidID).remove();

        if (activeTabClosing) { // then we have to open another tab, decide which
            // open next one in the list
            var lastTabID = qconsole.tabsObj.getLastTabID();
            if (lastTabID !== undefined) { // then there is another tab, open that
                currentWorkspace.activateQuery(lastTabID);
            }
        }
    });


    /**** On Add Tab ****/
    qconsole.tabsObj.onEvent("onaddclick", function() {
        var currentWorkspace = qconsole.getCurrentWorkspace();
        currentWorkspace.addQuery();
    });

    /**** On Tab Switch - returns the tab beind switched away from ****/
    qconsole.tabsObj.onEvent("ontabswitch", function(tab) {
        var currentWorkspace = qconsole.getCurrentWorkspace();
        if (!currentWorkspace.isClosing) {
            queryToSwitch = currentWorkspace.getQuery(tab.id);
            queryToSwitch.setProperty('content',tab.content);  // update content
            currentWorkspace.unfocusQuery(tab.id);
        }
    });

    /**** On Tab Name Change ****/
    qconsole.tabsObj.onEvent("ontabnamechange", function(tab) {
        var currentWorkspace = qconsole.getCurrentWorkspace();
        queryToRename = currentWorkspace.getQuery(tab.id);
        queryToRename.setProperty('name',tab.name);
        queryToRename.save();  // save to database

        $("#query-doc-" + tab.id + " .query-doc-name").html(queryToRename.getNameForUI());
    });

    /**** On Content Change ****/
    qconsole.tabsObj.onEvent("oncontentchange", function(tab) {
        var currentWorkspace = qconsole.getCurrentWorkspace();
        var queryBeingEdited = currentWorkspace.getQuery(tab.id);
        queryBeingEdited.setProperty('content',tab.content);
    });


    /*************************/
    /******  HISTORY UI ******/
    /*************************/

    $("#sidebar-history-btn").click(function() {
        if (!qconsole.historyDropdownOn) {
            $("#history-overlay").show();

            // handles rendering the delete button
            qconsole.getCurrentWorkspace().getFocusedQuery().history.sizeHistoryPane();
            
            qconsole.historyDropdownOn = true;
            setTimeout(function() {
                if (!qconsole.hoveringHistoryDropdown) {
                    qconsole.historyDropdownOn = false;
                    $("#history-overlay").hide();
                }
            }, 2500);
        } else {
            $("#history-overlay").hide();
            qconsole.historyDropdownOn = false;
        }
    });

    // handles display of drop-down on hover.  Adds delay of close when not hovering on box
    $("#history-overlay, #sidebar-history-btn").hover(function() {
        qconsole.hoveringHistoryDropdown = true;
    },
    function() {
        qconsole.hoveringHistoryDropdown = false;
        setTimeout(function() {
            if (!qconsole.hoveringHistoryDropdown) {
                $("#history-overlay").hide();
                qconsole.historyDropdownOn = false;
            }
        }, 1000);
    });
    $("#history-overlay").delegate("div.history-query div.delete","click",function(e) {
        var itemID = $(this).parent().parent().attr('id').replace("history-query-","");
        var currentWorkspace = qconsole.getCurrentWorkspace();
        var queryWithHist = currentWorkspace.getFocusedQuery();
        var queryHistory = queryWithHist.history;

        qconsole.historyDropdownOn = false;
        $("#history-overlay").hide();

        queryHistory.deleteRecord(itemID);
        e.stopPropagation(); // don't bubble up and to the LI click
    });

    $("#history-overlay").delegate("div.history-query","click",function(e) {
        if (e.target == $(this).find("div.delete")[0]) return true;
        
        var historicalQueryID = $(this).attr('id').replace("history-query-","");
        var currentWorkspace = qconsole.getCurrentWorkspace();
        var queryWithHist = currentWorkspace.getFocusedQuery();
        var queryHistory = queryWithHist.history;

        queryHistory.revertRecord(historicalQueryID);
        queryHistory.flash(historicalQueryID);

        setTimeout(function() {
            qconsole.historyDropdownOn = false;
            $("#history-overlay").hide();
        },450);

    });
    
    /*************************/
    /********  RESULTS *******/
    /*************************/
    // setup focus on click, to ensure keybindings trigger for CTRL+A
    $('#query-view-content, #browse-view-content, #profiling-view-content').click(function (e) {
    	qconsole.outputSelected = this;
    });
    $(document).click(function (e) {  
    	if ($(e.target).closest("#view-states").length === 0)
    		qconsole.outputSelected = undefined;
    	
    	// if we've clicked outside of the render as dropdown, close it
    	if ($(e.target).id !== 'rendertype' 
    			&& $(e.target).closest("#rendertype").length === 0 
    			&& $('#rendertype').css('display') !== 'none') {
    				$('#rendertype').hide();
    	}    		
    });
    
    // click an option in the render type menu
    $('#rendertype').delegate('li', 'click', function (e) {
      var output = JSON.parse(qconsole.evalResults);
      
    	var index = $(this).parents('#rendertype').attr('data-type');
    	
		  // show selection in list
    	$(this).siblings('li').removeClass('selected');
		  $(this).addClass('selected');
		
		// set the current render type to the result item
	  	$('#query-view-content').find('.type a').eq(index).attr('data-type', $(this).html());
	  	$('#query-view-content').find('.type').eq(index).attr('title', $(this).html());
		
		  // don't close the menu immediately
		  setTimeout(function () {$('#rendertype').hide();}, 150);
      
      var chosenRenderingType = $(this).html();   // Display type chosen from the menu

      var queryType = $("#query-type").val();
      var resultType = output[index].type;
      
      // Type to use to figure out rendering (based on displayType and type of result from server
      var outputRenderingType = qconsole.getOutputRenderingType(chosenRenderingType, resultType);
      output = qconsole.getOutputForRendering(chosenRenderingType, resultType, index, output);
            
		  // render the result item using the selected type
    	ML.dataHighlight(output, outputRenderingType, $('#query-view-content').find('.resultItem').eq(parseInt(index)));
    });
    
    // click to open render as menu
    $('#query-view-content').delegate('.type', 'click', function (e) {
    	var itemTypeDD, selectedType, index, itemTxt, p;
    	e.preventDefault();
    	e.stopPropagation();
    	itemTypeDD 	= $(this);
    	selectedType 	= $(this).find('a').attr('data-type');
    	index = $('#query-view-content').find('.type').index($(this));
    	$('#rendertype').attr('data-type', index);
    	qconsole.populateRenderAsMenu(JSON.parse(qconsole.evalResults), index);
    	$('#rendertype').find('li').removeClass('selected');  // remove default selection
    	$('#rendertype').find('li').each(function(index,el) {
    		itemTxt = $(el).text();
    		if (selectedType.indexOf(itemTxt) !== -1)
    			$(el).addClass('selected');
    	});    	
    	
    	p = itemTypeDD.offset();
    	p.top = ((p.top + itemTypeDD.outerHeight() + $('#rendertype').outerHeight()) <= $(window).height()) ? p.top + itemTypeDD.outerHeight() - 3 : p.top - $('#rendertype').outerHeight() - 1;
    	p.right = $('#query-view-content').outerWidth() - (p.left + itemTypeDD.outerWidth());
    	$('#rendertype').css('top', p.top + 2 + 'px').css('right', p.right + 'px').show();
    	$('#rendertype').show();
    	
    	// set state of dropdown
    	if (qconsole.hoveringRenderTO !== undefined) {
    		window.clearTimeout(qconsole.hoveringRenderTO);
    		delete qconsole.hoveringRenderTO;
    	}    		
    	qconsole.hoveringRenderTO = window.setTimeout(function() {
            if (!qconsole.hoveringRenderAsDropdown) {
                $("#rendertype").hide();
                delete qconsole.hoveringRenderTO;
            }
        }, 2000);
	 });
    
    $("#rendertype").hover(function() {
        qconsole.hoveringRenderAsDropdown = true;
    },
    function() {
        qconsole.hoveringRenderAsDropdown = false;
    	if (qconsole.hoveringRenderTO !== undefined) {
    		window.clearTimeout(qconsole.hoveringRenderTO);
    		delete qconsole.hoveringRenderTO;
    	}    	        
        qconsole.hoveringRenderTO = window.setTimeout(function() {
            if (!qconsole.hoveringRenderAsDropdown) {
                $("#rendertype").hide();
                delete qconsole.hoveringRenderTO;
            }
        }, 1000);
    });
    

    /**************************/
    /******** PROFILING *******/
    /**************************/
    $('#profiling-view-content').delegate('.profile-content-container table th', 'click', function (e) {
    	var reportID, sortBy, sortDescending, parentContainer, activeColumn;
    	parentContainer = $(this).closest('.profile-content-container');
    	if ($(this).is("th.ts-order-desc, th.ts-order-asc")) {
    		reportID 		= parentContainer.attr('id').replace('profile-report-','');
    		sortBy 			= $(this).attr('id').replace('report-'+reportID+'-','');
    		
    		// set header state
    		activeColumn = $(parentContainer).find('th.active')
    		
    		$(parentContainer).find('th').removeClass('active');
    		$(this).addClass('active');
    		if (activeColumn[0] === $(this)[0]) {
    			// switch the order on columns currently selected
    			if ($(this).hasClass('ts-order-desc')) {
        			$(this).removeClass('ts-order-desc');
        			$(this).addClass('ts-order-asc');
        		} else {
        			$(this).removeClass('ts-order-asc');
        			$(this).addClass('ts-order-desc');
        		}
    		}    		
    		
    		sortDescending 	= $(this).hasClass('ts-order-desc');
    		parentContainer.find('table tbody').html(qconsole.generateProfileRows(reportID, sortBy, sortDescending));
    	}
    });
    
};

qconsole.getOutputForRendering = function(chosenRenderingType, resultType, index, output) {
  //Adjust output based on the rendering type
  // Only pass in the output without the type information. That is what 
  // is expected by dataHighlight
  if (resultType === 'triple' || resultType === 'solution' || resultType === 'sql') {
    if (chosenRenderingType === 'table' || chosenRenderingType === 'turtle') {
      output = output[index].result;
    }
    else {
      output = JSON.stringify(output[index].result, null);
    }
  }
  else {
    // Typical case with XML and JSON output returned from server
    output = output[index].result.toString();
  }

  return output;
}

qconsole.getOutputRenderingType = function(chosenRenderingType, resultType) {
  var outputRenderingType;
  
  if (chosenRenderingType === 'table' || chosenRenderingType === 'turtle') {
    if (resultType === 'solution') {
      outputRenderingType = 'sparql_solution_table';
    }
    else if (resultType === 'triple') {
      outputRenderingType = 'turtle';
    }
    else if (resultType === 'sql') {
      outputRenderingType = 'sql_table';
    }
  }
  else {
    outputRenderingType = chosenRenderingType;
  }
  
  return outputRenderingType;
}

qconsole.populateRenderAsMenu = function(output, index) {
  if (!$.isArray(output)) {
	  output = [output];
	}
  resultType = output[index].type;
  
  // Remove all drop down items from the "Render As" menu
  $("#rendertype").find('ul li').remove();
  
  // Add the items to the menu based on the type of the result
  if (qconsole.resultsFormat === 'auto') {
    if (resultType === 'triple') {
      $("#rendertype").find('ul').append('<li class="capitalize">turtle</li>');
      $("#rendertype").find('ul').append('<li class="uppercase">json</li>');
      $("#rendertype").find('ul').append('<li class="capitalize">text</li>');
    } 
    else if (resultType === 'solution') {
      $("#rendertype").find('ul').append('<li class="capitalize">table</li>');
      $("#rendertype").find('ul').append('<li class="uppercase">json</li>');
      $("#rendertype").find('ul').append('<li class="capitalize">text</li>');
    }
    else if (resultType === 'sql') {
      $("#rendertype").find('ul').append('<li class="capitalize">table</li>');
      $("#rendertype").find('ul').append('<li class="uppercase">json</li>');
      $("#rendertype").find('ul').append('<li class="capitalize">text</li>');
    }
    else if (resultType === 'json') {
      $("#rendertype").find('ul').append('<li class="uppercase">json</li>');
      $("#rendertype").find('ul').append('<li class="capitalize">text</li>');
    }
    else if (resultType === 'Text document') {
        $("#rendertype").find('ul').append('<li class="capitalize">text</li>');
        $("#rendertype").find('ul').append('<li class="uppercase">json</li>');
    }
    else if (resultType === 'XML document') {
        $("#rendertype").find('ul').append('<li class="uppercase">xml</li>');
        $("#rendertype").find('ul').append('<li class="capitalize">text</li>');
        $("#rendertype").find('ul').append('<li class="uppercase">html</li>');
    }
    else if (resultType === 'xml') {
      $("#rendertype").find('ul').append('<li class="uppercase">xml</li>');
      $("#rendertype").find('ul').append('<li class="capitalize">text</li>');
      $("#rendertype").find('ul').append('<li class="uppercase">html</li>');
    }
    else if (resultType === 'map') {
      $("#rendertype").find('ul').append('<li class="uppercase">xml</li>');
      $("#rendertype").find('ul').append('<li class="capitalize">text</li>');
    }
    else if (resultType === 'comment' || resultType === 'element') {
      $("#rendertype").find('ul').append('<li class="uppercase">xml</li>');
      $("#rendertype").find('ul').append('<li class="capitalize">text</li>');
      $("#rendertype").find('ul').append('<li class="uppercase">html</li>');
    }
    
    else if (resultType === 'string' || resultType === 'text') {
      $("#rendertype").find('ul').append('<li class="uppercase">xml</li>');
      $("#rendertype").find('ul').append('<li class="uppercase">json</li>');
      $("#rendertype").find('ul').append('<li class="capitalize">text</li>');
      $("#rendertype").find('ul').append('<li class="uppercase">html</li>');
    }
    else {
    	$("#rendertype").find('ul').append('<li class="capitalize">text</li>');
    }
  }
}


qconsole.resize = function() {
	var container 	= $('#application-space'),
		editor 		= $('#editor-box'),
		bar 		= $('.results-settings-bar'),
		barTop,
		paneSpace,
		view 		= $('#view-states');
	
	// size application container  (necessary?)
	container.css("height",Math.floor($(window).height() - $('#cy-header').height()) );
	
	// position editor, bar and output view
	barTop = Math.floor(container.height() * qconsole.barPosition);
	bar.css("top",barTop);
	editor.css("top",0);
	view.css("top",barTop + bar.height());
	
	// scale editor and output view
	paneSpace = container.height() - bar.height();
	editor.css("height",barTop);
	view.css("height",paneSpace - editor.height());	

    qconsole.resizeEditor();    // resize editor container
    if (qconsole.editor)
        qconsole.editor.refresh();   // use CodeMirror internals to resize editor to match container
    if ($("#browse-view .results").length) // if the browse view is up, resize the headers when the page width resizes
        qconsole.Explorer.sizeExploreHeader();
};


qconsole.setBarMode = function(barMode) {
    qconsole.previousBarMode = qconsole.barMode;
    qconsole.barMode = barMode;

    switch(qconsole.barMode)
    {
    case 'center':
    	qconsole.barPosition = .5;
    	break;
    case 'bottom':
    	qconsole.barPosition = 1 - ( $('.results-settings-bar').height() / $('#application-space').height() );  // TODO: change this value to a calculation based on pane height & bar height
    	break;
    case 'top':
    	qconsole.barPosition = 0;
    	break;
    default:
    	// centered    	
    	qconsole.barPosition = .5;
    	break;
    }             

    qconsole.resize();
};

qconsole.positionHistory = function() {
    if (qconsole.sidebar === "on") {
    	$('#sidebar-history-btn').css("left",$(document).width() - ($('#sidebar-history-btn').width() + 215));
    	$('#history-overlay').css("left",$(document).width() - ($('#sidebar-history-btn').width() + 200));
    } else { 
        $('#sidebar-history-btn').css("left",$(document).width() - ($('#sidebar-history-btn').width() + 20));
        $('#history-overlay').css("left",$(document).width() - ($('#history-overlay').width() + 25));      
    }
};

qconsole.toggleSidebar = function() {
    if (qconsole.sidebar == "off") {
        qconsole.sidebar = "on";
        $('#workspace-sidebar-container').show();
        $('#sidebar-workspace-btn').removeClass("closed");
    } else {  // turn it off
        qconsole.sidebar = "off";
        $('#workspace-sidebar-container').hide();
        $('#sidebar-workspace-btn').addClass("closed"); 
    }
    qconsole.resizeEditor();
};

// Move the mode bar,  from middle to top,  from top to center,  from bottom to center
qconsole.toggleModeBar = function() {
    $("#footer").hide();
    switch(qconsole.barMode)
    {
        case 'center':
            if (qconsole.previousBarMode == "top") {
                qconsole.setBarMode("bottom");
            } else {
                qconsole.setBarMode("top");
            }
            break;
        case 'bottom':
            qconsole.setBarMode('center');
            break;
        case 'top':
            qconsole.setBarMode('center');
            break;
        case 'custom':
            qconsole.setBarMode('center');
            break;
    }
};

qconsole.resizeEditor = function() {
    if ($('.results-settings-bar').length > 0) {
        var editorHeight = $("#editor-box").height();
        var editorWidth = $(window).width();
        if (qconsole.sidebar == "on") {
            editorWidth = $(window).width() - $('#sidebar-space').width() - 3;
            $("#query-list-space").css('height',editorHeight - $('#search').outerHeight() - $('#sidebar-btns').outerHeight() - $('#add-query-space').outerHeight());
        }

        $('#editor-ct').css('height',editorHeight);
        $('#editor-ct').css('width',$(window).width());

        $('#tab-space').css('width',$(document).width() - ( parseInt($('#editor-controls').css('margin-left').replace('px','')) + $('#sidebar-btns').width() + parseInt($('#sidebar-btns').css('margin-left').replace('px','')) + parseInt($('#sidebar-btns').css('margin-right').replace('px','')) + 5 ));
        if (qconsole.tabsObj.resize !== undefined)
            qconsole.tabsObj.resize();

        $('#query-text-space').css('height',editorHeight - $('#source-space').height() - $('#tab-space').height() - 2);
        if (qconsole.sidebar == "off")
            $('#query-text-space').css('width',$(document).width());
        else
            $('#query-text-space').css('width',$(document).width() - $('#sidebar-space').width());
        
        qconsole.positionHistory();
    }
};

// when the dropdown changes, get it's value and update the current tab's info
qconsole.appServerChange = function() {
    var currentWorkspace = qconsole.getCurrentWorkspace();
    var currentQuery = currentWorkspace.getFocusedQuery();
    currentQuery.setProperty('content-source',$(".data-source").val());
    currentQuery.save();  // save to database
};

//when the dropdown changes, get it's value and update the current tab's mode info
qconsole.modeChange = function() {
	var newMode = $("#query-type").val();
    var currentWorkspace = qconsole.getCurrentWorkspace();
    var currentQuery = currentWorkspace.getFocusedQuery();
    qconsole.tabsObj.updateTabMode(newMode);
    currentWorkspace.updateQueryMode(newMode);
    currentQuery.save();  // save to database
};

qconsole.switchWorkspaces = function(id) {
    var currentWorkspace = qconsole.getCurrentWorkspace();
    currentWorkspace.close();
    var curWorkspaceLoc = qconsole.getWorkspaceArrayLoc(id);
    var curWorkspace = qconsole.workspaces[curWorkspaceLoc];
    curWorkspace.active = true;

    qconsole.serverInteractionsObj.updateWorkspace(curWorkspace, function(workspace) {
        curWorkspace.load();
        qconsole.loadWorkspaceDropdown();
    });
};

qconsole.createNewWorkspace = function() {
    var currentWorkspace = qconsole.getCurrentWorkspace();
    currentWorkspace.close();

    qconsole.serverInteractionsObj.newWorkspace(function(workspace) {
        var newWsLoc = qconsole.workspaces.length;
        qconsole.workspaces[newWsLoc] = new qconsole.Workspace(workspace);
        qconsole.workspaces[newWsLoc].load();

        // update workspace dropdown list
        qconsole.loadWorkspaceDropdown();
    });

};

qconsole.cloneWorkspace = function() {
    var currentWorkspace = qconsole.getCurrentWorkspace();
    var currentWorkspaceID = currentWorkspace.id;
    currentWorkspace.close();

    qconsole.serverInteractionsObj.cloneWorkspace(currentWorkspaceID,function(workspace) {
        var newWsLoc = qconsole.workspaces.length;
        qconsole.workspaces[newWsLoc] = new qconsole.Workspace(workspace);
        qconsole.workspaces[newWsLoc].load();

        // update workspace dropdown list
        qconsole.loadWorkspaceDropdown();
    });
};

qconsole.exportWorkspace = function() {
    var currentWorkspace = qconsole.getCurrentWorkspace();
    var currentWorkspaceID = currentWorkspace.id;

    qconsole.serverInteractionsObj.exportWorkspace(currentWorkspaceID);
};

qconsole.importWorkspace = function() {
    qconsole.workspaceDropdownOn = false;
    $("#workspace-dropdown").hide();

    $("#import-workspace").html( '<iframe src="import.xqy" id="import-frame" frameborder="0"></iframe>' );
    var importIFrame = $("#import-workspace iframe");
    var formSubmitted = false;

    importIFrame.load(function() {
        if (formSubmitted) {
            qconsole.importing = true;  // tells the app the reload is due to import, so skip WS save
            location.reload();
        }

        var importSubmitForm = $("#import-frame").contents().find('form');
        importSubmitForm.submit(function() {
        	setTimeout(function() {
        		if (importSubmitForm.attr('data-submitted') === 'true') {
        			$("#import-workspace iframe").hide();
                    $("#import-workspace").prepend('<div id="loading-import"><p>Loading your imported workspace... <br /><br /> <img alt="spinner standard" src="../common/mlux/images/large-ajax-loader.gif"></p></div>');
                    formSubmitted = true;
        		}        		
        	},50);
        });
    });

    $("#import-workspace").show();
};

qconsole.closeImportWorkspace = function() {
    $("#import-workspace").hide();
};

qconsole.confirmDeleteWorkspace = function() {
    var currentWorkspace = qconsole.getCurrentWorkspace();

    var performDelete = confirm('Deleting the workspace "' + currentWorkspace.name + '" will also delete all associated queries.')
    if (performDelete) {
           // close drop-down
        qconsole.workspaceDropdownOn = false;
        $("#workspace-dropdown").hide();
        currentWorkspace.deleteWorkspace();
        // update workspace dropdown list
        qconsole.loadWorkspaceDropdown();
    }
};


qconsole.updateTabOrder = function() {
    var currentWorkspace = qconsole.getCurrentWorkspace();
    currentWorkspace.updateQueryTabOrder(qconsole.tabsObj.items);
};

/*****************/
/*   RUN QUERY   */
/*****************/
// currently only triggered only by shortcuts
qconsole.stopQuery = function() {
	if ($('#run-btn').hasClass('stop')) {
        if (!$('#run-btn').hasClass('pressed')) {
        	$("#query-view-content").html("<p class='output-msg'>Canceling execution query...</p>");
        	qconsole.cancelQuery();
        }
	}
}

qconsole.runQuery = function() {
	if (!$('#run-btn').hasClass('disabled')) {
		if ($('#run-btn').hasClass('stop')) {
	        if (!$('#run-btn').hasClass('pressed')) {
	        	$("#query-view-content").html("<p class='output-msg'>Canceling execution query...</p>");
	        	qconsole.cancelQuery();
	        }	        		
		} else {
			qconsole.sanitizeQuery();
			qconsole.runQueryAs(qconsole.resultsFormat);
	    }	
	}
}

qconsole.generateExecutionID = function(idLength) {
	return Math.floor(Math.pow(10, idLength - 1) + Math.random() * 9 * Math.pow(10, idLength - 1));
}

// removes Unicode characters - breaks JSON and XML on server
qconsole.sanitize = function(query) {
	var obj = {}, newQ, sanitizedStr;
    
	obj.content 	= query;
	newQ 			= JSON.stringify(obj);	
	newQ 			= newQ.split('').reverse().join('');
	// carriage return (13) and newline (10) are replaced with \n
	// in all scenarios tested, all pasted text with newline becomes \n on its own 
	// through JSON.stringify. In case there is a scenario where these characters get through
	// as seen in the Unicode string below, then we want to swap them out for \n 
	newQ 			= newQ.replace(/[0|3]100u\\(?!\\)/g, 'n\\');
	// strip all Unicode control characters \u0000 - \u001F, except \u0009 
	newQ 			= newQ.replace(/(?!90)([0-9a-fA-F][0-1])00u\\(?!\\)/g, '');
	newQ 			= newQ.split('').reverse().join('');
	newQ 			= newQ.replace(/(?!\\)\\[bf]{1}/g, '');  // remove \b \f
	sanitizedStr 	= JSON.parse(newQ);
	return sanitizedStr.content;
}

qconsole.sanitizeQuery = function(query) {
	var obj = {}, sanitizedQ;
	
    currentWorkspace 	= qconsole.getCurrentWorkspace();
    currentQuery 		= currentWorkspace.getFocusedQuery();
    currentTab 			= qconsole.tabsObj.getSelectedTab();
    
    sanitizedQ = qconsole.sanitize(currentTab.content);
	// if a Unicode character was found and stripped, then we need to update the Query object
	if (sanitizedQ !== currentTab.content) {
		currentTab.updateContent(sanitizedQ);
		currentQuery.setProperty('content',sanitizedQ);
		qconsole.codeMirrorResponseObj.set(sanitizedQ);  // update editor with new query
	}
}

qconsole.run = function() {
    $("#query-view-content").html(''); 
    $("#profiling-view-content").html(''); 
    
    var currentWorkspace, currentTab, currentQuery, evalData;
    
    currentWorkspace 	= qconsole.getCurrentWorkspace();
    currentQuery 		= currentWorkspace.getFocusedQuery();
    currentTab 			= qconsole.tabsObj.getSelectedTab();
    currentWorkspace.updateTabFrontQuery(currentTab.content, false);
    currentQuery.updateContentHistory();
    
    $("#footer").hide();
    evalData 			= {};
    evalData 			= qconsole.getDatasource(evalData);  // sets sid or dbid, depending on which type of source
    evalData.qid 		= currentQuery.id;
    evalData.crid 		= qconsole.generateExecutionID(10);
    evalData.content	= (!currentQuery.isContentDirty()) ? undefined : currentTab.content;
    evalData.dirty		= (currentQuery.isContentDirty()) ? true : undefined;
    evalData.action 	= "eval";
    evalData.querytype 	= $("#query-type").val();
    
    qconsole.queryExecuting 				= {};
    qconsole.queryExecuting.id 				= evalData.qid;
    qconsole.queryExecuting.executionID 	= evalData.crid;
    
    qconsole.serverInteractionsObj.eval(evalData, function(data, xhr) {
    	// update model
    	if (currentQuery.isContentDirty())
        	currentQuery.setProperty("contentDirty",false);  // saved content via eval
    	
    	// save history
        currentQuery.saveHistory();    	
    	
        // update UI
        qconsole.queryExecuting = null;
    	qconsole.restoreRunBtnState();
    	$('#query-type').val();
        if (xhr.getResponseHeader('qconsole') !== null) {
            var qconsoleEvalMsg = JSON.parse(xhr.getResponseHeader('qconsole'));

            if (qconsoleEvalMsg.type == 'error') {
                var response = JSON.parse(data);
                qconsole.evalResults = null;
                qconsole.displayError(response,'query');
            } else {
                var replicaMsg = (qconsoleEvalMsg.type == 'replica') ? qconsoleEvalMsg.message + qconsoleEvalMsg.timestamp : '';
                qconsole.displayExecMessage(replicaMsg);
                    
                qconsole.evalResults = data;
                qconsole.displayQueryResults();
            }
        } else {
            qconsole.evalResults = data;
            qconsole.displayQueryResults();
        }        
    },function(data) {  // error callback
    	qconsole.queryExecuting = null;
    	qconsole.restoreRunBtnState();
    });
};

qconsole.cancelQuery = function(qid) {
	if (qconsole.queryExecuting !== null)  {
	    $('#run-btn').addClass('pressed');
	    var evalData = {};
	    evalData.qid = qconsole.queryExecuting.id;
	    evalData.crid = qconsole.queryExecuting.executionID;
	    evalData.action = "cancel";
      evalData.querytype = $("#query-type").val();

	    qconsole.serverInteractionsObj.cancel(evalData, function(data, xhr) {
	        qconsole.queryExecuting = null;
	        qconsole.restoreRunBtnState();
            $('#run-btn').removeClass('pressed');   // clears flag telling UI the stop has been pressed.  Disallows multiple presses of stop.
            $("#query-view-content").html("<p class='output-msg'>Query execution canceled</p>");
	        if (xhr.getResponseHeader('qconsole') !== null) { 
	            var qconsoleEvalMsg = JSON.parse(xhr.getResponseHeader('qconsole'));

	            if (qconsoleEvalMsg.type == 'error') {
	                var response = JSON.parse(data);
	                qconsole.displayError(response,'query');
	            }
	        }
	    },function(data) {  // error callback
	    	qconsole.queryExecuting = null;
	    	qconsole.restoreRunBtnState();
            $('#run-btn').removeClass('pressed');   // clears flag telling UI the stop has been pressed.  Disallows multiple presses of stop.
            $("#query-view-content").html("<p class='output-msg'>Query execution canceled</p>");
	    });
	}
};

qconsole.displayMsg = function(msg, timeout) {
    $("#msgbox-inner").html(msg);
    $("#msgbox-outer").addClass("show");
    if (timeout) {
        // then this message timesout
        setTimeout(function(){
            qconsole.closeMsg();
        },timeout);
    }
};
qconsole.closeMsg = function() {
    $("#msgbox-outer").removeClass("show");
    $("#msgbox-inner").html('');
};

qconsole.getDatasource = function(data) {
    var source = $(".data-source").val();

    if (source.indexOf("as:") != -1) {
        data.sid = source.replace("as:","").replace(":","");
    } else {
        data.dbid = source.replace(":0:Apps","");
    }
    return data;
};

qconsole.setIFrameContent = function(selector,type,data) {
    if ($.browser.safari) {
        $(selector).ready( function(){
            $(selector).contents().find('body').html(data);
        });
    } else {
        $(selector).load( function(){
            $(selector).contents().find('body').html(data);
        });
    }
};

qconsole.displayQueryResults = function() {
	var output;
    
  if (qconsole.evalResults !== null) {
    // fix for empty sequence returning
    if (qconsole.evalResults === "" || JSON.parse(qconsole.evalResults).length < 1) {
      $('#query-view-content').html("<i>your query returned an empty sequence</i>");
    } else {
      
      output = JSON.parse(qconsole.evalResults);
      
      if (!$.isArray(output)) {
        output = [output];
      }
      
      switch(qconsole.resultsFormat) {
        case 'auto':
          ML.hifi(output, $("#query-view-content"));
          break;
        case 'raw':
          ML.hifi(output, $("#query-view-content"), true);
          break;
        default:
          break;
      }		
      
      qconsole.displayOutputView(qconsole.resultsFormat);		
    }
  }
};

qconsole.renderOutput = function(content, mode) {
	if (content !== null) {
	    ML.dataHighlight(content, mode, $('#query-view-content'));
	}
};

qconsole.hideQueryOutput = function() {
    // manually remove Code Mirror since the toTextArea() is not breaking
    if (qconsole.viewer) {
        $("#query-view  .CodeMirror-wrapping").remove();
        $("#query-view-content").css("display","block");
        qconsole.viewer = 0;
    }
};

qconsole.ouputFileContents = function(response,mode) {
	var type, output;
    type = (mode == 'xml') ? 'element' : 'string';
    output = [{"type":type, "result":response}]
    ML.hifi(output, $("#browse-view-content"), undefined, false);
};

qconsole.displayError = function(errorReturn, location) {
    var errorLine, errorColumn, errorOperation, errorVariables, lineText;
    var i, j, k, x;

    qconsole.hideQueryOutput();
    var errorOutput = '<div class="error-control"><p>' + errorReturn.error.evalinfo + '</p></div>';
    errorOutput += '<div class="error-output"><div class="main-error"><h3>' + $('<div/>').text(errorReturn.error.errorcode).html() + '</h3><p></p></div>';

    errorOutput = errorOutput + '<h2>Stack Trace</h2>';

    var errorStack = errorReturn.error.stacktrace.stack;
    for (i=0; i < errorStack.length - 2; i++) {  // added -2 to ignore amped and eval.xqy return since we need to examine validity

        errorOutput = errorOutput + '<div class="errorframe">';
        if ((errorStack[i].whereURI === undefined) && (errorStack[i].lines !== undefined)) {
            errorLine = errorStack[i].errorline;
            errorColumn = errorStack[i].errorcolumn;
            errorOperation = errorStack[i].operation || "";
            errorVariables = errorStack[i].code || [];

            var lineNum = '';

            errorOutput += '<h4>At line ' + errorLine + ' column ' + errorColumn + ':</h4>';
            if (i < errorStack.length - 3)
                errorOutput += '<p>In ' + $('<div/>').text(errorOperation).html() + '</p>';
            errorOutput += '<p class="thevars">';
            for (x=0; x < errorVariables.length; x++) {
                errorOutput += $('<div/>').text(errorVariables[x]).html() + '<br/>';
            }
            errorOutput += '</p>';            
            errorOutput += '<p class="errorblock">';

            for (k=0; k < errorStack[i].lines.length; k++) {

                // goofy way of calculating start
                if (errorLine > 2) {
                    var startingLineNum = parseInt(errorLine) - 2;
                } else {
                    var startingLineNum = parseInt(errorLine);
                    if (errorLine == 2) {
                        var startingLineNum = startingLineNum - 1;
                    }
                }

                lineNum = k + startingLineNum;
                lineNum = lineNum.toString();
                if (errorStack[i].lines[k] != null)
                    lineText = errorStack[i].lines[k];
                else
                    lineText = '';
                if (lineNum == errorLine) {
                    errorOutput = errorOutput + '<span class="error-line">' + lineNum + '. ' + qconsole.highlightErrChar(lineText, parseInt(errorColumn)) + '</span><br />';
                } else {
                    errorOutput = errorOutput + lineNum + '. ' + $('<div/>').text(lineText).html() + '<br />';
                }
            }
            errorOutput = errorOutput + '</p>';

        } else {
            errorOutput = errorOutput + '<h4>In ' + errorStack[i].whereURI + ' on line ' + errorStack[i].errorline + '<br />';
            if (errorStack[i].operation !== null) {
                errorOutput = errorOutput + 'In ' + $('<div/>').text(errorStack[i].operation).html();
            } else {
                errorOutput = errorOutput + '<br /><br />'
            }
            errorOutput = errorOutput + '</h4>'
            
            if (errorStack[i].code !== undefined) {
                errorOutput = errorOutput + '<p class="thevars">';
                for (j=0; j < errorStack[i].code.length; j++) {
                    errorOutput = errorOutput + $('<div/>').text(errorStack[i].code[j]).html() + '<br />';
                }
                errorOutput = errorOutput + '</p>';
            }

        }
        errorOutput = errorOutput + '</div>';
    }

    $("#" + location + "-view-content").html( errorOutput );

};

qconsole.highlightErrChar = function(lineText, index) {
    var head = $('<div/>').text(lineText.substring(0, index)).html();
    var errChar = lineText.charAt(index);
    var tail = $('<div/>').text(lineText.substring(index+1)).html();
    return head + '<span class="errorchar">' + errChar + '</span>' + tail;
};

qconsole.nl2br = function(text) {
    var pattern = "\n",
    regEx = new RegExp(pattern, "g");

    return text.replace(regEx, '<br />');
};

qconsole.stripOutQueryString = function(urlString, queryVar) {
    var followingAmp = 0;
    var queryVarPosition = urlString.indexOf('&' + queryVar);
    if (queryVarPosition == -1) {  // then this variable is at the front of the query string, so check for it without &
        queryVarPosition = urlString.indexOf(queryVar)
        followingAmp = urlString.indexOf('&',queryVarPosition + 1) + 1;    // and be sure to remove the '&' from the var after it (+1)
    } else {
        followingAmp = urlString.indexOf('&',queryVarPosition + 1);
    }
    if (followingAmp == -1) {  // then there is no variable after it, so just chop it off the end of the string.
        followingAmp = urlString.length;
    }
    return urlString.substr(0, queryVarPosition) + urlString.substr(followingAmp, urlString.length - followingAmp);
};



/*****************/
/*   PROFILING   */
/*****************/

qconsole.profileQuery = function() {
    $("#query-view-content").html(''); 
    $("#profiling-view-content").html(''); 
    qconsole.evalResults = null;

    var currentWorkspace, currentTab, currentQuery, evalData;
    
    currentWorkspace 	= qconsole.getCurrentWorkspace();
    currentQuery 		= currentWorkspace.getFocusedQuery();
    currentTab 			= qconsole.tabsObj.getSelectedTab();
    currentWorkspace.updateTabFrontQuery(currentTab.content, false);
    currentQuery.updateContentHistory();
    
    $("#footer").hide();
    evalData 			= {};
    evalData 			= qconsole.getDatasource(evalData);  // sets sid or dbid, depending on which type of source
    evalData.qid 		= currentQuery.id;
    evalData.crid 		= qconsole.generateExecutionID(10);
    evalData.content	= (!currentQuery.isContentDirty()) ? undefined : currentTab.content;
    evalData.dirty		= (currentQuery.isContentDirty()) ? true : undefined;
    evalData.action 	= "profile";
    evalData.querytype 	= $("#query-type").val();

    qconsole.queryExecuting = {};
    qconsole.queryExecuting.id = evalData.qid;
    qconsole.queryExecuting.executionID = evalData.crid;    
    
    qconsole.serverInteractionsObj.eval(evalData, function(data, xhr) {
    	// update model
    	if (currentQuery.isContentDirty())
        	currentQuery.setProperty("contentDirty",false);  // saved content via eval
    	
    	// save history
        currentQuery.saveHistory();   
        
        qconsole.queryExecuting = null;
        qconsole.restoreRunBtnState();
        if (xhr.getResponseHeader('qconsole') !== null) {            
            var qconsoleEvalMsg = JSON.parse(xhr.getResponseHeader('qconsole'));

            if (qconsoleEvalMsg.type == 'error') {
                var response 			= JSON.parse(data);
                qconsole.profileResults = null;
                qconsole.displayError(response,'profiling');
            } else {
                var replicaMsg = (qconsoleEvalMsg.type == 'replica') ? qconsoleEvalMsg.message + qconsoleEvalMsg.timestamp : '';
                qconsole.displayExecMessage(replicaMsg);
                var jsonData			= JSON.parse(data);    
                qconsole.profileResults = jsonData;
                qconsole.displayProfileOutput();
            }            
        } else {
        	var jsonData			= JSON.parse(data);
            qconsole.profileResults = jsonData;
            qconsole.displayProfileOutput();
        }
    },function(data) {  // error callback
    	qconsole.queryExecuting = null;
    	qconsole.restoreRunBtnState();
    });
};

/* function called by initial profiling request & on click of a column */
qconsole.generateProfileRows = function(tableID, sortBy, sortDescending) {
		var altRow, altRowClass, profileOutput = '';
		// defaults
		sortBy 			= (sortBy) ? sortBy : qconsole.profileDefaultSortColumn;
		sortDescending 	= (sortDescending !== undefined) ? sortDescending : true;
		if (qconsole.profileResults.profiling.reports[tableID] && qconsole.profileResults.profiling.reports[tableID].details) {
	        altRow = true;
	        altRowClass = ' class="altrow"';
	        
	        // SORT
    		qconsole.profilingDataSort(qconsole.profileResults.profiling.reports[tableID].details, sortBy, sortDescending);
    		
    		// GENERATE ROWS
            $.each(qconsole.profileResults.profiling.reports[tableID].details,function(index,currentRow) {
            	profileOutput += '<tr ';
                profileOutput += (altRow == true) ? altRowClass : '';
                profileOutput += '>';
                profileOutput += '<td class="profiling module-line">' + currentRow.location.uri + ':' + currentRow.location.line + ':' + currentRow.location.column + '</td>';
                profileOutput += '<td class="profiling count">' + currentRow.count + '</td>';
                profileOutput += '<td class="profiling shallow-percent"><div class="sort-value percent">' + currentRow["shallow-percent"] + '</div><div class="bar-container"><div class="percentagebar" style="width:' + currentRow["shallow-percent"] + '%;">&nbsp; </div></div></td>';
                profileOutput += '<td class="profiling shallow-us">' + currentRow["shallow-us"] + '</td>';
                profileOutput += '<td class="profiling deep-percent"><div class="sort-value percent">' + currentRow["deep-percent"] + '</div><div class="bar-container"><div class="percentagebar" style="width:' + currentRow["deep-percent"] + '%;">&nbsp; </div></div></td>';
                profileOutput += '<td class="profiling deep-us">' + currentRow["deep-us"] + '</td>';
                profileOutput += '<td class="profiling expression">' + $('<div/>').text(currentRow.expression).html() + '</td>';
                profileOutput += '</tr>';
                altRow = (altRow === true) ? false : true;
            });
        }
        return profileOutput;
}

/* function called on initial return of request for profiling of an XQuery query */
qconsole.displayProfileOutput = function() {
    var i, j, len1, len2, currentRow, altRowClass, altRow, profileOutput = '';    
    if (qconsole.profileResults !== null) {
    	var profileOutput = '';
    	for (i=0, len1 = qconsole.profileResults.profiling.reports.length; i < len1; i++) {
    		profileOutput += '<div id="profile-report-' + i + '" class="profile-content-container">';    		
            profileOutput += '<div class="view-details-bar" title="Number of times the expression was called"><span class="title">Profile </span><span style="padding:0 10px;"><strong>' + qconsole.profileResults.profiling.reports[i].summary.count + '</strong> Expressions</span><span style="padding-left:10px;"><strong>' + qconsole.profileResults.profiling.reports[i].summary.elapsed + '</strong></span><div class="copy-profile-icon">Copy</div></div>';
            profileOutput += '<div class="profile-content">';
            profileOutput += '<table class="results"><thead><tr>';            
            // GENERATE HEADERS
            profileOutput += '<th id="report-'+i+'-module-line" title="Module called and line number" class="ts-order-asc">Module:Line No.:Col No.</th>';
            profileOutput += '<th id="report-'+i+'-count" class="ts-order-desc">Count</th>';
            profileOutput += '<th id="report-'+i+'-shallow-percent" title="Percentage of time spent in the expression" class="ts-order-desc active">Shallow %</th>';
        	profileOutput += '<th id="report-'+i+'-shallow-us" title="Time spent in the expression" class="ts-order-desc">Shallow µs</th>';
    		profileOutput += '<th id="report-'+i+'-deep-percent" title="Percentage of combined time spent in the expression and sub expressions" class="ts-order-desc">Deep %</th>';
			profileOutput += '<th id="report-'+i+'-deep-us" title="Combined time spent in the expression and sub expressions" class="ts-order-desc">Deep µs</th>';
			profileOutput += '<th id="report-'+i+'-expression" class="ts-disabled">Expression</th>';			
			profileOutput += '</tr></thead><tbody>';    		
            profileOutput += qconsole.generateProfileRows(i);
            profileOutput += '</tbody></table></div>';
            profileOutput += '</div>';
        }

        $("#profiling-view-content").html( profileOutput );
    }
};

/*****************/
/*   DISPLAY     */
/*****************/

qconsole.displayOutputView = function(viewType) {
    var outputType, queryViewTypes = ["auto","raw"];
    outputType = ($.inArray(viewType, queryViewTypes) !== -1) ? "query" : viewType;

    qconsole.viewResultMode = outputType;
    $('.content-view').removeClass('show');
    $('#' + outputType + '-view').addClass('show');
    
    // if we're in Raw output, add class to the container so CSS knows not to render styling
    if (viewType == 'raw')
    	$('#' + outputType + '-view').addClass('raw');
    else
    	$('#' + outputType + '-view').removeClass('raw');
    
    qconsole.resize();
};

qconsole.getQuerystring = function(key, default_)
{
  if (default_==null) default_="";
  key = key.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regex = new RegExp("[\\?&]"+key+"=([^&#]*)");
  var qs = regex.exec(window.location.href);
  if(qs == null)
    return default_;
  else
    return qs[1];
};

qconsole.restoreRunBtnState = function () {
    if (qconsole.queryExecuting == null) {
    	// returns the state to run, if a query isn't executing
    	qconsole.setRunBtnState("run");
    }
};

//setting state take:  "disabled" & "stop", if empty or "run", just clear classes and return to run state 
qconsole.setRunBtnState = function (state) {
	$("#run-btn").removeClass("disabled");
	$("#run-btn").removeClass("stop");
	$("#run-btn").removeClass("run");
	
	// setting state take:  "disabled" & "stop"
	if (state == "disabled" || state == "stop" || state == "run") {
		$("#run-btn").addClass(state);
			
		if (state == "run" || state == "disabled") {
			$("#run-btn").text("Run");
			qconsole.setTooltip("#run-btn","Run query (ctrl enter)");
		}			
		
		if (state == "stop") {
			$("#run-btn").text("Stop");
			qconsole.setTooltip("#run-btn","Stop query");
		}
	}	
};

qconsole.displayExecMessage = function (message) {
    $("#execution-results-msg").text(message);
};

qconsole.displayBrowseMessage = function (message) {
    $("#browse-results-msg").text(message);
};

/****************************/
/*** For Selenium Testing  **/
/****************************/

qconsole.showSeleniumInjector = function () {
    $("#selenium-txt").css("display","block");
    $("#selenium-btn").click(function() {
        qconsole.codeMirrorResponseObj.set($("#selenium-txt textarea").val());
        $("#selenium-txt").css("display","none");
    });
};

qconsole.getSeleniumTextXMLOutput = function () {
    return qconsole.viewer.getValue();
};

/*********************************/
/*** Functions for Keybindings  **/
/*********************************/
// function only executes when in Query Mode
qconsole.runQueryAs = function (outputType) {
    var outputType = (outputType === undefined) ? qconsole.resultsFormat : outputType;
    if (!qconsole.queryExecuting) {
        qconsole.setRunBtnState("stop");
        if (qconsole.resultsFormat == "profiling") {
        	qconsole.displayOutputView("profiling");
        	qconsole.profileQuery();
        } else {
        	$("#output-type-menu #query-results").click();  // activate Query Tab
        	$("#output-type-menu #query-results a").removeClass();
        	$("#output-type-menu #query-results a#results-type-" + outputType).addClass("selected");        	
        	qconsole.displayOutputView("query");
        	qconsole.run();
        }            
    }
    qconsole.displayExecMessage("");
};

qconsole.setupAndProfileQuery = function () {
	$("#profile-results").click();
    qconsole.runQueryAs("profiling");
};

qconsole.keybindFuncAddQuery = function () {
    var currentWorkspace = qconsole.getCurrentWorkspace();
    currentWorkspace.addQuery();
};

qconsole.keybindFuncCloseTab = function () {
    if (qconsole.tabsObj.items.length > 1) {
        var currentWorkspace = qconsole.getCurrentWorkspace();
        var currentQuery = currentWorkspace.getFocusedQuery();

        currentQuery.deactivate();
        var lastTabID = qconsole.tabsObj.getLastTabID();
        currentWorkspace.activateQuery(lastTabID);
    }
};

qconsole.keybindFuncPrevQuery = function () {
    var currentWorkspace = qconsole.getCurrentWorkspace();
    currentWorkspace.openPrevQuery();
};

qconsole.keybindFuncNextQuery = function () {
    var currentWorkspace = qconsole.getCurrentWorkspace();
    currentWorkspace.openNextQuery();
};

qconsole.keybindFuncActivateTab = function (location) {
    var queryIDToActivate = qconsole.tabsObj.getQueryIDatUILocation(location);
    if (queryIDToActivate !== undefined) {
        var currentWorkspace = qconsole.getCurrentWorkspace();
        // remove focus and saves query as focus=false
        currentWorkspace.unfocusQuery(currentWorkspace.getFocusedQuery().id);
        // activate new query
        currentWorkspace.activateQuery(queryIDToActivate);
    }
};

qconsole.selectText = function (obj) {
	var selection, range;	
    
    if (document.createRange) {     // all browsers, except IE before version 9
    	selection = window.getSelection();
    	range = document.createRange();
        range.selectNodeContents(obj);
        selection.removeAllRanges();
        selection.addRange(range);
    }
    else {      // Internet Explorer before version 9
    	range = document.body.createTextRange();
    	range.moveToElementText(obj);
    	range.select();
    }    
};

qconsole.keybindFuncSelectOutput = function () {
	if (qconsole.outputSelected !== undefined)
		qconsole.selectText(qconsole.outputSelected);
};

qconsole.displayCodeMode = function () {
    qconsole.setBarMode("bottom");
    qconsole.sidebar = "on";
    qconsole.toggleSidebar();
};


qconsole.searchQueryNextOutput = function (text) {
    if (qconsole.searchQueryOutput !== text) { // first search
        qconsole.searchQueryOutput = text;
        qconsole.searchQueryOutputCursor = qconsole.viewer.getSearchCursor(text);
    }
    if (qconsole.searchQueryOutputCursor.findNext())
        qconsole.viewer.setSelection(qconsole.searchQueryOutputCursor.from(), qconsole.searchQueryOutputCursor.to());
};

qconsole.displaySearchOutputDialogue = function () {
    if (qconsole.viewResultMode == "query" && typeof(qconsole.viewer) == "object") {
        if ($("#search-content-box-container").css("display") !== "block") {
            $("#search-content-box-container").css("display","block");
        }     
        if ($("#search-content-box-input").val() !== '') {
            qconsole.searchQueryNextOutput($("#search-content-box-input").val());  // then there's text in the box, so find the next one
        } 
        $("#search-content-box-input").focus();
    }      
};


/*********************/
/*** Tooltip setup  **/
/*********************/

qconsole.setupTooltips = function () {
    var i, len;
    
    var tooltipArray = [
                        ['#qc-tabs-scroll-pane .tab-close','Close tab (alt -)'],
                        ['#explore-source-btn','Browse database documents'],
                        ['#eval','Select the content source used to evaluate this query'],
                        ['#sidebar-workspace-btn','Toggle workspace'],
                        ['#workspace-title-text','Current workspace. Dbl-click to rename.'],
                        ['#workspace-arrow','Workspace actions'],
                        ['#history-text','View query history (ctrl alt H)'],
                        ['#query-list .query-doc-name','Click to open. Dbl-click to rename'],
                        ['#query-list .delete-icon','Delete query from workspace'],
                        ['.history-query .delete','Delete query from history'],
                        ['#tab-space .add-tab-btn','Add query to workspace (alt =)'],
                        ['#add-query-btn','Add query to workspace (alt =)'],
                        ['#bar-interaction-wrapper','Drag or Dbl-click to adjust bar position (ctrl shift space)'],
                        ['#run-btn','Run query (ctrl enter)'],
                        ['#results-type-auto','Display pretty-printed results'],
                        ['#results-type-raw','Display Raw results'], 
                        ['#query-results','Display result in selected format'],
                        ['#profile-results','Profile Query'],
                        ['#explore-results','Database Browser'], 
                        ['#button-back','Back'],
                        ['#button-forward','Forward'],
                        ['#remove-collection-filter','Remove collection filter'],
                        ['.results-col-prop',"View document properties"],
                        ['.results-col-coll',"Filter explore by collection"],
                        ['.icon-seek-first','First'],
                        ['.icon-seek-prev','Previous'],
                        ['.icon-seek-next','Next'],
                        ['.icon-seek-end','Last']
                    ];

    var tooltipArrayMAC = [
                           ['#qc-tabs-scroll-pane .tab-close','Close tab (option -)'],
                           ['#explore-source-btn','Browse database documents'],
                           ['#eval','Select the content source used to evaluate this query'],
                           ['#sidebar-workspace-btn','Toggle workspace'],
                           ['#workspace-title-text','Current workspace. Dbl-click to rename.'],
                           ['#workspace-arrow','Workspace actions'],
                           ['#history-text','View query history (ctrl option H)'],
                           ['#query-list .query-doc-name','Click to open. Dbl-click to rename'],
                           ['#query-list .delete-icon','Delete query from workspace'],
                           ['.history-query .delete','Delete query from history'],
                           ['#tab-space .add-tab-btn','Add query to workspace (option =)'],
                           ['#add-query-btn','Add query to workspace (option =)'],
                           ['#bar-interaction-wrapper','Drag or Dbl-click to adjust bar position (ctrl shift space)'],
                           ['#run-btn','Run query (ctrl enter)'],
                           ['#results-type-auto','Display pretty-printed results'],
                           ['#results-type-raw','Display Raw results'], 
                           ['#query-results','Display result in selected format'],
                           ['#profile-results','Profile Query'],
                           ['#explore-results','Database Browser'],
                           ['#button-back','Back'],
                           ['#button-forward','Forward'],
                           ['#remove-collection-filter','Remove collection filter'],
                           ['.results-col-prop',"View document properties"],
                           ['.results-col-coll',"Filter explore by collection"],
                           ['.icon-seek-first','First'],
                           ['.icon-seek-prev','Previous'],
                           ['.icon-seek-next','Next'],
                           ['.icon-seek-end','Last']
                     ];

    if($ml.browser.os.mac()) {
        qconsole.tooltipArray = tooltipArrayMAC;
    } else {
        qconsole.tooltipArray = tooltipArray;
    }

    for (i=0, len = qconsole.tooltipArray.length; i < len; i++) {
        qconsole.setTooltip(qconsole.tooltipArray[i][0],qconsole.tooltipArray[i][1]);
    }

};

qconsole.getTooltipText = function (selector) {
    var i, len;
    
    var tooltipText = '';
    for (i=0,len = qconsole.tooltipArray.length; i < len; i++) {
        if (qconsole.tooltipArray[i][0] == selector) {
            tooltipText =  qconsole.tooltipArray[i][1];
        }
    }

    return tooltipText;
};


qconsole.setTooltip = function (selector,text) {
    if ($(selector).length > 0) {
        $(selector).attr("title",text);
    }
};

/*********************/
/***   Cookie      ***/
/*********************/
qconsole.getCookie = function(c_name) {
    if(!qconsole.isCookieEnabled) return "";

    if (document.cookie.length>0) {
        c_start = document.cookie.indexOf(c_name + "=");
        if (c_start!=-1) {
            c_start=c_start + c_name.length+1;
            c_end=document.cookie.indexOf(";",c_start);

            if (c_end==-1) c_end=document.cookie.length;
            return unescape(document.cookie.substring(c_start,c_end));
        }
  }
    return "";
};

qconsole.setCookie = function(c_name, value, expiredays) {
    if(!qconsole.isCookieEnabled) return;

    var exdate = new Date();
    exdate.setDate(exdate.getDate() + expiredays);
    document.cookie = c_name + "=" + escape(value)+
    ((expiredays==null) ? "" : ";expires="+exdate.toGMTString());
};

qconsole.isCookieEnabled = function() {
    var cookieEnabled = (navigator.cookieEnabled)? true : false;

    //if not IE4+ nor NS6+
    if (typeof navigator.cookieEnabled=="undefined" && !cookieEnabled){
        document.cookie="testcookie"
        cookieEnabled=(document.cookie.indexOf("testcookie")!=-1)? true : false
    }
};

/**
* Sorting profile data using Quick Sort.
* Example:  qconsole.profilingDataSort(data, "deep-percent", true) 
* @method qconsole.profilingDataSort
* @param {json} allData. Reference to data returned from server
* @param {string} propToSort.  Property name for sorting.
* @param {boolean} sortDescending.  "true" is descending.  "false" is ascending.
*/
qconsole.profilingDataSort = function(data, propToSort, sortDescending) {
    /*
    data = [{"location":{"uri":".main", "line":"6", "column":"11"}, 
		"count":"1", "shallow-percent":"0.00018", 
		"shallow-us":"13", 
		"deep-percent":"0.00018", 
		"deep-us":"13"},
	   {"location":{"uri":".main", "line":"3", "column":"0"}, 
		"count":"1", "shallow-percent":"0.0013", 
		"shallow-us":"94", "deep-percent":"0.0034", "deep-us":"241"},
	   {"location":{"uri":".main", "line":"1", "column":"0"}, 
		"count":"1", "shallow-percent":"0.00014", 
		"shallow-us":"10", "deep-percent":"0.004", "deep-us":"284"},
	   {"location":{"uri":".main", "line":"4", "column":"5"}, 
	   "count":"1", "shallow-percent":"0.0012", 
	   "shallow-us":"88", "deep-percent":"0.0021", "deep-us":"147"},
	   {"location":{"uri":".main", "line":"5", "column":"7"}, 
	   "count":"1", "shallow-percent":"0.00048", 
	   "shallow-us":"34", "deep-percent":"0.00083", "deep-us":"59"},
	   {"location":{"uri":".main", "line":"1", "column":"12"}, 
	   "count":"1", "shallow-percent":"0.00047", 
	   "shallow-us":"33", "deep-percent":"0.00047", "deep-us":"33"},
	   {"location":{"uri":".main", "line":"7", "column":"9"}, 
	   "count":"1", "shallow-percent":"0.00017", 
	   "shallow-us":"12", "deep-percent":"0.00017", "deep-us":"12"}
	  ];
    */ 
	if (data && propToSort) {
	    var N = data.length;
	    var sort, partition, compare, exchange;

	    sort = function(data, lo, hi, comparator) {
	      if (hi <= lo) return;
	      var j = partition(data, lo, hi);
	      sort(data, lo, j-1);
	      sort(data, j+1, hi);
	    };

	    partition = function(data, lo, hi) {
	      var i = lo, j = hi+1;

	      while(true) {
	        while(compare(data, ++i, lo, propToSort, sortDescending))
	          if (i === hi) break;
	        while(compare(data, lo, --j, propToSort, sortDescending))
	          if (j === lo) break;

	        if(i >= j) break;
	        exchange(data, i, j);
	      }

	      exchange(data, lo, j);
	      return j;
	    };

	    compare = function(data, a, b, propToSort, sortDescending) {
	      if (!sortDescending)
	        return (data[a][propToSort] < data[b][propToSort]);
	      else
	        return (data[a][propToSort] > data[b][propToSort]);
	    };

	    exchange = function(data, x, y) {
	        var temp = data[x];
	        data[x] = data[y];
	        data[y] = temp;
	    };

	    // Quick Sort Step 0: shuffle data.
	    for (var i = 0; i < N; i++) {
	        var r = i + Math.floor(Math.random()*(N-i));     // between i and N-1
	        exchange(data, i, r);
	    }
	    
	    // Quick Sort
	    sort(data, 0, N-1);	    
	}
 };