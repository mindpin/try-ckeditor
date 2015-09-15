CKEDITOR.dialog.add("custom_codesnippet_dialog", function (editor) {
    "use strict";
    var tab_sizes = ["1", "2", "4", "8"];

    var dialog;

    var aceEditor, aceSession, whitespace;

    var editorPanel = {
        id       : 'editor',
        label    : "代码片段",
        elements : [
            {
                type     : 'hbox',
                children : [
                    {
                        type      : 'select',
                        id        : 'code-select',
                        className : 'cke_pbckcode_form',
                        label     : '语言',
                        items     : editor.settings.modes,
                        'default' : editor.settings.modes[0][1],
                        setup     : function ( widget ) {
                          if ( widget.ready && widget.data.lang ){
                            this.setValue( widget.data.lang );
                          }

          								if ( CKEDITOR.env.gecko && ( !widget.data.lang || !widget.ready ) ){
                            this.getInputElement().$.selectedIndex = -1;
                          }
                        },
                        commit    : function ( widget ) {
                          widget.setData( 'lang', this.getValue() );
                        },
                        onChange  : function () {
                          aceSession.setMode("ace/mode/" + this.getValue());
                        }
                    },
                ]
            },
            {
                type      : 'html',
                html      : '<div></div>',
                id        : 'code-textarea',
                className : 'cke_pbckcode_ace',
                style     : 'position: absolute; top: 80px; left: 10px; right: 10px; bottom: 50px;',
                setup     : function ( widget ) {
                  var code = widget.data.code;
                  if(!code){
                    return;
                  }

                  code = code.replace(new RegExp('<br/>', 'g'), '\n')
                      .replace(new RegExp('<br>', 'g'), '\n')
                      .replace(new RegExp('&lt;', 'g'), '<')
                      .replace(new RegExp('&gt;', 'g'), '>')
                      .replace(new RegExp('&amp;', 'g'), '&')
                      .replace(new RegExp('&nbsp;', 'g'), ' ');

                  aceEditor.setValue(code);
                },
                commit    : function ( widget ) {
                  widget.setData( 'code', aceEditor.getValue() );
                }
            }
        ]
    };

    return {
        title     : "代码片段",
        minWidth  : 600,
        minHeight : 400,
        contents  : [
          editorPanel
        ],
        onLoad    : function () {
          dialog = this;
          this.on('cancel', function(evt) {
            return false;
          }, this, null, -1);

          aceEditor = ace.edit(dialog.getContentElement('editor', 'code-textarea')
              .getElement().getId());

          editor.aceEditor = aceEditor;

          aceEditor.setTheme("ace/theme/" + editor.settings.theme);
          aceEditor.setHighlightActiveLine(true);

          aceSession = aceEditor.getSession();
          aceSession.setMode("ace/mode/" + editor.settings.modes[0][1]);
          aceSession.setTabSize(editor.settings.tab_size);
          aceSession.setUseSoftTabs(true);

          whitespace = ace.require('ace/ext/whitespace');
        },
        onShow    : function () {
          aceEditor.focus();
        }
    };
});

CKEDITOR.dialog.on('resize', function (evt) {
    var AceEditor = evt.editor.aceEditor;
    if (AceEditor !== undefined) {
        AceEditor.resize();
    }
});
