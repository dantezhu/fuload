/**
 * Bubble
 * ---
 * Written by José Carlos Nieto <xiam@astrata.com.mx>
 *
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

var Bubble = new Class({

  'Implements': [ Control ],

  '__buildComponents': function(content) {
    
    this.content = content;

    this.components = {
      'bubble':     Widget.div({'class': 'm-bubble'}),
      'linkTop':    Widget.div({'class': 'm-bubble-link-top'}),
      'linkLeft':   Widget.div({'class': 'm-bubble-link-left'}),
      'linkRight':  Widget.div({'class': 'm-bubble-link-right'}),
      'linkBottom': Widget.div({'class': 'm-bubble-link-bottom'}),
      'content':    Widget.div({'class': 'm-bubble-content'})
    }

    this.components.links = [
      this.components.linkTop,
      this.components.linkLeft,
      this.components.linkRight,
      this.components.linkBottom
    ];

    for (var i = 0; i < 4; i++) {
      this.components.links[i].setStyle('visibility', 'hidden');
    }

    this.components.bubble.appendChildren([
      this.components.linkTop,
      this.components.linkLeft,
      this.components.linkRight,
      this.components.linkBottom,
      this.components.content
    ]);

    this.components.content.setContent(this.content);

    this.__loaded = false;

    this.resizeTo(this.options.width, this.options.height);
  },

  'resizeTo': function(w, h) {
    this.components.bubble.setStyles({
      'width':  w+'px',
      'height': h+'px'
    });
  },

  'show': function() {

    if (!this.__loaded) {
      this.components.content.setContent(this.content);
      this.resizeTo(this.options.width, this.options.height);
      this.__loaded = true;
    }

    var coord = $(this.element).getCoordinates();
    
    var bubble = this.components.bubble;

    var link = this.components.links;
    
    $(bubble).setOnTop();

    bubble.setStyle('visibility', 'hidden');

    bubble.show();
    
    if (bubble.parentNode != document.body) {
      bubble.setStyles({
        'position': 'absolute',
        'top':      '-1500px'
      });
      document.body.appendChild(bubble);
    }

    this.reposition();
  },

  'reposition': function() {

    var coord = this.element.getCoordinates();

    var pos = {'top': 0, 'left': 0};

    var width   = this.components.bubble.offsetWidth;
    var height  = this.components.bubble.offsetHeight;
    
    var topBound    = (Browser.pageScrollY());
    var leftBound   = (Browser.pageScrollX());
    var bottomBound = (Browser.pageScrollY() + Browser.clientHeight()); 
    var rightBound  = (Browser.pageScrollX() + Browser.clientWidth());

    var x = coord.left +  (coord.width / 2);
    var y = coord.top +   (coord.height / 2);

    if ((coord.top - topBound) > (bottomBound - coord.bottom)) {
      var spany = 'top';
      var disty = coord.top - topBound;
    } else {
      var spany = 'bottom';
      var disty = bottomBound - coord.bottom;
    }
    if ((coord.left - leftBound) > (rightBound - coord.right)) {
      var spanx = 'left';
      var distx = coord.left - leftBound;
    } else {
      var spanx = 'right';
      var distx = rightBound - coord.right;
    }
    
    var offsetx = 0;
    var offsety = 0;

    switch (spany+'_'+spanx) {
      case 'top_left':
        if (distx > disty) {
          offsety = 0;
          offsetx = width * -1 -15;
        } else {
          offsety = height * -1 - 15;
          offsetx = (width - coord.width)/-1;
        }
      break;
      case 'top_right':
        if (distx > disty) {
          offsety = 0;
          offsetx = 15;
        } else {
          offsety = height * -1 - 15;
          offsetx = coord.width * -1;
        }
      break;
      case 'bottom_left':
        if (distx > disty) {
          offsety = height * -1;
          offsetx = width * -1 - 15;
        } else {
          offsety = 15;
          offsetx = (width - coord.width)*-1;
        }
      break;
      case 'bottom_right':
        if (distx > disty) {
          offsety = height * -1;
          offsetx = 15;
        } else {
          offsety = 15;
          offsetx = coord.width * -1;
        }
      break;
    }

    pos.top   = coord[spany] + offsety;
    pos.left  = coord[spanx] + offsetx;
    
    if (pos.left+width > rightBound) {
      pos.left = rightBound - width;
    }
    
    if (pos.top+height > bottomBound) {
      pos.top = bottomBound - height;
    }

    if (pos.top < topBound) {
      pos.top = topBound;
    }
    
    if (pos.left < leftBound) {
      pos.left = leftBound;
    }

    // showing link
    var min = new Number(-1);
    for (var i = 0; i < 4; i++) {
      var link = this.components.links[i];
      
      if (i == 0 || i == 3) {
        var test = x - pos.left;
        if (test >= 15 && test <= width - 15) {
          link.setStyle('left', test+'px');
        } else {
          if (test < 15) {
            link.setStyle('left', '0px');
          } else {
            link.setStyle('left', (width - 20) + 'px');
          }
        }
      } else {
        var test = y - pos.top;
        if (test >= 30 && test <= height - 15) {
          link.setStyle('top', test+'px');
        } else {
          if (test < 15) {
            link.setStyle('top', '0px');
          } else {
            link.setStyle('top', (height - 20) + 'px');
          }
        }
      }

      var abs = x - pos.left - link.offsetLeft;
      var ord = y - pos.top - link.offsetTop;
      
      link.dist = Math.pow(abs, 2) + Math.pow(ord, 2);
     
      if (min < 0 || link.dist < this.components.links[min].dist) {
        min = i;
      }
    }

    if (this.components.links[min] != this.__link) {
      if (this.__link) {
        this.__link.setStyle('visibility', 'hidden');
      }
      this.__link = this.components.links[min];
      this.__link.setStyle('visibility', 'visible');
    }

    if (this.components.bubble.offsetLeft != pos.left || this.components.bubble.offsetTop != pos.top) {
      this.components.bubble.setStyles({
        'top':    pos.top+'px',
        'left':   pos.left+'px'
      });
    }

    this.components.bubble.setStyle('visibility', 'visible');
  },

  'hide': function(e) {
    if (e) {
      var parent = e.target;
      while (parent) {
        if (parent == this.components.bubble || parent == this.element) {
          return true;
        }
        parent = parent.parentNode;
      }
    }
    this.components.bubble.hide();
  },

  '__bindEvents': function() {

    this.addListener(
      this.element,
      this.options.showEvent,
      this.delay.bind(this, [ this.show, this.options.showDelay ])
    );

    this.addListener(
      this.element,
      this.options.destroyEvent,
      this.destroy
    );

    this.addListener(
      this.element,
      this.options.hideEvent,
      this.delay.bind(this, [ this.hide, this.options.hideDelay ])
    );


    this.addListener(
      this.components.bubble,
      'mousemove',
      this.delay.bind(this, [ this.show, 0 ])
    );
    
    this.addListener(
      this.components.bubble,
      'mouseleave',
      this.delay.bind(this, [ this.hide, this.options.hideDelay ])
    );

    this.addListener(
      window,
      'resize',
      this.reposition
    );

    this.addListener(
      document,
      'mousedown',
      this.hide
    );
  },
  'delay': function(callback, time) {
    if (this.timer) {
      window.clearTimeout(this.timer);
    }
    this.timer = window.setTimeout(callback.bind(this), time);
  },
  'red': function() {
    this.components.bubble.className = 'm-bubble m-red';
  },
  'blue': function() {
    this.components.bubble.className = 'm-bubble m-blue';
  },
  'yellow': function() {
    this.components.bubble.className = 'm-bubble m-yellow';
  },
  'initialize': function(el, content, options) {

    this.options = {
      'showEvent':    'mouseover',
      'hideEvent':    'mouseleave',
      'destroyEvent': 'dbclick',
      'showDelay':    200,
      'hideDelay':    900,
      'width':        250,
      'height':       30
    }

    this.element = $(el);

    /*
    if (el.bubble) {
      // TODO: solve this kind of conflicts
      el.bubble.close();
    }
    */

    this.setOptions(options);

    this.__buildComponents(content);
    this.__bindEvents();
  }
});

