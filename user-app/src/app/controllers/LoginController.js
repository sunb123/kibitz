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

    $scope.$parent.loggedIn = false

    $http({
      method: 'GET',
      url: config.server_url+'/recsys/0/'+'?recsys_url='+'books',
    }).then(function(resp){
      vm.recsys = resp.data.rows[0]
      vm.recsys_id = vm.recsys.id
    }, function(resp){
      console.log(resp)
    })

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
          'recsys_id': vm.recsys_id,
        },
      }).then(function successCallback(response) {
          $cookies.put("myusername", response.data['username'])
          $cookies.put("mysessionid", response.data['sessionid'])
          window.location.href = config.app_home_url // NOTE: why does $state.go fail to load abstract ctrl?
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