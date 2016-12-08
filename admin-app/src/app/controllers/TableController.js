(function(){

  angular
    .module('app')
    .controller('TableController', [ 'config',
      'tableService', 'loginService', '$mdSidenav', '$mdToast', '$scope', '$http', '$state', 'Upload', '$cookies',
      TableController
    ])


  function TableController(config, tableService, loginService, $mdSidenav, $mdToast, $scope, $http, $state, Upload, $cookies) {
    var vm = this;

    if (!loginService.loggedIn()) {
      $state.go('home.login');
      console.log('go to login')
      return
    } else {
      $scope.$parent.loggedIn = true
      console.log("true")
    }

    if (window.location.search.indexOf('code=') != -1) {
        sessionStorage.setItem("code", window.location.search.substring(window.location.search.indexOf('=')+1))
        window.location.href = config.home_url
        return
    }


    // TODO: do not show or call authenticate if already have permissions.
    if (sessionStorage.getItem('code') &&
      loginService.loggedIn()) { // send profile auth code to backend
        var params = {
          'code': sessionStorage.getItem("code"),
          'username': $cookies.get('username'),
        }

        $http({
          url: config.server_url+'/code-to-token/',
          method: 'POST',
          data: params,
        }).then(function successCallback(response) {
            console.log(response)
            console.log("sent code")
            $cookies.put('authenticated', true)
            vm.notAuthenticated = !$cookies.get('authenticated')
            sessionStorage.removeItem('code')
            getRepos()

        }, function errorCallback(response) {
            console.log(response)
        });
    }

    vm.notAuthenticated = !$cookies.get('authenticated')

    if (!vm.notAuthenticated) {
      getRepos()
    }

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
            url: config.server_url+'/v1/csv/',
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

    vm.hasRecommenders = true;

    $scope.disabled = 'true';



    function getRepos() {
        tableService.getRepoList($cookies.get('username')).then(function(result) {
            $scope.repos = tableService.repoListToOptions(result.repos)
            console.log("something", $scope.repos)
        })

        $scope.$watch('selectedRepo', function(newVal, oldVal){
            console.log(newVal)
            if (newVal != '' & newVal != null) {
              tableService.getTableList($cookies.get('username'), newVal.value).then(function(result) {
                  console.log(result)
                  $scope.tables = tableService.tableListToOptions(result.tables)
              })
            }
        })

        $scope.$watch('selectedTable', function(newVal, oldVal){
            if (newVal != '' && newVal != null) {
              tableService.getTableColumns($cookies.get('username'), $scope.selectedRepo.value, newVal.value).then(function(result) {
                  console.log(result)
                  $scope.columns = tableService.columnListToOptions(result.columns)
              })
            }
        })
    }

    $scope.repos = []
    $scope.tables = []
    $scope.columns = []

    $scope.selectedRepo = ''
    $scope.selectedTable = ''
    $scope.selectedPrimaryKey = ''
    $scope.selectedTitle= ''
    $scope.selectedDescription = ''
    $scope.selectedImageLink = ''
    $scope.selectRating = ''


    // TODO: send recsys params to create recsys.
    vm.createRecsysFromParams = function() {
        if ($scope.recommenderName == '' || $scope.recommenderName == null || $scope.urlName == '' || $scope.urlName == null) {
          console.log("failed. need name and url")
          return
        }
        var recsys_params = {
                      'name':  $scope.recommenderName,
                      'url':   $scope.urlName,
                      'repo':  $scope.selectedRepo,
                      'table': $scope.selectedTable,
                      'pk':    $scope.selectedPrimaryKey,
                      'title': $scope.selectedTitle,
                      'description': $scope.selectedDescription,
                      'image':  $scope.selectedImageLink,
                      'rating': $scope.selectRating,
                }

        $http({
          method: 'POST',
          url: config.server_url+'/recsys/',
          data: recsys_params,
        }).then(function successCallback(response) {
            console.log(response)
        }, function errorCallback(response) {
            console.log(response)
        });
    }


    vm.auth = function () {
      var params = {
          'response_type': 'code',
          'scope': 'read write',
          'client_id': 'sphQrMCcfdIjker5ghseFx7vRfV2bcwBfqJVRKAe',
          'redirect_uri': config.home_url,
      };

      var authorization_url = config.buildURL('/oauth2/authorize/', params);

      var popup = window.open(authorization_url,'newwindow', config='height=600,width=600,' +
      'toolbar=no, menubar=no, scrollbars=no, resizable=no,' + 'location=no, directories=no, status=no')

      var fnCheckLocation = function(){
          if (popup.location === null) {
              clearInterval(id);
          }

          // Check to see if the location has changed.
          if (popup.location.href != "about:blank" && popup.location.href.indexOf("table") > -1 && popup.location.href.indexOf("code") == -1) {
              console.log(popup.location.href)
              popup.close();
              clearInterval(id);
              getRepos();
              if ($scope.repos != [] && $scope.repos != null) {
                $cookies.put('authenticated', true)
              }
              $cookies.put('authenticated', true)
              vm.notAuthenticated = !$cookies.get('authenticated')
          }
      }
      var id = setInterval(fnCheckLocation, 100);

      //window.location.href = authorization_url;
    }

  }
})();