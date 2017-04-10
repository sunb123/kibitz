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

    vm.isGridView = true;
    vm.tableData = [];
    vm.wholeTable = [];
    vm.trendTabData = []; //trending items
    vm.ratedTabData = []; // my rated items
    vm.searchedList = [];

    vm.recommendedList = [];
    vm.wholeRecommendedList = [];
    vm.displayingSearched = false;

    vm.count = 0; // iterate index of entire item list
    vm.recCount = 0; // iterate index of recommended list
    vm.tabState = 0;
    vm.itemFields = [];
    $scope.sendRating = itemService.sendRating
    $scope.sendNotInterested = itemService.sendNotInterested

    function tableToUse(tabNumber) {
       if (tabNumber == 0) {
        return vm.wholeTable
       } else if (tabNumber == 1) {
        return vm.trendTabData
       } else if (tabNumber == 2) {
        return vm.ratedTabData
       }
    }

    function getInitializedTable(table, recommend, tableNumber) { // not rating or recommended
      var initialList = [];
      var count = 0;
      var item;
      if (tableNumber == 2) { // ratings table
        initialList = table.slice(0,4)
        vm.count = 4
        return initialList
      }
      for (i in table) {
        if (count >= 4) {
          break
        } else if (!recommend) {
          if (!hasRating(table[i].id) && !isRecommended(table[i].id)) {
            initialList.push(table[i])
            count++
          }
          vm.count++
        } else if (recommend) {
          if (!hasRating(table[i].id)) {
            initialList.push(table[i])
            count++
          }
          vm.recCount++
        }
      }
      return initialList
    }

    vm.pagingFunction = function (recommend) {
      var tableBase = tableToUse($scope.$parent.tabNumber)
      currCount = vm.count
      var addedCount = 0
      if (tableBase.length == 0) {
        return
      }

      if (recommend) { // recommmended items
        while (addedCount < 16 && vm.recCount < vm.wholeRecommendedList.length) {
          var item = vm.wholeRecommendedList[vm.recCount]
          if (!hasRating(item.id)) {
            vm.recommendedList.push(item);
            addedCount++;
          }
          vm.recCount++;
        }
      } else if (!vm.displayingSearched && !recommend) {
        while (addedCount < 4 && vm.count < tableBase.length) {
            var item = tableBase[vm.count]
            if ( $scope.$parent.tabNumber != 2) { // home or trending items
              if (!hasRating(item.id) && !isRecommended(item.id)) {
                vm.tableData.push(item);
                addedCount++;
              }
            } else { // showing rated items
               vm.tableData.push(item);
               addedCount++;
            }
            vm.count++;
        }
      } else { // showing searched items
        while (addedCount < 4 && vm.count < vm.searchedList.length) {
          var item = vm.searchedList[vm.count]
          if (!hasRating(item.id) && !isRecommended(item.id)) {
            vm.tableData.push(item);
            addedCount++;
          }
          vm.count++;
        }
      }
    }

    vm.checkEndOfList = function(recommend) {
      if (recommend) {
        return vm.recCount < vm.wholeRecommendedList.length
      } else if (vm.wholeTable.length != 0) {
        var tableBase = tableToUse($scope.$parent.tabNumber)
        //console.log(vm.count, tableBase.length, !vm.displayingSearched)
        if (!vm.displayingSearched) {
          return vm.count < tableBase.length
        } else {
          return vm.count < vm.searchedList.length
        }
      }
      return false
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

    function findItem(item_id) { // from whole table. NOTE: could be slow
      for (var i=0; i < vm.wholeTable.length; i++) {
        if (vm.wholeTable[i]['id'] == item_id) {
          return vm.wholeTable[i]
        }
      }
    }

    function findRatedItem(item_id) {
      for (var i=0; i < vm.ratedTabData.length; i++) {
        if (vm.ratedTabData[i]['id'] == item_id) {
          return vm.ratedTabData[i]
        }
      }
      return false
    }

    $scope.hoveringOver = function(value) {
      $scope.overStar = value;
    };

    vm.changeToGridView = function () {
      vm.isGridView = true;
      // vm.tableData = vm.tableData.slice(0,4);
      // vm.count = 4;
    }

    vm.changeToListView = function () {
      vm.isGridView = false;
      // vm.tableData = vm.tableData.slice(0,4);
      // vm.count = 4;
    }

    vm.hasRecommendations = function() {
      return vm.wholeRecommendedList.length != 0 && vm.recommendedList.length != 0
    }

    // customized template fields
    vm.pk_field = ''
    vm.title_field = ''
    vm.description_field = ''
    vm.image_field = ''
    vm.rating_icon_color = ''
    vm.rating_icon_font_size = ''
    vm.rating_icon_on = ''
    vm.rating_icon_off = ''
    vm.use_field_selection = ''
    vm.field_selection_column_name = ''
    vm.template_number = ''
    vm.item_fields_include = []

    $scope.$parent.recsysDeferred.promise.then(function(recsys){
      console.log(recsys)

      vm.recsysPaused = loginService.recsysPaused(recsys)
      if (vm.recsysPaused) {
          return
      }

      vm.recsys = recsys
      $scope.recsys_id = vm.recsys.id
      vm.pk_field = vm.recsys.primary_key
      vm.title_field = vm.recsys.title_field
      vm.description_field = vm.recsys.description_field
      vm.image_link_field = vm.recsys.image_link_field
      $scope.template = JSON.parse(vm.recsys.template)

      console.log($scope.template)

      var deferred = $q.defer();
      $scope.itemPromise = deferred.promise

      $http({
        method: 'GET',
        url: config.server_url+'/item/'+'?recsys_id='+$scope.recsys_id,
      }).then(function(resp){
        deferred.resolve(resp.data.items)
        console.log(resp.data)
        vm.wholeTable = [].concat(resp.data.items);
        vm.trendTabData = [].concat(resp.data.trending_items);
        if (resp.data.rated_items != null) {
          vm.ratedTabData = [].concat(resp.data.rated_items);
          console.log(vm.ratedTabData)
        }
        if (resp.data.recommended_items != null) {
          vm.wholeRecommendedList = [].concat(resp.data.recommended_items);
          vm.recommendedList = getInitializedTable(vm.wholeRecommendedList, true)
        }

        vm.itemFields = Object.keys(vm.wholeTable[0]) // searching on all item fields

        var table = tableToUse($scope.$parent.tabNumber)
        console.log(table, vm.tableData, $scope.$parent.tabNumber)
        vm.tableData = getInitializedTable(table, false, $scope.$parent.tabNumber)
        console.log(table, vm.tableData, $scope.$parent.tabNumber)
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
        item_template += "<div class='row control-group'><div class='col-xs-4 display-label'>%s</div><div class='col-xs-8 display-value item-field'>%s</div></div>".format(capitalize(field), value)
      }
      item_template += "</fieldset>"
      return item_template
    }

    function capitalize(word) {
      return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
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


    // $scope.showingRated = function() {
    //   return tabNumber == 2
    // }

    function removeFromWholeTable(item_id) {
        for (i in vm.wholeTable) { // remove rated item from rated list
          if (vm.wholeTable[i].id == item_id) {
            vm.wholeTable.splice(i, 1)
          }
        }
    }

    function removeFromTrendTabTable(item_id) {
        for (i in vm.trendTabData) { // remove rated item from rated list
          if (vm.trendTabData[i].id == item_id) {
            vm.trendTabData.splice(i, 1)
          }
        }
    }

    function removeFromRatedTabData(item_id) {
        for (i in vm.ratedTabData) { // remove rated item from rated list
          if (vm.ratedTabData[i].id == item_id) {
            vm.ratedTabData.splice(i, 1)
          }
        }
    }

    function removeFromTableData(item_id) {
        for (i in vm.tableData) { // remove item from main list
          if (vm.tableData[i].id == item_id) {
            vm.tableData.splice(i, 1)
          }
        }
    }

    function removeFromRecommended(item_id) {
        for (i in vm.recommendedList) { 
          if (vm.recommendedList[i].id == item_id) {
            vm.recommendedList.splice(i, 1)
          }
        }
        for (i in vm.wholeRecommendedList) { 
          if (vm.wholeRecommendedList[i].id == item_id) {
            vm.wholeRecommendedList.splice(i, 1)
          }
        }
    }


    vm.itemNotInterested = function(args) {
      var item_id = args.item_id
      removeFromTableData(item_id) 
      removeFromRatedTabData(item_id)        
      removeFromWholeTable(item_id)
      removeFromTrendTabTable(item_id)
      removeFromRecommended(item_id)
    }

    vm.itemRated = function(args) {
      var item_id = args.item_id
      var rating = args.rating
      if (rating == 'unrate') {
        if (hasRating(item_id)) { 
           removeFromTableData(item_id)  // remove from rated table
           removeFromRatedTabData(item_id)        
        }
      } else { // make rating
        var item = findRatedItem(item_id)
        if (!item) {
          item = findItem(item_id)
        }
        console.log(item)
        item.my_rating = rating
 
        if (!hasRating(item_id)) { // add rated item to rated list
          vm.ratedTabData.push(item)
          removeFromTableData(item_id) //NOTE: should remove from recommended list too?
          removeFromWholeTable(item_id)
          removeFromTrendTabTable(item_id)
        }
      }

    }

    vm.tabSwitch = function(tabNumber) {
      //console.log($('#searchbox').text())
      if (tabNumber == 0) {
        vm.count = 0;
        vm.tableData = getInitializedTable(vm.wholeTable)
        console.log(vm.tableData)
      } else if (tabNumber == 1) {
        vm.count = 0;
        vm.tableData = getInitializedTable(vm.trendTabData)
        vm.displayingSearched = false
      } else if (tabNumber == 2) {
        if (vm.ratedTabData.length != 0) {
          vm.tableData = vm.ratedTabData.slice(0,4)
          vm.count = 4;
        } else {
          vm.tableData = []
        }
        vm.displayingSearched = false
      }
      vm.tabState = tabNumber;
    }

    // function startProgresBar() {
    //   $scope.$parent.showSearchProgress = true;
    //   return
    // }

    // function endProgresBar() {
    //   $scope.$parent.showSearchProgress = false;
    //   return
    // }

    vm.itemSearch = function (searchQuery) {
      var start = new Date().getTime();

      if (searchQuery === "") {
          vm.count = 0
          vm.tableData = getInitializedTable(vm.wholeTable)
          vm.displayingSearched = false;
          console.log("no search")
      } else {
        var fuse = new Fuse(vm.wholeTable,
          {
            keys: vm.itemFields, // ["title"],
            // id: 'id',
            threshold: 0.25, // TODO: find best threshold
          });

        var searchResults = fuse.search(searchQuery)
        console.log(searchResults)
        vm.tableData = []
        vm.searchedList = searchResults
        vm.count = 0
        vm.tableData = getInitializedTable(vm.searchedList, false)
        console.log(vm.tableData)
        vm.displayingSearched = true;
      }
      var end = new Date().getTime();
      console.log(end - start, "search time")
      $scope.$parent.showSearchProgress = false;
    }

  }

})();
