(function(){
  'use strict';

  angular.module('app')
        .service('varService', [
        '$q', '$http', '$cookies',
      varService
  ]);

  function varService($q, $http, $cookies){

    return {
      server_location: 'http://localhost:8000', // http://128.52.184.30/

    };

  }

})();