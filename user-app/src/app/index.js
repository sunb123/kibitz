'use strict';

angular.module('userapp', ['ngAnimate', 'ngCookies', 'ngTouch',
  'ngSanitize', 'ui.router', 'ngMaterial', 'nvd3', 'app','formly','formlyBootstrap', 'ncy-angular-breadcrumb', 'cgBusy' ])

  .constant('config', {
    server_url: 'http://localhost:8000/api/v1', // TODO: change to server location
    app_home_url: 'http://localhost:3001', // TODO: will be http://kibitz2.csail.mit.edu/
    buildURL: function(path, params) {
        var base_url = 'https://datahub.csail.mit.edu';
        var query = '';
        if (params !== undefined && Object.keys(params).length > 0) {
            query = '?' + $.param(params);
        }
        return base_url + path + query;
    },
  })

  .config(function($breadcrumbProvider) {
    $breadcrumbProvider.setOptions({
      prefixStateName: 'home',
      template: 'bootstrap3'
    })
  })

  .config(function($mdThemingProvider) {
    //themes are still defined in config, but the css is not generated
    $mdThemingProvider.theme('success-toast');
    $mdThemingProvider.theme('error-toast');

    $mdThemingProvider.theme('dark-grey').backgroundPalette('grey').dark();
  })

  .config(function ($stateProvider, $urlRouterProvider, $mdThemingProvider,
                    $mdIconProvider, $httpProvider) {
    $httpProvider.defaults.withCredentials = true;

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
      .state('home.items', {
        url: '/items',
        controller: 'ItemsController',
        controllerAs: 'vm',
        templateUrl: 'app/views/items.html',
        data: {
          title: 'Items'
        },
        ncyBreadcrumb: {
          label: 'Recommender List',
          // parent: 'home'
        },
      })
      .state('home.recsys', {
        url: '/recsys',
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
          parent: 'home.items'
        },
      });

    // $urlRouterProvider.otherwise('/items');

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
      if (getCookie('myusername') && getCookie('mysessionid')) { // logged in
        $location.path('/items')
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

    $mdIconProvider.icon('user', 'assets/images/user.svg', 64);
  });