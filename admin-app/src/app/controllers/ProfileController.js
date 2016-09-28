(function(){

  angular
    .module('app')
    .controller('ProfileController', [ '$cookies',
      ProfileController
    ]);

  function ProfileController($cookies) {
    var vm = this;


    // TODO: look for cookie that represents logged in user.
    // if no cookie, then assume logged out.

    vm.user = {
      title: $cookies.get('username'),
      email: 'none',
      firstName: '',
      lastName: '' ,
    };
  }

})();
