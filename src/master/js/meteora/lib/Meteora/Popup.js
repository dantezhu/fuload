/**
 * Popup
 * Popup handler class
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

var Popup = new Class({
  
  'Implements': [ Control ],
  
  'initialize': function(title, content, options) {

    if ($type(Popup.all) == false) {
      Popup.all = [];
    }

    this.__id = Popup.all.length;
    Popup.all.push(this);

    this.options = {
      'pimp': false,
      'isDraggable': true,
      'top':    20 + Popup.all.length*30,
      'left':   20 + Popup.all.length*30,
      'width':  500,
      'height': 300
    }

    this.scrollY = -1;
    this.scrollX = -1;

    this.setOptions(options);

    this.content = content;

    this.options.title = title;

    this.__buildComponents();
    this.__bindEvents();

    this.moveTo(this.options.top, this.options.left);
    this.resizeTo(this.options.width, this.options.height);

    this.setContent(content);
    this.setTitle(title);

    this.dialog.components.dialog.parent = this;
    this.status = '';

    if (this.options.isDraggable) {
      this.dialog.components.title.setStyle('cursor', 'move');
      this.__draggable = this.dialog.components.dialog.makeDraggable({
        'handle': this.dialog.components.title,
        'onStart': function(el) {
          this.limit = {  
            x: [0, Browser.windowWidth()-el.offsetWidth],
            y: [0, Browser.windowHeight()-el.offsetHeight]
          }
          el.parent.focus();
          if (el.parent.status != '') {
            this.stop();
          }
        }
      });
    }

    this.fireEvent('onStart', this);

    this.focus();
  },
  'hide': function() {
    this.dialog.hide();
    
    this.fireEvent('onHide');
  },
  'show': function() {
    this.dialog.show();

    this.fireEvent('onShow');
  },
  'setContent': function(content) {
    this.components.contentWrapper.setContent(content);
  },
  'setTitle': function(title) {
    this.dialog.setTitle(title);
  },
  'resizeTo': function(width, height) {
    this.dialog.resizeTo(width, height);
    
    this.fireEvent('onResize', this);
  },
  'moveTo': function(top, left) {
    this.dialog.components.dialog.moveTo(top, left);
    
    this.fireEvent('onMove', this);
  },
  'blur': function() {
    if (Popup.focused == this) {
      Popup.focused = null;
    }
    this.dialog.components.dialog.className = this.dialog.components.dialog.className.replace('m-active', '');

    if (this.options.pimp) {
      Effect.fade(this.dialog.components.dialog, { 'startOpacity': 1, 'endOpacity': 0.9 });
    }
    
    this.fireEvent('onBlur', this);
  },
  'focus': function() {

    if (Popup.focused) {
      Popup.focused.blur();
    }
    
    this.dialog.components.dialog.setOnTop();
    this.dialog.components.dialog.className += ' m-active';

    Popup.focused = this;
    
    if (this.options.pimp) {
      Effect.fade(this.dialog.components.dialog, { 'endOpacity': 1, 'startOpacity': 0.9 });
    }
    
    this.fireEvent('onFocus', this);
  },
  'restore': function() {
    if (this.status == 'maximized') {
      if (this.__geom) {
        this.moveTo(this.__geom['y'], this.__geom['x']);
        
        this.dialog.resizeTo(this.__geom['w'], this.__geom['h']);
        
        this.components.buttonMaximize.show();
        this.components.buttonRestore.hide();
      
        document.body.style.overflow = '';
      }
      if (this.__onMaximizeListener) {
        window.removeEvent(
          'resize',
          this.__onMaximizeListener
        );
        this.__onMaximizeListener = null;
      }
    } else if (this.status == 'minimized') {
      this.show();
      this.focus();
    }
    if (this.scrollY > 0) {
      window.scrollTo(this.scrollX, this.scrollY);
      this.scrollY = -1;
    }
    this.fireEvent('onRestore', this);
    this.status = '';
  },
  '__onMaximize': function() {
    var geom = this.__geom;
    this.status = '';
    this.maximize();
    this.__geom = geom;
  },
  'maximize': function() {
    if (this.status == 'maximized')  {
      
      this.restore();

    } else {  
      this.__saveGeometry();
      this.moveTo(0, 0);

      this.dialog.resizeTo(Browser.clientWidth(), Browser.clientHeight());

      this.components.buttonMaximize.hide();
      this.components.buttonRestore.show();
      this.status = 'maximized';

      this.__onMaximizeListener = this.__onMaximize.bind(this);

      window.addEvent(
        'resize',
        this.__onMaximizeListener
      );

      document.body.style.overflow = 'hidden';

      this.scrollY = Browser.pageScrollY();
      this.scrollX = Browser.pageScrollX();

      window.scrollTo(0, 0);
      
      this.fireEvent('onMaximize', this);
    }
  },
  'minimize': function() {
    if (this.status != 'minimized') {
      
      if (this.status == 'maximized') {
        this.restore();
      }

      if (!Popup.dock) {
        Popup.dock = new Dock();
      }

      this.dialog.hide();

      this.status = 'minimized';

      Popup.dock.addItem(
        this.dialog.components.title.innerHTML,
        function() {
          this.restore(); 
        }.bind(this)
      );
    
      this.fireEvent('onMinimize', this);
      
    }
  },
  'close': function() {

    this.blur();

    if (this.status == 'maximized') {
      document.body.style.overflow = '';
    }

    this.dialog.close();

    Popup.all.remove(this);
    
    if (Popup.all.length) {
      Popup.all[Popup.all.length-1].focus();
    }
    
    this.fireEvent('onClose');
  },
  '__bindEvents': function() {

    this.addListener(
      this.dialog.components.dialog,
      'mousedown',
      this.focus
    );

    this.addListener(
      this.components.buttonClose,
      'mouseup',
      this.close
    );

    this.addListener(
      this.components.buttonMaximize,
      'mouseup',
      this.maximize
    );

    this.addListener(
      this.components.buttonRestore,
      'mouseup',
      this.restore
    );

    this.addListener(
      this.components.buttonMinimize,
      'mouseup',
      this.minimize
    );

    this.addListener(
      this.components.resizeCorner,
      'mousedown',
      this.__resize
    );
  },
  '__resizeHandler': function(e) {
    var e = new Event(e);

    var delta = {
      'x': e.page.x - this.__mouseOrig.x,
      'y': e.page.y - this.__mouseOrig.y
    }

    var w = this.__geom.w + delta.x;
    var h = this.__geom.h + delta.y;

    if (w > 100 && h > 100) {
      this.resizeTo(w, h);
    }
  },
  '__resize': function(e) {
    var e = new Event(e);
    if (!this.status) {

      this.__mouseOrig = {
        'x': e.page.x,
        'y': e.page.y
      }
        
      document.onselectstart = function() {
        return false;
      }

      this.__saveGeometry();

      this.__resizeEvent = this.__resizeHandler.bindWithEvent(this);

      document.addEvent(
        'mousemove',
        this.__resizeEvent
      );
        
      this.__resizeClean = function() {
        document.removeEvent(
          'mousemove',
          this.__resizeEvent
        );
        document.removeEvent(
          'mouseup',
          this.__resizeClean
        );
        document.onselectstart = function() {
          return true;
        }
      }.bind(this)

      document.addEvent(
        'mouseup',
        this.__resizeClean
      );
    }
  },
  '__saveGeometry': function() {
    var size = this.dialog.components.dialog.getDimensions();
    this.__geom = {
      'x': this.dialog.components.dialog.getLeft(),
      'y': this.dialog.components.dialog.getTop(),
      'w': size['width'],
      'h': size['height']
    }
  },
  '__buildComponents': function() {
    this.element = Widget.div({'class': 'm-popup'});

    this.components = {
      'buttonClose':    Widget.div({'class': 'm-button m-popup-close'}),
      'buttonMinimize': Widget.div({'class': 'm-button m-popup-minimize'}),
      'buttonMaximize': Widget.div({'class': 'm-button m-popup-maximize'}),
      'buttonRestore':  Widget.div({'class': 'm-button m-popup-restore'}),
      'control':        Widget.div({'class': 'm-control'}),
      'contentWrapper': Widget.div({'class': 'm-content-wrapper'}),
      'resizeCorner':   Widget.div({'class': 'm-resize'})
    }

    this.components.buttonRestore.hide();

    this.components.control.appendChildren([
      this.components.buttonClose,
      this.components.buttonRestore,
      this.components.buttonMaximize,
      this.components.buttonMinimize
    ]);

    this.element.appendChildren([
      this.components.contentWrapper,
      this.components.control,
      this.components.resizeCorner
    ]);

    this.dialog = new Dialog(
      this.element,
      {
        'title': this.options.title,
        'allowClose': false,
        'autoClose': false
      }
    );

    this.dialog.show();
  },

  'center': function() {
    this.dialog.center();
  },
  
  'top': function() {
    this.dialog.top();
  },

  'left': function() {
    this.dialog.left();
  },

  'right': function() {
    this.dialog.right();
  },

  'bottom': function() {
    this.dialog.bottom();
  },

  // deprecated
  'lockScreen': function() { Meteora.overlay(); },

  // deprecated
  'unlockScreen': function() { Meteora.removeOverlay(); }

});
