app.controller('CheckoutController',['$scope', '$state', '$http', '$ionicSideMenuDelegate', 'Products','stripeCheckout', function($scope, $state, $http, $ionicSideMenuDelegate, Products, stripeCheckout){
  // PRODUCTS IN CART //
  $scope.cartProducts = Products.cartProducts;
  $scope.total = Products.finalTotal;

  /* MENU TOGGLES */
  $scope.toggleRightSideMenu = function() {
    $ionicSideMenuDelegate.toggleRight();
  };

  $scope.back = function() {
    $ionicSideMenuDelegate.isOpen() ? $ionicSideMenuDelegate.toggleRight() : $state.go('cart');
  };


  function getUTCTime() {
      var d = new Date();
      return d.toLocaleTimeString();
  }


  $scope.send = function(section, row, seat) {
    

    // Create a callback which logs the current auth state
    function authDataCallback(authData) {
      if (authData) {
        console.log("User " + authData.uid + " is logged in with " + authData.provider);

        ref.once('value', function(snapshot) {
            if (snapshot.child("users").child(authData.uid).hasChild("stripeToken")) {
              // charging card
              var card = snapshot.child("users").child(authData.uid).child("stripeToken").val();
              
              $http.post('http://localhost:5000/stripe/pay', card);

              $state.go("receipt");
            }
            else {
                alert("Please enter your payment info before checking out.");
                $state.go("manja-home");
            }
        
        });



            
      } else {
        console.log("User is logged out");
        $state.go('loginHome');
      }
    }

    // Register the callback to be fired every time auth state changes
    var ref = new Firebase("https://manjapp.firebaseio.com");
    ref.onAuth(authDataCallback);

    var formattedProducts = [];
    for (var i = 0; i < Products.cartProducts.length; i++) {
      var title = Products.cartProducts[i].title;
      var description = Products.cartProducts[i].description;
      var quantity = Products.cartProducts[i].purchaseQuantity;
      var image = Products.cartProducts[i].images[0];
      var price = Products.cartProducts[i].price;
      
      var product = {
        "title" : title,
        "description" : description,
        "quantity" : quantity,
        "image" : image,
        "price" : price
      }

      formattedProducts.push(product);
    }


  	var obj = {
      "time" : getUTCTime(),
  		"section" : section,
      "row" : row,
      "seat" : seat,
  		"total" : $scope.total,
      "status" : "open",
  		"products" : formattedProducts
  	}

    // $http.post('http://localhost:5000/json-handler', obj);
    var ref = new Firebase("https://manjapp.firebaseio.com");
    var orderRef = ref.child("orders");
    orderRef.push(obj);

  	console.log("seat: " + section + " " + row + " " + seat);
  	console.log("TOTAL: $" + $scope.total);

  	console.log("-------------------------------------");
  	for (var i = 0; i < Products.cartProducts.length; i++) {
  		console.log("PRINTING ITEM "+i);
  		console.log("title: "+Products.cartProducts[i].title);
  		console.log("description: "+Products.cartProducts[i].description);
  		console.log("quantity: "+Products.cartProducts[i].purchaseQuantity);
  		console.log("price: $"+Products.cartProducts[i].price);
  		console.log("-------------------------------------");
  	}
  	
	// alert("check console log");
  }

}]);