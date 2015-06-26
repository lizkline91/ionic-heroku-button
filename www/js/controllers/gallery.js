app.controller('GalleryController',[
  '$scope',
  '$state',
  '$ionicSideMenuDelegate',
  'Products',
  'stripeCheckout',
  function($scope, $state, $ionicSideMenuDelegate, Products, stripeCheckout){


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


  var images = [['img/dasani.png'],['img/coke.png'],['img/zero.png'],['img/diet.png'],['img/sprite.png'],['img/drpepper.png'],
  ['img/bud_light.png'],['img/budweiser.png'],['img/coors_light.png'],['img/miller_light.png'],
  ['img/orange_juice.png'],['img/iced_tea.png'],['img/lemonade.png'],
  ['img/hotdog.jpg'],['img/spicy_sausage.jpg'],
  ['img/cracker_jacks.jpg'],['img/pretzel.jpg'],['img/peanuts.jpg'],['img/boiled_peanuts.jpg']];


  $scope.cartNumber = Products.cartProducts;

  // PRODUCTS IN CART //
  $scope.products = Products.galleryProducts;




  //alert(document.getElementById("basket").src);
  //document.getElementById("basket").src="/img/save.png";

  
  /*var prices = [1.50, 1.50, 2, 2];

  if (!$scope.products.length) {
    for (var i = 0; i < 25; i++) {
      var ind = i;

      var prod         = {};
      prod.id          = i+1;
      prod.title       = 'Soda';
      prod.images      = images[ind];
      prod.description = 'drink';
      prod.quantity    = ind+1;
      prod.price       = prices[ind];
      Products.galleryProducts.push(prod);
    }
  }*/

  $scope.goToCart = function(){
    $state.go('cart');
  };

}]);

app.controller('Gallery2Controller',[
  '$scope',
  '$state',
  '$ionicSideMenuDelegate',
  'Products',
  'stripeCheckout',
  function($scope, $state, $ionicSideMenuDelegate, Products, stripeCheckout){



    var authUser = null;

    // Create a callback which logs the current auth state
    function authDataCallback(authData) {
      if (authData) {
        console.log("User " + authData.uid + " is logged in with " + authData.provider);
        authUser = authData;
            
      } else {
        console.log("User is logged out");
        $state.go('loginHome');
        window.location.reload();
      }
    }

    // Register the callback to be fired every time auth state changes
    var ref = new Firebase("https://manjapp.firebaseio.com");
    ref.onAuth(authDataCallback);

    $scope.logout = function() {
        ref.unauth();
    };

    var handler = StripeCheckout.configure({
        key: 'pk_test_8cxzHHCLNLf0WmeIzZbVeyOl',
        image: '/img/manja.png',
        panelLabel: "Add Card",
        token: function(token, args) {
          // Use the token to create the charge with a server-side script.
          // You can access the token ID with `token.id`
            //alert("doing stuff");


            ref.child("users").child(authUser.uid).update({
                stripeToken : token
            });


        }
    });
 
  document.getElementById('customButton').addEventListener('click', function(e) {
    // Open Checkout with further options
    handler.open({
      name: 'Manja',
      description: 'Enjoy the game.'
    });
    e.preventDefault();
  });








  $scope.cartNumber = Products.cartProducts;

  // PRODUCTS IN CART //
  $scope.products = Products.galleryProducts;

  // Get a database reference to our posts
  var prodRef = new Firebase("https://manjapp.firebaseio.com/products");

  //if (Products.galleryProducts.length == 0) {


  // Retrieve new posts as they are added to our database
  prodRef.on("child_added", function(snapshot, prevChildKey) {
    var newPost = snapshot.val();
    Products.galleryProducts.push(newPost);
    console.log("adding");
  });




  //}


}]);

