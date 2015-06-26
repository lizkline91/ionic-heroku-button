(function(angular) {
  //Service Module for ionic-shop
  var app = angular.module('ionicShop.services', ['ionic']);
  //PRODUCT SERVICE HOLDING ALL ITEMS
  app.service('Products',['$http', function($http){

    this.galleryProducts = [];
    this.cartProducts = [];
    this.checkout = {};

    this.addToCart = function(product){
      var productInCart = false;
      this.cartProducts.forEach(function(prod, index, prods){
        if (prod.id === product.id) {
          productInCart = prod;
          return;
        }
      });

      if (productInCart) {
        this.addOneProduct(productInCart);
      } else {
        product.purchaseQuantity = 0;
        this.addOneProduct(product);
        this.cartProducts.push(product);
      }
    };

    this.removeProduct = function(product) {
      this.cartProducts.forEach(function(prod, i, prods){
        if (product.id === prod.id) {
          this.cartProducts.splice(i, 1);
          this.updateTotal();
        }
      }.bind(this));
    };

    this.addOneProduct = function(product) {
      --product.quantity;
      ++product.purchaseQuantity;

      this.updateTotal();
    };

    this.removeOneProduct = function(product) {
      ++product.quantity;
      --product.purchaseQuantity;
      this.updateTotal();
    };

    this.cartTotal = function() {
      var total = 0;
      this.cartProducts.forEach(function(prod, index, prods){
        total += prod.price * prod.purchaseQuantity;
      });

      return formatTotal(total);
    };

    var formatTotal = function(total) {
      return total.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    };

    this.updateTotal = function(){
      this.total = this.cartTotal();
    }.bind(this);

    this.updateTotal();

    this.getProducts = function(callback){
      $http.get('/admin/panel/products')
      .success(function(products){
        this.galleryProducts = products;
        if (callback) {callback();}
      }.bind(this));
    };

  }]);

  //CHECKOUT VALIDATION SERVICE
  app.service('CheckoutValidation', function(){

    this.validateCreditCardNumber = function(cc){
      return Stripe.card.validateCardNumber(cc);
    };

    this.validateExpiry = function(month, year){
      return Stripe.card.validateExpiry(month, year);
    };

    this.validateCVC = function(cvc){
      return Stripe.card.validateCVC(cvc);
    };

    this.validateEmail = function(email) {
      var emailReg = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return emailReg.test(email);
    };

    this.validateZipcode = function(zipcode) {
      var zipReg = /(^\d{5}$)|(^\d{5}-\d{4}$)/;
      return zipReg.test(zipcode);
    };

    this.checkAll = function(checkoutDetails) {
      if (Object.keys(checkoutDetails).length === 0) { return false; }
      for (var input in checkoutDetails) {
        /* Check validation for credit card number */
        if (input === 'cc' && !this.validateCreditCardNumber(checkoutDetails[input])) {
          return false;
        }
        /* Check validation for expiration date on credit card */
        if (input === 'exp' && !this.validateExpiry(checkoutDetails[input].slice(0,2), checkoutDetails[input].slice(3))) {
          return false;
        }
        /* Check validation for cvc number on credit card */
        if (input === 'cvc' && !this.validateCVC(checkoutDetails[input])) {
          return false;
        }

        if (input === 'email' && !this.validateEmail(checkoutDetails[input])) {
          return false;
        }

        if (input === 'zipcode' && !this.validateZipcode(checkoutDetails[input])) {
          return false;
        }
      }
      return true;
    }.bind(this);
  });

  //STRIPE INTEGRATION SERVICE
  app.service('stripeCheckout',['Products','CheckoutValidation' ,'$http', function(Products, CheckoutValidation, $http){
    
    this.setStripeKey = function(key){
      Stripe.setPublishableKey(key);
    };

    this.setStripeTokenCallback = function(){
      
    };

    this.processCheckout = function(checkoutDetails, callback){
      var cc    = checkoutDetails.cc;
      var month = checkoutDetails.exp.slice(0,2);
      var year  = checkoutDetails.exp.slice(3);
      var cvc   = checkoutDetails.cvc;

      Stripe.card.createToken({
        number    : cc,
        cvc       : cvc,
        exp_month : month,
        exp_year  : year
      }, callback);
    };

    this.stripeCallback = function(status, response){
      this.setStripeTokenCallback(status, response);
    }.bind(this);

    var pay = function(response) {
      var token = response.id;
      url = '/stripe/pay';
      $http.post(url, {stripeToken: token});
    };

  }]);

})(angular);
(function(angular) {
  
  //IONIC CART DIRECTIVE
  var app = angular.module('ionicShop.directives', ['ionic', 'ionicShop.services']);

  app.directive('ionCart',['Products','$templateCache', '$ionicPopup', function(Products, $templateCache, $ionicPopup){
    var link = function(scope, element, attr) {
      scope.$watch('products.length', function(newVal, oldVal){
        Products.updateTotal();
        scope.emptyProducts = newVal > 0 ? false : true;
        scope.tip = "0.00";
        scope.subTotal = Products.total;
        scope.total = (Number(Products.total) + 3.0).toFixed(2);
      });

      scope.emptyProducts = scope.products.length ? false : true;

      scope.addProduct = function(product) {
        Products.addOneProduct(product);
        scope.subTotal = Products.total;
        scope.total = (Number(Products.total) + 3.0).toFixed(2);
      };

      scope.removeProduct = function(product){
        if (product.purchaseQuantity <= 1) {
          Products.removeProduct(product);
          //product.purchaseQuantity <= 1 ? Products.removeProduct(product) : Products.removeOneProduct(product);
        }
        Products.removeOneProduct(product);
        scope.subTotal = Products.total;
        scope.total = (Number(Products.total) + 3.0).toFixed(2);
      };

      scope.updateTip = function(val) {
        scope.tip = val.toFixed(2);
        scope.total = (Number(Products.total) + 3.0 + Number(scope.tip)).toFixed(2);
      };

      scope.calcTotal = function() {
        Products.finalTotal = scope.total;
      };


      scope.showPopup = function() {
        scope.data = {}

        // An elaborate, custom popup
        var myPopup = $ionicPopup.show({
          template: '<input type="text" ng-model="data.customTip">',
          title: 'Enter Tip Amount',
          subTitle: 'Thank you!',
          scope: scope,
          buttons: [
            { text: 'Cancel' },
            {
              text: '<b>Okay</b>',
              type: 'button-positive',
              onTap: function(e) {
                if (!scope.data.customTip || scope.data.customTip < 0.0) {
                  //don't allow the user to close unless he enters wifi password
                  e.preventDefault();
                } else {
                  scope.tip = scope.data.customTip;
                  scope.total = (Number(Products.total) + 3.0 + Number(scope.tip)).toFixed(2);
                  return scope.data.customTip;
                }
              }
            }
          ]
        });
        myPopup.then(function(res) {
          console.log('Tapped!', res);
        });
       };


    };

    return {
      restrict: 'AEC',
      templateUrl: 'cart-item.html',
      link: link,
      scope: {
        products: '='
      }
    };
  }]);

  app.directive('ionProductImage',['$timeout', '$ionicModal', '$ionicSlideBoxDelegate','$templateCache', function($timeout, $ionicModal, $ionicSlideBoxDelegate, $templateCache){
    var link = function(scope, element, attr) {

      scope.closeModal = function() {
        scope.modal.hide();
        scope.modal.remove();
      };

      element.on('click', function(){
        $ionicModal.fromTemplateUrl('partials/cart-image-modal.html', {
          animation: 'slide-left-right',
          scope: scope
        })
        .then(function(modal){
          scope.modal = modal;
          scope.modal.show();
          $timeout( function() {
            $ionicSlideBoxDelegate.update();
          });
        });

      });

    };

    return {
      restrict: 'A',
      link: link,
      scope: '='
    };
  }]);

  // IONIC CHECKOUT DIRECTIVE
  app.directive('ionCartFooter',['$state', '$templateCache', function($state, $templateCache){
    var link = function(scope, element, attr) {

      element.addClass('bar bar-footer bar-dark');
      element.on('click', function(e){
        if (scope.path) {
          $state.go(scope.path);
        }
      });

      element.on('touchstart', function(){
        element.css({opacity: 0.8});
      });

      element.on('touchend', function(){
        element.css({opacity: 1});
      });
    };

    return {
      restrict: 'AEC',
      templateUrl: 'cart-footer.html',
      scope: {
        path : '=path'
      },
      link: link
    };
  }]);

  // IONIC PURCHASE DIRECTIVE
  app.directive('ionCheckout',['Products','$templateCache', function(Products, $templateCache){
    var link = function(scope, element, attr) {
      scope.$watch(function(){
        return Products.finalTotal;
      }, function(){
        scope.total = Products.finalTotal;
      });

      scope.checkout = Products.checkout;
      //*** Total sum of products in usd by default ***\\
      scope.total = Products.finalTotal;
      
      //*** Add address input fields when has-address attribute is on ion-purchase element ***\\
      if (element[0].hasAttribute('has-address')) {scope.hasAddressDir = true;}

      //*** Add email input field when has-email attribute is on ion-purchase element ***\\
      if (element[0].hasAttribute('has-email')) { scope.hasEmailDir = true; }

      //*** Add name input fields when has-name attribute is on ion-purchase element ***\\
      if (element[0].hasAttribute('has-name')) { scope.hasNameDir = true;}
    };

    return {
      restrict: 'AEC',
      templateUrl: 'checkout.html',
      link: link
    };
  }]);

  app.directive('ionGallery', ['Products', '$templateCache', function(Products, $templateCache){
    var link = function(scope, element, attr) {

      scope.category = attr.category;
      console.log("Category: "+scope.category);

      scope.addToCart = function(product){
        Products.addToCart(product);
      };

      scope.removeProduct = function(product){
        if (product.purchaseQuantity <= 1) {
          Products.removeProduct(product);
          //product.purchaseQuantity <= 1 ? Products.removeProduct(product) : Products.removeOneProduct(product);
        }
        Products.removeOneProduct(product);
      };

    };

    return {
      restrict: 'AEC',
      templateUrl: 'gallery-item.html',
      link: link,
      scope: {
        products: '='
      }
    };

  }]);

  //IONIC PURCHASE FOOTER DIRECTIVE
  app.directive('ionCheckoutFooter',['$compile', 'Products', 'stripeCheckout', 'CheckoutValidation','$templateCache', function($compile, Products, stripeCheckout, CheckoutValidation, $templateCache){
    var link = function(scope, element, attr) {
      scope.checkout = Products.checkout;
      scope.processCheckout = stripeCheckout.processCheckout;
      scope.stripeCallback = stripeCheckout.stripeCallback;

      element.addClass('bar bar-footer bar-dark');

      element.on('click', function(){
        if (CheckoutValidation.checkAll(scope.checkout)) {
          scope.processCheckout(scope.checkout, scope.stripeCallback);
        } else {
          var ionPurchaseSpan = document.getElementsByTagName('ion-checkout')[0].children[0];
          angular.element(ionPurchaseSpan).html('You have invalid fields:').css({color: '#ED303C', opacity: 1});
        }
      });

      element.on('touchstart', function(){
        element.css({opacity: 0.8});
      });

      element.on('touchend', function(){
        element.css({opacity: 1});
      });
    };

    return {
      restrict: 'AEC',
      templateUrl: 'checkout-footer.html',
      link: link
    };
  }]);


  //ADDITIONAL CONTENT DIRECTIVES

  //CHECKOUT CARD GROUP
  app.directive('checkoutCard',['$templateCache', function($templateCache){
    var link = function(scope, element, attr) {

    };

    return {
      restrict: 'AE',
      link: link,
      templateUrl: 'partials/card-form.html'
    };

  }]);

  // CARD NUM INPUT
  app.directive('cardNumInput',['$timeout', 'CheckoutValidation','$templateCache', function($timeout, CheckoutValidation, $templateCache){
    var link = function(scope, element, attr) {
      var input = element.children()[0].children[0];
      var icon = element.children()[0].children[1];
      scope.onNumBlur = function(){
        if (!scope.checkout.cc) {return;}
        angular.element(icon).removeClass('ion-card');
        angular.element(icon).addClass('ion-loading-d');
        $timeout(function(){
          if (!CheckoutValidation.validateCreditCardNumber(scope.checkout.cc)) {
            angular.element(icon).removeClass('ion-loading-d');
            angular.element(icon).addClass('ion-close-round').css({color: '#ED303C'});
            return;
          } else {
            angular.element(icon).removeClass('ion-loading-d');
            angular.element(icon).addClass('ion-checkmark-round').css({color: '#1fda9a'});
          }
        }, 300);
      };

      scope.onNumFocus = function(){
        angular.element(icon).removeClass('ion-checkmark-round ion-close-round');
        angular.element(icon).addClass('ion-card').css({color: '#333'});
      };
    };

    return {
      restrict: 'AE',
      link: link,
      templateUrl: 'partials/card-num-input.html'
    };
  }]);

  // CARD EXPIRATION INPUT
  app.directive('cardExpInput',['$timeout', 'CheckoutValidation','$templateCache', function($timeout, CheckoutValidation, $templateCache){
    var link = function(scope, element, attr) {
      var input = element.children()[0].children[0];
      var icon = element.children()[0].children[1];
      scope.onExpBlur = function(){
        if (!scope.checkout.exp) {return;}
        angular.element(icon).addClass('ion-loading-d');
        $timeout(function(){
          if (!scope.checkout.exp || !CheckoutValidation.validateExpiry(scope.checkout.exp.slice(0,2), scope.checkout.exp.slice(3))) {
            angular.element(icon).removeClass('ion-loading-d');
            angular.element(icon).addClass('ion-close-round').css({color: '#ED303C'});
            return;
          } else {
            angular.element(icon).removeClass('ion-loading-d');
            angular.element(icon).addClass('ion-checkmark-round').css({color: '#1fda9a'});
          }
        }, 300);
      };

      scope.onExpFocus = function(){
        angular.element(icon).removeClass('ion-checkmark-round ion-close-round').css({color: '#333'});
      };
    };

    return {
      restrict: 'AE',
      link: link,
      templateUrl: 'partials/card-exp-input.html'
    };

  }]);

  //CARD CVC INPUT
  app.directive('cardCvcInput',['$timeout', 'CheckoutValidation', '$templateCache', function($timeout, CheckoutValidation, $templateCache){
    var link = function(scope, element, attr) {
      var input = element.children()[0].children[0];
      var icon = element.children()[0].children[1];
      scope.onCvcBlur = function(){
        if (!scope.checkout.cvc) {return;}
        angular.element(icon).addClass('ion-loading-d');
        $timeout(function(){
          if (!CheckoutValidation.validateCVC(scope.checkout.cvc)) {
            angular.element(icon).removeClass('ion-loading-d');
            angular.element(icon).addClass('ion-close-round').css({color: '#ED303C'});
            return;
          } else {
            angular.element(icon).removeClass('ion-loading-d');
            angular.element(icon).addClass('ion-checkmark-round').css({color: '#1fda9a'});
          }
        }, 300);
      };

      scope.onCvcFocus = function(){
        angular.element(icon).removeClass('ion-checkmark-round ion-close-round').css({color: '#333'});
      };

    };

    return {
      restrict: 'AE',
      link: link,
      templateUrl: 'partials/card-cvc-input.html'
    };
  }]);

  // ADDRESS GROUP

  app.directive('checkoutAddress',['$templateCache', function($templateCache){
    var link = function(scope, element, attr) {

    };

    return {
      restrict: 'AE',
      link: link,
      templateUrl: 'partials/address.html'
    };

  }]);

  //ADDRESS LINE ONE INPUT
  app.directive('addressOneInput',['$templateCache', function($templateCache){
    var link = function(scope, element, attr) {

    };

    return {
      restrict: 'AE',
      link: link,
      templateUrl: 'partials/address-line-one.html'
    };
  }]);

  // ADDRESS LINE TWO INPUT
  app.directive('addressTwoInput',['$templateCache', function($templateCache){
    var link = function(scope, element, attr) {

      scope.onAddrTwoBlur = function(){

      };

      scope.onAddrTwoFocus = function(){

      };

    };

    return {
      restrict: 'AE',
      link: link,
      templateUrl: 'partials/address-line-two.html'
    };
  }]);

  //CITY INPUT
  app.directive('cityInput',['$templateCache', function($templateCache){
    var link = function(scope, element, attr) {
      scope.onCityBlur = function(){

      };

      scope.onCityFocus = function(){

      };

    };

    return {
      restrict: 'AE',
      link: link,
      templateUrl: 'partials/city-input.html'
    };
  }]);

  // STATE INPUT
  app.directive('stateInput',['$templateCache', function($templateCache){
    var link = function(scope, element, attr) {
      scope.onStateBlur = function(){

      };

      scope.onStateFocus = function(){

      };

    };

    return {
      restrict: 'AE',
      link: link,
      templateUrl: 'partials/state-input.html'
    };
  }]);

  //ZIP INPUT
  app.directive('zipInput',['$timeout', 'CheckoutValidation', '$templateCache', function($timeout, CheckoutValidation, $templateCache){
    var link = function(scope, element, attr) {
      var icon = element.children()[0].children[1];
      scope.onZipBlur = function(){
        if (!scope.checkout.zipcode) {return;}
        angular.element(icon).addClass('ion-loading-d');
        $timeout(function(){
          if (!CheckoutValidation.validateZipcode(scope.checkout.zipcode)) {
            angular.element(icon).removeClass('ion-loading-d');
            angular.element(icon).addClass('ion-close-round').css({color: '#ED303C'});
            return;
          } else {
            angular.element(icon).removeClass('ion-loading-d');
            angular.element(icon).addClass('ion-checkmark-round').css({color: '#1fda9a'});
          }
        }, 300);
      };

      scope.onZipFocus = function(){
        angular.element(icon).removeClass('ion-checkmark-round ion-close-round').css({color: '#333'});
      };

    };

    return {
      restrict: 'AE',
      link: link,
      templateUrl: 'partials/zipcode-input.html'
    };
  }]);

  //NAME GROUP

  app.directive('checkoutName',['$templateCache', function($templateCache){
    var link = function(scope, element, attr) {

    };

    return {
      restrict: 'AE',
      link: link,
      templateUrl: 'partials/name-input.html'
    };

  }]);


  //FIRST NAME
  app.directive('lastNameInput',['$templateCache', function($templateCache){
    var link = function(scope, element, attr) {

    };

    return {
      restrict: 'AE',
      link: link,
      templateUrl: 'partials/first-name-input.html'
    };

  }]);

  //LAST NAME
  app.directive('firstNameInput',['$templateCache', function($templateCache){
    var link = function(scope, element, attr) {

    };
    return {
      restrict: 'AE',
      link: link,
      templateUrl: 'partials/last-name-input.html'
    };
  }]);

  //EMAIL GROUP
  app.directive('checkoutEmail',['$timeout', 'CheckoutValidation','$templateCache', function($timeout, CheckoutValidation, $templateCache){
    var link = function(scope, element, attr) {
      var icon = element.children()[1].children[1];
      scope.onEmailBlur = function(){
        if (!scope.checkout.email) {return;}
        angular.element(icon).addClass('ion-loading-d');
        $timeout(function(){
          if (!CheckoutValidation.validateEmail(scope.checkout.email)) {
            angular.element(icon).removeClass('ion-loading-d');
            angular.element(icon).addClass('ion-close-round').css({color: '#ED303C'});
            return;
          } else {
            angular.element(icon).removeClass('ion-loading-d');
            angular.element(icon).addClass('ion-checkmark-round').css({color: '#1fda9a'});
          }
        }, 300);
      };

      scope.onEmailFocus = function(){
        angular.element(icon).removeClass('ion-checkmark-round ion-close-round').css({color: '#333'});
      };
    };

    return {
      restrict: 'AE',
      link: link,
      templateUrl: 'partials/email-input.html'
    };
  }]);


  // CUSTOMIZATION DIRECTIVES

  app.directive('mouseDownUp', function(){
    var link = function(scope, element, attr) {

      element.on('touchstart', function(){
        element.css({opacity: 0.5});
      });

      element.on('touchend', function(){
        element.css({opacity: 1});
      });

    };

    return {
      restrict: 'AC',
      link: link
    };
  });

  app.directive('cartAdd', ['$timeout', function($timeout){
    var link = function(scope, element, attr){

      scope.addText = 'Add To Cart';

      element.on('click', function(){
        scope.addText = 'Added';
        element.addClass('gallery-product-added');
        $timeout(function(){
          scope.addText = 'Add To Cart';
          element.removeClass('gallery-product-added');
        }, 500);
      });
    };

    return {
      restrict: 'AC',
      link: link,
      scope: true
    };
  }]);

})(angular);

angular.module("ionicShop.templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("cart-footer.html","<div class=\'title cart-footer\'>Checkout</div>");
$templateCache.put("cart-item.html","<div ng-if=\'!emptyProducts\'>\n\n\n	<ul class=\"list\">\n		<li class=\"item\" ng-repeat=\'product in products track by $index\'>\n			<div class=\"row\">\n\n				<div class=\"col col-30\">\n					<div class=\"item drink-bg text-center\">\n						<img ng-src=\'{{product.images[0]}}\' style=\"height: 80px;\">\n					</div>\n				</div>\n\n				<div class=\"col col-30\">\n					<div class=\"item\" style=\"border: none;\">\n						<strong>{{product.title}}</strong><br/>\n						<small>{{product.description}}</small><br/><br/>\n						<p>${{product.price}}</p>\n					</div>\n				</div>\n\n				<div class=\"col col-40\">\n					<div class=\"row\" style=\"padding-top: 35px\">\n						<div class=\"col text-center\">\n				        	<img src=\"img/Mnus.svg\" width=\"24\" style=\"padding-top: 2px\" ng-click=\'removeProduct(product)\'>\n				        </div>\n				        <div class=\"col text-center\">\n				        	<h1 style=\"font-size: 24px;\">{{product.purchaseQuantity}}</h1>\n				        </div>\n				        <div class=\"col text-center\">\n				        	<img src=\"img/Plussed.svg\" width=\"24\" style=\"padding-top: 2px\" ng-click=\'addProduct(product)\'>\n				        </div>\n				    </div>\n				</div>\n\n			</div>\n		</li>\n\n		<li class=\"item\">\n			<div class=\"row\">\n				<div class=\"col\" style=\"padding-top: 25px\">\n					<h2>Tip?</h2>\n				</div>\n				<div class=\"col\">\n					<ion-radio ng-click=\"updateTip(0)\" icon=\"none\">$0</ion-radio>\n				</div>\n				<div class=\"col\">\n					<ion-radio ng-click=\"updateTip(1)\" icon=\"none\">$1</ion-radio>\n				</div>\n				<div class=\"col\">\n					<ion-radio ng-click=\"updateTip(2)\" icon=\"none\">$2</ion-radio>\n				</div>\n				<div class=\"col\">\n					<ion-radio ng-click=\"showPopup()\" icon=\"none\">...</ion-radio>\n				</div>\n			</div>\n\n			<div class=\"row\">\n				<div class=\"col\">\n					<p><small>Sub-Total</small></p>\n				</div>\n				<div class=\"col text-right\">\n					<p><small>${{subTotal}}</small></p>\n				</div>\n			</div>\n\n			<div class=\"row\">\n				<div class=\"col\">\n					<p><small>Delivery Fee</small></p>\n				</div>\n				<div class=\"col text-right\">\n					<p><small>$3.00</small></p>\n				</div>\n			</div>\n\n			<div class=\"row\">\n				<div class=\"col\">\n					<p><small>Tip</small></p>\n				</div>\n				<div class=\"col text-right\">\n					<p><small>${{tip}}</small></p>\n				</div>\n			</div>\n\n			<div class=\"row\">\n				<div class=\"col\">\n					<p>TOTAL</p>\n				</div>\n				<div class=\"col text-right\">\n					<p>${{total}}</p>\n				</div>\n			</div>\n		</li>\n\n	</ul>\n\n  	<button class=\"button button-block button-balanced\" path=\'checkoutPath\' ui-sref=\'seat\' ng-click=\"calcTotal()\">Select Seat</button>\n\n\n	</ul>\n\n\n  <div>\n    <br><br><br><br>\n  </div>\n</div>\n\n<div class=\'empty-cart-div text-center\' ng-if=\'emptyProducts\'>\n\n  <div class=\"row row-center\">\n  <div class=\"col col-80 col-offset-10\" style=\"text-align: center;\"><img src=\"img/manja.png\" style=\"width: 200px;\">\n  </div>\n  </div>\n\n  <div class=\"row row-center\">\n  <div class=\"col col-80 col-offset-10 home-text\"><p>Woops. Your bag is empty.</p>\n  <h1><i class=\'icon ion-bag\'></i></h1>\n  </div>\n  </div>\n\n  \n</div>\n");
$templateCache.put("checkout-footer.html","<div class=\'title purchase-footer\'>Pay</div>");
$templateCache.put("checkout.html","\n<span class=\'checkout-form-description\'>Please enter your credit card details:</span>\n\n<div class=\'list checkout-form\'>\n  <checkout-name ng-if=\'hasNameDir\'></checkout-name>\n  <checkout-card></checkout-card>\n  <checkout-address ng-if=\'hasAddressDir\'></checkout-address>\n  <checkout-email ng-if=\'hasEmailDir\'></checkout-email>\n</div>\n\n<h2 class=\'checkout-total\'>Total: ${{total}}</h2>\n");
$templateCache.put("gallery-item.html","<!--<div class=\'ion-gallery-content\'>\n  <div class=\'card gallery-card\' ng-repeat=\'product in products track by $index\'>\n    <div class=\'item gallery-item\'>\n      <div class=\'gallery-image-div\'>\n        <img ng-src=\'{{product.images[0]}}\' class=\'gallery-product-image\'>\n      </div>\n      <h3 class=\'gallery-product-title\'>{{product.title}}</h3>\n      <h3 class=\'gallery-product-price\'>${{product.price}}</h3>\n      <div class=\'gallery-product-add\' ng-click=\'addToCart(product)\'>\n        <h3 class=\'gallery-product-add-title\' cart-add>{{addText}}</h3>\n      </div>\n    </div>\n  </div>\n</div>-->\n\n<div class=\"ion-gallery-content\">\n\n<div ng-repeat=\'product in (filteredProducts = (products | filter:{category: category}))\'>\n  <div class=\"row\" ng-if=\"$even\">\n    <div class=\"col col-50\">\n      <div class=\"list card\">\n\n      <div class=\"row no-padding\">\n        <div class=\"col col-33 no-padding text-center drink-bg\">\n          <div class=\"item drink-bg\">\n            <img src=\"img/Mnus.svg\" width=\"24\" ng-click=\'removeProduct(filteredProducts[$index])\' ng-show=\'filteredProducts[$index].purchaseQuantity > 0\'>\n          </div>\n        </div>\n        <div class=\"col col-33 no-padding text-center drink-bg\">\n            <p class=\"item drink-bg\" style=\"font-size: 16px\" ng-show=\'filteredProducts[$index].purchaseQuantity > 0\'>x{{filteredProducts[$index].purchaseQuantity}}</p>\n        </div>\n        <div class=\"col col-33 no-padding text-center\">\n          <div class=\"item drink-bg\">\n            <img src=\"img/Plussed.svg\" ng-click=\'addToCart(filteredProducts[$index])\' width=\"24\">\n          </div>\n        </div>\n      </div>\n\n        <div class=\"item item-image drink-bg\">\n          <div class=\"row\">\n          <div class=\"col\">\n          <img class=\"text-center\" ng-src=\'{{filteredProducts[$index].images[0]}}\' style=\"height: 130px; width: auto;\">\n          </div>\n          </div>\n        </div>\n\n        <div class=\"row\">\n          <div class=\"col col-80\"><strong>{{filteredProducts[$index].title}}</strong><br>{{filteredProducts[$index].description}}</div>\n          <div class=\"col col-20 col-top balanced\" style=\"text-align: right; font-size: 16px;\"><strong>${{filteredProducts[$index].price}}</strong></div>\n        </div>\n\n      </div>\n    </div>\n\n    <div class=\"col col-50\" ng-if=\"filteredProducts[$index+1]\">\n      <div class=\"list card\">\n\n      <div class=\"row no-padding\">\n        <div class=\"col col-33 no-padding text-center drink-bg\">\n          <div class=\"item drink-bg\">\n            <img src=\"img/Mnus.svg\" width=\"24\" ng-click=\'removeProduct(filteredProducts[$index+1])\' ng-show=\'filteredProducts[$index+1].purchaseQuantity > 0\'>\n          </div>\n        </div>\n        <div class=\"col col-33 no-padding text-center drink-bg\">\n            <p class=\"item drink-bg\" style=\"font-size: 16px\" ng-show=\'filteredProducts[$index+1].purchaseQuantity > 0\'>x{{filteredProducts[$index+1].purchaseQuantity}}</p>\n        </div>\n        <div class=\"col col-33 no-padding text-center\">\n          <div class=\"item drink-bg\">\n            <img src=\"img/Plussed.svg\" width=\"24\" ng-click=\'addToCart(filteredProducts[$index+1])\'>\n\n          </div>\n        </div>\n      </div>\n\n        <div class=\"item item-image drink-bg\">\n          <div class=\"row\">\n          <div class=\"col\">\n          <img ng-src=\'{{filteredProducts[$index+1].images[0]}}\' style=\"height: 130px; width: auto\">\n          </div>\n          </div>\n        </div>\n\n        <div class=\"row\">\n          <div class=\"col col-80\"><strong>{{filteredProducts[$index+1].title}}</strong><br>{{filteredProducts[$index+1].description}}</div>\n          <div class=\"col col-20 col-top balanced\" style=\"text-align: right; font-size: 16px;\"><strong>${{filteredProducts[$index+1].price}}</strong></div>\n        </div>\n\n      </div>\n    </div>\n\n\n  </div>\n\n\n</div>\n\n  \n\n\n</div>");
$templateCache.put("purchase-footer.html","<div class=\'title\'>Pay</div>");
$templateCache.put("purchase.html","\n<span class=\'purchase-form-description\'>Please enter your credit card details:</span>\n\n<div class=\'list purchase-form\'>\n  <checkout-name ng-if=\'hasNameDir\'></checkout-name>\n  <checkout-card></checkout-card>\n  <checkout-address ng-if=\'hasAddressDir\'></checkout-address>\n  <checkout-email ng-if=\'hasEmailDir\'></checkout-email>\n</div>\n\n<h2 class=\'purchase-total\'>Total: ${{total}}</h2>\n");
$templateCache.put("partials/address-line-one.html","<label class=\'item item-input address-line-one\'>\n  <input type=\'text\' ng-model=\'checkout.addressLineOne\' placeholder=\'Address Line 1\'>\n</label>");
$templateCache.put("partials/address-line-two.html","<label class=\'item item-input address-line-two\'>\n  <input type=\'text\' ng-model=\'checkout.addressLineTwo\' placeholder=\'Address Line 2\'>\n</label>");
$templateCache.put("partials/address.html","<div class=\'item item-divider\'>Address: </div>\n<address-one-input></address-one-input>\n<address-two-input></address-two-input>\n<city-input></city-input>\n<state-input></state-input>\n<zip-input></zip-input>\n");
$templateCache.put("partials/card-cvc-input.html","<label class=\'item item-input card-cvc-input\'>\n  <input type=\'tel\' ng-model=\'checkout.cvc\' ng-focus=\'onCvcFocus()\' ng-blur=\'onCvcBlur()\' placeholder=\'CVC\'>\n  <i class=\"icon\" style=\'width: 40px; text-align: center;\'></i>\n</label>");
$templateCache.put("partials/card-exp-input.html","<label class=\'item item-input card-exp-input\'>\n  <input type=\'tel\' ng-model=\'checkout.exp\' ng-focus=\'onExpFocus()\' ng-blur=\'onExpBlur()\' placeholder=\'MM/YYYY\'>\n  <i  class=\"icon\" style=\'width: 40px; text-align: center;\'></i>\n</label>");
$templateCache.put("partials/card-form.html","<div class=\'item item-divider\'>Card Info: </div>\n<card-num-input></card-num-input>\n<card-exp-input></card-exp-input>\n<card-cvc-input></card-cvc-input>");
$templateCache.put("partials/card-num-input.html","<label class=\'item item-input card-num-input\'>\n  <input type=\'tel\' ng-model=\'checkout.cc\' ng-focus=\'onNumFocus()\' ng-blur=\'onNumBlur()\' placeholder=\'Credit Card Number\'>\n  <i  class=\"icon ion-card\" style=\'width: 40px; text-align: center;\'></i>\n</label>");
$templateCache.put("partials/cart-image-modal.html","<div class=\"modal image-slider-modal\">\n\n  <ion-header-bar>\n    <button class=\"button button-light icon ion-ios7-undo-outline\" ng-click=\'closeModal()\'></button>\n    <h1 class=\"title\">More Images</h1>\n    \n  </ion-header-bar>\n\n    <ion-slide-box class=\'image-slider-box\' does-continue=\'true\'>\n      <ion-slide ng-repeat=\'image in product.images\' class=\'image-ion-slide\'>\n        <ion-content>\n          <div class=\'image-slide-div\'>\n            <h3 class=\'image-slide-description\'>{{product.description}}</h3>\n            <img src=\'{{image}}\' class=\'image-slide\'>\n          </div>\n        </ion-content>\n      </ion-slide>\n    </ion-slide-box>\n\n</div>");
$templateCache.put("partials/city-input.html","<label class=\'item item-input city-input\'>\n  <input type=\'text\' ng-model=\'checkout.city\' placeholder=\'City\'>\n</label>");
$templateCache.put("partials/email-input.html","<div class=\"item item-divider\">E-mail: </div>\n<label class=\"item item-input email-input\">\n  <input type=\"text\" ng-model=\"checkout.email\" ng-focus=\'onEmailFocus()\' ng-blur=\'onEmailBlur()\' placeholder=\"E-Mail\">\n  <i class=\"icon\" style=\'width: 40px; text-align: center;\'></i>\n</label>\n\n");
$templateCache.put("partials/first-name-input.html","  <label class=\'item item-input first-name-input\'>\n    <input type=\'text\' ng-model=\'checkout.lastName\' placeholder=\'Last Name\'>\n  </label>");
$templateCache.put("partials/last-name-input.html","  <label class=\'item item-input last-name-input\'>\n    <input type=\'text\' ng-model=\'checkout.firstName\' placeholder=\'First Name\'>\n  </label>");
$templateCache.put("partials/name-input.html","<div class=\'item item-divider\'>Name: </div>\n<first-name-input></first-name-input>\n<last-name-input></last-name-input>");
$templateCache.put("partials/state-input.html","<label class=\'item item-input state-input\'>\n  <input type=\'text\' ng-model=\'checkout.state\' placeholder=\'State\'>\n</label>");
$templateCache.put("partials/zipcode-input.html","<label class=\'item item-input zip-code-input\'>\n  <input type=\'text\' ng-model=\'checkout.zipcode\' ng-focus=\'onZipFocus()\' ng-blur=\'onZipBlur()\' placeholder=\'Zipcode\'>\n  <i class=\"icon zip-code-input-icon\" style=\'width: 40px; text-align: center;\'></i>\n</label>");}]);
(function(angular) {

  var app = angular.module('ionicShop', ['ionic', 'ionicShop.services', 'ionicShop.directives', 'ionicShop.templates']);

})(angular);