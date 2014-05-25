/* Copyright 2002-2014 MarkLogic Corporation.  All Rights Reserved. */

qconsole.Query = function(queryObj) { 
	// load defaults
    this.id                     = -1;
	this.name 			        = 'Query';
	this.preview 		        = '';
	this.previewLength 	        = 150;
	this.displayNameLength      = 16;
	this.content 		        = 'xquery version "1.0-ml";\n1';
	this.defaultSourceName      = 'Documents (Documents: /)';   // used to attempt to assign a default content source
	this.invalidDefaultSources  = ['App-Services (file: Apps)','App-Services (file: Manage)','Security (file: Admin)','Schemas','Triggers','Modules','Meters','Last-Login','Fab','Extensions'];  // if our default source doesn't exist, we don't want any of these chosen as alternatives
	this.taborder               = '';
    this.active                 = true;
    this.focus                  = true;
    this.dirty                  = false;
    this.contentDirty           = false;
    this.history                = {};
    this.mode                   = 'xquery';
	
	// override if we're cloning or creating from another object
	if (queryObj) {
		this.id 		        = queryObj.id;
		this.name 		        = queryObj.name;
		this.preview 	        = queryObj.preview;
		this.content 	        = queryObj.content;
		this.contentHistory 	= queryObj.content
		if (queryObj["content-source"] == undefined || queryObj["content-source"] == 'as::' || queryObj["content-source"] == '')
		    this["content-source"] 	= (queryObj.sourceType == 'current') ? $(".data-source option:selected").val() : this.setDefaultContentSource();
		this.taborder           = queryObj.taborder;
        this.active             = (queryObj.active == 'true') ? true : false;  // checking again string 'true' because object pass came from JSON
        this.focus              = (queryObj.focus == 'true') ? true : false; 
        this.mode               = (queryObj.mode) ? queryObj.mode : this.mode; 
	}
	
	return this;
};

qconsole.Query.prototype.save = function(async) {
    async = (async == undefined) ? true : async;
    if (this.dirty) {
        // temp fix to CodeMirror returning \n for empty queries
    	this.content = (this.content === "\n") ? '' : qconsole.sanitize(this.content);
    	this.dirty = false;
    	this.contentDirty = false;
        qconsole.serverInteractionsObj.updateQuery(this, async);
    }
};

qconsole.Query.prototype.revert = function(historyObj) {    
    this.setProperty("content",historyObj.content);
    this.generatePreviewText();    
    
    // update tab to match
    qconsole.tabsObj.updateTabContentByID(this.id, historyObj.content);
};

//get the current query object from the DB
qconsole.Query.prototype.get = function(async) {    
    var thisQuery = this;
    qconsole.serverInteractionsObj.getQuery(thisQuery.id, async, function(query) {   
        // update object to match server side info
        var updatedQuery = thisQuery.set(query);        
    }); 
};

// set the current query object to the passed query's values
qconsole.Query.prototype.set = function(queryObj) {    
    if (queryObj.name !== undefined)
        this.name = queryObj.name;
    
    if (queryObj.content !== undefined)
        this.content = queryObj.content;
    
    if (queryObj["content-source"] !== undefined && queryObj["content-source"] !== 'as::' && queryObj["content-source"] !== '')
        this["content-source"] = queryObj["content-source"];
    
    if (queryObj.active !== undefined)
        this.active = (queryObj.active == 'true') ? true : false;
    
    if (queryObj.focus !== undefined)
        this.focus = (queryObj.focus == 'true') ? true : false; 
    
    if (queryObj.mode !== undefined) {
    	this.mode = queryObj.mode;
    }
    	
    return this;
};

qconsole.Query.prototype.setProperty = function(property,value) {    
	if (this[property] !== undefined && this[property] !== value) {
		this[property] = value;
		this.dirty = true;
		this.contentDirty = (property === 'content') ? true : false;
	}
};

qconsole.Query.prototype.isContentDirty = function(async) {
    return this.contentDirty;
};

qconsole.Query.prototype.setDefaultContentSource = function() {   
    var self = this;
    var contentSourceID = this.getContentSourceValueByName(self.defaultSourceName);
    if (contentSourceID == undefined) {
        // select a default
        var found = false;
        $.each($(".data-source option"),function() {
            if (!found && $.inArray(this.text, self.invalidDefaultSources) == -1) {
                contentSourceID = this.value;
                found = true;
            }                
        });        
    }
    return contentSourceID;
};

qconsole.Query.prototype.getContentSourceValueByName = function(name) { 
    var contentSourceID;
    $.each($(".data-source option"),function() {
        if (this.text == name)
            contentSourceID = this.value;            
    });
    return contentSourceID;
};

qconsole.Query.prototype.activate = function(workspaceLoading) {
	var loadContent;
    if (workspaceLoading === undefined) {  // then we're just opening tabs without changing their active or focus attributes
    	this.get(false);  // syncronous call to get tab's info
        this.setProperty('active',true);
        this.setProperty('focus',true);
        loadContent 		= true;
        this.save();
        this.openHistory();
        $(".data-source").val(this["content-source"]);
        $('#query-type').val(this.mode);
        qconsole.editor.setOption('mode', $('#query-type').find('[value=' + this.mode + ']').attr('title'));
    }
    qconsole.tabsObj.openTab(this.id, this.name, this.content, this.mode, loadContent);  // open tab
};

qconsole.Query.prototype.generatePreviewText = function() {   
    this.preview = (this.content) ? this.content.substr(0,this.previewLength) : '';
};

qconsole.Query.prototype.getNameForUI = function() {   
    if (this.name.length > this.displayNameLength)
        return this.name.substr(0,this.displayNameLength) + '...';
    else
        return this.name;
};


qconsole.Query.prototype.deactivate = function() {   
    var thisQuery = this;
    var currentWorkspace = qconsole.getCurrentWorkspace();
    
    if (currentWorkspace.isClosing || currentWorkspace.isDeleting) {
        qconsole.tabsObj.closeTab(thisQuery.id);  // don't save focus & active state if we're closing the workspace
    } else {
        // update query info on the server
        thisQuery.setProperty('active',false);
        thisQuery.setProperty('focus',false); 
        qconsole.serverInteractionsObj.updateQuery(thisQuery, false, function(query) {   
            // perform closing of the tab
            qconsole.tabsObj.closeTab(thisQuery.id);
            thisQuery.dirty = false;  // saved query state, no longer dirty
            this.contentDirty = false;
        });
    }
  
};

qconsole.Query.prototype.updateContentHistory = function() {
    this.contentHistory = this.content;
};

qconsole.Query.prototype.saveHistory = function() {    
    this.history.add();
};

qconsole.Query.prototype.openHistory = function() { 
    // hide history UI, in case return takes a while.. avoids user seeing flicker
    $('#history-overlay').css("display","none");
    
    thisQuery = this;
    var myHistory = qconsole.serverInteractionsObj.getHistory(this.id, function(data) {
        if (data.histories !== null) {                           
            var historyToLoad = data.histories.history;
            thisQuery.history = new qconsole.History(thisQuery.id, historyToLoad);                
        } else {
            thisQuery.history = new qconsole.History(thisQuery.id);
        }
           
    });
};
