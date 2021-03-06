// Copyright 2014 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Initialization and basic configuration for the Oppia module.
 */
// TODO(sll): Remove the check for window.GLOBALS. This check is currently
// only there so that the Karma tests run, since it looks like Karma doesn't
// 'see' the GLOBALS variable that is defined in base.html. We should fix this
// in order to make the testing and production environments match.
var oppia = angular.module(
  'oppia', [
    'ngMaterial', 'ngAnimate', 'ngAudio', 'ngSanitize', 'ngTouch', 'ngResource',
    'ui.bootstrap', 'ui.sortable', 'ui.tree', 'infinite-scroll', 'ngJoyRide',
    'ngImgCrop', 'ui.validate', 'pascalprecht.translate', 'ngCookies', 'toastr',
    'headroom', 'dndLists'
  ].concat(
    window.GLOBALS ? (window.GLOBALS.ADDITIONAL_ANGULAR_MODULES || []) : []));

for (var constantName in constants) {
  oppia.constant(constantName, constants[constantName]);
}

oppia.constant(
  'EXPLORATION_SUMMARY_DATA_URL_TEMPLATE', '/explorationsummarieshandler/data');

oppia.constant('EXPLORATION_AND_SKILL_ID_PATTERN', /^[a-zA-Z0-9_-]+$/);

// We use a slash because this character is forbidden in a state name.
oppia.constant('PLACEHOLDER_OUTCOME_DEST', '/');
oppia.constant('INTERACTION_DISPLAY_MODE_INLINE', 'inline');
oppia.constant('LOADING_INDICATOR_URL', '/activity/loadingIndicator.gif');
oppia.constant('OBJECT_EDITOR_URL_PREFIX', '/object_editor_template/');
// Feature still in development.
// NOTE TO DEVELOPERS: This should be synchronized with the value in feconf.
oppia.constant('ENABLE_ML_CLASSIFIERS', false);
// Feature still in development.
oppia.constant('INFO_MESSAGE_SOLUTION_IS_INVALID',
  'The current solution does not lead to another card.');
oppia.constant('INFO_MESSAGE_SOLUTION_IS_VALID',
  'The solution is now valid!');
oppia.constant('INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_CURRENT_RULE',
  'The current solution is no longer valid.');
oppia.constant('PARAMETER_TYPES', {
  REAL: 'Real',
  UNICODE_STRING: 'UnicodeString'
});
oppia.constant('ACTION_ACCEPT_SUGGESTION', 'accept');
oppia.constant('ACTION_REJECT_SUGGESTION', 'reject');

// The maximum number of nodes to show in a row of the state graph.
oppia.constant('MAX_NODES_PER_ROW', 4);
// The following variable must be at least 3. It represents the maximum length,
// in characters, for the name of each node label in the state graph.
oppia.constant('MAX_NODE_LABEL_LENGTH', 15);

// If an $http request fails with the following error codes, a warning is
// displayed.
oppia.constant('FATAL_ERROR_CODES', [400, 401, 404, 500]);

// Do not modify these, for backwards-compatibility reasons.
oppia.constant('COMPONENT_NAME_CONTENT', 'content');
oppia.constant('COMPONENT_NAME_HINT', 'hint');
oppia.constant('COMPONENT_NAME_SOLUTION', 'solution');
oppia.constant('COMPONENT_NAME_FEEDBACK', 'feedback');

// Enables recording playthroughs from learner sessions.
oppia.constant('ENABLE_PLAYTHROUGH_RECORDING', false);
// Enables visualization of issues on the stats tab.
oppia.constant('ENABLE_ISSUES', false);
oppia.constant('CURRENT_ACTION_SCHEMA_VERSION', 1);
oppia.constant('CURRENT_ISSUE_SCHEMA_VERSION', 1);
oppia.constant('EARLY_QUIT_THRESHOLD_IN_SECS', 45);
oppia.constant('NUM_INCORRECT_ANSWERS_THRESHOLD', 5);
oppia.constant('NUM_REPEATED_CYCLES_THRESHOLD', 3);
oppia.constant('MAX_PLAYTHROUGHS_FOR_ISSUE', 5);
oppia.constant('RECORD_PLAYTHROUGH_PROBABILITY', 0.2);

oppia.constant('ACTION_TYPE_EXPLORATION_START', 'ExplorationStart');
oppia.constant('ACTION_TYPE_ANSWER_SUBMIT', 'AnswerSubmit');
oppia.constant('ACTION_TYPE_EXPLORATION_QUIT', 'ExplorationQuit');

oppia.constant('ISSUE_TYPE_EARLY_QUIT', 'EarlyQuit');
oppia.constant(
  'ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS', 'MultipleIncorrectSubmissions');
oppia.constant('ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS', 'CyclicStateTransitions');
oppia.constant('SITE_NAME', 'Oppia.org');

// Dynamically generate CKEditor widgets for the rich text components.
oppia.run([
  '$timeout', '$compile', '$rootScope', '$uibModal', 'RteHelperService',
  'HtmlEscaperService',
  function($timeout, $compile, $rootScope, $uibModal, RteHelperService,
      HtmlEscaperService) {
    var _RICH_TEXT_COMPONENTS = RteHelperService.getRichTextComponents();
    _RICH_TEXT_COMPONENTS.forEach(function(componentDefn) {
      // The name of the CKEditor widget corresponding to this component.
      var ckName = 'oppia' + componentDefn.id;

      // Check to ensure that a plugin is not registered more than once.
      if (CKEDITOR.plugins.registered[ckName] !== undefined) {
        return;
      }
      var tagName = 'oppia-noninteractive-' + componentDefn.id;
      var customizationArgSpecs = componentDefn.customizationArgSpecs;
      var isInline = RteHelperService.isInlineComponent(componentDefn.id);

      // Inline components will be wrapped in a span, while block components
      // will be wrapped in a div.
      if (isInline) {
        var componentTemplate = '<span type="' + tagName + '">' +
                                '<' + tagName + '></' + tagName + '>' +
                                '</span>';
      } else {
        var componentTemplate = '<div class="oppia-rte-component-container" ' +
                                'type="' + tagName + '">' +
                                '<' + tagName + '></' + tagName + '>' +
                                '<div class="component-overlay"></div>' +
                                '</div>';
      }
      CKEDITOR.plugins.add(ckName, {
        init: function(editor) {
          // Create the widget itself.
          editor.widgets.add(ckName, {
            button: componentDefn.tooltip,
            inline: isInline,
            template: componentTemplate,
            edit: function(event) {
              editor.fire('lockSnapshot', {
                dontUpdate: true
              });
              // Prevent default action since we are using our own edit modal.
              event.cancel();
              // Save this for creating the widget later.
              var container = this.wrapper.getParent(true);
              var that = this;
              var customizationArgs = {};
              customizationArgSpecs.forEach(function(spec) {
                customizationArgs[spec.name] = that.data[spec.name] ||
                                               spec.default_value;
              });

              RteHelperService._openCustomizationModal(
                customizationArgSpecs,
                customizationArgs,
                function(customizationArgsDict) {
                  for (var arg in customizationArgsDict) {
                    if (customizationArgsDict.hasOwnProperty(arg)) {
                      that.setData(arg, customizationArgsDict[arg]);
                    }
                  }
                  /**
                  * This checks whether the widget has already been inited
                  * and set up before (if we are editing a widget that
                  * has already been inserted into the RTE, we do not
                  * need to finalizeCreation again).
                  */
                  if (!that.isReady()) {
                    // Actually create the widget, if we have not already.
                    editor.widgets.finalizeCreation(container);
                  }

                  /**
                   * Need to manually $compile so the directive renders.
                   * Note that.element.$ is the native DOM object
                   * represented by that.element. See:
                   * http://docs.ckeditor.com/#!/api/CKEDITOR.dom.element
                   */
                  $compile($(that.element.$).contents())($rootScope);
                  // $timeout ensures we do not take the undo snapshot until
                  // after angular finishes its changes to the component tags.
                  $timeout(function() {
                    // For inline widgets, place the caret after the
                    // widget so the user can continue typing immediately.
                    if (isInline) {
                      var range = editor.createRange();
                      var widgetContainer = that.element.getParent();
                      range.moveToPosition(
                        widgetContainer, CKEDITOR.POSITION_AFTER_END);
                      editor.getSelection().selectRanges([range]);
                      // Another timeout needed so the undo snapshot is
                      // not taken until the caret is in the right place.
                      $timeout(function() {
                        editor.fire('unlockSnapshot');
                        editor.fire('saveSnapshot');
                      });
                    } else {
                      editor.fire('unlockSnapshot');
                      editor.fire('saveSnapshot');
                    }
                  });
                },
                function() {},
                function() {});
            },
            /**
             * This is how the widget will be represented in the outputs source,
             * so it is called when we call editor.getData().
             */
            downcast: function(element) {
              // Clear the angular rendering content, which we don't
              // want in the output.
              element.children[0].setHtml('');
              // Return just the rich text component, without its wrapper.
              return element.children[0];
            },
            /**
             * This is how a widget is recognized by CKEditor, for example
             * when we first load data in. Returns a boolean,
             * true iff "element" is an instance of this widget.
             */
            upcast: function(element) {
              return (element.name !== 'p' &&
                      element.children.length > 0 &&
                      element.children[0].name === tagName);
            },
            data: function() {
              var that = this;
              // Set attributes of component according to data values.
              customizationArgSpecs.forEach(function(spec) {
                that.element.getChild(0).setAttribute(
                  spec.name + '-with-value',
                  HtmlEscaperService.objToEscapedJson(
                    that.data[spec.name] || ''));
              });
            },
            init: function() {
              editor.fire('lockSnapshot', {
                dontUpdate: true
              });
              var that = this;
              var isMissingAttributes = false;
              // On init, read values from component attributes and save them.
              customizationArgSpecs.forEach(function(spec) {
                var value = that.element.getChild(0).getAttribute(
                  spec.name + '-with-value');
                if (value) {
                  that.setData(
                    spec.name, HtmlEscaperService.escapedJsonToObj(value));
                } else {
                  isMissingAttributes = true;
                }
              });

              if (!isMissingAttributes) {
                // Need to manually $compile so the directive renders.
                $compile($(this.element.$).contents())($rootScope);
              }
              $timeout(function() {
                editor.fire('unlockSnapshot');
                editor.fire('saveSnapshot');
              });
            }
          });
        }
      });
    });
  }
]);

oppia.config([
  '$compileProvider', '$httpProvider', '$interpolateProvider',
  '$locationProvider', '$cookiesProvider',
  function(
      $compileProvider, $httpProvider, $interpolateProvider,
      $locationProvider, $cookiesProvider) {
    // This improves performance by disabling debug data. For more details,
    // see https://code.angularjs.org/1.5.5/docs/guide/production
    $compileProvider.debugInfoEnabled(false);

    // Set the AngularJS interpolators as <[ and ]>, to not conflict with
    // Jinja2 templates.
    $interpolateProvider.startSymbol('<[');
    $interpolateProvider.endSymbol(']>');

    // Prevent the search page from reloading if the search query is changed.
    $locationProvider.html5Mode(false);
    if (window.location.pathname === '/search/find') {
      $locationProvider.html5Mode(true);
    }

    // Prevent storing duplicate cookies for translation language.
    $cookiesProvider.defaults.path = '/';

    // Set default headers for POST and PUT requests.
    $httpProvider.defaults.headers.post = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    $httpProvider.defaults.headers.put = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    // Add an interceptor to convert requests to strings and to log and show
    // warnings for error responses.
    $httpProvider.interceptors.push([
      '$q', '$log', 'AlertsService', function($q, $log, AlertsService) {
        return {
          request: function(config) {
            if (config.data) {
              config.data = $.param({
                csrf_token: GLOBALS.csrf_token,
                payload: JSON.stringify(config.data),
                source: document.URL
              }, true);
            }
            return config;
          },
          responseError: function(rejection) {
            // A rejection status of -1 seems to indicate (it's hard to find
            // documentation) that the response has not completed,
            // which can occur if the user navigates away from the page
            // while the response is pending, This should not be considered
            // an error.
            if (rejection.status !== -1) {
              $log.error(rejection.data);

              var warningMessage = 'Error communicating with server.';
              if (rejection.data && rejection.data.error) {
                warningMessage = rejection.data.error;
              }
              AlertsService.addWarning(warningMessage);
            }
            return $q.reject(rejection);
          }
        };
      }
    ]);
  }
]);

oppia.config(['$provide', function($provide) {
  $provide.decorator('$log', ['$delegate', function($delegate) {
    var _originalError = $delegate.error;

    if (window.GLOBALS && !window.GLOBALS.DEV_MODE) {
      $delegate.log = function() {};
      $delegate.info = function() {};
      // TODO(sll): Send errors (and maybe warnings) to the backend.
      $delegate.warn = function() { };
      $delegate.error = function(message) {
        if (String(message).indexOf('$digest already in progress') === -1) {
          _originalError(message);
        }
      };
      // This keeps angular-mocks happy (in tests).
      $delegate.error.logs = [];
    }

    return $delegate;
  }]);
}]);

oppia.config(['toastrConfig', function(toastrConfig) {
  angular.extend(toastrConfig, {
    allowHtml: false,
    iconClasses: {
      error: 'toast-error',
      info: 'toast-info',
      success: 'toast-success',
      warning: 'toast-warning'
    },
    positionClass: 'toast-bottom-right',
    messageClass: 'toast-message',
    progressBar: false,
    tapToDismiss: true,
    titleClass: 'toast-title'
  });
}]);

// Overwrite the built-in exceptionHandler service to log errors to the backend
// (so that they can be fixed).
oppia.factory('$exceptionHandler', ['$log', function($log) {
  return function(exception, cause) {
    var messageAndSourceAndStackTrace = [
      '',
      'Cause: ' + cause,
      exception.message,
      String(exception.stack),
      '    at URL: ' + window.location.href
    ].join('\n');

    // Catch all errors, to guard against infinite recursive loops.
    try {
      // We use jQuery here instead of Angular's $http, since the latter
      // creates a circular dependency.
      $.ajax({
        type: 'POST',
        url: '/frontend_errors',
        data: $.param({
          csrf_token: GLOBALS.csrf_token,
          payload: JSON.stringify({
            error: messageAndSourceAndStackTrace
          }),
          source: document.URL
        }, true),
        contentType: 'application/x-www-form-urlencoded',
        dataType: 'text',
        async: true
      });
    } catch (loggingError) {
      $log.warn('Error logging failed.');
    }

    $log.error.apply($log, arguments);
  };
}]);

oppia.constant('LABEL_FOR_CLEARING_FOCUS', 'labelForClearingFocus');

// Service for sending events to Google Analytics.
//
// Note that events are only sent if the CAN_SEND_ANALYTICS_EVENTS flag is
// turned on. This flag must be turned on explicitly by the application
// owner in feconf.py.
oppia.factory('siteAnalyticsService', ['$window', function($window) {
  var CAN_SEND_ANALYTICS_EVENTS = constants.CAN_SEND_ANALYTICS_EVENTS;
  // For definitions of the various arguments, please see:
  // developers.google.com/analytics/devguides/collection/analyticsjs/events
  var _sendEventToGoogleAnalytics = function(
      eventCategory, eventAction, eventLabel) {
    if ($window.ga && CAN_SEND_ANALYTICS_EVENTS) {
      $window.ga('send', 'event', eventCategory, eventAction, eventLabel);
    }
  };

  // For definitions of the various arguments, please see:
  // developers.google.com/analytics/devguides/collection/analyticsjs/
  //   social-interactions
  var _sendSocialEventToGoogleAnalytics = function(
      network, action, targetUrl) {
    if ($window.ga && CAN_SEND_ANALYTICS_EVENTS) {
      $window.ga('send', 'social', network, action, targetUrl);
    }
  };

  return {
    // The srcElement refers to the element on the page that is clicked.
    registerStartLoginEvent: function(srcElement) {
      _sendEventToGoogleAnalytics(
        'LoginButton', 'click', $window.location.pathname + ' ' + srcElement);
    },
    registerNewSignupEvent: function() {
      _sendEventToGoogleAnalytics('SignupButton', 'click', '');
    },
    registerClickBrowseLibraryButtonEvent: function() {
      _sendEventToGoogleAnalytics(
        'BrowseLibraryButton', 'click', $window.location.pathname);
    },
    registerGoToDonationSiteEvent: function(donationSiteName) {
      _sendEventToGoogleAnalytics(
        'GoToDonationSite', 'click', donationSiteName);
    },
    registerApplyToTeachWithOppiaEvent: function() {
      _sendEventToGoogleAnalytics('ApplyToTeachWithOppia', 'click', '');
    },
    registerClickCreateExplorationButtonEvent: function() {
      _sendEventToGoogleAnalytics(
        'CreateExplorationButton', 'click', $window.location.pathname);
    },
    registerCreateNewExplorationEvent: function(explorationId) {
      _sendEventToGoogleAnalytics('NewExploration', 'create', explorationId);
    },
    registerCreateNewExplorationInCollectionEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'NewExplorationFromCollection', 'create', explorationId);
    },
    registerCreateNewCollectionEvent: function(collectionId) {
      _sendEventToGoogleAnalytics('NewCollection', 'create', collectionId);
    },
    registerCommitChangesToPrivateExplorationEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'CommitToPrivateExploration', 'click', explorationId);
    },
    registerShareExplorationEvent: function(network) {
      _sendSocialEventToGoogleAnalytics(
        network, 'share', $window.location.pathname);
    },
    registerShareCollectionEvent: function(network) {
      _sendSocialEventToGoogleAnalytics(
        network, 'share', $window.location.pathname);
    },
    registerOpenEmbedInfoEvent: function(explorationId) {
      _sendEventToGoogleAnalytics('EmbedInfoModal', 'open', explorationId);
    },
    registerCommitChangesToPublicExplorationEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'CommitToPublicExploration', 'click', explorationId);
    },
    // Metrics for tutorial on first creating exploration
    registerTutorialModalOpenEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'TutorialModalOpen', 'open', explorationId);
    },
    registerDeclineTutorialModalEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'DeclineTutorialModal', 'click', explorationId);
    },
    registerAcceptTutorialModalEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'AcceptTutorialModal', 'click', explorationId);
    },
    // Metrics for visiting the help center
    registerClickHelpButtonEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'ClickHelpButton', 'click', explorationId);
    },
    registerVisitHelpCenterEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'VisitHelpCenter', 'click', explorationId);
    },
    registerOpenTutorialFromHelpCenterEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'OpenTutorialFromHelpCenter', 'click', explorationId);
    },
    // Metrics for exiting the tutorial
    registerSkipTutorialEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'SkipTutorial', 'click', explorationId);
    },
    registerFinishTutorialEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'FinishTutorial', 'click', explorationId);
    },
    // Metrics for first time editor use
    registerEditorFirstEntryEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'FirstEnterEditor', 'open', explorationId);
    },
    registerFirstOpenContentBoxEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'FirstOpenContentBox', 'open', explorationId);
    },
    registerFirstSaveContentEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'FirstSaveContent', 'click', explorationId);
    },
    registerFirstClickAddInteractionEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'FirstClickAddInteraction', 'click', explorationId);
    },
    registerFirstSelectInteractionTypeEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'FirstSelectInteractionType', 'click', explorationId);
    },
    registerFirstSaveInteractionEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'FirstSaveInteraction', 'click', explorationId);
    },
    registerFirstSaveRuleEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'FirstSaveRule', 'click', explorationId);
    },
    registerFirstCreateSecondStateEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'FirstCreateSecondState', 'create', explorationId);
    },
    // Metrics for publishing explorations
    registerSavePlayableExplorationEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'SavePlayableExploration', 'save', explorationId);
    },
    registerOpenPublishExplorationModalEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'PublishExplorationModal', 'open', explorationId);
    },
    registerPublishExplorationEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'PublishExploration', 'click', explorationId);
    },
    registerVisitOppiaFromIframeEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'VisitOppiaFromIframe', 'click', explorationId);
    },
    registerNewCard: function(cardNum) {
      if (cardNum <= 10 || cardNum % 10 === 0) {
        _sendEventToGoogleAnalytics('PlayerNewCard', 'click', cardNum);
      }
    },
    registerFinishExploration: function() {
      _sendEventToGoogleAnalytics('PlayerFinishExploration', 'click', '');
    },
    registerOpenFractionsFromLandingPageEvent: function(viewerType) {
      _sendEventToGoogleAnalytics(
        'OpenFractionsFromLandingPage', 'click', viewerType);
    }
  };
}]);

// Service for assembling extension tags (for interactions).
oppia.factory('extensionTagAssemblerService', [
  '$filter', 'HtmlEscaperService', function($filter, HtmlEscaperService) {
    return {
      formatCustomizationArgAttrs: function(element, customizationArgSpecs) {
        for (var caSpecName in customizationArgSpecs) {
          var caSpecValue = customizationArgSpecs[caSpecName].value;
          element.attr(
            $filter('camelCaseToHyphens')(caSpecName) + '-with-value',
            HtmlEscaperService.objToEscapedJson(caSpecValue));
        }
        return element;
      }
    };
  }
]);

// Add a String.prototype.trim() polyfill for IE8.
if (typeof String.prototype.trim !== 'function') {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, '');
  };
}

// Add an Object.create() polyfill for IE8.
if (typeof Object.create !== 'function') {
  (function() {
    var F = function() {};
    Object.create = function(o) {
      if (arguments.length > 1) {
        throw Error('Second argument for Object.create() is not supported');
      }
      if (o === null) {
        throw Error('Cannot set a null [[Prototype]]');
      }
      if (typeof o !== 'object') {
        throw TypeError('Argument must be an object');
      }
      F.prototype = o;
      return new F();
    };
  })();
}

// Add a Number.isInteger() polyfill for IE.
Number.isInteger = Number.isInteger || function(value) {
  return (
    typeof value === 'number' && isFinite(value) &&
    Math.floor(value) === value);
};
