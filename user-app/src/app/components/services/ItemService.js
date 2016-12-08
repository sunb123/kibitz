(function(){
  'use strict';

  angular.module('app')
        .service('itemService', [
        '$q', '$http',
      itemService
  ]);

  function itemService($q, $http){
    var protocol = "http://"
    var base_url = protocol+"localhost:8000/api/v1/"

    // TODO: make call with recsys id.
    var getAllItems = function(recsys_id) {
      $http({
        method: 'GET',
        url: '',
      })
    }

    var getUserRatedItems = function(username, recsys_id) {
      // need permissions
    }

    var makeItemRating = function(username, recsys_id, item_id) {
      // need permissions
    }

    var getRecommendedItems = function(username, recsys_id) {
      // need permissions
    }



    var itemData = [
      {
        id: 0,
        title: 'Twenty Thousand Leagues Under the Sea',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum odio magna, sagittis vel rhoncus a, molestie sed nulla.',
        rating: '3',
        image: 'https://s-media-cache-ak0.pinimg.com/564x/27/c1/a6/27c1a67cfba878814471c8456ac33da5.jpg',
      },
      {
        id: 1,
        title: 'Lord of the Flies',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum odio magna, sagittis vel rhoncus a, molestie sed nulla.',
        rating: '5',
        image: 'http://cdn.bleedingcool.net/wp-content/uploads//2012/09/LOTF-front-cover.jpg',
      },
      {
        id: 2,
        title: 'A Tale of Two Cities',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum odio magna, sagittis vel rhoncus a, molestie sed nulla.',
        rating: '5',
        image: 'https://wikidownload.com/Download/a-tale-of-two-cities-book-cover.jpg',
      },
      {
        id: 3,
        title: 'Winnie the Pooh',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum odio magna, sagittis vel rhoncus a, molestie sed nulla.',
        rating: '5',
        image: 'http://blogs.slj.com/afuse8production/files/2012/06/Pooh6.jpg',
      },
      {
        id: 4,
        title: 'The Three Muskateers',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum odio magna, sagittis vel rhoncus a, molestie sed nulla.',
        rating: '1',
        image: 'http://vignette2.wikia.nocookie.net/childrensbooks/images/d/dd/The_Three_Musketeers.jpg/revision/latest?cb=20120917072411',
      },
      {
        id: 5,
        title: 'The Count of Monte Cristo',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum odio magna, sagittis vel rhoncus a, molestie sed nulla.',
        rating: '5',
        image: 'http://photo.goodreads.com/books/1309203605l/7126.jpg',
      },
    ];


    // TODO: load first 1000 items. get more iteratively.
    // Load recommended list. 1000 first, etc.

    for (var i=6; i<10; i++) {
      itemData.push({'id':i, 'rating':3, 'title':'One Thousand and One Nights '+i, 'description':'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum odio magna, sagittis vel rhoncus a, molestie sed nulla. Aliquam eros eros, auctor blandit felis vel, laoreet pellentesque nisi. Nulla vel neque interdum, pulvinar velit vel, lobortis tortor. Nam quis sollicitudin ipsum. Sed scelerisque turpis quis turpis finibus auctor. Aenean eleifend iaculis nisi id efficitur. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Vestibulum quis semper ex. Praesent vitae libero vulputate, viverra enim non, placerat erat. Ut consequat finibus eros non varius. Vestibulum sit amet nisl dui. Donec rhoncus tortor a placerat euismod. Sed aliquet, lectus et iaculis varius, turpis risus gravida nisi, quis ultrices lectus lorem id felis. In maximus vehicula metus, ut pellentesque mi ultrices in. ',
    	image: 'http://fr.academic.ru/pictures/frwiki/79/One_Thousand_and_One_Nights17.jpg',})
    }





    return {
      loadAllItems : function() {
        return $q.when(itemData);
      },
      getItem : function(item_id) {

      },

    };


  };

})();

