angular.module('app')
    .directive('toggle', function(){
      return {
        restrict: 'A', // attribute name
        link: function(scope, element, attrs){
          if (attrs.toggle=="popover" && attrs.content!=="") {
            if (attrs.hastemplate != 'true') {
              $(element).popover({placement:'top', delay: { "show": 800, } });
            } else {
              // $(element).popover({
              //   html: true,
              //   content: function() {
              //     return $('#myPopoverTemplate').html();
              //   }
              // });
            }
          }
        }

      };
    })
