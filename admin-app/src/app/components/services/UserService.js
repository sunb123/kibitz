(function(){
  'use strict';

  angular.module('app')
        .service('userService', [
        '$q', '$http',
      userService
  ]);

  function userService($q, $http){
    var protocol = "http://"
    var base_url = "localhost:8000/api/v1/"

    function buildURL(path, params) {
        var query = '';
        if (params !== undefined && Object.keys(params).length > 0) {
            query = '?' + $.param(params);
        }
        return protocol+ base_url + path + query;
    }

    var params = {
      'user' : sessionStorage.getItem("auth_user"),
    }





    return {
      loadAllItems : function() {
        return getAllRecsys()
      },
      getAllRecsys: getAllRecsys,
      getRecsys: getRecsys,
      updateRecsys: updateRecsys,
      createRecsys: createRecsys,

      getCSSFile: getCSSFile,
      updateCSSFile: updateCSSFile,

      getRepoList: getRepoList,
      getTableList: getTableList,
    };


  }
})()