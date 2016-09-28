(function(){

  angular
       .module('app')
       .controller('RecsysController', [
          'navService', '$mdSidenav', '$mdBottomSheet', '$log', '$q', '$state', '$mdToast', '$stateParams',
          RecsysController
       ]);
  
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

  });

  function RecsysController(navService, $mdSidenav, $mdBottomSheet, $log, $q, $state, $mdToast, $stateParams) {
 //  	var vm = this;

	// var pending = $mdBottomSheet.hide() || $q.when(true);

	// pending.then(function(){
	// $mdSidenav('left').toggle();
	// });
	var vm = this;

    vm.submit = onSubmit;

    //alert(JSON.stringify($stateParams))


    function onSubmit() {
        alert(JSON.stringify(vm.recsys), null, 2);
    }

    // The model object that we reference
    // on the  element in index.html    
    vm.recsys = {
      num_recs: 10,
      max_rating_value: 5,// {low: 5, high: 10},
    };
    vm.options = {};

    // An array of our form fields with configuration
    // and options set. We make reference to this in
    // the 'fields' attribute on the  element
    vm.recsysFields = [
        {
            key: 'recsys_name',
            type: 'input',
            defaultValue: "something here",
            templateOptions: {
                type: 'text',
                label: 'Recommender Name',
                placeholder: 'Enter the recommender name',
                required: true,
            }
        },
        {
            key: 'repo',
            type: 'input',
            templateOptions: {
                type: 'text',
                label: 'Repository Name',
                placeholder: 'Enter the repository name',
                required: true
            }
        },
        {
            key: 'table',
            type: 'input',
            templateOptions: {
                type: 'input',
                label: 'Table Name',
                placeholder: 'Enter the table name. These are the items.',
                required: true
            }
        },
        // {
        //     key: 'url',
        //     type: 'input',
        //     templateOptions: {
        //         type: 'input',
        //         label: 'URL',
        //         placeholder: 'Enter the website url.',
        //         required: true,
        //         readOnly: true,
        //     }
        // },

        {
            key: 'num_recs',
            type: 'slider',
            templateOptions: {
                label: 'Number of Recommendations per page',
                "sliderOptions": {
                    "floor": 5,
                    "ceil": 20,
                    "showTicksValues": false,
                },        
                required: true,
            }
        },
        {
            key: 'max_rating_value',
            type: 'slider',
            templateOptions: {
                label: 'Maximum Rating Value',
                "sliderOptions": {
                    "floor": 5,
                    "ceil": 10,
                    "showTicksValues": true,
                },        
                required: true,
            }
        },
    ];
}

})();