(function(){

  angular
       .module('app')
       .controller('MainController', [ 'config',
          'navService', 'loginService', '$mdSidenav', '$mdBottomSheet', '$log', '$q', '$state', '$mdToast',
          '$scope', '$state', 'ngToast', '$http', '$cookies',
          MainController
       ]);

  function MainController(config, navService, loginService, $mdSidenav, $mdBottomSheet, $log, $q, $state, $mdToast, $scope, $state,
    ngToast, $http, $cookies) {
    var vm = this;

    if (!loginService.loggedIn()) {
      $state.go('home.login')
      return
    } else {
      $scope.loggedIn = true;
    }

    vm.kibitz_home_location = config.home_url

    vm.username = $cookies.get('username')

    vm.menuItems = [];
    vm.selectItem = selectItem;
    vm.toggleItemsList = toggleItemsList;
    vm.title = $state.current.data.title;
    vm.showSimpleToast = showSimpleToast;
    vm.toggleRightSidebar = toggleRightSidebar;

    navService
      .loadAllItems()
      .then(function(menuItems) {
        vm.menuItems = [].concat(menuItems);
      });

    vm.logout = function() {
      $scope.loggedIn = false;
      $state.go('home.login');

      $http({
        url: config.server_url+'/auth/logout/',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: 'POST',
        data: {
          'username': $cookies.get('username'),
          'sessionid': $cookies.get('sessionid'),
        },
      }).then(function successCallback(response) {
        console.log(response)
        if (response.data != 'error') {
          $cookies.remove('username')
          $cookies.remove('sessionid')
          $cookies.remove('authenticated')
        }
      }, function errorCallback(response) {

      });

    }

    function toggleRightSidebar() {
        $mdSidenav('right').toggle();
    }

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
