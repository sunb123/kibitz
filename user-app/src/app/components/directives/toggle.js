angular.module('app')
    .directive('toggle', function(){
      return {
        restrict: 'A', // attribute name
        link: function(scope, element, attrs){
          if (attrs.toggle=="popover" && attrs.content!==""){
            $(element).popover({placement:'left', delay: { "show": 800, }});
          }
        }
      };
    })
