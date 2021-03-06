(function(){
  angular
      .module('app')
      .controller('MainController', [
         'navService', 'loginService', 'itemService', '$mdSidenav', '$mdBottomSheet', '$log', '$q', '$state', '$mdToast', '$scope', '$timeout', '$http', '$cookies',
         'config', 'ModalService', '$uibModal',
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

  function MainController(navService, loginService, itemService, $mdSidenav, $mdBottomSheet, $log, $q, $state, $mdToast, $scope, $timeout, $http, $cookies, config, ModalService, $uibModal) {
    var vm = this;
    $scope.$state = $state

    var urlSuffix = window.location.href.split(config.app_home_url+'/')[1]
    vm.recsys_url = urlSuffix.split('/')[0]
    console.log(vm.recsys_url)

    $scope.recsysDeferred = $q.defer();

    $scope.filterArray = []
    for (var i=0; i < 500; i++) {
        $scope.filterArray.push(i)
    }

    function convertToFilterObject(field, filterValue) {
        if (filterValue.type == 'numerical') {
            return {
                    type: 'numerical',
                    field: field,
                    numerical_type: 'slider',
                    numerical_range: filterValue.values,
            }
        } else if (filterValue.type == 'qualitative') {
             return {
                     type: 'qualitative',
                     field: field,
                     qualitative_type: 'grid',
                     qualitative_values: filterValue.values, 
             }
        }
    }

    function convertAllFields(filterFields, filterFieldValues) {
        var filterObjects = []
        var obj, field;
        for (var i in filterFields) {
            field = filterFields[i]
            obj = convertToFilterObject(field, filterFieldValues[field])
            console.log(obj)
            filterObjects.push(obj)
        }
        return filterObjects
    }


    $http({
      method: 'GET',
      url: config.server_url+'/recsys-params/'+'?recsys_url='+vm.recsys_url,
    }).then(function(resp){
      console.log(resp)
      vm.recsys = resp.data
      vm.recsys_id = vm.recsys.id
      $scope.recsys_id = vm.recsys_id
      vm.recsysTitle = vm.recsys.name

      $scope.template = JSON.parse(vm.recsys.template)
      console.log($scope.template)

      var filter_fields = $scope.template.filter_fields
      var filter_field_values = $scope.template.filter_field_values
      var numerical_fields = filter_fields.filter(function(field){ return filter_field_values[field].type == 'numerical'})
      //var qualitative_fields = filter_field_values.filter(function(field){ return field.type == 'qualitative'})

      $scope.filter_template = { // TODO: get fitler template from recsys obj
          numerical_fields: numerical_fields,
          default_sort_param: 'None', //numerical_fields[0],
          filter_objects: convertAllFields(filter_fields, filter_field_values),
      }
  
      $scope.sorted_param = $scope.filter_template.default_sort_param
      $scope.changeSortedParam = function(value) {
          $scope.sorted_param = value
      }
      $scope.isSortedParam = function(value) {
          return value == $scope.sorted_param
      }
      var template = $scope.filter_template
      vm.numerical_fields = template.numerical_fields
      vm.numerical_fields.splice(0, 0, 'None')
      vm.options = {}
      $scope.filterModel = itemService.getFilterModel(template)
      vm.filterFields = itemService.getFilterFields(template)

      console.log("test", $scope.filterModel, vm.filterFields)

      $scope.recsysDeferred.resolve(vm.recsys)
	    $http({
	      method: 'GET',
	      url: config.server_url+'/not-interested-items/'+'?recsys_id='+vm.recsys_id,
	    }).then(function(resp){
	      console.log("got here")
              console.log(resp)
	    }, function(resp){
	      console.log("got here fail")
	      console.log(resp)
	    })


    }, function(resp){
      console.log(resp)
    })


    vm.username = function() {
      return $cookies.get('k_username')
    }


    $scope.isGridView = true
    $scope.showingFilterNav = false
    vm.home_location = window.location.href;
    vm.searchText = "";

    $scope.loggedIn = loginService.loggedIn;
    $scope.tabNumber = 0;
    $scope.showSearchProgress = false;

    var displayingSearched = false;

    $scope.addTabs = function() {
      if ($state.current.name == 'home.login' || $state.current.name == 'home.signup' || $state.current.name == 'home.profile' || displayingSearched) {
        return false
      } else {
        return true
      }
    }

    $scope.itemSearch = function () { // get items
      console.log("item search")

      if (vm.searchText == "") {
        displayingSearched = false
      } else {
        displayingSearched = true
      }

      $scope.showSearchProgress = true;
      $timeout(function() {
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

    }

    vm.querySearch = function(searchString) { // get previous search queries
      if (searchString !== '' && sessionStorage.getItem('previousSearchCount') !== 0) {

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

    vm.changeToGridView = function () {
      $scope.isGridView = true;
    }

    vm.changeToListView = function () {
      $scope.isGridView = false;
    }


    $scope.tabSwitch = function(tabIndex) {
      console.log($state.current.name)
      $scope.tabNumber = tabIndex
      $scope.$broadcast('tabSwitch', tabIndex)
      if ($scope.tabNumber != 0) {
        displayingSearched = false
      }
    }

    vm.toggleFilterNav = function() {
        $scope.showingFilterNav = !$scope.showingFilterNav
    }

    vm.applyFilter = function() {
        // TODO: reset to home page with new filter settings
        // close filter on recommend, rating, or searching
        $scope.$broadcast('reload-home-tab')
    }


/*
    $scope.show = function(modal) {
      var result = $uibModal.open({
        templateUrl: 'modal.html',
        controller: 'ModalInstanceCtrl',
        controllerAs: 'vm',
        scope: $scope,
      }).result;
      
      result.then(function(model) {
        console.log(model)
      });
    }
*/

   $scope.getFilterParams = function() {
       var params = {
           sorted_by: $scope.sorted_param,
           filter_by: $scope.filterModel,
       }
       return params
   }

/*
    $scope.show = function() {
        ModalService.showModal({
            templateUrl: 'modal.html',
            controller: "ModalInstanceCtrl",
            controllerAs: 'vm'
        }).then(function(modal) {
            modal.element.modal();
            modal.close.then(function(result) {
                alert('yes')
            });
        });
    };
*/

    vm.logout = function() {
      $http({
        url: config.server_url + '/auth/logout/',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRFToken': $cookies.get('csrftoken'),
        },
        method: 'POST',
        data: {
          'username': $cookies.get('k_username'),
        },
      }).then(function successCallback(response) {
        console.log(response)
        if (response.data != 'error') {
          $state.go('home.login');
          $cookies.remove('k_username')
          $cookies.remove('csrftoken')
        }
      }, function errorCallback(response) {
        console.log(response)
      });
    }
     

/*
    vm.amazon_ratings = function() {
        // popup for amazon ratings, run script
        // get data output
        // create user ratings for each ammazon item/rating

        var user_items_page = "https://www.amazon.com/gp/yourstore/iyr"
        var server_url = config.server_url
        var home_url = config.home_url

        //var popup = window.open(user_items_page, 'newwindow', myconfig='height=600,width=600,' +
//        'toolbar=no, menubar=no, scrollbars=no, resizable=no,' + 'location=no, directories=no, status=no')

        //var script = popup.document.createElement('script');script.src = "https://ajax.googleapis.com/ajax/libs/jquery/2.2.0/jquery.min.js";popup.document.getElementsByTagName('head')[0].appendChild(script);
 
//        console.log(popup.document.head)
//	return
	//var isbn_base_url = 'https://openlibrary.org/api/books?bibkeys=ISBN:';
	//var isbn_end = '&format=json';

	$scope.data = [];
	var item_count = 0;

	var prev_num_items = 0;
	var start_item = 1;
	var end_item = 15;
	
	console.log("got here 1")

        var popup = window.open(user_items_page + "/ref=pd_ys_iyr_next?ie=UTF8&collection=purchased&iyrGroup=&maxItem=" + end_item + "&minItem=" + start_item, 'newwindow', myconfig='height=600,width=600,' + 'toolbar=no, menubar=no, scrollbars=no, resizable=no,')
        console.log("got it test")

	console.log(popup)
	console.log("contentWindow", popup.contentWindow)
        
        console.log(popup.window.document.getElementsByTagName("tr"))        
        console.log(popup.window.document.getElementsByTagName("body"))        
        console.log(popup.window.document.body.getElementsByTagName("tr"))        

        $(popup.document).load(function(){
            console.log("ran load function")

        });
        return
        
        var iframe = popup.document.createElement("iframe");
	iframe.setAttribute("src", user_items_page + "/ref=pd_ys_iyr_next?ie=UTF8&collection=purchased&iyrGroup=&maxItem=" + end_item + "&minItem=" + start_item);
	iframe.style.width = "640px";
	iframe.style.height = "480px";
	iframe.id = 'amazon_iframe';
        popup.document.body.appendChild(iframe);

        var clearWatchAmazonRatings = $scope.$watch('data', function(oldVal, newVal) {
            if (oldVal == newVal && oldVal.length != 0) {
               clearWatchAmazonRatings()
	       console.log("cleared", oldVal, newVal)
            }
        });

	console.log("got here in ratings script")

	console.log("iframe", popup.document.getElementById('amazon_iframe'))

        var myiframe = $('#amazon_iframe', popup.document);

        console.log(myiframe)
        $('iframe', popup.document).load(function(){
	  console.log("executing rating extraction")
          console.log("context:", iframe.contentWindow.document)
          console.log($('tr[id*=ListItem', iframe.contentWindow.document)) 
          console.log("got here")

          prev_num_items = item_count;
	  $('tr[id*=ListItem', iframe.contentWindow.document).each(function(index) {
	    $productInfo = $(this).find("td")[2];
	    $ratingInfo = $(this).find("input")[4];

	    asin = $(this).find("td")[0].id.substring(12, 30);
	    product_name = $productInfo.innerText;
	    rating =  $ratingInfo.value;
	    if (rating !== '0') {
	      product_rating = Number(rating);
	    } else {
	      product_rating = null;
	    }
	    if (!isNaN(asin)) {
	      $scope.data.push({'name': product_name, 'rating': product_rating, 'isbn': asin});
	    } else {
	      $scope.data.push({'name': product_name, 'rating': product_rating, 'asin': asin});
	    }
	    item_count += 1
	  });

	  start_item += 15;
	  end_item += 15;
	  if (item_count - prev_num_items >= 15) {
	    myiframe.setAttribute("src", user_items_page + "/ref=pd_ys_iyr_next?ie=UTF8&collection=purchased&iyrGroup=&maxItem=" + end_item + "&minItem=" + start_item);
	  } else {
	    console.log("done getting amazon ratings")
          }
 	});

}
        
/*
        // listen for data done populated

        var fnCheckLocation = function(){
            if (popup.location === null || popup.location == undefined || popup.location.href == null || popup.location.href == undefined) {
                clearInterval(interval);
            }

            if (popup.location.href != "about:blank" && popup.location.href.indexOf("auth_user=") != -1) {
              console.log("got auth name")
              sessionStorage.setItem("dh_username", popup.location.search.substring(popup.location.search.indexOf('auth_user=')+10))
              popup.location.href = authorization_url;
            } else if (popup.location.href != "about:blank" && popup.location.href.indexOf("code=") != -1) {
              var code = popup.location.search.substring(popup.location.search.indexOf('code=')+5)
              var username = sessionStorage.getItem('dh_username')
              $http({
                url: server_url+'/profile-code/',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                data: {
                  'profile_code': code,
                  'username': username,
                },
              }).then(function successCallback(response) {
                  console.log(response)
                  sessionStorage.removeItem('dh_username')
                  $cookies.put("k_username", response.data['username'])
                  window.location.href = home_url // NOTE: why does $state.go fail to load abstract ctrl?

                  popup.close();
                  clearInterval(interval);
                  $scope.$parent.loadRepos()

              }, function errorCallback(response) {
                  console.log("failed", response)
              });
            }
        }

        var interval = setInterval(fnCheckLocation, 500);

    function sendRatings(data) {
     

    }


*/



  }
/*
angular.module('app').controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, itemService) {
    var vm = this;

    $scope.changeSortedParam = function(value) {
        $scope.sorted_param = value
    }

    $scope.isSortedParam = function(value) {
        return value == $scope.sorted_param
    }
    var template = $scope.filter_template

    vm.numerical_fields = template.numerical_fields
    vm.options = {}

    vm.filterFields = itemService.getFilterFields(template)

    console.log(vm.filterFields)

    vm.applyFilter = function() {
        $uibModalInstance.close($scope.filterModel)
    }

    vm.ok = ok;
    vm.cancel = cancel;

    function ok() {
      $uibModalInstance.close()//(vm.formData.model);
    }

    function cancel() {
      //vm.formData.options.resetModel()
      $uibModalInstance.dismiss('cancel');
    };

  });
*/

})();
