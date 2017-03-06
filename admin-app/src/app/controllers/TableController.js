(function(){

  angular
    .module('app')
    .controller('TableController', [ 'config', '$timeout',
      'tableService', 'loginService', '$mdSidenav', '$mdToast', '$scope', '$http', '$state', 'Upload', '$cookies', '$q',
      TableController
    ])


  function TableController(config, $timeout, tableService, loginService, $mdSidenav, $mdToast, $scope, $http, $state, Upload, $cookies, $q) {
    var vm = this;

    if (!loginService.loggedIn()) {
      $state.go('home.login');
      console.log('go to login')
      return
    } else {
      $scope.$parent.loggedIn = true
      console.log("true")
    }

    $scope.isAuthenticated = function() {
      return $cookies.get('authenticated')
    }

    $scope.errorMessage = {'status':'', 'message':''}
    function setErrorMessage(status, message) {
      $scope.errorMessage.status = status
      $scope.errorMessage.message = message
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

    $scope.tableData = [];

    // get recsys list
    $scope.$parent.itemDeferred.promise.then(function(val) {
      $scope.tableData = [].concat($scope.$parent.recsysList)
      //console.log($scope.tableData)
    })


    $scope.$watch('$parent.recsysList', function(newVal, oldVal) {
      $scope.tableData = [].concat($scope.$parent.recsysList)
      //console.log($scope.tableData)
    })

    function headerListToOptions(headerList) {
        var options = []
        var option;
        for (var i in headerList) {
            option = {'name':headerList[i], 'value':headerList[i]}
            options.push(option)
        }
        return options
    }

    var fileHeaders;
    var reader = new FileReader();
    reader.onload = function(progressEvent){
        var lines = this.result.split('\n');
        fileHeaders = lines[0].toLocaleLowerCase().split(',');
        var headerOptions = headerListToOptions(fileHeaders)
        vm.csvHeadersFields[0].templateOptions.options = headerOptions
        vm.csvHeadersFields[1].templateOptions.options = headerOptions
        vm.csvHeadersFields[2].templateOptions.options = headerOptions
        vm.csvHeadersFields[3].templateOptions.options = headerOptions
        $scope.hasHeaders = true
    };

    $scope.readHeaders = function() {
        if ($scope.recommenderName == '' || $scope.recommenderName == null || $scope.urlName == '' || $scope.urlName == null) {
          $scope.errorMessage.status = "missing_name"
          $scope.errorMessage.message = "Missing recommender name or url"
          return
        }

        var myfile = $('#csvFile')[0].files[0]
        reader.readAsText(myfile)
        $timeout(function() {
          console.log(fileHeaders)
        }, 100)
    }

    $scope.createRecommender = function() {
      if (vm.whichTab == 1) {
        vm.createRecsysFromParams()
      } else if (vm.whichTab == 0) {
        $scope.uploadCSV()
        $scope.hasHeaders = false
      }
    }

    $scope.uploadCSV = function() {
        if ($scope.recommenderName == '' || $scope.recommenderName == null || $scope.urlName == '' || $scope.urlName == null) {
          $scope.errorMessage.status = "missing_name"
          $scope.errorMessage.message = "Missing recommender name or url"
          return
        }

        var file = $('#csvFile')[0].files[0]
        if (Object.keys(vm.headers).length == 0) {
          $scope.errorMessage.status = "missing_headers"
          $scope.errorMessage.message = "Missing CSV headers"
          return
        }

        $timeout(function() {
          if (reader.readyState == 2) {
            $('#myModal').modal('toggle');
            $scope.$parent.itemDeferred = $q.defer()
            $scope.$parent.itemPromise = $scope.itemDeferred.promise

            Upload.upload({
                url: config.server_url+'/csv/',
                data: {'file': file, 'username': $cookies.get('k_username'), 'name': $scope.recommenderName,
                'url_name': $scope.urlName, 'required_headers':JSON.stringify(vm.headers)},
            }).then(function (response) {
                console.log('Success ' + response.config.data.file.name + ' uploaded. Response: ' + response.data);
                setErrorMessage('','')
                $scope.showFieldSelection = true
                $scope.$parent.loadRecsysList()

            }, function (response) {
                console.log('Error status: ' + response.status);
                setErrorMessage(response.data.status, response.data.message)
            }, function (evt) {
                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
            });
          } else {
            console.log("failed to read file in time")

          }
        }, 200); // NOTE: should loop: sleep then check ready status

    }

    vm.hasRecommenders = true;
    $scope.disabled = 'true';

    $scope.$watch('selectedRepo', function(newVal, oldVal){
        console.log(newVal)
        if (newVal != '' & newVal != null) {
          $scope.tables = tableService.tableListToOptions(newVal.tables)
        }
    })

    $scope.$watch('selectedTable', function(newVal, oldVal){
        if (newVal != '' && newVal != null) {
          $scope.columns = tableService.columnListToOptions(newVal.columns)
        }
    })

    $scope.tables = []
    $scope.columns = []

    $scope.selectedRepo = ''
    $scope.selectedTable = ''
    $scope.selectedPrimaryKey = ''
    $scope.selectedTitle= ''
    $scope.selectedDescription = ''
    $scope.selectedImageLink = ''
    $scope.selectedUnivCode = ''


    $('#myModal').on('hidden.bs.modal', function () {
        $scope.urlErrorMessage = false
        $scope.$digest()
        console.log("hidden")
    })

    // Called when creating recsys through Datahub
    vm.createRecsysFromParams = function() {
        if ($scope.recommenderName == '' || $scope.recommenderName == null || $scope.urlName == '' || $scope.urlName == null) {
          $scope.errorMessage.status = "missing_name"
          $scope.errorMessage.message = "Missing recommender name or url"
          return
        }
        console.log(config.server_url+'/recsys/')

        var recsys_params = {
            'name': $scope.recommenderName,
            'url_name': $scope.urlName,
            'repo_base': $scope.selectedRepo.owner,
            'repo_name': $scope.selectedRepo.value,
            'item_table_name': $scope.selectedTable.value,
            'primary_key_field': $scope.selectedPrimaryKey.value,
            'title_field': $scope.selectedTitle.value,
            'description_field': $scope.selectedDescription.value,
            'image_link_field': $scope.selectedImageLink.value,
            'universal_code_field': $scope.selectedUnivCode.value,
        }

        $('#myModal').modal('toggle');
        $scope.$parent.itemDeferred = $q.defer()
        $scope.$parent.itemPromise = $scope.itemDeferred.promise

        $http({
          method: 'POST',
          url: config.server_url+'/recsys/',
          data: recsys_params,
        }).then(function successCallback(response) {
            console.log(response)
            setErrorMessage('','')
            $scope.$parent.loadRecsysList()

        }, function errorCallback(response) {
            console.log(response)
            setErrorMessage(response.data.status, response.data.message)
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
          console.log(popup.location)
          if (popup.location === null || popup.location == undefined || popup.location.href == null || popup.location.href == undefined) {
              clearInterval(interval);
          }

          if (popup.location.href != "about:blank" && popup.location.href.indexOf("code=") != -1) {
            var code = popup.location.search.substring(popup.location.search.indexOf('code=')+5)
            $http({
              url: server_url+'/code-to-token/',
              headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
              },
              method: 'POST',
              data: {
                'code': code,
                'username': sessionStorage.getItem('k_username'),
              },
            }).then(function successCallback(response) {
                console.log(response)
                $cookies.put('authenticated', true)

                popup.close();
                clearInterval(interval);
                $scope.$parent.loadRepos()

            }, function errorCallback(response) {
                console.log("failed", response)
            });
          }
      }

      var id = setInterval(fnCheckLocation, 500);
    }

    vm.headers = {}
    vm.csvHeadersFields = [
        {
            key: 'title',
            type: 'select',
            templateOptions: {
                type: 'text',
                label: 'Title',
                placeholder: 'Select the title field',
                required: false,
                options: [],
            }
        },
        {
            key: 'description',
            type: 'select',
            templateOptions: {
                type: 'text',
                label: 'Description',
                placeholder: 'Select the description field',
                required: false,
                options: [],
            }
        },
                {
            key: 'image',
            type: 'select',
            templateOptions: {
                type: 'text',
                label: 'Image',
                placeholder: 'Select the image link field',
                required: false,
                options: [],
            }
        },
        {
            key: 'univ_code',
            type: 'select',
            templateOptions: {
                type: 'text',
                label: 'Universal Code',
                placeholder: 'Select the universal code field',
                required: false,
                options: [],
            }
        },

    ];


  }
})();