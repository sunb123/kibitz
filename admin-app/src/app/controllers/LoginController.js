(function(){

  angular
       .module('app')
       .controller('LoginController', [
          'navService', 'loginService', '$mdSidenav', '$mdBottomSheet', '$mdToast', '$log', '$q', '$state', '$mdToast', '$scope',
          '$sce', '$http', '$cookies',
          LoginController
       ]);

  function LoginController(navService, loginService, $mdSidenav, $mdBottomSheet, $mdToast, $log, $q, $state, $mdToast, $scope, $sce, $http, $cookies) {
    var vm = this;

    // if (!loginService.loggedIn()) {
    //   $state.go('home.signup');
    //   console.log('go to signup')
    //   return
    // }

    var home_location = 'http://localhost:3000'

    function buildURL(path, params) {
        var transfer_protocol = 'https://';
        var base_url = transfer_protocol + 'datahub.csail.mit.edu';
        var query = '';
        if (params !== undefined && Object.keys(params).length > 0) {
            query = '?' + $.param(params);
        }
        return base_url + path + query;
    }

    if (!sessionStorage.getItem('code') && sessionStorage.getItem('username') &&
      !loginService.loggedIn()) { // logged into datahub but not app
      var home_location = 'http://localhost:3000'
      var params = {
          'response_type': 'code',
          'scope': 'profile',
          'client_id': 'sphQrMCcfdIjker5ghseFx7vRfV2bcwBfqJVRKAe',
          'redirect_uri': home_location,
      };
      var authorization_url = buildURL('/oauth2/authorize/', params);
      window.location.href = authorization_url;
      return
    }

    if (sessionStorage.getItem('code') && sessionStorage.getItem('username') &&
      !loginService.loggedIn()) { // send profile auth code to backend
      $http({
        url: 'http://localhost:8000/api/v1/profile-code/',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: 'POST',
        data: {
          'profile_code': sessionStorage.getItem("code"),
          'username': sessionStorage.getItem('username'),
        },
      }).then(function successCallback(response) {
          console.log(response)
          sessionStorage.removeItem('code')
          sessionStorage.removeItem('username')

          $cookies.put("username", response.data['username'])
          $cookies.put("sessionid", response.data['sessionid'])
          window.location.href = home_location

          $mdToast.show(
            $mdToast.simple()
              .textContent("Login Successful")
              .position('bottom right')
              .theme('success-toast')
              .hideDelay(6000)
          )
          // $http({
          //   url: 'http://localhost:8000/api/v1/auth/login/',
          //   headers: {
          //       'Accept': 'application/json',
          //       'Content-Type': 'application/json'
          //   },
          //   method: 'POST',
          //   data: {
          //     'username': vm.username,
          //     'password': vm.password,
          //     //'sessionid': getCookie('sessionid'),
          //   },
          // }).then(function successCallback(response) {
          //     console.log(response)
          //     $cookies.put("username", response.data['username'])
          //     $cookies.put("sessionid", response.data['sessionid'])
          //     $state.go('home.table')
          // }, function errorCallback(response) {
          //     console.log(response)
          //     $mdToast.show(
          //       $mdToast.simple()
          //         .textContent("Login Error: "+response.data['message'])
          //         .position('bottom right')
          //         .theme('error-toast')
          //         .hideDelay(6000)
          //     )
          // });

      }, function errorCallback(response) {
          console.log("failed", response)
      });
    }





    var admin_home_location = 'http://localhost:3000'
    vm.loginUrl = 'https://datahub.csail.mit.edu/account/login?redirect_url='+admin_home_location

    $scope.currentProjectUrl = $sce.trustAsResourceUrl('https://datahub.csail.mit.edu/account/login')
    $scope.checkLoggedIn = function(frame) {
      console.log(frame.src)
    }

    vm.login = function() {
      var url = 'http://localhost:8000/api/v1/auth/login/'

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
          //'sessionid': getCookie('sessionid'),
        },
      }).then(function successCallback(response) {
          console.log(response)
          $cookies.put("username", response.data['username'])
          $cookies.put("sessionid", response.data['sessionid'])
          $cookies.put("authenticated", true)
          $state.go('home.table')
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