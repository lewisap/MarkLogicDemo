/* Copyright 2002-2014 MarkLogic Corporation.  All Rights Reserved. */
var ML = ML || {};

/**
 * input:string - xml or json string to be formatted
 * type:string - either xml or json
 * container:jQuery Object - container to render formatted data
 * options:object - truncate (-1), textCollapse (100), tabIndex (1)
 */
 
ML.dataHighlight = function (input, type, container, options) {
	var render, errorHandler, setIFrameContent, errorHandled = false;
	
	// set open/close bindings on initial invocation

	// Delegate click events for expand/collapse to the output container, rather than attaching to each individual node
	container.delegate(".toggle, .processing-instruction-close", "click", function(evt) {
	  //$(evt.currentTarget).closest(".element, .comment, .processing-instruction, .json-object, .json-array").toggleClass("collapsed");
	  $(this).closest(".element, .comment, .processing-instruction, .json-object, .json-array").toggleClass("collapsed");
		// http://stackoverflow.com/questions/11181791/difference-in-display-of-inline-elements-when-toggled-programmatically-and-decla
		//.end().siblings(".json-array-value").toggleClass("force-inline");
	  $(evt.currentTarget).next(".element-open, .comment-open, .processing-instruction-open, .json-object-open, .json-array-open").focus();
	  evt.stopPropagation();
	});

	container.delegate(".result-info h3", "click", function(evt) {
		$(this).closest(".result-info").toggleClass("collapsed");
	});
	
	
	if (type === 'table') {
		container.parent().show(); // TODO: this is a hack to get SQL to show up
	}
	
	render = function (html) {
		container.html(html);
	};
	
	setIFrameContent = function(selector,data) {
		var $iframe = container.find(selector);
		var resizeIFrame = function() {
			$iframe[0].style.height = $iframe[0].contentWindow.document.body.scrollHeight + 'px';
		};
	    if ($.browser.safari) {
	        $iframe.ready( function(){
	            $iframe.contents().find('body').html(data);
	            $iframe.contents().find('body').css("margin","4px");
	            resizeIFrame();
	            $iframe.resize(resizeIFrame);
	        });
	    } else {
	        $iframe.load( function(){
	            $iframe.contents().find('body').html(data);
	            $iframe.contents().find('body').css("margin","4px");    
	            resizeIFrame();
	            $iframe.resize(resizeIFrame);
	        });
	    }
	};	
	
	errorHandler = function (error, tagCount) {
		var errTxt = "<div class='parse-error'><p class='header'>Parser Error: Cannot parse result as " + type + "</p><h2>Parser Output:</h2><p class='output'></p></div>";
		if (!errorHandled) {
			if (tagCount > 15000) {
				errTxt = "<div class='parse-error'><p class='header'>Too many elements to render</p><h2>Parser Output:</h2><p class='output'></p></div>";
			}
			
			container.html(errTxt);
			$('.parse-error p.output').text(input);//.html();
			errorHandled = true;
		}
	};
	
	function getLengthInBytes(str) {
		var b = str.match(/[^\x00-\xff]/g);
		return (str.length + (!b ? 0: b.length));
	}
	
  if (!$.isArray(input)
		&& (type === 'xml' || type === 'json' || type === 'table')
        && getLengthInBytes(input) > 5000000) { // TODO: rework logic to generalize text vs not text case
			container.html("<div class='parse-error'><p class='header'>Parser Error: Cannot parse result. File size too large</p><h2>Raw Output:</h2><p class='output'></p></div>");
			$('.parse-error p.output').text(input);//.html();
			errorHandled = true;
  } else if (type === 'xml' || type === 'map') {
	  ML.highlightXML(input, render, options, errorHandler);
	} else if (type === 'json') {
		ML.highlightJSON(input, render, options, errorHandler);
	} else if (type === 'sql_table') {
		ML.renderSQLTable(input, render, options, errorHandler);
	} else if (type === 'sparql_solution_table') {
	    ML.renderBindingTable(input, render, options, errorHandler);
	} else if (type === 'turtle') {
		ML.renderSPARQLTriples(input, render, options, errorHandler);
	} else if (type === 'html') {
		render('<iframe class="html-output-frame" frameborder="0"></iframe>');
		setIFrameContent('.html-output-frame',input);
	} else {
	    if ($.isArray(input) || (input instanceof Object)) {
			  render('<div class="text-wrapper">' + escapeForHTML(JSON.stringify(input, null)) + '</div>');
	    }
	    else {
			  render('<div class="text-wrapper">' + escapeForHTML(input) + '</div>');
	    }
			// container.text(input).html();  // alternative to textarea
	}
};

ML.renderSQLTable = function (input, handler, options, errorHandler) {
	var numCols;
	var tableLength;
	var i, j;
	var table;
	var tag;
	var maxWidth = 0;
	//var parsedInput = JSON.parse(input);
	var parsedInput = input;
	
	function repeat(pattern, count) {
	    if (count < 1) return '';
	    var result = '';
	    while (count > 0) {
	        if (count & 1) result += pattern;
	        count >>= 1, pattern += pattern;
	    }
	    return result;
	}
	
	if ($.isArray(parsedInput) && $.isArray(parsedInput[0])) {
		numCols = parsedInput[0].length;
		tableLength = parsedInput.length;
		
		if (options && options.piped) {
			table = '';
			for (i = 0; i < tableLength; i++) {
				for (j = 0; j < numCols; j++) {
					if (parsedInput[i][j].length > maxWidth) {
						maxWidth = parsedInput[i][j].length;
					}
				}
			}
			for (i = 0; i < tableLength; i++) {
				for (j = 0; j < numCols; j++) {
					if (j === 0) {
						table += "| ";
					}
					padding = (maxWidth - parsedInput[i][j].toString().length);
					table += parsedInput[i][j] + repeat(" ", padding) + " | ";
				}
				table += "|<br />";
			}
		} else {
			table = "<table class='results'>";
			
			for (i = 0; i < tableLength; i++) {
				if (i === 0) {
					table += "<thead class='results-header'>";
				}
				
				if ((i+1)%2) {
					table += "<tr class='altrow'>";
				} else {
					table += "<tr>";
				}
				
				for (j = 0; j < numCols; j++) {
					if (i === 0) {
						tag = "th";
					} else {
						tag = "td";
					}
					table += "<" + tag;
					
					table += ">" + parsedInput[i][j] + "</" + tag + ">";
				}
				
				table += "</tr>";
				
				if (i === 0) {
					table += "</thead>"
				}
			}
			table += "</table>";
		}

		handler(table);
	} else {
		errorHandler("Error: not a properly formatted SQL results array");
	}
};

ML.renderBindingTable = function (input, handler, options, errorHandler) {
        var tableLength;
        var table;
        var tag;
        var maxWidth = 0;
        var parsedInput = input;
  var numCols = 0;
  var colIndex = 0;
        
  table = "<table class='results'>";
        if (parsedInput && $.isArray(parsedInput)) {
    tableLength = parsedInput.length;

    var colNames = [];
    table = "<table class='results'>";
    for (var i = 0; i < tableLength; i++) {
      // We use the first element in the array, to figure out the column name
      if (i === 0) {
        table += "<thead class='results-header'>";
        $.each(parsedInput[0], function( key, value ) {
          table += "<th>";
          table += key;
          table += "</th>";    
          
          colNames[colIndex] = key;
          ++colIndex;
        });

        numCols = colNames.length;          
      }
    
      if ((i+1) % 2) {
        table += "<tr class='altrow'>";
      } 
      else {
        table += "<tr>";
      }        
                
      for (var j = 0; j < numCols; ++j) {
        table += "<td>";
        
        // We use the columnn name as the key to get the value from each element in the
        // array
        binding = (parsedInput[i])[colNames[j]];
        table += escapeForHTML(binding);
        table += "</td>";             
      }
      
      table += "</tr>";
    }
    
    table += "</table>";
          
                handler(table);
        } else {
                errorHandler("Error: not a properly formatted SQL results array");
        }
};

// Input: RDF/JSON https://dvcs.w3.org/hg/rdf/raw-file/default/rdf-json/index.html#
// Output: Turtle http://www.w3.org/TR/turtle/ formatted as one triple per line
ML.turtleOutput = function(jsonObj) {
  var globalStr = '@prefix xs: <http://www.w3.org/2001/XMLSchema#> .\n';
  if (typeof jsonObj === "object" ) {
      var subjectIndex = 0;
      $.each(jsonObj, function(subjectKey, predicates) {          
          if (subjectIndex !== 0) {
            globalStr += ' .\n';
          }
          else {
            ++subjectIndex;
          }
          // NB: RDF/JSON intermed format doesn't allow non-IRI subj, pred
          var subjectStr = '<';
          subjectStr += subjectKey;
          subjectStr += '>';
          
          globalStr += subjectStr; 

          var predicateIndex = 0;
          $.each(predicates, function(predicateKey, tripleObjects) {
            if (predicateIndex === 0) {
              ++predicateIndex;
              
              var predicateStr = ' <';
              predicateStr += predicateKey;
              predicateStr += '>';
              
              globalStr += predicateStr;
            }
            else {
              var predicateStr = ' ;';
              
              predicateStr += '\n  <';
              predicateStr += predicateKey;
              predicateStr += '>';
              
              globalStr += predicateStr;
            }

            var triplesObjectIndex = 0;
            $.each(tripleObjects, function(objectKey, tripleObject) {
              if (triplesObjectIndex !== 0) {
                globalStr += ' ,\n    ';
              }
              else {
                globalStr += ' ';
                triplesObjectIndex++;
              }
                
              if (tripleObject.type !== undefined) {
                if (tripleObject.type === "uri") {
                  var objectStr = '<';
                  objectStr += tripleObject.value;
                  objectStr += '>';
                  

                  globalStr += objectStr;
                }
                else if (tripleObject.type === "literal") {
                  if (tripleObject.datatype !== undefined) {
                    if (-1 !== tripleObject.datatype.search("http://www.w3.org/2001/XMLSchema#")) {
                      var t = tripleObject.datatype.replace("http://www.w3.org/2001/XMLSchema#", "^^xs:");
                      var objectStr = '"';
                      objectStr += tripleObject.value;
                      objectStr += '"';
                      objectStr += t;
                      
                      globalStr += objectStr;
                    }
                    else {
                      var objectStr = '"';
                      objectStr += tripleObject.value;
                      objectStr += '"^^<';
                      objectStr += tripleObject.datatype;
                      objectStr += '>';

                      globalStr += objectStr;
                    }
                  }
                  else if (tripleObject.lang !== undefined) {
                    var objectStr = '"';
                    objectStr += tripleObject.value;
                    objectStr += '"@';
                    objectStr += tripleObject.lang;

                    globalStr += objectStr;
                  }
                  else {
                    var objectStr = '"';
                    objectStr += tripleObject.value;
                    objectStr += '" ';

                    globalStr += objectStr;
                  }
                }
                else {
                  var objectStr = tripleObject.value;
                  
                  globalStr += objectStr;
                }
              }
            });
          });
      });
      
      globalStr += ' .';
  }
  else {
      // jsonOb is a number or string
  }
  
  return globalStr;
}

ML.renderSPARQLTriples = function (input, handler, options, errorHandler) {
  var str = ML.turtleOutput(input);
  handler('<div class="text-wrapper">' + escapeForHTML(str) + '</div>');
};

/**
 * Turns JSON into semantic HTML for display (and beyond).
 * json <String>: The JSON to
 * handler <Function<String>>: The function to call upon successful conversion
 * options <Object>
 * errorHandler <Function<Object>>: The function to call in the event of an error
 */
ML.highlightJSON = function (json, handler, options, errorHandler) {
  "use strict";
  // Accumulates HTML as the parsing happens. Concatenated in the send function.
  var accumulator = [];
  // Local state
  var stack = [];
  var parser = exports.parser(options);
  var options = options || {}, 
    truncate = options.truncate || -1,
    textCollapse = options.textCollapse || 100,
    tabIndex = options.tabIndex || 1;
  
  var tagCount = 0;
  
  /* Utils */
  // Checks the stack to see what the top is. Possible values are 
  // "object", "array", or "key-value"
  function isIn(type) {
    function top() {
      if(stack.length < 1) return undefined;
      return stack[stack.length - 1]; 
    }
    if(stack.length < 1) return false;
    return top() === type;
  }
  // If we're processing a key-value, close its div and pop it off the stack
  function popKV() {
    if(isIn("key-value")) {
      stack.pop();
      //accumulator.push("END-KV " + stack[stack.length - 1]);
      if(isIn("object")) accumulator.push('<span class="json-separator">, </span>');
      accumulator.push("</div>");
    }
  }
  // This is UGLY. It goes up the stack and finds the first json-separator and removes it.
  // This is useful for removing the final separator when closing object key-values and array values
  function popLastSeparator(context /* Only used for debugging */) {
    var len = accumulator.length;
    for(var i = len - 1; i >= 0; i--) {
      if(/json-array/.test(accumulator[i]) || /json-object/.test(accumulator[i])) break;
      if(/json-separator/.test(accumulator[i])) {
        //<span style="background: yellow;">REMOVED from ' + context + '</span>
        accumulator[i] = '<!-- removed json-separator -->';
        return;
      }
    }
  }

  /* Parsers handlers */
  parser.onready = function() { };
  parser.onerror = function(error) {
    // TODO: Unroll stack here
    errorHandler(error, tagCount);
  };
  parser.onvalue = function(v) {
    var quote = '';
    var type = typeof v;
    if("object" === type && !v) type = "null";
    if("string" === type) {
      quote = '"';
      v = escapeForHTML(v);
    }
    if(isIn("array")) accumulator.push('<div class="json-array-item">');
    accumulator.push('<span class="json-value">' + quote + '<span class="json-' + type + '">' + v + '</span>' + quote);
    if(isIn("array")) accumulator.push('<span class="json-separator">, </span>');
    accumulator.push('</span>'); // closes .json-value
    if(isIn("array")) accumulator.push('</div>'); // closes .json-array-item
    popKV();
  };
  parser.onopenobject = function(key) {
  	  	tagCount++;
  	if (tagCount > 15000) {
    	return parser.end();
    }
    // opened an object. key is the first key.
    if(isIn("array")) accumulator.push('<div class="json-array-item">');
    stack.push("object");
    accumulator.push('<div class="json-object">');
    accumulator.push('<span class="toggle"></span><span class="json-object-open">{</span>');
    accumulator.push('<div class="json-object-value">');
    if(key) accumulator.push(doKey(key));
  };
  parser.oncloseobject = function () {
    stack.pop();
    // Hack to remove the last trailing comma on the child key-value pairs
    popLastSeparator("oncloseobject");
    accumulator.push('</div><span class="json-object-close">}</span>');
    accumulator.push('</div>');
    popKV();
    if(isIn("array")) {
      accumulator.push('<span class="json-separator">, </span>');
      accumulator.push('</div>'); // closes .json-array-item
    }
  };
  
  parser.onkey = function(key) {
    // Got a key in an object, numbers 2 to n. The first key is in the openobject event, curiously.
    doKey(key);
  };
  function doKey(key) {
    stack.push("key-value");
    accumulator.push('<div class="json-key-value">'); // closed in popKV()
    accumulator.push('<span class="json-key">"<span class="json-key-name">' + key + '</span>": </span>');
  }
  parser.onopenarray = function () {
  	tagCount++;
  	if (tagCount > 15000) {
    	return parser.end();
    }
  	
    if(isIn("array")) accumulator.push('<div class="json-array-item">');
    stack.push("array");
    accumulator.push('<div class="json-array"><span class="toggle"></span><span class="json-array-open">[</span>');
    accumulator.push('<div class="json-array-value">');
  };
  parser.onclosearray = function () {
    if(isIn("array")) popLastSeparator("onclosearray");
    accumulator.push('</div>'); // closing div.json-array-value
    accumulator.push('<span class="json-array-close">]</span>');
    stack.pop();
    accumulator.push('</div>'); // closes .json-array
    popKV();
    if(isIn("array")) {
      accumulator.push('<span class="json-separator">, </span>');
      accumulator.push('</div>'); // closes .json-array-item
    }
  };
  parser.onend = function() {
    if(!parser.error) send();
  };
  function send() {
    var cleanUp = [];
    var message = "";
    
    if (stack.length > 0) {
      if (console && console.error && console.warn) {
        console.error(stack.join(", "));
        console.warn("TODO: Need to implement stack unroll in the case of truncation");
      }
      for(var i = stack.length - 1; i >= 0; i--) {
        // Close element and element-value blocks due to truncation
        // TODO: This should happen more elegantly than chopped off elements
        // TODO: There should really be some interactive way to lazily format the next chunk
        //cleanUp.push('<!-- stack: ' + stack[i] + ' --></div></div>');
      }
      //message = '<div class="message">For performance reasons, you’re only looking at the first ' + options.truncate + '-character chunk. To see the full result, output the query as raw text.</div>';
    }
    // FIXME: This is test code. It's expsensive and doesn't belong here
    //var outcomes = testJSON(accumulator.join("")) //, ['data[0].firstName === "Wayne"']);
    //if(outcomes.length > 0) console.dir(outcomes);
    // FIXME: End test 
    handler(
      "\n\n<!-- START JSON-HIGHLIGHT -->" + 
      "<div class='root'>" + 
        accumulator.join("") + 
        cleanUp.join("") + 
      "</div>"
      + "<!-- END JSON-HIGHLIGHT -->\n\n"
      + message
    );
  }
  parser.write(-1 === options.truncate ? json : json.substring(0, options.truncate)).close();
};











ML.highlightXML = function (xml, handler, options, errorHandler) {
    var WHITESPACE = /^\s+$/; // all whitespace
    // Accumulates HTML as the parsing happens. Concatenated in the send function.
    var accumulator = [];
    // Keeps track of elements whose start tags have been parsed, 
    // but whose end tags haven't been encountered. This is 
    // required to clean up the unclosed elements in the case 
    // that the XML is truncated.
    var stack = [];
    var elements = {};
    var namespaces = {};
    var p = new exports.SAXParser(true, {xmlns: true});
    var options = options || {}, 
      truncate = options.truncate || -1,
      textCollapse = options.textCollapse || 100,
      tabIndex = options.tabIndex || 1;
    
    var tagCount = 0;

    // Parse a qname into its prefix and local parts
    function parsePrefix(qname) {
      var tokens = qname.split(":");
      if(2 === tokens.length) {
        return "<span class='namespace-prefix'>" + tokens[0] + "</span>:" + parsePrefix(tokens[1]);
      } else {
        return "<span class='local-name'>" + qname + "</span>";
      }
    }
    p.onready = function() {};
    p.onerror = function(error) {
      // How do we know if it's a real error? If so, we need to invoke the error handler.
      errorHandler(error, tagCount);
      // Truncation throws a parse error as well. However, in the case of truncation we just want to clean up and proceed as normal.
      //send();
    };
    
    // *private function
    p.handleOnOpenTag = function(node, selfClosing) {
        tagCount++;
        
        if (tagCount > 15000) {
        	return p.end();
        }
        
	    var attrs = [];
	    var ns = [];
	    
	    for (a in node.attributes) {
	        var attr = node.attributes[a];
	        
	        if(a.substr(0, 5) === "xmlns") {
	        	var prefix = "";
	        	
	        	if(":" === a[5]) {
	        	  prefix = ":<span class='namespace-prefix'>" + a.substring(6) + "</span>";
	        	}
	        	
	        	ns.push(" <span class='namespace'><span class='xmlns'>xmlns</span>" + prefix + "=&quot;<span class='namespace-uri'>" + node.attributes[a].value + "</span>&quot;</span>");
	        } else {
	            attrs.push(" <span class='attribute' title='"+attr.name+" ("+attr.uri+")' data-attribute-name='"+attr.name+"' data-attribute-localname='"+attr.local+"' data-attribute-prefix='"+attr.prefix+"' data-attribute-namespace-uri='"+attr.uri+"' data-attribute-value='"+attr.value+"'><span class='attribute-name'>" + parsePrefix(a) + "</span>=&quot;<span class='attribute-value'>" + escapeForHTML(attr.value) + "</span>&quot;</span>");
	        }
	    }
	    
      if (selfClosing) {
	      accumulator.push("<div class='element' data-element-name='"+node.name+"' data-element-prefix='"+node.prefix+"' data-element-localname='"+node.local+"' data-element-namespace-uri='"+node.uri+"'><span class='element-open' tabindex='" + tabIndex + "'>&lt;<span class='element-name' title='"+node.name+" ("+node.uri+")'>" + parsePrefix(node.name) + "</span><span class='element-meta'>" + attrs.join("") + ns.join("") + '</span>');
      }
      else 
	    {
	      accumulator.push("<div class='element' data-element-name='"+node.name+"' data-element-prefix='"+node.prefix+"' data-element-localname='"+node.local+"' data-element-namespace-uri='"+node.uri+"'><span class='toggle'></span><span class='element-open' tabindex='" + tabIndex + "'>&lt;<span class='element-name' title='"+node.name+" ("+node.uri+")'>" + parsePrefix(node.name) + "</span><span class='element-meta'>" + attrs.join("") + ns.join("") + '</span>');
	      accumulator.push("&gt;</span><div class='element-value'>");
	    }
      
	    var key = "{" + (node.uri || "") + "}" + node.local; // Clark notation
	    stack.push(key);

	    // Keep track of elements
	    if(elements[key]) { 
	    	elements[key].count++;
	    } else { 
	    	elements[key] = {
	    			"localname": node.local,
	    			"namespace-uri": node.uri,
	    			"count": 1,
	    			"paths": {}
	    	};
	    }
	    
	    var stackKey = "/" + stack.slice().join("/");
	    
	    if (elements[key].paths[stackKey]) {
	    	elements[key].paths[stackKey].count++;
	    } else {
	    	elements[key].paths[stackKey] = { "count": 1 };
	    }
    };
    
    p.onopentag = function(node) {
      p.handleOnOpenTag(node, false);
    };
       
    p.onopentag_selfclosing = function(node) {
      p.handleOnOpenTag(node, true);
    };

    // * private function
    p.handleOnCloseTag = function(name, selfclosing) {
      if (selfclosing) {
        accumulator.push("<span class='element-close'><span class='element-name'>" + "</span>/&gt;</span></div>");
      }
      else {        
        accumulator.push("</div>"); // element-value
        accumulator.push("<span class='element-close'>&lt;/<span class='element-name'>" + name + "</span>&gt;</span></div>");
      }
      stack.pop();
    };
    
    p.onclosetag = function(name) {
      p.handleOnCloseTag(name, false);
    };
    
    p.onclosetag_selfclosing = function(name) {
      p.handleOnCloseTag(name, true);
    };
    

    p.ontext = function(text) {
      // Whether to collapse a simple text node (still wonky). Currently implemented at the client
      var shortFlag = "";
      if(!WHITESPACE.test(text)) { // if it's only whitespace. This feels dangerous.
    	accumulator[accumulator.length - 1] = accumulator[accumulator.length - 1].replace('element-value', 'element-value text');
        accumulator.push("<div class='text" + shortFlag + "'>" + escapeForHTML(text) + "</div>");
        //accumulator.push(escapeForHTML(text));
      }
    };
    p.oncomment = function(comment) {
      accumulator.push(buildComment(comment, tabIndex));
    };
    p.onprocessinginstruction = function(pi) {
      accumulator.push('<div class="processing-instruction"><span class="toggle"></span><span class="processing-instruction-open" tabindex="' + tabIndex + '">&lt;?</span><span class="processing-instruction-value"><span class="processing-instruction-name">' + pi.name + '</span> <span class="processing-instruction-body"> ' + pi.body + '</span></span><span class="processing-instruction-close">?></span></div>');
    };
    p.onopennamespace = function(ns /* {"prefix", "uri"} */) {
      if(namespaces[ns.uri]) {
        namespaces[ns.uri].push(ns.prefix);
      } else {
        namespaces[ns.uri] = [ns.prefix];
      }
    };
    p.onend = function() {
      if(!p.error) send();
    };
    function send() {
      var cleanUp = [];
      var message = "";
      if(stack.length > 0) {
        for(var i = stack.length - 1; i >= 0; i--) {
          /* Close element and element-value blocks due to truncation */
          /* TODO: This should happen more elegantly than chopped off elements */
          /* TODO: There should really be some interactive way to lazily format the next chunk */
          cleanUp.push('<!-- stack: ' + stack[i] + ' --></div></div>');
        }
        message = '<div class="message">For performance reasons, you’re only looking at the first ' + options.truncate + '-character chunk. To see the full result, output the query as raw text.</div>';
      }
      handler(
        "\n\n<!-- START XML-HIGHLIGHT -->" + 
        "<div class='root'>" + 
          accumulator.join("") + 
          cleanUp.join("") + 
        "</div>"
        + "<!-- END XML-HIGHLIGHT -->\n\n"
        + message,
        {"elements": elements, "namespaces": namespaces}
      );
    }
    try {
    	p.write(-1 === options.truncate ? xml : xml.substring(0, options.truncate)).close();
    } catch (e) {
    }
    
};
  function buildComment(comment, tabIndex) {
    return "<div class='comment'><span class='toggle'></span><span class='comment-open' tabindex='" + tabIndex + "'>&lt;!--</span><div class='comment-value'>" + escapeForHTML(comment) + "</div><span class='comment-close'>--&gt;</span></div>";
  };

  
  
  
  
  
  // Utils
  
  "use strict";
  /** Firefox 3.6 doesn't implement the Object.create function. Let's do it ourselves in the case where it doesn't exist already. Requires the non-standard __proto__ property. */
  if(typeof Object.create !== "function") {
    if(console && console.warn) console.warn("Implementing Object.create in custom code");
    Object.create = function(proto) {
      var obj = new Object();
      obj.__proto__ = proto;
      return obj;
    };
  }
  /** If it's an array just return it. If not, wrap it in an array. */
  function wrapArray(obj) {
    if(toString.call(obj) === '[object Array]') 
      return obj;
    else 
      return [obj];
  }

  /** http://stackoverflow.com/questions/985272/jquery-selecting-text-in-an-element-akin-to-highlighting-with-your-mouse/2838358#2838358 */
  function selectElementText(el, win) {
      win = win || window;
      var doc = win.document, sel, range;
      if (win.getSelection && doc.createRange) {
          sel = win.getSelection();
          range = doc.createRange();
          range.selectNodeContents(el);
          sel.removeAllRanges();
          sel.addRange(range);
      } else if (doc.body.createTextRange) {
          range = doc.body.createTextRange();
          range.moveToElementText(el);
          range.select();
      }
  }
  /** http://bugs.jquery.com/ticket/3368 */
  function isJustCommandKey(keyEvent) {
    var isMac = /^Mac/.test(window.navigator.platform);
    if(isMac) return keyEvent.metaKey && !keyEvent.ctrlKey;
    else keyEvent.ctlKey;
  }

  // Escape text for HTML, including line breaks
  function prepareText(text) {
    return text
      .replace(/&/gm, "&amp;")
      .replace(/</gm, "&lt;")
      //.replace(/[\n\r]/gm, "<br/>")
      .replace(/\t/gm, "&nbsp;&nbsp;");
  }
  /** Replace < and & for literal dispaly in HTML */
  function escapeForHTML(str) {
    if(typeof str === "undefined") return "";
    else if (str === null) return null;
    
    return prepareText(str)
      .replace(/[\n\r]/gm, "<br/>");
  }

  /** Hack to center a modal dialog */
  jQuery.fn.center = function() {
    this.css("position", "absolute");
    this.css("top", (($(window).height() - this.outerHeight()) / 2) + $(window).scrollTop() + "px");
    this.css("left", (($(window).width() - this.outerWidth()) / 2) + $(window).scrollLeft() + "px");
    return this;
  };

  /**
   * Delay the execution of a function for some millisecond duration. 
   * Cancels any previous invocations in the queue, effectively just running
   * the last instance called. This is great for handling keystrokes where
   * you'd like the handler code to run slighly after no more input has been
   * received.
   *
   * @param func The function to be invoked
   * @param duration The time in milliseconds to wait, defaults to 1000
   */
  function delay(func, duration) {
    var timer;
    return function() {
      if(timer) clearTimeout(timer);
      timer = setTimeout(func, duration || 1000);
    };
  }
  function buildURL(url, params) {
    var qs = $.param(params);
    var conn = "";
    if(qs) conn = "?";
    return url + conn + qs;
  }
