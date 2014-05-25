ML = ML || {};

ML.hifi = function (sequence, container, lofiFlag, showType) {
	var i, l = sequence.length, item, output, type, tempType;
	showType = (showType !== undefined) ? showType : true;
	container.html('');
	for (i = 0; i < l; i++) {
		item = $('<div class="resultItem"></div>');
		if (lofiFlag !== undefined) {
		  type = 'text';
		} else {
	      type = ML.getTypeFromResult(sequence, i);
	      if (showType)
	    	  container.append('<div class="type" title="' + type + '">' + sequence[i].type + '<a href="#" data-type="' + type + '">&nbsp;</a></div>');	    	  
	    }
		container.append(item);
		ML.dataHighlight(sequence[i].result, type, item);
	}
};

ML.getTypeFromResult = function(sequence, i) {
  var type = '';
  
  tempType = sequence[i].type.split(':');
  if (tempType[0] === 'json') {
    type = 'json';
  } else if (sequence[i].type === 'comment' || sequence[i].type === 'element' || sequence[i].type === 'XML document') {
    type = 'xml';
  } else if (sequence[i].type === 'map') {
    type = 'xml';
  } else if (sequence[i].type === 'sql') {
    type = 'sql_table';
  } else if (sequence[i].type === 'solution') {
    type = 'sparql_solution_table';
  } else if (sequence[i].type === 'triple') {
    type = 'turtle';
  } 
  else if (tempType[1]) {
    type = tempType[1];
  } else {
    type = 'text';
  }
  
  return type;
};