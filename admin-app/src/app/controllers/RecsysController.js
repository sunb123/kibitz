(function(){

  angular
       .module('app')
       .controller('RecsysController', [
          'navService', 'tableService', 'loginService', '$mdSidenav', '$mdBottomSheet', '$log', '$q', '$state', '$mdToast',
          '$stateParams','$scope', '$cookies',
          RecsysController
       ]);

  angular.module('app').run(function(formlyConfig) {
    formlyConfig.setType({
      name: 'slider',
      template: ['<rzslider rz-slider-model="model[options.key]"' +
                 ' rz-slider-options="to.sliderOptions"></rzslider>'].join(' '),
      wrapper: ['bootstrapLabel', 'bootstrapHasError']
    });

    formlyConfig.setType({
      name: 'range-slider',
      template: ['<rzslider rz-slider-model="model[options.key].low"' +
                 'rz-slider-high="model[options.key].high" ' +
                 'rz-slider-options="to.sliderOptions"></rzslider>'].join(' '),
      wrapper: ['bootstrapLabel', 'bootstrapHasError']
    });

  });

  function RecsysController(navService, tableService, loginService, $mdSidenav, $mdBottomSheet, $log, $q, $state, $mdToast,
    $stateParams, $scope, $cookies) {
	// var pending = $mdBottomSheet.hide() || $q.when(true);

	// pending.then(function(){
	// $mdSidenav('left').toggle();
	// });

    if (!loginService.loggedIn()) {
      $state.go('home.login');
      console.log('go to login')
      return
    } else {
      $scope.$parent.loggedIn = true
    }

	var vm = this;

    vm.submit = onSubmit;

    $scope.showingAdvancedSettings = false;

    vm.tabSetting = 'general' // 'general' or 'advaned'

    vm.generalTab = function() {
        vm.tabSetting = 'general'
    }

    vm.advancedTab = function() {
        vm.tabSetting = 'advanced'
    }

    vm.isGeneralTab = function() {
        return vm.tabSetting == 'general'
    }

    vm.isAdvancedTab = function() {
        return vm.tabSetting == 'advanced'
    }

    vm.setAsActive = function(tab) {
        if (tab == 'general') {
            vm.tabSetting = 'general'
        } else if (tab == 'advanced') {
            vm.tabSetting = 'advanced'
        }
    }

    function onSubmit() {
        // console.log(vm.recsys, vm.recsys_id)
        tableService.updateRecsys(vm.recsys, vm.recsys_id).then(function(result){
            console.log(result)
            $mdToast.show(
                $mdToast.simple()
                  .textContent("Update Successful")
                  .position('bottom right')
                  .theme('success-toast')
                  .hideDelay(3000)
              )
        })
    }

    vm.cssUpload = tableService.updateCSSFile;
    // vm.cssText = tableService.getCSSFile(vm.recsys_id)

    vm.model = $stateParams.model
    vm.recsys_id = $stateParams.id

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

    tableService.getRepoList($cookies.get('username')).then(function(result) {
        vm.repoList = result.repos
    })

    $scope.$watch('vm.recsys.repo_name', function(newVal, oldVal){
        tableService.getTableList($cookies.get('username'), newVal).then(function(result) {
            vm.tableList = result.tables
            var tables = tableListToOptions(vm.tableList)
            vm.recsysFields[3].templateOptions.options = tables
            vm.recsysFields[4].templateOptions.options = tables
            vm.recsysFields[5].templateOptions.options = tables
        })

    })

    tableService.getRecsys(vm.recsys_id).then(function(result) {
        for(key in result) {
            vm.recsys[key] = result[key]
        }
        vm.recsysFields[2].templateOptions.options = repoListToOptions(vm.repoList)
    })


    // The model object that we reference
    // on the  element in index.html

    vm.options = {};

    // An array of our form fields with configuration
    // and options set. We make reference to this in
    // the 'fields' attribute on the  element
    vm.recsysFields = [
        {
            key: 'name',
            type: 'input',
            // defaultValue: '',
            templateOptions: {
                type: 'text',
                label: 'Recommender Name',
                placeholder: 'Enter the recommender name',
                required: true,
            }
        },
        {
            key: 'url_name',
            type: 'input',
            templateOptions: {
                type: 'input',
                label: 'URL',
                placeholder: 'Enter the website url.',
                required: true,
                // readOnly: true,
            }
        },
        {
            key: 'repo_name',
            type: 'select',
            templateOptions: {
                type: 'text',
                label: 'Repository Name',
                placeholder: 'Enter the repository name',
                required: true,
                options: [],
            }
        },
        {
            key: 'item_table_name',
            type: 'select',
            templateOptions: {
                type: 'text',
                label: 'Items Table Name',
                placeholder: 'Enter the table name. These are the items.',
                required: false,
                options: [],
            }
        },
        {
            key: 'rating_table_name',
            type: 'select',
            templateOptions: {
                type: 'text',
                label: 'Ratings Table Name',
                placeholder: 'Enter the table name. These are the ratings.',
                required: false,
                options: [],
            }
        },
        {
            key: 'user_table_name',
            type: 'select',
            templateOptions: {
                type: 'text',
                label: 'Users Table Name',
                placeholder: 'Enter the table name. These are the users.',
                required: false,
                options: [],
            }
        },
        {
            key: 'max_rating',
            type: 'slider',
            templateOptions: {
                label: 'Choose Highest Item Rating Possible',
                "sliderOptions": {
                    "floor": 5,
                    "ceil": 10,
                    "showTicksValues": true,
                },
            }
        },
    ];
}

})();