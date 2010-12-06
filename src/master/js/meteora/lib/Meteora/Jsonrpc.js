/**
 * JSON-RPC
 * ---
 *  Written by José Carlos Nieto Jarquín <xiam@astrata.com.mx>
 *
 * Copyright (c) 2007-2009 Astrata Software S.A. de C.V.
 *
 * Licensed under The MIT License
 * Redistributions of files must retain the above copyright notice.
 *
 * @author          José Carlos Nieto Jarquín
 * @copyright       Copyright (c) 2007-2009, Astrata Software S.A. de C.V.
 * @link            http://astrata.com.mx Astrata Open Source Projects
 * @version         $Revision: $
 * @modifiedby      $LastChangedBy: $
 * @lastmodified    $Date: $
 * @license         http://www.opensource.org/licenses/mit-license.php The MIT License
 *
 */


var Jsonrpc = new Class({
  'rpcExecute': function(line) {
    if ($type(line) == 'array') {
      for (var i = 0; i < line.length; i++) {
        this.rpcExecute(line[i]);
      }
    } else {
      eval(line);
    }
  },

  'rpcInputError': function(data) {
    if ($type(this.handler) == 'element' && this.handler.nodeName.toLowerCase() == 'form') {
      var found = false;
      var el = null;

			if ($type(data) != 'array') {
				data = new Array(data);
			}

      for (var i = 0; i < this.handler.elements.length; i++) {
        
        var input = $(this.handler.elements[i]);

				for (var j = 0; j < data.length; j++) {
					
					var t = data[j];

					if (t.name && input.name == t.name) {
						
						if (!el) {
							var el = input;
						}

						var bubble = new Bubble(input, t.message, {
							'position':   'middle right',
							'showEvent':  'focus',
							'hideEvent':  'blur',
							'width':      350,
							'height':     40
						});

						bubble.red();
						bubble.show();

						found = true;
					}
				}
      }

      if (el) {
        Browser.focusElement(el);
      }

    }
  },

  /**
   * RPC Call 
   * */
  rpcSuccessMessage: function(message) {
    this.__showMessage(message, 'success');
  },
  rpcErrorMessage: function(message) {
    this.__showMessage(message, 'error');
  },
  __showMessage: function(message, className, timeout) {
    var div = Widget.div({'class': 'm-rpc-'+className});
    div.setContent(Widget.span(null, Widget.fromHTML(message)));
    div.setOpacity(0.9);
    div.setOnTop();
    document.body.appendChild(div);
    div.show();
    window.setTimeout(function(){ this.dump() }.bind(div), timeout ? timeout : 5000);
  },
  rpcDeleteObject: function(objectId) {
    $(objectId).remove();
  },
  rpcInjectBefore: function(data) {
    if (this.exists(data.objectId)) {
      $(data.objectId).parentNode.insertBefore(this.evalData(data), $(data.objectId));
    }
  },
  rpcInjectAfter: function(data) {
    if (this.exists(data.objectId)) {
      var parent = $(data.objectId);
      var htFrag = this.evalData(data);
      if (parent.nextSibling) {
        parent.parentNode.insertBefore(htFrag, parent.nextSibling);
      } else {
        parent.parentNode.appendChild(htFrag);
      }
    }
  },
  evalData: function(data) {
    var span = Widget.span();
    if (data.dataSource) {
      data = $extend({'evalScripts': true, 'method': 'get', 'update': span}, data);
      if ($type(data.onComplete)) {
        if ($type(data.onComplete) == 'object') {
          data.onComplete = function() { new JsonRpc(this); }.bind(data.onComplete)
        } else {
          data.onComplete = function() { eval(this+';') }.bind(data.onComplete)
        }
      }
      data.url = data.dataSource;
      new Request.HTML(
        data
      ).send();
    } else {
      span.innerHTML = data.data;
    }
    return span;
  },
  exists: function(objectId) {
    if ($(objectId)) {
      return true; 
    } else {
      log('The specified objectID \''+objectId+'\' do not exists.');
      return false;
    }
  },
  rpcUpdateObject: function(data) {
    if (this.exists(data.objectId)) {
      $(data.objectId).setContent(this.evalData(data));
    }
  },
  rpcHideObject: function(objectId) {
    $(objectId).style.display = 'none';
  },
  rpcShowObject: function(objectId) {
    $(objectId).style.display = '';
  },
  rpcReload: function() {
    window.location.reload();
  },
  rpcRedirectTo: function(url) {
    window.location.href = url;
  },
  rpcAppendTo: function (data) {
    if (this.exists(data.objectId)) {
      $(data.objectId).appendChild(this.evalData(data));
    }
  },
  rpcPrependTo: function (data) {
    if (this.exists(data.objectId)) {
      var parent = $(data.objectId);
      return parent.insertBefore(this.evalData(data), parent.firstChild);
    }
  },
  rpcGoTo: function(aName) {
    Browser.followMark(aName);
  },
  eval: function(code) {
    try {
      code = eval('('+code+')');
      return code;
    } catch(e) {
      debug('JSON-RPC EVAL ERROR', e.message, true);
      return false;
    }
  },

  initialize: function(response, handler) {

    if ($type(response) != 'object') {
      this.response = this.eval(response);
    } else {
      this.response = response;
    }
    if (this.response) {

      this.handler = handler;
      if (handler && handler.nodeName && handler.nodeName.toLowerCase() == 'form') {
        if (!this.response.errorMessage && !this.response.inputError && !this.response.cancelReset) {
          this.handler.reset();
        }
      }

      for (var action in this.response) {
        var argument = this.response[action];
        var action = 'rpc'+action.charAt(0).toUpperCase()+action.substr(1);
        if (handler && handler[action]) {
          handler[action](argument);
        } else if (this[action]) {
          this[action](argument);
        } else {
          log('Action \''+action+'\' not known.');
        }
      }
    }
  }
});

var JsonRpc = Jsonrpc;
