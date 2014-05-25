/* Copyright 2002-2014 MarkLogic Corporation.  All Rights Reserved. */

qconsole.History = function(parentID, historyToLoad) { 
    this.parentID                     = parentID;   // it ID of the query we are associated with
    this.items                        = [];
    this.maxNumItems                  = 25;         // max allowed # of items stored for this query's history
    this.previewLength                = 350;        // max allowed length of code previews for tooltip output
    this.nameLength                   = 60;         // default # of characters to show for the name of the historical record
    
    if (historyToLoad !== undefined) {
        for (var i=0, len = historyToLoad.length; i < len; i++) {
            this.items[i] = {};
            this.items[i].id = historyToLoad[i].id;
            
            // workaround when query is completely deleted, it returns NULL, instead of empty string.
            if (historyToLoad[i].query.content !== null) {  
                this.items[i].content = historyToLoad[i].query.content;
                this.items[i].preview = historyToLoad[i].query.content.substr(0,this.previewLength) + "...";
            } else {
                this.items[i].content = '';
                this.items[i].preview = '';
            }

            if (historyToLoad[i].timestamp !== undefined)
                this.items[i].timestamp = historyToLoad[i].timestamp;
            else
                this.items[i].timestamp = '';
        }
    }                       
    this.load();
    
    return this;
};

// load the history current histoy buffer to history pane
qconsole.History.prototype.load = function() {        
    $('#history-overlay div.history-query').remove();
    if (this.items.length > 0) {
        for (var i=0, len = this.items.length; i < len; i++ ) {
        	if (this.items[i])
        		$("#history-overlay").prepend("<div class='history-query' id='history-query-" + this.items[i].id + "'><div class='info'><div class='time'>" + this.getFormattedTime(this.items[i].timestamp) + "</div><div class='delete' title='" + qconsole.getTooltipText('.history-query .delete') + "'></div></div><div class='content'>" + this.htmlEncode(this.items[i].preview) + "</div></div>");
        }
    } 
    this.sizeHistoryPane(); 
};


qconsole.History.prototype.add = function() {
    var thisHistory = this;
    var currentWorkspace = qconsole.getCurrentWorkspace();    
    var parentQuery = currentWorkspace.getQuery(this.parentID);
    var duplicateID = this.isDuplicate(parentQuery.content);
    
    // save only if the the query is not the same as the last one
    if (this.items.length === 0 || duplicateID !== (this.items.length - 1)) {
        qconsole.serverInteractionsObj.newHistory(this.parentID, function(data) {
            var newHistoryRecord = {};
            var newHistoryLoc = thisHistory.items.length;
            
            newHistoryRecord.id = data.id;
            
            qconsole.serverInteractionsObj.getSingleHistoryRecord(newHistoryRecord.id, function(history) {
                
                if (history.query.content !== null) {  
                    newHistoryRecord.content = history.query.content;
                    newHistoryRecord.preview = history.query.content.substr(0,thisHistory.previewLength) + "...";
                } else {
                    newHistoryRecord.content = '';
                    newHistoryRecord.preview = '';
                }            
                newHistoryRecord.timestamp = history.timestamp;  
                
                thisHistory.items[newHistoryLoc] = newHistoryRecord;
                
                // append to current list
                $("#history-overlay").prepend("<div class='history-query' id='history-query-" + thisHistory.items[newHistoryLoc].id + "'><div class='info'><div class='time'>" + thisHistory.getFormattedTime(thisHistory.items[newHistoryLoc].timestamp) + "</div><div class='delete' title='" + qconsole.getTooltipText('.history-query .delete') + "'></div></div><div class='content'>" + thisHistory.htmlEncode(thisHistory.items[newHistoryLoc].preview) + "</div></div>");
                
                if (thisHistory.items.length > thisHistory.maxNumItems) {
                    // then remove the oldest item from the history list
                    $("#history-query-" + thisHistory.items[0].id).remove();
                    thisHistory.items.splice(0,1);
                }
                
                thisHistory.sizeHistoryPane();
            });
        });    	
    }    
};

qconsole.History.prototype.isDuplicate = function(queryString) {
	var isDup = -1;
    for (var i=0, len = this.items.length; i < len; i++ ) {
        if ((this.items[i]) && (this.items[i].content == queryString))
        	isDup = i;
    }  
    return isDup;
};

qconsole.History.prototype.getFormattedTime = function(dateString) {
    var now = new Date();
    var dateObj = new Date(dateString);
    var formattedHistoryTime = '';
    
    // if it's the current day, month, year, we return "Today" for date... its a UI thing...
    if ((dateObj.getDay() == now.getDay()) && (dateObj.getDate() == now.getDate()) && (dateObj.getFullYear() == now.getFullYear())) {
        formattedHistoryTime = "Today";
    } else {
        formattedHistoryTime = this.getMonthName(dateObj.getMonth()) + ' ' + dateObj.getDate() + ', ' + dateObj.getFullYear();        
    }
    formattedHistoryTime = formattedHistoryTime + ' ' + this.militaryTimeToAMPM(dateObj.getHours(),dateObj.getMinutes());
    
    return formattedHistoryTime;
};

qconsole.History.prototype.getMonthName = function(monthNum){
    var month = ["Jan","Feb","Mar","Apr","May","June","July","Aug","Sept","Oct","Nov","Dec"];
    return month[monthNum];
};

qconsole.History.prototype.militaryTimeToAMPM = function(hours, minutes){
    var time = '';
    var ampm = ' AM';
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (hours > 12) {
        hours = parseInt(hours) - 12;
        ampm = ' PM';
    }    
    time = hours.toString() + ':' + minutes + ampm;
    return time;
}
    
qconsole.History.prototype.htmlEncode = function(myString){
    return $('<div/>').text(myString).html();
};

qconsole.History.prototype.deleteRecord = function(hid){    
    var historyArrayLoc = this.getHistoryArrayLoc(hid);
    qconsole.serverInteractionsObj.deleteHistory(hid,"history");    
    this.items.splice(historyArrayLoc,1);    
    this.load();
};

qconsole.History.prototype.revertRecord = function(hid){
    var historyArrayLoc = this.getHistoryArrayLoc(hid);    
    var currentWorkspace = qconsole.getCurrentWorkspace();    
    var queryToRevert = currentWorkspace.getQuery(this.parentID);
    queryToRevert.revert(this.items[historyArrayLoc]);
};


qconsole.History.prototype.flash = function(id) {    
    $("#history-query-" + id).animate({
        backgroundColor: '#fff9bd'
      }, 120, function() {
          $("#history-query-" + id).css("background-color","transparent");
          $("#history-query-" + id).animate({
              backgroundColor: '#fff9bd'
            }, 120, function() {
                $("#history-query-" + id).css("background-color","transparent");
                $("#history-query-" + id).animate({
                    backgroundColor: '#fff9bd'
                  }, 120, function() {
                      $("#history-query-" + id).css("background-color","transparent");
                  });
            });
      });
};

qconsole.History.prototype.getHistoryArrayLoc = function(id) {        
    for (var i=0, len = this.items.length; i < len; i++) {    
        if ((this.items[i]) && (this.items[i].id == id)) {
            return i;
        }
    }
    return false;
};

qconsole.History.prototype.sizeHistoryPane = function() {
    $('#history-overlay').css('height',($(window).height() / 2) - 80);
    if (this.isScrollPresent())
        $('#history-overlay .history-query div.delete').addClass('scroll');
    else 
        $('#history-overlay .history-query div.delete').removeClass('scroll');
};

qconsole.History.prototype.isScrollPresent = function() {
    var overlayHeight = $('#history-overlay').height();
    var contentHeight = 0;
    $.each($('#history-overlay .history-query'), function() {
        contentHeight += $(this).height();
    });
    return (overlayHeight < contentHeight) ? true : false;
};






