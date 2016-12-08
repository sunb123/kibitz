(function(){

  angular
       .module('app')
       .controller('RecsysController', [
          'navService', 'tableService', 'loginService', '$mdSidenav', '$mdBottomSheet', '$log', '$q', '$state', '$mdToast',
          '$stateParams','$scope', '$cookies', '$timeout', '$rootScope',
          RecsysController
       ])

    angular.module('app').run(function(formlyConfig) {

      var ngModelAttrs = {};

      function camelize(string) {
        string = string.replace(/[\-_\s]+(.)?/g, function(match, chr) {
          return chr ? chr.toUpperCase() : '';
        });
        // Ensure 1st char is always lowercase
        return string.replace(/^([A-Z])/, function(match, chr) {
          return chr ? chr.toLowerCase() : '';
        });
      }

      /*
      colorpicker
      */

      ngModelAttrs = {};

      // attributes
      angular.forEach([
        'color-picker-format',
        'color-picker-alpha',
        'color-picker-swatch',
        'color-picker-swatch-pos',
        'color-picker-swatch-bootstrap',
        'color-picker-swatch-only',
        'color-picker-pos',
        'color-picker-case'
      ], function(attr) {
        ngModelAttrs[camelize(attr)] = {attribute: attr};
      });

      formlyConfig.setType({
        name: 'colorpicker',
        template: '<color-picker ng-model="model[options.key]"></color-picker>',
        wrapper: ['bootstrapLabel', 'bootstrapHasError'],
        defaultOptions: {
          ngModelAttrs: ngModelAttrs
        }
      });
    })

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
    $stateParams, $scope, $cookies, $timeout, $rootScope) {

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

    vm.templateTab = function() {
        vm.tabSetting = 'template'
    }

    vm.isGeneralTab = function() {
        return vm.tabSetting == 'general'
    }

    vm.isAdvancedTab = function() {
        return vm.tabSetting == 'advanced'
    }

    vm.isTemplateTab = function() {
        return vm.tabSetting == 'template'
    }

    vm.setAsActive = function(tab) {
        if (tab == 'general') {
            vm.tabSetting = 'general'
        } else if (tab == 'advanced') {
            vm.tabSetting = 'advanced'
        } else if (tab == 'template') {
            vm.tabSetting = 'template'
        }
    }



    $scope.number1 = [1, 2, 3, 4, 5, 6, 7, 8];
    $scope.slickConfig1Loaded = true;
    $scope.updateNumber1 = function () {
      $scope.slickConfig1Loaded = false;
      $scope.number1[2] = '123';
      $scope.number1.push(Math.floor((Math.random() * 10) + 100));
      $timeout(function () {
        $scope.slickConfig1Loaded = true;
      }, 5);
    };

    $scope.slickCurrentIndex = 0;
    $scope.slickConfig = {
      dots: true,
      autoplay: false,
      initialSlide: 0,
      infinite: true,
      autoplaySpeed: 4000,
      method: {},
      arrows: true,
      event: {
        beforeChange: function (event, slick, currentSlide, nextSlide) {
          console.log('before change', Math.floor((Math.random() * 10) + 100));
        },
        afterChange: function (event, slick, currentSlide, nextSlide) {
          $scope.slickCurrentIndex = currentSlide;
        },
        breakpoint: function (event, slick, breakpoint) {
          console.log('breakpoint');
        },
        destroy: function (event, slick) {
          console.log('destroy');
        },
        edge: function (event, slick, direction) {
          console.log('edge');
        },
        reInit: function (event, slick) {
          console.log('re-init');
        },
        init: function (event, slick) {
          console.log('init');
        },
        setPosition: function (evnet, slick) {
          console.log('setPosition');
        },
        swipe: function (event, slick, direction) {
          console.log('swipe');
        }
      }
    };

    var json = JSON.parse('{"a":1}')
    console.log(json)



    $scope.models = {
        selected: null,
        lists: {"A": [], "B": []}
    };

    // Generate initial model
    $scope.models.lists.A = [{label:"Title"},{label:"Description"},{label:"Author"}]
    $scope.models.lists.B = [{label:"Genre"},{label:"Tags"},{label:"Published Year"}]


    // Model to JSON for demo purpose
    $scope.$watch('models', function(model) {
        $scope.modelAsJson = angular.toJson(model, true);
    }, true);

    $scope.list = $scope.models.lists.A




    function onSubmit() {
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


    $scope.customItems = [
      { size: { x: 1, y: 2 }, position: [0, 0], name: "bob" },
      // { size: { x: 1, y: 1 }, position: [0, 1], name: "jim" },
      // { size: { x: 1, y: 1 }, position: [0, 2] },
      { size: { x: 2, y: 1 }, position: [1, 0], name: "jim" },
      // { size: { x: 1, y: 1 }, position: [1, 1] },
      // { size: { x: 1, y: 1 }, position: [1, 2] },
      // { size: { x: 2, y: 1 }, position: [2, 0] },
      // { size: { x: 1, y: 1 }, position: [2, 1] },
      // { size: { x: 1, y: 1 }, position: [2, 2] },
    ];

    // title, (description), author, genre, rating,

    $scope.customItemMap = {
        sizeX: 'item.size.x',
        sizeY: 'item.size.y',
        row: 'item.position[0]',
        col: 'item.position[1]',
        minSizeY: 'item.minSizeY',
        maxSizeY: 'item.maxSizeY',
        name: 'item.name',
    };

    $scope.gridsterOpts = {
      width: 1000,
      colWidth: 100,
      resizable: {enabled: false},
      pushing: false,
      swapping: true,

      columns: 2,
      maxRows: 3,

    }

    $scope.saveItemConfig = function() {

    }

    $scope.showConfig = function() {
      console.log($scope.customItems)
    }



    vm.cssUpload = tableService.updateCSSFile;
    // vm.cssText = tableService.getCSSFile(vm.recsys_id)

    vm.model = $stateParams.model
    vm.recsys_id = $stateParams.id

    function repoListToOptions(repoList) {
        var options = []
        var option;
        for (var i in repoList) {
            option = {'name':repoList[i].repo_name, 'value':repoList[i].repo_name, 'owner': repoList[i].owner}
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
        var repos = repoListToOptions(vm.repoList)
        vm.recsysFieldsAdv[0].templateOptions.options = repos
    })

    $scope.$watch('vm.recsys.repo_name', function(newVal, oldVal){
        if (newVal != '' & newVal != null) {
            tableService.getTableList($cookies.get('username'), newVal).then(function(result) {
                vm.tableList = result.tables
                var tables = tableListToOptions(vm.tableList)
                vm.recsysFieldsAdv[1].templateOptions.options = tables
                vm.recsysFieldsAdv[2].templateOptions.options = tables
                vm.recsysFieldsAdv[3].templateOptions.options = tables
            })
        }
    })

    tableService.getRecsys(vm.recsys_id).then(function(result) {
        for(key in result) {
            vm.recsys[key] = result[key]
        }
        vm.recsysFields[0].templateOptions.options = repoListToOptions(vm.repoList)
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
        // {
        //     key: 'repo_name',
        //     type: 'select',
        //     templateOptions: {
        //         type: 'text',
        //         label: 'Repository Name',
        //         placeholder: 'Enter the repository name',
        //         required: true,
        //         options: [],
        //     }
        // },
        // {
        //     key: 'item_table_name',
        //     type: 'select',
        //     templateOptions: {
        //         type: 'text',
        //         label: 'Items Table Name',
        //         placeholder: 'Enter the table name. These are the items.',
        //         required: false,
        //         options: [],
        //     }
        // },
        // {
        //     key: 'rating_table_name',
        //     type: 'select',
        //     templateOptions: {
        //         type: 'text',
        //         label: 'Ratings Table Name',
        //         placeholder: 'Enter the table name. These are the ratings.',
        //         required: false,
        //         options: [],
        //     }
        // },
        // {
        //     key: 'user_table_name',
        //     type: 'select',
        //     templateOptions: {
        //         type: 'text',
        //         label: 'Users Table Name',
        //         placeholder: 'Enter the table name. These are the users.',
        //         required: false,
        //         options: [],
        //     }
        // },
    ];

    vm.recsysFieldsAdv = [
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
    ];

    vm.recsys = {
      color1: 'hsl(0,0,0)',
      color2: '#DC5E5E',
      color3: 'rgb(13, 169, 108)',
      rating_icon_fontsize: 14
    };

    vm.recsysFieldsTemplate = [
      {
        key: 'color1',
        type: 'colorpicker',
        templateOptions: {
          label: 'Rating Icon Color',
          colorPickerFormat: "'hex'",
          colorPickerAlpha: true,
          colorPickerPos: "'top left'",
          colorPickerSwatchBootstrap: false
        }
      },
      {
        "key": "rating_icon_fontsize",
        "type": "slider",
        "templateOptions": {
          "label": "Rating Icon Font Size",
          "sliderOptions": {
            "floor": 2,
            "ceil": 40
          }
        }
      },
        {
            key: 'state_on',
            type: 'select',
            templateOptions: {
                type: 'text',
                label: 'Highlighted Rating Icon',
                placeholder: 'placeholder',
                required: false,
                options: [
                    {name: 'star', value: 'glyphicon glyphicon-star'},
                    {name: 'heart', value: 'glyphicon glyphicon-heart'},
                    {name: 'check', value: 'glyphicon glyphicon-ok-sign'}
                ],
            }
        },
                {
            key: 'state_off',
            type: 'select',
            templateOptions: {
                type: 'text',
                label: 'Unhighlighted Rating Icon',
                placeholder: 'placeholder',
                required: false,
                options: [
                    {name: 'star', value: 'glyphicon glyphicon-star-empty'},
                    {name: 'heart', value: 'glyphicon glyphicon-heart-empty'},
                    {name: 'check', value: 'glyphicon glyphicon-ok-circle'}
                ],
            }
        },

    ];

    $scope.stateOnRatingIcon = 'glyphicon glyphicon-star';
    $scope.stateOffRatingIcon = 'glyphicon glyphicon-star-empty';

    // $scope.ratingStates = [
    //     {stateOn: 'glyphicon glyphicon-heart', stateOff: 'glyphicon glyphicon-star-empty'},
    //     {stateOn: 'glyphicon glyphicon-star', stateOff: 'glyphicon glyphicon-star-empty'},
    //     {stateOn: 'glyphicon glyphicon-star', stateOff: 'glyphicon glyphicon-star-empty'},
    //     {stateOn: 'glyphicon glyphicon-star', stateOff: 'glyphicon glyphicon-star-empty'},
    //     {stateOn: 'glyphicon glyphicon-star', stateOff: 'glyphicon glyphicon-star-empty'}
    //   ];

    vm.submitTemplateSettings = function() {
        $scope.stateOnRatingIcon = vm.recsys.state_on
        $scope.stateOffRatingIcon = vm.recsys.state_off

        $timeout(function(){
            $rootScope.$broadcast('rate');
            $('.rating-icon').css('color', vm.recsys.color1)
            $('.rating-icon').css('font-size', vm.recsys.rating_icon_fontsize)
            //console.log(vm.recsys)
        })
    }

    $scope.hoveringOver = function(value) {
      $scope.overStar = value;
    };

    $scope.myimage = 'http://thebookmusings.com/wp-content/uploads/2013/01/count-of-monte-cristo.jpg'
    $scope.mytitle = 'The Count of Monte Cristo'
    $scope.rating = 4
    $scope.showingRating = true

    $scope.description = 'hello testing'

    $scope.item_details = "<fieldset> \
    <div class='row control-group'> \
      <div class='col-xs-4 display-label'>Author</div><div class='col-xs-8 display-value'>Alexander Dumas</div></div> \
    <div class='row control-group'> \
      <div class='col-xs-4 display-label'>Genre</div><div class='col-xs-8 display-value'>Fiction</div> \
    </div> \
    </fieldset>";

    $scope.ratings_template = '<fieldset> \
    <div class="star-rating"> Your Rating: \
  <span class="fa fa-star" data-rating="1"></span>\
  <span class="fa fa-star" data-rating="2"></span>\
  <span class="fa fa-star" data-rating="3"></span>\
  <span class="fa fa-star-o" data-rating="4"></span>\
  <span class="fa fa-star-o" data-rating="5"></span>\
  <input type="hidden" name="whatever" class="rating-value" value="3">\
</div>\
        <div class="input-group"><span>5 Stars</span><meter id="meter-5-star" value=".75"></meter><span>70%</span></div> \
        <div><span>4 Stars</span><meter id="meter-4-star" value=".25"></meter><span>20%</span></div> \
        <div><span>3 Stars</span><meter id="meter-3-star" value=".25"></meter><span>20%</span></div> \
        <div><span>2 Stars</span><meter id="meter-2-star" value="1"></meter><span>100%</span></div> \
        <div><span>1 Stars</span><meter id="meter-1-star" value=".5"></meter><span>50%</span></div>';

    tinymce.init({
        mode : "exact",
        elements : "item-card-demo"
    });

}

})();