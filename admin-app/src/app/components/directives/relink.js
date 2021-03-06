angular.module('app')
.directive('relinkEvent', function($rootScope) {
    return {
        transclude: 'element',
        restrict: 'A',
        link: function(scope, element, attr, ctrl, transclude) {
            var previousContent = null;

            var triggerRelink = function() {
                if (previousContent) {
                    previousContent.remove();
                    previousContent = null;
                }

                transclude(function (clone) {
                    console.log('relinking');
                    element.parent().append(clone);
                    previousContent = clone;
                });

            };

            triggerRelink();
            $rootScope.$on(attr.relinkEvent, triggerRelink);

        }
    };

});