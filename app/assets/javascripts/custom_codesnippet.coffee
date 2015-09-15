jQuery(document).on 'ready page:load', ->
  if jQuery("pre code").length > 0
    jQuery.each jQuery("pre code"), ->
      $ele = jQuery(this)
      class_name = $ele.attr("class")

      res = class_name.match(/(?:^|\s)language-(.*)(?:\\s|$)/)
      if res
        $ele.addClass("hljs")
        highlighted = window.hljs.highlightAuto($ele.text(), [res[1]])
        if highlighted
          console.log(highlighted.value);
          $ele.html(highlighted.value)
