(function(){
  'use strict';

  angular.module('app')
        .service('tableService', [
        '$q', '$http', '$cookies',
      tableService
  ]);

  function tableService($q, $http, $cookies){
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
      'username' : $cookies.get('username'),
      'sessionid': $cookies.get('sessionid'),
    }

    var getCSSFile = function(recsys_id) {
        var deferred = $q.defer();

        $http({
          url: buildURL('css/'+recsys_id+'/', params),
          method: 'GET',
        }).then(function successCallback(response) {
            console.log(response)
            deferred.resolve(response.data)
        }, function errorCallback(response) {
            console.log(response)
        });

        return deferred.promise
    }

    var updateCSSFile = function(recsys_id, cssText) {
        var deferred = $q.defer();
        var data = $.extend({cssText:cssText}, params)

        $http({
          url: buildURL('css/'+recsys_id+'/'),
          method: 'PUT',
          data: data,
        }).then(function successCallback(response) {
            console.log(response)
            deferred.resolve(response.data)
        }, function errorCallback(response) {
            console.log(response)
        });

        return deferred.promise
    }

    var getAllRecsys = function() {
        var deferred = $q.defer();

        $http({
          url: buildURL('recsys/'),
          method: 'GET',
          data: params,
        }).then(function successCallback(response) {
            console.log(response)
            if (response.data['error_type'] != null) {
              console.log(data['error_type'], data['detail'])
            }
            deferred.resolve(response.data['rows'])
        }, function errorCallback(response) {
            console.log(response)
        });

        return deferred.promise
    }

    var getRecsys = function(recsys_id) {
        var deferred = $q.defer();

        $http({
          url: buildURL('recsys/'+recsys_id+'/'),
          method: 'GET',
          data: params,
        }).then(function successCallback(response) {
            console.log(response.data.rows[0])
            deferred.resolve(response.data.rows[0])
        }, function errorCallback(response) {
            console.log(response)
        });

        return deferred.promise
    }

    var updateRecsys = function(data, recsys_id) {
        var deferred = $q.defer();
        // $.extend(params, data)
        params['params'] = data

        $http({
          url: buildURL('recsys/'+recsys_id+'/'),
          method: 'PUT',
          data: params,
        }).then(function successCallback(response) {
            console.log(response)
            deferred.resolve(response.data)
        }, function errorCallback(response) {
            console.log(response)
        });

        return deferred.promise
    }

    var createRecsys = function(data) {
        var deferred = $q.defer();

        var params = {
          'username': $cookies.get('username'),
          'sessionid': $cookies.get('sessionid'),
          'params': data,
        }
        // $.extend(params, data)

        $http({
          url: buildURL('recsys/'),
          method: 'POST',
          data: params,
        }).then(function successCallback(response) {
            console.log(response)
            deferred.resolve(response.data)
        }, function errorCallback(response) {
            console.log(response)
        });

        return deferred.promise
    }

    var deleteRecsys = function(recsys_id) {
        var deferred = $q.defer();

        $http({
          url: buildURL('recsys/'+recsys_id+'/'),
          method: 'DELETE',
          data: params,
        }).then(function successCallback(response) {
            console.log(response)
            deferred.resolve(response.data)
        }, function errorCallback(response) {
            console.log(response)
        });

        return deferred.promise
    }

    var getRepoList = function(base_repo) {
        var deferred = $q.defer();

        var params = {
          'username': $cookies.get('username'),
          'sessionid': $cookies.get('sessionid'),
          'base_repo': base_repo, // account user name
        }
        $http({
          url: buildURL('repo-table/'),
          method: 'GET',
        }).then(function successCallback(response) {
            console.log(response)
            deferred.resolve(response.data)
        }, function errorCallback(response) {
            console.log(response)
        });

        return deferred.promise
    }

    var getTableList = function(repo_base, repo) {
        var deferred = $q.defer();

        var params = {
          // 'username': $cookies.get('username'),
          // 'sessionid': $cookies.get('sessionid'),
          // 'repo_base': repo_base,
          'repo': repo,
        }
        $http({
          url: buildURL('repo-table/', params),
          method: 'GET',
        }).then(function successCallback(response) {
            console.log(response)
            deferred.resolve(response.data)
        }, function errorCallback(response) {
            console.log(response)
        });

        return deferred.promise
    }

    var getTableColumns = function(repo_base, repo, table) {
        var deferred = $q.defer();

        var params = {
          // 'username': $cookies.get('username'),
          // 'sessionid': $cookies.get('sessionid'),
          // 'repo_base': repo_base,
          'repo': repo,
          'table': table,
        }
        console.log( buildURL('repo-table/', params) )

        $http({
          url: buildURL('repo-table/', params),
          method: 'GET',
        }).then(function successCallback(response) {
            console.log(response)
            deferred.resolve(response.data)
        }, function errorCallback(response) {
            console.log(response)
        });

        return deferred.promise
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
      getTableColumns: getTableColumns,

    };
  }
})();
