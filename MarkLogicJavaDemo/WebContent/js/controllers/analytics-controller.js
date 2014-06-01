var analyticsApp = angular.module('analyticsApp', ['ui.bootstrap'])
	.config(function($locationProvider) {
		// use the HTML5 History API
		$locationProvider.html5Mode(true);
	});

//debounce directive, to delay input
analyticsApp.directive('ngDebounce', function ($timeout) {
	return {
		restrict: 'A',
		require: 'ngModel',
		priority: 99,
		link: function (scope, elm, attr, ngModelCtrl) {
			if (attr.type === 'radio' || attr.type === 'checkbox') {
				return;
			}

			var delay = parseInt(attr.ngDebounce, 10);
			if (isNaN(delay)) {
				delay = 1000;
			}

			elm.unbind('input');

			var debounce;
			elm.bind('input', function () {
				$timeout.cancel(debounce);
				debounce = $timeout(function () {
					scope.$apply(function () {
						ngModelCtrl.$setViewValue(elm.val());
					});
				}, delay);
			});
			
			elm.bind('blur', function () {
				scope.$apply(function () {
					ngModelCtrl.$setViewValue(elm.val());
				});
			});
		}
	};
});

analyticsApp.controller('SearchCtrl', function($scope, $q, $log, $location) {
	$scope.alerts = [];
	$scope.summaries = [];
	$scope.searchCriteria = '';
	$scope.companyFilter = '';
	$scope.stateFilter = '';
	
	$scope.companies = [];
	$scope.states = [];
	
	$scope.totalResults = 0;
	$scope.currentPage = 1;
	
	$scope.test = function(dat) {
		$log.info(dat);
	};
	
	/*
	 * CHART WIDGET 
	 */
	ML.controller.init({proxy: "widgetProxy"});
	
	var statesConfig = { constraint: 'state',
			constraintType: 'range', 
			dataType: 'string', 
			title: 'State Distribution', 
			dataLabel: 'state'
		};
	
	var companiesConfig = { constraint: 'companyName',
            				constraintType: 'range', 
            				dataType: 'string', 
            				title: 'Company Distribution', 
            				dataLabel: 'companyName'
            			};
	
//	var companyChart = 
	ML.chartWidget('companyContainer', 'column', companiesConfig);
	ML.chartWidget('statesContainer', 'pie', statesConfig);
	
	ML.controller.loadData();
	/*
	 * END CHART WIDGET 
	 */
	
	/*
	 * MAP Widget code here TODO
	 */
//	ML.controller.init({proxy: "mapProxy"});
//	
//	var mapConfig = {
//			imageDir : "images/map/",
//			constraintType: 'geo'
//	};
//	ML.mapWidget('locationContainer', 'pinmap', mapConfig);
//	
//	ML.controller.loadData();
	/*
	 * END MAP WIDGET CODE TODO
	 */
	
	$scope.search = function(page) {
		$scope.summaries = [];
		
		$location.search({'q': $scope.searchCriteria});
		window.location = $location.$$absUrl;
	};
});