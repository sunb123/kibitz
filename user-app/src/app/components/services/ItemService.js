(function(){
  'use strict';

  angular.module('app')
        .service('itemService', [
        '$q', '$http', 'config', '$cookies', '$rootScope',
      itemService
  ]);

  function itemService($q, $http, config, $cookies, $rootScope){

/*
    var convertSolrHeaders = function(docs) {
        var doc, tmp, i, prop;
        for (i in docs) {
            doc = docs[i]
            for (prop in doc) {
                if (prop != 'id' && prop != "_version") {
                    tmp = doc[prop][0] // remove array wrap on field
                    delete doc[prop]
                    prop = prop.slice(0,-2) // remove _t from header
                    doc[prop] = tmp
                }
            }
            delete doc["_version"]
        }
        return docs
    }
*/

    var textSearch = function(recsys_id, searchQuery, start, rows) {
        var results = $q.defer()
        $http({
          method: 'GET', 
          url: config.server_url + '/text-search/',
          params: {
              'recsys_id': recsys_id,
              'rows': rows,
              'start': start,
              'q': searchQuery,
          },
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRFToken': $cookies.get('csrftoken')
          },
        }).then(function(resp){
          console.log(resp)
          var docs = resp.data.docs
          results.resolve(docs)
        }, function(resp){
          console.log(resp)
          results.resolve([])
        })

        return results.promise
    }




    var sendRating = function(item, item_id, rating, recsys_id, univ_code) {
      if (rating != 0) {
        var params = {
            'recsys_id': recsys_id,
            'item_id': item_id,
            'rating': rating,
            'univ_code': univ_code,
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
          $rootScope.$broadcast('itemRated', {'item':item, 'item_id':item_id, 'rating':rating})
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

    var filterFieldTemplate = {
            key: '',
            type: '',
	    //className: 'multi-check',
            templateOptions: {
                type: 'text',
                label: '',
            }
        }
    function convertToColTable(options, colNum) {
        var list = []
        var nested_list = []
        for (var i in options) {
            if (list.length < colNum) {
                list.push(options[i])
            } else {
                nested_list.push(list)
                list = [options[i],]
            }
        }
        if (list.length > 0) {
            nested_list.push(list)
        }
        return nested_list
    }

    function convertToOptions(values) {
        var list = []
        for (var i in values) {
            var option = { "name": values[i], "value": values[i] }
            list.push(option)
        }
        return list
    }

    var getFilterModel = function(template) {
       var model = {}
       var filters = template.filter_objects
       for (var i in filters) {
           var f = filters[i]
           if (f.type == 'numerical' && f.numerical_type == 'slider') {
               model[f.field] = { low: f.numerical_range[0], high:f.numerical_range[1] }
           }
       }
       console.log(model)
       return model
    }

    var getFilterFields = function(template) { // convert template to formly fields
       /*
           currently supports only slider and grid form types
        {

            numerical_fields:[],
            default_sort_param: param,
            filter_objects: [{
                type: numerical or qualitative,
                field: item_field name,
            
                numerical_range: [min, max], // round up and down for float vals. any value
                numerical_type: slider (int values), or plus/minus (with default value)
                default_value: //for plus minus
            
                qualitative_values: [], (dropdown to hand select) // either case, range 2 to 30
                qualitative_type: grid or dropdown,
                qualitative_value_count: x, number of values to use from the top x
            }, ...],

        }
       */
       var fields = []
       var filters = template.filter_objects
       var filter, obj
       for (var i in filters) {
           filter = filters[i]
           obj = angular.copy(filterFieldTemplate)
           obj.key = filter.field
           if (filter.type == 'numerical') {
               if (filter.numerical_type == 'slider') {
                   obj.type = 'range-slider-textbox'
                   obj.templateOptions['label'] = filter.field
                   obj.templateOptions['sliderOptions'] = {
                       floor: filter.numerical_range[0],
                       ceil: filter.numerical_range[1]
                   }
               }
              // else if (filter.numerical_type == 'plus-minus') {
              //     obj.type = 'plus-minus'
              // }
           } else { // qualitative
               if (filter.qualitative_type == 'grid') {
                   obj.type = 'multiCheckboxGrid'
               }
              // else if (filter.qualitative_type == 'dropdown') {
              //     obj.type = 'select'
              // }
               var options = convertToOptions(filter.qualitative_values)

               obj.templateOptions = {
                    label: filter.field,
	            options: options,
               }
           } 
           fields.push(obj)
       }
       return fields
    }

	

    return {
      loadAllItems : function() {
        return $q.when(itemData);
      },
      getMyRatingTemplate: getMyRatingTemplate,
      sendRating: sendRating,
      sendNotInterested: sendNotInterested,
      textSearch: textSearch,
      getFilterFields: getFilterFields,
      getFilterModel: getFilterModel,
    };


  };

})();

