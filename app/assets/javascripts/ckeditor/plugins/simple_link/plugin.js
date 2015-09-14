'use strict';
(
  function(){
    var validUrlRegex = /^(https?|ftp):\/\/(-\.)?([^\s\/?\.#-]+\.?)+(\/[^\s]*)?[^\s\.,]$/ig,
  		doubleQuoteRegex = /"/g;

    function get_select_a_element (editor){
      var selection = editor.getSelection();
      var selector = selection.getStartElement()

      if(selector) {
         return selector.getAscendant( 'a', true );
      }else{
        return null;
      }
    }

    function get_select_text (editor){
      var selection = editor.getSelection();
      return selection.getSelectedText();
    }

    CKEDITOR.plugins.add( 'simple_link', {
      requires: 'clipboard',
      icons: 'simple_link',
      init: function( editor ) {
        //
        editor.addCommand( 'simple_link', {
          exec: function(editor){
            var a = get_select_a_element(editor);
            if(!a){
              editor.execCommand('add_simple_link');
            }else{
              editor.execCommand('cancel_simple_link');
            }
          }
        });

        editor.addCommand( 'cancel_simple_link', {
          exec: function(editor){
            var a = get_select_a_element(editor);
            if(!a){ return }
            var text = jQuery(a.$).text();
            a.remove();
            editor.auth_convert_url = false;
            editor.insertText( text );
            editor.auth_convert_url = true;
          }
        });
        editor.addCommand( 'add_simple_link', new CKEDITOR.dialogCommand( 'simple_link_dialog' ) );
        //
        editor.ui.addButton( 'simple_link', {
            label: '插入/删除链接',
            command: 'simple_link',
            toolbar: 'links,0'
        });

        CKEDITOR.dialog.add("simple_link_dialog", function(editor) {
        	return {
        		allowedContent: "a[href,target]",
        		title: "插入链接",
        		minWidth: 550,
        		minHeight: 100,
        		resizable: CKEDITOR.DIALOG_RESIZE_NONE,
        		contents:[
              {
          			id: "simple-link",
          			label: "simple-link",
          			elements:[
                  {
            				type: "text",
            				label: "请输入链接（如：http://www.4ye.me）",
            				id: "simple-link-url",
                    className: "simple-link-url",
                    setup: function( element ) {
                      element.url_input_ele = this;
                    },
                    validate: function() {
                      var href = this.getValue();
                      href = href.replace(/(^\s*)|(\s*$)/g,'');

                      var dialog = this.getDialog();
                      var url_tab = dialog.getContentElement('simple-link','simple-link-url').getElement();
                      var error_info = url_tab.findOne("div.error-info");

                      if(validUrlRegex.test(href)) {
                        if(error_info){
                          jQuery(error_info.$).addClass("hide");
                        }
                        return true;
                      }

                      var error_message;
                      if(href == ""){
                        error_message = "不能为空";
                      }else{
                        error_message = "请输入一个正确的链接";
                      }

                      if(!error_info){
                        error_info = new CKEDITOR.dom.element('div');
                        error_info.addClass("error-info");
                        error_info.appendText(error_message);
                        error_info.appendTo(url_tab);
                      }else{
                        jQuery(error_info.$).removeClass("hide");
                        jQuery(error_info.$).text(error_message);
                      }

                      return false;
                    }
        			    },

                  {
            				type: "text",
            				label: "请输入链接标题",
                    id: "simple-link-title",
                    className: "simple-link-title",
                    setup: function( element ) {
                      element.title_input_ele = this;
                    }
            			}
                ]
        		  }
            ],
        		onShow: function() {
              this.on('cancel', function(evt) {
                return false;
              }, this, null, -1);

              var element = get_select_a_element(editor);

        			if ( !element || element.getName() != 'a' ) {
                this.insertMode = true;

        				element = editor.document.createElement( 'a' );
        				element.setAttribute("target","_blank");
        				element.setText(get_select_text(editor));
        			} else {
        				this.insertMode = false;
        			}

        			this.element = element;
        			this.setupContent(this.element);

              element.title_input_ele.setValue( element.getText() );

              var href = element.getAttribute("href");
              if(href) {
                if(!validUrlRegex.test(href)) {
                  href = "http://" + href;
                }
                element.url_input_ele.setValue(href);
              }

        		},
        		onOk: function() {
              var a_element = this.element;
              this.commitContent(a_element);

            	var title = a_element.title_input_ele.getValue();
              var href  = a_element.url_input_ele.getValue();

              title = title.replace(/(^\s*)|(\s*$)/g,'');

              if(title == ""){
                title = href
              }

    	        a_element.setText(title);
              a_element.setAttribute("href", href);

        			if(this.insertMode) {
        				editor.insertElement(a_element);
        			}

        		}
        	};
        });

        editor.auth_convert_url = true
        editor.on( 'paste', function( evt ) {
          if(!editor.auth_convert_url){
            return;
          }

  				var data = evt.data.dataValue;

  				if ( evt.data.dataTransfer.getTransferType( editor ) == CKEDITOR.DATA_TRANSFER_INTERNAL ) {
  					return;
  				}

  				// If we found "<" it means that most likely there's some tag and we don't want to touch it.
  				if ( data.indexOf( '<a>' ) > -1 ) {
  					return;
  				}

  				// #13419
  				data = data.replace( validUrlRegex , '<a href="' + data.replace( doubleQuoteRegex, '%22' ) + '">$&</a>' );

  				// If link was discovered, change the type to 'html'. This is important e.g. when pasting plain text in Chrome
  				// where real type is correctly recognized.
  				if ( data != evt.data.dataValue ) {
  					evt.data.type = 'html';
  				}

  				evt.data.dataValue = data;
  			} );


      }
    });

  }
)();
