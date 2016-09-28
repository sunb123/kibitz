(function(){
  angular
       .module('app')
       .controller('MainController', [
          'navService', '$mdSidenav', '$mdBottomSheet', '$log', '$q', '$state', '$mdToast', '$scope', '$timeout',
          MainController
       ])
       .directive('ngEnter', function() {
        return function(scope, element, attrs) {
            element.bind("keydown keypress", function(event) {
                if(event.which === 13) {
                  scope.$eval(function(){
                          var autoChild = document.getElementById('searchbox').firstElementChild;
                          var el = angular.element(autoChild);
                          el.scope().$mdAutocompleteCtrl.hidden = true;
                          scope.$eval(attrs.ngEnter);
                  });
                  event.preventDefault();
                }
            });
        };
});

  function MainController(navService, $mdSidenav, $mdBottomSheet, $log, $q, $state, $mdToast, $scope, $timeout) {
    var vm = this;

    // TODO: call to get recsys rows is public.

    $scope.username = "brian" // TODO: get current username
    vm.recsysTitle = "Kibitz" // TODO: read from recsys object
    vm.maxRatingValue = 5
    // Recsys params here
    //


    vm.isGridView = true
    vm.home_location = window.location.href;
    $scope.loggedIn = true;
    $scope.tabNumber = 0;
    vm.searchText = "";

    $scope.showSearchProgress = false;

    $scope.addTabs = function() {
      if ($state.current.name == 'home.login' || $state.current.name == 'home.signup') {
        return false
      } else {
        return true
      }
    }

    $scope.itemSearch = function () {

      console.log("item search")

      $scope.showSearchProgress = true;
      $timeout(function() { // updates ng-repeat for items list
        // anything you want can go here and will safely be run on the next digest.
        $scope.$digest()

      },0)

      $timeout(function() {
        $scope.$broadcast('itemSearch', vm.searchText)
      },20)

      if (sessionStorage.getItem(vm.searchText) == null) {
        var count = parseInt(sessionStorage.getItem('previousSearchCount'))
        if (count != NaN && count < 50) {
          sessionStorage.setItem('previousSearchCount',count+1)
          count += 1
          sessionStorage.setItem(count, vm.searchText)
          sessionStorage.setItem(vm.searchText, true)
        } else {
          sessionStorage.setItem('previousSearchCount',0)
          sessionStorage.removeItem(sessionStorage.getItem(0))
          sessionStorage.setItem(0, vm.searchText)
          sessionStorage.setItem(vm.searchText, true)
        }
      }
      // $timeout(function() { // updates ng-repeat for items list
      //   // anything you want can go here and will safely be run on the next digest.
      //   $scope.$digest()
      // },10000)

    }

    $scope.tabSwitch = function(tabIndex) {
      console.log($state.current.name)
      $scope.tabNumber = tabIndex
      $scope.$broadcast('tabSwitch', tabIndex)
    }

    vm.querySearch = function(searchString) {
      if (searchString !== '' && sessionStorage.getItem('previousSearchCount') !== 0) {
        // console.log(Object.keys(sessionStorage).filter(function(item) { return parseInt(item) <= 10 && parseInt(item) >= 0 && item != 'previousSearchCount'; }))


        var previousSearches = Object.keys(sessionStorage)
          .filter(function(item) { return parseInt(item) <= 10 && parseInt(item) >= 0 && item != 'previousSearchCount'; })
          .sort(function (a,b) { return a - b; })
          .map(function(item) {
            return sessionStorage.getItem(item)
          })

        var searches = previousSearches.map(function(item) {
          return {value: item, display: item}
        })

        return searches.filter(createFilterFor(searchString)).slice(0,10)

      } else {
        return []
      }

    }

    function createFilterFor(query) {
      var lowercaseQuery = angular.lowercase(query);

      return function filterFn(state) {
        return (state.value.indexOf(lowercaseQuery) === 0);
      };
    }


    // TODO: search over item title, description text. search all items.

    // TODO: popular, sort by highest and most rated items
    // TODO: list of my rated items

    vm.logout = function() {
      $scope.loggedIn = false;
    }

    vm.show_login_form = function () {
      var popup = window.open('http://datahub.csail.mit.edu/account/login?redirect_url=' + vm.home_location,'newwindow', config='height=600,width=600,' +
        'toolbar=no, menubar=no, scrollbars=no, resizable=no,' + 'location=no, directories=no, status=no');

      //Create a trigger for location changes
      var intIntervalTime = 100;
      var curPage = this;

      // This will be the method that we use to check
      // changes in the window location.
      var fnCheckLocation = function(){
        // Check to see if the location has changed.
        // alert(popup.location.href)
          if (popup.location === null) {
              popup.close();
              clearInterval(id);
          }

          if (popup.location.href.indexOf("auth_user") > -1) {
            var href = popup.location.href;
            var splits = href.split("=");
            sessionStorage.setItem("username", href.split("=")[splits.length - 1]);
            setCookie("username", href.split("=")[splits.length - 1]);
            popup.close();
            clearInterval(id);

            document.location.href = "#/items";
            $scope.loggedIn = true;
          }
      }
      var id = setInterval( fnCheckLocation, intIntervalTime );



    };

    function setCookie(cname, cvalue, exdays) {
      if (exdays !== null) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        var expires = "expires="+d.toUTCString();
        document.cookie = cname + "=" + cvalue + "; " + expires;
      } else {
        document.cookie = cname + "=" + cvalue + "; ";
      }
    };

    var getCookie = function(cname) {
      var name = cname + "=";
      var ca = document.cookie.split(';');
      for(var i=0; i<ca.length; i++) {
          var c = ca[i];
          while (c.charAt(0)===' ') c = c.substring(1);
          if (c.indexOf(name) !== -1) return c.substring(name.length,c.length);
      }
      return "";
    };

    var eraseCookie = function (name) {
        setCookie(name,"");
    };

    var process_login = function(username) {
        swap("login_message", "login_panel");
        client.createNewUser(client_key, username);   // TODO: insert API call to create user
        userId = client.retrieveUserId(client_key, username);
        setCookie("userId", userId);
        sessionStorage.setItem("userId", userId);
        document.location = ".";
    };
  }

})();
