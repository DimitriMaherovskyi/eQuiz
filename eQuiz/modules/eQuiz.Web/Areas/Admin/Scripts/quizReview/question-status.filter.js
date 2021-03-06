﻿(function (angular) {
    angular
        .module('equizModule')
        .filter('questionStatusFilter', QuestionStatusFilter);

    function QuestionStatusFilter() {
        return function (questions, selectedStatuses) {
            if (!angular.isUndefined(questions) && !angular.isUndefined(selectedStatuses) && selectedStatuses.length > 0) {
                var tempQuestions = [];
                angular.forEach(selectedStatuses, function (id) {
                    angular.forEach(questions, function (question) {
                        if (angular.equals(question.questionStatus, id)) {
                            tempQuestions.push(question);
                        }
                    });
                });
                return tempQuestions;
            } else {
                return questions;
            }
        };
    };
})(angular);