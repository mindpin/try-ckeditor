"use strict";

(function(){
  var PLUGIN_NAME = "custom_image";

  CKEDITOR.plugins.add(PLUGIN_NAME, {
    icons: 'custom_image',
    init: function( editor ){
      CKEDITOR.dialog.add( PLUGIN_NAME, this.path + 'dialogs/dialog.js' );

      editor.addCommand( PLUGIN_NAME, new CKEDITOR.dialogCommand( PLUGIN_NAME ) );

      editor.ui.addButton( PLUGIN_NAME, {
				label: "增加图片",
				command: PLUGIN_NAME,
				toolbar: 'insert,10'
			} );

    }
  });
})();
