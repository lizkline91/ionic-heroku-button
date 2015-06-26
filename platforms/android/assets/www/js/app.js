// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var app = angular.module('starter', ['ionic', 'ionicShop', 'starter.controllers']);

app.run(function($ionicPlatform, stripeCheckout, $http) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }

    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });

   stripeCheckout.setStripeKey('pk_test_hXnwnglXuPWNu5NRmmJJdrwX');

   stripeCheckout.setStripeTokenCallback = function(status, response, products) {
     console.log(status, response, products);
     $http.post('/stripe/pay', {
      stripeToken : response.id,
      products: products
     })
     .success(function(data){
      console.log(data);
     });
   };

});

app.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  .state('startHome', {
    url:'/startHome',
    templateUrl:'templates/startHome.html',
    controller:'StartHomeCtrl'
  })

  .state('start', {
    url:'/start',
    templateUrl:'templates/start.html',
    controller:'StartCtrl'
  })

  .state('gallery.soda', {
    url:'/soda',
    views: {
      'soda-tab': {
        templateUrl: 'templates/soda.html',
        controller: 'GalleryController'
      }
    }
  })

  .state('gallery.beer', {
    url:'/beer',
    views: {
      'beer-tab': {
        templateUrl: 'templates/beer.html',
        controller: 'GalleryController'
      }
    }
  })

  .state('gallery.other', {
    url:'/other',
    views: {
      'other-tab': {
        templateUrl: 'templates/drinks-other.html',
        controller: 'GalleryController'
      }
    }
  })

  .state('fb-login', {
    url:'/fb-login',
    cache: false,
    templateUrl:'templates/fb-login.html',
    controller:'FBLoginCtrl'
  })

  .state('loginHome', {
    url:'/loginHome',
    templateUrl:'templates/loginHome.html',
    controller:'LoginHomeCtrl'
  })

  .state('login', {
    url:'/login',
    templateUrl:'templates/login.html',
    controller:'LoginCtrl'
  })

  .state('reset', {
    url:'/reset',
    templateUrl:'templates/reset.html',
    controller:'ResetCtrl'
  })

  .state('passwordChange', {
    url:'/passwordChange',
    templateUrl:'templates/passwordChange.html',
    controller:'PWChangeCtrl'
  })

  .state('privacy', {
    url:'/privacy',
    templateUrl:'templates/privacy.html',
    controller:'PrivacyCtrl'
  })

  .state('manja-home', {
    url:'/manja-home',
    templateUrl:'templates/manja-home.html',
    controller:'Gallery2Controller'
  })

  .state('shopping-cart', {
    url:'/shopping-cart',
    templateUrl:'templates/shopping-cart.html',
    controller:'ShoppingCartCtrl'
  })

  .state('tutorial', {
    url:'/tutorial',
    templateUrl:'templates/tutorial.html',
    controller:'TutorialCtrl'
  })

  .state('home', {
    url:'/home',
    templateUrl:'templates/home.html',
    controller:'HomeCtrl'
  })

  .state('userHome', {
    url:'/userHome',
    templateUrl:'templates/userHome.html',
    controller:'UserHomeCtrl'
  })

  .state('receipt', {
    url:'/receipt',
    templateUrl:'templates/receipt.html',
    controller:'ReceiptCtrl'
  })

  .state('orders', {
    url:'/orders',
    templateUrl:'templates/admin.html',
    controller:'AdminCtrl'
  })

  .state('signup', {
    url:'/signup',
    templateUrl:'templates/signup.html',
    controller:'SignUpCtrl'
  })

  .state('seat', {
    url:'/seat',
    templateUrl:'templates/seat.html',
    controller:'CheckoutController'
  })

  .state('addOrder', {
    url:'/addOrder',
    templateUrl:'templates/addOrder.html',
    controller:'MainCtrl'
  })
  .state('cart',{
      url: '/cart',
      templateUrl: 'templates/cart.html',
      controller: 'CartController'
    })
    .state('checkout',{
      url: '/checkout',
      templateUrl: 'templates/checkout.html',
      controller: 'CheckoutController'
    })
    .state('gallery', {
      url: '/gallery',
      abstract: true,
      templateUrl: 'templates/gallery.html',
      controller: 'GalleryController'
    })
    .state('snacks', {
      url: '/snacks',
      templateUrl: 'templates/snacks.html',
      controller: 'GalleryController'
    })
    .state('swag', {
      url: '/swag',
      templateUrl: 'templates/swag.html',
      controller: 'GalleryController'
    })
    .state('food', {
      url: '/food',
      templateUrl: 'templates/food.html',
      controller: 'GalleryController'
    });


  $urlRouterProvider.otherwise('/tutorial');
});
