'use strict';

angular.module('angularMaterialAdmin', ['ngAnimate', 'ngCookies', 'ngTouch',
  'ngSanitize', 'ui.router', 'ngMaterial', 'nvd3', 'app','formly','formlyBootstrap', 'ncy-angular-breadcrumb' ])

  .config(function($breadcrumbProvider) {
    $breadcrumbProvider.setOptions({
      prefixStateName: 'home',
      template: 'bootstrap3'
    })
  })

  .config(function ($stateProvider, $urlRouterProvider, $mdThemingProvider,
                    $mdIconProvider) {
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
        data: {
          title: 'Login'
        }
      })
      .state('home.signup', {
        url: '/signup',
        templateUrl: 'app/views/signup.html',
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

    $urlRouterProvider.otherwise('/items');

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
