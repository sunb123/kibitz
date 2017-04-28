angular.module('app').run(function(formlyConfig) {
  var ngModelAttrs = {};

  function camelize(string) {
    string = string.replace(/[\-_\s]+(.)?/g, function(match, chr) {
      return chr ? chr.toUpperCase() : '';
    });
    // Ensure 1st char is always lowercase
    return string.replace(/^([A-Z])/, function(match, chr) {
      return chr ? chr.toLowerCase() : '';
    });
  }

  // attributes
  angular.forEach([
    'color-picker-format',
    'color-picker-alpha',
    'color-picker-swatch',
    'color-picker-swatch-pos',
    'color-picker-swatch-bootstrap',
    'color-picker-swatch-only',
    'color-picker-pos',
    'color-picker-case'
  ], function(attr) {
    ngModelAttrs[camelize(attr)] = {attribute: attr};
  });

  formlyConfig.setType({
    name: 'colorpicker',
    template: '<color-picker ng-model="model[options.key]"></color-picker>',
    wrapper: ['bootstrapLabel', 'bootstrapHasError'],
    defaultOptions: {
      ngModelAttrs: ngModelAttrs
    }
  });
})

angular.module('app').run(function(formlyConfig) {
  formlyConfig.setType({
    name: 'slider',
    template: ['<rzslider rz-slider-model="model[options.key]"' +
               ' rz-slider-options="to.sliderOptions"></rzslider>'].join(' '),
    wrapper: ['bootstrapLabel', 'bootstrapHasError']
  });

  formlyConfig.setType({
    name: 'range-slider',
    template: ['<rzslider rz-slider-model="model[options.key].low"' +
               'rz-slider-high="model[options.key].high" ' +
               'rz-slider-options="to.sliderOptions"></rzslider>'].join(' '),
    wrapper: ['bootstrapLabel', 'bootstrapHasError']
  });

  formlyConfig.setWrapper([
    {
      name: 'panel',
      templateUrl: 'panel.html'
    },
  ]);

});
