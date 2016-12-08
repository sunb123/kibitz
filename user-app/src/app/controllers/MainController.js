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

    vm.recsys_name = window.location.href.split(config.app_home_url+'/')[1]
    console.log(vm.recsys_name)

    // TODO: get recsys row: GET item display layout

    //console.log($cookies.getAll())

    $http({
      method: 'GET',
      url: config.server_url+'/recsys/0/'+'?recsys_url='+'books',
    }).then(function(resp){
      vm.recsys = resp.data.rows[0]
      vm.recsys_id = vm.recsys.id
      vm.recsysTitle = vm.recsys.name
      vm.maxRatingValue = vm.recsys.max_rating

      if (!loginService.loggedIn()) {
        $state.go('home.login')
        $scope.loggedIn = false;
        return
      } else {
        $scope.loggedIn = true;
      }

      $http({
        method: 'GET',
        url: config.server_url+'/item/'+'?recsys_id='+vm.recsys_id,
      }).then(function(resp){
        vm.wholeTable
      }, function(resp){
        console.log(resp)
      })

    }, function(resp){
      console.log(resp)
    })


    vm.username = $cookies.get('myusername') // TODO: get current username



    vm.isGridView = true
    vm.home_location = window.location.href;
    $scope.loggedIn = true;
    $scope.tabNumber = 0;
    vm.searchText = "";

    $scope.showSearchProgress = false;

    $scope.addTabs = function() {
      if ($state.current.name == 'home.login' || $state.current.name == 'home.signup') {
        return false
      } else {
        return true
      }
    }

    $scope.itemSearch = function () {

      console.log("item search")

      $scope.showSearchProgress = true;
      $timeout(function() { // updates ng-repeat for items list
        // anything you want can go here and will safely be run on the next digest.
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
      // $timeout(function() { // updates ng-repeat for items list
      //   // anything you want can go here and will safely be run on the next digest.
      //   $scope.$digest()
      // },10000)

    }

    $scope.tabSwitch = function(tabIndex) {
      console.log($state.current.name)
      $scope.tabNumber = tabIndex
      $scope.$broadcast('tabSwitch', tabIndex)
    }

    vm.querySearch = function(searchString) {
      if (searchString !== '' && sessionStorage.getItem('previousSearchCount') !== 0) {
        // console.log(Object.keys(sessionStorage).filter(function(item) { return parseInt(item) <= 10 && parseInt(item) >= 0 && item != 'previousSearchCount'; }))


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


    // TODO: search over item title, description text. search all items.

    // TODO: popular, sort by highest and most rated items
    // TODO: list of my rated items

    vm.logout = function() {
      $scope.loggedIn = false;
      $state.go('home.login');

      $http({
        url: config.server_url + '/auth/logout/',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: 'POST',
        data: {
          'username': $cookies.get('myusername'),
          'sessionid': $cookies.get('mysessionid'),
        },
      }).then(function successCallback(response) {
        console.log(response)
        if (response.data != 'error') {
          $cookies.remove('myusername')
          $cookies.remove('mysessionid')
        }
      }, function errorCallback(response) {

      });

    }

    $scope.changeSearchType = function(type) {
      vm.searchType = type
      $('#search-type').text(type)
    }

    $scope.item_types = ['Title', 'Author', 'Genre', 'Period']
  }

})();