(function(){

  angular
       .module('app')
       .controller('SignupController', [ 'config',
          'navService', '$mdSidenav', '$mdBottomSheet', '$log', '$q', '$state', '$mdToast', '$scope', '$sce', '$window', 'ngToast', '$http',
          SignupController
       ]);

  function SignupController(config, navService, $mdSidenav, $mdBottomSheet, $log, $q, $state, $mdToast, $scope, $sce, $window, ngToast, $http) {
    var vm = this;

    vm.signupUrl = config.dh_signup_url

    vm.signup = function() {
      var params = {
        'username': vm.username,
        'email': vm.email,
        'password': vm.password,
      }

      $http({
        url: config.server_url+'/admin-user/',
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
      }, function errorCallback(response) {
          console.log(response)
          console.log('error details:', response.data['detail'])
          // $scope.form.username.$error.serverMessage = message
          // $scope.form.email.$error.serverMessage = message
          // $scope.form.password.$error.serverMessage = message
          $mdToast.show(
            $mdToast.simple()
              .textContent("Signup Error")
              .position('bottom right')
              .theme('error-toast')
              .hideDelay(6000)
          )
      });
    }
  }

})();