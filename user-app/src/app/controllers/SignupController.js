(function(){

  angular
       .module('app')
       .controller('SignupController', [
          'navService', '$mdSidenav', '$mdBottomSheet', '$log', '$q', '$state', '$mdToast', '$scope', '$sce', '$window', '$http', 'config',
          SignupController
       ]);

  function SignupController(navService, $mdSidenav, $mdBottomSheet, $log, $q, $state, $mdToast, $scope, $sce, $window, $http, config) {
    var vm = this;

    $http({
      method: 'GET',
      url: config.server_url+'/recsys/0/'+'?recsys_url='+'books',
    }).then(function(resp){
      vm.recsys = resp.data.rows[0]
      vm.recsys_id = vm.recsys.id
    }, function(resp){
      console.log(resp)
    })

    vm.signup = function() {


      var params = {
        'username': vm.username,
        // 'email': vm.email,
        'password': vm.password,
        'recsys_id': vm.recsys_id,
      }

      console.log(params)

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