var ingestApp = angular.module('ingestApp', ['ui.bootstrap'])
	.config(function($locationProvider) {
		// use the HTML5 History API
		$locationProvider.html5Mode(true);
	});

//define our service for the AJAX call
ingestApp.factory('ingestService', function($http) {
	return {
		insertPerson : function(people) {
			return $http.post('insertPerson', people).success(function(data, status, headers, config) {
				return data;
			}).error(function(data, status, headers, config) {
				return data;
			});
		}
	};
});

ingestApp.factory('searchService', function($http) {
	return {
		searchPeople : function(criteria, page) {
			return $http.get('searchPeople', {params: { criteria: criteria, page:page }
			}).success(function(data, status, headers, config) {
				return data;
			}).error(function(data, status, headers, config) {
				return data;
			});
		}
	};
});

ingestApp.controller('NameListCtrl', function($scope, ingestService, searchService, $q, $log, $modal) {
	$scope.people = [];
	$scope.alerts = [];
	
	$scope.open = function (size) {
		var modalInstance = $modal.open({
			templateUrl: 'modalContent.html',
			controller: ModalInstanceCtrl,
			size: size,
			backdrop: 'static',
			resolve: {
				edit: function() {
			        return false;
			    },
			    person: null
			}
		});
		
		modalInstance.result.then(function (selectedItem) {
			$scope.selected = selectedItem;
		}, function () {
			//$log.info('Modal dismissed at: ' + new Date());
		});
	};
	
	$scope.edit = function (index) {
		var modalInstance = $modal.open({
			templateUrl: 'modalContent.html',
			controller: ModalInstanceCtrl,
			size: 'lg',
			backdrop: 'static',
			resolve: {
				edit: function() {
			        return true;
			    },
			    person: function() {
			    	return $scope.people[index];
			    }
			}
		});
		
		modalInstance.result.then(function (selectedItem) {
			$scope.selected = selectedItem;
		}, function () {
			//$log.info('Modal dismissed at: ' + new Date());
		});
	};
	
	// remove from the people list
	$scope.remove = function(index) {
		$scope.people.splice(index, 1);
	};
	
	$scope.closeAlert = function(index) {
		$scope.alerts.splice(index, 1);
	};

	// generate MAX_PEOPLE or 'number' fake people
	$scope.generatePeople = function(number) {
		//searchService.searchPeople('', 1);	//TODO - this is for searchin'
		$scope.people = [];

		if (!number) {
			number = 1;
		}

		for (var i = 0; i < number; i++) {
			var person = Faker.Helpers.createCard();
			$scope.people.push(person);
			//$log.info(person);
		}
	};

	$scope.clearPeople = function() {
		$scope.people = null;
		$scope.alerts = [];
	};

	$scope.insertPeople = function() {
		$scope.alerts = [];
		var promises = [];

		// ajax call to the server here
		promises.push(ingestService.insertPerson($scope.people));

		$q.all(promises).then(function success(value){
			$scope.alerts.push({msg: 'Successfully added all people into the database', type: 'success'});
		}, function failure(err){
			$scope.alerts.push({msg: 'Unable to insert one or more generated people', type: 'danger'});
		});
	};
});

var ModalInstanceCtrl = function ($scope, $modalInstance, $log, edit, person) {
	// JSON representation of a person object
	$scope.states = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"];
	
	if (edit) {
		$scope.editPerson = person;
	} else {
		$scope.editPerson = {'name'		: '',
							'email'		: '',
							'phone'		: '',
							'username'	: '',
							'website'	: '',
							'company'	: { 'bs'			: '',
											'catchPhrase'	: '',
											'companyName'	: ''},
							'address'	: { 'city'			: '',
											'streetA'		: '',
											'streeetB'		: '',
											'streetC'		: '',
											'streetD'		: '',
											'state'			: '',
											'zipcode'		: '',
											'geo'			: { 'lat' : '',
																'lng' : ''}}
							};
	}
	
	// the form step number
	$scope.step = 1;

	// scoping issues, define a form here and in the page define the <form> as <form name="form.something"/>
	$scope.form = {};
	
	// set the modal header appropriately
	$scope.edit = edit;
	
	$scope.ok = function () {
		$modalInstance.close(null);
		$log.info($scope.editPerson.name);
	};

	$scope.cancel = function () {
		$modalInstance.dismiss('cancel');
	};
	
	$scope.setStep = function(newStep) {
		$log.info($scope.form.editPerson.step1form.$valid);
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