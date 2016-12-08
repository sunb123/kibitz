(function(){

  angular
    .module('app')
    .controller('ProfileController', [
      '$scope',
      ProfileController
    ]);

  function ProfileController($scope) {
    var vm = this;


    // TODO: look for cookie that represents logged in user.
    // if no cookie, then assume logged out.

    vm.user = {
      title: $scope.$parent.username,
      email: '',
      firstName: '',
      lastName: '' ,
    };
  }

})();
