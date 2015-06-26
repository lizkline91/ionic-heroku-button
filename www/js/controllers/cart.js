app.controller('CartController',[
  '$scope',
  'Products',
  'stripeCheckout',
  '$http',
  '$timeout',
  '$state',
  '$ionicHistory',
  function($scope, Products, stripeCheckout, $http, $timeout, $state, $ionicHistory){
  // PRODUCTS IN CART //
  $scope.cartProducts = Products.cartProducts;


    // Create a callback which logs the current auth state
    function authDataCallback(authData) {
      if (authData) {
        console.log("User " + authData.uid + " is logged in with " + authData.provider);
            
      } else {
        console.log("User is logged out");
        $state.go('loginHome');
        window.location.reload();
      }
    }

    // Register the callback to be fired every time auth state changes
    var ref = new Firebase("https://manjapp.firebaseio.com");
    ref.onAuth(authDataCallback);


  // TO BE REMOVED

  $scope.checkoutPath = 'checkout';

  $scope.goToGallery = function(){
    $state.go('gallery');
  };

  $scope.myGoBack = function() {
    $ionicHistory.goBack();
  };

}]);
