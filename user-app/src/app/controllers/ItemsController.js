(function(){

  angular
    .module('app')
    .controller('ItemsController', [
      '$q', 'itemService', 'loginService', '$mdSidenav', '$scope', '$timeout', '$http', 'config', '$state', '$cookies', 
      ItemsController
    ])

  function ItemsController($q, itemService, loginService, $mdSidenav, $scope, $timeout, $http, config, $state, $cookies) {
    var vm = this;

    if (!loginService.loggedIn()) {
      $state.go('home.login');
      return
    }

    vm.tableData = []; // display list
    
    vm.ratedTabData = [];
    vm.searchedList = [];
    vm.wholeRecommendedList = [];

    vm.displayingSearched = false;
    vm.recCount = 0; // iterate index of recommended list
    vm.searchCount = 0 // iterate index of searched list
    vm.ratingCount = 0 // iterate index of rated list
    vm.tabState = $scope.$parent.tabNumber;

    vm.current_page = 0; // 1-index paging
    vm.rows_per_page = 4;
    vm.atEndOfList = false;

    vm.search_page = 0 // 0-index paging
    vm.search_rows_per_page = 100
    
    vm.recs_loaded = false;
    vm.ratings_loaded = false;
    vm.item_paging_loading = false;
    vm.initializingHomeTab = false;
    vm.initializingSearchList = false;

    $scope.sendRating = itemService.sendRating
    $scope.sendNotInterested = itemService.sendNotInterested
    $scope.titles = ['Rate it a one','Rate it a two','Rate it a three','Rate it a four','Rate it a five']

    vm.tmpNotInterestedItemIds = []

    var HOME_TAB = 0    
    var RECOMMEND_TAB = 1
    var RATINGS_TAB = 2


    vm.toggleFilter = function() {
        $mdSidenav('left').toggle(); 
    }

    vm.getFilterParams = $scope.$parent.getFilterParams
    vm.filter_params = {
        sorted_by: '',
        filters: [{
            filter_by: '',
            filter_values: [''],
        }]
    }
 
    vm.pagingFunction = function () { // NOTE: pagingFunction called sequentially off stack. 
        if ($scope.recsys_id == undefined) {
            return
        }
        console.log("called paging")
        var addedCount = 0
        var item, item_id;

        if (vm.displayingSearched) {
             console.log("calling search paging")
             while (addedCount < 4 && vm.searchCount < vm.searchedList.length) {
                 item = vm.searchedList[vm.searchCount]
                 item_id = item[vm.pk_field]
                 if (!hasRating(item_id) && !isRecommended(item_id)) {
                   vm.tableData.push(item);
                   addedCount++;
                 } else {
                   console.log("found rating or rec", item_id)
                 }
                 vm.searchCount++;
             }
        } else if (vm.tabState == RECOMMEND_TAB) {
          if (vm.recs_loaded) {
            console.log("printing recs")
            while (addedCount < 16 && vm.recCount < vm.wholeRecommendedList.length) {
              item = vm.wholeRecommendedList[vm.recCount]
              item_id = item[vm.pk_field]
              if (!hasRating(item_id)) {
                vm.tableData.push(item);
                addedCount++;
              }
              vm.recCount++;
            }
          }
        } else if (vm.tabState == RATINGS_TAB) {
          if (vm.ratings_loaded) {
             while (addedCount < 4 && vm.ratingCount < vm.ratedTabData.length) {
                 item = vm.ratedTabData[vm.ratingCount]
                 vm.tableData.push(item);
                 addedCount++;
                 vm.ratingCount++;
             }
          }
        } else if (!vm.item_paging_loading && !vm.atEndOfList) { // get items from backend
            vm.loadTableRows(vm.getFilterParams())  // async call
        }
    }
    
    vm.checkEndOfList = function() {
        if (vm.displayingSearched) {
            return vm.searchCount < vm.searchedList.length
        } else if (vm.tabState == RECOMMEND_TAB) {
            return vm.recCount < vm.wholeRecommendedList.length
        } else if (vm.tabState == RATINGS_TAB) { 
            return vm.ratingCount < vm.ratedTabData.length
        } else { // home tab
            return !vm.atEndOfList
        }
    }

    function isHomeTab() {
        return vm.tabState == 0 && !vm.displayingSearched
    }

    vm.doInitializeHomeTable = function() {
        if (vm.initializingHomeTab || vm.item_paging_loading) {
            return
        }
        vm.initializingHomeTab = true
        console.log("initilize home table called")
        vm.current_page = 0;
        vm.atEndOfList = false
        vm.tableData = []
        function fnCheck() {
            vm.pagingFunction()
            if (vm.tableData.length >= 4 || !isHomeTab() || vm.atEndOfList) {
                vm.initializingHomeTab = false
                console.log("done initializing home table")
                clearInterval(interval)
            }
        }
        var interval = setInterval(fnCheck, 350)
    }
    
    $scope.$on('reload-home-tab', function(event, args){
        vm.doInitializeHomeTable() 
    })

    vm.loadTableRows = function(filter_params) {
      if (vm.item_paging_loading) {
          return
      }
      vm.item_paging_loading = true;
      vm.current_page += 1
      console.log("increament and call", vm.current_page)

      var params = {
          sorted_by: filter_params.sorted_by,
          filter_by: filter_params.filter_by,
          recsys_id: $scope.recsys_id,
          current_page: vm.current_page,
          rows_per_page: vm.rows_per_page,
      }
      //for (var attrname in filter_params) { params[attrname] = filter_params[attrname]; }
      
      $http({
        method: 'POST',
        headers: { 
            'Accept': 'application/json',
            'Content-Type': 'application/json' 
        },
        url: config.server_url+'/item-paging/',
        data: params,
      }).then(function(resp){
        console.log(resp.data)
        if (resp.data.done == true) {
            vm.atEndOfList = true
        } else {
            var items = resp.data.items
            if (isHomeTab()) { // NOTE: race could still occur if event happens during for loop
              for (i in items) {
                  var item = items[i]
                  var item_id = item[vm.pk_field]
                  if (!hasRating(item_id) && !isRecommended(item_id)) {
                    vm.tableData.push(item);
                  }
              }
              console.log("add items from page",vm.current_page)
            } else {
              console.log("decrement called on success call")
              vm.current_page -= 1
            } 
        }
        vm.item_paging_loading = false;
      }, function(resp){
        console.log(resp)
        console.log("decrement called on failed call")
        vm.current_page -= 1
        vm.item_paging_loading = false;
      })

    }

    vm.hasRecommendations = function() {
      return vm.wholeRecommendedList.length != 0
    }

    function isRecommended(item_id) {
      for (var i=0; i < vm.wholeRecommendedList.length; i++) {
        if (vm.wholeRecommendedList[i]['id'] == item_id) {
          return true
        }
      }
      return false
    }

    function hasRating(item_id) {
      for (var i=0; i < vm.ratedTabData.length; i++) {
        if (vm.ratedTabData[i]['id'] == item_id) {
          return true
        }
      }
      return false
    }

    $scope.hoveringOver = function(value) {
      $scope.overStar = value;
    };

    function getId(item) {
        return item[vm.pk_field]
    }

    function tmpNotInterested(item_id) {
        for (var i in vm.tmpNotInterestedItemIds) {
            if (vm.tmpNotInterestedItemIds[i] == item_id) {
                return true
            }
        }
        return false
    }

    function addToRatingTable(items) {
        for (var i in items) {
           if (!hasRating(getId(items[i]))) {
               vm.ratedTabData.push(items[i])
           } 
        }
    }

    function loadRecs(items) {
        for (var i in items) {
            if (!tmpNotInterested(getId(items[i]))) {
                vm.wholeRecommendedList.push(items[i])
            }
        }
    }

    // customized template fields
/*
    vm.use_field_selection = ''
    vm.field_selection_column_name = ''
*/
    // load recsys and get item data
    $scope.$parent.recsysDeferred.promise.then(function(recsys){
      console.log(recsys)

      vm.recsysPaused = loginService.recsysPaused(recsys)
      if (vm.recsysPaused) {
          return
      }

      vm.recsys = recsys
      vm.pk_field = vm.recsys.primary_key_field
      vm.title_field = vm.recsys.title_field
      vm.description_field = vm.recsys.description_field
      vm.image_link_field = vm.recsys.image_link_field
      vm.univ_code_field = vm.recsys.universal_code_field
      $scope.template = JSON.parse(vm.recsys.template)
      $scope.recsys_id = vm.recsys.id

      console.log($scope.template)

      vm.doInitializeHomeTable()
      
      var deferred = $q.defer();
      $scope.itemPromise = deferred.promise
      
      $http({
        method: 'GET',
        url: config.server_url+'/item/'+'?recsys_id='+$scope.recsys_id,
      }).then(function(resp){
        deferred.resolve('')
        console.log(resp.data)
        if (resp.data.rated_items != null) {
          addToRatingTable(resp.data.rated_items);
          vm.ratings_loaded = true;
        }
        if (resp.data.recommended_items != null) {
          console.log(vm.wholeRecommendedList, vm.wholeRecommendedList.length)
          loadRecs(resp.data.recommended_items)
          console.log(vm.wholeRecommendedList, vm.wholeRecommendedList.length)
          vm.recs_loaded = true;
        } 
        if (vm.tabState != 0) {
          vm.tabSwitch($scope.$parent.tabNumber)
        }
        console.log(vm.tableData, $scope.$parent.tabNumber)
      }, function(resp){
        console.log(resp)
      })
    })

    $scope.getOnStyle = function(){
        return {'color':$scope.template.highlighted_rating_icon_color, 'font-size': $scope.template.rating_icon_fontsize}
    }

    $scope.getOffStyle = function() {
        return {'color':$scope.template.rating_icon_color, 'font-size': $scope.template.rating_icon_fontsize}
    }

    $scope.setItemDetails = function(item) {
      var itemDetails = $scope.template.item_fields_include
      var field;
      var item_template = "<fieldset>"
      for (i in itemDetails) {
        field = itemDetails[i]
        value = item[field]
        item_template += "<div class='row control-group'><div class='col-xs-4 display-label'>%s</div><div class='col-xs-8 display-value word-wrap'>%s</div></div>".format(formatField(field), value)
      }
      item_template += "</fieldset>"
      return item_template
    }

    function formatField(word) {
      var field = word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
      return field.split('_').join(' ')
    }

    function getStr(percent) {
      var p = Math.round(percent * 100)
      return p.toString() + '%'
    }

    $scope.setRatingsTemplate = function(item) {
      if (item.total_rating_count !== undefined) {
	      var myrating = item.rating
	      var total_rating_count = item.total_rating_count
	      var d = item.distribution_percentage
	      var rating_template = itemService.getMyRatingTemplate(item.my_rating)
	      rating_template += '<input type="hidden" name="myrating" class="rating-value" value="%f"></div>'.format(item.my_rating)
	      rating_template += 'Total Ratings: %d'.format(item.total_rating_count)
	      var distribution = '<div class="input-group"> \
	      <span>5 Stars</span><meter id="meter-5-star" value="%f"></meter><span>%s</span></div> \
	      <div><span>4 Stars</span><meter id="meter-4-star" value="%f"></meter><span>%s</span></div> \
	      <div><span>3 Stars</span><meter id="meter-3-star" value="%f"></meter><span>%s</span></div> \
	      <div><span>2 Stars</span><meter id="meter-2-star" value="%f"></meter><span>%s</span></div> \
	      <div><span>1 Stars</span><meter id="meter-1-star" value="%f"></meter><span>%s</span></div>'
		.format(d[5], getStr(d[5]),d[4], getStr(d[4]),d[3], getStr(d[3]),d[2], getStr(d[2]),d[1], getStr(d[1]));
	      return rating_template + distribution + '</fieldset>'
      }
    }

    $scope.$on('itemSearch', function(event, args) {
      console.log('got search command', args)
      vm.itemSearch(args)
    })

    $scope.$on('tabSwitch', function(event, args) {
      console.log('got tab switch', args)
      vm.tabSwitch(args)
    })

    $scope.$on('itemRated', function(event, args) {
      vm.itemRated(args)
    })

    $scope.$on('itemNotInterested', function(event, args) {
      vm.itemNotInterested(args)
    })

    function tablesLoaded() { // rating and recs loaded
        return vm.ratedTabData.legnth != 0 && vm.wholeRecommendedList.length != 0
    }
    
    function removeFromTableData(item_id) {
        for (i in vm.tableData) { // remove item from main list
          if (getId(vm.tableData[i]) == item_id) {
            vm.tableData.splice(i, 1)
          }
        }
    }

    function removeFromRatedTabData(item_id) {
        for (i in vm.ratedTabData) { // remove rated item from rated list
          if (getId(vm.ratedTabData[i]) == item_id) {
            var item = vm.ratedTabData.splice(i, 1)
            console.log('removed',item)
          }
        }
        console.log(vm.ratedTabData)
    }

    function removeFromRecommended(item_id) {
        for (i in vm.wholeRecommendedList) { 
          if (getId(vm.wholeRecommendedList[i]) == item_id) {
            vm.wholeRecommendedList.splice(i, 1)
          }
        }
    }

    vm.itemNotInterested = function(args) {
      var item_id = args.item_id
      vm.tmpNotInterestedItemIds.push(item_id) 
      removeFromTableData(item_id) 
      removeFromRatedTabData(item_id)        
      removeFromRecommended(item_id)
    }

    vm.itemRated = function(args) {
      var item_id = args.item_id
      var rating = args.rating
      var item = args.item
      if (rating == 'unrate') {
        if (hasRating(item_id)) { 
           console.log("removed rated items")
           removeFromTableData(item_id)  // remove from rated table
           removeFromRatedTabData(item_id)        
        }
      } else { // make rating
        item.my_rating = rating
        if (!hasRating(item_id)) { // add rated item to rated list
          vm.ratedTabData.push(item)
          removeFromTableData(item_id) 
          removeFromRecommended(item_id)
        }
      }

    }

    //TODO: disable switch until initializeHomeTable finishes, until pagingFunction is finished
    vm.tabSwitch = function(tabNumber) {
       console.log("called tab switch")
       vm.tabState = tabNumber;
       if ($scope.recsys_id == undefined) {
           return
       }
       console.log(vm.initializingHomeTab, "still initializing")
       if (tabNumber == 0) {
         vm.doInitializeHomeTable()
       } else if (tabNumber == 1) {
         vm.recCount = 0;
         vm.tableData = []
         vm.pagingFunction()
         vm.displayingSearched = false
       } else if (tabNumber == 2) {
         vm.ratingCount = 0
         vm.tableData = []
         vm.pagingFunction()
         vm.displayingSearched = false
       }
    }

    vm.itemSearch = function (searchQuery) {
      //var start = new Date().getTime();
      if (searchQuery === "") {
        // reset to home page
        vm.displayingSearched = false;
        vm.doInitializeHomeTable()
        console.log("no search")
      } else if (!vm.initializingSearchList)  {
        vm.initializingSearchList = true;
        itemService.textSearch($scope.recsys_id, searchQuery, vm.search_page, 
          vm.search_rows_per_page).then(function(searchResults) {
              console.log(searchResults)
              vm.searchedList = searchResults
              vm.tableData = []
              vm.searchCount = 0
              vm.displayingSearched = true
              vm.initializingSearchList = false
              vm.pagingFunction()
        })
      }
      //var end = new Date().getTime();
      //console.log(end - start, "search time")
      $scope.$parent.showSearchProgress = false;
    }
    
    // function startProgresBar() {
    //   $scope.$parent.showSearchProgress = true;
    //   return
    // }

    // function endProgresBar() {
    //   $scope.$parent.showSearchProgress = false;
    //   return
    // }


  }

})();
