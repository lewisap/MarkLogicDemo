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
		$scope.states = [];
		$scope.companies = [];
		$scope.stateFilter = '';
		$scope.companyFilter = '';
		
//		if ($scope.searchCriteria) {
//			
//		}
		$location.search({'q': $scope.searchCriteria});
		//$log.info($location);
		alert($location.$$absUrl);
		window.location = $location.$$absUrl;
		
//		ML.controller.loadData();
		//var promises = [];
		
		//ML.updateQuery($scope.searchCriteria);//TODO
//		$scope.chartWidget.updateQuery({
//			facet			: '',
//			value			: '',
//			text			: $scope.searchCriteria,
//			constraintType	: 'range'
//		});
		
		// fire off the AJAX queries
//		promises.push(searchService.getPeople(	$scope.searchCriteria,
//												page));
//		promises.push(searchService.getTotalResults($scope.searchCriteria));
//		promises.push(searchService.getSearchFacets($scope.searchCriteria));
//		
//		$q.all(promises).then(function success(value) {
//			// value[0] = getPeople return
//			$scope.summaries = value[0].data;
//
//			// value[1] = getTotalResults return
//			$scope.totalResults = value[1].data;
//			
//			// value[2] = getSearchFacets return
//			$log.info(value[2].data);
//			$scope.companies = value[2].data.companyName;
//			$scope.states = value[2].data.state;
//		});
	};
});