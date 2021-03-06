(function(){

  angular
       .module('app')
       .controller('SignupController', [ 'config',
          'navService', '$mdSidenav', '$mdBottomSheet', '$log', '$q', '$state', '$mdToast', '$scope', '$sce', '$window', 'ngToast', '$http', '$timeout', '$cookies', 
          SignupController
       ]);

  function SignupController(config, navService, $mdSidenav, $mdBottomSheet, $log, $q, $state, $mdToast, $scope, $sce, $window, ngToast, $http, $timeout, $cookies) {
    var vm = this;

    vm.datahubLogin = function() {
        var params = {
            'response_type': 'code',
            'scope': 'profile',
            'client_id': config.client_id,
            'redirect_uri': config.home_url,
        };
        var authorization_url = config.buildURL('/oauth2/authorize/', params)
        var login_url = config.dh_login_url
        var server_url = config.server_url
        var home_url = config.home_url

        var popup = window.open(login_url,'newwindow', myconfig='height=600,width=600,' +
        'toolbar=no, menubar=no, scrollbars=no, resizable=no,' + 'location=no, directories=no, status=no')

        var fnCheckLocation = function(){
            if (popup.location === null || popup.location == undefined || popup.location.href == null || popup.location.href == undefined) {
                clearInterval(interval);
            }

            if (popup.location.href != "about:blank" && popup.location.href.indexOf("auth_user=") != -1) {
              console.log("got auth name")
              sessionStorage.setItem("dh_username", popup.location.search.substring(popup.location.search.indexOf('auth_user=')+10))
              popup.location.href = authorization_url;
            } else if (popup.location.href != "about:blank" && popup.location.href.indexOf("code=") != -1) {
              var code = popup.location.search.substring(popup.location.search.indexOf('code=')+5)
              var username = sessionStorage.getItem('dh_username')
              $http({
                url: server_url+'/profile-code/',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                data: {
                  'profile_code': code,
                  'username': username,
                },
              }).then(function successCallback(response) {
                  console.log(response)
                  sessionStorage.removeItem('dh_username')
                  $cookies.put("k_username", response.data['username'])
                  window.location.href = home_url // NOTE: why does $state.go fail to load abstract ctrl?

                  popup.close();
                  clearInterval(interval);
                  $scope.$parent.loadRepos()

              }, function errorCallback(response) {
                  console.log("failed", response)
              });
            }
        }

        var interval = setInterval(fnCheckLocation, 500);
    }

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
