"use strict";

(function(){
  function create_img_ele(image_url){
    var input = dialog.getContentElement("link","url")
    var image_ele = editor.document.createElement( 'img' );
    dialog.image_ele = image_ele;

    image_ele.setAttribute( 'src', image_url );
    return image_ele;
  }


  function FileProgress(qiniu_uploading_file, uploader){
    this.file     = qiniu_uploading_file
    this.uploader = uploader

    window.afile = this.file
    this.ready()
  }

  FileProgress.prototype.ready = function(){
    console.log('！ready')

    this.$dom = jQuery('.upload_panel .uploading-images .template-image')
      .clone().show()
      .removeClass('template-image').addClass('image')
      .appendTo(jQuery('.upload_panel .uploading-images'))

    var reader = new FileReader()
    reader.readAsDataURL(this.file.getNative())
    var that = this
    reader.onload = function(e){
      that.$dom.find('.ibox').css({'background-image': "url(" + e.target.result + ")"})
    }
  }

  FileProgress.prototype.update = function(){
    var that = this
    this.$dom.find('.bar')
      .stop()
      .animate(
        {
          'width': 100 - that.file.percent + "%"
        },
        {
          step: function(num){
            var text = that.$dom.find('.txt .p').text()
            var percent = 100 - Math.ceil(num)
            if(percent > text){
              that.$dom.find('.txt .p').text(percent)
            }
          }
        }
      );
  }

  FileProgress.prototype.success = function(info){
    this.$dom.addClass('done').data('url', info.url)
    document.getElementById(dialog.getContentElement("upload_tab","submit_upload").domId).style.display='inline'
    create_img_ele(info.url);
  }

  FileProgress.prototype.error = function(){
    console.log('！error');
  }

  FileProgress.alldone = function(){
    console.log('！alldone');
  }

  var PLUGIN_NAME = "custom_image";
  var dialog;
  var editor;

  CKEDITOR.dialog.add( PLUGIN_NAME, function( _editor ) {
    editor = _editor;
    var upload_html = '<div class=".upload">' +
      "<div class='desc'>点击“浏览”，在您电脑中选择要上传的图片，每张图片上传完毕后将会自动添加到正文中</div>" +
    '</div>'

    var template_image_div = '' +
    '<div class="template-image" style="display:none;">' +
      '<div class="ibox" style="background-image:;"></div>' +
      '<div class="percent">' +
        '<div class="bar" style="width:100%"></div>' +
        '<div class="txt">' +
          '<span class="p">0</span>' +
          '<span>%</span>' +
        '</div>' +
        '<div class="done">' +
          '<span class="glyphicon glyphicon-ok"></span>' +
        '</div>' +
        '<div class="err">' +
          '<i class="fa fa-warning"></i>' +
        '</div>' +
      '</div>' +
      '<div class="cancel">' +
        '<span class="glyphicon glyphicon-remove"></span>' +
      '</div>' +
    '</div>'

    var upload_panel = '' +
      '<div class="upload_panel">' +
        '<div class="uploading-images">' +
          template_image_div +
        '</div>' +
      '</div>'

    return {
      title: "上传图片",
      minWidth: 420,
      minHeight: 360,
      contents: [
        {
          id: 'upload_tab',
          label: "我的电脑",
          elements: [
            {
              type: 'html',
              html: upload_html
            },
            {
              className: 'upload_btn',
              type: 'button',
              label: "浏览"
            },
            {
              type: 'html',
              html: upload_panel
            },
            {
              id: 'submit_upload',
              className: 'submit_upload',
              type: 'button',
              label: "增加",
              onClick: function(){
                editor.insertElement( dialog.image_ele );
                dialog.hide();
                jQuery('.upload_panel .uploading-images .image').remove()
                document.getElementById(dialog.getContentElement("upload_tab","submit_upload").domId).style.display='none'
              }
            }
          ]
        },
        {
          id: 'link',
          label: "网址URL",
          elements: [
            {
                type: 'text',
                id: 'url',
            },
            {
              type: 'html',
              html: '请在输入框里面填上要添加图片的URL'
            },
            {
                type: 'button',
                id: 'add_url',
                label: '增加',
                onClick: function(evt){
                  var input = dialog.getContentElement("link","url");
                  create_img_ele(input.getValue());
                  editor.insertElement( dialog.image_ele );
                  dialog.hide();
                }
            }
          ]
        }
      ],
      onLoad: function(){
        console.log("onload");
        dialog = this;
        document.getElementById(this.getButton('ok').domId).style.display='none'
        document.getElementById(this.getButton('cancel').domId).style.display='none'
        new Img4yeUploader({
          "browse_button": jQuery(".cke_dialog_contents .upload_btn"),
          "file_progress_callback": FileProgress
        });

        document.getElementById(this.getContentElement("upload_tab","submit_upload").domId).style.display='none'
      },
      onShow: function(){
        console.log("onShow");
      }
    }
  });
})();
