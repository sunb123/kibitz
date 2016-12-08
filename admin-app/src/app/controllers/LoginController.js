(function(){

  angular
       .module('app')
       .controller('LoginController', [ 'config',
          'navService', 'loginService', '$mdSidenav', '$mdBottomSheet', '$mdToast', '$log', '$q', '$state', '$mdToast', '$scope',
          '$sce', '$http', '$cookies', '$timeout',
          LoginController
       ]);

  function LoginController(config, navService, loginService, $mdSidenav, $mdBottomSheet, $mdToast, $log, $q, $state, $mdToast, $scope, $sce, $http, $cookies, $timeout) {
    var vm = this;

    if (!loginService.loggedIn()) {
        if (window.location.search.indexOf('auth_user=') != -1) {
            sessionStorage.setItem("username", window.location.search.substring(window.location.search.indexOf('=')+1))
        }

        if (window.location.search.indexOf('code=') != -1) {
            sessionStorage.setItem("code", window.location.search.substring(window.location.search.indexOf('=')+1))
        }

        if (!sessionStorage.getItem('code') && sessionStorage.getItem('username') &&
          !loginService.loggedIn()) { // logged into datahub but not app
          var params = {
              'response_type': 'code',
              'scope': 'profile',
              'client_id': 'sphQrMCcfdIjker5ghseFx7vRfV2bcwBfqJVRKAe',
              'redirect_uri': config.home_url,
          };
          var authorization_url = config.buildURL('/oauth2/authorize/', params);
          window.location.href = authorization_url;
          return
        }

        if (sessionStorage.getItem('code') && sessionStorage.getItem('username') &&
          !loginService.loggedIn()) { // send profile auth code to backend
          var code = sessionStorage.getItem("code")
          sessionStorage.removeItem('code')
          $http({
            url: config.server_url+'/profile-code/',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: 'POST',
            data: {
              'profile_code': code,
              'username': sessionStorage.getItem('username'),
            },
          }).then(function successCallback(response) {
              console.log(response)
              sessionStorage.removeItem('username')

              $cookies.put("username", response.data['username'])
              $cookies.put("sessionid", response.data['sessionid'])
              window.location.href = config.home_url // NOTE: why does $state.go fail to load abstract ctrl?
              // $timeout(function() {
              //   $state.go('home.table')
              //   $mdToast.show(
              //     $mdToast.simple()
              //       .textContent("Login Successful")
              //       .position('bottom right')
              //       .theme('success-toast')
              //       .hideDelay(6000)
              //   )
              // }, 0);
          }, function errorCallback(response) {
              console.log("failed", response)
          });
        }
    }

    vm.loginUrl = config.dh_login_url

    vm.login = function() {
      var url = config.server_url+'/auth/login/'

      $http({
        url: url,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: 'POST',
        data: {
          'username': vm.username,
          'password': vm.password,
        },
      }).then(function successCallback(response) {
          console.log(response)
          $cookies.put("username", response.data['username'])
          $cookies.put("sessionid", response.data['sessionid'])
          $cookies.put("authenticated", true)
          window.location.href = config.home_url // NOTE: why does $state.go fail to load abstract ctrl?
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