//uses jquery
$(document).ready(function() {
   var config = {
       searchEndpoint: "search.php",
       valueEndpoint: "values.php"
   }
   ML.controller.init(config);
 
   var options = {
       constraint: "decade",
       title: "Awards by decade",
       subtitle: "1935 – 2011",
       dataLabel: "Award count"
   };
 
   ML.chartWidget("#award_container”, "line", options);
   ML.controller.getData({});
});