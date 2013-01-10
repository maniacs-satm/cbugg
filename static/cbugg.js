angular.module('cbuggDirectives', [])
    .directive('cbmarkdown', function () {
        var converter = new Showdown.converter();
        var editTemplate = '<div ng-class="{edithide: !isEditMode}" ng-dblclick="switchToPreview()">'+
                           '<textarea ui-codemirror="{theme:\'monokai\', mode: {name:\'markdown\'}}"'+
                           ' ng-model="markdown"></textarea></div>';
        var previewTemplate = '<div ng-hide="isEditMode" ng-dblclick="switchToEdit()">Preview</div>';
        return {
            restrict:'E',
            scope:{},
            require:'ngModel',
            compile:function (tElement, tAttrs, transclude) {
                tElement.html(editTemplate);
                var previewElement = angular.element(previewTemplate);
                tElement.append(previewElement);

                return function (scope, element, attrs, model) {
                    scope.renderPreview = function() {
                        var makeHtml = converter.makeHtml(scope.markdown);
                        previewElement.html(makeHtml);
                    }
                    scope.switchToPreview = function () {
                        model.$setViewValue(scope.markdown);
                        scope.renderPreview();
                        scope.isEditMode = false;
                    }
                    scope.switchToEdit = function () {
                        scope.isEditMode = true;
                    }
                    scope.$watch(attrs["ngModel"], function() {
                        var up = model.$modelValue;
                        if(up) {
                            scope.markdown = up;
                            scope.renderPreview();
                        }
                    })
                    scope.markdown="Double-click to edit";
                    scope.switchToPreview()
                }
            }
        }
    });

angular.module('cbuggFilters', []).
    filter('relDate', function() {
        return function(dstr) {
            return moment(dstr).fromNow();
        }
    });

angular.module('cbugg', ['cbuggFilters', 'cbuggDirectives', 'ui']).
    config(['$routeProvider', function($routeProvider) {
        $routeProvider.
            when('/bug/:bugId', {templateUrl: 'partials/bug.html',
                                 controller: 'BugCtrl'}).
            when('/state/:stateId', {templateUrl: 'partials/buglist.html',
                                     controller: 'BugsByStateCtrl'}).
            when('/statecounts', {templateUrl: 'partials/statecounts.html',
                                  controller: 'StatesByCountCtrl'}).
            otherwise({redirectTo: '/statecounts'})

    }]);

function StatesByCountCtrl($scope, $http) {
    $http.get('/api/state-counts').success(function(data) {
        $scope.states = data.states;
    });
}

function BugsByStateCtrl($scope, $routeParams, $http) {
    $http.get('/api/bug/?state=' + $routeParams.stateId).success(function(data) {
        $scope.bugs = data;
    });
}

function BugCtrl($scope, $routeParams, $http) {
    var updateBug = function(field) {
        var bug = $scope.bug;
        if(bug && bug[field]) {
            $http.post('/api/bug/' + bug.id, "id=" + field + "&value=" + encodeURIComponent(bug[field]),
                       {headers: {"Content-Type": "application/x-www-form-urlencoded"}}).
            success(function(data) {
                $scope.bug = data;
            });
        }
    }

    $scope.allStates = ["new", "open", "resolved", "closed"];

    $http.get('/api/bug/' + $routeParams.bugId).success(function(data) {
        $scope.bug = data.bug;
        $scope.history = data.history;
        $scope.history.reverse();
        $scope.$watch('bug.description', function(next, prev) {
            console.log("N", next, prev);
            if($scope.bug && next !== prev) {
                updateBug("description");
            }
        });
        $scope.$watch('bug.status', function(next, prev) {
            if($scope.bug && next !== prev) {
                updateBug("status");
            }
        });
    })

    $scope.editTags = function() {
        $scope.editingTags = true;
    }

    $scope.submitTags = function() {
        updateBug("tags");
        $scope.editingTags = false;
    }

    $scope.editTitle = function() {
        $scope.editingTitle = true;
    }

    $scope.submitTitle = function() {
        updateBug("title");
        $scope.editingTitle = false;
    }
}

function relDate(dstr) {
    return moment(dstr).fromNow();
}
