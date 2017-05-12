(function(){

  angular
       .module('app')
       .controller('RecsysController', [
          'navService', 'tableService', 'loginService', 'recsysService', '$mdSidenav', '$mdBottomSheet', '$log', '$q', '$state', '$mdToast', 
          '$stateParams','$scope', '$cookies', '$timeout', '$rootScope', '$http', 'config', 'Upload',
          RecsysController
       ])

  function RecsysController(navService, tableService, loginService, recsysService, $mdSidenav, $mdBottomSheet, $log, $q, $state, $mdToast,
    $stateParams, $scope, $cookies, $timeout, $rootScope, $http, config, Upload) {

    if (!loginService.loggedIn()) {
      $state.go('home.login');
      console.log('go to login')
      return
    } else {
      console.log('logged in')
    }

    var vm = this;
    vm.submit = onSubmit;
    $scope.showingAdvancedSettings = false;
    vm.tabSetting = 'general' // 'general' or 'advaned'
    vm.recsys_id = $stateParams.id

    vm.setTab = function(tab) {
        vm.tabSetting = tab
    }

    vm.isTab = function(tab) {
        return vm.tabSetting == tab
    }

    $scope.slickConfigLoaded = true;
    $scope.slickCurrentIndex = 1;
    $scope.slickConfig = {
      dots: true,
      autoplay: false,
      initialSlide: 1,
      infinite: true,
      autoplaySpeed: 4000,
      method: {},
      arrows: true,
      event: {
        afterChange: function (event, slick, currentSlide, nextSlide) {
          $scope.slickCurrentIndex = currentSlide;
        },
        init: function (event, slick) {
          slick.slickGoTo($scope.slickCurrentIndex); // slide to correct index when init
          console.log('init');
        },
      }
    };

    vm.getOnClass = function(index) {
        if (index != null) {
            return $scope.ratingStates[index].stateOn
        } else {
            return $scope.ratingStates[0].stateOn
        }
    }

    vm.getOffClass = function(index) {
        if (index != null) {
            return $scope.ratingStates[index].stateOff
        } else {
            return $scope.ratingStates[0].stateOff
        }
    }

    vm.recsys = {
        rating_icon_color: 'hsl(0, 0%, 0%)',
        highlighted_rating_icon_color: 'hsl(0, 100%, 50%)',
        rating_icon_fontsize: 14,
        item_fields_include: [],
        filter_fields: [],
    }

    $scope.ratingStates = [{stateOn: 'fa fa-star', stateOff: 'fa fa-star-o'},
                        {stateOn: 'fa fa-star', stateOff: 'fa fa-star-o'},
                        {stateOn: 'fa fa-star', stateOff: 'fa fa-star-o'},
                        {stateOn: 'fa fa-star', stateOff: 'fa fa-star-o'},
                        {stateOn: 'fa fa-star', stateOff: 'fa fa-star-o'}]

    vm.repoList = []
    vm.model = $stateParams.model
    vm.options = {};

    $scope.$watch('models', function(model) {
        $scope.modelAsJson = angular.toJson(model, true);
    }, true);

    // $scope.urlErrorMessage = false;

    vm.recsysFields = recsysService.recsysFields
    //vm.recsysFields[1].templateOptions.getError = function() {return $scope.urlErrorMessage}
    vm.recsysFieldsAdv = recsysService.recsysFieldsAdv
    vm.recsysFieldsTemplate = recsysService.recsysFieldsTemplate


    function getTables(repo_name) {
        for (i in vm.repoList) {
            if (vm.repoList[i].name == repo_name) { // NOTE: name and value are same
                return vm.repoList[i].tables
            }
        }
        return null
    }

    function getColumns(item_table_name) {
        for (i in vm.tableList) {
            if (vm.tableList[i].name == item_table_name) { // NOTE: name and value are same
                return vm.tableList[i].columns
            }
        }
        return null
    }

    function getItemFields() {
        console.log(vm.repoList, vm.recsys.repo_name)
        var tables = getTables(vm.recsys.repo_name)
        var table_name = vm.recsys.item_table_name

        if (tables != null && tables != []) {
            for (i in tables) {
                if (tables[i].table_name == table_name) {
                    return tables[i].columns
                }
            }
        }
    }

    function getItemFieldsTemplate() {
        var fields = []
        var list = $scope.models.lists.roles
        for (var i=0; i < list.length; i++) {
            fields.push(list[i].label)
        }
        return fields
    }

    function getRecsysFields(recsys_id) {
        var recsysList = $scope.$parent.recsysList
        for (var i=0; i < recsysList.length; i++) {
            if (recsysList[i].pk == recsys_id) {
                return recsysList[i].fields
            }
        }
    }

    function convertToLabeled(list) {
        return list.map(function(v){ return {label: v} })
    }

    function setRecsys(recsys_id) {
        var recsysFields = getRecsysFields(vm.recsys_id)
        for(key in recsysFields) {
            vm.recsys[key] = recsysFields[key]
        }
    }

    function setRecsysWithRepos(recsys_id) {
        var recsysFields = getRecsysFields(vm.recsys_id)
        for(key in recsysFields) {
            vm.recsys[key] = recsysFields[key]
        }

        $scope.myStyle = {}

        vm.repoList = $scope.$parent.repos
        vm.recsysFieldsAdv[0].templateOptions.options = vm.repoList
        vm.item_table_columns = getItemFields()

        vm.loadTableList(vm.recsys.repo_name)
        vm.loadColumnList(vm.recsys.item_table_name)

        var roles = []
        if (vm.item_table_columns != null && vm.item_table_columns != []) {
            for (var i=0; i < vm.item_table_columns.length; i++) {
                roles.push({label: vm.item_table_columns[i].column_name })
            }
        }

        template = vm.getTemplate(recsysFields.template) // NOTE: assumes recsysList is retrieved before repos are
        roles_tmp = roles.map(function(item){return item.label})
        //console.log("temp1", roles_tmp)
        roles_tmp.sort()
        order_tmp = angular.copy(template.item_fields_order)
        //console.log("temp2", order_tmp)
        order_tmp.sort()
        if (angular.equals(roles_tmp, order_tmp) && order_tmp != []) {
            $scope.models.lists.roles = convertToLabeled(template.item_fields_order)
        } else { // table has changed. use new table columns.
            $scope.models.lists.roles = roles 
        }
        $scope.filterModel.values = roles
        //setFilterTemplates(roles)

        console.log("test",vm.recsysFields)
    }
 
    $scope.$watch('vm.recsys.repo_name', function(newVal, oldVal){ // records at value not option dict
        vm.loadTableList(newVal)
    })

    $scope.$watch('vm.recsys.item_table_name', function(newVal, oldVal){ // records at value not option dict
        vm.loadColumnList(newVal)
    })

    vm.loadTableList = function(val) {
        if (val != '' && val != null && vm.repoList != []) {
            vm.tableList = tableService.tableListToOptions(getTables(val))
            console.log(vm.tableList)
            vm.recsysFieldsAdv[1].templateOptions.options = vm.tableList
            console.log(getTables(val))
        }
    }

    vm.loadColumnList = function(val) {
        if (val != '' && val != null && vm.tableList != []) {
            vm.columnList = tableService.columnListToOptions(getColumns(val))
            for (var i=2; i < 7; i++) { // number of fields
                vm.recsysFieldsAdv[i].templateOptions.options = vm.columnList
            }
        }
    }

    vm.getTemplate = function(template_string) {
        var template = JSON.parse(template_string)
        return template
    }

    vm.getOnStyle = function(){
        return {'color':vm.recsys.highlighted_rating_icon_color, 'font-size': vm.recsys.rating_icon_fontsize}
    }

    vm.getOffStyle = function() {
        return {'color':vm.recsys.rating_icon_color, 'font-size': vm.recsys.rating_icon_fontsize}
    }

    $scope.$watch('vm.recsys', function(){
        $rootScope.$broadcast('rate');
    }, true)


    $scope.rolesChecked = {}
    $scope.models = {
        "selected": null,
        "lists": {
            "roles": [] 
        }
    }

    $scope.$parent.itemDeferred.promise.then(function() {
      var recsysFields = getRecsysFields(vm.recsys_id)
      vm.recsys.name = recsysFields.name
      vm.recsys.url_name = recsysFields.url_name
      vm.template = vm.getTemplate(recsysFields.template)
      setRecsys(vm.recsys_id)
      loadTemplate(vm.template)
    })

    $scope.$parent.reposDeferred.promise.then(function(){
        setRecsysWithRepos(vm.recsys_id)
    })
    
    function formatRatingStates(ratingStates) {
        for (var i in ratingStates) {
            delete ratingStates[i]['title']
        }
        return ratingStates
    }

    // TODO: edit which item field to create clickable filter on
    // drop down list with none option
    function loadTemplate(template) {
        vm.recsys.rating_icon_color = template.rating_icon_color != undefined ? template.rating_icon_color : vm.recsys.rating_icon_color
        vm.recsys.highlighted_rating_icon_color = template.highlighted_rating_icon_color != undefined ? template.highlighted_rating_icon_color : vm.recsys.highlighted_rating_icon_color
        vm.recsys.rating_icon_fontsize = template.rating_icon_fontsize != undefined ? template.rating_icon_fontsize : vm.recsys.rating_icon_fontsize
        $scope.ratingStates = formatRatingStates(template.rating_states != undefined ? template.rating_states : $scope.ratingStates)
        $scope.slickCurrentIndex = template.template_number != undefined ? template.template_number : $scope.slickCurrentIndex       
        $scope.titles = ['Rate it a one','Rate it a two','Rate it a three','Rate it a four','Rate it a five']
 
        var item_fields_include = template.item_fields_include != undefined ? template.item_fields_include : vm.recsys.item_fields_include
        var item
        for (var i=0; i < item_fields_include.length; i++) {
            item = item_fields_include[i]
            $scope.rolesChecked[item] = true
        }
        console.log($scope.rolesChecked)
        console.log(template)

        var filter_fields = template.filter_fields != undefined ? template.filter_fields : vm.recsys.filter_fields 
        var field
        for (var i=0; i < filter_fields.length; i++) {
            field = filter_fields[i]
            $scope.filterChecked[field] = true
        }

        // $http get first item in data set recsys_id. 
        $http({
          method: 'GET',
          url: config.server_url+'/item/',
          params: {
              recsys_id: vm.recsys_id,
              get_first: true,
          }
        }).then(function(resp){
          console.log(resp)
          var item = resp.data.item
          $scope.first_item = item
          console.log(item_fields_include)
          console.log(vm.recsys)
          $scope.myimage = item[vm.recsys.image_link_field]
          $scope.mytitle = item[vm.recsys.title_field]
          $scope.description = item_fields_include.includes(vm.recsys.description_field) ? item[vm.recsys.description_field] : ''
          $scope.rating = 4
    
        }, function(resp){
          console.log(resp)
        })
    }

    /*
    $scope.hoveringOver = function(value) {
      $scope.overStar = value;
    };
    */

    $scope.paused = function() {
        if (vm.recsys.status != undefined) {
            return vm.recsys.status == "paused"
        }
    }

    $scope.active = function() {
        if (vm.recsys.status != undefined) {
            return vm.recsys.status == "active"
        }
    }

    function formatField(word) {
      var field = word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
      return field.split('_').join(' ')
    }

    // TODO: fetch first item in item list
    $scope.item_details = function() {
        var item = $scope.first_item
        var itemDetails = $scope.models.lists.roles.filter(function(item){return $scope.rolesChecked[item.label] == true}).map(function(item){ return item.label})
        var field;
        var item_template = "<fieldset>"
        for (i in itemDetails) {
            field = itemDetails[i]
            value = item[field]
            item_template += "<div class='row control-group'><div class='col-xs-4 display-label'>{0}</div> \
            <td><div class='col-xs-8 display-value word-wrap'>{1}</div></div>".format(formatField(field), value)
        }
        item_template += "</fieldset>"
        return item_template
    }

    $scope.ratings_template = '<fieldset> \
       <div class="star-rating"> Your Rating: \
         <span class="fa fa-star" data-rating="1"></span>\
         <span class="fa fa-star" data-rating="2"></span>\
         <span class="fa fa-star" data-rating="3"></span>\
         <span class="fa fa-star-o" data-rating="4"></span>\
         <span class="fa fa-star-o" data-rating="5"></span>\
         <input type="hidden" name="whatever" class="rating-value" value="3">\
       </div>\
        <div class="input-group"><span>5 Stars</span><meter id="meter-5-star" value=".70"></meter><span>70%</span></div> \
        <div><span>4 Stars</span><meter id="meter-4-star" value=".15"></meter><span>15%</span></div> \
        <div><span>3 Stars</span><meter id="meter-3-star" value=".10"></meter><span>10%</span></div> \
        <div><span>2 Stars</span><meter id="meter-2-star" value=".025"></meter><span>2.5%</span></div> \
        <div><span>1 Stars</span><meter id="meter-1-star" value=".025"></meter><span>2.5%</span></div>';

    function onSubmit() {
        tableService.updateRecsys(vm.recsys, vm.recsys_id).then(function(result){
            console.log(result)
            // if (result.my_url_error == true) {
            //     $scope.urlErrorMessage = result.message
            //     $timeout(function(){
            //         $scope.$digest()
            //     })
            //     console.log($scope.urlErrorMessage)
            // } else {
                $mdToast.show(
                    $mdToast.simple()
                      .textContent("Update Successful")
                      .position('bottom right')
                      .theme('success-toast')
                      .hideDelay(3000)
                  )
            //}
        }, function(result) {
            console.log(result)
                 $mdToast.show(
                   $mdToast.simple()
                     .textContent("Update Error")
                     .position('bottom right')
                     .theme('error-toast')
                     .hideDelay(6000)
                 )
        })
    }

    $scope.saveTemplate = function() {
        var template = {}
        template['rating_icon_color'] = vm.recsys.rating_icon_color
        template['highlighted_rating_icon_color'] = vm.recsys.highlighted_rating_icon_color
        template['rating_icon_fontsize'] = vm.recsys.rating_icon_fontsize
        template['rating_states'] = formatRatingStates($scope.ratingStates)

        template['template_number'] = $scope.slickCurrentIndex
        template['item_fields_include'] = $scope.models.lists.roles.filter(function(item){return $scope.rolesChecked[item.label] == true}).map(function(item){ return item.label})
        template['item_fields_order'] = $scope.models.lists.roles.map(function(item){ return item.label})
        template['item_width'] = '280px'

        template['use_field_selection'] = true
        template['field_selection_column_name'] = ''

        template['filter_fields'] = $scope.filterModel.values.filter(function(field){return $scope.filterChecked[field.label] == true}).map(function(field){ return field.label})
        
        console.log($scope.filterChecked, $scope.filterModel.values)
        console.log(template['filter_fields'])

        vm.recsys.template = JSON.stringify(template)
        console.log(vm.recsys.template)
 
        onSubmit()
    }

    $scope.dynamicPopover = {
        content: '',
        title: 'Edit Icon',
        url: 'myPopoverTemplate',
    }

    vm.toggleEditIcon = function() {
        vm.showingEachIcon = !vm.showingEachIcon
    }

    $scope.iconValues = recsysService.iconValues
    $scope.popularIconValues = recsysService.popularIconValues 
    //$scope.popularIconValues.splice(0,0,"icon-emo-happy")

    vm.changeRatingState = function(index, value, state) {
        if (index == 'all') {
            for (var i=0; i < 5; i++) {
                if (state == 'on') {
                    $scope.ratingStates[i].stateOn = value
                } else if (state == 'off') {
                    $scope.ratingStates[i].stateOff = value
                }
            }
        } else {
            if (state == 'on') {
                $scope.ratingStates[index].stateOn = value
            } else if (state == 'off') {
                $scope.ratingStates[index].stateOff = value
            }
        }
    }

    vm.deleteRecsys = function() {
        // start delete button animation
        $('#deleteButton').prop("disabled",true)
        $('#deleteButtonText').text(' Deleting...')
        $('#deleteButtonLoading').addClass('fa fa-spinner spinning') 
        tableService.deleteRecsys(vm.recsys_id).then(function(result){
            console.log(result)
            // if (result.my_url_error == true) {
            //     $scope.urlErrorMessage = result.message
            //     $timeout(function(){
            //         $scope.$digest()
            //     })
            //     console.log($scope.urlErrorMessage)
            // } else {
                $('#deleteButton').prop("disabled",false)
                $('#deleteButtonText').text('Delete Forever')
                $('#deleteButtonLoading').removeClass('fa fa-spinner spinning')
                $('#deleteModal').modal('hide');
                $('body').removeClass('modal-open');
                $('.modal-backdrop').remove();
                $state.go('home.table', {}, {reload: true});
                // $mdToast.show(
                //     $mdToast.simple()
                //       .textContent("Delete Successful")
                //       .position('bottom right')
                //       .theme('success-toast')
                //       .hideDelay(3000)
                //   )
            //}
        })

    }

    vm.pauseRecsys = function() {
        vm.recsys.status = "paused"
        onSubmit()

        $('#pauseModal').modal('hide');
        $('body').removeClass('modal-open');
        $('.modal-backdrop').remove();

        $state.go('home.table', {}, {reload: true});
    }

    vm.startRecsys = function() {
        vm.recsys.status = "active"
        onSubmit()

        $('#startModal').modal('hide');
        $('body').removeClass('modal-open');
        $('.modal-backdrop').remove();

        $state.go('home.table', {}, {reload: true});
    }

    $scope.check = function(value){
        if ($scope.rolesChecked[value] != true) {
            $scope.rolesChecked[value] = true
        } else {
            delete $scope.rolesChecked[value]
        }
        console.log(value)
    }

    
/*
    vm.filterFieldsNumerical = [
        {
            key: 'numerical_range',
            type: 'range-slider',
            templateOptions: {
                type: 'text',
                label: 'Numerical Range',
                placeholder: '',
                required: false,
                sliderOptions:{
                    "floor": 2,
                    "ceil": 30
                },
            }
        },
    ];

    vm.filterFieldsQualitative = [
        {
            key: 'qualitative_count',
            type: 'slider',
            templateOptions: {
                type: 'text',
                label: 'Number of Values To Include',
                placeholder: '',
                required: false,
                sliderOptions:{
                    "floor": 2,
                    "ceil": 30
                },
            }
        },
    ];
/*/


    // TODO; set high low for range sliders in templates

   /* vm.currentFilterTemplate = {}
    $scope.filterTemplates = {}
    
    function setFilterTemplates(values) {
        for (var i in values) {
            $scope.filterTemplates[values[i].label] = {}
        }
    }
*/
    $scope.filterChecked = {}

    $scope.filterModel = {
        selected: '',
        values: []
    }
/*
    vm.changeToNumerical = function() {
        vm.currentFilterTemplate.type = 'numerical'
    }
    
    vm.changeToQualitative = function() {
        vm.currentFilterTemplate.type = 'qualitative'
    }

    $scope.switchFilterTemplate = function(name) {
        vm.currentFilterTemplate = $scope.filterTemplates[name]
    }
  */ 
    $scope.filterCheck = function(value) {
        if ($scope.filterChecked[value] != true) {
            $scope.filterChecked[value] = true
        } else {
            delete $scope.filterChecked[value]
        }
        console.log(value)       
    }
 
    $scope.getFilterStyle = function(value) {
        if ($scope.filterChecked[value] == true) {
            return {'background-color':'#dff0d8'}
        } else {
            return {'background-color':'#fff'}
        }
    }

    $scope.getStyle = function(role) {
        if ($scope.rolesChecked[role] == true) {
            return {'background-color':'#dff0d8'}
        } else {
            return {'background-color':'#fff'}
        }
    }

    $scope.hasHeaders = false
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

    function headerListToOptions(headerList) {
        var options = []
        var option;
        for (var i in headerList) {
            option = {'name':headerList[i], 'value':headerList[i]}
            options.push(option)
        }
        return options
    }

    function enableUploadButton() {
      $('#uploadButton').prop('disabled',false)
      $('#uploadButtonText').text('Upload')
      $('#uploadButtonLoading').removeClass('fa fa-spinner spinning')
    }

    function disableUploadButton() {
      $('#uploadButton').prop('disabled',true)
      $('#uploadButtonText').text(' Uploading...')
      $('#uploadButtonLoading').addClass('fa fa-spinner spinning')
    }

    $scope.errorMessage = {'status':'', 'message':''}

    function setErrorMessage(status, message) {
      $scope.errorMessage.status = status
      $scope.errorMessage.message = message
    }

    var fileHeaders;
    var reader;
    function setReader() {
        reader = new FileReader();
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
    }
    setReader();  
  
    $scope.readHeaders = function() {
        setErrorMessage('','')
        var myfile = $('#csvFile')[0].files[0]
        if (myfile == undefined) {
            return
        }
        //console.log(myfile)
        setReader()
        reader.readAsText(myfile)
        $timeout(function() {
          console.log(fileHeaders)
        }, 100)
    }

    $scope.upload = function() {
        $scope.uploadCSV()
        $scope.hasHeaders = false
    }

    $scope.uploadCSV = function() {
        var file = $('#csvFile')[0].files[0]
        if (Object.keys(vm.headers).length == 0) { // TODO: determine which headers are required
          setErrorMessage("missing_header", "Missing CSV headers")
          return
        }

        disableUploadButton()

        $timeout(function() {
          if (reader.readyState == 2) {
            //$scope.$parent.itemDeferred = $q.defer()
            //$scope.$parent.itemPromise = $scope.$parent.itemDeferred.promise

            Upload.upload({
                url: config.server_url+'/re-csv/',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRFToken': $cookies.get('csrftoken'),
                },
                data: {'file': file, 'username': $cookies.get('k_username'), 'headers':JSON.stringify(vm.headers), 'recsys_id': vm.recsys_id},
            }).then(function (response) {
                console.log('Success ' + response.config.data.file.name + ' uploaded. Response: ' + response.data);
                setErrorMessage('','')
                $scope.showFieldSelection = true
                enableUploadButton()
                $scope.$parent.loadRecsysList()
                $('#myModal').modal('toggle');
                $mdToast.show(
                    $mdToast.simple()
                      .textContent("Update Successful")
                      .position('bottom right')
                      .theme('success-toast')
                      .hideDelay(3000)
                )

            }, function (response) {
                console.log('Error status: ' + response.status);
                //$scope.$parent.itemDeferred.resolve('resolved')
                setErrorMessage(response.data.status, response.data.message)
                enableUploadButton()
                $mdToast.show(
                   $mdToast.simple()
                     .textContent("Update Error")
                     .position('bottom right')
                     .theme('error-toast')
                     .hideDelay(6000)
                 )
            }, function (evt) {
                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
            });
          } else {
            console.log("failed to read file in time")

          }
        }, 200); // NOTE: should loop: sleep then check ready status

    }

    tinymce.init({
        mode : "exact",
        elements : "item-card-demo"
    });
}

})();
