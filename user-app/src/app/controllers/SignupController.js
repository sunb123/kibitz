(function(){

  angular
       .module('app')
       .controller('SignupController', [
          'navService', '$mdSidenav', '$mdBottomSheet', '$log', '$q', '$state', '$mdToast', '$scope', '$sce', '$window', '$http', 'config',
          SignupController
       ]);

  function SignupController(navService, $mdSidenav, $mdBottomSheet, $log, $q, $state, $mdToast, $scope, $sce, $window, $http, config) {
    var vm = this;

    vm.signup = function() {
      var params = {
        'username': vm.username,
        // 'email': vm.email,
        'password': vm.password,
        'recsys_id': $scope.$parent.recsys_id,
      }
      //console.log(params)

      $http({
        url: config.server_url+'/end-user/',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: 'POST',
        data: params,
      }).then(function successCallback(response) {
          console.log(response)
          $mdToast.show(
            $mdToast.simple()
              .textContent("Signup Successful")
              .position('bottom right')
              .theme('success-toast')
              .hideDelay(3000)
          )
          $state.go('home.login')
      }, function errorCallback(response) {
          console.log(response)
          $mdToast.show(
            $mdToast.simple()
              .textContent("Signup Error: "+response.data['message'])
              .position('bottom right')
              .theme('error-toast')
              .hideDelay(6000)
          )
      });
    }
  }

})();