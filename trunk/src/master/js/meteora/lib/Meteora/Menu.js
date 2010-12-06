/**
 * Menu
 * Menu control
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

var Menu = new Class({
  
  'Implements': [ Control ],

  '__documentMouseMove': function(e) {
    if (Browser.Engine.trident) {
      Meteora.__lastMoveEvent = new Event(e);
    } else {
      Meteora.__lastMoveEvent = e;
    }
  },

  '__documentMouseDown': function(e) {
    e = new Event(e);
    var parent = e.target;
    while (parent) {
      if (parent == this.components.menu) {
        return false;
      }
      parent = parent.parentNode;
    }
    this.__close(this.components.menu);
  },

  '__itemMouseOver': function(e) {
    var e = new Event(e);
    this.__overMouse = e.target;
    while (this.__overMouse) {
      if (this.__overMouse.nodeName && this.__overMouse.nodeName.toLowerCase() == 'li')
        break;
      this.__overMouse = this.__overMouse.parentNode;
    }
  },

  '__itemExpand': function(e) {
    e = new Event(e);
    if (this.__timeOut) {
      window.clearTimeout(this.__timeOut);
    } 
    this.__timeOut = window.setTimeout(function(e) { this.__handleOverItem(e) }.bind(this, e), parseInt(this.options.expansionDelay));
  },

  '__close': function(parent) {
    for (var i = 0; i < parent.childNodes.length; i++) {
      var ul = parent.childNodes[i];
      if (ul.childNodes.length) {
        var isParent = false;
        for (var j = 0; j < ul.childNodes.length; j++) {
          var node = ul.childNodes[j]; 
          if ($type(node) == 'element') {
            if (node.nodeName.toLowerCase() == 'ul') {
              node.hide();
              isParent = true;
            }
          }
        }
        if (isParent) {
          ul.className = 'parent';
        }
      }
    }
  },
  '__handleOverItem': function(e) {

    var e = new Event(Meteora.__lastMoveEvent);

    var hover = e.target;

    while (hover) {
      if (hover.nodeName && hover.nodeName.toLowerCase() == 'li') {
        break;
      }
      hover = hover.parentNode;
    }

    if (this.__overMouse == hover) {
      this.__close(hover.parentNode);
      for (var i = 0; i < hover.childNodes.length; i++) {
        var ul = $(hover.childNodes[i]);
        this.__close(ul);
        ul.show();
        ul.setOnTop();
      }
    }

  },
  
  '__construct': function(items, level) {
    
    if (!level)
      level = new Number(0);
    
    if (typeof items != 'undefined' && items.length) {
      var ul = Widget.ul();
      
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (item) {


          var li = Widget.li(
            null,
            Widget.a(
              {
                'href': item.href || 'javascript:void(0)',
                'onclick': item.onClick || function() {}
              },
              Widget.fromHTML(item.label)
            )
          );
          
          this.__timeOut = null;

          // Where is the mouse?
          this.addListener(
            li,
            'mouseover',
            this.__itemMouseOver
          );

          this.addListener(
            li,
            this.options.expansionEvent,
            this.__itemExpand
          );

          if (item.items) {
            li.insertBefore(Widget.span({'class': 'm-more'}, Widget.fromHTML('&rsaquo;')), li.firstChild);
            li.appendChild(this.__construct(item.items, level + 1));
          }

          ul.appendChild(li);
        }
      }
      
      if (level > 0) {
        $(ul).hide();
      }
      
      return ul;
    }

    return null;
  },
  '__buildComponents': function() {
    this.components = {
      'frame': Widget.div({'class': (this.options.displayMode == 'vertical') ? 'm-menu' : 'm-menu m-menu-hoz'}),
      'menu': this.__construct(this.__menuMap)
    };
    this.__close(this.components.menu);
    this.components.frame.setContent(this.components.menu);
    this.element.appendChild(this.components.frame);
  },
  '__bindEvents': function() {
    this.addListener(
      document,
      'mousedown',
      this.__documentMouseDown
    );
    this.addListener(
      document,
      'mousemove',
      this.__documentMouseMove
    );
    document.addEvent(
      'mousemove',
      function(e) {
      }
    );
  },
  'initialize': function(htmlObj, menuMap, options) {

    this.options = {
      'expansionDelay': 200,
      'expansionEvent': 'mouseover',
      'displayMode':    'vertical'
    }

    this.element = $(htmlObj);
    this.setOptions(options);
    this.__menuMap = menuMap;
    this.__buildComponents();
    this.__bindEvents();
  },
  'close': function() {
    this.components.frame.hide();
  },
  'emerge': function() {
    this.components.frame.show();
  }
});

var ContextMenu = Menu.extend(
  {
    '__documentMouseDown': function(e) {
      e = new Event(e);
      var parent = e.target;
      while (parent) {
        if (parent == this.components.menu) {
          return false;
        }
        parent = parent.parentNode;
      }
      this.close();
    },

    '__documentContextMenu': function(e) {
      e = new Event(e);
      
      e.stop();
      
      var parent = e.target;
      while (parent) {
        if (parent == this.components.menu) {
          return false;
        }
        parent = parent.parentNode;
      }

      this.components.frame.setStyles({
        'position': 'absolute',
        'top':      e.client.y+'px',
        'left':     e.client.x+'px'
      });
      this.__close(this.components.menu);
      this.emerge();
    },
    '__bindEvents': function() {
      this.close();
      this.addListener(
        document,
        'mousedown',
        this.__documentMouseDown
      );
      this.addListener(
        this.element,
        'contextmenu',
        this.__documentContextMenu
      );
    }
  }
);

