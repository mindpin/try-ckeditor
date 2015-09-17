# options = {
#   uptoken_url:     'http://lifei.com:3000/file_entities/uptoken',

#   browse_button:   'jquery selector str | ele | jquery ele',

#   drag_area:       'jquery selector str | ele | jquery ele',
#   file_list_area:  'jquery selector str | ele | jquery ele',
#   file_progress_callback: FileProgress,

#   auto_start: false,
#   paste_upload: false
# }
QINIU_CONFIG = {
  domain:      "http://7xie1v.com1.z0.glb.clouddn.com/",
  basepath:    "i",
  uptoken_url: "http://img.4ye.me/file_entities/uptoken"
}
class Img4yeUploader
  constructor: (@options)->
    @qiniu_domain   = QINIU_CONFIG["domain"]
    @qiniu_basepath = QINIU_CONFIG["basepath"]
    @uptoken_url    = @options["uptoken_url"] || QINIU_CONFIG["uptoken_url"]

    @browse_button  = jQuery(@options["browse_button"]).get(0)

    @drag_area      = jQuery(@options["drag_area"]).get(0)
    @dragdrop = (typeof(@drag_area) != "undefined")

    @file_list_area = jQuery(@options["file_list_area"]).get(0)
    @file_progress_callback = @options["file_progress_callback"] || DefualtImg4yeFileProgress
    @file_progresses = {}

    @auto_start = @options["auto_start"]
    if typeof(@auto_start) == "undefined"
      @auto_start = true

    @paste_upload = @options["paste_upload"]
    if typeof(@paste_upload) == "undefined"
      @paste_upload = false

    @_process_browse_button();

    @_init();
    @_process_paste_upload()
    @_process_auto_start()

  add_file: (file)->
    @qiniu.addFile(file)

  add_file_by_base64: (base64)->
    if base64.match /^data\:image\//
      blob = dataURLtoBlob base64
      blob.name = "paste-#{(new Date).valueOf()}.png"
      @qiniu.addFile(blob)

  _process_browse_button: ()->
    if typeof(@browse_button) == "undefined"
      throw "没有指定 browse_button 参数，或者 browse_button 参数指定的 dom 不存在"

  _init: ()->
    @qiniu = Qiniu.uploader
      runtimes: 'html5,flash,html4'
      browse_button: @browse_button,
      uptoken_url: @uptoken_url,
      domain: @qiniu_domain,
      max_file_size: '100mb',
      max_retries: 1,
      dragdrop: @dragdrop,
      drop_element: @drag_area,
      chunk_size: '4mb',
      auto_start: @auto_start,
      x_vars:
        origin_file_name: (up, file)->
          file.name
      init:
        FilesAdded: (up, files)=>
          console.debug 'many files'
          plupload.each files, (file)=>
            if not @file_progresses[file.id]?
              @file_progresses[file.id] = new @file_progress_callback(file, up)

        BeforeUpload: (up, file)=>
          console.debug 'before upload'
          if not @file_progresses[file.id]?
            @file_progresses[file.id] = new @file_progress_callback(file, up)

        UploadProgress: (up, file)=>
          console.debug 'upload progress'
          chunk_size = plupload.parseSize up.getOption('chunk_size')
          @file_progresses[file.id].update()

        FileUploaded: (up, file, info_json)=>
          console.debug 'file uploaded'
          info = jQuery.parseJSON(info_json);
          @file_progresses[file.id].success(info)

        Error: (up, err, errTip)=>
          @file_progresses[err.file.id].error()

        UploadComplete: ()=>
          @file_progress_callback.alldone()

        Key: (up, file)=>
          # // domain 为七牛空间（bucket)对应的域名，选择某个空间后，可通过"空间设置->基本设置->域名设置"查看获取
          # // uploader 为一个plupload对象，继承了所有plupload的方法，参考http://plupload.com/docs
          ext = file.name.split(".").pop()
          ext = ext.toLowerCase()
          "#{@qiniu_basepath}/#{jQuery.randstr()}.#{ext}"

  _process_auto_start: ()->
    if !@auto_start
      @start = ->
        @qiniu.start()

  _process_paste_upload: ()->
    return if !@paste_upload

    # 通过粘贴上传文件
    ###
      粘贴有六种情况：
      1. [√] 在 chrome 下通过软件复制图像数据
      2. [√] 在 chrome 下右键复制网页图片
      3. [×] 在 chrome 下粘贴磁盘文件句柄 ......

      4. [√] 在 firefox 下通过软件复制图像数据
      5. [√] 在 firefox 下右键复制网页图片
      6. [√] 在 firefox 下粘贴磁盘文件句柄
    ###


    # 粘贴剪贴板内容 (chrome)
    # 在 firefox 下，需要在页面放置一个隐藏的 contenteditable = true 的 dom
    paste_dom = jQuery '<div contenteditable></div>'
      .css
        'position': 'absolute'
        'left': -99999
        'top': -99999
      .appendTo jQuery(document.body)
      .focus()

    that = this
    jQuery(document).off 'paste'
    jQuery(document).on 'paste', (evt)=>
      # chrome
      arr = (evt.clipboardData || evt.originalEvent.clipboardData)?.items
      if arr?.length
        return @_deal_chrome_paste arr

      # firefox
      paste_dom.html('').focus()
      setTimeout =>
        paste_dom.find('img').each ->
          $img = jQuery(this)
          that._deal_firefox_paste $img

  _deal_chrome_paste: (arr)->
    console.log 'chrome paste'
    for i in arr
      if i.type.match(/^image\/\w+$/)
        file = i.getAsFile()
        file.name = "paste-#{(new Date).valueOf()}.png"
        @qiniu.addFile(file) if file

  _deal_firefox_paste: ($img)->
    console.log 'firefox paste'
    src = $img.attr 'src'
    if src.match /^data\:image\//
      blob = dataURLtoBlob src
      blob.name = "paste-#{(new Date).valueOf()}.png"
      @qiniu.addFile(blob)
      return

class DefualtImg4yeFileProgress
  constructor: (qiniu_uploading_file, @uploader)->
    @file = qiniu_uploading_file
    console.log @file
    window.afile = @file

    @ready()

  # 当文件开始上传的瞬间，会执行这个方法
  # 一般用于进行界面变化，DOM 准备等操作
  ready: ->
    console.log("ready")

  # 上传进度进度更新时调用此方法
  update: ->
    console.log("update")

  # 上传成功时调用此方法
  success: (info)->
    console.log("success")

  # 上传出错时调用此方法
  error: ->
    console.log("error")

  @alldone: ->
    console.log("alldone")

window.Img4yeUploader = Img4yeUploader
