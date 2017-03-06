(function(){

  angular
       .module('app')
       .controller('MainController', [ 'config',
          'navService', 'loginService', '$mdSidenav', '$mdBottomSheet', '$log', '$q', '$state', '$mdToast',
          '$scope', '$state', 'ngToast', '$http', '$cookies', 'tableService', '$timeout',
          MainController
       ]);

  function MainController(config, navService, loginService, $mdSidenav, $mdBottomSheet, $log, $q, $state, $mdToast, $scope, $state,
    ngToast, $http, $cookies, tableService, $timeout) {
    var vm = this;
    console.log("called main")

    $scope.loggedIn = loginService.loggedIn

    if (!loginService.loggedIn()) {
      $state.go('home.login')
      console.log("not logged in")
      return
    } else {
      console.log("logged in")
    }

    vm.kibitz_home_location = config.home_url

    vm.username = $cookies.get('k_username')

    vm.menuItems = [];
    vm.selectItem = selectItem;
    vm.toggleItemsList = toggleItemsList;
    vm.title = $state.current.data.title;
    vm.showSimpleToast = showSimpleToast;
    // vm.toggleRightSidebar = toggleRightSidebar;

    $scope.reposDeferred = $q.defer();
    $scope.reposPromise =  $scope.reposDeferred.promise;
    $scope.itemDeferred = $q.defer()

    navService
      .loadAllItems()
      .then(function(menuItems) {
        vm.menuItems = [].concat(menuItems);
      });

    $scope.loadRecsysList = function() {
      tableService.loadAllItems()
      .then(function(tableData) {
        $scope.recsysList = [].concat(tableData)
        if ($scope.itemDeferred != null) {
          $scope.itemDeferred.resolve('resolved')
        }
      });
    }

    $scope.loadRepos = function() {
        tableService.getRepoList($cookies.get('k_username')).then(function(result) {
            $scope.repos = tableService.repoListToOptions(result.repos)
            if ($scope.repos != [] && $scope.repos != null) {
              $cookies.put('authenticated', true)
            }
            if ($scope.reposDeferred != null) {
              $scope.reposDeferred.resolve('resolved')
            }
        })
    }

    $scope.loadRecsysList()
    $timeout(function(){
        $scope.loadRepos()
    },1000)

    vm.logout = function() {
      $state.go('home.login');

      $http({
        url: config.server_url+'/auth/logout/',
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
          $cookies.remove('authenticated')
          $cookies.remove('k_username')
          $cookies.remove('csrftoken')
        }
      }, function errorCallback(response) {

      });

    }

    // function toggleRightSidebar() {
    //     $mdSidenav('right').toggle();
    // }

    function toggleItemsList() {
      var pending = $mdBottomSheet.hide() || $q.when(true);

      pending.then(function(){
        $mdSidenav('left').toggle();
      });
    }

    function selectItem (item) {
      vm.title = item.name;
      vm.toggleItemsList();
      vm.showSimpleToast(vm.title);
    }

    function showSimpleToast(title) {
      $mdToast.show(
        $mdToast.simple()
          .content(title)
          .hideDelay(2000)
          .position('bottom right')
      );
    }

  }

})();
