/* Copyright 2002-2014 MarkLogic Corporation.  All Rights Reserved. */

// Simple jQuery table plugin
// params: optional object with further parameters
//		customSorts --> object containing custom sort algorithms + name... see sortFuncs var for format of this object
//						i.e.  { "blah":function(a,b) { ... }, "blah2":function(a,b) { ... }  }
//							  HTML headers of the columns to use these sorts would then have the classes "ts-type-blah" & "ts-type-blah2"
(function($) {
  $.fn.tablesorter = function(customSorts) {
 	// private variables	
   var table = this,
		columnsToSort,		// array containing with keys that are set to the header's text() contents.  Obj stores their sort order and whether selected or not
		sortFuncs,			// all defined sort functions
		
	// private functions	
		arraysEqual,		// compare two arrays
		sortMap,			// perform sort
		applySortMap, 		// apply a sort map to the array
		isSortedArray;		// true if array is sorted, false otherwise
	
	customSorts = customSorts || {};
	columnsToSort = [];
	
	// pull in all headers and store in columnsToSort
	table.find("th.ts-order-desc,th.ts-order-asc").each(function(index,th) {
		var columnID = $(th).text();
		columnsToSort[columnID] = {};
		columnsToSort[columnID].order = (index == 0) ? 'asc' : 'desc';  // first sortable column is asc, the rest desc
		columnsToSort[columnID].selected = false;  // first column is considered to be selected
	});

    sortFuncs = $.extend({}, {
      "int":function(a,b) { return parseInt(a, 10) - parseInt(b,10); },
      "float":function(a,b) { return parseFloat(a) - parseFloat(b); },
      "string":function(a,b) { if (a<b) return -1; if (a>b) return +1; return 0;}
    }, customSorts);

    arraysEqual = function(a,b) { return !!a && !!b && !(a<b || b<a); }
    
    sortMap = function(arr, sortFunction, order) {
		var sorted = arr.slice(0).sort(sortFunction), 
			map = [],
			index = 0;
			
		if (order == "desc") { sorted.reverse(); }
		
		for (var i=0; i < arr.length; i++) {
			index = $.inArray(arr[i], sorted);

			while($.inArray(index, map) != -1) {
				index++;
			}
			
			map.push(index);
		}
		// then reverse the sort map order, making it descending
	  
		return map;
    }

    applySortMap = function(arr, map) {
      var clone = arr.slice(0);
      for (var i=0; i < map.length; i++) {
        newIndex = map[i];
        clone[newIndex] = arr[i];
      }
      return clone;
    }

    isSortedArray = function(arr, sortFunction) {
		var clone = arr.slice(0),
			reversed = arr.slice(0).reverse(),
			sorted = arr.slice(0).sort(sortFunction);

		// Check if the array is sorted in either direction.
		return arraysEqual(clone, sorted) || arraysEqual(reversed, sorted);
    }

	// delegate header click event
    table.delegate("th", "click", function() {
	  if ($(this).is("th.ts-order-desc, th.ts-order-asc")) {
		var clickedColumnIndex, columnID, columnToSort, rows, classes, type;
		
		clickedColumnIndex = $(this).index();
		columnID = $(this).text();
		columnToSort = columnsToSort[columnID];
		rows = table.find("tbody tr");
		classes = $(this).attr("class");
		type = null;
		  
		if (classes) {
			classes = classes.split(/\s+/);

			for (var j=0; j < classes.length; j++) {
			  if(classes[j].search("ts-type-") != -1) {
				type = classes[j].replace('ts-type-','');
				break;
			  }
			}
		}
		  
		if(type) {
			var sortFunc 	= sortFuncs[type],
				column 		= [],
				newOrder,
				sortedRowHTML,
				sortedRows;

			rows.each(function(index,tr) {
				var e = $(tr).children().eq(clickedColumnIndex),
					specificSortValueObj = e.find(".sort-value"),  // if column sort-value is added to a table cell child element to specify where the value is
					value = ( specificSortValueObj.length > 0 ) ? specificSortValueObj.text() : e.text();
					
				column.push(value);
			});
			
			newOrder = (columnToSort.order == 'desc') ? 'asc' : 'desc';
			columnToSort.order = (columnToSort.selected) ? newOrder : columnToSort.order; // only change the order when previously selected
			columnToSort.selected = true;
			
			arrayMap = sortMap(column, sortFunc, columnToSort.order);
			
			// reset header icons
			table.find("th.ts-order-desc,th.ts-order-asc").each(function(index,th) {
				$(th).removeClass('active');
				$(th).removeClass('ts-order-desc').removeClass('ts-order-asc');
				$(th).addClass('ts-order-' + columnsToSort[$(th).text()].order);
				columnsToSort[$(th).text()].selected = (clickedColumnIndex !== index) ? false : columnsToSort[$(th).text()].selected;
			});
			// set actively sorted column icon			
			$(this).addClass('active');			

			sortedRows = $(applySortMap(rows, arrayMap));
			sortedRowHTML = "";
			sortedRows.each(function(index,tr) {
				sortedRowClass = (index % 2 == 0) ? '' : 'altrow';  // set class of the row to 'altrow'.  CSS style defined by application
				sortedRowHTML += '<tr class="' + sortedRowClass + '">' + $(tr).html() + '</tr>';                
			});
			// append rows
			table.find("tbody").html('');
			table.find("tbody").html(sortedRowHTML);
		}
	   }	
    });
	
	// if there's an active column, sort by it
	$('.ts-active').click();
  }
 })(jQuery);
