(function(){
  'use strict';

  angular.module('app')
        .service('recsysService', [
        '$q', '$http', '$cookies', 'config',
      recsysService
  ]);

  function recsysService($q, $http, $cookies, config){

    var recsysFields = [
        {
            key: 'name',
            type: 'input',
            // defaultValue: '',
            templateOptions: {
                type: 'text',
                label: 'Recommender Name',
                placeholder: 'Enter the recommender name',
                required: true,
            }
        },
        // {
        //     key: 'url_name',
        //     type: 'input',
        //     wrapper: 'panel',
        //     templateOptions: {
        //         type: 'input',
        //         label: 'URL',
        //         placeholder: 'Enter the website url.',
        //         // required: true,
        //         readOnly: true,
        //     }
        // },
    ];

    var recsysFieldsAdv = [
        {
            key: 'repo_name',
            type: 'select',
            templateOptions: {
                type: 'text',
                label: 'Repository Name',
                placeholder: 'Enter the repository name',
                required: true,
                options: [],
            }
        },
        {
            key: 'item_table_name',
            type: 'select',
            templateOptions: {
                type: 'text',
                label: 'Items Table Name',
                placeholder: 'Enter the table name. These are the items.',
                required: false,
                options: [],
            }
        },
        {
            key: 'primary_key_field',
            type: 'select',
            templateOptions: {
                type: 'text',
                label: 'Item ID',
                placeholder: '',
                required: false,
                options: [],
            }
        },
        {
            key: 'title_field',
            type: 'select',
            templateOptions: {
                type: 'text',
                label: 'Title',
                placeholder: '',
                required: false,
                options: [],
            }
        },
        {
            key: 'description_field',
            type: 'select',
            templateOptions: {
                type: 'text',
                label: 'Description',
                placeholder: '',
                required: false,
                options: [],
            }
        },
        {
            key: 'image_link_field',
            type: 'select',
            templateOptions: {
                type: 'text',
                label: 'Image Link',
                placeholder: '',
                required: false,
                options: [],
            }
        },
        {
            key: 'universal_code_field',
            type: 'select',
            templateOptions: {
                type: 'text',
                label: 'Universal Code',
                placeholder: '',
                required: false,
                options: [],
            }
        },

    ];

    var recsysFieldsTemplate = [
        {
            key: 'rating_icon_color',
            type: 'colorpicker',
            templateOptions: {
              label: 'Rating Icon Color',
              colorPickerFormat: "'hex'",
              colorPickerAlpha: true,
              colorPickerPos: "'top left'",
              colorPickerSwatchBootstrap: false
            }
        },
        {
            key: 'highlighted_rating_icon_color',
            type: 'colorpicker',
            templateOptions: {
              label: 'Highlighted Rating Icon Color',
              colorPickerFormat: "'hex'",
              colorPickerAlpha: true,
              colorPickerPos: "'top left'",
              colorPickerSwatchBootstrap: false
            }
        },
        {
            key: "rating_icon_fontsize",
            "type": "slider",
            "templateOptions": {
              "label": "Rating Icon Font Size",
              "sliderOptions": {
                "floor": 7,
                "ceil": 38
              }
            }
        },
    ];

    return {
        recsysFields: recsysFields,
        recsysFieldsAdv: recsysFieldsAdv,
        recsysFieldsTemplate: recsysFieldsTemplate,
    }
  }

})();