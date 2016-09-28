(function(){
  'use strict';

  angular.module('app')
        .service('loginService', [
        '$q', '$http', '$cookies',
      loginService
  ]);

  function loginService($q, $http, $cookies){

    return {
      loggedIn : function() {
        if ($cookies.get('username') && $cookies.get('sessionid')) {
            return true
        } else {
            return false
        }
      },

    };

  }

})();