/**
 * <nowiki>
 * MassEdit.js
 * @file Adds/deletes/replaces content from pages/categories/namespaces
 * @author Eizen <dev.wikia.com/wiki/User_talk:Eizen>
 * @license CC-BY-SA 3.0
 * @external "mediawiki.util"
 * @external "mediawiki.user"
 * @external "ext.wikia.LinkSuggest"
 * @external "jquery"
 * @external "mw"
 * @external "wikia.window"
 */

/*jslint browser, this:true */
/*global require */
/*eslint-env es6 */
/*eslint-disable */

require(["jquery", "mw", "wikia.window"], function ($, mw, wk) {
  "use strict";

  // Define extant global object config if needed
  wk.dev = wk.dev || {};
  wk.dev.massEdit = wk.dev.massEdit || {};

  // Prevent double loads and respect prior double load check formatting
  if (wk.dev.massEdit.isLoaded || wk.isMassEditLoaded) {
    return;
  }
  wk.dev.massEdit.isLoaded = true;

  /**
   * @description The <code>main</code> namespace object is used as a class
   * prototype for the MassEdit class instance. It contains methods and
   * properties related to the actual MassEdit functionality and application
   * logic, keeping in a separate object all the methods used to initialize the
   * script itself.
   *
   * @const
   */
  const main = {};

  /**
   * @description The <code>init</code> namespace object contains methods and
   * properties related to the initialization of the MassEdit script. The
   * methods in this namespace object are responsible for loading external
   * dependencies, validating user input, setting config, and creating a new
   * MassEdit instance once setup is complete.
   *
   * @const
   */
  const init = {};

  /**
   * @description This simple <code>boolean</code> flag is used to log messages
   * in the console at sensitive application logic problem areas where issues
   * are known to arise. Originally, DEBUG was part of an enum alongside a unit
   * testing <code>boolean</code>; however, the removal of unit tests at the end
   * of the testing period returned DEBUG to the script-global scope.
   *
   * @const
   */
  const DEBUG = false;

  /****************************************************************************/
  /*                         Prototype pseudo-enums                           */
  /****************************************************************************/

  // Protected pseudo-enums of prototype
  Object.defineProperties(main, {

    /**
     * @description This pseudo-enum of the <code>main</code> namespace object
     * is used to store all CSS selectors in a single place in the event that
     * one or more need to be changed. The formatting of the object literal key
     * naming is type (id or class), location (placement, modal, content), and
     * either the name for ids or the type of element (div, span, etc.).
     * Originally, these were all divided into nested object literals as seen in
     * Message.js. However, this system became too unreadable in the body of the
     * script, necessitating a simpler system.
     *
     * @readonly
     * @enum {string}
     */
    Selectors: {
      enumerable: true,
      writable: false,
      configurable: false,
      value: Object.freeze({

        // Toolbar placement ids
        ID_PLACEMENT_LIST: "massedit-placement-list",
        ID_PLACEMENT_LINK: "massedit-placement-link",

        // Modal footer ids
        ID_MODAL_CONTAINER: "massedit-modal-container",
        ID_MODAL_SUBMIT: "massedit-modal-submit",
        ID_MODAL_TOGGLE: "massedit-modal-toggle",
        ID_MODAL_CANCEL: "massedit-modal-cancel",
        ID_MODAL_CLEAR: "massedit-modal-clear",
        ID_MODAL_CLOSE: "massedit-modal-close",

        // Modal body ids
        ID_CONTENT_CONTAINER: "massedit-content-container",
        ID_CONTENT_FORM: "massedit-content-form",
        ID_CONTENT_FIELDSET: "massedit-content-fieldset",
        ID_CONTENT_CONTENT: "massedit-content-content",
        ID_CONTENT_REPLACE: "massedit-content-replace",
        ID_CONTENT_INDICES: "massedit-content-indices",
        ID_CONTENT_PAGES: "massedit-content-pages",
        ID_CONTENT_SUMMARY: "massedit-content-summary",
        ID_CONTENT_ACTION: "massedit-content-action",
        ID_CONTENT_TYPE: "massedit-content-type",
        ID_CONTENT_CASE: "massedit-content-case",
        ID_CONTENT_LOG: "massedit-content-log",

        // Toolbar placement classes
        CLASS_PLACEMENT_OVERFLOW: "overflow",

        // Modal footer classes
        CLASS_MODAL_CONTAINER: "massedit-modal-container",
        CLASS_MODAL_BUTTON: "massedit-modal-button",
        CLASS_MODAL_LEFT: "massedit-modal-left",
        CLASS_MODAL_OPTION: "massedit-modal-option",
        CLASS_MODAL_TIMER: "massedit-modal-timer",

        // Modal body classes
        CLASS_CONTENT_CONTAINER: "massedit-content-container",
        CLASS_CONTENT_FORM: "massedit-content-form",
        CLASS_CONTENT_FIELDSET: "massedit-content-fieldset",
        CLASS_CONTENT_TEXTAREA: "massedit-content-textarea",
        CLASS_CONTENT_INPUT: "massedit-content-input",
        CLASS_CONTENT_DIV: "massedit-content-div",
        CLASS_CONTENT_SPAN: "massedit-content-span",
        CLASS_CONTENT_SELECT: "massedit-content-select",
      }),
    },

    /**
     * @description This pseudo-enum of the <code>main</code> namespace object
     * is used to store an array denoting which user groups are permitted to
     * make use of the script. For the purposes of forstalling the use of the
     * script for vandalism or spam, its use is limited to certain members of
     * local staff, various global groups, and Fandom Staff. The major group
     * prevented from using the script is the local <code>threadmoderator</code>
     * group, as these can be viewed as standard users with /d and thread-
     * specific abilities unaffected by MassEdit.
     *
     * @readonly
     * @enum {Array<string>}
     */
    UserGroups: {
      enumerable: true,
      writable: false,
      configurable: false,
      value: Object.freeze({
        CAN_EDIT: Object.freeze([
          "sysop",
          "content-moderator",
          "bot",
          "bot-global",
          "staff",
          "vstf",
          "helper",
          "global-discussions-moderator",
          "content-volunteer",
        ]),
      }),
    },

    /**
     * @description The <code>Utility</code> pseudo-enum of the
     * <code>main</code> namespace object is used to store several constants of
     * the <code>number</code> data type related to standard edit interval rates
     * and edit delays in cases of rate limiting. Originally, these were housed
     * in a <code>const</code> object in the script-global namespace, though
     * their exclusive use by the MassEdit class instance made their inclusion
     * into <code>main</code> seem like a more sensible placement decision.
     *
     * @readonly
     * @enum {number}
     */
    Utility: {
      enumerable: true,
      writable: false,
      configurable: false,
      value: Object.freeze({
        MAX_SUMMARY_CHARS: 800,
        FADE_INTERVAL: 1000,
        DELAY: 35000,
      }),
    }
  });

  /****************************************************************************/
  /*                           Setup pseudo-enums                             */
  /****************************************************************************/

  // Protected pseudo-enums of script setup object
  Object.defineProperties(init, {

    /**
     * @description This pseudo-enum of the <code>init</code> namespace object
     * used to initialize the script stores data related to the external
     * dependencies and core modules required by the script. It consists of two
     * properties. The former, a constant <code>object</code> called "SCRIPTS,"
     * contains key/value pairs wherein the key is the specific name of the
     * <code>mw.hook</code> and the value is the script's location for use by
     * <code>importArticles.articles</code>. The latter, a constant array named
     * <code>MODULES</code>, contains a listing of the core modules required for
     * use by <code>mw.loader.using</code>.
     *
     * @readonly
     * @enum {object}
     */
    Dependencies: {
      enumerable: true,
      writable: false,
      configurable: false,
      value: Object.freeze({
        SCRIPTS: Object.freeze({
          // Keys should NOT be altered unless hook names change
          "dev.i18n": "u:dev:MediaWiki:I18n-js/code.js",
          "dev.placement": "u:dev:MediaWiki:Placement.js",
          "dev.modal": "u:dev:MediaWiki:Modal.js",
        }),
        MODULES: Object.freeze([
          "mediawiki.util",
          "mediawiki.user",
          "ext.wikia.LinkSuggest",
        ]),
      }),
    },

    /**
     * @description This pseudo-enum of the <code>init</code> namespace object
     * is used to store default data pertaining to the Placement.js external
     * dependency. It includes an <code>object</code> denoting the default
     * placement location for the script in the event of the user not including
     * any user config and an array containing the two valid placement types. By
     * default, the script tool element as built in <code>main.init</code> is
     * appended to the user toolbar.
     *
     * @readonly
     * @enum {object}
     */
    Placement: {
      enumerable: true,
      writable: false,
      configurable: false,
      value: Object.freeze({
        DEFAULTS: Object.freeze({
          ELEMENT: "toolbar",
          TYPE: "append",
        }),
        VALID_TYPES: Object.freeze([
          "append",
          "prepend",
        ]),
      }),
    },

    /**
     * @description This catchall pseudo-enum of the <code>init</code< namespace
     * object is used to house assorted values of various data types that don't
     * fit well into other pseudo-enums. It contains the interval rates
     * calculated from the edit restrictions imposed upon normal users and bots.
     * additionally, it contains a <code>string</code> constant denoting the
     * name of the script.
     *
     * @see <a href="https://git.io/fA4Jk">SUS-4775</a>
     * @see <a href="https://git.io/fA4eQ">VariablesBase.php</a>
     * @readonly
     * @enum {string|number}
     */
    Utility: {
      enumerable: true,
      writable: false,
      configurable: false,
      value: Object.freeze({
        SCRIPT: "MassEdit",
        STD_INTERVAL: 1500,
        BOT_INTERVAL: 750,
      }),
    }
  });

  /****************************************************************************/
  /*                      Prototype utility methods                           */
  /****************************************************************************/

  /**
   * @description As the name implies, this helper function capitalizes the
   * first character of the input string and returns the altered, adjusted
   * string. it is generally used in the dynamic construction of i18n messages
   * in various assembly methods.
   *
   * @param {string} paramTarget - <code>string</code> to be capitalized
   * @returns {string} - Capitalized <code>string</code>
   */
  main.capitalize = function (paramTarget) {
    return paramTarget.charAt(0).toUpperCase() + paramTarget.slice(1);
  };

  /**
   * @description This helper method is used to check whether the target object
   * is one of several types of <code>object</code>. It is most often used to
   * determine if the target is an <code>array</code> or a straight-up
   * <code>object</code>.
   *
   * @param {string} paramType - Either "Object" or "Array"
   * @param {string} paramTarget - Target to check
   * @returns {boolean} - Flag denoting the nature of the target
   */
  main.isThisAn = function (paramType, paramTarget) {
    return Object.prototype.toString.call(paramTarget) === "[object " +
      this.capitalize.call(this, paramType.toLowerCase()) + "]";
  };

  /**
   * @description This function is used to determine whether or not the input
   * <code>string</code> contains restricted characters as denoted by Wikia's
   * <code>wgLegalTitleChars</code>. Legal characters are defined as follows:
   * <code> %!"$&'()*,\-./0-9:;=?@A-Z\\\^_`a-z~+\u0080-\uFFFF</code>
   *
   * @param {string} paramString Content string to be checked
   * @return {boolean} - Flag denoting the nature of the paramString
   */
  main.isLegalInput = function (paramString) {
    return new RegExp("^[" + wk.wgLegalTitleChars + "]*$").test(paramString);
  };

  /**
   * @description This helper function uses simple regex to determine whether
   * the parameter <code>string</code> or <code>number</code> is an integer
   * value. It is primarily used to determine if the user has inputted a proper
   * namespace number if mass editing by namespace.
   *
   * @param {string|number} paramEntry
   * @returns {boolean} - Flag denoting the nature of the paramEntry
   */
  main.isInteger = function (paramEntry) {
    return new RegExp(/^[0-9]+$/).test(paramEntry.toString());
  };

  /**
   * @description This function serves as an Internet Explorer-friendly
   * implementation of <code>String.prototype.startsWith</code>, a method
   * introduced in ES2015 and unavailable to IE 11 and earlier. It is based off
   * the polyfill available on the method's Mozilla.org documentation page.
   *
   * @param {string} paramTarget - <code>string</code> to be checked
   * @param {string} paramSearch - <code>string</code> target
   * @returns {boolean} - Flag denoting a match
   */
  main.startsWith = function (paramTarget, paramSearch) {
    return paramTarget.substring(0, 0 + paramSearch.length) === paramSearch;
  };

  /**
   * @description This utility method is used to check whether the user
   * attempting to use the script is in the proper usergroup. Only certain local
   * staff and members of select global groups are permitted the use of this
   * script so as to prevent potential vandalism.
   *
   * @return {boolean} - Flag denoting user's ability to use the script
   */
  main.hasRights = function () {
    return new RegExp(["(" + this.UserGroups.CAN_EDIT.join("|") + ")"].join("")
      ).test(wk.wgUserGroups.join(" ")) && !mw.user.anonymous();
  };

  /**
   * @description This helper function is used as the primary mechanism by which
   * the find-and-replace operation is undertaken. It can either replace all
   * instances of a substring from an input parameter or only certain instances
   * as denoted by an optional parameter array of <code>number</code> indices.
   * Assuming such a parameter array is passed, a callback function is used with
   * <code>String.prototype.replace</code> in order to sort through the
   * appearances of the target in the content and adjust only those at one of
   * the desired indices. In either case, the ammended string is adjusted and
   * returned for posting by means of the API as the pages's new adjusted
   * content.
   *
   * @param {string} paramString - Original string to be adjusted
   * @param {boolean} paramIsCaseSensitive - If case sensitivity is desired
   * @param {string} paramTarget - Text to be replaced
   * @param {string} paramReplacement - Text to be inserted
   * @param {Array<number>} paramInstances - Indices at which to replace
   * @returns {string} - An ammended <code>string</code>
   */
  main.replaceOccurrences = function (paramString, paramIsCaseSensitive,
      paramTarget, paramReplacement, paramInstances) {

    // Declarations
    var counter, regex;

    // Definitions/sanitize params
    paramInstances = (paramInstances != null) ? paramInstances : [];
    regex = new RegExp(paramTarget, (paramIsCaseSensitive) ? "g" : "gi");
    counter = 0;

    // Replace all instances if no specific indices specified
    return paramString.replace(regex, (!paramInstances.length)
      ? paramReplacement
      : function (paramMatch) {
          return ($.inArray(++counter, paramInstances) !== -1)
            ? paramReplacement
            : paramMatch;
        }
    );
  };

  /****************************************************************************/
  /*                       Prototype Dynamic Timer                            */
  /****************************************************************************/

  /**
   * @description This function serves as a pseudo-constructor for the pausable
   * <code>setDynamicTimeout</code> iterator. It accepts a function as a
   * callback and an edit interval, setting these as publically accessible
   * function properties alongside other default flow control
   * <code>boolean</code>s. The latter are used elsewhere in the program to
   * determine whether or not event listener handlers can be run, as certain
   * handlers should not be accessible if an editing operation is in progress.
   *
   * @param {function} paramCallback - Function to run after interval complete
   * @param {number} paramInterval - Rate at which timeout is handled
   * @returns {object} self - Inner object return for external assignment
   */
  main.setDynamicTimeout = function self (paramCallback, paramInterval) {

    // Define pseudo-instance properties from args
    self.callback = paramCallback;
    self.interval = paramInterval;

    // Set flow control booleans
    self.isPaused = false;
    self.isComplete = false;

    // Set default value for id
    self.identify = -1;

    // Begin first iterate and define id
    self.iterate();

    // Return for definition to local variable
    return self;
  };

  /**
   * @description This internal method of the <code>setDynamicTimeout</code>
   * function is used to cancel any ongoing editing operation by clearing the
   * current timeout and setting the <code>isComplete</code> flow control
   * <code>boolean</code> to true. This lets external handlers know that the
   * editing operation is complete, enabling or disabling them in turn.
   *
   * @returns {void}
   */
  main.setDynamicTimeout.cancel = function () {
    this.isComplete = true;
    wk.clearTimeout(this.identify);
  };

  /**
   * @description This internal method of the <code>setDynamicTimeout</code>
   * function is used to pause any ongoing editing operation by setting the
   * <code>isPaused</code> flow control <code>boolean</code> and clearing the
   * current <code>setTimeouT</code> identified <code>number</code>. This is
   * called whenever the user presses the <code>Pause</code> modal button.
   *
   * @returns {void}
   */
  main.setDynamicTimeout.pause = function () {
    if (this.isPaused || this.isComplete) {
      return;
    }

    this.isPaused = true;
    wk.clearTimeout(this.identify);
  };

  /**
   * @description This internal method of the <code>setDynamicTimeout</code>
   * function is used to resume any ongoing and paused editing operation by
   * setting the <code>isPaused</code> flow control <code>boolean</code> to
   * <code>false</code> and calling the <code>iterate</code> method to proceed
   * to the next iteration. It is called when the user presses "Resume."
   *
   * @returns {void}
   */
  main.setDynamicTimeout.resume = function () {
    if (!this.isPaused || this.isComplete) {
      return;
    }

    this.isPaused = false;
    this.iterate();
  };

  /**
   * @description This internal method of the <code>setDynamicTimeout</code>
   * function is used to proceed on to the next iteration by resetting the
   * <code>identify</code> function property to the value returned by a new
   * <code>setTimeout</code> invocation. The function accepts as an optional
   * parameter an interval rate greater than that defined as in the function
   * instance property <code>interval</code> for cases of ratelimiting. In such
   * a case, the rate is extended to 35 seconds before the callback is called.
   *
   * @param {number} paramInterval - Optional interval rate parameter
   * @returns {void}
   */
  main.setDynamicTimeout.iterate = function (paramInterval) {
    if (this.isPaused || this.isComplete) {
      return;
    }

    // Interval should only be greater than instance interval
    paramInterval = (paramInterval < this.interval || paramInterval == null)
      ? this.interval
      : paramInterval;

    // Define the identifier
    this.identify = wk.setTimeout(this.callback, paramInterval);
  };

  /****************************************************************************/
  /*                        Prototype API methods                             */
  /****************************************************************************/

  /**
   * @description This function queries the API for member pages of a specific
   * namespace, the id of which is included as a property of the parameter
   * <code>object</code>. This argument is merged with the default
   * <code>$.ajax</code> parameter object and can sometimes include properties
   * related to <code>query-continue</code> requests for additional members
   * beyond the default 5000 max. The method returns a resolved
   * <code>$.Deferred</code> promise for use in attaching related callbacks to
   * handle the member pages.
   *
   * @param {object} paramConfig - <code>object</code> with varying properties
   * @returns {object} - <code>$.Deferred</code> resolved promise
   */
  main.getNamespaceMembers = function (paramConfig) {
    return $.ajax({
      type: "GET",
      url: mw.util.wikiScript("api"),
      data: $.extend(false, {
        token: mw.user.tokens.get("editToken"),
        action: "query",
        list: "allpages",
        aplimit: "max",
        format: "json",
      }, paramConfig)
    });
  };

  /**
   * @description This function queries the API for member pages of a specific
   * category, the id of which is included as a property of the parameter
   * <code>object</code>. This argument is merged with the default
   * <code>$.ajax</code> parameter object and can sometimes include properties
   * related to <code>query-continue</code> requests for additional members
   * beyond the default 5000 max. The method returns a resolved
   * <code>$.Deferred</code> promise for use in attaching related callbacks to
   * handle the member pages.
   *
   * @param {object} paramConfig - <code>object</code> with varying properties
   * @returns {object} - <code>$.Deferred</code> resolved promise
   */
  main.getCategoryMembers = function (paramConfig) {
    return $.ajax({
      type: "GET",
      url: mw.util.wikiScript("api"),
      data: $.extend(false, {
        token: mw.user.tokens.get("editToken"),
        action: "query",
        list: "categorymembers",
        cmprop: "title",
        cmdir: "desc",
        cmlimit: "max",
        format: "json",
      }, paramConfig)
    });
  };

  /**
   * @description This function is used in cases of content find-and-replace to
   * acquire the parameter page's text content. As with all <code>$.ajax</code>
   * invocations, it returns a resolved <code>$.Deferred</code> promise for use
   * in attaching handlers tasked with combing through the page's content once
   * returned.
   *
   * @param {string} paramPage - <code>string</code> title of the page
   * @returns {object} - <code>$.Deferred</code> resolved promise
   */
  main.getPageContent = function (paramPage) {
    return $.ajax({
      type: "GET",
      url: mw.util.wikiScript("api"),
      data: {
        action: "query",
        prop: "info|revisions",
        intoken: "edit",
        titles: paramPage,
        rvprop: "content|timestamp",
        rvlimit: "1",
        indexpageids: "true",
        format: "json"
      }
    });
  };

  /**
   * @description This function is the primary means by which all edits are
   * committed to the database for display on the page. As with several of the
   * other API methods, this function is passed a config <code>object</code> for
   * merging with the default API parameter object, with parameter properties
   * differing depending on the operation being undertaken. Though it makes no
   * difference for the average editor, the <code>bot</code> property is set to
   * <code>true</code>. The function returns a resolved <code>$.Deferred</code>
   * promise for use in attaching handlers post-edit.
   *
   * @param {object} paramConfig - <code>object</code> with varying properties
   * @returns {object} - <code>$.Deferred</code> resolved promise
   */
  main.postPageContent = function (paramConfig) {
    return $.ajax({
      type: "POST",
      url: mw.util.wikiScript("api"),
      data: $.extend(false, {
        token: mw.user.tokens.get("editToken"),
        action: "edit",
        minor: true,
        bot: true,
        format: "json",
      }, paramConfig)
    });
  };

  /**
   * @description Originally a part of the <code>getMemberPages</code> function,
   * this method is used to return a <code>$>Deferred</code> object that passes
   * back either an error message for display in the modal status log or an
   * array containing wellformed, formatted titles of pages, categories, or
   * namespaces. If the type of entries contained with the parameter array is
   * either loose pages or categories, the function checks that their titles are
   * comprised of legal characters. If the type is namespace, it checks that the
   * number passed is a legitimate integer. It also prepends the "Category:"
   * namespace prefix in cases of categories.
   * <br />
   * <br />
   * The function returns a <code>$.Deferred</code> promise instead of an array
   * due to the function's use in conjunction with <code>getMemberPages</code>
   * in the body of <code>handleSubmit</code> and due to the desire to only
   * permit handlers to add log entries and adjust the view. Originally, this
   * function itself added log entries, which the author felt should be the sole
   * responsibility of the handlers attached to user-facing modal buttons rather
   * than helper functions like this and <code>getMemberPages</code>.
   *
   * @param {Array<string>} paramEntries - Array of pages/cats/ns
   * @param {object} $paramType - $ object; loose page, category, or namespace
   * @returns {object} $deferred - Promise returned for use w/ <code>then</code>
   */
  main.getValidatedEntries = function (paramEntries, $paramType) {

    // Declarations
    var i, n, entry, results, $deferred, isLoosePages, isCategories,
      isNamespaces, categoryPrefix;

    // Cache booleans
    isLoosePages =
      ($paramType.value === "pages") && ($paramType.selectedIndex === 1);
    isCategories =
      ($paramType.value === "categories") && ($paramType.selectedIndex === 2);
    isNamespaces =
      ($paramType.value === "namespaces") && ($paramType.selectedIndex === 3);

    // Returnable array of valid pages
    results = [];

    // Returned $.Deferred
    $deferred = new $.Deferred();

    // "Category:"
    categoryPrefix = wk.wgFormattedNamespaces[14] + ":";

    for (i = 0, n = paramEntries.length; i < n; i++) {

      // Cache value to prevent multiple map lookups
      entry = this.capitalize(paramEntries[i].trim());

      // If category-based and entry name doesn't begin with "Category"
      if (isCategories && !this.startsWith(entry, categoryPrefix)) {
        entry = categoryPrefix + entry;
      }

      // If legal page/category name, push into names array
      if (
        ((isCategories || isLoosePages) && this.isLegalInput(entry)) ||
        (isNamespaces && this.isInteger(entry))
      ) {
        results.push(entry);
      } else {
        // Error: Use of some characters is prohibited for security reasons.
        return $deferred.reject("modalSecurity");
      }
    }

    if (!results.length) {
      // Error: No wellformed pages found
      $deferred.reject("noMembers");
    } else {
      $deferred.resolve(results);
    }

    return $deferred.promise();
  };

  /**
   * @description This function is used to return a jQuery <code>Deferred</code>
   * object providing a <code>then</code> or <code>always</code> invocation with
   * an array of wellformed pages for editing. It accepts as input an array
   * containing titles of either categories or namespaces from which to
   * acquire member pages. In such cases, a number of API calls are made
   * requesting the relevant members pages contained in the input categories or
   * namespaces. These are checked and pushed into an entries array. Once
   * complete, the entries array is returned by means of a resolved
   * <code>Deferred.prototype.promise</code>.
   * <br />
   * <br />
   * Originally, this function also served to validate loose pages passed in the
   * parameter array, running them against the legl characters and returning the
   * <code>entries</code> array for use. However, per the single responsibility
   * principle, this functionality was eventually removed into a separate method
   * called <code>getValidatedEntries</code> that is called by this method to
   * ensure that the category/namespace titles are wellformed prior to making
   * API queries.
   *
   * @param {Array<string>} paramEntries - Array of user input pages
   * @param {object} $paramType - <code>jQuery</code> object, cat or ns
   * @returns {object} $returnPages - $.Deferred promise object
   */
  main.getMemberPages = function (paramEntries, $paramType) {

    // Declarations
    var i, n, names, data, entries, parameters, isCategories, isNamespaces,
      counter, config, $getPages, $addPages, $getEntries, $returnPages;

    // New pending Deferred objects
    $returnPages = new $.Deferred();
    $addPages = new $.Deferred();

    // Iterator index for setTimeout
    counter = 0;

    // getCategoryMembers or getNamespaceMembers param object
    parameters = {};

    // Arrays
    names = [];     // Store names of user entries
    entries = [];   // New entries to be returned

    // Cached booleans
    isCategories =
      ($paramType.value === "categories") && ($paramType.selectedIndex === 2);
    isNamespaces =
      ($paramType.value === "namespaces") && ($paramType.selectedIndex === 3);

    config = {
      2: {
        query: "categorymembers",
        handler: "getCategoryMembers",
        continuer: "cmcontinue",
        target: "cmtitle",
      },
      3: {
        query: "allpages",
        handler: "getNamespaceMembers",
        continuer: "apfrom",
        target: "apnamespace",
      }
    }[$paramType.selectedIndex];

    // Get wellformed, formatted namespace numbers or category names
    $getEntries = this.getValidatedEntries(paramEntries, $paramType);

    // Once acquired, apply to names array or pass along rejection message
    $getEntries.then(function (paramResults) {
      names = paramResults;
    }, $returnPages.reject.bind($));

    // Iterate over user input entries
    this.timer = this.setDynamicTimeout(function () {
      if (counter === names.length) {
        $addPages.resolve();

        if (entries.length) {
          return $returnPages.resolve(entries).promise();
        } else {
          // Error: No wellformed pages found
          return $returnPages.reject("noMembers").promise();
        }
      }

      // Set parameter target page
      parameters[config.target] = names[counter];

      // Fetching member pages of $1
      $returnPages.notify("fetchingMembers", names[counter]);

      // Acquire member pages of cat or ns
      $getPages = $.when(this[config.handler](parameters));

      // Once acquired, add pages to array
      $getPages.always($addPages.notify);

    }.bind(this), this.interval);

    /**
     * @description Once the member pages from the specific category or
     * namespace have been returned following a successful API query, the
     * $addPages <code>$.Deferred</code> is notified, allowing for this callback
     * function to sanitize the returned data and push the wellformed member
     * page titles into the <code>entries</code> array. If there are still
     * remaining pages as indicated by a "query-continue" property, the counter
     * is left unincremented and the relevant continuer parameter added to the
     * <code>parameters</code> object. In any case, the function ends with a
     * call to iterate the timer.
     */
    $addPages.progress(function (paramResults, paramStatus, paramXHR) {
      if (DEBUG) {
        console.log(paramResults, paramStatus, paramXHR);
      }

      if (paramStatus !== "success" || paramXHR.status !== 200) {
        // Error: Unable to acquire pages of $1
        $returnPages.notify("failedRequest", names[counter++]);
        return this.timer.iterate();
      }

      // Define data
      data = paramResults.query[config.query];

      // If page doesn't exist, add log entry and continue to next iteration
      if (data == null || data.length === 0) {
        // Error: $1 does not exist.
        $returnPages.notify("noSuchPage", names[counter++]);
        return this.timer.iterate();
      }

      // Add extant page titles to the appropriate submission property
      for (i = 0, n = data.length; i < n; i++) {
        entries.push(data[i].title);
      }

      // Only iterate counter if current query has no more extant pages
      if (
        paramResults["query-continue"] ||
        paramResults.hasOwnProperty("query-continue")
      ) {
        parameters[config.continuer] =
          paramResults["query-continue"][config.query][config.continuer];
      } else {
        parameters = {};
        counter++;
      }

      // On to the next iteration
      return this.timer.iterate();
    }.bind(this));

    return $returnPages.promise();
  };

  /****************************************************************************/
  /*                         Prototype assemblers                             */
  /****************************************************************************/

  /**
   * @description This function is a simple recursive <code>string</code> HTML
   * generator that makes use of <code>mw.html</code>'s assembly methods to
   * construct wellformed HTML strings from a set of nested input arrays. This
   * allows for a more readable means of producing proper HTML than the default
   * <code>jQuery</code> approach or the hardcoded HTML <code>string</code>
   * approach employed in earlier iterations of this script. Through the use of
   * nested arrays, this function permits the laying out of parent/child DOM
   * nodes in array form in a fashion similar to actual HTML, enhancing both
   * readability and usability.
   * <br />
   * <br />
   * Furthermore, as the <code>assembleElement</code> function returns a
   * <code>string</code>, nested invocations of the method within parameter
   * arrays is permitted, as evidenced in certain, more specialized assembly
   * methods elsewhere in the script.
   * <br />
   * <br />
   * An example of wellformed input is shown below:
   * <br />
   * <pre>
   * this.assembleElement(
   *   ["div", {id: "foo-id", class: "foo-class"},
   *     ["button", {id: "bar-id", class: "bar-class"},
   *       "Button text",
   *     ],
   *     ["li", {class: "overflow"},
   *       ["a", {href: "#"},
   *         "Link text",
   *       ],
   *     ],
   *   ],
   * );
   * </pre>
   *
   * @param {Array<string>} paramArray - Wellformed array representing DOM nodes
   * @returns {string} - Assembled <code>string</code> HTML
   */
  main.assembleElement = function (paramArray) {

    // Declarations
    var type, attributes, counter, content;

    // Make sure input argument is a well-formatted array
    if (!this.isThisAn("Array", paramArray)) {
      return this.assembleElement.call(this,
        Array.prototype.slice.call(arguments));
    }

    // Definitions
    counter = 0;
    content = "";
    type = paramArray[counter++];

    // mw.html.element requires an object for the second param
    attributes = (this.isThisAn("Object", paramArray[counter]))
      ? paramArray[counter++]
      : {};

    while (counter < paramArray.length) {

      // Check if recursive assembly is required for another inner DOM element
      content += (this.isThisAn("Array", paramArray[counter]))
        ? this.assembleElement(paramArray[counter++])
        : paramArray[counter++];
    }

    return mw.html.element(type, attributes, new mw.html.Raw(content));
  };

  /**
   * @description This specialized assembly function is used to create a tool
   * link to inclusion at the location specified via the <code>placement</code>
   * instance property. Like the <code>overflow</code> toolbar button on which
   * it is based, the element (in <code>string</code> form) returned from this
   * function constitutes a link element enclosed within a list element.
   *
   * @param {string} paramText - Title/item text <code>string</code>
   * @returns {string} - Assembled <code>string</code> HTML
   */
  main.assembleOverflowElement = function (paramText) {
    return this.assembleElement(
      ["li", {
        "class": this.Selectors.CLASS_PLACEMENT_OVERFLOW,
        "id": this.Selectors.ID_PLACEMENT_LIST,
       },
        ["a", {
          "id": this.Selectors.ID_PLACEMENT_LINK,
          "href": "#",
          "title": paramText,
        },
          paramText,
        ],
      ]
    );
  };

  /**
   * @description This function is one of two similar specialized assembly
   * functions used to automate the construction of several reoccuring
   * components in the modal content body. This function builds two types of
   * textfield, namely <code>input</code>s and <code>textarea</code>s. The
   * components may be disabled at creation via parameter <code>boolean</code>.
   *
   * @param {string} paramName - Name for message, id/classname generation
   * @param {string} paramType - <code>input</code> or <code>textarea</code>
   * @param {boolean} paramIsDisabled - Whether to disable the node on creation
   * @returns {string} - Assembled <code>string</code> HTML
   */
  main.assembleTextfield = function (paramName, paramType, paramIsDisabled) {

    // Declarations
    var elementId, elementClass, message, attributes;

    // Sanitize parameters
    paramName = paramName.toLowerCase();
    paramType = paramType.toLowerCase();

    // Definitions
    elementId = "ID_CONTENT_" + paramName.toUpperCase();
    elementClass = "CLASS_CONTENT_" + paramType.toUpperCase();
    message = "modal" + this.capitalize(paramName);

    attributes = {
      id: this.Selectors[elementId],
      class: this.Selectors[elementClass],
      placeholder: this.i18n.msg(message + "Placeholder").plain(),
      disabled: paramIsDisabled || false,
    };

    if (paramType === "input") {
      attributes.type = "textbox";
    }

    return this.assembleElement(
      ["div", {class: this.Selectors.CLASS_CONTENT_DIV},
        ["span", {class: this.Selectors.CLASS_CONTENT_SPAN},
          this.i18n.msg(message + "Title").escape(),
        ],
        [paramType, attributes],
      ]
    );
  };

  /**
   * @description This function is one of two similar specialized assembly
   * functions used to automate the construction of several reoccuring
   * components in the modal content body. This function is used to build
   * dropdown menus from a default value and an array of required
   * <code>option</code>s.
   *
   * @param {string} paramName - <code>string</code> name of the dropdown
   * @param {string} paramDefault - First dropdown option (default)
   * @param {Array<string>} paramValues - Array of dropdown options
   * @param {boolean} paramIsDisabled - Optional param denoting disabled status
   * @returns {string} - Assembled <code>string</code> HTML
   */
  main.assembleDropdown = function (paramName, paramDefault, paramValues,
      paramIsDisabled) {

    // Declarations
    var i, n, titleMsg, options, value, selectId;

    // Sanitize input
    paramName = paramName.toLowerCase();

    // Define select element ID
    selectId = "ID_CONTENT_" + paramName.toUpperCase();

    // Listing of selectable dropdown options
    options = "";

    // Message used in title and default dropdown option
    titleMsg = this.i18n.msg(paramDefault).escape();

    // Assemble array of HTML option strings
    for (i = 0, n = paramValues.length; i < n; i++) {

      // Sanitize parameter
      value = paramValues[i].toLowerCase();

      options += this.assembleElement(
        ["option", {value: value},
          this.i18n.msg("dropdown" + this.capitalize(value)).escape(),
        ]
      );
    }

    return this.assembleElement(
      ["div", {class: this.Selectors.CLASS_CONTENT_DIV},
        ["span", {class: this.Selectors.CLASS_CONTENT_SPAN},
          titleMsg,
        ],
        ["select", {
          size: "1",
          name: paramName,
          id: this.Selectors[selectId],
          class: this.Selectors.CLASS_CONTENT_SELECT,
          disabled: paramIsDisabled || false,
        },
          ["option", {selected: ""},
           titleMsg,
          ],
          options,
        ],
      ]
    );
  };

  /****************************************************************************/
  /*                        Prototype modal methods                           */
  /****************************************************************************/

  /**
   * @description This one-size-fits-all helper function is used to log entries
   * in the status log on the completion of some operation or other. Originally,
   * three separate loggers were used following a Java-esque method overloading
   * approach. However, this was eventually abandoned in favor of a single
   * method that takes an indeterminate number of arguments at any time.
   *
   * @returns {void}
   */
  main.addModalLogEntry = function () {
    $("#" + this.Selectors.ID_CONTENT_LOG).prepend(
      this.i18n.msg.apply(this,
        (arguments.length === 1 && arguments[0] instanceof Array)
          ? arguments[0]
          : Array.prototype.slice.call(arguments)
      ).escape() + "<br />");
  };

  /**
   * @description This helper function is a composite of several previously
   * extant shorter utility functions used to reset the form element,
   * enable/disable various modal buttons, and log messages. It is called in a
   * variety of contexts at the close of editing operations,
   * failed API requests, and the like. Though it does not accept any formal
   * parameters, it does permit an indeterminate number of arguments to be
   * passed if the invoking function wishes to log a status message. In such
   * cases, the collated arguments are bound to a shallow array and passed to
   * <code>addModalLogEntry</code> for logging.
   *
   * @returns {void}
   */
  main.resetModal = function () {

    // Cancel the extant timer if applicable
    if (this.timer && !this.timer.isComplete) {
      this.timer.cancel();
    }

    // Add log message if i18n parameters passed
    if (arguments.length) {
      this.addModalLogEntry(Array.prototype.slice.call(arguments));
    }

    // Reset the form
    $("#" + this.Selectors.ID_CONTENT_FORM)[0].reset();

    // Re-enable modal buttons and fieldset
    this.toggleModalComponentsDisable(false, "modal");
  };

  /**
   * @description This helper function is used to disable certain elements and
   * enable others depending on the operation being performed. It is used
   * primarily during editing to disable one of several element groups related
   * to either replace fields or the fieldset/modal buttons in order to prevent
   * illegitimate mid-edit changes to input. If the fieldset, etc. is disabled,
   * the method enables the buttons related to pausing and canceling the editing
   * operation, and vice versa.
   *
   * @param {boolean} paramValue - Whether or not the form/fieldset is disabled
   * @param {string} paramTargetGroup - Group to toggle ("modal" or "replace")
   * @returns {void}
   */
  main.toggleModalComponentsDisable = function (paramValue, paramTargetGroup) {

    // Declarations
    var i, n, groupSet, current;

    // Sanitize input
    paramTargetGroup = paramTargetGroup.toLowerCase();

    // Elements to disable/enable
    groupSet = {
      modal :[
        {
          target: "#" + this.Selectors.ID_CONTENT_FIELDSET,
          value: paramValue,
        },
        {
          target: "." + this.Selectors.CLASS_MODAL_OPTION,
          value: paramValue,
        },
        {
          target: "." + this.Selectors.CLASS_MODAL_TIMER,
          value: !paramValue,
        },
      ],
      replace: [
        {
          target: "#" + this.Selectors.ID_CONTENT_CASE,
          value: paramValue,
        },
        {
          target: "#" + this.Selectors.ID_CONTENT_REPLACE,
          value: paramValue,
        },
        {
          target: "#" + this.Selectors.ID_CONTENT_INDICES,
          value: paramValue,
        }
      ]
    }[paramTargetGroup];

    for (i = 0, n = groupSet.length; i < n; i++) {
      current = groupSet[i];

      $(current.target).prop("disabled", current.value);
    }
  };

  /**
   * @description This method calls <code>assembleElement</code> and its various
   * specialized cousins to assemble the complete modal content body HTML in its
   * <code>string</code> form. In previous incarnations of this script, this
   * method would have simply returned a large <code>string</code> of
   * preassembled HTML, this approach allows for a more readable design that
   * can be more easily extended or expanded in future without the need to mess
   * around with hardcoded HTML <code>string</code>s. The contents of this
   * method are applied in the construction of the new <code>Modal</code> class
   * instance in the body of <code>buildModal</code>.
   *
   * @returns {string} - Assembled <code>string</code> HTML
   */
  main.buildModalContent = function () {

    // Declarations
    var i, j, m, n, object, arrays, data, elements;

    // Dataset holding assembler name and set of arguments in array form
    data = [
      { // Assembles three dropdown menus
        handler: "assembleDropdown",
        parameterArrays: [
          ["action", "modalSelect", ["prepend", "append", "replace"]],
          ["type", "modalContentType", ["pages", "categories", "namespaces"]],
          ["case", "modalCaseSensitivity", ["sensitive", "insensitive"], true],
        ]
      },
      { // Assembles five textfields (3 textareas, 2 inputs)
        handler: "assembleTextfield",
        parameterArrays: [
          ["replace", "textarea", true],
          ["indices", "input", true],
          ["content", "textarea"],
          ["pages", "textarea"],
          ["summary", "input"],
        ]
      }
    ];

    // Using data array, create 5 textarea/inputs and 2 dropdowns as a string
    elements = "";
    for (i = 0, m = data.length; i < m; i++) {
      object = data[i];
      arrays = object.parameterArrays;
      for (j = 0, n = arrays.length; j < n; j++) {
        elements += this[object.handler].apply(this, arrays[j]);
      }
    }

    return this.assembleElement(
      ["section", {
        id: this.Selectors.ID_CONTENT_CONTAINER,
        class: this.Selectors.CLASS_CONTENT_CONTAINER,
      },
        ["form", {
          id: this.Selectors.ID_CONTENT_FORM,
          class: this.Selectors.CLASS_CONTENT_FORM,
        },
          ["fieldset", {id: this.Selectors.ID_CONTENT_FIELDSET},
            elements,
          ],
          ["hr"],
        ],
        ["div", {class: this.Selectors.CLASS_CONTENT_DIV},
          ["span", {class: this.Selectors.CLASS_CONTENT_SPAN},
            this.i18n.msg("modalLog").escape(),
          ],
          ["div", {
            id: this.Selectors.ID_CONTENT_LOG,
            class: this.Selectors.CLASS_CONTENT_DIV,
          }],
        ],
      ]
    );
  };

  /**
   * @description This method is used both to inject the requisite CSS styling
   * governing the appearance of the modal and to build a new <code>Modal</code>
   * class instance itself. While the styles could be stored in a dedicated
   * <code>.css</code> file on Dev, keeping them here would more easily handle
   * selector name changes due to the use of a <code>selectors</code> object
   * collating all ids and classes evidenced in the modal in a single place.
   *
   * @returns {object} - A new <code>Modal</code> instance
   */
  main.buildModal = function () {
    mw.util.addCSS(
      "." + this.Selectors.CLASS_CONTENT_CONTAINER + " {" +
        "margin: auto;" +
        "position: relative;" +
        "width: 96%;" +
      "}" +
      "." + this.Selectors.CLASS_CONTENT_SELECT + "," +
      "." + this.Selectors.CLASS_CONTENT_TEXTAREA + "," +
      "." + this.Selectors.CLASS_CONTENT_INPUT + " {" +
        "width: 99.6%;" +
        "padding: 0;" +
        "resize: none;" +
      "}" +
      "." + this.Selectors.CLASS_CONTENT_TEXTAREA + " {" +
        "height: 45px;" +
      "}" +
      "#" + this.Selectors.ID_CONTENT_LOG + " {" +
        "height: 45px;" +
        "width: 99.6%;" +
        "border: 1px solid;" +
        "font-family: monospace;" +
        "background: #FFFFFF;" +
        "color: #AEAEAE;" +
        "overflow: auto;" +
        "padding: 0;" +
      "}" +
      "." + this.Selectors.CLASS_MODAL_BUTTON + "{" +
        "margin-left: 5px !important;" +
        "font-size: 8pt;" +
      "}" +
      "." + this.Selectors.CLASS_MODAL_LEFT + "{" +
        "float: left !important;" +
        "margin-left: 0px !important;" +
        "margin-right: 5px;" +
      "}"
    );

    return new wk.dev.modal.Modal({
      content: this.buildModalContent(),
      id: this.Selectors.ID_MODAL_CONTAINER,
      size: "medium",
      title: this.i18n.msg("itemTitle").escape(),
      events: {
        submit: this.handleSubmit.bind(this),
        toggle: this.handleToggle.bind(this),
        clear: this.handleClear.bind(this),
        cancel: this.handleCancel.bind(this),
      },
      buttons: [
        {
          text: this.i18n.msg("buttonSubmit").escape(), // Submit
          event: "submit",
          primary: true,
          id: this.Selectors.ID_MODAL_SUBMIT,
          classes: [
            this.Selectors.CLASS_MODAL_BUTTON,
            this.Selectors.CLASS_MODAL_OPTION,
          ],
        },
        {
          text: this.i18n.msg("buttonPause").escape(), // Pause
          event: "toggle",
          disabled: true,
          primary: true,
          id: this.Selectors.ID_MODAL_TOGGLE,
          classes: [
            this.Selectors.CLASS_MODAL_BUTTON,
            this.Selectors.CLASS_MODAL_TIMER,
          ],
        },
        {
          text: this.i18n.msg("buttonCancel").escape(), // Cancel
          event: "cancel",
          disabled: true,
          primary: true,
          id: this.Selectors.ID_MODAL_CANCEL,
          classes: [
            this.Selectors.CLASS_MODAL_BUTTON,
            this.Selectors.CLASS_MODAL_TIMER,
          ],
        },
        {
          text: this.i18n.msg("buttonClose").escape(), // Close
          event: "close",
          id: this.Selectors.ID_MODAL_CLOSE,
          classes: [
            this.Selectors.CLASS_MODAL_BUTTON,
            this.Selectors.CLASS_MODAL_LEFT,
            this.Selectors.CLASS_MODAL_OPTION,
          ],
        },
        {
          text: this.i18n.msg("buttonClear").escape(), // Clear
          event: "clear",
          id: this.Selectors.ID_MODAL_CLEAR,
          classes: [
            this.Selectors.CLASS_MODAL_BUTTON,
            this.Selectors.CLASS_MODAL_LEFT,
            this.Selectors.CLASS_MODAL_OPTION,
          ],
        },
      ],
    });
  };

  /**
   * @description This method is the primary mechanism by which the modal is
   * displayed to the user. If the modal has not been previously assembled, the
   * function constructs a new <code>Modal</code> instance via an invocation of
   * <code>buildModal</code>, creates the modal, and attaches all the requisite
   * event listeners related to enabling <code>linksuggest</code> and find-and-
   * replace-specific modal elements (linksuggest is enabled for the content
   * <code>textarea</code> and the edit summary <code>input</code>).
   * <br />
   * <br />
   * Once all listeners have been attached, the new modal is displayed to the
   * user. If the modal has been assembled prior to method invocation, the
   * instance is displayed to the user and the method exited.
   *
   * @returns {void}
   */
  main.displayModal = function () {
    if (this.modal != null) {
      this.modal.show();
      return;
    }

    // Declarations
    var i, n, current, elementsForLinksuggest, actionId, isReplace;

    elementsForLinksuggest = [
      this.Selectors.ID_CONTENT_CONTENT, // New content to be added
      this.Selectors.ID_CONTENT_SUMMARY, // Edit summary
    ];

    // Temp alias
    actionId = "#" + this.Selectors.ID_CONTENT_ACTION;

    // Construct new Modal instance
    this.modal = this.buildModal();

    // Create, then apply all relevant listeners
    this.modal.create().then(function () {

      // Apply linksuggest to each element on focus event
      for (i = 0, n = elementsForLinksuggest.length; i < n; i++) {
        current = "#" + elementsForLinksuggest[i];

        $(document).on("focus", current,
          $.prototype.linksuggest.bind($(current)));
      }

      // Enable replace textarea  + input if replace option selected in dropdown
      $(document).on("change", actionId, function () {
        isReplace = ($(actionId).val() === "replace");

        if (DEBUG) {
          console.log(isReplace);
        }

        this.toggleModalComponentsDisable(!isReplace, "replace");
      }.bind(this));

      // Once events are set, display the modal
      this.modal.show();
    }.bind(this));

    if (DEBUG) {
      console.dir(this.modal);
    }
  };

  /****************************************************************************/
  /*                      Prototype event handlers                            */
  /****************************************************************************/

  /**
   * @description Arguably the most important method of the program, this
   * function coordinates the entire mass editing process from the initial press
   * of the "Submit" button to the conclusion of the editing operation. The
   * entire workings of the process were contained within a single method to
   * assist in maintaining readability when it comes time to invariably repair
   * bugs and broken functionality. The other two major methods used by this
   * function are <code>getMemberPages</code> and
   * <code>getValidatedEntries</code>, both of which are used to sanitize input
   * and return wellformed loose member pages if applicable.
   * <br />
   * <br />
   * The function collates all extant user input added via <code>textarea</code>
   * and <code>input</code> fields before running through a set of conditional
   * checks to determine if the user can continue with the requested editing
   * operation. If the user may proceed, the function makes use of a number of
   * <code>$.Deferred</code> promises to coordinate the necessary acquisition of
   * wellformed pages for editing. In cases of categories/namespaces, member
   * pages are retrieved and added to the editing queue for processing.
   *
   * @returns {void}
   */
  main.handleSubmit = function () {
    if (this.timer && !this.timer.isComplete) {
      if (DEBUG) {
        console.dir(this.timer);
      }
      return;
    }

    // Declarations
    var $action, $type, $case, $content, $replace, $indices, indices, $pages,
      pages, $summary, counter, parameters, data, pageIndex, newText, $getPages,
      $postPages, $getNextPage, $getPageContent, $postPageContent, error,
      isCaseSensitive, isFindAndReplace;

    // Grab user input
    $action = $("#" + this.Selectors.ID_CONTENT_ACTION)[0];
    $type = $("#" + this.Selectors.ID_CONTENT_TYPE)[0];
    $case = $("#" + this.Selectors.ID_CONTENT_CASE)[0];
    $replace = $("#" + this.Selectors.ID_CONTENT_REPLACE).val();
    $indices = $("#" + this.Selectors.ID_CONTENT_INDICES).val();
    $content = $("#" + this.Selectors.ID_CONTENT_CONTENT).val();
    $pages = $("#" + this.Selectors.ID_CONTENT_PAGES).val();
    $summary = $("#" + this.Selectors.ID_CONTENT_SUMMARY).val();

    // Cache frequently used boolean flag
    isFindAndReplace = ($action.value === "replace" &&
      $action.selectedIndex === 3);

    // Is not in the proper rights group
    if (!this.hasRights()) {
      this.resetModal();

      // Error: Incorrect user rights group.
      this.addModalLogEntry("modalUserRights");
      return;

    // No pages included
    } else if (!$pages) {

      // Error: No pages content entered.
      this.addModalLogEntry("noPages");
      return;

    // Is either append/prepend with no content input included
    } else if (!isFindAndReplace && !$content) {

      // Error: No content entered.
      this.addModalLogEntry("noContent");
      return;

    // Is find-and-replace with no target content included
    } else if (isFindAndReplace && !$replace) {

      // Error: No target content entered.
      this.addModalLogEntry("noTarget");
      return;

    // If edit summary is greater than permitted max of 800 characters
    } else if ($summary.length > this.Utility.MAX_SUMMARY_CHARS) {

      // Error: Edit summary exceeds maximum character limit.
      this.addModalLogEntry("overlongSummary");
      return;

    // If user forgot to select dropdown options (no reset b/c annoying)
    } else if ($action.selectedIndex === 0 || $type.selectedIndex === 0 ||
        (isFindAndReplace && $case.selectedIndex === 0)) {

      // Error: Please select an action to perform before submitting.
      this.addModalLogEntry("noOptionSelected");
      return;
    }

    // Editing...
    this.addModalLogEntry("loading");
    this.toggleModalComponentsDisable(true, "modal");

    // Find-and-replace specific variable definitions
    if (isFindAndReplace) {

      // Only wellformed integers should be included as f-n-r indices
      indices = $indices.split(",").map(function (paramEntry) {
        if (this.isInteger(paramEntry.trim())) {
          return wk.parseInt(paramEntry, 10);
        }
      }.bind(this)).filter(function (paramEntry) {
        return paramEntry != null; // Avoid cases of [undefined]
      }.bind(this));

      // Whether not search and replace is case sensitive
      isCaseSensitive = ($case.selectedIndex === 1 &&
        $case.value === "sensitive");
    }

    // Array of pages/categories/namespaces
    pages = $pages.split(/[\n]+/);

    // Page counter for setInterval
    counter = 0;

    // Default page editing parameters
    parameters = {
      summary: $summary,
    };

    // New pending status Deferreds
    $postPages = new $.Deferred();
    $getNextPage = new $.Deferred();

    // Get a listing of wellformed pages
    $getPages = this[($type.selectedIndex === 1)
      ? "getValidatedEntries"
      : "getMemberPages"
    ](pages, $type);

    /**
     * @description The resolved <code>$getPages</code> returns an array of
     * loose pages from a namespace or category, or returns an array of checked
     * loose pages if the individual pages option is selected. Once resolved,
     * <code>$getPages</code> uses a <code>setDynamicTimeout</code> to iterate
     * over the pages, optionally acquiring page content for find-and-replace.
     * Once done, an invocation of <code>notify</code> calls
     * <code>$postPages.progress</code> to assemble the parameters needed to
     * edit the page in question. Once all pages have been edited, the pending
     * <code>$.Deferred</code>s are resolved and the timer exited.
     */
    $getPages.done(function (paramResults) {
      pages = paramResults;

      // Iterate over pages
      this.timer = this.setDynamicTimeout(function () {
        parameters.title = pages[counter];

        if (counter === pages.length) {
          $getNextPage.resolve();
          $postPages.resolve("editSuccessComplete");
        } else {
          $getPageContent = ($action.selectedIndex < 3)
            ? new $.Deferred().resolve({}).promise()
            : this.getPageContent(pages[counter]);

          // Grab data, extend parameters, then edit the page
          $getPageContent.always($postPages.notify);
        }
      }.bind(this), this.interval);
    }.bind(this));

    /**
     * @description In the cases of failed loose page acquisitions, either from
     * a failed API GET request or from a lack of wellformed input loose pages,
     * the relevant log entry returned from the getter function's
     * <code>$.Deferred</code> is logged, the timer canceled, and the modal form
     * re-enabled by means of <code>resetModal</code>.
     */
    $getPages.fail(this.resetModal.bind(this));

    /**
     * @description Whenever the getter function (<code>getMemberPages</code> or
     * <code>getValidatedEntries</code>) needs to notify its invoking function
     * of a new ongoing category/namespace member acquisition operation, the
     * returned status message is acquired and added to the modal log.
     */
    $getPages.progress(this.addModalLogEntry.bind(this));

    /**
     * @description Once the <code>$postPages</code> <code>Deferred</code> is
     * resolved, indicating the completion of the requested mass edits, a final
     * status message is logged, the form reenabled and reset for a new
     * round, and the <code>setDynamicTimeout</code> timer canceled by means of
     * <code>resetModal</code>.
     */
    $postPages.always(this.resetModal.bind(this));

    /**
     * @description The <code>progress</code> handler is used to extend the
     * <code>parameters</code> object with properties relevant to the action
     * being performed (i.e. append/prepend or find-and-replace). Once complete,
     * the modified page content is committed and the edit made by means of
     * <code>postPageContent</code>. Once the edit is complete and a resolved
     * promise returned, <code>$postPageContent</code> pings the pending
     * <code>$getNextPage</code> <code>$.Deferred</code> to log the relevant
     * messages and iterate on to the next page to be edited.
     */
    $postPages.progress(function (paramResults) {
      if (DEBUG) {
        console.log(paramResults);
      }

      if ($action.selectedIndex < 3) {
        // "appendtext" or "prependtext"
        parameters[$action.value.toLowerCase() + "text"] = $content;
        parameters.token = mw.user.tokens.get("editToken");
      } else {
        pageIndex = Object.keys(paramResults.query.pages)[0];
        data = paramResults.query.pages[pageIndex];

        // Return if page doesn't exist to the server
        if (pageIndex === "-1") {
          // Error: $1 does not exist.
          this.addModalLogEntry("noSuchPage", pages[counter++]);
          return this.timer.iterate();
        }

        // Set replace-specific properties
        parameters.text = data.revisions[0]["*"];
        parameters.basetimestamp = data.revisions[0].timestamp;
        parameters.startimestamp = data.starttimestamp;
        parameters.token = data.edittoken;

        if (DEBUG) {
          console.log(parameters.text, isCaseSensitive, $replace, $content,
            indices);
        }

        // Replace instances of chosen text with inputted new text
        newText = this.replaceOccurrences(parameters.text, isCaseSensitive,
          $replace, $content, indices);

        // Return if old & new revisions are identical in content
        if (newText === parameters.text) {
          // Error: No instances of $1 found in $2.
          this.addModalLogEntry("noMatch", $replace, pages[counter++]);
          return this.timer.iterate();
        } else {
          parameters.text = newText;
        }
      }

      // Deferred attached to posting of data
      $postPageContent = this.postPageContent(parameters);
      $postPageContent.always($getNextPage.notify);

    }.bind(this));

    /**
     * @description The pending state <code>$getNextPage</code>
     * <code>$.Deferred</code> is pinged by <code>$postPageContent</code> once
     * an POST request is made and a resolved status <code>$.Deferred</code>
     * returned. The <code>progress</code> callback takes the resultant success/
     * failure data and logs the relevant messages before moving the operation
     * on to the iteration of the <code>setDynamicTimeout</code> timer. If the
     * user has somehow been ratelimited, the function introduces a 35 second
     * cooldown period before undertaking the next edit and pushes the unedited
     * page back onto the <code>pages</code> stack.
     */
    $getNextPage.progress(function (paramData) {
      if (DEBUG) {
        console.log(paramData);
      }

      error = (paramData.error && paramData.error.code)
        ? paramData.error.code
        : "unknownerror";

      if (paramData.edit && paramData.edit.result === "Success") {
        // Success: $1 successfully edited!
        this.addModalLogEntry("editSuccess", pages[counter++]);
      } else if (error === "ratelimited") {
        // Error: Ratelimited. Editing delayed $1 seconds.
        this.addModalLogEntry("editFailureRateLimited",
          (this.Utility.DELAY / 1000).toString());

        // Push the unedited page back on the stack
        pages.push(pages[counter++]);
      } else {
        // Error: $1 not edited. Please try again.
        this.addModalLogEntry("editFailure", pages[counter++]);
      }

      // On to the next iteration
      this.timer.iterate((error === "ratelimited") ? this.Utility.DELAY : null);
    }.bind(this));
  };

  /**
   * @description The <code>handleToggle</code> is the primary click handler for
   * the "Pause/Resume" button used to toggle the iteration timer. Depending on
   * whether or not the timer is in use in iterating through collated pages
   * requiring editing, the text of the button will change accordingly. Once
   * invoked, the method will either restart the timer during an iteration or
   * pause it indefinitely. If the timer is not running, the method will exit.
   *
   * @returns {void}
   */
  main.handleToggle = function () {
    if (!this.timer || (this.timer && this.timer.isComplete)) {
      if (DEBUG) {
        console.dir(this.timer);
      }
      return;
    }

    // Declarations
    var $toggle, config;

    // Definitions
    $toggle = $("#" + this.Selectors.ID_MODAL_TOGGLE);
    config = [
      {
        message: "timerPaused", // Editing paused
        text: "buttonResume",
        method: "pause",
      },
      {
        message: "timerResume", // Editing resumed
        text: "buttonPause",
        method: "resume",
      }
    ][+this.timer.isPaused];

    // Add status log entry
    this.addModalLogEntry(config.message);

    // Change the text of the button
    $toggle.text(this.i18n.msg(config.text).escape());

    // Either resume or pause the setDynamicTimeout
    this.timer[config.method]();
  };

  /**
   * @description Similar to <code>handleToggle</code>, this function is used to
   * cancel the timer used to iterate through pages requiring editing. As such,
   * it cancels the timer, adds a relevant status log entry, and re-enables the
   * standard editing buttons in the modal <code>footer</code>. If the timer is
   * presently not running, the method simply returns and exits. The timer is
   * logged in the console if <code>DEBUG</code> is set to <code>true</code>.
   *
   * @returns {void}
   */
  main.handleCancel = function () {
    if (!this.timer || (this.timer && this.timer.isComplete)) {
      if (DEBUG) {
        console.dir(this.timer);
      }
      return;
    } else {
      this.resetModal("timerCancel");
    }
  };

  /**
   * @description As the name implies, the <code>handleClear</code> listener is
   * used to clear the modal contents and reset the <code>form</code> HTML
   * element. Rather than simply invoke the helper function
   * <code>resetModal</code>, however, this function adds some animation by
   * disabling the button set and fading in and out of the modal body during the
   * clearing operation, displaying a status message in the log upon completion.
   *
   * @returns {void}
   */
  main.handleClear = function () {
    if (this.timer && !this.timer.isComplete) {
      if (DEBUG) {
        console.dir(this.timer);
      }
      return;
    }

    // Declarations
    var visible, hidden;

    // $.prototype.animate objects
    visible = {opacity: 1};
    hidden = {opacity: 0};

    // Disable all modal buttons for duration of fade and reset
    $("." + this.Selectors.CLASS_MODAL_BUTTON).prop("disabled", true);

    // Fade out on modal and reset content before fade-in
    $("#" + this.Selectors.ID_MODAL_CONTAINER + " > section")
      .animate(hidden, this.Utility.FADE_INTERVAL,
        this.resetModal.bind(this))
      .animate(visible, this.Utility.FADE_INTERVAL,
        // Success: All fields reset
        this.addModalLogEntry.bind(this, "resetForm"));
  };

  /****************************************************************************/
  /*                     Prototype Pseudo-constructor                         */
  /****************************************************************************/

  /**
   * @description The confusingly named <code>main.init</code> function serves
   * as a pseudo-constructor of the MassEdit class instance .Through the
   * <code>descriptor</code> passed to <code>init.main</code>'s invocation of
   * <code>Object.create</code> sets the <code>i18n</code>,
   * <code>interval</code>, and <code>placement</code> instance properties, this
   * function sets default values for <code>modal</code> and <code>timer</code>
   * and defines the toolbar element and its associated event listener, namely
   * <code>displayModal</code>.
   * <br />
   * <br />
   * Following this function's invocation, the MassEdit class instance will have
   * a total of five instance variables, namely, <code>i18n</code>,
   * <code>placement</code>, <code>interval</code>, <code>modal</code>, and
   * <code>timer</code>. All other functionality related to the script is stored
   * in the class instance prototype, the <code>main</code> namespace object,
   * for convenience.
   *
   * @returns {void}
   */
  main.init = function () {

    // Declarations
    var $toolItem, toolText;

    // I18n config for wiki's content language
    this.i18n.useContentLang();

    // Initialize new modal property
    this.modal = null;

    // Initialize a new dynamic timer object
    this.timer = null;

    // View instance props and prototype
    if (DEBUG) {
      console.dir(this);
    }

    // Text to display in the tool element
    toolText = this.i18n.msg("itemTitle").plain(); // MassEdit

    // Build tool item (nested link inside list element)
    $toolItem = $(this.assembleOverflowElement(toolText));

    // Display the modal on click
    $toolItem.on("click", this.displayModal.bind(this));

    // Either append or prepend the tool to the target
    $(this.placement.element)[this.placement.type]($toolItem);
  };

  /****************************************************************************/
  /*                        Init helper functions                             */
  /****************************************************************************/

  /**
   * @description The first of two user input validators, this function is used
   * to ensure that the user's included config details related to Placement.js
   * are wellformed and legitimate. MassEdit.js offers support for all of
   * Placement.js's default element locations, though as a nod to the previous
   * incarnation of the script, the default placement element is the toolbar and
   * the default type is "append." In the event of an error being caught due to
   * a malformed element location or a missing type, the default config options
   * housed in <code>Message.utility.defaultConfig</code> are used instead to
   * ensure that user input mistakes are handled somewhat gracefully.
   *
   * @param {object} paramConfig - Placement.js-specific config
   * @returns {object} config - Adjusted Placement.js config
   */
  init.definePlacement = function (paramConfig) {

    // Declarations
    var config, loader;

    // Definitions
    config = {};
    loader = wk.dev.placement.loader;

    try {
      config.element = loader.element(paramConfig.element);
    } catch (e) {
      config.element = loader.element(this.Placement.DEFAULTS.ELEMENT);
    }

    try {
      config.type = loader.type(
        (this.Placement.VALID_TYPES.indexOf(paramConfig.type) !== -1)
          ? paramConfig.type
          : this.Placement.DEFAULTS.TYPE
      );
    } catch (e) {
      config.type = loader.type(this.Placement.DEFAULTS.TYPE);
    }

    // Set script name
    loader.script(this.Utility.SCRIPT);

    return config;
  };

  /**
   * @description The second of the two validator functions used to check that
   * user input is wellformed and legitimate, this function checks the user's
   * edit interval value against the permissible values for standard users and
   * flagged bot accounts. In order to ensure that the operations are carried
   * out smoothly, the user's rate is adjusted if it exceeds the edit
   * restrictions placed upon accounts of different user rights levels. The
   * original incarnation of this method came from a previous version of
   * MassEdit which made use of a similar, jankier system to ensure the smooth
   * progression through all included pages without loss of required edits.
   *
   * @see <a href="https://git.io/fA4Jk">SUS-4775</a>
   * @see <a href="https://git.io/fA4eQ">VariablesBase.php</a>
   * @param {number} paramInterval - User's input interval value
   * @return {number} - Adjusted interval
   */
  init.defineInterval = function (paramInterval) {
    if (
      wk.wgUserGroups.indexOf("bot") !== -1 &&
      (paramInterval < this.Utility.BOT_INTERVAL || wk.isNaN(paramInterval))
    ) {
      return this.Utility.BOT_INTERVAL; // Reset to max 80 edits/minute
    } else if (
      wk.wgUserGroups.indexOf("user") !== -1 &&
      (paramInterval < this.Utility.STD_INTERVAL || wk.isNaN(paramInterval))
    ) {
      return this.Utility.STD_INTERVAL; // Reset to max 40 edits/minute
    } else {
      return wk.parseInt(paramInterval, 10);
    }
  };

  /****************************************************************************/
  /*                          Init main functions                             */
  /****************************************************************************/

  /**
   * @description The confusingly named <code>init.main</code> function is used
   * to coordinate the script setup madness in a single method, validating all
   * user input by means of helper method invocation and setting all instance
   * properties of the MassEdit class instance. Once the <code>descriptor</code>
   * <code>object</code>  has been assembled containing the relevant instance
   * variables for placement, edit interval, and i18n messages, the method calls
   * <code>Object.create</code> to construct a new MassEdit class instance,
   * passing the <code>descriptor</code> and the <code>main</code> namespace
   * <code>object</code> as the instance's prototype.
   * <br />
   * <br />
   * The separation of setup code and MassEdit functionality code into distinct
   * namespace <code>object</code>s helped to ensure that code was logically
   * organized per the single responsibility principle and more readable by
   * virtue of the fact that each namespace handles distinctly different tasks.
   * This will assist in debugging should an issue arise with either the setup
   * or the script's functionality itself.
   *
   * @param {object} paramLang - i18n <code>object</code> returned from hook
   * @returns {void}
   */
  init.main = function (paramLang) {

    // Declarations
    var i, n, array, descriptor, parameter, lowercase, method, property,
      descriptorProperties;

    array = ["Interval", "Placement"];

    // New Object.create descriptor object
    descriptor = {};

    descriptorProperties = {
      enumerable: true,
      configurable: false,
      writable: false,
    };

    // Set I18n object as instance property
    descriptor.i18n = $.extend(true, {}, descriptorProperties);
    descriptor.i18n.value = paramLang;

    // Reduce copy pasta
    for (i = 0, n = array.length; i < n; i++) {

      // Definitions
      property = array[i];
      method = "define" + property;
      lowercase = property.toLowerCase();
      parameter = (wk.MassEditConfig && wk.MassEditConfig[lowercase])
        ? wk.MassEditConfig[lowercase]
        : null;

      // New descriptor entry
      descriptor[lowercase] = $.extend(true, {}, descriptorProperties);

      // Define descriptor entry value
      descriptor[lowercase].value = this[method](parameter);
    }

    if (DEBUG) {
      console.dir(init);
    }

    // Create new MassEdit instance
    Object.create(main, descriptor).init();
  };

  /**
   * @description This function is invoked as many times as there are external
   * dependencies, serving as the primary hook handler for each of the required
   * events denoted in <code>init.Dependencies.SCRIPTS</code>. Once all
   * dependencies have been successfully loaded and the hooks fired, the
   * function loads I18n-js messages and invokes <code>init.main</code> as
   * the callback function.
   *
   * @returns {void}
   */
  init.load = function () {
    if (++this.loaded === Object.keys(this.Dependencies.SCRIPTS).length) {
      wk.dev.i18n.loadMessages(this.Utility.SCRIPT).then(init.main.bind(this));
    }
  };

  /**
   * @description This function is only invoked once the ResourceLoader has
   * successfully loaded the various required <code>mw</code> core modules,
   * executing this callback on completion. This function is responsible for
   * assembling the relevant hook event aliases from the listing of hook names
   * included in <code>init.Dependencies.SCRIPTS</code> that denote the
   * required external dependencies and libraries required by the script.
   *
   * @returns {void}
   */
  init.preload = function () {

    // Declarations
    var i, n, hooks;

    // Definitions
    this.loaded = 0;
    hooks = Object.keys(this.Dependencies.SCRIPTS);

    for (i = 0, n = hooks.length; i < n; i++) {
      mw.hook(hooks[i]).add(init.load.bind(this));
    }
  };

  // Begin loading of external dependencies
  mw.loader.using(init.Dependencies.MODULES).then(init.preload.bind(init));
  wk.importArticles({
    type: "script",
    articles: Object.values(init.Dependencies.SCRIPTS),
  });
});