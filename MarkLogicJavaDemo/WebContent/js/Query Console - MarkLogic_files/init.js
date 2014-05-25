/* Copyright 2002-2014 MarkLogic Corporation.  All Rights Reserved. */

$(function() {
    
    var reset = qconsole.getQuerystring('reset');
    if (reset == "1") {
        localStorage.qconsoleWorkspaces = JSON.stringify([]);
        
        var qa = qconsole.getQuerystring('qa');
        if (qa == "1") {
            window.location = "/qconsole/?qa=1";
        } else {
            window.location = "/qconsole/";
        }
    }
    
    qconsole.codeMirrorResponseObj = {};
    qconsole.codeMirrorResponseObj.change = function(code) {};
    
    // add keybindings
    var pasteKeys = $(document).shortcutKeys(qconsole.onPasteBindings, undefined, false);
    var docKeys = $(document).shortcutKeys(qconsole.bindings);
    var workspaceKeys = $("#workspace-content").shortcutKeys(qconsole.workspaceBindings);    
    $("#query-view").shortcutKeys(qconsole.outputBindings);    
    $("#profiling-view").shortcutKeys(qconsole.profileBindings);    
    
    // initialize CodeMirror2 for editor space
    qconsole.editor = {};

    var tabCharacters = "  "; // adds two spaces for tabs
    var options = {
        lineNumbers: true,
        matchBrackets: true,
        fixedGutter: true,
        tabSize: tabCharacters.length,
        onKeyEvent: function(editor, event) {
            if (docKeys.keyFired || workspaceKeys.keyFired) {
                return true;  // true tells CodeMirror to NOT fire off the event within CM2
            }
        }
    }

    // Set CodeMirror highlight
    var highlight = qconsole.getQuerystring('highlight');
    if ( highlight ) {
        if ( highlight === "on" ) {
            qconsole.editorHightlight = true;
            qconsole.setCookie("editorHightlight","true", qconsole.cookieExpDays);
        } else {
            qconsole.editorHightlight = false;
            qconsole.setCookie("editorHightlight","false", qconsole.cookieExpDays);
        }
    } else if ( qconsole.getCookie("editorHightlight") ) {
        qconsole.editorHightlight = (qconsole.getCookie("editorHightlight")) ? true : false;
    }
    
    options.mode = ( qconsole.editorHightlight === true ) ? {name: "xquery"} : {name: null};    
    qconsole.editor = CodeMirror.fromTextArea(document.getElementById('query'), options);    
    qconsole.load();
    qconsole.displayOutputView("query");  
});
