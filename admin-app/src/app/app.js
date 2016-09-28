(function(){
  'use strict';

  angular.module('app', [ 'ngMaterial', 'formly', 'formlyBootstrap', 'rzModule', 'ncy-angular-breadcrumb', 'ngFileUpload', 'ngToast' ])
    .config(function($mdThemingProvider) {
      //themes are still defined in config, but the css is not generated
      $mdThemingProvider.theme('success-toast');
      $mdThemingProvider.theme('error-toast');
    });

    var home_location = 'http://localhost:3000'

    var login = 'sunb1';
    var connection = {
        'user': login,
        'repo_base': login
    };

	function saveIfSet(assocArray, key) {
	    if (assocArray[key]) {
	        console.log('Saving ' + key + ': ' + assocArray[key]);
	        sessionStorage.setItem(key, assocArray[key]);
	    }
	}

    function paramsFromQuery(query) {
        var params = {};
        var parts = query.split('&');
        for (var i = parts.length - 1; i >= 0; i--) {
            var pieces = parts[i].split('=');
            params[decodeURIComponent(pieces[0])] = decodeURIComponent(
                pieces[1].replace(/\+/g, ' '));
        }
        return params;
    }

    if (window.location.hash.length > 1 && window.location.hash != '#/table') {
        var params = paramsFromQuery(window.location.hash.substring(1));
        if (params['access_token']) {
            var keys = ['access_token', 'scope'];
            for (var i = keys.length - 1; i >= 0; i--) {
                console.log('Trying ' + keys[i]);
                saveIfSet(params, keys[i]);
            }
            // Keep track of who this access token is associated with.
            sessionStorage.setItem('authorized_user', connection.user);
            // Clear the hash after handling the access_token.
            // Just setting window.location.hash = "" leaves a dangling #.
            history.replaceState("", document.title, window.location.pathname + window.location.search);
        }
        console.log(params);
    }

    if (window.location.search.indexOf('code=') != -1) {
        sessionStorage.setItem("code", window.location.search.substring(window.location.search.indexOf('=')+1))
        // alert(sessionStorage.getItem("code"));
        window.location.href = home_location
    }

    if (window.location.search.indexOf('auth_user=') != -1) {
        sessionStorage.setItem("username", window.location.search.substring(window.location.search.indexOf('=')+1))
        // document.cookie = 'username='+window.location.search.substring(window.location.search.indexOf('=')+1)
        window.location.href = home_location
    }

    // TODO: extract auth_user on a DH redirect. add to sessionStorage. check if auth user exists on page load.

    $.ajaxSetup({
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' +
                sessionStorage.getItem('access_token'));
        },
    });

})();
