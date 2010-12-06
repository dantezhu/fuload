/**
 * Treeview
 * ---
 * Written by José Carlos Nieto <xiam@astrata.com.mx>
 * Copyright (c) 2007-2009 Astrata Software S.A. de C.V.
 *
 * Licensed under The MIT License
 * Redistributions of files must retain the above copyright notice.
 *
 * @author          José Carlos Nieto
 * @copyright       Copyright (c) 2007-2009, Astrata Software S.A. de C.V.
 * @link            http://astrata.com.mx Astrata Open Source Projects
 * @version         $Revision: $
 * @modifiedby      $LastChangedBy: $
 * @lastmodified    $Date: $
 * @license         http://www.opensource.org/licenses/mit-license.php The MIT License
 *
 */

var Treeview = new Class({
  
  'Implements': [ Control ],

  'build': function(map, level) {
    if ($type(map) == 'string') {
      new Request(
        {
          'url': map,
          'method': 'get',
          'onComplete': function(json) {
            var json = eval('('+json+')');
            this.components.view.dumpChildren();
            this.components.view.appendChild(this.build(json));
          }.bind(this)
        }
      ).send(); 
      return Widget.span();
    } else {
      
      if (!level) {
        var level = 0;
      }

      if (map.length) {
        
        var ul = Widget.ul();
        
        for (var i = 0; i < map.length; i++) {

          var item = map[i];

          var li = Widget.li(
            null,
            Widget.fromHTML(item.label)
          );

          if ($type(item.onSelect) == 'string') {
            eval('item.onSelect = function(){ '+item.onSelect+'; };');
          }

          li.addEvent(
            'select',
            item.onSelect || function() {}
          );
          
          li._label = item.label; 
          
          if (item.items) {
            if ($type(item.items) == 'string') {
              li._items = item.items;
            } else {
              li._children = this.build(item.items, level + 1);
              li.appendChild(li._children);
            }
            li.className = 'm-collapsed';
          }
          ul.appendChild(li);
        }
        if (level > 0) {
          ul.hide();
        } else {
          ul.className = 'm-treeview';
        }
        return ul;
      }
      return null;
    }
  },
  
  'expandFirst': function(node) {
    this.expand(node);
    if (node._children) {
      var node = node._children.firstChild;
      this.expandFirst(node);
    }
  },

  'expandLast': function(node) {
    this.expand(node);
    if (node._children) {
      var node = node._children.childNodes[node._children.childNodes.length - 1];
      this.expandLast(node);
    }
  },



  '__mousedownEvent': function(e) {
    this.__hasFocus = false;
  },


  '__keydownEvent': function(e) {

    var e = new Event(e);

    var sel = this.getSelected();

    if (sel && this.isFocused()) {
      if (e.key == 'up') {

        var prev = sel.previousElement();
        if (prev) {
          this.expandLast(prev);
        } else {

          var parent = sel.parentNode;
          while (parent) {
            if ((parent._items || parent._children) && parent.previousElement()) {
              var parent = parent.previousElement();
              var curr = null;
              if (!parent._children && parent._items) {
                var curr = sel;
              }
              this.expandLast(parent);
              if (curr) {
                this.select(curr);
              }
              break;
            }
            parent = parent.parentNode;
          }
        }

        e.stop();    

      } else if (e.key == 'down') {

        var next = sel.nextElement();

        if (next) {
          this.expandFirst(next);
        } else {
          var parent = sel.parentNode;
          while (parent) {
            if ((parent._items || parent._children) && parent.nextElement()) {
              var parent = parent.nextElement();
              var curr = null;
              if (!parent._children && parent._items) {
                var curr = sel;
              }
              this.expandFirst(parent);
              if (curr) {
                this.select(curr);
              }
              break;
            }
            parent = parent.parentNode;
          }
        }

        e.stop();    
      }
    }

  },

  'expand': function(el) {
    if (el._items) {
      el.parent = this;
      new Request(
        {
          'url': el._items,
          'method': 'get',
          'onComplete': this.__populate.bind(el)
        }
      ).send();
      el.className = 'm-expanded';
    } else {
      if (el._children) {
        el._children.show();
        el.className = 'm-expanded';
      } else {
        this.select(el);
      }
    }
  },

  'collapse': function(el) {
    if (el.className == 'm-expanded') {
      el._children.hide();
      el.className = 'm-collapsed';
      for (var i = 0; i < el._children.childNodes.length; i++) {
        var node = el._children.childNodes[i];
        this.collapse(node);
      }
    }
  },

  'getSelected': function() {
    return $pick(this.__selected, null);
  },

  'select': function(el) {

    var el = $(el);

    if (this.__selected) {
      this.__selected.className = '';
    }

    el.fireEvent('select');
    
    el.className = 'm-selected';
    
    this.__selected = el;

    Browser.focusElement(el);
  },

  '__populate': function(json) {
    var json = eval('('+json+')');
    if (this._children) {
      if ($(this).dumpChild) {
        $(this).dumpChild(this._children);
      }
    }
    this._children = this.parent.build(json);
    this.appendChild(this._children);
  },

  'isFocused': function() {
    return this.__hasFocus;
  },

  '__expand': function(e) { 

    var e = new Event(e);
    var el = $(e.target);

    el = el.findParentWithName('li');

    if (el) {
    
      this.__hasFocus = true;

      e.stop();
      e.preventDefault();

      if (el.className == 'm-expanded') {
        this.collapse(el);
      } else {
        this.expand(el);
      }
    }
  },

  
  '__buildComponents': function() {

    this.components = {
      'frame':  Widget.div({'class': 'm-treeview-frame'}),
      'view':   this.build(this.__map)
    };

    this.components.frame.setContent(this.components.view);

    this.element.appendChild(this.components.frame);

    if (this.options.selected) {
      this.open(this.options.selected);
    }
  },

  'open': function(route) {
    if (route) {
      var pointer = this.components.view;
      while (route.length) {
        var temp = null;
        var current = route.shift();
        if (pointer && pointer.childNodes && pointer.childNodes.length) {
          for (var i = 0; i < pointer.childNodes.length; i++) {
            var node = pointer.childNodes[i];
            if ($type(node) == 'element' && node.nodeName.toLowerCase() == 'li') {
              this.collapse(node);
              if (node._label == current) {
                temp = node._children;
                this.expand(node);
              }
            }
          }
        }
        if (temp) {
          pointer = temp;
        }
      }
    }
  },

  '__bindEvents': function() {
    this.addListener(
      this.components.frame,
      this.options.expansionEvent,
      this.__expand
    );
    this.addListener(
      window,
      'mousedown',
      this.__mousedownEvent
    );
    this.addListener(
      document.body,
      'keydown',
      this.__keydownEvent
    );
  },

  'initialize': function(el, map, options) {

    this.options = {
      'expansionEvent': 'mousedown'
    }

    this.element = $(el);

    this.setOptions(options);
    
    this.__map = map;
    this.__buildComponents();
    this.__bindEvents();
  }
});

