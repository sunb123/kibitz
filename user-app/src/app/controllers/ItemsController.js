(function(){

  angular
    .module('app')
    .controller('ItemsController', [
      '$q', 'itemService', 'loginService', '$mdSidenav', '$scope', '$timeout', '$http', 'config',
      ItemsController
    ])

  function ItemsController($q, itemService, loginService, $mdSidenav, $scope, $timeout, $http, config) {
    var vm = this;

    if (!loginService.loggedIn()) {
      $scope.$parent.loggedIn = false
      $state.go('home.login');
      return
    } else {
      $scope.$parent.loggedIn = true
    }

    vm.isGridView = true;

    vm.tableData = [];
    //vm.homeTabData = [];
    vm.popTabData = [];
    vm.ratedTabData = [];

    vm.wholeTable = [];
    vm.searchedList = [];
    vm.recommendedList = [];

    vm.displayingSearched = false;
    vm.loggedIn = $scope.$parent.loggedIn;
    vm.count = 3;

    vm.tabState = 0;

    function tableToUse(tabNumber) {
       if (tabNumber == 0) {
        return vm.wholeTable
       } else if (tabNumber == 1) {
        return vm.popTabData
       } else if (tabNumber == 2) {
        return vm.ratedTabData
       }
    }

    vm.pagingFunction = function () { // TODO: if displaying searched, load from searchedList
      if (vm.wholeTable.length !== 0) {
        var tableBase = tableToUse($scope.$parent.tabNumber)
        currCount = vm.count
        if (!vm.displayingSearched && vm.recommendedList.length == 0) {
          var addedCount = 0;
          while (addedCount < 3 && vm.count < tableBase.length) {
              if ( $scope.$parent.tabNumber != 2) {
                if (!hasRating(tableBase[vm.count].id) ) {
                  vm.tableData.push(tableBase[vm.count]);
                  addedCount++;
                }
              } else {
                 vm.tableData.push(tableBase[vm.count]);
                 addedCount++;
              }
              vm.count = vm.count + 1;
          }



          // for (var i=currCount; i < Math.min(currCount+3, tableBase.length); i++) {
          //   if ( $scope.$parent.tabNumber != 2) {
          //       if (!hasRating(tableBase[i].id) ) {
          //         vm.tableData.push(tableBase[i]);
          //       }
          //   } else {
          //      vm.tableData.push(tableBase[i]);
          //   }
          //   vm.count = vm.count + 1;
          // }



        } else { // TODO
          for (var i=currCount; i < Math.min(currCount+3, vm.searchedList.length); i++) {
            vm.tableData.push(vm.searchedList[i]);
            vm.count = vm.count + 1;
          }
          console.log("searched", vm.count)
        }
      }
    }

    vm.checkEndOfList = function() {
      if (vm.wholeTable.length !== 0) {
        var tableBase = tableToUse($scope.$parent.tabNumber)
        if (!vm.displayingSearched && vm.recommendedList.length == 0) {
          return vm.count < tableBase.length
        } else {
          return vm.count < vm.searchedList.length
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

    function findItem(item_id) {
      for (var i=0; i < vm.wholeTable.length; i++) {
        if (vm.wholeTable[i]['id'] == item_id) {
          return vm.wholeTable[i]
        }
      }
    }

    function addToRatedTabData(item_id) {
      for (var i=0; i < vm.ratedTabData.length; i++) {
        if (vm.ratedTabData[i]['id'] == item_id) {
          vm.ratedTabData[i] = findItem(item_id)
          return
        }
      }
      // didn't find item in rated list
      vm.ratedTabData.push(findItem(item_id))
    }

    $scope.sendRating = function(item_id, rating, recsys_id) {

      if (rating != 0) {
        var params = {
            'recsys_id': recsys_id,
            'item_id': item_id,
            'rating': rating,
          }
          console.log(params)

          var item = findItem(item_id)
          item['colored'] = true

        $http({
          method: 'POST',
          url: config.server_url + '/rating/',
          data: params,
        }).then(function(resp){
          addToRatedTabData(item_id) // TODO: temporarily add to rated table. wait until refresh.
          console.log(resp)
        }, function(resp){
          console.log(resp)
        })
      }
    }
    //<i class="material-icons">cloud</i>

    $scope.mytemplate = 'fa fa-spinner fa-spin'

    $scope.hoveringOver = function(value) {
      $scope.overStar = value;
    };

    vm.changeToGridView = function () {
      vm.isGridView = true;
      vm.tableData = vm.tableData.slice(0,3);
      vm.count = 3;
    }

    vm.changeToListView = function () {
      vm.isGridView = false;
      vm.tableData = vm.tableData.slice(0,3);
      vm.count = 3;
    }

    vm.hasRecommendations = function() {
      return vm.recommendedList.length == 0
    }

    // TODO: get item details
    $scope.item_details = "<fieldset> \
    <div class='row control-group'> \
      <div class='col-xs-4 display-label'>Author</div><div class='col-xs-8 display-value'>Richard B. Wright</div></div> \
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



    // TODO: use promise to speed up load time.

    vm.pk_field = ''
    vm.title_field = ''
    vm.description_field = ''
    vm.image_field = ''
    vm.rating_field = ''

    $http({
      method: 'GET',
      url: config.server_url+'/recsys/0/'+'?recsys_url='+'books',
    }).then(function(resp){
      vm.recsys = resp.data.rows[0]
      $scope.recsys_id = vm.recsys.id
      console.log(vm.recsys)

      vm.pk_field = vm.recsys.primary_key
      vm.title_field = vm.recsys.title_field
      vm.description_field = vm.recsys.description_field
      vm.image_link_field = vm.recsys.image_link_field
      vm.rating_field = vm.recsys.rating_field

      var deferred = $q.defer();
      $scope.itemPromise = deferred.promise

      $http({
        method: 'GET',
        url: config.server_url+'/item/'+'?recsys_id='+$scope.recsys_id,
      }).then(function(resp){
        deferred.resolve(resp.data.items)
        console.log(resp.data)
        vm.wholeTable = [].concat(resp.data.items);
        vm.popTabData = [].concat(resp.data.popular_items);
        if (resp.data.rated_items != null) {
          vm.ratedTabData = [].concat(resp.data.rated_items);
        }

        var table = tableToUse($scope.$parent.tabNumber)
        vm.tableData = table.slice(0,3)
        if ($scope.$parent.tabNumber == 2) {
          $scope.showingRated = true
        } else {
          $scope.showingRated = false
        }
      }, function(resp){
        console.log(resp)
      })

    }, function(resp){
      console.log(resp)
    })


    // itemService
    //   .loadAllItems()
    //   .then(function(tableData) {
    //     vm.wholeTable = [].concat(tableData);
    //     vm.tableData = vm.wholeTable.slice(0,3)
    //   });

    // TODO: get all recommended items for user
    // TODO: get all items rated by user

    // if no recommended, then home == popular
    //


    $scope.$on('itemSearch', function(event, args) {
      console.log('got search command', args)
      vm.itemSearch(args)
    })

    $scope.$on('tabSwitch', function(event, args) {
      console.log('got tab switch', args)
      vm.tabSwitch(args)
    })

    vm.tabSwitch = function(tabNumber) {
      if (tabNumber == 0) {
        vm.count = 3;
        vm.tableData = vm.wholeTable.slice(0,3)
        $scope.showingRated = false
      } else if (tabNumber == 1) {
        vm.count = 3;
        vm.tableData = vm.popTabData.slice(0,3)
        $scope.showingRated = false
      } else if (tabNumber == 2) {
        vm.count = 3;
        if (vm.ratedTabData.length != 0) {
          vm.tableData = vm.ratedTabData.slice(0,3)
          // console.log(vm.tableData)
        } else {
          vm.tableData = []
        }
        $scope.showingRated = true

      }
      vm.tabState = tabNumber;
    }

    function startProgresBar() {
      $scope.$parent.showSearchProgress = true;
      return
    }

    function endProgresBar() {
      $scope.$parent.showSearchProgress = false;
      return
    }


    vm.itemSearch = function (searchQuery) {
      var start = new Date().getTime();
      if (searchQuery === "") {
          vm.tableData = vm.wholeTable.slice(0,3)
          vm.count = 3
          vm.displayingSearched = false;
          console.log("no search")
      } else {
        var fuse = new Fuse(vm.wholeTable,
          {
            keys: ["title"], // search on other keys
            // id: 'id',
            threshold: 0.25,
          });

        var searchResults = fuse.search(searchQuery)

        console.log(searchResults)

        vm.tableData = []
        vm.searchedList = searchResults
        // vm.searchedList = []

        // for(var i=0; i<searchResults.length; i++) { // TODO: if searched is empty
        //   vm.searchedList[i] = vm.wholeTable[searchResults[i]]
        // }
        vm.tableData = vm.searchedList.slice(0,3)
        vm.count = 3
        vm.displayingSearched = true;

        // console.log(vm.searchedList)
      }
      var end = new Date().getTime();
      console.log(end - start, "search time")

      $scope.$parent.showSearchProgress = false;

    }


  }

})();