(function(){
  'use strict';

  angular.module('app')
        .service('tableService', [
        '$q', '$http', '$cookies', 'config',
      tableService
  ]);

  function tableService($q, $http, $cookies, config){
    function buildURL(path, params) {
        var base_url = config.server_url;
        var query = '';
        if (params !== undefined && Object.keys(params).length > 0) {
            query = '?' + $.param(params);
        }
        return base_url + path + query;
    }

    var params = {
      // TODO: change
      'username' : $cookies.get('username'),
      'sessionid': $cookies.get('sessionid'),
    }

    var getCSSFile = function(recsys_id) {
        var deferred = $q.defer();

        $http({
          url: buildURL('/css/'+recsys_id+'/', params),
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
          url: buildURL('/css/'+recsys_id+'/'),
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
          url: buildURL('/recsys/'),
          method: 'GET',
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
          url: buildURL('/recsys/'+recsys_id+'/'),
          method: 'GET',
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
          url: buildURL('/recsys/'+recsys_id+'/'),
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
          url: buildURL('/recsys/'),
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
          url: buildURL('/recsys/'+recsys_id+'/'),
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

        $http({
          url: buildURL('/repo-table/'),
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
          'repo': repo,
        }
        $http({
          url: buildURL('/repo-table/', params),
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
          'repo': repo,
          'table': table,
        }

        $http({
          url: buildURL('/repo-table/', params),
          method: 'GET',
        }).then(function successCallback(response) {
            console.log(response)
            deferred.resolve(response.data)
        }, function errorCallback(response) {
            console.log(response)
        });

        return deferred.promise
    }

    function repoListToOptions(repoList) {
        var options = []
        var option;
        for (var i in repoList) {
            option = {'name':repoList[i].repo_name, 'value':repoList[i].repo_name}
            options.push(option)
        }
        return options
    }

    function tableListToOptions(tableList) {
        var options = [];
        var option;
        for (var i in tableList) {
            option = {'name':tableList[i].table_name, 'value':tableList[i].table_name}
            options.push(option)
        }
        return options
    }

    function columnListToOptions(columnList) {
        var options = [];
        var option;
        for (var i in columnList) {
            option = {'name':columnList[i].column_name, 'value':columnList[i].column_name}
            options.push(option)
        }
        return options
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

      repoListToOptions: repoListToOptions,
      tableListToOptions: tableListToOptions,
      columnListToOptions: columnListToOptions,

    };
  }
})();