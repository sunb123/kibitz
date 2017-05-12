(function(){

  angular
    .module('app')
    .controller('TableController', [ 'config', '$timeout',
      'tableService', 'loginService', '$mdSidenav', '$mdToast', '$scope', '$http', '$state', 'Upload', '$cookies', '$q', '$uibModal',
      TableController
    ])


  function TableController(config, $timeout, tableService, loginService, $mdSidenav, $mdToast, $scope, $http, $state, Upload, $cookies, $q, $uibModal) {
    var vm = this;

    if (!loginService.loggedIn()) {
      $state.go('home.login')
      console.log("not logged in")
      return
    } else {
      console.log("logged in")
    }

    $scope.isAuthenticated = function() {
      return $cookies.get('authenticated')
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
      if ($scope.tableData.length != 0) {
          vm.hasRecommenders = true;
      }
      //console.log($scope.tableData)
    })

    $scope.$watch('$parent.recsysList', function(newVal, oldVal) {
      $scope.tableData = [].concat($scope.$parent.recsysList)
      if ($scope.tableData.length != 0) {
          vm.hasRecommenders = true;
      }      
      //console.log($scope.tableData)
    })

    $scope.auth = function () {
      var params = {
          'response_type': 'code',
          'scope': 'read write',
          'client_id': 'sphQrMCcfdIjker5ghseFx7vRfV2bcwBfqJVRKAe',
          'redirect_uri': config.home_url,
      };

      var authorization_url = config.buildURL('/oauth2/authorize/', params);
      var server_url = config.server_url
      var popup = window.open(authorization_url,'newwindow', myconfig='height=600,width=600,' +
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

      var interval = setInterval(fnCheckLocation, 500);
    }

    $scope.show = function(modal) {
      $scope.modalInstance = $uibModal.open({
        templateUrl: 'createModal.html',
        controller: 'ModalInstanceCtrl',
        controllerAs: 'vm',
        scope: $scope,
      });

      var result = $scope.modalInstance.result

      result.then(function(model) {
        console.log(model)
      });
    }



  }

angular.module('app').controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, config, $timeout, tableService, loginService, $mdSidenav, $mdToast, $http, $state, Upload, $cookies, $q) {
    var vm = this;

    $scope.tables = []
    $scope.columns = []
    
    $scope.recommenderName = ''
    $scope.urlName = ''

    $scope.selectedRepo = ''
    $scope.selectedTable = ''
    $scope.selectedPrimaryKey = ''
    $scope.selectedTitle= ''
    $scope.selectedDescription = ''
    $scope.selectedImageLink = ''
    $scope.selectedUnivCode = ''

    $scope.errorMessage = {'status':'', 'message':''}

    function setErrorMessage(status, message) {
      $scope.errorMessage.status = status
      $scope.errorMessage.message = message
    }

    $scope.whichTab = 0
    $scope.changeTab = function(tabNum) {
      $scope.whichTab = tabNum
    }

    function checkBasicParams() {
        if ($scope.recommenderName == '' || $scope.recommenderName == null || $scope.recommenderName == undefined ||
            $scope.urlName == '' || $scope.urlName == null || $scope.urlName == undefined) {
          setErrorMessage("missing_field", "Missing recommender name or url")
          //console.log($scope.recommenderName, $scope.urlName)
          return false
        } 
        return true
    }

    function checkRecsysParams() {
        if ($scope.selectedRepo == '' || $scope.selectedRepo == null || $scope.selectedRepo == undefined ||
            $scope.selectedTable == '' || $scope.selectedTable == null || $scope.selectedTable == undefined ||
            $scope.selectedPrimaryKey == '' || $scope.selectedPrimaryKey == null || $scope.selectedPrimaryKey == undefined ||
            $scope.selectedTitle == '' || $scope.selectedTitle == null || $scope.selectedTitle == undefined ||
            $scope.selectedDescription == '' || $scope.selectedDescription == null || $scope.selectedDescription == undefined) {
	  setErrorMessage("missing_field", "Missing additional fields")
          return false
        }
	return true
    }


    $scope.headers = {}
    $scope.csvHeadersFields = [
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
    var reader;
    function setReader() {
        reader = new FileReader();
        reader.onload = function(progressEvent){
            var lines = this.result.split('\n');
            fileHeaders = lines[0].toLocaleLowerCase().split(',').map(function(v){return v.trim()});
            var headerOptions = headerListToOptions(fileHeaders)
            $scope.csvHeadersFields[0].templateOptions.options = headerOptions
            $scope.csvHeadersFields[1].templateOptions.options = headerOptions
            $scope.csvHeadersFields[2].templateOptions.options = headerOptions
            $scope.csvHeadersFields[3].templateOptions.options = headerOptions
            $scope.hasHeaders = true
        };
    }
    setReader();  
  
    $scope.readHeaders = function() {
	if (checkBasicParams() == false) {
	  return
        } else {
          setErrorMessage('','')
        }

        var myfile = $('#csvFile')[0].files[0]
        if (myfile == undefined) {
            return
        }
        setReader()
        reader.readAsText(myfile)
        $timeout(function() {
          console.log(fileHeaders)
        }, 100)
    }

    function enableCreateRecommenderButton() {
      $('#createRecommenderButton').prop('disabled',false)
      $('#createRecommenderButtonText').text('Create')
      $('#createRecommenderButtonLoading').removeClass('fa fa-spinner spinning')
    }

    function disableCreateButton() {
      $('#createRecommenderButton').prop('disabled',true)
      $('#createRecommenderButtonText').text(' Creating...')
      $('#createRecommenderButtonLoading').addClass('fa fa-spinner spinning')
    }

    $scope.createRecommender = function() { 
      if ($scope.whichTab == 1) {
        vm.createRecsysFromParams()
      } else if ($scope.whichTab == 0) {
        $scope.uploadCSV()
        $scope.hasHeaders = false
      }
    }

    $scope.uploadCSV = function() {
        if (checkBasicParams() == false) {
          return
        }

        var file = $('#csvFile')[0].files[0]
        if (Object.keys($scope.headers).length == 0) { // TODO: determine which headers are required
          setErrorMessage("missing_header", "Missing CSV headers")
          return
        }
        
        disableCreateButton() // disable create button until success
        
        $timeout(function() {
          if (reader.readyState == 2) {
            //$scope.$parent.itemDeferred = $q.defer()
            //$scope.$parent.itemPromise = $scope.$parent.itemDeferred.promise

            Upload.upload({
                url: config.server_url+'/csv/',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRFToken': $cookies.get('csrftoken'),
                },
                data: {'file': file, 'username': $cookies.get('k_username'), 'name': $scope.recommenderName, 'url_name': $scope.urlName, 'headers':JSON.stringify($scope.headers)},

            }).then(function (response) {
                console.log('Success ' + response.config.data.file.name + ' uploaded. Response: ' + response.data);
                setErrorMessage('','')
                $scope.showFieldSelection = true
                $scope.$emit('reload-resources')
                enableCreateRecommenderButton()
                $scope.modalInstance.close()
            }, function (response) {
                console.log('Error status: ' + response.status);
                //$scope.$parent.itemDeferred.resolve('resolved')
                setErrorMessage(response.data.status, response.data.message)
                enableCreateRecommenderButton()
            }, function (evt) {
                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
            });
          } else {
            console.log("failed to read file in time")

          }
        }, 200); // NOTE: should loop: sleep then check ready status

    }

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

  /*
    $('#myModal').on('hidden.bs.modal', function () {
        $scope.urlErrorMessage = false
        $scope.$digest()
        console.log("hidden")
    })
*/

    // Called when creating recsys through Datahub
    vm.createRecsysFromParams = function(model) {
        if (checkBasicParams() == false || checkRecsysParams() == false) {
          return
        }

        disableCreateButton()
        
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

        console.log(recsys_params)

        //$scope.$parent.itemDeferred = $q.defer()
        //$scope.$parent.itemPromise = $scope.$parent.itemDeferred.promise

        $http({
          url: config.server_url+'/recsys/',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRFToken': $cookies.get('csrftoken'),
          },
          method: 'POST',
          data: recsys_params,
        }).then(function successCallback(response) {
            console.log(response)
            setErrorMessage('','')
            $scope.$emit('reload-resources')
            enableCreateRecommenderButton()
            $scope.modalInstance.close()
        }, function errorCallback(response) {
            console.log(response)
            $scope.$parent.itemDeferred.resolve('resolved')
            enableCreateRecommenderButton()
            setErrorMessage(response.data.status, response.data.message)
        });
    }

    vm.applyFilter = function() {
        $uibModalInstance.close()
    }

    vm.ok = ok;
    vm.cancel = cancel;

    function ok() {
      $uibModalInstance.close()//(vm.formData.model);
    }

    function cancel() {
      //vm.formData.options.resetModel()
      $uibModalInstance.close({
          'recommenderName': $scope.recommenderName, 
          'urlNAme': $scope.urlName
      })
      console.log($scope.recommenderName, $scope.urlName)
      $uibModalInstance.dismiss('cancel');
    };

  });

})();
