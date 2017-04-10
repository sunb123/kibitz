(function(){
  'use strict';

  angular.module('app')
        .service('itemService', [
        '$q', '$http', 'config', '$cookies', '$rootScope',
      itemService
  ]);

  function itemService($q, $http, config, $cookies, $rootScope){

    var sendRating = function(item_id, rating, recsys_id) {
      if (rating != 0) {
        var params = {
            'recsys_id': recsys_id,
            'item_id': item_id,
            'rating': rating,
        }
        console.log(params)
        var method;
        if (rating == 'unrate') {
          method = 'DELETE'
        } else {
          method = 'POST'
        }

        $http({
          method: method, 
          url: config.server_url + '/rating/',
          data: params,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRFToken': $cookies.get('csrftoken')
          },
        }).then(function(resp){
          $rootScope.$broadcast('itemRated', {'item_id':item_id, 'rating':rating})
          console.log(resp)
        }, function(resp){
          console.log(resp)
        })

      }
    }

    var sendNotInterested = function(item_id, recsys_id) {
	var params = {
	    'recsys_id': recsys_id,
	    'item_id': item_id,
	  }
	  console.log(params)

	$http({
	  method: 'POST',
	  url: config.server_url + '/not-interested/',
	  data: params,
	  headers: {
	    'Accept': 'application/json',
	    'Content-Type': 'application/json',
	    'X-CSRFToken': $cookies.get('csrftoken'),
	  },
	}).then(function(resp){
	  $rootScope.$broadcast('itemNotInterested', {'item_id':item_id})
	  console.log(resp)
	}, function(resp){
	  console.log(resp)
	})
    }



    var getMyRatingTemplate = function(rating) { // 1 to 5
      if (rating == undefined) {
        return ''
      }
      var template = '<fieldset> \
        <div class="star-rating"> Your Rating:'
      for (var i=0; i < rating; i++) {
        template += '<span class="fa fa-star"></span>'
      }
      for (var j=i; j < 5; j++) {
        template += '<span class="fa fa-star-o"></span>'
      }
      return template
    }



    return {
      loadAllItems : function() {
        return $q.when(itemData);
      },
      getMyRatingTemplate: getMyRatingTemplate,
      sendRating: sendRating,
      sendNotInterested: sendNotInterested,
    };


  };

})();

