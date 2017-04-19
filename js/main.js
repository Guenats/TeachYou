var myApp = angular.module('myApp', ['ui.router','ui.bootstrap','ngMaterial']);

myApp.config(function($stateProvider,$urlRouterProvider) {
  $urlRouterProvider.otherwise("backoffice/backoffice/friendsDashboard");
  $stateProvider
    .state('login', {
      url:'/login',
      templateUrl: 'views/login.html',
      controller: 'loginCtrl'
    })

});

myApp.controller('loginCtrl', ['$rootScope', '$scope', '$http','$mdToast', function($rootScope, $scope, $http ,$mdToast) {
  $scope.loginTrue= true;
  $scope.registerTrue=false;
  $scope.register = function(){
              $scope.registerTrue = true;
              $scope.loginTrue = false;
          }
  $scope.registerNo = function(){
                      $scope.registerTrue = false;
                      $scope.loginTrue = true;
                  }
  $scope.login = function (pseudo, password){
        $scope.loading= true;
        var data = {
          login : pseudo,
          password: password
        }
        return $http.post('http://'+$rootScope.host+':3003/api/authentification/',data)
        .then(function (response) {
          $scope.connexion = response.data;

          if ($scope.connexion.success == false){
            console.log("fail");
          } else {

            localStorage.token = $scope.connexion.token;
            localStorage.login =  pseudo;
            localStorage.idUser =  response.data.user.id;
            localStorage.date = new Date();
            $rootScope.goHome();
          }
        });
      }
      $scope.registerUser = function (pseudo, password, email, nom, prenom, phone) {
          var data = {
              login: pseudo,
              password: password,
              email: email,
              nom: nom,
              prenom: prenom,
              telephone: phone,
          };

          $http.post('http://'+$rootScope.host+':3003/api/users/', data)
          .success(function (data, status) {
              $scope.PostDataResponse = data;
              $scope.registerTrue = false;
              $scope.loginTrue = true;
                $mdToast.show({
                    template: '<md-toast><span flex> Utilisateur ajouté !</span></md-toast>',
                    hideDelay: 1800,
                    position: "top right"
                  })

          })
          .error(function (data, status) {
              $scope.ResponseDetails = "Data: " + data +
              "<hr />status: " + status +
              "<hr />headers: " + header +
              "<hr />config: " + config;
          });
      };




}]);
