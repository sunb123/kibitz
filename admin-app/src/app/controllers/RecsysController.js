(function(){

  angular
       .module('app')
       .controller('RecsysController', [
          'navService', 'tableService', 'loginService', 'recsysService', '$mdSidenav', '$mdBottomSheet', '$log', '$q', '$state', '$mdToast',
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

    formlyConfig.setWrapper([
      {
        name: 'panel',
        templateUrl: 'panel.html'
      },
    ]);

  });

  function RecsysController(navService, tableService, loginService, recsysService, $mdSidenav, $mdBottomSheet, $log, $q, $state, $mdToast,
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
            return $scope.ratingStates[index].stateOn + ' edit-icon'
        } else {
            return $scope.ratingStates[0].stateOn + ' edit-icon'
        }
    }

    vm.getOffClass = function(index) {
        if (index != null) {
            return $scope.ratingStates[index].stateOff + ' edit-icon'
        } else {
            return $scope.ratingStates[0].stateOff + ' edit-icon'
        }
    }

    vm.recsys = {
        rating_icon_color: 'hsl(0, 0%, 0%)',
        highlighted_rating_icon_color: 'hsl(0, 100%, 50%)',
        rating_icon_fontsize: 14,
        item_fields_include: ["title"]
    }
    $scope.ratingStates = [{stateOn: 'fa fa-star', stateOff: 'fa fa-star-o'},
                        {stateOn: 'fa fa-star', stateOff: 'fa fa-star-o'},
                        {stateOn: 'fa fa-star', stateOff: 'fa fa-star-o'},
                        {stateOn: 'fa fa-star', stateOff: 'fa fa-star-o'},
                        {stateOn: 'fa fa-star', stateOff: 'fa fa-star-o'}]

    vm.repoList = []
    vm.model = $stateParams.model
    vm.recsys_id = $stateParams.id
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
        var list = $scope.roles
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

    function setRecsys(recsys_id) {
        var recsysFields = getRecsysFields(vm.recsys_id)
        for(key in recsysFields) {
            vm.recsys[key] = recsysFields[key]
        }

        $scope.myStyle = {}

        vm.repoList = $scope.$parent.repos
        vm.recsysFieldsAdv[0].templateOptions.options = vm.repoList
        vm.item_table_columns = getItemFields()

        $scope.roles = []
        if (vm.item_table_columns != null && vm.item_table_columns != []) {
            for (var i=0; i < vm.item_table_columns.length; i++) {
                $scope.roles.push({label: vm.item_table_columns[i].column_name })
            }
        }
        $scope.roles = $scope.roles.map(function(x){return x.label})
    }

    $scope.$watch('vm.recsys.repo_name', function(newVal, oldVal){ // records at value not option dict
        if (newVal != '' && newVal != null && vm.repoList != []) {
            vm.tableList = tableService.tableListToOptions(getTables(newVal))
            console.log(vm.tableList)
            vm.recsysFieldsAdv[1].templateOptions.options = vm.tableList
            console.log(getTables(newVal))
        }
    })

    $scope.$watch('vm.recsys.item_table_name', function(newVal, oldVal){ // records at value not option dict
        if (newVal != '' && newVal != null && vm.tableList != []) {
            vm.columnList = tableService.columnListToOptions(getColumns(newVal))
            for (var i=2; i < 7; i++) { // number of fields
                vm.recsysFieldsAdv[i].templateOptions.options = vm.columnList
            }
        }
    })

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

    $scope.roles = []
    $scope.user = {
        roles: []
    };
    $scope.rolesChecked = {}

    $scope.$parent.itemDeferred.promise.then(function() {
      var recsysFields = getRecsysFields(vm.recsys_id)
      vm.recsys.name = recsysFields.name
      vm.recsys.url_name = recsysFields.url_name
      vm.template = vm.getTemplate(recsysFields.template)
      loadTemplate(vm.template)
    })

    $scope.$parent.reposDeferred.promise.then(function(){
        setRecsys(vm.recsys_id)
    })


    // TODO: edit which item field to create clickable filter on
    // drop down list with none option
    function loadTemplate(template) {
        vm.recsys.rating_icon_color = template.rating_icon_color != undefined ? template.rating_icon_color : vm.recsys.rating_icon_color
        vm.recsys.highlighted_rating_icon_color = template.highlighted_rating_icon_color != undefined ? template.highlighted_rating_icon_color : vm.recsys.highlighted_rating_icon_color
        vm.recsys.rating_icon_fontsize = template.rating_icon_fontsize != undefined ? template.rating_icon_fontsize : vm.recsys.rating_icon_fontsize
        $scope.ratingStates = template.rating_states != undefined ? template.rating_states : $scope.ratingStates
        $scope.slickCurrentIndex = template.template_number != undefined ? template.template_number : $scope.slickCurrentIndex
        $scope.user.roles = template.item_fields_include != undefined ? template.item_fields_include : vm.recsys.item_fields_include

        console.log(template)
    }

    $scope.hoveringOver = function(value) {
      $scope.overStar = value;
    };

    $scope.myimage = 'http://thebookmusings.com/wp-content/uploads/2013/01/count-of-monte-cristo.jpg'
    $scope.mytitle = 'The Count of Monte Cristo'
    $scope.rating = 4
    //$scope.showingRated = true

    $scope.description = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum odio magna, sagittis vel rhoncus a, molestie sed nulla.'

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

    function capitalize(word) {
      return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
    }

    // TODO: fetch first item in item list
    $scope.item_details_func = function(item) {
        var itemDetails = ['title', 'description'] //$scope.$parent.template.item_fields_include
        var field;
        var item_template = "<fieldset>"
        for (i in itemDetails) {
            field = itemDetails[i]
            value = item[field]
            item_template += "<div class='row control-group'><div class='col-xs-4 display-label'>{0}</div> \
            <div class='col-xs-8 display-value'>{1}</div></div>".format(capitalize(field), value)
        }
        item_template += "</fieldset>"
        return item_template
    }

    $scope.item_details = $scope.item_details_func({title: 'Alexander Dumas', description: 'Test description', genre: 'fiction'})

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
        })
    }

    $scope.saveTemplate = function() {
        var template = {}
        template['rating_icon_color'] = vm.recsys.rating_icon_color
        template['highlighted_rating_icon_color'] = vm.recsys.highlighted_rating_icon_color
        template['rating_icon_fontsize'] = vm.recsys.rating_icon_fontsize
        template['rating_states'] = $scope.ratingStates

        template['template_number'] = $scope.slickCurrentIndex
        template['item_fields_include'] = $scope.user.roles

        template['item_width'] = '280px'

        template['use_field_selection'] = true
        template['field_selection_column_name'] = ''

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

    $scope.iconValues = ["fa-adjust", "fa-adn", "fa-align-center", "fa-align-justify", "fa-align-left", "fa-align-right", "fa-ambulance", "fa-anchor", "fa-android", "fa-angellist", "fa-angle-double-down", "fa-angle-double-left", "fa-angle-double-right", "fa-angle-double-up", "fa-angle-down", "fa-angle-left", "fa-angle-right", "fa-angle-up", "fa-apple", "fa-archive", "fa-area-chart", "fa-arrow-circle-down", "fa-arrow-circle-left", "fa-arrow-circle-o-down", "fa-arrow-circle-o-left", "fa-arrow-circle-o-right", "fa-arrow-circle-o-up", "fa-arrow-circle-right", "fa-arrow-circle-up", "fa-arrow-down", "fa-arrow-left", "fa-arrow-right", "fa-arrow-up", "fa-arrows", "fa-arrows-alt", "fa-arrows-h", "fa-arrows-v", "fa-asterisk", "fa-at", "fa-automobile", "fa-backward", "fa-ban", "fa-bank", "fa-bar-chart", "fa-bar-chart-o", "fa-barcode", "fa-bars", "fa-bed", "fa-beer", "fa-behance", "fa-behance-square", "fa-bell", "fa-bell-o", "fa-bell-slash", "fa-bell-slash-o", "fa-bicycle", "fa-binoculars", "fa-birthday-cake", "fa-bitbucket", "fa-bitbucket-square", "fa-bitcoin", "fa-bold", "fa-bolt", "fa-bomb", "fa-book", "fa-bookmark", "fa-bookmark-o", "fa-briefcase", "fa-btc", "fa-bug", "fa-building", "fa-building-o", "fa-bullhorn", "fa-bullseye", "fa-bus", "fa-buysellads", "fa-cab", "fa-calculator", "fa-calendar", "fa-calendar-o", "fa-camera", "fa-camera-retro", "fa-car", "fa-caret-down", "fa-caret-left", "fa-caret-right", "fa-caret-square-o-down", "fa-caret-square-o-left", "fa-caret-square-o-right", "fa-caret-square-o-up", "fa-caret-up", "fa-cart-arrow-down", "fa-cart-plus", "fa-cc", "fa-cc-amex", "fa-cc-discover", "fa-cc-mastercard", "fa-cc-paypal", "fa-cc-stripe", "fa-cc-visa", "fa-certificate", "fa-chain", "fa-chain-broken", "fa-check", "fa-check-circle", "fa-check-circle-o", "fa-check-square", "fa-check-square-o", "fa-chevron-circle-down", "fa-chevron-circle-left", "fa-chevron-circle-right", "fa-chevron-circle-up", "fa-chevron-down", "fa-chevron-left", "fa-chevron-right", "fa-chevron-up", "fa-child", "fa-circle", "fa-circle-o", "fa-circle-o-notch", "fa-circle-thin", "fa-clipboard", "fa-clock-o", "fa-close", "fa-cloud", "fa-cloud-download", "fa-cloud-upload", "fa-cny", "fa-code", "fa-code-fork", "fa-codepen", "fa-coffee", "fa-cog", "fa-cogs", "fa-columns", "fa-comment", "fa-comment-o", "fa-comments", "fa-comments-o", "fa-compass", "fa-compress", "fa-connectdevelop", "fa-copy", "fa-copyright", "fa-credit-card", "fa-crop", "fa-crosshairs", "fa-css3", "fa-cube", "fa-cubes", "fa-cut", "fa-cutlery", "fa-dashboard", "fa-dashcube", "fa-database", "fa-dedent", "fa-delicious", "fa-desktop", "fa-deviantart", "fa-diamond", "fa-digg", "fa-dollar", "fa-dot-circle-o", "fa-download", "fa-dribbble", "fa-dropbox", "fa-drupal", "fa-edit", "fa-eject", "fa-ellipsis-h", "fa-ellipsis-v", "fa-empire", "fa-envelope", "fa-envelope-o", "fa-envelope-square", "fa-eraser", "fa-eur", "fa-euro", "fa-exchange", "fa-exclamation", "fa-exclamation-circle", "fa-exclamation-triangle", "fa-expand", "fa-external-link", "fa-external-link-square", "fa-eye", "fa-eye-slash", "fa-eyedropper", "fa-facebook", "fa-facebook-f", "fa-facebook-official", "fa-facebook-square", "fa-fast-backward", "fa-fast-forward", "fa-fax", "fa-female", "fa-fighter-jet", "fa-file", "fa-file-archive-o", "fa-file-audio-o", "fa-file-code-o", "fa-file-excel-o", "fa-file-image-o", "fa-file-movie-o", "fa-file-o", "fa-file-pdf-o", "fa-file-photo-o", "fa-file-picture-o", "fa-file-powerpoint-o", "fa-file-sound-o", "fa-file-text", "fa-file-text-o", "fa-file-video-o", "fa-file-word-o", "fa-file-zip-o", "fa-files-o", "fa-film", "fa-filter", "fa-fire", "fa-fire-extinguisher", "fa-flag", "fa-flag-checkered", "fa-flag-o", "fa-flash", "fa-flask", "fa-flickr", "fa-floppy-o", "fa-folder", "fa-folder-o", "fa-folder-open", "fa-folder-open-o", "fa-font", "fa-forumbee", "fa-forward", "fa-foursquare", "fa-frown-o", "fa-futbol-o", "fa-gamepad", "fa-gavel", "fa-gbp", "fa-ge", "fa-gear", "fa-gears", "fa-genderless", "fa-gift", "fa-git", "fa-git-square", "fa-github", "fa-github-alt", "fa-github-square", "fa-gittip", "fa-glass", "fa-globe", "fa-google", "fa-google-plus", "fa-google-plus-square", "fa-google-wallet", "fa-graduation-cap", "fa-gratipay", "fa-group", "fa-h-square", "fa-hacker-news", "fa-hand-o-down", "fa-hand-o-left", "fa-hand-o-right", "fa-hand-o-up", "fa-hdd-o", "fa-header", "fa-headphones", "fa-heart", "fa-heart-o", "fa-heartbeat", "fa-history", "fa-home", "fa-hospital-o", "fa-hotel", "fa-html5", "fa-ils", "fa-image", "fa-inbox", "fa-indent", "fa-info", "fa-info-circle", "fa-inr", "fa-instagram", "fa-institution", "fa-ioxhost", "fa-italic", "fa-joomla", "fa-jpy", "fa-jsfiddle", "fa-key", "fa-keyboard-o", "fa-krw", "fa-language", "fa-laptop", "fa-lastfm", "fa-lastfm-square", "fa-leaf", "fa-leanpub", "fa-legal", "fa-lemon-o", "fa-level-down", "fa-level-up", "fa-life-bouy", "fa-life-buoy", "fa-life-ring", "fa-life-saver", "fa-lightbulb-o", "fa-line-chart", "fa-link", "fa-linkedin", "fa-linkedin-square", "fa-linux", "fa-list", "fa-list-alt", "fa-list-ol", "fa-list-ul", "fa-location-arrow", "fa-lock", "fa-long-arrow-down", "fa-long-arrow-left", "fa-long-arrow-right", "fa-long-arrow-up", "fa-magic", "fa-magnet", "fa-mail-forward", "fa-mail-reply", "fa-mail-reply-all", "fa-male", "fa-map-marker", "fa-mars", "fa-mars-double", "fa-mars-stroke", "fa-mars-stroke-h", "fa-mars-stroke-v", "fa-maxcdn", "fa-meanpath", "fa-medium", "fa-medkit", "fa-meh-o", "fa-mercury", "fa-microphone", "fa-microphone-slash", "fa-minus", "fa-minus-circle", "fa-minus-square", "fa-minus-square-o", "fa-mobile", "fa-mobile-phone", "fa-money", "fa-moon-o", "fa-mortar-board", "fa-motorcycle", "fa-music", "fa-navicon", "fa-neuter", "fa-newspaper-o", "fa-openid", "fa-outdent", "fa-pagelines", "fa-paint-brush", "fa-paper-plane", "fa-paper-plane-o", "fa-paperclip", "fa-paragraph", "fa-paste", "fa-pause", "fa-paw", "fa-paypal", "fa-pencil", "fa-pencil-square", "fa-pencil-square-o", "fa-phone", "fa-phone-square", "fa-photo", "fa-picture-o", "fa-pie-chart", "fa-pied-piper", "fa-pied-piper-alt", "fa-pinterest", "fa-pinterest-p", "fa-pinterest-square", "fa-plane", "fa-play", "fa-play-circle", "fa-play-circle-o", "fa-plug", "fa-plus", "fa-plus-circle", "fa-plus-square", "fa-plus-square-o", "fa-power-off", "fa-print", "fa-puzzle-piece", "fa-qq", "fa-qrcode", "fa-question", "fa-question-circle", "fa-quote-left", "fa-quote-right", "fa-ra", "fa-random", "fa-rebel", "fa-recycle", "fa-reddit", "fa-reddit-square", "fa-refresh", "fa-remove", "fa-renren", "fa-reorder", "fa-repeat", "fa-reply", "fa-reply-all", "fa-retweet", "fa-rmb", "fa-road", "fa-rocket", "fa-rotate-left", "fa-rotate-right", "fa-rouble", "fa-rss", "fa-rss-square", "fa-rub", "fa-ruble", "fa-rupee", "fa-save", "fa-scissors", "fa-search", "fa-search-minus", "fa-search-plus", "fa-sellsy", "fa-send", "fa-send-o", "fa-server", "fa-share", "fa-share-alt", "fa-share-alt-square", "fa-share-square", "fa-share-square-o", "fa-shekel", "fa-sheqel", "fa-shield", "fa-ship", "fa-shirtsinbulk", "fa-shopping-cart", "fa-sign-in", "fa-sign-out", "fa-signal", "fa-simplybuilt", "fa-sitemap", "fa-skyatlas", "fa-skype", "fa-slack", "fa-sliders", "fa-slideshare", "fa-smile-o", "fa-soccer-ball-o", "fa-sort", "fa-sort-alpha-asc", "fa-sort-alpha-desc", "fa-sort-amount-asc", "fa-sort-amount-desc", "fa-sort-asc", "fa-sort-desc", "fa-sort-down", "fa-sort-numeric-asc", "fa-sort-numeric-desc", "fa-sort-up", "fa-soundcloud", "fa-space-shuttle", "fa-spinner", "fa-spoon", "fa-spotify", "fa-square", "fa-square-o", "fa-stack-exchange", "fa-stack-overflow", "fa-star", "fa-star-half", "fa-star-half-empty", "fa-star-half-full", "fa-star-half-o", "fa-star-o", "fa-steam", "fa-steam-square", "fa-step-backward", "fa-step-forward", "fa-stethoscope", "fa-stop", "fa-street-view", "fa-strikethrough", "fa-stumbleupon", "fa-stumbleupon-circle", "fa-subscript", "fa-subway", "fa-suitcase", "fa-sun-o", "fa-superscript", "fa-support", "fa-table", "fa-tablet", "fa-tachometer", "fa-tag", "fa-tags", "fa-tasks", "fa-taxi", "fa-tencent-weibo", "fa-terminal", "fa-text-height", "fa-text-width", "fa-th", "fa-th-large", "fa-th-list", "fa-thumb-tack", "fa-thumbs-down", "fa-thumbs-o-down", "fa-thumbs-o-up", "fa-thumbs-up", "fa-ticket", "fa-times", "fa-times-circle", "fa-times-circle-o", "fa-tint", "fa-toggle-down", "fa-toggle-left", "fa-toggle-off", "fa-toggle-on", "fa-toggle-right", "fa-toggle-up", "fa-train", "fa-transgender", "fa-transgender-alt", "fa-trash", "fa-trash-o", "fa-tree", "fa-trello", "fa-trophy", "fa-truck", "fa-try", "fa-tty", "fa-tumblr", "fa-tumblr-square", "fa-turkish-lira", "fa-twitch", "fa-twitter", "fa-twitter-square", "fa-umbrella", "fa-underline", "fa-undo", "fa-university", "fa-unlink", "fa-unlock", "fa-unlock-alt", "fa-unsorted", "fa-upload", "fa-usd", "fa-user", "fa-user-md", "fa-user-plus", "fa-user-secret", "fa-user-times", "fa-users", "fa-venus", "fa-venus-double", "fa-venus-mars", "fa-viacoin", "fa-video-camera", "fa-vimeo-square", "fa-vine", "fa-vk", "fa-volume-down", "fa-volume-off", "fa-volume-up", "fa-warning", "fa-wechat", "fa-weibo", "fa-weixin", "fa-whatsapp", "fa-wheelchair", "fa-wifi", "fa-windows", "fa-won", "fa-wordpress", "fa-wrench", "fa-xing", "fa-xing-square", "fa-yahoo", "fa-yelp", "fa-yen", "fa-youtube", "fa-youtube-play", "fa-youtube-square"]
    for (var i=0; i < $scope.iconValues.length; i++) {
        $scope.iconValues[i] = "fa " + $scope.iconValues[i]
    }
    $scope.popularIconValues = ["fa-heart", "fa-heart-o","fa-star", "fa-star-o", "fa-check", "fa-angellist", "fa-check-circle", "fa-check-circle-o", "fa-check-square", "fa-check-square-o", "fa-arrow-circle-up","fa-arrow-circle-o-up", "fa-arrow-circle-right","fa-arrow-circle-o-right", "fa-arrow-circle-down","fa-arrow-circle-o-down", "fa-arrow-circle-left","fa-arrow-circle-o-left", "fa-bell", "fa-bell-o", "fa-bookmark", "fa-bookmark-o", "fa-circle", "fa-circle-o", "fa-square", "fa-square-o", "fa-play", "fa-play-circle", "fa-play-circle-o", "fa-circle-thin", "fa-plus", "fa-plus-circle", "fa-plus-square", "fa-plus-square-o", "fa-remove", "fa-toggle-on", "fa-toggle-off", "fa-times-circle", "fa-times-circle-o", "fa-minus", "fa-minus-circle", "fa-minus-square", "fa-minus-square-o", "fa-thumbs-up", "fa-thumbs-o-up", "fa-thumbs-down", "fa-thumbs-o-down"                           ]
    for (var i=0; i < $scope.popularIconValues.length; i++) {
        $scope.popularIconValues[i] = "fa " + $scope.popularIconValues[i]
    }
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
        tableService.deleteRecsys(vm.recsys_id).then(function(result){
            console.log(result)
            // if (result.my_url_error == true) {
            //     $scope.urlErrorMessage = result.message
            //     $timeout(function(){
            //         $scope.$digest()
            //     })
            //     console.log($scope.urlErrorMessage)
            // } else {
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

    $scope.check = function(value, checked){
        if (checked) {
            $scope.rolesChecked[value] = true
        } else {
            delete $scope.rolesChecked[value]
        }
    }

    $scope.setCheck = function(role) {
        if ($scope.user.roles.indexOf(role) != -1) {
            $scope.check(role, true)
        }
    }

    $scope.getStyle = function(role) {
        if ($scope.rolesChecked[role]) {
            return {'background-color':'#dff0d8'}
        } else {
            return {'background-color':'#fff'}
        }
    }

    tinymce.init({
        mode : "exact",
        elements : "item-card-demo"
    });

}

})();