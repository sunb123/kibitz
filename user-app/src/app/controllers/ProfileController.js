(function(){

  angular
    .module('app')
    .controller('ProfileController', [
      '$scope', '$http', 'config', '$cookies', 
      ProfileController
    ]);

  function ProfileController($scope, $http, config, $cookies) {
    var vm = this;
    var count = 0;

    vm.items = [];

    $scope.$parent.recsysDeferred.promise.then(function(recsys){
      vm.recsys = recsys
      vm.pk_field = recsys.primary_key_field
      vm.title_field = recsys.title_field
      vm.description_field = recsys.description_field

      $http({
        method: 'GET',
        url: config.server_url+'/not-interested-items/'+'?recsys_id='+recsys.id,
      }).then(function(resp){
        vm.items = resp.data.items
        console.log(items)
        console.log(resp)
      }, function(resp){
        console.log(resp)
      })

    }, function(resp){
      console.log(resp)
    })

    vm.removeNotInterested = function(index) {
	var item_id = vm.items[index][vm.pk_field]
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
        for (var i=0; i < vm.items.length; i++) {
            if (vm.items[i][vm.pk_field] == item_id) {
                vm.items.splice(i, 1)
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
