'use strict';

angular.module('app')
  .directive('item', function() {

  	return {
        // @ expects a string value
        // = expects a javascript variable
  		scope: { mytitle: '@', description: '@', rating: '=', myrating: '=', myimage: '@', itemd: '=', 
                         mytemplate: '=', itemdata: '=', ratingdata: '=', recsysid: '=', itemid: '=', univcode: '=', suggestedrating: '='},
  		templateUrl: 'app/views/partials/item.html',
        require: '^ItemsController',
        controller: ['$scope', 'itemService', function Controller($scope, itemService) {
                    $scope.sendRating = itemService.sendRating
                    $scope.sendNotInterested = itemService.sendNotInterested
                    $scope.tabNumber = $scope.$parent.$parent.tabNumber
                    $scope.focus = null

                    var mytemplate = $scope.$parent.template

                    $scope.hoveringOver = function(value) {
                      $scope.overStar = value;
                    };

                    $scope.getOnStyle = function(){
                        return {'color':mytemplate.highlighted_rating_icon_color, 'font-size': mytemplate.rating_icon_fontsize}
                    }

                    $scope.getOffStyle = function() {
                        return {'color':mytemplate.rating_icon_color, 'font-size': mytemplate.rating_icon_fontsize}
                    }

            }],

  	}

  });
