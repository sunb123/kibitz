'use strict';

angular.module('app')
  .directive('item', function() {

  	return {
  		scope: { mytitle: '@', description: '@', rating: '=', myimage: '@'},
  		templateUrl: 'app/views/partials/item.html',
  	}

  });