(function(){

  angular
       .module('app')
       .controller('LoginController', [
          'navService', 'loginService', '$mdSidenav', '$mdBottomSheet', '$mdToast', '$log', '$q', '$state', '$mdToast', '$scope',
          '$sce', '$http', '$cookies', '$timeout', 'config',
          LoginController
       ]);

  function LoginController(navService, loginService, $mdSidenav, $mdBottomSheet, $mdToast, $log, $q, $state, $mdToast, $scope, $sce, $http, $cookies, $timeout, config) {
    var vm = this;

    vm.login = function() {

      $http({
        url: config.server_url+'/auth/login/',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: 'POST',
        data: {
          'username': vm.username,
          'password': vm.password,
          'recsys_id': $scope.$parent.recsys_id,
        },
      }).then(function successCallback(response) {
          $cookies.put("k_username", response.data['username'])
          $state.go('home.items');
      }, function errorCallback(response) {
          console.log(response)
          $mdToast.show(
            $mdToast.simple()
              .textContent("Login Error: "+response.data['message'])
              .position('bottom right')
              .theme('error-toast')
              .hideDelay(6000)
          )
      });
    }
  }

})();