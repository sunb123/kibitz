'use strict';

angular.module('adminapp', ['ngAnimate', 'ngCookies', 'ngTouch', 'gridster', 'dndLists',
  'ngSanitize', 'ui.bootstrap', 'ui.router', 'ngMaterial', 'nvd3', 'app','formly','formlyBootstrap', 'ncy-angular-breadcrumb', 'ngToast',
  'slickCarousel', 'color.picker', 'cgBusy', 'checklist-model'])

  .constant('config', {
    home_url: 'http://localhost:3000', // TODO: change to app location
    server_url: 'http://localhost:8000/api/v1', // TODO: change to server location
    dh_login_url: 'https://datahub.csail.mit.edu/account/login?redirect_url='+'http://localhost:3000',
    dh_signup_url: 'https://datahub.csail.mit.edu/account/register?redirect_url='+'http://localhost:3000',
    buildURL: function(path, params) {
        var base_url = 'https://datahub.csail.mit.edu';
        var query = '';
        if (params !== undefined && Object.keys(params).length > 0) {
            query = '?' + $.param(params);
        }
        return base_url + path + query;
    },
    client_id: 'sphQrMCcfdIjker5ghseFx7vRfV2bcwBfqJVRKAe',
  })

  .config(function($mdThemingProvider) {
    //themes are still defined in config, but the css is not generated
    $mdThemingProvider.theme('success-toast');
    $mdThemingProvider.theme('error-toast');
  })

  .config(function($breadcrumbProvider) {
    $breadcrumbProvider.setOptions({
      prefixStateName: 'home',
      template: 'bootstrap3'
    })
  })

  .config(function ($stateProvider, $urlRouterProvider, $mdThemingProvider,
                    $mdIconProvider, $httpProvider) {

    $httpProvider.defaults.withCredentials = true;
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    $httpProvider.defaults.headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken'),
    }

    $stateProvider
      .state('home', {
        url: '',
        templateUrl: 'app/views/main.html',
        controller: 'MainController',
        controllerAs: 'vm',
        abstract: true,
        ncyBreadcrumb: {
          label: 'Home Page'
        },
      })
      .state('home.login', {
        url: '/login',
        templateUrl: 'app/views/login.html',
        controller: 'LoginController',
        controllerAs: 'vm',
        data: {
          title: 'Login'
        }
      })
      .state('home.signup', {
        url: '/signup',
        templateUrl: 'app/views/signup.html',
        controller: 'SignupController',
        controllerAs: 'vm',
        data: {
          title: 'Sign Up'
        }
      })
      .state('home.profile', {
        url: '/profile',
        templateUrl: 'app/views/profile.html',
        controller: 'ProfileController',
        controllerAs: 'vm',
        data: {
          title: 'Profile'
        },
        ncyBreadcrumb: {
          label: 'Profile'
        },
      })
      .state('home.table', {
        url: '/table',
        controller: 'TableController',
        controllerAs: 'vm',
        templateUrl: 'app/views/table.html',
        data: {
          title: 'Table'
        },
        ncyBreadcrumb: {
          label: 'Recommender List',
          // parent: 'home'
        },
      })
      .state('home.recsys', {
        url: '/recsys/:id',
        controller: 'RecsysController',
        controllerAs: 'vm',
        templateUrl: 'app/views/recsys.html',
        data: {
          title: 'Recsys'
        },
        params: {
          model: null
        },
        ncyBreadcrumb: {
          label: 'Settings',
          parent: 'home.table'
        },
      });

    // $urlRouterProvider.otherwise('/table');

    function getCookie(name) {
        var value = "; " + document.cookie;
        var parts = value.split("; " + name + "=");
        if (parts.length == 2) {
            return parts.pop().split(";").shift();
        } else {
            return false
        }
    }

    $urlRouterProvider.otherwise(function($injector, $location){
      if (getCookie('k_username')) { // logged in
        $location.path('/table')
      } else {
        $location.path('/login')
      }
    });

    $mdThemingProvider
      .theme('default')
        .primaryPalette('grey', {
          'default': '600'
        })
        .accentPalette('teal', {
          'default': '500'
        })
        .warnPalette('defaultPrimary');

    $mdThemingProvider.theme('dark', 'default')
      .primaryPalette('defaultPrimary')
      .dark();

    $mdThemingProvider.theme('grey', 'default')
      .primaryPalette('grey');

    $mdThemingProvider.theme('custom', 'default')
      .primaryPalette('defaultPrimary', {
        'hue-1': '50'
    });

    $mdThemingProvider.definePalette('defaultPrimary', {
      '50':  '#FFFFFF',
      '100': 'rgb(255, 198, 197)',
      '200': '#E75753',
      '300': '#E75753',
      '400': '#E75753',
      '500': '#E75753',
      '600': '#E75753',
      '700': '#E75753',
      '800': '#E75753',
      '900': '#E75753',
      'A100': '#E75753',
      'A200': '#E75753',
      'A400': '#E75753',
      'A700': '#E75753'
    });

    String.prototype.format = function () {
            var args = [].slice.call(arguments);
            return this.replace(/(\{\d+\})/g, function (a){
                return args[+(a.substr(1,a.length-2))||0];
            });
    };

    // $mdIconProvider.icon('user', 'assets/images/user.svg', 64);


    // $('body').on('click', function (e) {
    //     $('[data-toggle="popover"]').each(function () {
    //         //the 'is' for buttons that trigger popups
    //         //the 'has' for icons within a button that triggers a popup
    //         if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
    //             $(this).popover('hide');
    //         }
    //     });
    // });


    // $(document).on('click', function (e) {
    //     $('[data-toggle="popover"],[data-original-title]').each(function () {
    //         //the 'is' for buttons that trigger popups
    //         //the 'has' for icons within a button that triggers a popup
    //         if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
    //             (($(this).popover('hide').data('bs.popover')||{}).inState||{}).click = false  // fix for BS 3.3.6
    //         }

    //     });
    // });


  });