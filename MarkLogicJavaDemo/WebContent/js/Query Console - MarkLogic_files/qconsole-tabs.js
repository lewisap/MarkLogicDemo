/* Copyright 2002-2014 MarkLogic Corporation.  All Rights Reserved. */

/*************/
/* Tabs Obj  */
/*************/
qconsole.Tabs = function(containerID, contentID) { 
    // load defaults
    if ((contentID === containerID) || (containerID === undefined) || (contentID === undefined)) 
    {
        alert("ERROR: qconsole.tabs 'containerID' and 'contentID' must both be unique identifiers [i.e. #tab-row & #content-space]");
        return undefined;
    }
    this.containerDivID         = containerID;
    this.contentDivID           = contentID;    
    this.items                  = [];
    this._onEvents              = [];
    this.currentTabID           = -1;
    this.scrolledTabLeftmostID  = -1;
    this.isLoading              = false;
    this.isScrolling            = false;
    
    $(this.containerDivID).html('<div class="qc-tabs-holder"><div class="qc-tabs-scroll-container-left"><div class="qc-tabs-scroll-left"></div><div class="qc-tabs-scroll-left-shadow"></div></div><div class="qc-tabs-scroller"><div class="qc-tabs-scroll-pane"><ul class="qc-tabs"></ul></div></div><div class="qc-tabs-scroll-container-right"><div class="qc-tabs-scroll-right-shadow"></div><div class="qc-tabs-scroll-right"></div></div><div class="add-tab-btn"></div></div>');
    this.resize();
            
    var thisTabObj = this;
    
    if (typeof this.contentDivID == "object") {
        var contentObj = this.contentDivID;
        contentObj.change = function(content) {
            var currentTab = thisTabObj.getSelectedTab();
            currentTab.content = content;            
            thisTabObj.oncontentchange(currentTab);
        };
    } else {
        // default method of detecting and adapting to changes in a standard textarea space
        $(this.contentDivID).change(function() {
            var currentTab = thisTabObj.getSelectedTab();
            currentTab.content = $(thisTabObj.contentDivID).val();
        });
    }
    
    
    $(this.containerDivID + " .qc-tabs-scroll-left").click(function() {
        thisTabObj.shiftTabsLeft();
    });    
    $(this.containerDivID + " .qc-tabs-scroll-right").click(function() {
        thisTabObj.shiftTabsRight();        
    });    

    $(this.containerDivID + " .tab-button").live("click",function() {
        if (!$(this).hasClass("selected")) {
            var tabID = thisTabObj.stripDownID($(this).attr("id"));        
            thisTabObj.onclick(thisTabObj.items[thisTabObj.getArrayLocationByID(tabID)]);
        }
    });    
    
    $(this.containerDivID + " .tab-button").live(
        'hover',
        function (ev) {
            if ((ev.type == 'mouseover') || (ev.type == 'mouseenter')) {
                var tabID = thisTabObj.stripDownID($(this).attr("id"));        
                thisTabObj.onhover(thisTabObj.items[thisTabObj.getArrayLocationByID(tabID)]);
            }
        
            if ((ev.type == 'mouseout') || (ev.type == 'mouseleave')) {
                var tabID = thisTabObj.stripDownID($(this).attr("id"));        
                thisTabObj.offhover(thisTabObj.items[thisTabObj.getArrayLocationByID(tabID)]);
            }
    });    
    
    $(this.containerDivID + " .tab-close").live("click",function(ev) {
        ev.stopPropagation();
        var tabID = thisTabObj.stripDownID($(this).parent().attr("id"));        
        thisTabObj.onclose(thisTabObj.items[thisTabObj.getArrayLocationByID(tabID)]);
    });
    
    // handle double click for text inputs
    $(this.containerDivID + " .new-name").live("dblclick click",function(ev) {        
        ev.stopPropagation();  
    }); 
        
    $(this.containerDivID + " .tab-name").live("dblclick",function() {        
        var tabID = thisTabObj.stripDownID($(this).parent().attr("id"));        
        var currentTab = thisTabObj.items[thisTabObj.getArrayLocationByID(tabID)];        
        $(this).attr("currentName",$(this).text());
        
        $(this).html('<input type="text" class="new-name" value="' + $(this).attr('currentName') + '" maxlength="' + qconsole.maxNameLength + '" />');
        $('input.new-name').select();
        thisTabObj.resize();
        
        $('input.new-name').keyup(function(e) {
            if (e.keyCode == "13") {  // enter key was pressed
                if (/\S/.test($(this).val())) {  // string is not empty and not just whitespace
                    $(this).parent().html($(this).val());                    
                    // thisTabObj.getSelectedTab.name = $(this).val();    
                    
                    thisTabObj.updateTabNameByID(tabID,$(this).val());
                    thisTabObj.ontabnamechange(currentTab);                
                } else {
                    $(this).parent().html($(this).parent().attr("currentName"));
                }
            }
        });

        $('input.new-name').focusout(function() {
            if (/\S/.test($(this).val())) {  // string is not empty and not just whitespace
                $(this).parent().html($(this).val());
                thisTabObj.updateTabNameByID(tabID,$(this).val());
                thisTabObj.ontabnamechange(currentTab);                
            } else {
                $(this).parent().html($(this).parent().attr("currentName"));
            }
        }); 

    });    
    
    $(this.containerDivID + " .add-tab-btn").click(function() {
        thisTabObj.onaddclick();
    });      
    
    return this;
};


qconsole.Tabs.prototype.redrawTabs = function() {
    for (var i=0, len = this.items.length; i < len; i++) {   
        this.openTab(this.items[i].id, this.items[i].name, this.items[i].content)
    }    
}

qconsole.Tabs.prototype.openTab = function(id, name, content, mode, loadContent) {
    if (this.scrolledTabLeftmostID == -1)
        this.scrolledTabLeftmostID = id;
    
    if (!this.idExists(id)) {
        // then we're opening a new tab
        this.items[this.items.length] = new qconsole.Tab(id, name, content, this.items.length);
        this.addToUI(id);
    } else {
    	this.items[this.getArrayLocationByID(id)].updateContent(content);  // get latest from the server
    }
    this.bringTabFront(id);
    this.onopen(this.getSelectedTab());
    if (loadContent !== undefined)
    	this.showContent(id);

    // if there's only one, then remove the ability to close the tab
    if (this.items.length == 1) {
        $(this.containerDivID + " .tab-close").css("display","none");
    } else {
        $(this.containerDivID + " .tab-close").css("display","block");
    }
	if (mode) {
		this.updateTabMode(mode);
	}
    
    if (!this.isLoading) { 
        this.onopen(this.getSelectedTab());
        
        this.resize();
        
        if (this.isTabOutOfView(id)) { 
            this.bringTabIntoView(id);
        }
    }
};

qconsole.Tabs.prototype.closeTab = function(id) {
    if (this.idExists(id)) {
        var tabLoc = this.getArrayLocationByID(id);  
        
        // set tab to its right as leftmost tab, if there
        if ((this.scrolledTabLeftmostID == id) && (this.items[tabLoc + 1] !== undefined)) {  
            this.scrolledTabLeftmostID = this.items[tabLoc + 1].id;
        }
        
        // splice that item out from the array
        this.items.splice(tabLoc, 1);
        this.removeFromUI(id);
        
        // if there's only one, then remove the ability to close the tab
        if (this.items.length == 1) {
            $(this.containerDivID + " .tab-close").css("display","none");
        } else if (this.items.length == 0) { 
            this.scrolledTabLeftmostID = -1;  // no tabs left, after closing everything, so reset leftmost to -1
        } else {
            $(this.containerDivID + " .tab-close").css("display","block");
        }
        
        this.resize(); 
    }
};

qconsole.Tabs.prototype.getLastTabID = function() {
    if (this.items.length > 0) {
        return this.items[this.items.length - 1].id;       
    } else {
        return undefined;
    }
};

qconsole.Tabs.prototype.openNextTab = function() {
    
    var currentTab = this.getSelectedTab();
    var currentTabLoc = this.getArrayLocationByID(currentTab.id);
    
    if (currentTabLoc !== (this.items.length - 1)) {
        var nextTab = this.items[currentTabLoc + 1];
        this.onclick(nextTab);
    }
};

qconsole.Tabs.prototype.openPrevTab = function() {
    var currentTab = this.getSelectedTab();
    var currentTabLoc = this.getArrayLocationByID(currentTab.id);
    
    if (currentTabLoc !== (0)) {
        var prevTab = this.items[currentTabLoc - 1];
        this.onclick(prevTab);
    }    
};

// function that brings a tab to the front, depending on it's order in the UI
qconsole.Tabs.prototype.getQueryIDatUILocation = function(uiLocation) {
    var thisTabObj = this;
    var tabID;
    $(this.containerDivID + " ul.qc-tabs li").each(function(index) {
       if (uiLocation == (index + 1)) {
           tabID =  thisTabObj.stripDownID($(this).attr('id')); 
       }
    });
    
    return tabID;
};


qconsole.Tabs.prototype.bringTabFront = function(id) {
    // loop through all tabs and set only one front
    for (var i=0, len = this.items.length; i < len; i++) {            
        if (this.items[i].id == id) {
            this.items[i].isFront = true;
            this.currentTabID = id;
            this.bringForwardInUI(id);
        } else if(this.items[i].isFront) {
            // if it's not the ID we are activating, but is currently in front, bump it back
            this.items[i].isFront = false;
            this.sendBackInUI(this.items[i].id);
        }
    }
};

qconsole.Tabs.prototype.showContent = function(id) {
    var itemLoc = this.getArrayLocationByID(id);    
    
    if (typeof this.contentDivID == "object") {
        this.contentDivID.set(this.items[itemLoc].content);        
    } else {
        switch($(this.contentDivID)[0].tagName.toLowerCase())
        {
        case 'input':
            $(this.contentDivID).val(this.items[itemLoc].content);
            break;
        case 'textarea':
            $(this.contentDivID).val(this.items[itemLoc].content);
            break;
        case 'div':
            $(this.contentDivID).html(this.items[itemLoc].content);
            break;
        case 'p':
            $(this.contentDivID).html(this.items[itemLoc].content);
            break;
        default:
            break;
        }
    }

};

qconsole.Tabs.prototype.addToUI = function(id) {
    var itemLoc = this.getArrayLocationByID(id);    
    var tabID = this.buildUpGUIid(id); 
    $(this.containerDivID + " .qc-tabs").append(
		'<li id="' + tabID + '" class="tab-button">'
    	  + '<p class="' + this.items[itemLoc].mode + '"></p>'
    	  + '<div class="tab-name">' + this.items[itemLoc].name + '</div>'
    	  + '<div class="tab-close" title="' + qconsole.getTooltipText('#qc-tabs-scroll-pane .tab-close') + '"></div>'
      + '</li>');
};

qconsole.Tabs.prototype.removeFromUI = function(id) {
    var tabID = this.buildUpGUIid(id); 
    $(this.containerDivID + " #" + tabID).remove();
};

qconsole.Tabs.prototype.bringForwardInUI = function(id) {
    var tabID = this.buildUpGUIid(id); 
    $(this.containerDivID + " #" + tabID).addClass('selected');
};

qconsole.Tabs.prototype.sendBackInUI = function(id) {
    var tabID = this.buildUpGUIid(id); 
    $(this.containerDivID + " #" + tabID).removeClass('selected');    
};

qconsole.Tabs.prototype.getArrayLocationByID = function(id) {
    for (var i=0, len = this.items.length; i < len; i++) {            
        if (this.items[i].id == id)
            return i;
    }
};

qconsole.Tabs.prototype.idExists = function(id) {
    for (var i=0, len = this.items.length; i < len; i++) {            
        if (this.items[i].id == id)
            return true;
    }
    return false;
};

qconsole.Tabs.prototype.updateTabNameByID = function(tabID, newName) {
    var tabToUpdate = this.items[this.getArrayLocationByID(tabID)];
    tabToUpdate.name = newName;    
    // update GUI
    $("#" + this.buildUpGUIid(tabID) + " .tab-name").text(newName);  
    this.resize(); // resize bar accordingly    
};

qconsole.Tabs.prototype.updateTabMode = function (newMode) {
	var tabToUpdate = this.getSelectedTab();
	//var split = newMode.split('-');
	
	var modeClass = newMode;
    tabToUpdate.mode = newMode;
    // update GUI
    //if (split.length > 1) {
    //	modeClass = split[1];
    //}
    $("#" + this.buildUpGUIid(tabToUpdate.id) + " p").removeClass().addClass(modeClass);
    $('#query-list').find('.current').find('p').removeClass().addClass(modeClass);
};

qconsole.Tabs.prototype.updateTabContentByID = function(tabID, newContent) {
    this.items[this.getArrayLocationByID(tabID)].content = newContent;
    this.showContent(tabID);    
};


qconsole.Tabs.prototype.stripDownID = function(GUIid) {
    var tabID = GUIid.replace(this.containerDivID.replace("#","") + "-tab-button-","");
    return tabID;
};

qconsole.Tabs.prototype.buildUpGUIid = function(id) {
    var tabID = this.containerDivID.replace("#","");
    tabID = tabID + "-tab-button-" + id;
    return tabID;
};

qconsole.Tabs.prototype.getSelectedTab = function() {
    for (var i=0, len = this.items.length; i < len; i++) {            
        if(this.items[i].isFront) {
            return this.items[i];
        }
    }
};

qconsole.Tabs.prototype.getAllTabs = function() {
    return this.items;
};


qconsole.Tabs.prototype.resize = function() {
    var tabWidth = $(this.containerDivID + ' .add-tab-btn').outerWidth() + parseInt($(this.containerDivID + ' .add-tab-btn').css('margin-left').replace('px','')) + parseInt($(this.containerDivID + ' .add-tab-btn').css('margin-right').replace('px',''));
    
    if ($(this.containerDivID + ' .qc-tabs-scroll-container-left').css('display') == 'block') {
        tabWidth += $(this.containerDivID + ' .qc-tabs-scroll-container-left').outerWidth() + parseInt($(this.containerDivID + ' .qc-tabs-scroll-container-left').css('margin-left').replace('px','')) + parseInt($(this.containerDivID + ' .qc-tabs-scroll-container-left').css('margin-right').replace('px',''));
        tabWidth += $(this.containerDivID + ' .qc-tabs-scroll-container-right').outerWidth() + parseInt($(this.containerDivID + ' .qc-tabs-scroll-container-right').css('margin-left').replace('px','')) + parseInt($(this.containerDivID + ' .qc-tabs-scroll-container-right').css('margin-right').replace('px',''));
    }
    
    if ($(this.containerDivID + " ul.qc-tabs li").length == 0) {
        $(this.containerDivID + ' .qc-tabs-scroller').width(0);
    } else {
        $(this.containerDivID + " ul.qc-tabs li").each(function() {
            tabWidth += $(this).outerWidth() + parseInt($(this).css('margin-left').replace('px','')) + parseInt($(this).css('margin-right').replace('px',''));
        });
        // then our tabs are overflowing so activate scroll
        if (tabWidth > $(this.containerDivID).width()) {
            this.showScrollBar();
            $(this.containerDivID + ' .qc-tabs-scroller').width($(this.containerDivID).width() - ($(this.containerDivID + ' .qc-tabs-scroll-container-left').outerWidth() + parseInt($(this.containerDivID + ' .qc-tabs-scroll-container-left').css('margin-left').replace('px',''))) - $(this.containerDivID + ' .qc-tabs-scroll-container-right').outerWidth() - ($(this.containerDivID + ' .add-tab-btn').outerWidth() + parseInt($(this.containerDivID + ' .add-tab-btn').css('margin-left').replace('px','')) + parseInt($(this.containerDivID + ' .add-tab-btn').css('margin-right').replace('px',''))) - 2);
        } else {
            this.hideScrollBar();
            $(this.containerDivID + ' .qc-tabs-scroller').width(tabWidth - ($(this.containerDivID + ' .add-tab-btn').outerWidth() + parseInt($(this.containerDivID + ' .add-tab-btn').css('margin-left').replace('px','')) + parseInt($(this.containerDivID + ' .add-tab-btn').css('margin-right').replace('px',''))) - 2);
        }    
        this.styleTabScrollers();
    }
};

qconsole.Tabs.prototype.showScrollBar = function() {
    $(this.containerDivID + ' .qc-tabs-scroll-container-left').show();
    $(this.containerDivID + ' .qc-tabs-scroll-container-right').show();
};

qconsole.Tabs.prototype.hideScrollBar = function() {
    $(this.containerDivID + ' .qc-tabs-scroll-container-left').hide();
    $(this.containerDivID + ' .qc-tabs-scroll-container-right').hide();    
    
    $(this.containerDivID + ' .qc-tabs-scroll-pane').css('margin-left','0px');
    if (this.items.length !== 0)
        this.scrolledTabLeftmostID = this.items[0].id;
};

qconsole.Tabs.prototype.shiftTabsLeft = function() {
    // only scroll right if we've scrolled
    if ((this.scrolledTabLeftmostID !== this.items[0].id) && (!this.isScrolling)) {
        var tabScrollingIDLoc = this.getArrayLocationByID(this.scrolledTabLeftmostID);
        var tabIDBeingRevealed = this.items[tabScrollingIDLoc - 1].id;
        var tabGUIDBeingRevealed = this.buildUpGUIid(tabIDBeingRevealed);
        var widthOfTabRevealing = $(this.containerDivID + ' #' + tabGUIDBeingRevealed).outerWidth() + parseInt($(this.containerDivID + ' #' + tabGUIDBeingRevealed).css('margin-left').replace('px','')) + parseInt($(this.containerDivID + ' #' + tabGUIDBeingRevealed).css('margin-right').replace('px',''));
        
        this.isScrolling = true;
        var myTabObj = this;
        var newMarginLeft = parseInt($(this.containerDivID + ' .qc-tabs-scroll-pane').css('margin-left').replace('px','')) + widthOfTabRevealing;
        $(this.containerDivID + ' .qc-tabs-scroll-pane').animate({
            marginLeft: newMarginLeft
        }, 250, function() {
            myTabObj.isScrolling = false;
        }); 
        
        // leftmost tab decrement
        var tabScrollingIDLoc = this.getArrayLocationByID(this.scrolledTabLeftmostID);
        this.scrolledTabLeftmostID = this.items[tabScrollingIDLoc - 1].id;  
        
        this.styleTabScrollers();
    }
};

qconsole.Tabs.prototype.shiftTabsRight = function() {
    // only scroll left if we haven't scrolled all the way left
    if ((!this.areRemainingTabsAllInView()) && (!this.isScrolling)) { 
        var widthOfTabScrolling = $(this.containerDivID + ' #' + this.buildUpGUIid(this.scrolledTabLeftmostID)).outerWidth() + parseInt($(this.containerDivID + ' #' + this.buildUpGUIid(this.scrolledTabLeftmostID)).css('margin-left').replace('px','')) + parseInt($(this.containerDivID + ' #' + this.buildUpGUIid(this.scrolledTabLeftmostID)).css('margin-right').replace('px',''));
        
        this.isScrolling = true;
        var myTabObj = this;
        var newMarginLeft = parseInt($(this.containerDivID + ' .qc-tabs-scroll-pane').css('margin-left').replace('px','')) - widthOfTabScrolling;
        $(this.containerDivID + ' .qc-tabs-scroll-pane').animate({
            marginLeft: newMarginLeft
        }, 250, function() {
            myTabObj.isScrolling = false;
        });
        
        // leftmost tab increment
        var tabScrollingIDLoc = this.getArrayLocationByID(this.scrolledTabLeftmostID);
        this.scrolledTabLeftmostID = this.items[tabScrollingIDLoc + 1].id;      
        
        this.styleTabScrollers();
    }     
};

qconsole.Tabs.prototype.areRemainingTabsAllInView = function() {
    // get the tab's position within the array by using it's index (will have to rewrite later)
    var leftTabIndex = $(this.containerDivID + ' #' + this.buildUpGUIid(this.scrolledTabLeftmostID)).index();
    var visibleTabsWidth = 0;
    
    if (leftTabIndex !== -1) {
        for (var i=leftTabIndex, len = this.items.length; i < len; i++) {
            var tabGUID = this.buildUpGUIid(this.items[i].id);
            visibleTabsWidth += $(this.containerDivID + ' #' + tabGUID).outerWidth() + parseInt($(this.containerDivID + ' #' + tabGUID).css('margin-left').replace('px','')) + parseInt($(this.containerDivID + ' #' + tabGUID).css('margin-right').replace('px',''));
        }        
    }
    
    if (visibleTabsWidth < $(this.containerDivID + ' .qc-tabs-scroller').outerWidth())
        return true;
    else return false; 
};

qconsole.Tabs.prototype.styleTabScrollers = function() {
    if ((this.scrolledTabLeftmostID !== -1) && (this.items.length > 0)){    
        if (this.areRemainingTabsAllInView()) 
            $(this.containerDivID + " div.qc-tabs-scroll-right").addClass("inactive");
        else
            $(this.containerDivID + " div.qc-tabs-scroll-right").removeClass("inactive");  
        
        if (this.scrolledTabLeftmostID == this.items[0].id)
            $(this.containerDivID + " div.qc-tabs-scroll-left").addClass("inactive");
        else
            $(this.containerDivID + " div.qc-tabs-scroll-left").removeClass("inactive");  
    }
};



qconsole.Tabs.prototype.isTabOutOfView = function(tabID) {
    // returns "left","right",false
    var lengthOfTabsFromLeftmost = 0;
    var leftMostTabFound = false;
    
    if (tabID == this.scrolledTabLeftmostID)
        return false; 
    
    for (var i=0, len = this.items.length; i < len; i++) {
        if (this.items[i].id == this.scrolledTabLeftmostID) 
            leftMostTabFound = true;
                
        // then we've found our tab, is it in view?
        if (tabID == this.items[i].id) {
            // add our tab's length in, to make sure it doesn't overflow past the edge
            var tabGUID = this.buildUpGUIid(this.items[i].id);
            lengthOfTabsFromLeftmost += $(this.containerDivID + ' #' + tabGUID).outerWidth() + parseInt($(this.containerDivID + ' #' + tabGUID).css('margin-left').replace('px','')) + parseInt($(this.containerDivID + ' #' + tabGUID).css('margin-right').replace('px','') - 2);
            
            if (!leftMostTabFound)
                return "left";
            
            if (lengthOfTabsFromLeftmost >= $(this.containerDivID + ' .qc-tabs-scroller').outerWidth()) {
                return "right";
            } else {
                return false;
            }
        } else {
            if (leftMostTabFound) {
                var tabGUID = this.buildUpGUIid(this.items[i].id);
                lengthOfTabsFromLeftmost += $(this.containerDivID + ' #' + tabGUID).outerWidth() + parseInt($(this.containerDivID + ' #' + tabGUID).css('margin-left').replace('px','')) + parseInt($(this.containerDivID + ' #' + tabGUID).css('margin-right').replace('px','') - 2);
            }
        }
    }    
    
};




qconsole.Tabs.prototype.bringTabIntoView = function(tabID) {

    var startCountingDistanceToScroll = false;
     
    switch(this.isTabOutOfView(tabID))
    {
    case 'left':
        var tabGUID = this.buildUpGUIid(tabID);
        var distaceToScroll = 0;

        for (var i=this.getArrayLocationByID(tabID), leftmost = this.getArrayLocationByID(this.scrolledTabLeftmostID); i < leftmost; i++) {            
            tabGUID = this.buildUpGUIid(this.items[i].id);
            distaceToScroll += $(this.containerDivID + ' #' + tabGUID).outerWidth() + parseInt($(this.containerDivID + ' #' + tabGUID).css('margin-left').replace('px','')) + parseInt($(this.containerDivID + ' #' + tabGUID).css('margin-right').replace('px',''));
        }
        
        // perform scroll
        this.isScrolling = true;
        var myTabObj = this;
        var newMarginLeft = parseInt($(this.containerDivID + ' .qc-tabs-scroll-pane').css('margin-left').replace('px','')) + distaceToScroll;
        $(this.containerDivID + ' .qc-tabs-scroll-pane').animate({
            marginLeft: newMarginLeft
        }, 350, function() {
            myTabObj.isScrolling = false;
            myTabObj.scrolledTabLeftmostID = tabID;
            myTabObj.styleTabScrollers();
        });
        
        break;
        
    case 'right':
        var tabObj = this;
        var tabsToScroll = 0;
        var completeTabsInViewWidth = 0;
        var minDistaceToScroll = 0;  //  the min distance the tabs must scroll in order for our tab to show
        var distaceToScroll = 0;
        var leftmostTabLoc = this.getArrayLocationByID(this.scrolledTabLeftmostID);
        var parseTill = this.getArrayLocationByID(tabID);        
        var neighborTabID, tabGUID, tabWidth
        
        for (var i=leftmostTabLoc; i <= parseTill; i++) {
            tabGUID = this.buildUpGUIid(this.items[i].id);
            tabWidth = $(this.containerDivID + ' #' + tabGUID).outerWidth() + parseInt($(this.containerDivID + ' #' + tabGUID).css('margin-left').replace('px','')) + parseInt($(this.containerDivID + ' #' + tabGUID).css('margin-right').replace('px',''));
            if (this.isTabOutOfView(this.items[i].id) == 'right') { 
                minDistaceToScroll += tabWidth
            } else {
                completeTabsInViewWidth += tabWidth; 
            }
        }
        
        minDistaceToScroll = minDistaceToScroll - ($(this.containerDivID + ' .qc-tabs-scroller').outerWidth() - completeTabsInViewWidth);
        
        while (distaceToScroll < minDistaceToScroll) {
            neighborTabID = this.items[this.getArrayLocationByID(this.scrolledTabLeftmostID) + tabsToScroll].id;
            tabGUID = this.buildUpGUIid(neighborTabID);
            distaceToScroll += $(this.containerDivID + ' #' + tabGUID).outerWidth() + parseInt($(this.containerDivID + ' #' + tabGUID).css('margin-left').replace('px','')) + parseInt($(this.containerDivID + ' #' + tabGUID).css('margin-right').replace('px',''));
            tabsToScroll++;
        }
                
        this.isScrolling = true;
        var myTabObj = this;
        var newMarginLeft = parseInt($(this.containerDivID + ' .qc-tabs-scroll-pane').css('margin-left').replace('px','')) - distaceToScroll;
        $(this.containerDivID + ' .qc-tabs-scroll-pane').animate({
            marginLeft: newMarginLeft
        }, 350, function() {
            myTabObj.isScrolling = false;
            if (myTabObj.items[myTabObj.getArrayLocationByID(myTabObj.scrolledTabLeftmostID) + tabsToScroll] !== undefined) {
                myTabObj.scrolledTabLeftmostID = myTabObj.items[myTabObj.getArrayLocationByID(myTabObj.scrolledTabLeftmostID) + tabsToScroll].id;
                myTabObj.styleTabScrollers();
            }
        });
        
        break;
        
    default:
        break;
    }    
    
};




/************/
/** Events **/
/************/

qconsole.Tabs.prototype.onEvent = function(eventName, callback) {
    this._onEvents[eventName] = callback;
};


qconsole.Tabs.prototype.onclick = function(tabObj) {
    if (tabObj !== undefined) {
        this.ontabswitch(this.getSelectedTab());
        
        if (this._onEvents["onclick"] !== undefined) {
            this._onEvents["onclick"](tabObj);        
        }
    }
};

qconsole.Tabs.prototype.onhover = function(tabObj) {
    // no built in content for event
    if (this._onEvents["onhover"] !== undefined) {
        this._onEvents["onhover"](tabObj);
    }
};

qconsole.Tabs.prototype.offhover = function(tabObj) {
    if (this._onEvents["offhover"] !== undefined) {
        this._onEvents["offhover"](tabObj);
    }
};

qconsole.Tabs.prototype.onclose = function(tabObj) {
    // built in content for event
    this.closeTab(tabObj.id);        
    if (this._onEvents["onclose"] !== undefined) {
        this._onEvents["onclose"](tabObj);
    }
};

qconsole.Tabs.prototype.onallclosed = function() {
    // when all the tabs are closed, fire this event. 
    if (this._onEvents["onallclosed"] !== undefined) {
        this._onEvents["onallclosed"]();
    }
};

qconsole.Tabs.prototype.onopen = function(tabObj) {
    // built in content for event
    if (this._onEvents["onopen"] !== undefined) {
        this._onEvents["onopen"](tabObj);
    }
};

qconsole.Tabs.prototype.onaddclick = function() {        
    if (this._onEvents["onaddclick"] !== undefined)
        this._onEvents["onaddclick"]();
};

// occurs as the switch is about to happen
qconsole.Tabs.prototype.ontabswitch = function(tabObj) {    
    // built-in content store content in Tab Object
    if (typeof this.contentDivID == "object") {
        tabObj.content = this.contentDivID.get();
    } else {
        tabObj.content = $(this.contentDivID).val();
    }    
    
    if (this._onEvents["ontabswitch"] !== undefined)
        this._onEvents["ontabswitch"](tabObj);
};

// occurs after a name change on a tab has been completed
qconsole.Tabs.prototype.ontabnamechange = function(tabObj) {    
    // pass tab object that has the new name
    if (this._onEvents["ontabnamechange"] !== undefined)
        this._onEvents["ontabnamechange"](tabObj);
};

//occurs after a name change on a tab has been completed
qconsole.Tabs.prototype.oncontentchange = function(tabObj) {    
    // pass tab object that has the new name
    if (this._onEvents["oncontentchange"] !== undefined)
        this._onEvents["oncontentchange"](tabObj);
};




/*****************/
/*   Tab Obj     */
/*****************/
qconsole.Tab = function(id, name, content, order) { 
    this.id         = id;
    this.name       = name;
    this.content    = content;
    this.order      = order;
    this.isFront    = false;
        
    return this;
};

qconsole.Tab.prototype.updateContent = function(content) {    
	this.content    = content;
};




