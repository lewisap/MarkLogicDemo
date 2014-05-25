/* Copyright 2002-2014 MarkLogic Corporation.  All Rights Reserved. */

qconsole.Explorer = function() { 
	// explorer object
    var _explorer,
    
	// private variables
    	_active,
		_page,
		_files,
		_collectionName,
		_collectionURI,
		_numFilesToDisplay,
		_browsingFile,
		_exploreHistory,
		_exploreHistoryLoc,
		_replayingExploreHistory,
		
	// private functions
		_getFileContents,
		_displayFilesystem,
		_updateExploreNavUI,
		_viewByCollection,
		_filterResultsByCollection,
		_getExploreDatasource,
		_hideExploreOutputStyling,
		_clearForwardBackBrowseHistory,
		_exploreNavForward,
		_exploreNavBack,
		_changeCollectionURIPage,
		_addToExploreHistory,
		_exploreReplayView,
		_updateExploreBackForwUI,
		_pageReset;
    
    // public
    

    // variable initialization
    _explorer 					= {};
    _numFilesToDisplay 			= 50;
    _exploreHistory 			= [];
    _exploreHistoryLoc 			= 0;
    _replayingExploreHistory 	= false;
    _active						= false;

    // functions (public and private)
    _explorer.setupAndBrowseSource = function () {		
        _clearForwardBackBrowseHistory();
        $("#page-number").val("1");  				// reset page # to 1
        qconsole.displayOutputView("browse");
        qconsole.displayBrowseMessage("");
        _explorer.explorefiles();
    };
    
    _explorer.wipeExploreUI = function() {
        $("#browse-view").removeClass('rendered'); 
        $("#settings-bar-browse").removeClass('hide'); 
        $("#browse-view-content").html('<p class="msg">Select a Content Source, then click "Explore," to view that source.</p>');
        _active = false;
    };

    _explorer.explorefiles = function() {
        $("#footer").hide(); 
        
        _collectionName = "";
        _collectionURI = "";

        var exploreData = {};
        exploreData = _getExploreDatasource(exploreData);
        exploreData.start = (($("#page-number").val() - 1) * _numFilesToDisplay) + 1;
        exploreData.size = _numFilesToDisplay;

        var uri = 'endpoints/explore.xqy';

        qconsole.serverInteractionsObj.explore(uri, exploreData, function(data, xhr) {
        	$("#browse-view").addClass('rendered');    
            var replica = false;
            _files = JSON.parse(data);
            _hideExploreOutputStyling();
            if (xhr.getResponseHeader('qconsole') !== null) {   
                var qconsoleEvalMsg = JSON.parse(xhr.getResponseHeader('qconsole'));
                if (qconsoleEvalMsg.type == 'replica') {
                    replica = true;
                    var replicaMsg = qconsoleEvalMsg.message + qconsoleEvalMsg.timestamp;
                }                
                qconsole.displayExecMessage(replicaMsg);
            }        
            _displayFilesystem(undefined,replica);
            if (!_replayingExploreHistory) {
                _addToExploreHistory(["exploreDB",$(".data-source").val(),$("#page-number").val()]);
            } else {
                // then we are replaying history, so now set it back to saying we're not replaying it
                _replayingExploreHistory = false;
            }
            _updateExploreNavUI();
        },function(data) {  // error callback
        	qconsole.setRunBtnState("run");
        });
    };

    // TODO:  rework endpoint to NOT pass start & size
    // this function is being used to filter these params out upon initial call
    _filterResultsByCollection = function(collectionName, uri) {
        _pageReset();
        _collectionName = collectionName;
        _collectionURI = uri;
        _changeCollectionURIPage();
    };

    _viewByCollection = function(collectionName, uri) {
        $("#browse-view-content").html( '<div id="collection-filter-notification"><div id="remove-collection-filter" title="' + qconsole.getTooltipText('#remove-collection-filter') + '"></div><div id="collection-msg"><p><span id="collection-showing">Showing collection:</span>' + collectionName + '  <span id="num-collection-docs"></span> documents</p></div></div>' );
        _collectionName = collectionName;
        _collectionURI = uri;

        var exploreData = {};

        qconsole.serverInteractionsObj.explore(uri, exploreData, function(data, xhr) {
            var replica = false;
            _files = JSON.parse(data);
            _hideExploreOutputStyling();
            $("#num-collection-docs").html(_files.explore.database.numDocs);
            if (xhr.getResponseHeader('qconsole') !== null) {          
                var qconsoleEvalMsg = JSON.parse(xhr.getResponseHeader('qconsole'));
                if (qconsoleEvalMsg.type == 'replica') {
                    replica = true;
                    var replicaMsg = qconsoleEvalMsg.message + qconsoleEvalMsg.timestamp;
                }
                qconsole.displayExecMessage(replicaMsg);
            }            
            _displayFilesystem(true, replica);
            if (!_replayingExploreHistory) {
                _replayingExploreHistory = false;
                _addToExploreHistory(["exploreCollection",$(".browse-data-source").val(),$("#page-number").val(),uri,collectionName]);
            } else {
                // then we are replaying history, so now set it back to saying we're not replaying it
                _replayingExploreHistory = false;
            }
            _updateExploreNavUI();
        },function(data) {  // error callback
        	qconsole.setRunBtnState("run");
        });

    };

    _updateExploreNavUI = function() {
        if (parseInt($("#page-number").val()) < parseInt($("#total-pages").text())) {
            $("#browse-pagination-btns .icon-seek-next").removeClass('disabled');
            $("#browse-pagination-btns .icon-seek-end").removeClass('disabled');
        } else {
            $("#browse-pagination-btns .icon-seek-next").addClass('disabled');
            $("#browse-pagination-btns .icon-seek-end").addClass('disabled');
        }

        if ($("#page-number").val() == "1") {
            $("#browse-pagination-btns .icon-seek-first").addClass('disabled');
            $("#browse-pagination-btns .icon-seek-prev").addClass('disabled');
        } else {
            $("#browse-pagination-btns .icon-seek-first").removeClass('disabled');
            $("#browse-pagination-btns .icon-seek-prev").removeClass('disabled');
        }
    };


    _getFileContents = function(docURI,nodeType) {
    	var endpointURI, docURI;

        _browsingFile = docURI;		// TODO: change to private var after checking usage
        qconsole.resize();
        
        // planning to have future need to separate output handling... so split out into a switch
        switch(nodeType)
        {
            case 'element':
                qconsole.serverInteractionsObj.exploreFile(_browsingFile, function(data, xhr) {
                    qconsole.displayBrowseMessage(xhr.getResponseHeader('qconsole'));
                    $("#settings-bar-browse").addClass('hide'); 
                    _hideExploreOutputStyling();
                    qconsole.ouputFileContents(data,'xml');
                },function(data) {  // error callback
                    _browsingFile = '';
                });
                break;
            case 'text':
                qconsole.serverInteractionsObj.exploreFile(_browsingFile, function(data, xhr) {
                    qconsole.displayBrowseMessage(xhr.getResponseHeader('qconsole'));
                    $("#settings-bar-browse").addClass('hide'); 
                    _hideExploreOutputStyling();
                    qconsole.ouputFileContents(data,'null');
                },function(data) {  // error callback
                    _browsingFile = '';
                });
                break;
            case 'binary':
                _hideExploreOutputStyling();
                $("#browse-view-content").html( '<div id="browse-view-padding"></div>' );
                window.open(_browsingFile,"fileviewer");

                filename = _browsingFile.split('&uri=');
                filename = filename[1];
                filename = filename.split('/');
                filename = filename[filename.length - 1];

                $("#browse-view-padding").text( "downloaded '" + filename + "'" );
                $("#server-side-spinner").removeClass("shown");
                break;

            default:
                // only happens when called by a "properties" link
                qconsole.serverInteractionsObj.exploreFile(_browsingFile, function(data, xhr) {
                    qconsole.displayBrowseMessage(xhr.getResponseHeader('qconsole'));
                    $("#settings-bar-browse").addClass('hide'); 
                    _hideExploreOutputStyling();
                    qconsole.ouputFileContents(data,'xml');
                },function(data) {  // error callback
                    _browsingFile = '';
                });
                break;
        }


        if (!_replayingExploreHistory) {
            _replayingExploreHistory = false;
            _addToExploreHistory(["exploreFile",$(".data-source").val(),$("#page-number").val(),docURI,nodeType]);
        } else {
            // then we are replaying history, so now set it back to saying we're not replaying it
            _replayingExploreHistory = false;
        }

        return;
    };


    /* end explore modes */
    _getExploreDatasource = function(data) {
        var source = $(".data-source").val();

        if (source.indexOf("as:") != -1) {
            data.sid = source.replace("as:","").replace(":","");
        } else {
            data.dbid = source.replace(":0:Apps","");
        }
        return data;
    };


    _displayFilesystem = function(appendInfo, replica) {
        var total = _files.explore.database.totalDocs;
        var number = _files.explore.database.numDocs;
        var i, len, url, iconPostfix;
        
        if (number > 0) {
            $("#browse-pagination-btns").css("display","block");
            $("#browse-pagination-displaying").css("display","block");
            $("#browse-source").css("display","block");
            $("#total-displayed-files").text(number);
            var replicaTxt = (replica) ? '[replica] ' : '';
            $("#browse-source-name").text(replicaTxt + $(".data-source option:selected").text());
            $("#browse-source-doc-count").text(total);
            $("#total-pages").text(Math.ceil(number / _numFilesToDisplay));
            _explorer.sizePageInputToMaxContents()

            $("#file-start").text(($("#page-number").val() * _numFilesToDisplay) - _numFilesToDisplay + 1);  //
            if ( $("#page-number").val() == $("#total-pages").text()) {
                $("#file-end").text($("#total-displayed-files").text());
            } else {
                $("#file-end").text($("#page-number").val() * _numFilesToDisplay);
            }

            var browseHTML = '<table class="results-header"><tr><th id="results-header-col-doc">Document</th><th id="results-header-col-elem">Root Element</th><th id="results-header-col-prop">Properties</th><th id="results-header-col-coll">Collections</th></tr></table>';

            var altRowClass = '';
            var altRow = false;
            browseHTML += '<div id="explore-results-space"><table class="results">';
            for (i=0, len = _files.explore.docs.length; i < len; i++) {
                var collectionInfo = '';
                var nodeName = '';
                var filePropertiesLink = '(no properties)';
                altRowClass = altRow ? 'class="altrow"' : '';
                altRow = altRow ? false : true;
                if (_files.explore.docs[i].collections == undefined) {
                    numCollections = 0;
                    collectionInfo = '(no collections)';
                } else {
                    numCollections = _files.explore.docs[i].collections.length;
                }

                if (_files.explore.docs[i].propertiesURL !== null) {
                    filePropertiesLink = '<a class="get-file-properties" id="gfp-doc' + i + '" href="javascript:;">(properties)</a>';
                }
                if (_files.explore.docs[i].nodeName == null) {
                    nodeName = "";
                } else {
                    nodeName = _files.explore.docs[i].nodeName;
                }
                
                for (var j=0; j < numCollections; j++) {
                    if (_files.explore.docs[i].collections[j].url !== undefined)
                    	collectionInfo += '<a class="filter-by-collection" id="fbc-doc' + i + '-col' + j + '" href="javascript:;">' + _files.explore.docs[i].collections[j].name + '</a>';
                    else collectionInfo += _files.explore.docs[i].collections[j].name;

                    if (j < (numCollections - 1)) {
                        collectionInfo += ', ';
                    }

                }
                url = _files.explore.docs[i].viewURL.replace(/\\/g,"\\\\");
                iconPostfix = (_files.explore.docs[i].nodeKind == "(empty document)") ? '' : _files.explore.docs[i].nodeKind;
                browseHTML += '<tr ' + altRowClass + '><td class="results-col-doc"><a class="get-file-contents" id="gfc-doc' + i + '" href="javascript:;">' + $('<div/>').text(_files.explore.docs[i].uri).html() + '</a></td><td class="results-col-elem"><img src="static/images/icons/icon_' + iconPostfix + '.png" alt="' + _files.explore.docs[i].nodeKind + '" title="' + _files.explore.docs[i].nodeKind + '" /> ' + nodeName + '</td><td class="results-col-prop" title="' + qconsole.getTooltipText('.results-col-prop') + '">' + filePropertiesLink + '</td><td class="results-col-coll" title="' + qconsole.getTooltipText('.results-col-coll') + '">' + collectionInfo + '</td></tr>';
            }
            browseHTML += '</div></table>';
            if (appendInfo)
                $("#browse-view-content").append( browseHTML );
            else $("#browse-view-content").html( browseHTML );
            _explorer.sizeExploreHeader();
            qconsole.resize();
        } else {
            // no documents in currently viewed DB
            var replicaTxt = (replica) ? '[replica] ' : '';
            $("#browse-source-name").text(replicaTxt + $(".data-source option:selected").text());
            $("#browse-source-doc-count").text(number);
            $("#browse-pagination-btns").css("display","none");
            $("#browse-pagination-displaying").css("display","none");

            var browseHTML = '<table class="results-header"><tr><th id="results-header-col-doc">Document</th><th id="results-header-col-elem">Root Element</th><th title="" id="results-header-col-prop">Properties</th><th title="" id="results-header-col-coll">Collections</th></tr></table>';

            if (appendInfo)
                $("#browse-view-content").append( browseHTML );
            else $("#browse-view-content").html( browseHTML );
        }
    };

    _explorer.sizeExploreHeader = function() {
        // size header to what the contents look like
        $("#results-header-col-doc").width($(".results-col-doc").width());
        $("#results-header-col-elem").width($(".results-col-elem").width());
        $("#results-header-col-prop").width($(".results-col-prop").width());
    };    
    
    _explorer.browseSource = function() {
    	_active = true;
    	$('#explore-results').click();		// simulate click on explore btn to render UI properly		
    	_explorer.setupAndBrowseSource();
    };    
    
    _explorer.sizePageInputToMaxContents = function() {
    	var charWidth = 8;
    	var width = ($("#total-pages").text().length) * charWidth;
    	$("#page-number").width(width);    	
    };
    
    _explorer.addInteractions = function() {
        /**** BROWSE Pane ****/
        $("#explore-source-btn").click(function(e) {
        	_explorer.browseSource()
        });
        
        $("#output-type-menu li.tab-button").click(function(e) {
            if ($(this).attr("id") !== 'explore-results') {
            	_active = false;
            }
         });        
        
        $("#browse-pagination .icon-seek-first").click(function() {
            if ($(this).hasClass('disabled'))
                return;

            if ($("#page-number").val() > 1) {
                $("#page-number").val(1);
                if (_collectionName)
                    _changeCollectionURIPage();
                else
                	_explorer.explorefiles();
            }
        });
        $("#browse-pagination .icon-seek-prev").not('.disabled').click(function() {
            if ($(this).hasClass('disabled'))
                return;

            if ($("#page-number").val() > 1) {
                $("#page-number").val($("#page-number").val() - 1);
                if (_collectionName)
                    _changeCollectionURIPage();
                else
                	_explorer.explorefiles();
            }
        });
        $("#browse-pagination .icon-seek-next").click(function() {
            if ($(this).hasClass('disabled'))
                return;

            var nextPage = parseInt($("#page-number").val()) + 1;
            if (nextPage <= $("#total-pages").text()) {
                $("#page-number").val(nextPage);
                if (_collectionName)
                    _changeCollectionURIPage();
                else
                	_explorer.explorefiles();
            }
        });
        
        $("#browse-pagination .icon-seek-end").click(function() {
            if ($(this).hasClass('disabled'))
                return;

            $("#page-number").val($("#total-pages").text());
            if (_collectionName)
                _changeCollectionURIPage();
            else
            	_explorer.explorefiles();
        });


        // Setup of Browse tab
        $("#button-back").click(function() {
            if ($(this).hasClass('clickable'))
               _exploreNavBack();
        });
        $("#button-forward").click(function() {
            if ($(this).hasClass('clickable'))
                _exploreNavForward();
        });

        // current page # field
        $("#page-number").focus(function() {
            qconsole.explorePageNum = $(this).val();
        });

        $("#page-number").focusout(function() {
            // check if the new value is numeric
            if (($(this).val() - 0) == $(this).val() && $(this).val().length > 0 && $(this).val() <= $("#total-pages").text()) {
                if (_collectionName)
                    _changeCollectionURIPage();
                else
                	_explorer.explorefiles();
            } else {
                $(this).val(qconsole.explorePageNum);
            }
        });

        $("#page-number").keyup(function(e) {
            if (e.keyCode == "13") {  // enter key was pressed
                // check if the new value is numeric
                if (($(this).val() - 0) == $(this).val() && $(this).val().length > 0 && parseInt($(this).val()) <= parseInt($("#total-pages").text())) {
                    if (_collectionName)
                        _changeCollectionURIPage();
                    else
                    	_explorer.explorefiles();
                } else {
                    $(this).val(qconsole.explorePageNum);
                }
            }
        });

        $("#remove-collection-filter").live("click", function() {
            _collectionName = "";
            _collectionURI = "";
            _pageReset();
            _explorer.explorefiles();
        });
        
        $(".filter-by-collection").live("click", function() {
        	// sample ID: fbc-doc5-col1
        	var filterParts, dID, cID;
        	
        	filterParts 	= $(this).attr("id").split('-');
        	dID 			= filterParts[1].replace('doc','');
        	cID 			= filterParts[2].replace('col','');        	
        	_filterResultsByCollection(_files.explore.docs[dID].collections[cID].name,_files.explore.docs[dID].collections[cID].url);
        });        
        
        $(".get-file-properties").live("click", function() {
        	// sample ID: gfp-doc0
        	var filterParts, dID;
        	
        	filterParts 	= $(this).attr("id").split('-');
        	dID 			= filterParts[1].replace('doc','');        	
        	_getFileContents(_files.explore.docs[dID].propertiesURL);        	
        });        
        
        $(".get-file-contents").live("click", function() {
        	// sample ID: gfc-doc3
        	var filterParts, dID;
        	
        	filterParts 	= $(this).attr("id").split('-');
        	dID 			= filterParts[1].replace('doc','');      
        	_getFileContents(_files.explore.docs[dID].viewURL, _files.explore.docs[dID].nodeKind);
        });        
        
    };
    

    /**************************/
    /**  Explore Nav. Funcs  **/
    /**************************/
    _clearForwardBackBrowseHistory = function() {
        _exploreHistory = [];
        _exploreHistoryLoc = 0;
    };
    
    _exploreNavForward = function() {
        if (_exploreHistoryLoc < _exploreHistory.length - 1) {
            _exploreHistoryLoc++;
            _updateExploreBackForwUI();
            _exploreReplayView(_exploreHistoryLoc);
        }
    };


    _exploreNavBack = function() {
        if (_exploreHistoryLoc > 0) {
            _exploreHistoryLoc--;
            _updateExploreBackForwUI();
            _exploreReplayView(_exploreHistoryLoc);
        }
    };

    // paginates through a collection
    _changeCollectionURIPage = function() {
        var newURI = qconsole.stripOutQueryString(_collectionURI, "start");
        newURI = qconsole.stripOutQueryString(newURI, "size");
        var start = (($("#page-number").val() - 1) * _numFilesToDisplay) + 1;
        var size = _numFilesToDisplay;
        newURI = newURI + '&start=' + start + '&size=' + size;
        _viewByCollection(_collectionName,newURI);
    };


    _addToExploreHistory = function(exploreArray) {
        /* exploreArray DEFINITION */
        /* exploreArray = [
         *                     0 - exploreViewType - valid values - "exploreDB", "exploreCollection", "exploreFile"
         *                     1 - exploreDB - $(".data-source").val();
         *                     2 - pageNumber - the page # of that particular DB being explored
         *                     3 - URI - uri of the file or collection being viewed
         *                    ]
         */

        // remove all entries in explore history after the one we're currently writing to
        if (_exploreHistoryLoc < _exploreHistory.length - 1) {
            _exploreHistory.splice(_exploreHistoryLoc + 1, _exploreHistory.length - _exploreHistoryLoc - 1);
        }
        _exploreHistoryLoc = _exploreHistory.length;
        _exploreHistory[_exploreHistoryLoc] = exploreArray;
        _updateExploreBackForwUI();
    };


    _exploreReplayView = function(arrayLoc) {
        /* exploreHistory = [
         *                         0 - exploreViewType - valid values - "exploreDB", "exploreCollection", "exploreFile"
         *                         1 - exploreDB - $(".data-source").val();
         *                         2 - pageNumber - the page # of that particular DB/collection being explored
         *                         3 - URI - uri of the file/collection being viewed
         *                         4 - collectionName - the name of the collection being filtered on
         *                     ]
         */

        // set the boolean letting us know we're replaying
        _replayingExploreHistory = true;
        // set DB
        $(".data-source").val(_exploreHistory[arrayLoc][1]);
        // set page #
        $("#page-number").val(_exploreHistory[arrayLoc][2]);

        // act on what sort of view type we are replaying
        switch(_exploreHistory[arrayLoc][0])
        {
        case 'exploreDB':
            _explorer.explorefiles();
            break;
        case 'exploreCollection':
            _viewByCollection(_exploreHistory[arrayLoc][4], _exploreHistory[arrayLoc][3]);
            break;
        case 'exploreFile':  // works for both files and properties of files
            _getFileContents(_exploreHistory[arrayLoc][3],_exploreHistory[arrayLoc][4]);
            break;
        default:
            break;
        }
    };

    _updateExploreBackForwUI = function() {
        // remove all entries in explore history after the one we're currently writing to
        if (_exploreHistoryLoc < _exploreHistory.length - 1) {
            $("#navigation-buttons #button-forward").addClass('clickable');
        } else {
            $("#navigation-buttons #button-forward").removeClass('clickable');
        }

        if (_exploreHistoryLoc == 0) {
            $("#navigation-buttons #button-back").removeClass('clickable');
        } else {
            $("#navigation-buttons #button-back").addClass('clickable');
        }
    };
    
    _hideExploreOutputStyling = function() {
        // manually remove Code Mirror since the toTextArea() is not breaking
        if (qconsole.fileviewer) {
            $("#browse-view  .CodeMirror-wrapping").remove();
            $("#browse-view-content").css("display","block");
            qconsole.fileviewer = 0;
        }
    };

    _pageReset = function() {
        $("#page-number").val(1);
    };
    
    return _explorer;
}();  // use closure to return the object on file load