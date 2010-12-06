/**
 * Filebrowser
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

var Filebrowser = new Class({
  
  'Implements': [ Control ],

  '__fileInfoMouseUp': function(e) {
    e = new Event(e);
    var div = e.target;
    while (div) {
      if (div.className == 'm-fileinfo') {
        log(div.file);
      }
      div = div.parentNode;
    }
  },
  
  '__fileViewMouseUp': function(e) {
    e = new Event(e);
    var li = e.target;
    while (li) {
      if (li.className == 'm-file') {
        this.__clickFile(li.file);
      }
      li = li.parentNode;
    }
  },

  '__buttonForwardMouseDown': function() {
    if (this.history.forward.length) {
      var p = this.history.forward.pop();
      this.browse(p);
    }
  },

  '__buttonBackMouseDown': function() {
    if (this.history.back.length > 1) {
      var p = this.history.back.pop();
      this.history.forward.push(p);
      var p = this.history.back.pop();
      this.browse(p);
    }
  },

  '__buttonReloadMouseDown': function() {
    this.browse(this.__path);
  },

  '__buttonUpMouseDown': function() {
    var path = this.__path.replace(/\/+$/, '').split('/');
    path.pop();
    path = path.join('/');
    this.browse(path ? path : this.__initialPath);
  },

  '__buttonHomeMouseDown': function() {
    this.browse(this.__home);
  },

  '__addressKeydown': function(e) {
    e = new Event(e); 
    if (e.key == 'enter') {
      this.browse(this.components.address.value); 
    }
  },

  '__imageExtension': '.png',

  'getIcon': function(icon) {
    return $meteora['mediaDir']+'/filebrowser/'+icon+this.__imageExtension;
  },

  '__buildComponents': function() {

    this.components = {
      'navigation': Widget.div({'class': 'm-navigation'}),
      'buttons': {
        'back': Widget.img({
          'class': 'm-button',
          'src': this.getIcon('back')
        }),
        'forward': Widget.img({
          'class': 'm-button',
          'src': this.getIcon('forward')
        }),
        'reload': Widget.img({
          'class': 'm-button',
          'src': this.getIcon('reload')
        }),
        'home': Widget.img({
          'class': 'm-button',
          'src': this.getIcon('home')
        }),
        'up': Widget.img({
          'class': 'm-button',
          'src': this.getIcon('up')
        })
      },
      'filebrowser': Widget.div({'class': 'm-filebrowser'}),
      'address': Widget.input({'class': 'm-form-input'}),
      'frame': Widget.div({'class': 'm-frame'}),
      'fileview': Widget.ul({'class': 'm-fileview'}),
      'fileinfo': Widget.div({'class': 'm-fileinfo'})
    };

    $(this.components.navigation).appendChildren([
      this.components.buttons.back,
      this.components.buttons.forward,
      this.components.buttons.reload,
      this.components.buttons.home,
      this.components.buttons.up
    ]);

    $(this.components.filebrowser).appendChildren([
      this.components.navigation,
      this.components.address,
      this.components.frame
    ]);

    $(this.components.frame).appendChildren([
      this.components.fileinfo,
      this.components.fileview
    ]);

    this.element.appendChild(this.components.filebrowser);
  },

  'refresh': function() {
    this.browse(this.__path);
  },

  '__bindEvents': function() {

    this.addListener(
      this.components.address,
      'keydown',
      this.__addressKeydown
    );

    this.addListener(
      this.components.buttons.home,
      'mousedown',
      this.__buttonHomeMouseDown
    );

    this.addListener(
      this.components.buttons.up,
      'mousedown',
      this.__buttonUpMouseDown
    );

    this.addListener(
      this.components.buttons.reload,
      'mousedown',
      this.__buttonReloadMouseDown
    );

    this.addListener(
      this.components.buttons.back,
      'mousedown',
      this.__buttonBackMouseDown
    );

    this.addListener(
      this.components.buttons.forward,
      'mousedown',
      this.__buttonForwardMouseDown
    );

    this.addListener(
      this.components.fileview,
      'mouseup',
      this.__fileViewMouseUp
      
    );

    this.addListener(
      this.components.fileinfo,
      'mouseup',
      this.__fileInfoMouseUp
    );
  },

  'browse': function(path) {
    this.components.fileinfo.dumpChildren();

    new Request(
      {
        'url':        this.url,
        'method':     'get',
        'data':       'path='+path,
        'onComplete': this.__handleAjaxDirectory.bindWithEvent(this)
      }
    ).send();
  },

  '__clickFile': function(file) {
    var path = this.__path.replace(/\/+$/, '') + '/' + file.name;
    this.browse(path);
  },

  '__addFile': function(file) {
    var li = Widget.li({'class': 'm-file'});
    li.setContent(file.html ? file.html : file.name);
    li.file = file;
    this.components.fileview.appendChild(li);
  },

  '__handleAjaxDirectory': function (json) {

    var json = this.fromJSON(json);

    if (json.path) {

      this.components.address.value = json.path;

      if ($type(json.files)) {

        this.__path = json.path;
        if (!this.__home) {
          this.__home = json.path;
        }
        // history
        if (this.history.back.length) {
          var p = this.history.back.pop();
          if (p != json.path)
            this.history.back.push(p);
        }
        this.history.back.push(json.path);

        // adding files
        this.components.fileview.dumpChildren();
        for (var i = 0; i < json.files.length; i++) {
          this.__addFile(json['files'][i]);
        }
      } 
      this.components.fileinfo.file = json.info;
      $(this.components.fileinfo).dumpChildren();
      this.components.fileinfo.innerHTML = json.info.html;
    }
  },

  'initialize': function(container, json_url, options) {
    
    this.element = $(container);
    this.url = json_url;

    this.__home = null;

    this.history = {
      back: [],
      forward: []
    };

    this.__buildComponents();
    this.__bindEvents();

    this.options = {
      path: '/'
    }

    this.setOptions(options);

    this.__initialPath = this.options.path;

    this.browse(this.__initialPath);
  }
});

