(function(){

  angular
    .module('app')
    .controller('ProfileController', [
      '$scope', '$http', 'config', '$cookies', 
      ProfileController
    ]);

  function ProfileController($scope, $http, config, $cookies) {
    var vm = this;
    var items = [];
    var count = 0;


    $scope.$parent.recsysDeferred.promise.then(function(recsys){
      vm.recsys = recsys
      vm.title_field = recsys.title_field
      vm.description_field = recsys.description_field

      $http({
        method: 'GET',
        url: config.server_url+'/not-interested-items/'+'?recsys_id='+recsys.id,
      }).then(function(resp){
        $scope.items = resp.data.items
        console.log(items)
        console.log(resp)
      }, function(resp){
        console.log(resp)
      })

    }, function(resp){
      console.log(resp)
    })

    vm.removeNotInterested = function(index) {
	var item_id = $scope.items[index].id
	var params = {
	    'recsys_id': vm.recsys.id,
	    'item_id': item_id,
	}
	console.log(params)

	$http({
	  method: 'DELETE',
	  url: config.server_url + '/not-interested/',
	  data: params,
	  headers: {
	    'Accept': 'application/json',
	    'Content-Type': 'application/json',
	    'X-CSRFToken': $cookies.get('csrftoken'),
	  },
	}).then(function(resp){
	  console.log(resp)
          removeFromList(item_id)
	}, function(resp){
	  console.log(resp)
	})
    }
   
    function removeFromList(item_id) {
        for (var i=0; i < $scope.items.length; i++) {
            if ($scope.items[i].id == item_id) {
                $scope.items.splice(i, 1)
                return true
            }
        }
        return false
    }

    // NOTE: not needed for now. assume list size is small.
    vm.pagingFunction = function() {

    }

    vm.checkEndOfList = function() {

    }

  }

})();
