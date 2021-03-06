﻿(function () {
    angular.module("equizModule")
           .controller("QuizController", QuizController);
    QuizController.$inject = ['$scope', 'quizService', 'userGroupService', '$location', 'questionService'];

    function QuizController($scope, quizService, userGroupService, $location, questionService) {
        var vm = this;
        vm.tab = 'quiz';
        vm.save = save;
        vm.switchTab = switchTab;
        vm.saveCanExecute = saveCanExecute;
        vm.model = {
            quiz: { QuizTypeId: 1, DurationHours: 0, DurationMinutes: 0 },
            userGroups: [],
            states: [],
            quizzesForCopy: [],
            quizBlock: { QuestionCount: 0 },
            questions: [],
            answers: [],
            tags: [],
            orderArray: [],
            questionTypes: []
        }
        vm.setQuestionType = setQuestionType;
        vm.addNewQuestion = addNewQuestion;
        vm.addNewAnswer = addNewAnswer;
        vm.checkAnswerForSelectOne = checkAnswerForSelectOne;
        vm.deleteAnswer = deleteAnswer;
        vm.order = order;
        vm.showOrderArrow = showOrderArrow;
        vm.toViewModel = toViewModel;
        vm.toServerModel = toServerModel;
        vm.saveQuestions = saveQuestions;
        vm.getQuestions = getQuestions;
        vm.getAnswerCount = getAnswerCount;
        vm.getCheckedCountForSelectOne = getCheckedCountForSelectOne;
        vm.getCheckedCountForSelectMany = getCheckedCountForSelectMany;

        vm.toggleQuizzesForCopy = toggleQuizzesForCopy;
        vm.quizzesForCopyVisible = false;
        vm.getQuestionsCopy = getQuestionsCopy;
        vm.selectQuizCopy = selectQuizCopy;
        vm.selectedQuizCopy = { Id: 0, Name: 'New' };

        activate();

        function activate() {
            if ($location.search().id) {
                vm.getQuestions($location.search().id);
                quizService.get($location.search().id).then(function (data) {
                    vm.model.quiz = data.data.quiz;
                    vm.model.quiz.StartDate = new Date(vm.model.quiz.StartDate);
                    vm.model.quiz.DurationMinutes = vm.model.quiz.TimeLimitMinutes % 60;
                    vm.model.quiz.DurationHours = (vm.model.quiz.TimeLimitMinutes - vm.model.quiz.TimeLimitMinutes % 60) / 60;
                    vm.model.quizBlock = data.data.block;
                });
            }

            $scope.$on('$locationChangeSuccess', function (event) {
                if ($location.path() == "/quiz") {
                    vm.tab = 'quiz';
                }
                else if ($location.path() == '/questions') {
                    vm.tab = 'questions';
                }
            });

            quizService.getQuizzesForCopy().then(function (data) {
                vm.model.quizzesForCopy = data.data;
                vm.model.quizzesForCopy.splice(0, 0, vm.selectedQuizCopy);
            });

            quizService.getStates().then(function (data) {
                vm.model.states = data.data;
            });

            userGroupService.get().then(function (data) {
                vm.model.userGroups = data.data;
            });

            questionService.getQuestionTypes().then(function (responce) {
                vm.model.questionTypes = responce.data;
            });
        }

        function selectQuizCopy(quiz) {
            if (quiz.Name == 'New') {
                vm.model.questions = [];
                vm.model.answers = [];
                vm.model.tags = [];
                vm.model.quizBlock.QuestionCount = 0;
            }
            else {
                vm.getQuestionsCopy(quiz.Id);
            }
            vm.selectedQuizCopy = quiz;
            vm.toggleQuizzesForCopy();
        }

        function toggleQuizzesForCopy() {
            vm.quizzesForCopyVisible = !vm.quizzesForCopyVisible;
        }

        function setForm(form) {
            if (!vm.model.quizForm) {
                vm.model.quizForm = form;
            }
        }

        function saveCanExecute() {
            if (vm.model.quizForm) {
                return !vm.model.quizForm.$valid;
            }
            return false;
        }

        function switchTab(tab) {
            if (tab == 'quiz') {
                $location.path('/quiz');
            }
            else if (tab == 'questions') {
                $location.path('/questions');
            }
        }

        function save() {
            vm.model.quiz.TimeLimitMinutes = vm.model.quiz.DurationHours * 60 + vm.model.quiz.DurationMinutes;
            quizService.save({ quiz: vm.model.quiz, block: vm.model.quizBlock }).then(function (data) {
                vm.model.quiz = data.data.quiz;
                vm.model.quiz.StartDate = new Date(vm.model.quiz.StartDate);
                vm.model.quiz.DurationMinutes = vm.model.quiz.TimeLimitMinutes % 60;
                vm.model.quiz.DurationHours = (vm.model.quiz.TimeLimitMinutes - vm.model.quiz.TimeLimitMinutes % 60) / 60;
                vm.model.quizBlock = data.data.block;
                vm.saveQuestions(vm.model.quiz.Id);
            });

        }


        function setQuestionType(question, typeId, form) {
            question.QuestionTypeId = typeId;

            form.$setValidity("No answers", true);
            form.$setValidity("Only one correct answer", true);
            form.$setValidity("At least one correct answer", true);
        }

        function addNewQuestion() {
            vm.model.questions.push({
                Id: 0,
                QuestionTypeId: vm.model.questionTypes[0].Id,
                TopicId: 0,
                QuestionText: "",
                QuestionComplexity: 0,
                IsActive: true,
                QuestionType: null,
                Topic: null,
                QuestionAnswers: null,
                QuestionTags: null,
                QuizPassQuestions: null,
                QuizQuestions: null,
            });

            vm.model.answers.push([]);

            vm.model.tags.push([]);

            vm.model.orderArray.push({
                reverse: false,
                predicate: ""
            });
        }

        function addNewAnswer(question, questionIndex) {
            var answerOrder = vm.model.answers[questionIndex].length + 1;
            vm.model.answers[questionIndex].push({
                Id: 0,
                QuestionId: question.Id,
                AnswerText: "",
                AnswerOrder: answerOrder,
                IsRight: false,
                Question: null,
                UserAnswers: null
            });
        }

        function checkAnswerForSelectOne(answer, question) {
            var questionIndex = vm.model.questions.indexOf(question);
            for (var i = 0; i < vm.model.answers[questionIndex].length; i++) {
                vm.model.answers[questionIndex][i].IsRight = false;
            }
            answer.IsRight = true;
        }

        function deleteAnswer(answer, question) {
            var questionIndex = vm.model.questions.indexOf(question);
            var answerIndex = vm.model.answers[questionIndex].indexOf(answer);
            vm.model.answers[questionIndex].splice(answerIndex, 1);
        }

        function order(questionIndex, name) {
            vm.model.orderArray[questionIndex].reverse = (vm.model.orderArray[questionIndex].predicate === name) ? !vm.model.orderArray[questionIndex].reverse : false;
            vm.model.orderArray[questionIndex].predicate = name;
        }

        function showOrderArrow(questionIndex, name) {
            if (vm.model.orderArray[questionIndex].predicate === name) {
                return vm.model.orderArray[questionIndex].reverse ? '▼' : '▲';
            }
            return '';
        }

        function toViewModel(modelFromServer) {

            var tags = [];
            for (var i = 0; i < modelFromServer.tags.length; i++) {

                var tagArray = [];

                for (var j = 0; j < modelFromServer.tags[i].length; j++) {
                    tagArray.push(modelFromServer.tags[i][j].Name);
                }

                tags.push(tagArray);

            }
            return {
                id: modelFromServer.id,
                questions: modelFromServer.questions,
                answers: modelFromServer.answers,
                tags: tags
            };
        }

        function toServerModel() {
            var tags = [];
            for (var i = 0; i < vm.model.tags.length; i++) {

                var tagArray = [];
                for (var j = 0; j < vm.model.tags[i].length; j++) {
                    tagArray.push({
                        Id: 0,
                        Name: vm.model.tags[i][j],
                        QuestionTags: null
                    });
                }
                if (tagArray.length == 0) {
                    tagArray.push(null);
                }
                tags.push(tagArray);
            }

            var answers = [];

            for (var i = 0; i < vm.model.answers.length; i++) {

                var answerArray = [];
                for (var j = 0; j < vm.model.answers[i].length; j++) {
                    answerArray.push(vm.model.answers[i][j]);
                }
                if (answerArray.length == 0) {
                    answerArray.push(null);
                }
                answers.push(answerArray);
            }

            return {
                questions: vm.model.questions,
                tags: tags,
                answers: answers
            };
        }

        function saveQuestions(quizId) {
            var quizQuestionVM = vm.toServerModel();
            quizQuestionVM.id = quizId;
            questionService.saveQuestions(quizQuestionVM).then(function (response) {
                var modelFromServer = response.data;

                var model = vm.toViewModel(modelFromServer);
                vm.model.questions = model.questions;
                vm.model.answers = model.answers;
                vm.model.tags = model.tags;
            });
        }

        function getQuestions(quizId) {
            questionService.getQuestions(quizId).then(function (response) {
                var modelFromServer = response.data;

                var model = vm.toViewModel(modelFromServer);
                vm.model.questions = model.questions;
                vm.model.answers = model.answers;
                vm.model.tags = model.tags;
                vm.model.orderArray = Array.apply(null, Array(vm.model.questions.length)).map(function () {
                    return {
                        reverse: false,
                        predicate: ""
                    };
                });
            });
        }

        function getQuestionsCopy(quizId) {
            questionService.getQuestionsCopy(quizId).then(function (response) {
                var modelFromServer = response.data;

                var model = vm.toViewModel(modelFromServer);
                vm.model.questions = model.questions;
                vm.model.answers = model.answers;
                vm.model.tags = model.tags;
                vm.model.orderArray = Array.apply(null, Array(vm.model.questions.length)).map(function () {
                    return {
                        reverse: false,
                        predicate: ""
                    };
                });
                vm.model.quizBlock.QuestionCount = vm.model.questions.length;
            });
        }

        function getAnswerCount(questionIndex, form) {
            form.$setValidity("No answers", vm.model.answers[questionIndex].length != 0);
            return vm.model.answers[questionIndex].length;
        }

        function getCheckedCountForSelectOne(questionIndex, form) {
            var countChecked = vm.model.answers[questionIndex].filter(function (item) {
                return item.IsRight;
            }).length;
            form.$setValidity("Only one correct answer", countChecked == 1);
            return countChecked;
        }

        function getCheckedCountForSelectMany(questionIndex, form) {
            var countChecked = vm.model.answers[questionIndex].filter(function (item) {
                return item.IsRight;
            }).length;
            form.$setValidity("At least one correct answer", countChecked > 0);
            return countChecked;
        }

    }
})();