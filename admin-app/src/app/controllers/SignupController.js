(function(){

  angular
       .module('app')
       .controller('SignupController', [
          'navService', '$mdSidenav', '$mdBottomSheet', '$log', '$q', '$state', '$mdToast', '$scope', '$sce', '$window', 'ngToast', '$http',
          SignupController
       ]);

  function SignupController(navService, $mdSidenav, $mdBottomSheet, $log, $q, $state, $mdToast, $scope, $sce, $window, ngToast, $http) {
    var vm = this;

    $scope.currentProjectUrl = $sce.trustAsResourceUrl('https://datahub.csail.mit.edu/account/register')

    var admin_home_location = 'http://localhost:3000'
    vm.signupUrl = 'https://datahub.csail.mit.edu/account/register?redirect_url=' + admin_home_location

    $scope.checkLoggedIn = function(frame) {
      console.log(frame.src)
    }

    vm.signup = function() {


      var params = {
        'username': vm.username,
        // 'email': vm.email,
        'password': vm.password,
      }

      $http({
        url: 'http://localhost:8000/api/v1/admin-user/',
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