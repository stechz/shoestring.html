function MainViewCtrl($scope, $filter) {

    // example JSON
    $scope.jsonData = {
        Name: "Joe", "Last Name": "Miller", Address: {Street: "Neverland 42"}, Hobbies: ["doing stuff", "dreaming"]
    };

    $scope.$watch('jsonData', function(json) {
        $scope.jsonString = $filter('json')(json);
    }, true);
    $scope.$watch('jsonString', function(json) {
        $scope.jsonData = JSON.parse(json);
    }, true);
}
