(function(){
  angular
      .module('app')
      .controller('MainController', [
         'navService', 'loginService', '$mdSidenav', '$mdBottomSheet', '$log', '$q', '$state', '$mdToast', '$scope', '$timeout', '$http', '$cookies',
         'config',
         MainController
      ])
      .directive('ngEnter', function() {
       return function(scope, element, attrs) {
           element.bind("keydown keypress", function(event) {
               if(event.which === 13) {
                 scope.$eval(function(){
                         var autoChild = document.getElementById('searchbox').firstElementChild;
                         var el = angular.element(autoChild);
                         el.scope().$mdAutocompleteCtrl.hidden = true;
                         scope.$eval(attrs.ngEnter);
                 });
                 event.preventDefault();
                }
            });
        };
      });

  function MainController(navService, loginService, $mdSidenav, $mdBottomSheet, $log, $q, $state, $mdToast, $scope, $timeout, $http, $cookies, config) {
    var vm = this;

    vm.recsys_url = window.location.href.split(config.app_home_url+'/')[1]
    console.log(vm.recsys_url)
    vm.recsys_url = 'books' // TODO: change to get url from browser

    $scope.recsysDeferred = $q.defer();

    $http({
      method: 'GET',
      url: config.server_url+'/recsys-params/'+'?recsys_url='+vm.recsys_url,
    }).then(function(resp){
      console.log(resp)
      vm.recsys = resp.data
      vm.recsys_id = vm.recsys.id
      $scope.recsys_id = vm.recsys_id
      vm.recsysTitle = vm.recsys.name

      $scope.template = JSON.parse(vm.recsys.template)
      console.log($scope.template)

      $scope.recsysDeferred.resolve(vm.recsys)

    }, function(resp){
      console.log(resp)
    })

    vm.username = function() {
      return $cookies.get('k_username')
    }

    vm.isGridView = true
    vm.home_location = window.location.href;
    vm.searchText = "";

    $scope.loggedIn = loginService.loggedIn;
    $scope.tabNumber = 0;
    $scope.showSearchProgress = false;

    var displayingSearched = false;

    $scope.addTabs = function() {
      if ($state.current.name == 'home.login' || $state.current.name == 'home.signup' || displayingSearched) {
        return false
      } else {
        return true
      }
    }

    $scope.itemSearch = function () { // get items
      console.log("item search")

      if (vm.searchText == "") {
        displayingSearched = false
      } else {
        displayingSearched = true
      }

      $scope.showSearchProgress = true;
      $timeout(function() {
        $scope.$digest()
      },0)

      $timeout(function() {
        $scope.$broadcast('itemSearch', vm.searchText)
      },20)

      if (sessionStorage.getItem(vm.searchText) == null) {
        var count = parseInt(sessionStorage.getItem('previousSearchCount'))
        if (count != NaN && count < 50) {
          sessionStorage.setItem('previousSearchCount',count+1)
          count += 1
          sessionStorage.setItem(count, vm.searchText)
          sessionStorage.setItem(vm.searchText, true)
        } else {
          sessionStorage.setItem('previousSearchCount',0)
          sessionStorage.removeItem(sessionStorage.getItem(0))
          sessionStorage.setItem(0, vm.searchText)
          sessionStorage.setItem(vm.searchText, true)
        }
      }

    }

    vm.querySearch = function(searchString) { // get previous search queries
      if (searchString !== '' && sessionStorage.getItem('previousSearchCount') !== 0) {

        var previousSearches = Object.keys(sessionStorage)
          .filter(function(item) { return parseInt(item) <= 10 && parseInt(item) >= 0 && item != 'previousSearchCount'; })
          .sort(function (a,b) { return a - b; })
          .map(function(item) {
            return sessionStorage.getItem(item)
          })

        var searches = previousSearches.map(function(item) {
          return {value: item, display: item}
        })

        return searches.filter(createFilterFor(searchString)).slice(0,10)

      } else {
        return []
      }

    }

    function createFilterFor(query) {
      var lowercaseQuery = angular.lowercase(query);

      return function filterFn(state) {
        return (state.value.indexOf(lowercaseQuery) === 0);
      };
    }

    $scope.tabSwitch = function(tabIndex) {
      console.log($state.current.name)
      $scope.tabNumber = tabIndex
      $scope.$broadcast('tabSwitch', tabIndex)
      if ($scope.tabNumber != 0) {
        displayingSearched = false
      }
    }


    // drop down to filter on different categories
    // $scope.changeSearchType = function(type) {
    //   vm.searchType = type
    //   $('#search-type').text(type)
    // }
    // $scope.item_types = ['Title', 'Author', 'Genre', 'Period']

    vm.logout = function() {
      $http({
        url: config.server_url + '/auth/logout/',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRFToken': $cookies.get('csrftoken'),
        },
        method: 'POST',
        data: {
          'username': $cookies.get('k_username'),
        },
      }).then(function successCallback(response) {
        console.log(response)
        if (response.data != 'error') {
          $state.go('home.login');
          $cookies.remove('k_username')
          $cookies.remove('csrftoken')
        }
      }, function errorCallback(response) {
        console.log(response)
      });
    }

    vm.amazon_ratings = function() {
      // TODO:
      // popup for amazon ratings, run script
      // get data output
      // create user ratings for each ammazon item/rating
      //
    }


  }

})();
