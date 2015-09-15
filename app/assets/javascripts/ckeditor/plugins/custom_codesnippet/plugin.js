"use strict";

(function(){
  var COMMAND_NAME = "custom_codesnippet";
  var PLUGIN_NAME  = "custom_codesnippet";
  var WIDGET_NAME  = "custom_codesnippet";
  var DIALOG_NAME  = "custom_codesnippet_dialog";

  var isBrowserSupported = !CKEDITOR.env.ie || CKEDITOR.env.version > 8;
  var DEFAULT_SETTINGS = {
      cls      : '',
      modes    : [
        ['Apache', 'apache'],
        ['Bash', 'bash'],
        ['CoffeeScript', 'coffeescript'],
        ['C++', 'cpp'],
        ['C#', 'cs'],
        ['CSS', 'css'],
        ['Diff', 'diff'],
        ['HTML', 'html'],
        ['Java', 'java'],
        ['JavaScript', 'javascript'],
        ['JSON', 'json'],
        ['Makefile', 'makefile'],
        ['Markdown', 'markdown'],
        ['Nginx', 'nginx'],
        ['Objective-C', 'objectivec'],
        ['Perl', 'perl'],
        ['PHP', 'php'],
        ['Python', 'python'],
        ['Ruby', 'ruby'],
        ['SQL', 'sql'],
        ['VBScript', 'vbscript'],
        ['XHTML', 'xhtml'],
        ['XML', 'xml']
      ],
      theme    : 'textmate',
      tab_size : 2,
      js       : "http://cdn.jsdelivr.net/ace/1.1.4/noconflict/"
  };

  CKEDITOR.plugins.add("custom_codesnippet",{
    requires: "widget,codesnippet",
    icons: 'custom_codesnippet',
    beforeInit: function( editor) {
      editor._.custom_codesnippet = {};

			this.setHighlighter = function( highlighter ) {
				editor._.custom_codesnippet.highlighter = highlighter;

				var langs = editor._.custom_codesnippet.langs =
					editor.config.custom_codesnippet_languages || highlighter.languages;

				editor._.custom_codesnippet.langsRegex = new RegExp( '(?:^|\\s)language-(' +
					CKEDITOR.tools.objectKeys( langs ).join( '|' ) + ')(?:\\s|$)' );
			};

    },
    init: function( editor ) {
      var plugin_path = this.path;
      // 增加按钮
      editor.ui.addButton( "custom_codesnippet", {
        label: "增加代码片段",
        command: COMMAND_NAME,
        toolbar: "insert,10"
      } );
      // 增加 dialog

      editor.settings = CKEDITOR.tools.extend(DEFAULT_SETTINGS, editor.config.custom_codesnippet, true);

      editor.on('instanceReady', function () {
        CKEDITOR.document.appendStyleSheet(plugin_path + "dialogs/style.css");
      });

      register_widget( editor );

      editor.getCommand(COMMAND_NAME).disable();
      CKEDITOR.dialog.add(DIALOG_NAME, plugin_path + 'dialogs/dialog.js');

      var scripts = [
        editor.settings.js + 'ace.js'
      ];

      CKEDITOR.scriptLoader.load(scripts, function () {
        editor.getCommand(COMMAND_NAME).enable();

        CKEDITOR.scriptLoader.load([
          editor.settings.js + "ext-whitespace.js"
        ]);
      });

    },

    afterInit: function( editor ) {
			if ( !editor._.custom_codesnippet.highlighter ) {
        var path = CKEDITOR.plugins.getPath( 'codesnippet' )

				var hljsHighlighter = new CKEDITOR.plugins.codesnippet.highlighter( {
					languages: {
            javascript: 'JavaScript',
						css: 'CSS',
						html: 'HTML',
						java: 'Java',
						php: 'PHP',
						ruby: 'Ruby'
					},

					init: function( callback ) {
						var that = this;

						if ( isBrowserSupported ) {
							CKEDITOR.scriptLoader.load( path + 'lib/highlight/highlight.pack.js', function() {
								that.hljs = window.hljs;
								callback();
							} );
						}

						if ( editor.addContentsCss ) {
							editor.addContentsCss( path + 'lib/highlight/styles/' + editor.config.custom_codesnippet_theme + '.css' );
						}
					},

					highlighter: function( code, language, callback ) {
						var highlighted = this.hljs.highlightAuto( code,
								this.hljs.getLanguage( language ) ? [ language ] : undefined );

						if ( highlighted )
							callback( highlighted.value );
					}
				} );

				this.setHighlighter( hljsHighlighter );
			}
		}


  });


  function register_widget( editor ) {
		var codeClass = editor.config.custom_codesnippet_code_class,
			newLineRegex = /\r?\n/g,
			textarea = new CKEDITOR.dom.element( 'textarea' ),
			lang = "lang";

		editor.widgets.add( 'custom_codesnippet', {
			allowedContent: 'pre; code(language-*)',
			// Actually we need both - pre and code, but ACF does not make it possible
			// to defire required content with "and" operator.
			requiredContent: 'pre',
			styleableElements: 'pre',
			template: '<pre><code class="' + codeClass + '"></code></pre>',
			dialog: DIALOG_NAME,
			pathName: 'pathName',
			mask: true,

			parts: {
				pre: 'pre',
				code: 'code'
			},

			highlight: function() {
				var that = this,
					widgetData = this.data,
					callback = function( formatted ) {
						that.parts.code.setHtml( isBrowserSupported ?
							formatted : formatted.replace( newLineRegex, '<br>' ) );
					};

				callback( CKEDITOR.tools.htmlEncode( widgetData.code ) );

				editor._.custom_codesnippet.highlighter.highlight( widgetData.code, widgetData.lang, function( formatted ) {
					editor.fire( 'lockSnapshot' );
					callback( formatted );
					editor.fire( 'unlockSnapshot' );
				} );
			},

			data: function() {
				var newData = this.data,
					oldData = this.oldData;

				if ( newData.code )
					this.parts.code.setHtml( CKEDITOR.tools.htmlEncode( newData.code ) );

				if ( oldData && newData.lang != oldData.lang )
					this.parts.code.removeClass( 'language-' + oldData.lang );

				if ( newData.lang ) {
					this.parts.code.addClass( 'language-' + newData.lang );

					this.highlight();
				}

				this.oldData = CKEDITOR.tools.copy( newData );
			},

			upcast: function( el, data ) {
				if ( el.name != 'pre' )
					return;

				var childrenArray = getNonEmptyChildren( el ),
					code;

				if ( childrenArray.length != 1 || ( code = childrenArray[ 0 ] ).name != 'code' )
					return;

				// Upcast <code> with text only: http://dev.ckeditor.com/ticket/11926#comment:4
				if ( code.children.length != 1 || code.children[ 0 ].type != CKEDITOR.NODE_TEXT )
					return;

				// Read language-* from <code> class attribute.
				var matchResult = editor._.codesnippet.langsRegex.exec( code.attributes[ 'class' ] );

				if ( matchResult )
					data.lang = matchResult[ 1 ];

				// Use textarea to decode HTML entities (#11926).
				textarea.setHtml( code.getHtml() );
				data.code = textarea.getValue();

				code.addClass( codeClass );

				return el;
			},

			downcast: function( el ) {
				var code = el.getFirst( 'code' );

				code.children.length = 0;

				code.removeClass( codeClass );

				code.add( new CKEDITOR.htmlParser.text( CKEDITOR.tools.htmlEncode( this.data.code ) ) );

				return el;
			}
		} );

		var whitespaceOnlyRegex = /^[\s\n\r]*$/;

		function getNonEmptyChildren( parentElement ) {
			var ret = [],
				preChildrenList = parentElement.children,
				curNode;

			for ( var i = preChildrenList.length - 1; i >= 0; i-- ) {
				curNode = preChildrenList[ i ];

				if ( curNode.type != CKEDITOR.NODE_TEXT || !curNode.value.match( whitespaceOnlyRegex ) )
					ret.push( curNode );
			}

			return ret;
		}
	}


})();

CKEDITOR.config.custom_codesnippet_code_class = 'hljs';
CKEDITOR.config.custom_codesnippet_theme = 'default';
