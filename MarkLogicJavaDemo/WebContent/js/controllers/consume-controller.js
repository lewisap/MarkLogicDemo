var consumeApp = angular.module('consumeApp', ['ui.bootstrap']);

consumeApp.factory('searchService', function($http) {
	return {
		deletePerson : function(uri) {
			return $http.post('deletePerson', uri).success(function(data, status, headers, config) {
				return data;
			}).error(function(data, status, headers, config) {
				return data;
			});
		},
		getPeople : function(criteria, page) {
			return $http.get('getPeople', {params: { criteria: criteria, page:page }
			}).success(function(data, status, headers, config) {
				return data;
			}).error(function(data, status, headers, config) {
				return data;
			});
		},
		getFacetedResults : function(criteria, page) {
			return $http.get('getFacetedResults', {params: { criteria: criteria, page:page }
			}).success(function(data, status, headers, config) {
				return data;
			}).error(function(data, status, headers, config) {
				return data;
			});
		},
		getTotalResults : function(criteria) {
			return $http.get('getTotalResults', {params: { criteria: criteria }
			}).success(function(data, status, headers, config) {
				return data;
			}).error(function(data, status, headers, config) {
				return data;
			});
		},
		retrievePerson : function(uri) {
			return $http.get('retrievePerson', {params: { uri: uri }
			}).success(function(data, status, headers, config) {
				return data;
			}).error(function(data, status, headers, config) {
				return data;
			});
		},
		updatePerson : function(person) {
			return $http.post('updatePerson', person).success(function(data, status, headers, config) {
				return data;
			}).error(function(data, status, headers, config) {
				return data;
			});
		},
		setQueryOptions : function() {
			return $http.post('setQueryOptions').success(function(data, status, headers, config) {
				return data;
			}).error(function(data, status, headers, config) {
				return data;
			});
		},
		clearQueryOptions : function() {
			return $http.post('clearQueryOptions').success(function(data, status, headers, config) {
				return data;
			}).error(function(data, status, headers, config) {
				return data;
			});
		},
		getCompanies : function() {
			return $http.get('getCompanies').success(function(data, status, headers, config) {
				return data;
			}).error(function(data, status, headers, config) {
				return data;
			});
		},
		getStates : function() {
			return $http.get('getStates').success(function(data, status, headers, config) {
				return data;
			}).error(function(data, status, headers, config) {
				return data;
			});
		}
	};
});

//debounce directive, to delay input
consumeApp.directive('ngDebounce', function ($timeout) {
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

consumeApp.controller('SearchCtrl', function($scope, searchService, $q, $log, $modal) {
	$scope.alerts = [];
	$scope.summaries = [];
	$scope.searchCriteria = '';
	$scope.companyFilter = '';
	$scope.stateFilter = '';
	
	$scope.companies = [];
	$scope.states = [];
	
	$scope.totalResults = 0;
	$scope.currentPage = 1;
	
	$scope.setQueryOptions = function() {
		searchService.setQueryOptions();
	};
	
	$scope.clearQueryOptions = function() {
		searchService.clearQueryOptions();
	};
	
	$scope.getFacetedResults = function() {
		searchService.getFacetedResults($scope.searchCriteria, 1);
	};
	
	$scope.getStates = function() {
		var promises = [];
		$scope.companies = [];
		promises.push(searchService.getStates());
		
		$q.all(promises).then(function success(value) {
			var statesList = value[0].data;
			for (var i = 0; i < statesList.length; i++) {
				$scope.states.push(statesList[i]);
			}
		});
	};
	
	$scope.getCompanies = function() {
		var promises = [];
		$scope.companies = [];
		promises.push(searchService.getCompanies());
		
		$q.all(promises).then(function success(value) {
			var companyList = value[0].data;
			for (var i = 0; i < companyList.length; i++) {
				$scope.companies.push(companyList[i]);
			}
		});
	};
	
	$scope.edit = function (uri) {
		var promises = [];
		
		promises.push(searchService.retrievePerson(uri));
		$q.all(promises).then(function success(value){
			var modalInstance = $modal.open({
				templateUrl: 'modalContent.html',
				controller: ModalInstanceCtrl,
				size: 'lg',
				backdrop: 'static',
				resolve: {
				    person: function() {
				    	return value[0].data;
				    },
				    // since we're updating the person, pass in the uri so if
				    // we rename them we dont create a new person
				    uri: function() {
				    	return uri;
				    }
				}
			});
			
			modalInstance.result.then(function (selectedItem) {
				$scope.selected = selectedItem;
			}, function () {
				//$log.info('Modal dismissed at: ' + new Date());
			});
		});
	};
	
	// remove the person from the db
	$scope.remove = function(uri, index) {
		var promises = [];

		// ajax call to the server here
		promises.push(searchService.deletePerson(uri));

		$q.all(promises).then(function success(value){
			$scope.alerts.push({msg: 'Successfully removed the person from the database', type: 'success'});
			$scope.pageChanged();
		}, function failure(err){
			$scope.alerts.push({msg: 'Unable to remove the person from the database', type: 'danger'});
		});
	};
	
	$scope.closeAlert = function(index) {
		$scope.alerts.splice(index, 1);
	};

	$scope.insertPeople = function() {
		$scope.alerts = [];
		var promises = [];

		// ajax call to the server here
		//promises.push(ingestService.insertPerson($scope.people));

		$q.all(promises).then(function success(value){
			$scope.alerts.push({msg: 'Successfully added all people into the database', type: 'success'});
		}, function failure(err){
			$scope.alerts.push({msg: 'Unable to insert one or more generated people', type: 'danger'});
		});
	};
	
	// handle the page change event
	$scope.pageChanged = function () {
		$scope.search($scope.currentPage);
	};
	
	$scope.search = function(page) {
		$scope.summaries = [];
		var promises = [];
		
		promises.push(searchService.getPeople(	$scope.searchCriteria,
												$scope.companyFilter,
												$scope.stateFilter,
												page));
		promises.push(searchService.getTotalResults($scope.searchCriteria));
		
		$q.all(promises).then(function success(value) {
			angular.forEach(value[0].data, function(v, k){
				//$log.info(v);
				$scope.summaries.push(v);
			});
			$scope.totalResults = value[1].data;
		});
	};
	
	// do the initial searh
	$scope.pageChanged();
	$scope.getCompanies();
	$scope.getStates();
});

var ModalInstanceCtrl = function ($scope, $modalInstance, searchService, $q, $log, person, uri) {
	// JSON representation of a person object
	$scope.states = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"];
	
	$scope.editPerson = person;
	$scope.editPerson.uri = uri;

	// the form step number
	$scope.step = 1;

	// scoping issues, define a form here and in the page define the <form> as <form name="form.something"/>
	$scope.form = {};
	
	$scope.save = function () {
		var promises = [];

		// ajax call to the server here
		$log.info($scope.editPerson);
		promises.push(searchService.updatePerson($scope.editPerson));

		$q.all(promises).then(function success(value){
			//$scope.alerts.push({msg: 'Successfully added all people into the database', type: 'success'});
			$modalInstance.close(null);
		}, function failure(err){
			//$scope.alerts.push({msg: 'Unable to insert one or more generated people', type: 'danger'});
			$modalInstance.close(null);
		});
	};

	$scope.cancel = function () {
		$modalInstance.dismiss('cancel');
	};
	
	$scope.setStep = function(newStep) {
//		$log.info($scope.form.editPerson.step1form.$valid);
		// need more logic for the form controls
		$scope.step = newStep;
	};
	
	$scope.previous = function() {
		$scope.step --;
	};
	
	$scope.next = function() {
		$scope.step ++;
	};
};