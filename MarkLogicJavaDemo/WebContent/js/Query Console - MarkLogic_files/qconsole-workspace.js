/* Copyright 2002-2014 MarkLogic Corporation.  All Rights Reserved. */

qconsole.Workspace = function(workspaceObj) { 
    // load defaults
    this.id                     = -1;
    this.name                   = "Workspace";
    this.nameDisplayLength      = 23;
    this.active                 = true;
    this.isClosing              = false;
    this.isDeleting             = false;
    this.isLoading              = false;
    this.queries                = [];
    
    // override if we're cloning or creating from another object
    if (workspaceObj) {
        this.id             = workspaceObj.id;
        this.name           = workspaceObj.name;
        this.active         = (workspaceObj.active == 'true') ? true : false;   

        for (var i=0, len = workspaceObj.queries.length; i < len; i++) {
            this.queries[i] = new qconsole.Query(workspaceObj.queries[i]);
        }
    } 
    
    return this;
};

// save is handled by Query Console, no code
qconsole.Workspace.prototype.save = function() { 
    qconsole.serverInteractionsObj.updateWorkspace(this);
};

qconsole.Workspace.prototype.parseModeClass = function (mode) {
	var split = mode.split('-');
	var modeClass = (split.length > 1) ? split[1] : mode;
    return modeClass;
};

// handles loading the workspace into the workspace bar
qconsole.Workspace.prototype.load = function() {
    this.isLoading = true;
    qconsole.tabsObj.isLoading = true;
    var current = '';
    this.active = true;
    // update the server 
    this.save();
    
    if (this.name.length > this.nameDisplayLength)
        $("#workspace-title-text").text(this.name.substr(0,this.nameDisplayLength) + '...');
    else
        $("#workspace-title-text").text(this.name);
    
    // clear query list
    $('#query-list li').remove();
    
    var frontQuery = 0;
    // with server-side implementation, new workspaces always have at least one query
    for (var i=0, len = this.queries.length; i < len; i++) {
        // add to the list
        $('#query-list').append(
        	'<li id="query-doc-' + this.queries[i].id + '">'
        		+ '<div id="query-doc-name-space">'
        			+ '<p class="' + this.parseModeClass(this.queries[i].mode) + '"></p>'
        			+ '<span class="query-doc-name" title="' + qconsole.getTooltipText('#query-list .query-doc-name') + '">'
        				 + this.queries[i].getNameForUI()
        			+ '</span>'
        		+ '</div>'
        		+ '<div class="delete-icon" title="' + qconsole.getTooltipText('#query-list .delete-icon') + '"></div>'
        	+ '</li>');
        
        // open if this tab has focus, store it's array loc for later opening
        if (this.queries[i].focus) 
            frontQuery = i;
        
        // open active tabs
        if (this.queries[i].active) 
            this.queries[i].activate(this.isLoading);
    }
    
    // re-open the query that is supposed to be in front
    this.isLoading = false;    
    qconsole.tabsObj.isLoading = false;
    this.activateQuery(this.queries[frontQuery].id);        
    qconsole.workspaceLoaded = true;    
};

// closes all tabs associated with a workspace
qconsole.Workspace.prototype.close = function() {
    
    var queryToSave = this.getFocusedQuery();
    queryToSave.save();  
    
    this.isClosing = true;
    
    for (var i=0, len = this.queries.length; i < len; i++) {
        if (this.queries[i].active)
            this.queries[i].deactivate(false);
    }
    
    this.active    = false;
    qconsole.workspaceLoaded = false;
    
    this.isClosing = false;
};

    
qconsole.Workspace.prototype.deleteWorkspace = function() {        
    // can't delete myself, so call my parent to handle it
    qconsole.deleteWorkspace(this);    
};

qconsole.Workspace.prototype.addQuery = function() {     
	var currentMode;
    currentQuery = this.getFocusedQuery();
    currentMode  = currentQuery.mode;    
    if (currentQuery !== undefined) {
        this.unfocusQuery(currentQuery.id);  
    }    
    
    var thisWorkspace = this;
    qconsole.serverInteractionsObj.newQuery(this.id, currentMode, function(query) {   
        var queryLoc = thisWorkspace.queries.length;
        query.sourceType = (queryLoc == 0) ? 'default' : 'current'; // first query, use default
        thisWorkspace.queries[queryLoc] = new qconsole.Query(query);        
        
        $('#query-list').append(
        	'<li id="query-doc-' + thisWorkspace.queries[queryLoc].id + '" class="current">'
        		+ '<div id="query-doc-name-space">'
        			+ '<p class="' + thisWorkspace.parseModeClass(thisWorkspace.queries[queryLoc].mode) + '"></p>'
        			+ '<span class="query-doc-name" title="' + qconsole.getTooltipText('#query-list .query-doc-name') + '">'
        				+ thisWorkspace.queries[queryLoc].getNameForUI()
    				+ '</span>'
				+ '</div>'
				+ '<div class="delete-icon" title="' + qconsole.getTooltipText('#query-list .delete-icon') + '"></div>'
			+ '</li>');
        thisWorkspace.queries[queryLoc].activate();
    });
};

qconsole.Workspace.prototype.updateQueryTabOrder = function(queryTabs) { 
    var query;      
    for (var i=0, len = queryTabs.length; i < len; i++) {
        query = this.getQuery(queryTabs[i].id);
        query.taborder = queryTabs[i].order;
        query.save();
    }    
};


qconsole.Workspace.prototype.removeQuery = function(id) {   
    var thisWorkspace = this;
    $("#query-doc-" + id).remove();
    var queryToRemove = this.getQuery(id);
    var focusedQueryClosing = queryToRemove.focus;
    qconsole.tabsObj.closeTab(id);  // close its tab
    
    // remove from the array
    arrayLoc = this.getQueryArrayLoc(id);
    this.queries.splice(arrayLoc,1);
    
    // remove query from workspace on server-side
    qconsole.serverInteractionsObj.deleteQuery(id, function(response) {
        if (thisWorkspace.queries.length > 0) {
            // if this query was previously focused, then open the last tab query
            if (focusedQueryClosing) { 
                var tabToOpen, lastTabID = qconsole.tabsObj.getLastTabID();
                tabToOpen = (lastTabID) ? lastTabID : thisWorkspace.queries[0].id;
                thisWorkspace.activateQuery(tabToOpen);
            }
        } else {
        	// create a query object from the endpoint return of the new query created server-side
            var queryLoc = thisWorkspace.queries.length;
            response["new-query"].sourceType = (queryLoc == 0) ? 'default' : 'current'; // first query, use default
            thisWorkspace.queries[queryLoc] = new qconsole.Query(response["new-query"]);
            
            $('#query-list').append(
            	'<li id="query-doc-' + thisWorkspace.queries[queryLoc].id + '" class="current">'
            		+ '<div id="query-doc-name-space">'
            			+ '<p class="' + thisWorkspace.parseModeClass(thisWorkspace.queries[queryLoc].mode) + '"></p>'
            			+ '<span class="query-doc-name" title="' + qconsole.getTooltipText('#query-list .query-doc-name') + '">'
            				+ thisWorkspace.queries[queryLoc].getNameForUI()
        				+ '</span>'
    				+ '</div>'
    				+ '<div class="delete-icon" title="' + qconsole.getTooltipText('#query-list .delete-icon') + '"></div>'
				+ '</li>');
            thisWorkspace.queries[queryLoc].activate();
        }
    });
};

qconsole.Workspace.prototype.getQuery = function(id) {        
    for (var i=0, len = this.queries.length; i < len; i++) {    
        if (this.queries[i].id == id) {
            return this.queries[i];
        }
    }
    return false;
};

qconsole.Workspace.prototype.openNextQuery = function() {    
    var currentQuery = this.getFocusedQuery();
    var currentQueryLoc = this.getQueryArrayLoc(currentQuery.id);
    
    if (currentQueryLoc !== (this.queries.length - 1)) {
        this.unfocusQuery(currentQuery.id);
        var nextQuery = this.queries[currentQueryLoc + 1];
        this.activateQuery(nextQuery.id);
    }
};

qconsole.Workspace.prototype.openPrevQuery = function() {
    var currentQuery = this.getFocusedQuery();
    var currentQueryLoc = this.getQueryArrayLoc(currentQuery.id);
    
    if (currentQueryLoc !== (0)) {
        this.unfocusQuery(currentQuery.id);
        var prevQuery = this.queries[currentQueryLoc - 1];
        this.activateQuery(prevQuery.id);
    }    
};


qconsole.Workspace.prototype.getQueryArrayLoc = function(id) {        
    for (var i=0, len = this.queries.length; i < len; i++) {    
        if (this.queries[i].id == id) {
            return i;
        }
    }
    return false;
};

qconsole.Workspace.prototype.unfocusQuery = function(id) {  
   var queryToUnfocus = this.getQuery(id);
    queryToUnfocus.setProperty('focus',false);
    queryToUnfocus.save();
    if (!qconsole.serverInteractionsObj.serverConnectionDown) {  // should implement callbacks
    	$('#query-doc-' + id).removeClass('current');    	
    }    
};

qconsole.Workspace.prototype.activateQuery = function(id) {        
    var queryToActivate = this.getQuery(id);
    queryToActivate.activate();
    if (!qconsole.serverInteractionsObj.serverConnectionDown) {  // should implement callbacks
        $('#query-list li').removeClass('current');
        $('#query-doc-' + id).addClass('current');    	
    }
};

qconsole.Workspace.prototype.getFocusedQuery = function() {        
    for (var i=0, len = this.queries.length; i < len; i++) {    
        if (this.queries[i].focus) {
            return this.queries[i];
        }
    }
};

qconsole.Workspace.prototype.updateQueryMode = function (newMode) {
	this.getFocusedQuery().setProperty('mode',newMode);
};

qconsole.Workspace.prototype.updateTabFrontQuery = function(content,async) {
    var currentlyActiveQuery = this.getFocusedQuery();
    currentlyActiveQuery.setProperty('content',content);
    currentlyActiveQuery.generatePreviewText();   
};


qconsole.Workspace.prototype.getUniqueID = function() {    
    var idAttempt = "";
    for (var i=0, len = this.queries.length; i < len; i++) {    
        idAttempt = i;
        for (var j=0, lentwo = this.queries.length; j < lentwo; j++) {
            if (this.queries[j].id == idAttempt) {
                idAttempt = "";
            }
        }
        if (idAttempt != "") {
            return idAttempt;  
        }
    }
    return this.queries.length;  
};

qconsole.Workspace.prototype.getUniqueName = function() {
    var nameAttempt = "";
    for (var i=0, len = this.queries.length; i < len; i++) {        
        nameAttempt = "Query " + (i + 1);
        for (var j=0, len = this.queries.length; j < len; j++) {
            if (this.queries[j].name == nameAttempt) {
                nameAttempt = "";
            }
        }
        if (nameAttempt != "") {
            return nameAttempt;  
        }
    }
    return "Query " + this.queries.length;  // then every array location has a name that matches it
};
