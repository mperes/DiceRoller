/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * DS208: Avoid top-level this
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
this.Trigger = (function() {

  const mouseover = function(element, options) {
    const $element = $(element);
    const event = createMouseEvent('mouseover', options);
    return dispatch($element, event);
  };

  const mouseenter = function(element, options) {
    const $element = $(element);
    const event = createMouseEvent('mouseenter', options);
    return dispatch($element, event);
  };

  const mousedown = function(element, options) {
    const $element = $(element);
    const event = createMouseEvent('mousedown', options);
    return dispatch($element, event);
  };

  const mouseout = function(element, options) {
    const $element = $(element);
    const event = createMouseEvent('mouseout', options);
    return dispatch($element, event);
  };

  const mouseleave = function(element, options) {
    const $element = $(element);
    const event = createMouseEvent('mouseleave', options);
    return dispatch($element, event);
  };

  const mouseup = function(element, options) {
    const $element = $(element);
    const event = createMouseEvent('mouseup', options);
    return dispatch($element, event);
  };

  const click = function(element, options) {
    const $element = $(element);
    const event = createMouseEvent('click', options);
    return dispatch($element, event);
  };

  const focus = function(element, options) {
    const $element = $(element);
    return $element.focus();
  };

  const clickSequence = function(element, options) {
    const $element = $(element);
    mouseover($element, options);
    mousedown($element, options);
    focus($element, options);
    mouseup($element, options);
    return click($element, options);
  };

  const hoverSequence = function(element, options) {
    const $element = $(element);
    mouseover($element, options);
    return mouseenter($element, options);
  };

  const unhoverSequence = function(element, options) {
    const $element = $(element);
    mouseout($element, options);
    return mouseleave($element, options);
  };

  var dispatch = ($element, event) =>
    $element.each(function() {
      return this.dispatchEvent(event);
    })
  ;

  // Can't use the new MouseEvent constructor in IE11 because computer.
  // http://www.codeproject.com/Tips/893254/JavaScript-Triggering-Event-Manually-in-Internet-E
  var createMouseEvent = function(type, options) {
    if (options == null) { options = {}; }
    const defaults = {
      view: window,
      cancelable: true,
      bubbles: true,
      detail: 0,
      screenX: 0,
      screenY: 0,
      clientX: 0,
      clientY: 0,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      button: 0,
      relatedTarget: null
    };
    options = Object.assign({}, defaults, options);
    const event = document.createEvent('MouseEvent');
    event.initMouseEvent(type,
      options.bubbles,
      options.cancelable,
      options.view,
      options.detail,
      options.screenX,
      options.screenY,
      options.clientX,
      options.clientY,
      options.ctrlKey,
      options.altKey,
      options.shiftKey,
      options.metaKey,
      options.button,
      options.relatedTarget
    );
    return event;
  };

  return {
    mouseover,
    mouseenter,
    mousedown,
    mouseup,
    mouseout,
    mouseleave,
    click,
    clickSequence,
    hoverSequence,
    unhoverSequence,
    createMouseEvent
  };

})();
