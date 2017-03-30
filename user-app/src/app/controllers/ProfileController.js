(function(){

  angular
    .module('app')
    .controller('ProfileController', [
      '$scope',
      ProfileController
    ]);

  function ProfileController($scope) {
    var vm = this;

    var items = [];

    $scope.$parent.recsysDeferred.promise.then(function(recsys){
      $http({
        method: 'GET',
        url: config.server_url+'/not-interested-items/'+'?recsys_id='+recsys.id,
      }).then(function(resp){
        items = resp.items
        console.log(resp)
      }, function(resp){
        console.log(resp)
      })

    }, function(resp){
      console.log(resp)
    })


    vm.user = {
      title: $scope.$parent.username,
      email: '',
      firstName: '',
      lastName: '' ,
    };
  }

})();
