(function(){
  'use strict';

  angular.module('app')
          .service('navService', [
          '$q',
          navService
  ]);

  function navService($q){
    var menuItems = [
      {
        name: 'Recommenders',
        icon: 'view_module',
        sref: '.table'
      },
      {
        name: 'Profile',
        icon: 'person',
        sref: '.profile'
      },
    ];

    return {
      loadAllItems : function() {
        return $q.when(menuItems);
      }
    };
  }

})();
