/* Copyright 2011-2014 MarkLogic Corporation. All Rights Reserved. */

if(typeof jQuery == 'function') { // make sure jQuery is in place

    var univHeader = {};     
    
    univHeader.displayGlobalNavInfo = function() {
        var letting, navBtnsWidth, totalNavWidth = $("#globalnav").outerWidth();
        navBtnsWidth = 0; letting = 5;
        $("#globalnav div.nav-link, #globalnav div.navlogo").each(function() {
            navBtnsWidth += $(this).outerWidth();
        });
                
        var availableSpace = totalNavWidth - (navBtnsWidth + letting);
        // display modes - full & icon mode, less than 100px available, display icons only    
        if (availableSpace > univHeader.infoWidth) {  // full mode
            $("#globalnav .nav-info").show();
            $("#globalnav .nav-info .text").show();
            $("#globalnav .nav-info img").show();
        } else if (availableSpace < univHeader.iconWidth) { // hide mode
            $("#globalnav .nav-info").hide();
        } else { // icon mode
            $("#globalnav .nav-info").show();
            $("#globalnav .nav-info .text").hide();
            $("#globalnav .nav-info img").show();
        }
    }; 
    
    $(function() {
        $(window).resize( function() {
            univHeader.displayGlobalNavInfo();
        });    
        // setup initial icon 
        univHeader.infoWidth = $("#globalnav .nav-info").outerWidth();
        $("#globalnav .nav-info .text").hide();  // suppress text and measure
        univHeader.iconWidth = $("#globalnav .nav-info").outerWidth();
        $("#globalnav .nav-info .text").show();
        univHeader.displayGlobalNavInfo();
    });    
    
    /*
     * Handle events for Monitoring drop-down menu.
     */
    $(function() {
        $("#globalnav div.nav-link.dashboard").mouseover(function(e) {
        	$("#globalnav div.nav-sublinks").show();
        }).mouseout(function(e) {
        	$("#globalnav div.nav-sublinks").hide();
        });
    });
    
}

// Open/close Monitoring menu on mouseover/mouseout
var ML = ML || {};
ML.addEventHandler = function (obj, evt, fn) {
	if (obj.addEventListener) {
		obj.addEventListener(evt, fn, false);
	} else if (obj.attachEvent){
		obj.attachEvent('on'+evt, fn);
	}
}
ML.addEventHandler(window, 'load', function () {
	var menuElem = document.getElementById('monitoring-menu');
	ML.addEventHandler(menuElem, 'mouseover', function () {
		var submenuElem = document.getElementById('monitoring-submenu');
		submenuElem.style.display = 'block';
	});
	ML.addEventHandler(menuElem, 'mouseout', function () {
		var submenuElem = document.getElementById('monitoring-submenu');
		submenuElem.style.display = 'none';
	});
});