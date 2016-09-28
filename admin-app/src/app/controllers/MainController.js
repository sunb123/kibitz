(function(){

  angular
       .module('app')
       .controller('MainController', [
          'navService', 'loginService', '$mdSidenav', '$mdBottomSheet', '$log', '$q', '$state', '$mdToast',
          '$scope', '$state', 'ngToast', '$http', '$cookies',
          MainController
       ]);

  function MainController(navService, loginService, $mdSidenav, $mdBottomSheet, $log, $q, $state, $mdToast, $scope, $state,
    ngToast, $http, $cookies) {
    var vm = this;

    if (!loginService.loggedIn()) {
      $state.go('home.login')
      return
    } else {
      $scope.loggedIn = true;
    }

    vm.kibitz_home_location = 'http://localhost:3000/'

    vm.username = $cookies.get('username')

    vm.menuItems = [ ];
    vm.selectItem = selectItem;
    vm.toggleItemsList = toggleItemsList;
    vm.title = $state.current.data.title;
    vm.showSimpleToast = showSimpleToast;
    vm.toggleRightSidebar = toggleRightSidebar;

    var home_location = "http://localhost:3000" // TODO: set to

    navService
      .loadAllItems()
      .then(function(menuItems) {
        vm.menuItems = [].concat(menuItems);
      });

    vm.logout = function() {
      $scope.loggedIn = false;
      $state.go('home.login');

      $http({
        url: 'http://localhost:8000/api/v1/auth/logout/',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: 'POST',
        data: {
          'username': $cookies.get('username'),
          'sessionid': $cookies.get('sessionid'),
        },
      }).then(function successCallback(response) {
        console.log(response)
        if (response.data != 'error') {
          $cookies.remove('sessionid')
          $cookies.remove('username')
          $cookies.remove('authenticated')
        }
      }, function errorCallback(response) {

      });

    }

    function toggleRightSidebar() {
        $mdSidenav('right').toggle();
    }

    function toggleItemsList() {
      var pending = $mdBottomSheet.hide() || $q.when(true);

      pending.then(function(){
        $mdSidenav('left').toggle();
      });
    }

    function selectItem (item) {
      vm.title = item.name;
      vm.toggleItemsList();
      vm.showSimpleToast(vm.title);
    }

    function showSimpleToast(title) {
      $mdToast.show(
        $mdToast.simple()
          .content(title)
          .hideDelay(2000)
          .position('bottom right')
      );
    }

    // vm.login = function () {

    //   document.location.href = 'http://datahub.csail.mit.edu/account/register?redirect_url=' + home_location,'newwindow', config='height=600,width=600,' +
    //   'toolbar=no, menubar=no, scrollbars=no, resizable=no,' + 'location=no, directories=no, status=no';

    //   //Create a trigger for location changes
    //   var intIntervalTime = 100;
    //   var curPage = this;

    //   // This will be the method that we use to check
    //   // changes in the window location.
    //   var fnCheckLocation = function(){
    //     // Check to see if the location has changed.
    //     //
    //       if (popup.location === null) {
    //           popup.close();
    //           clearInterval(id);
    //       }

    //       if (popup.location.href.indexOf("auth_user") > -1) {
    //         var href = popup.location.href;
    //         var splits = href.split("=");
    //         sessionStorage.setItem("username", href.split("=")[splits.length - 1]);
    //         setCookie("username", href.split("=")[splits.length - 1]);
    //         popup.close();
    //         clearInterval(id);

    //         document.location.href = "#/items";
    //         $scope.loggedIn = true;
    //       }
    //       //popup.close()
    //       //console.log("got here")
    //   }
    //   //var id = setInterval( fnCheckLocation, intIntervalTime );
    // };


    var transfer_protocol = 'https://';
    var base_url = transfer_protocol + 'datahub.csail.mit.edu';

    function buildURL(path, params) {
        var query = '';
        if (params !== undefined && Object.keys(params).length > 0) {
            query = '?' + $.param(params);
        }
        return base_url + path + query;
    }



    var intIntervalTime = 100;
    var curPage = this;
    // This will be the method that we use to check
    // changes in the window location.
    var fnCheckLocation = function(){
      // Check to see if the location has changed.
      //
      if (sessionStorage.getItem('authorized_user') != null) {
        document.location.href = "#/items";
        $scope.loggedIn = true;
        clearInterval(id);
        console.log(sessionStorage.getItem('authorized_user'))
      }


    }
    var id = setInterval( fnCheckLocation, intIntervalTime );


  }

})();
