(function(){

  angular
    .module('app')
    .controller('ItemsController', [
      'itemService', '$mdSidenav', '$scope', '$timeout',
      ItemsController
    ])
    .directive('toggle', function(){
      return {
        restrict: 'A', // attribute name
        link: function(scope, element, attrs){
          if (attrs.toggle=="popover" && attrs.content!==""){
            $(element).popover({placement:'left', delay: { "show": 800, }});
          }
        }
      };
    })


  function ItemsController(itemService, $mdSidenav, $scope, $timeout) {
    var vm = this;

    vm.isGridView = true;

    vm.tableData = [];
    vm.homeTabData = [];
    vm.popTabData = [];
    vm.ratedTabData = [];

    vm.wholeTable = [];
    vm.searchedList = [];
    vm.recommendedList = [];
    vm.ratedList = [];
    vm.popularList = []; // TODO: items sorted by most and highest rating (number of ratings, rating average)

    vm.displayingSearched = false;
    vm.loggedIn = $scope.$parent.loggedIn;
    vm.count = 3;

    vm.tabState = 0;

    vm.pagingFunction = function () { // TODO: if displaying searched, load from searchedList
      if (vm.wholeTable.length !== 0 && $scope.$parent.tabNumber == 0) {
        currCount = vm.count
        if (!vm.displayingSearched && vm.recommendedList.length == 0) {
          for (var i=currCount; i < Math.min(currCount+3, vm.wholeTable.length); i++) {
            vm.tableData.push(vm.wholeTable[i]);
            vm.count = vm.count + 1;
          }
          console.log("non")
        } else {
          for (var i=currCount; i < Math.min(currCount+3, vm.searchedList.length); i++) {
            vm.tableData.push(vm.searchedList[i]);
            vm.count = vm.count + 1;
          }
          console.log("searched", vm.count)
        }
      }
    }

    vm.checkEndOfList = function() {
      if (vm.wholeTable.length !== 0 && $scope.$parent.tabNumber == 0) {
        if (!vm.displayingSearched && vm.recommendedList.length == 0) {
          return vm.count < vm.wholeTable.length
        } else {
          return vm.count < vm.searchedList.length
        }
      }
      return false
    }

    function checkRatingChange(rating, id) {
      // TODO:
      // if original rating is different from current, call Item CRUD to change rating
    }

    $scope.sendRating = function(rating) {
      if (rating !== 0) {
        console.log(rating)
        // TODO: send rating to backend
      }
    }

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
      return vm.recommendation_list.length == 0
    }

    // TODO: use promise to speed up load time.
    itemService
      .loadAllItems()
      .then(function(tableData) {
        vm.wholeTable = [].concat(tableData);
        vm.tableData = vm.wholeTable.slice(0,3)
      });

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
      if (tabNumber !== 0) {
        vm.tableData = []
      } else {
        vm.count = 3;
        vm.tableData = vm.wholeTable.slice(0,3)
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
      } else {
        var fuse = new Fuse(vm.wholeTable,
          {
            keys: ["title"],
            id: 'id',
            threshold: 0.3,
          });

        var searchResults = fuse.search(searchQuery)

        //console.log(searchResults)

        vm.tableData = []
        vm.searchedList = []

        for(var i=0; i<searchResults.length; i++) { // TODO: if searched is empty
          vm.searchedList[i] = vm.wholeTable[searchResults[i]]
        }
        vm.tableData = vm.searchedList.slice(0,3)
        vm.count = 3
        vm.displayingSearched = true;

        //console.log(vm.searchedList)
      }
      var end = new Date().getTime();
      console.log(end - start, "search time")

      $scope.$parent.showSearchProgress = false;

    }

    // TODO: make table rows hide not stack by increasing inner row count.
    // TODO: get all your recsys information.
    vm.recommendation_list = []; // service.getRecsyslist ...
    vm.popular_list = [];
    vm.user_rated_items = [];
    vm.items = [{'name':1},{'name':2},{'name':3}]
    vm.model = {"test":1};
    $scope.disabled = 'true';
    vm.selectedRepo = vm.items[0]

  }



})();
