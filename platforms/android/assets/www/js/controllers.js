angular.module('starter.controllers', ['firebase'])
.constant('FIREBASE_URI', "https://manjapp.firebaseio.com")

.controller('HomeCtrl',['$scope','$firebaseAuth','$state', function($scope,$firebaseAuth,$state) {

	$scope.login={};
	var firebaseObj = new Firebase("https://manjapp.firebaseio.com");
    var loginObj = $firebaseAuth(firebaseObj);

	$scope.signin = function(){

		var username = $scope.login.username;
		var password = $scope.login.password;

    	loginObj.$authWithPassword({
            email: username,
            password: password
        })
        .then(function(user) {
            //Success callback
            console.log('Authentication successful');
            SessionData.setUser(username);
            $state.go('userHome');

        }, function(error) {
            //Failure callback
            console.log('Authentication failure');
        });

	}

    $scope.showSignUp = function(){
        $state.go('signup');
    }
}])

.controller('StartCtrl', ['$scope','$state','$ionicLoading','$firebaseAuth','SessionData', function($scope,$state,$ionicLoading,$firebaseAuth,SessionData){

    $scope.login={};
    var firebaseObj = new Firebase("https://manjapp.firebaseio.com");
    var loginObj = $firebaseAuth(firebaseObj);

    $scope.signup = function(){

        var email = $scope.login.email;
        var password = $scope.login.password;

        $ionicLoading.show({
            templateUrl:'templates/loading.html'
        });

        loginObj.$createUser({
            email: email,
            password: password
        })
            .then(function() {
                // do things if success
                console.log('User creation success');
                $scope.signin();
                $ionicLoading.hide();
                //$state.go('login');
            }, function(error) {
                // do things if failure
                $ionicLoading.hide();
                console.log(error);
            });
    }

    $scope.signin = function(){
        var email = $scope.login.email;
        var password = $scope.login.password;
        var phone = $scope.login.phone;
        var name = $scope.login.name;

        loginObj.$authWithPassword({
            email: email,
            password: password
        })
        .then(function(user) {
            //Success callback
            console.log('Authentication successful');
            SessionData.setUser(email);
            firebaseObj.child("users").child(user.uid).set({
                name: name,
                phone: phone
            });
            
            $ionicLoading.hide();
            $state.go('manja-home');

        }, function(error) {
            //Failure callback
            console.log('Authentication failure');
        });

    }

}])

.controller('LoginCtrl', ['$scope','$firebaseAuth','$state', '$ionicLoading','SessionData', function($scope,$firebaseAuth,$state,$ionicLoading,SessionData) {
    $scope.login={};
    var firebaseObj = new Firebase("https://manjapp.firebaseio.com");
    var loginObj = $firebaseAuth(firebaseObj);


    $scope.signin = function(){
        var username = $scope.login.username;
        var password = $scope.login.password;

        $ionicLoading.show({
          templateUrl:'templates/loading.html'
        });

        loginObj.$authWithPassword({
            email: username,
            password: password
        })
        .then(function(user) {
            //Success callback
            console.log('Authentication successful');
            SessionData.setUser(username);

            $ionicLoading.hide();
            $state.go('manja-home');

        }, function(error) {
            //Failure callback
            $ionicLoading.hide();
            console.log('Authentication failure');
        });

    }

}])

.controller('StartHomeCtrl', function($scope, $state) {

})

.controller('DrinksCtrl', function($scope, $state) {

    // Create a callback which logs the current auth state
    function authDataCallback(authData) {
      if (authData) {
        console.log("User " + authData.uid + " is logged in with " + authData.provider);
      } else {
        console.log("User is logged out");
        $state.go('loginHome');
      }
    }

    // Register the callback to be fired every time auth state changes
    var ref = new Firebase("https://manjapp.firebaseio.com");
    ref.onAuth(authDataCallback);

})

.controller('LoginHomeCtrl', function($scope) {
})

.controller('ShoppingCartCtrl', function($scope) {
})

.controller('PrivacyCtrl', function($scope) {
})

.controller('SeatCtrl', function($scope) {
    
})

.controller('ResetCtrl', function($scope) {
    var ref = new Firebase("https://manjapp.firebaseio.com");
    $scope.reset = function(email) {
        ref.resetPassword({
            email : email
          }, function(error) {
          if (error === null) {
            console.log("Password reset email sent successfully");
          } else {
            console.log("Error sending password reset email:", error);
          }
        });
    }
})

.controller('PWChangeCtrl', function($scope, $state) {

var ref = new Firebase("https://manjapp.firebaseio.com");

  $scope.change = function(email, oldPassword, newPassword) {

    ref.changePassword({
      email       : email,
      oldPassword : oldPassword,
      newPassword : newPassword
    }, function(error) {
      if (error === null) {
        console.log("Password changed successfully");
        $state.go("login");
      } else {
        console.log("Error changing password:", error);
      }
    });

  }

})

.controller('ReceiptCtrl', function($scope, $state, $ionicHistory, Products) {

    // Create a callback which logs the current auth state
    function authDataCallback(authData) {
      if (authData) {
        console.log("User " + authData.uid + " is logged in with " + authData.provider);
        authUser = authData;
            
      } else {
        console.log("User is logged out");
        $state.go('loginHome');
      }
    }

    // Register the callback to be fired every time auth state changes
    var ref = new Firebase("https://manjapp.firebaseio.com");
    ref.onAuth(authDataCallback);

  $scope.goHome = function() {
    /*while (Products.galleryProducts.length) {
        Products.galleryProducts.pop();
    }
    while (Products.cartProducts.length) {
        Products.cartProducts.pop();
    }*/
    $state.go("manja-home");
  }
})

.controller('AdminCtrl', function($scope, $state) {
    var ref = new Firebase("https://manjapp.firebaseio.com/orders");

    // Attach an asynchronous callback to read the data at our posts reference
    ref.on("value", function(snapshot) {
        $scope.orders = snapshot.val();
        $scope.$apply();
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });

    $scope.select = function(key, value) {
        $scope.choice = value;
        $scope.choiceid = key;
        console.log($scope.choice);
    }

    $scope.move = function(option) {
        var itemRef = new Firebase("https://manjapp.firebaseio.com/orders" + '/' + $scope.choiceid);
        itemRef.update({
            "status": "closed"
        });
    }

    $scope.remove = function(option) {
        var itemRef = new Firebase("https://manjapp.firebaseio.com/orders" + '/' + $scope.choiceid);
        // console.log($scope.choiceid);
        itemRef.remove();
        $scope.choice = null;
        $scope.choiceid = null;
    }

})

.controller('FBLoginCtrl', function($scope, $state, $ionicLoading) {
var ref = new Firebase("https://manjapp.firebaseio.com");
var userData = null;

$scope.login={};

$ionicLoading.show({
  templateUrl:'templates/loading.html'
});

ref.authWithOAuthPopup("facebook", function(error, authData) {

  if (error) {
    console.log("Login Failed!", error);
    $ionicLoading.hide();
  } else {

    userData = authData;

    ref.once('value', function(snapshot) {
        if (snapshot.child("users").hasChild(authData.uid)) {
            console.log("user already set up");
            $ionicLoading.hide();
            $state.go("manja-home");
        }
        else {
            $scope.login.name = authData.facebook.displayName;
            $scope.login.email = authData.facebook.email;
            $ionicLoading.hide();
        }
    });

    console.log("Authenticated successfully with payload:", authData);
    //$state.go('manja-home');

  }
}, {
    scope: "email"
});

$scope.submit = function() {

    ref.child("users").child(userData.uid).set({
        name: $scope.login.name,
        email: $scope.login.email,
        phone: $scope.login.phone
    });

    $state.go("manja-home");
}




})

.controller('ManjaHomeCtrl', function($scope, $state, $ionicSideMenuDelegate) {

    var authUser = null;

    // Create a callback which logs the current auth state
    function authDataCallback(authData) {
      if (authData) {
        console.log("User " + authData.uid + " is logged in with " + authData.provider);
        authUser = authData;
            
      } else {
        console.log("User is logged out");
        $state.go('loginHome');
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

})

.controller('TutorialCtrl', function($scope, $state, $ionicHistory) {
    $scope.startApp = function() {
        $state.go('loginHome');
        window.localStorage['didTutorial'] = 'true';

    };

    if (window.localStorage['didTutorial'] === 'true') {
        $ionicHistory.nextViewOptions({
          disableAnimate: true,
          disableBack: true
        });
        $scope.startApp();
    }

    else {
        // User hasn't completed tutorial yet
        // console.log("Need to do tutorial!!!");
    }

    $scope.myActiveSlide = 0;
})

.controller('UserHomeCtrl', ['$scope','$state','$firebaseAuth', function($scope,$state,$firebaseAuth){
    $scope.showAddOrder = function(){
        $state.go('addOrder');
    }

    var firebaseObj = new Firebase("https://manjapp.firebaseio.com/MyOrder");
    var sync = $firebaseAuth(firebaseObj);
    // $scope.Orders = sync.$asArray();


}])

.controller('SignUpCtrl', ['$scope','$state','$firebaseAuth', function($scope,$state,$firebaseAuth){

    $scope.login={};
    var firebaseObj = new Firebase("https://manjapp.firebaseio.com");
    var loginObj = $firebaseAuth(firebaseObj);

    $scope.showSignIn = function(){
        $state.go('home');
    }

    $scope.signup = function(){
        var email = $scope.login.email;
        var password = $scope.login.password;

        loginObj.$createUser({
            email: email,
            password: password
        })
            .then(function() {
                // do things if success
                console.log('User creation success');
                $state.go('home');
            }, function(error) {
                // do things if failure
                console.log(error);
            });
    }

}])

.service('SessionData', function() {
    var user = '';

    return {
        getUser: function() {
            return user;
        },
        setUser: function(value) {
            user = value;
        }
    };
})
.factory("Items", function($firebaseArray) {
  var itemsRef = new Firebase("https://manjapp.firebaseio.com/items");
  return $firebaseArray(itemsRef);
})
.controller("MainCtrl", function($scope, Items) {
  $scope.items = Items;
  $scope.addItem = function() {
    var name = prompt("What do you need to buy?");
    if (name) {
      $scope.items.$add({
        "name": name
      });
    }
  };
});
// .controller('MainCtrl', ['$scope', 'ordersService', function( $scope, ordersService, $firebaseArray ) {
//
//           $scope.newOrder = {
//             name: '',
//             type: ''
//           };
//
//           $scope.data = {};
//           $scope.data.orders = ordersService.getOrders();
//
//           $scope.addOrder = function() {
//
//
//
//             $scope.newOrder.$add ({
//                 name: '',
//                 type: ''
//             });
//
//           };
//           $scope.updateOrder = function (id) {
//             ordersService.updateOrder(id);
//           };
//
//           $scope.removeOrder = function(id) {
//             ordersService.removeOrder(id);
//           };
//         }])
//
//         .factory('ordersService', ['$firebaseArray', 'FIREBASE_URI',
//           function ($firebaseArray, FIREBASE_URI) {
//             var ref = new Firebase(FIREBASE_URI);
//
//             var orders = $firebaseArray;
//
//             var getOrders = function(){
//               console.log('getorders');
//               return orders;
//             };
//
//             var addOrder = function (newOrder) {
//               console.log(newOrder)
//               orders.$add(newOrder);
//             };
//
//             var updateOrder = function (id){
//               orders.$save(id);
//             };
//
//             var removeOrder = function (id) {
//               orders.$remove(id);
//             };
//
//             return {
//               getOrders: getOrders,
//               addOrder: addOrder,
//               updateOrder: updateOrder,
//               removeOrder: removeOrder,
//             }
//
//         }]);
