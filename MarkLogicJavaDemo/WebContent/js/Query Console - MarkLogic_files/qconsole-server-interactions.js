/* Copyright 2002-2014 MarkLogic Corporation.  All Rights Reserved. */

qconsole.ServerInteractions = function(historyObj) { 
    this.numQueriesExecuting            = 0;  
    this.minIndicatiorSpinTime            	= 1000;   // milliseconds
    this.serverConnectionDown           = false;
    return this;
};

/*************************/
/*** PRIVATE FUNCTIONS ***/
/*************************/
qconsole.ServerInteractions.prototype.incrementExecQueries = function () {   
    this.numQueriesExecuting++;   
    this.updateExecQueryIndicator();
};

qconsole.ServerInteractions.prototype.decrementExecQueries = function () {   
    this.numQueriesExecuting--;
    this.updateExecQueryIndicator();
};

qconsole.ServerInteractions.prototype.updateExecQueryIndicator = function () {   
	var numQueriesExecuting = this.numQueriesExecuting;
    if (this.numQueriesExecuting == 0) {
    	/*
    	setTimeout(function() { 
    		if (numQueriesExecuting == 0) { $("#server-side-spinner").removeClass("shown"); console.log('hide spinner'); } 
    	}, this.minIndicatiorSpinTime );  // leaves spinner up for at least one cycle
    	*/
    	$("#server-side-spinner").removeClass("shown");
    } else 
        $("#server-side-spinner").addClass("shown");
};

qconsole.ServerInteractions.prototype.handleServerConnectionDown = function () {  
    if (!qconsole.unloading) {
        var siObj = this;  
        if (this.serverConnectionDown == false) {
            siObj.serverConnectionDown = true;
            qconsole.displayMsg("<p>Query Console lost connection to the server.  <br /> Attempting to re-establish connection. </p>");
            
            siObj.waitForServerConnection();
        }        
    }
};

qconsole.ServerInteractions.prototype.waitForServerConnection = function () { 
    var siObj = this;  
    setTimeout(function() {
        if (siObj.serverConnectionDown) {
            siObj.isServerConnectionUp();
            siObj.waitForServerConnection();
        } else siObj.handleServerConnectionRestored();
    }, 2000);
};

qconsole.ServerInteractions.prototype.handleServerConnectionRestored = function () {  
    qconsole.closeMsg();
    
    // reset UI state
    qconsole.restoreRunBtnState();
    this.numQueriesExecuting = 0;  
    qconsole.queryExecuting = false;
    this.updateExecQueryIndicator();
};

qconsole.ServerInteractions.prototype.isServerConnectionUp = function () {    
    var siObj = this; 
    $.ajax({
        type: 'GET',
        url: '/qconsole/',
        dataType: 'html',
        async: false,
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Accept', 'text/json');
        },          
        success:function(data, textStatus, XMLHttpRequest){
            siObj.serverConnectionDown = false;
        },
        error:function(xhr,err,e){ 
            if ((xhr.status == "0") || (xhr.status == "12029") || (xhr.status == "12007")) {  // serve connection fails
                siObj.serverConnectionDown = true;
            } else siObj.serverConnectionDown = false;
        }
     });         
};


qconsole.ServerInteractions.prototype._isError = function (data, textStatus, XMLHttpRequest, errorCallback) {    
    if (data.error !== undefined) {        
        this._displayServerError(data.error["error:format-string"], errorCallback);
        return true;
    } else {
        return false;
    }
};

qconsole.ServerInteractions.prototype._displayServerError = function (errorMsg, errorCallback) {    
    if (errorCallback !== undefined)
        errorCallback(errorMsg);
    else
        // default error handling is to pop-up a standard alert, we can make more user friendly down the line
        alert(errorMsg);
};

qconsole.ServerInteractions.prototype._serverRequest = function (url, requestType, dType, async, params, callback, errorCallback) {    
    var siObj = this;  

    // add this query to the queue of outstanding requests
    siObj.incrementExecQueries();
    
    // RESTful work-around
    var parameters;
    var dataType = dType;
    var type = requestType;
    
    params.cache = new Date().getTime();  // cache-buster
    
    switch(type)
    {
    case 'GET':
        parameters = params;
        break;
    case 'POST':
        if (params.content !== undefined) {
            parameters = params.content;
            delete params.content;
        }
        url = this._addParamsToQueryString(url,params); 
        break;
    case 'PUT':
        if (params.content !== undefined) {
            parameters = params.content;
            delete params.content;
        }
        url = this._addParamsToQueryString(url,params);
        break;
    case 'DELETE':
        url = this._addParamsToQueryString(url,params);
        break;
    default: 
        break;
    }
    
    parameters = (parameters === undefined) ? {} : parameters;
           
    $.ajax({
          type: type,
          contentType: "text/plain",
          url: url,
          async: async,
          data: parameters,
          dataType: dataType,
          success:function(data, textStatus, XMLHttpRequest){
              siObj.decrementExecQueries();
              switch(dataType)
              {
              case 'json':
                  if (!siObj._isError(data, textStatus, XMLHttpRequest, errorCallback)) {
                      if (callback !== undefined)
                          callback(data);
                  }
                  break;
              case 'html':
                  if (callback !== undefined)
                      callback(data, XMLHttpRequest);
                  break;
              default: 
                  break;
              }
          },
          error:function(xhr,err,e){ 
              siObj.decrementExecQueries();
              if ((xhr.status == "403") || (xhr.status == "404")) {
                  qconsole.displayMsg(xhr.statusText,6000);
              } else if (xhr.status == "503") { // license no longer accepted
                  location.reload();  // reload the page so the rewriter can handle lack of license   
              } else if (xhr.status == "500") { // request timeout or canceled
            	  // server limitation - cannot set headers upon cancelation of a query eval
            	  // because of this, we need to parse the HTML dump in the response for the error code 'XDMP-CANCELED'
            	  // to see if this 500 error was triggered by the cancel action
            	  if (xhr.responseText.indexOf('XDMP-CANCELED') == -1) {
            		  qconsole.displayMsg(xhr.statusText,6000);
            	  }     
              } else if ((xhr.status == "0") || (xhr.status == "12029") || (xhr.status == "12007")) {  // serve connection fails
                  // ideally this would queue requests and store them if the server
                  // is down.  When connection restored, it would re-initiate those requests
                  // in the order requested.  For now, we just shut down the UI.
                  siObj.handleServerConnectionDown();
              } else if (xhr.status == "200") // request returned successfully, but still error'd out - can happen with JSON parse errors
                  qconsole.displayMsg(e.message,6000);
              if (errorCallback !== undefined)
                  errorCallback(xhr);
          }
    });    
};

qconsole.ServerInteractions.prototype._addParamsToQueryString = function (url, params) {
    if (this._countKeys(params) > 0) {
        url += "?";
        for(var key in params) {
            if (params[key] !== undefined)
                url += key + "=" + encodeURIComponent(params[key]) + "&";
        }
        // remove final '&'
        url = url.substr(0,url.length - 1);
    }
    return url;
};


qconsole.ServerInteractions.prototype._countKeys = function (obj) {
    if (obj.__count__ !== undefined) {
        return obj.__count__;
    }

    var c = 0, p;
    for (p in obj) {
        if (obj.hasOwnProperty(p)) {
            c += 1;
        }
    }

    return c;
};


/************************/
/*** PUBLIC FUNCTIONS ***/
/************************/

/* QUERY EVALUATION */
qconsole.ServerInteractions.prototype.eval = function (params, callback, errorcallback) {
    var evalURL = 'endpoints/evaler.xqy';
    this._serverRequest(evalURL,'POST','html',true,params,function(data,xhr) {
    	
        if (callback !== undefined)
            callback(data,xhr);
    },function(data) {
        if (errorcallback !== undefined)
            errorcallback(data);
    }); 
};

/* QUERY EVALUATION CANCELING */
qconsole.ServerInteractions.prototype.cancel = function (params, callback, errorcallback) {
    var evalURL = 'endpoints/evaler.xqy';
    this._serverRequest(evalURL,'POST','html',true,params,function(data,xhr) {
        if (callback !== undefined)
            callback(data,xhr);
    },function(data) {
        if (errorcallback !== undefined)
            errorcallback(data);
    }); 
};

/* EXPLORE RESOURCE & COLLECTIONS */
qconsole.ServerInteractions.prototype.explore = function (uri, params, callback, errorcallback) {
    this._serverRequest(uri,'GET','html',true,params,function(data, xhr) {
        if (callback !== undefined)
            callback(data, xhr);
    },function(data) {
        if (errorcallback !== undefined)
            errorcallback(data);
    }); 
};

/* EXPLORE FILE */
qconsole.ServerInteractions.prototype.exploreFile = function (uri, callback, errorcallback) {
    var params = {};
    this._serverRequest(uri,'GET','html',true,params,function(data, xhr) {
        if (callback !== undefined)
            callback(data, xhr);
    },function(data) {
        if (errorcallback !== undefined)
            errorcallback(data);
    }); 
};


/* START LOAD WORKSPACES */
qconsole.ServerInteractions.prototype.getAllWorkspaces = function () {
    var siObj = this;
    var params = {};
    var workspaceURL = 'endpoints/workspaces.xqy';
    this._serverRequest(workspaceURL,'GET','json',true,params,function(data) {
        if (data.workspaces === null) {
            // then there are no existing workspaces, so request a new workspace
            siObj._serverRequest(workspaceURL,'POST','json',true,params,function(data) { 
                // get's fresh workspace and associated query
                var formattedData = {};
                formattedData.workspaces = {};
                formattedData.workspaces.workspace = [];
                formattedData.workspaces.workspace[0] = data.workspace;
                siObj.loadWorkspaces(formattedData);
            });
        } else {
            siObj.loadWorkspaces(data);
        }
    });    
};

qconsole.ServerInteractions.prototype.loadWorkspaces = function (workspacesObj) {

    var workspaceToLoad = workspacesObj.workspaces.workspace;
    
    for (var i=0, len = workspaceToLoad.length; i < len; i++) {
        qconsole.workspaces[i] = new qconsole.Workspace(workspaceToLoad[i]);
    }            
    var currentWorkspace = qconsole.getCurrentWorkspace();
    
    // then we got out of sync somehow, handle when no workspace is 'current'
    if (currentWorkspace == undefined) {       
        var currentWorkspace = qconsole.workspaces[0];
        currentWorkspace.active = true;        
        qconsole.serverInteractionsObj.updateWorkspace(currentWorkspace);         
    }  
    currentWorkspace.load();
    qconsole.workspaceLoaded = true;

    // update UI with workspace info
    qconsole.loadWorkspaceDropdown();

};

qconsole.ServerInteractions.prototype.newWorkspace = function (callback) {    
    var params      = {};
    var queriesURL = 'endpoints/workspaces.xqy';
    this._serverRequest(queriesURL,'POST','json',true,params,function(data) {
        if (callback !== undefined)
            callback(data.workspace);
    });   
};

qconsole.ServerInteractions.prototype.cloneWorkspace = function (workspaceID, callback) {    
    var params      = {};
    params.wsid     = workspaceID;

    var queriesURL = 'endpoints/workspaces.xqy';
    this._serverRequest(queriesURL,'POST','json',true,params,function(data) {
        if (callback !== undefined)
            callback(data.workspace);
    });   
};

qconsole.ServerInteractions.prototype.exportWorkspace = function (workspaceID) {
    var queriesURL = 'endpoints/workspaces.xqy' + "?wsid=" + workspaceID + "&format=export";
    window.location = queriesURL;
};

qconsole.ServerInteractions.prototype.updateWorkspace = function (workspaceObj, callback) {
    var params      = {};
    params.wsid     = workspaceObj.id;
    params.name     = workspaceObj.name;
    params.active   = workspaceObj.active;
    
    var queriesURL = 'endpoints/workspaces.xqy';
    this._serverRequest(queriesURL,'PUT','json',true,params,function(data) {
        if (callback !== undefined)
            callback(data.workspace);
    });   
};

qconsole.ServerInteractions.prototype.deleteWorkspace = function (workspaceID, callback) {    
    var params      = {};
    params.wsid     = workspaceID;

    var queriesURL = 'endpoints/workspaces.xqy';
    this._serverRequest(queriesURL,'DELETE','json',true,params,function(data) {
        if (callback !== undefined)
            callback(data.workspace);
    });   
};

/* END LOAD WORKSPACES */
  

/* START QUERY INTERACTIONS */
qconsole.ServerInteractions.prototype.newQuery = function (workspaceID, mode, callback) {
    var params 	= {};
    params.wsid = workspaceID;
    params.mode = (mode) ? mode : 'xquery';
    var queriesURL = 'endpoints/queries.xqy';
    this._serverRequest(queriesURL,'POST','json',true,params,function(data) {
        if (callback !== undefined)
            callback(data.query);
    });    
};

qconsole.ServerInteractions.prototype.getQuery = function (queryID, async, callback) {
    var params = {};
    params.qid = queryID;
    var queriesURL = 'endpoints/queries.xqy';
    this._serverRequest(queriesURL,'GET','json',async,params,function(data) {
        if (callback !== undefined)
            callback(data.query);
    });    
};

qconsole.ServerInteractions.prototype.updateQuery = function (queryObj, async, callback) { 
    var params = {};
    
    var currentWorkspace = qconsole.getCurrentWorkspace();
    params.wsid = currentWorkspace.id;
    params.qid = queryObj.id;

    if (queryObj.name !== undefined)
        params.name = queryObj.name;

    if (queryObj.content !== undefined)
        params.content = queryObj.content;
    
    if (queryObj["content-source"] !== undefined)
        params["content-source"] = queryObj["content-source"]; 
    /* waiting for endpoint to be able to handle
    if (queryObj.taborder !== undefined)
        params.taborder = queryObj.taborder;
    */
    if (queryObj.active !== undefined)
        params.active = queryObj.active;
    
    if (queryObj.focus !== undefined)
        params.focus = queryObj.focus;
        
    if (queryObj.mode !== undefined) {
    	params.mode = queryObj.mode;
    }    
	
    var queriesURL = 'endpoints/queries.xqy';
    this._serverRequest(queriesURL,'PUT','json', async, params, function (data) {
        if (callback !== undefined)
            callback(data.query);
    });    
};

qconsole.ServerInteractions.prototype.deleteQuery = function (queryID, callback) {
    var params = {};
    params.qid = queryID;
    var queriesURL = 'endpoints/queries.xqy';
    this._serverRequest(queriesURL,'DELETE','json',true,params,function(data) {
        if (callback !== undefined)
            callback(data.query);
    });
};

/* END QUERY INTERACTIONS */


/* START HISTORY INTERACTIONS */
qconsole.ServerInteractions.prototype.newHistory = function (queryID, callback) {
    var params = {};
    params.qid = queryID;
    var queriesURL = 'endpoints/histories.xqy';
    this._serverRequest(queriesURL,'POST','json',true,params,function(data) {
        if (callback !== undefined)
            callback(data.history);
    });    
};

qconsole.ServerInteractions.prototype.getHistory = function (queryID, callback) {
    var params = {};
    params.qid = queryID;
    var queriesURL = 'endpoints/histories.xqy';
    this._serverRequest(queriesURL,'GET','json',true,params,function(data) {
        if (callback !== undefined)
            callback(data);
    });    
};

qconsole.ServerInteractions.prototype.getSingleHistoryRecord = function (historyID, callback) {
    var params = {};
    params.hid = historyID;
    var queriesURL = 'endpoints/histories.xqy';
    this._serverRequest(queriesURL,'GET','json',true,params,function(data) {
        if (callback !== undefined)
            callback(data.histories.history[0]);
    });    
};

qconsole.ServerInteractions.prototype.deleteHistory = function (ID, type, callback) {
    // type - history, query, workspace, requesting delete for each associated item.
    
    var params = {};
    switch (type) {
        case 'history':
            params.hid = ID;
            break;
        case 'query':
            params.qid = ID;
            break;
        case 'workspace':
            params.wsid = ID;
            break;        
    }
    
    var queriesURL = 'endpoints/histories.xqy';
    this._serverRequest(queriesURL,'DELETE','json',true,params,function(data) {
        if (callback !== undefined)
            callback(data);
    });    
};

/* END HISTORY INTERACTIONS */
