// 'use strict';

// angular.module('app')
// .directive('awesomeRating', ['$timeout', function($timeout) {
//     return {
//         restrict: 'A',
//         scope: {
//             awesomeRating: '=',
//             awesomeRatingOptions: '='
//         },
//         link: function(scope, element) {
//             var options = scope.awesomeRatingOptions || {};
//             options.valueInitial = scope.awesomeRating;

//             console.log( $(element).awesomeRating(options), 'yes' )

//             $element = $(element).awesomeRating(options)
//                 .on('rated', function(event, rate){
//                     $timeout(function() {
//                         scope.awesomeRating = rate;
//                     });
//                 });
//             scope.$watch(scope.awesomeRating, function(value){
//                 $element.each(function() { this._awesomeRatingApi.val(value); });
//             })
//         }
//     };
// }]);