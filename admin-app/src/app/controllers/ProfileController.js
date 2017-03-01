(function(){

  angular
    .module('app')
    .controller('ProfileController', [ '$cookies',
      ProfileController
    ]);

  function ProfileController($cookies) {
    var vm = this;

    vm.user = {
      title: $cookies.get('k_username'),
      email: '',
      firstName: '',
      lastName: '' ,
    };
  }

})();
