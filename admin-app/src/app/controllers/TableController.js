(function(){

  angular
    .module('app')
    .controller('TableController', [
      'tableService', 'loginService', '$mdSidenav', '$mdToast', '$scope', '$http', '$state', 'Upload', '$cookies',
      TableController
    ])
    .directive('file', function () {
      return {
          scope: {
              file: '='
          },
          link: function (scope, el, attrs) {
              el.bind('change', function (event) {
                  var file = event.target.files[0];
                  scope.file = file ? file : undefined;
                  scope.$apply();
              });
          }
      };
});


  function TableController(tableService, loginService, $mdSidenav, $mdToast, $scope, $http, $state, Upload, $cookies) {
    var vm = this;

    if (!loginService.loggedIn()) {
      $state.go('home.login');
      console.log('go to login')
      return
    } else {
      $scope.$parent.loggedIn = true
    }

    vm.notAuthenticated = !$cookies.get('authenticated')

    var home_location = 'http://localhost:3000'

    vm.whichTab = 0
    vm.changeTab = function(tabNum) {
      vm.whichTab = tabNum
    }

    vm.showSimpleToast = showSimpleToast;

    function showSimpleToast(title) {
      $mdToast.show(
        $mdToast.simple()
          .content(title)
          .hideDelay(2000)
          .position('bottom right')
      );
    }

    vm.tableData = [];
    vm.displayRecommenderProfile = displayRecommenderProfile;

    function displayRecommenderProfile() {
        $mdSidenav('right').toggle();
    }

    tableService
      .loadAllItems()
      .then(function(tableData) {
        //console.log(tableData)
        vm.tableData = [].concat(tableData);
      });


    $scope.createRecommender = tableService.createRecsys;

    $scope.uploadCSV = function(file) {
        // TODO:
        // create repo
        // upload CSV
        // check is csv file type
        // check for headers, and title and description headers
        // create table from CSV with primary key

        if ($scope.recommenderName == '' || $scope.recommenderName == null || $scope.urlName == '' || $scope.urlName == null) {
          console.log("failed. need name and url")
          return
        }

        Upload.upload({
            url: 'http://localhost:8000/api/v1/csv/',
            data: {'file': file, 'username': $cookies.get('username'), 'name': $scope.recommenderName, 'url': $scope.urlName},
        }).then(function (resp) {
            console.log('Success ' + resp.config.data.file.name + ' uploaded. Response: ' + resp.data);
        }, function (resp) {
            console.log('Error status: ' + resp.status);
        }, function (evt) {
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
        });
    }

    $scope.getRepoAccess = function() {
          // TODO: fetch all repos of user.
          // TODO: service call to fetch tables of the authorized repo
          // TODO: service call to fetch columns of tables
    }

    // TODO: get all your recsys information.

    vm.recsys_list = 0; // service.getRecsyslist ...

    vm.hasRecommenders = true;

    $scope.disabled = 'true';

    var transfer_protocol = 'https://';
    var base_url = transfer_protocol + 'datahub.csail.mit.edu';

    function buildURL(path, params) {
        var query = '';
        if (params !== undefined && Object.keys(params).length > 0) {
            query = '?' + $.param(params);
        }
        return base_url + path + query;
    }

    var login = 'test321';
    var connection = {
        'user': login,
        'repo_base': login,
    };

    // console.log(tableService.getAllRecsys())

    vm.listrepos = function listRepos() {
      // tableService.getRepoList('kibitz')
        $.ajax({
                url:'http://localhost:8000/api/v1/repo-table/',
                dataType: 'json',
                method: 'GET',
                data: {
                  'username' : $cookies.get('username'),
                  'sessionid': $cookies.get('sessionid'),
                }
            })
            .fail(function(xhr, status, error) {
                // term.error('failed');
                console.log(xhr)
            })
            .done(function(data, status, xhr) {
                // term.echo('repo_name');
                // term.echo('----------');
                var repos = data.repos;
                console.log(repos)
                // $scope.items = repos

                // for (i = 0; i < repos.length; i++) {
                //     term.echo(repos[i].repo_name);
                // }
                // term.echo('');
                // term.echo(repos.length + ' rows returned.');
            });

    }


    function saveIfSet(assocArray, key) {
        if (assocArray[key]) {
            console.log('Saving ' + key + ': ' + assocArray[key]);
            sessionStorage.setItem(key, assocArray[key]);
        }
    }

    function paramsFromQuery(query) {
        var params = {};
        var parts = query.split('&');
        for (var i = parts.length - 1; i >= 0; i--) {
            var pieces = parts[i].split('=');
            params[decodeURIComponent(pieces[0])] = decodeURIComponent(
                pieces[1].replace(/\+/g, ' '));
        }
        return params;
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

    tableService.getRepoList($cookies.get('username')).then(function(result) {
        $scope.repos = repoListToOptions(result.repos)
    })

    $scope.$watch('selectedRepo', function(newVal, oldVal){
        console.log(newVal)
        tableService.getTableList($cookies.get('username'), newVal.value).then(function(result) {
            console.log(result)
            $scope.tables = tableListToOptions(result.tables)
        })

    })

    $scope.$watch('selectedTable', function(newVal, oldVal){
        console.log(newVal)
        console.log($scope.selectedRepo)
        console.log(newVal.value)
        tableService.getTableColumns($cookies.get('username'), $scope.selectedRepo.value, newVal.value).then(function(result) {
            console.log(result)
            $scope.columns = columnListToOptions(result.columns)
        })

    })

    $scope.repos = []
    $scope.tables = []
    $scope.columns = []

    $scope.selectedRepo = ''
    $scope.selectedTable = ''
    $scope.selectedPrimaryKey = ''
    $scope.selectedTitle= ''
    $scope.selectedDescription = ''
    $scope.selectedImageLink = ''


    vm.auth = function () {

      // var login = 'sunb1';
      // connection = {
      //     'user': login,
      //     'repo_base': login
      // };

      var transfer_protocol = 'https://';
      var base_url = transfer_protocol + 'datahub.csail.mit.edu';

      function buildURL(path, params) {
          query = '';
          if (params !== undefined && Object.keys(params).length > 0) {
              query = '?' + $.param(params);
          }
          return base_url + path + query;
      }


      var params = {
          'response_type': 'code',
          'scope': 'read write',
          'client_id': 'sphQrMCcfdIjker5ghseFx7vRfV2bcwBfqJVRKAe',
          'redirect_uri': home_location,
      };

      var authorization_url = buildURL('/oauth2/authorize/', params);
      window.location.href = authorization_url;

    }

    if (sessionStorage.getItem('code') &&
      loginService.loggedIn()) { // send profile auth code to backend
        var params = {
          'code': sessionStorage.getItem("code"),
          'username': $cookies.get('username'),
        }

        $http({
          url: 'http://localhost:8000/api/v1/code-to-token/',
          method: 'POST',
          data: params,
        }).then(function successCallback(response) {
            console.log(response)
            console.log("sent code")
            $cookies.put('authenticated', true)
            vm.notAuthenticated = !$cookies.get('authenticated')
            sessionStorage.removeItem('code')

        }, function errorCallback(response) {
            console.log(response)
        });

    }

  }

})();
