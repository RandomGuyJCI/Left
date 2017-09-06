function Left()
{
  this.navi_el        = document.createElement('navi');
  this.textarea_el    = document.createElement('textarea');
  this.stats_el       = document.createElement('stats');
  this.scroll_el      = document.createElement('scrollbar');

  this.dictionary = new Dict();

  this.words_count = null;
  this.lines_count = null;
  this.chars_count = null;
  this.current_word = null;
  this.suggestion = null;
  this.synonyms = null;
  this.synonym_index = 0;

  this.title = null;

  document.body.appendChild(this.navi_el);
  document.body.appendChild(this.textarea_el);
  document.body.appendChild(this.stats_el);
  document.body.appendChild(this.scroll_el);
  document.body.className = window.location.hash.replace("#","");

  this.textarea_el.setAttribute("autocomplete","off");
  this.textarea_el.setAttribute("autocorrect","off");
  this.textarea_el.setAttribute("autocapitalize","off");
  this.textarea_el.setAttribute("spellcheck","false");
  this.textarea_el.setAttribute("type","text");

  var left = this;

  this.start = function()
  {
    this.textarea_el.focus();

    if(localStorage.backup){
      this.textarea_el.value = localStorage.backup;
    }
    else{
      this.textarea_el.value = this.splash();
      this.textarea_el.setSelectionRange(2,9);
    }

    this.dictionary.update();
    this.refresh();
    this.refresh_settings();
  }

  this.refresh = function()
  {
    left.current_word = left.active_word();

    // Only look for suggestion is at the end of word, or text.
    var next_char = this.textarea_el.value.substr(left.textarea_el.selectionEnd,1);

    left.suggestion = (next_char == "" || next_char == " " || next_char == "\n") ? left.dictionary.find_suggestion(left.current_word) : null;

    this.refresh_navi();
    this.refresh_stats();
    left.refresh_scrollbar();
  }

  this.refresh_navi = function()
  {
    left.navi_el.innerHTML = "";

    var html = "";
    var text = left.textarea_el.value;
    var lines = text.split("\n");
    var markers = [];

    left.lines_count = lines.length;
    left.words_count = text.split(" ").length;
    left.chars_count = text.length;

    for(var line_id in lines){
      var line = lines[line_id];
      if(line.substr(0,2) == "@ " || line.substr(0,2) == "# "){
        var el = document.createElement('li');
        el.innerHTML = line.replace("@ ","").replace("# ","")+"<span>"+line_id+"</span>";
        el.destination = line;
        el.onmouseup = function on_mouseup(e){ go_to(e.target.destination); }
        left.navi_el.appendChild(el);
      }
      if(line.substr(0,2) == "$ " || line.substr(0,3) == "## "){
        var el = document.createElement('li');
        el.innerHTML = line.replace("$ ","").replace("## ","")+"<span>"+line_id+"</span>";
        el.destination = line;
        el.onmouseup = function on_mouseup(e){ go_to(e.target.destination); }
        el.className = "note";
        left.navi_el.appendChild(el);
      }
    }
  }

  this.refresh_stats = function()
  {
    var stats = {};
    stats.l = left.lines_count;
    stats.w = left.words_count;
    stats.c = left.chars_count;
    stats.v = left.dictionary.vocabulary.length;
    stats.p = (left.textarea_el.selectionEnd/parseFloat(left.chars_count)) * 100; stats.p = stats.p > 100 ? 100 : parseInt(stats.p);

    suggestion_html = (left.current_word && left.suggestion && left.current_word != left.suggestion) ? " <t>"+left.current_word+"<b>"+left.suggestion.substr(left.current_word.length,left.suggestion.length)+"</b></t>" : "";

    // Synonyms
    left.synonyms = this.dictionary.find_synonym(left.current_word);
    synonym_html = "";

    for(syn_id in left.synonyms){
      synonym_html += syn_id == (left.synonym_index % left.synonyms.length) ? "<i>"+left.synonyms[syn_id]+"</i> " : left.synonyms[syn_id]+" ";
    }

    left.stats_el.innerHTML = left.synonyms ? " <b>"+left.current_word+"</b> "+synonym_html : stats.l+"L "+stats.w+"W "+stats.v+"V "+stats.c+"C "+(stats.p > 0 && stats.p < 100 ? stats.p+"%" : "")+suggestion_html+synonym_html;
  }

  this.refresh_settings = function()
  {
    if(left.textarea_el.value.indexOf("~ left.theme=") >= 0){
      var theme_name = left.textarea_el.value.split("~ left.theme=")[1].split(" ")[0];
      document.body.className = theme_name;
    }
    if(left.textarea_el.value.indexOf("~ left.suggestions=") >= 0){
      var suggestions_toggle = left.textarea_el.value.split("~ left.suggestions=")[1].split(" ")[0];
      if(suggestions_toggle == "off"){ left.dictionary.is_suggestions_enabled = false; }
      if(suggestions_toggle == "on"){ left.dictionary.is_suggestions_enabled = true; }
    }
    if(left.textarea_el.value.indexOf("~ left.synonyms=") >= 0){
      var synonyms_toggle = left.textarea_el.value.split("~ left.synonyms=")[1].split(" ")[0];
      if(synonyms_toggle == "off"){ left.dictionary.is_synonyms_enabled = false; }
      if(synonyms_toggle == "on"){ left.dictionary.is_synonyms_enabled = true; }
    }
    if(left.textarea_el.value.indexOf("~ left.title=") >= 0){
      var title = left.textarea_el.value.split("~ left.title=")[1].split(" ")[0];
      left.title = title;
    }
  }

  this.splash = function()
  {
    return "# Welcome\n\n## Controls\n\n- Create markers by beginning lines with either @ and $, or # and ##.\n- Overline words to look at synonyms.\n- Export a text file with ctrl+s.\n- Import a text file by dragging it on the window.\n- Press <tab> to autocomplete a word.\n- The synonyms dictionary contains "+Object.keys(left.dictionary.synonyms).length+" common words.\n- Automatically keeps backups, press ctrl+shift+del to erase the backups.\n\n## Details\n\n- #L, stands for Lines.\n- #W, stands for Words.\n- #V, stands for Vocabulary, or unique words.\n- #C, stands for Characters.\n\n## Settings\n\n~ left.title=draft     set output file name\n~ left.theme=blanc     set default theme.\n~ left.theme=noir      set noir theme.\n~ left.theme=pale      set low-contrast theme.\n~ left.suggestions=on  toggle suggestions\n~ left.synonyms=on     toggle synonyms\n\n## Enjoy.\n\n- https://github.com/hundredrabbits/Left";
  }

  this.active_word = function()
  {
    var before = this.textarea_el.value.substr(0,left.textarea_el.selectionEnd);
    var words = before.replace(/\n/g," ").split(" ");
    var last_word = words[words.length-1];
    return last_word.replace(/\W/g, '');
  }

  this.active_word_length = function()
  {
    var before = this.textarea_el.value.substr(0,left.textarea_el.selectionEnd);

    var l = 0;
    while(l < 40){
      var char = before[before.length-(l+1)];
      if(char.length != 1 || !char.match(/[a-z]/i)){
        return l;
      }
      l += 1;
    }
    return null;
  }

  this.replace_active_word_with = function(word)
  {
    var before = this.textarea_el.value.substr(0,left.textarea_el.selectionEnd-left.active_word_length());
    var after = this.textarea_el.value.substr(left.textarea_el.selectionEnd,this.textarea_el.value.length);
    var target_selection = before.length+word.length;
    this.textarea_el.value = before+word+after;

    this.textarea_el.setSelectionRange(target_selection,target_selection);
    this.textarea_el.focus();

    left.synonym_index += 1;

    left.refresh_stats();
  }

  this.inject = function(characters = "__")
  {
    var pos = this.textarea_el.selectionStart;
    var before = this.textarea_el.value.substr(0,pos);
    var middle = characters;
    var after  = this.textarea_el.value.substr(pos,this.textarea_el.value.length);

    this.textarea_el.value = before+middle+after;
    this.textarea_el.setSelectionRange(pos+characters.length,pos+characters.length);
    this.refresh();
  }

  this.autocomplete = function()
  {
    var suggestion = left.suggestion;
    this.inject(suggestion.substr(left.current_word.length,suggestion.length));
  }

  this.save = function()
  {
    var text = left.textarea_el.value;
    var blob = new Blob([text], {type: "text/plain;charset=" + document.characterSet});
    var d = new Date(), e = new Date(d);
    var since_midnight = e - d.setHours(0,0,0,0);
    var timestamp = parseInt((since_midnight/864) * 10);
    saveAs(blob, (left.title ? left.title : "backup")+"."+timestamp+".txt");
  }

  document.onkeydown = function key_down(e)
  {
    if(e.key == "s" && (e.ctrlKey || e.metaKey)){
      e.preventDefault();
      left.save();
    }

    if((e.key == "Backspace" || e.key == "Delete") && e.ctrlKey && e.shiftKey){
      e.preventDefault();
      left.textarea_el.value = left.splash();
      localStorage.setItem("backup", left.textarea_el.value);
      left.refresh();
    }

    if(e.keyCode == 9){
      if(left.suggestion){ left.autocomplete(); }
      if(left.synonyms){ left.replace_active_word_with(left.synonyms[left.synonym_index % left.synonyms.length]); }
      e.preventDefault();
    }

    if(e.key == "Enter"){
      left.dictionary.update();
      left.refresh_settings();
    }

    if(e.key && e.key.substr(0,5) == "Arrow"){
      left.refresh();
    }
  };

  this.go_to = function(selection)
  {
    var from = this.textarea_el.value.indexOf(selection);
    var to   = from + selection.length;

    if(this.textarea_el.setSelectionRange){
     this.textarea_el.setSelectionRange(from,to);
    }
    else if(this.textarea_el.createTextRange){
      var range = this.textarea_el.createTextRange();
      range.collapse(true);
      range.moveEnd('character',to);
      range.moveStart('character',from);
      range.select();
    }
    this.textarea_el.focus();

    var perc = (left.textarea_el.selectionEnd/parseFloat(left.chars_count));
    var offset = 60;
    this.textarea_el.scrollTop = (this.textarea_el.scrollHeight * perc) - offset;
    // alert((this.textarea_el.scrollHeight * perc) - offset);
  };

  this.wheel = function(e)
  {
    e.preventDefault();
    left.textarea_el.scrollTop += e.wheelDeltaY * -0.25;
    left.refresh_scrollbar();
  }

  this.refresh_scrollbar = function()
  {
    var scroll_distance = left.textarea_el.scrollTop;
    var scroll_max = left.textarea_el.scrollHeight - left.textarea_el.offsetHeight;
    left.scroll_el.style.height = (scroll_distance/scroll_max) * window.innerHeight;
  }

  left.textarea_el.addEventListener('wheel', left.wheel, false);

  document.oninput = function on_input(e)
  {
    left.refresh();
  }

  document.onmouseup = function on_mouseup(e)
  {
    left.refresh();
  }

}

window.addEventListener('load',function(){


    if (document.body.classList.contains('punk')) {

      const noise1Png = require('./media/noise/noise1');
      const noise2Png = require('./media/noise/noise2');
      const noise3Png = require('./media/noise/noise3');
      const HUE_SHIFT_INTENSITY = 4;

      function generateBackgroundNoise() {
        const noisePng = [noise1Png, noise2Png, noise3Png];
        var rand = noisePng[Math.floor(Math.random() * noisePng.length)];
        return ` background-image: ${rand}; background-size: 100px 100px; `;
      };

      function generateTextShadow() {
        let x = -1 + 2 * Math.random();
        x = x * x;
        const intensity = HUE_SHIFT_INTENSITY * x;
        return `text-shadow: ${intensity}px 0 .5px rgba(0,30,255,0.5), ${-intensity}px 0 .5px rgba(255,0,80,0.3), 0 0 3px rgba(255,255,255,0.5)!important;`;
      };


      var punkFX = setInterval(function() {
        var gen = generateTextShadow();
        var genBG = generateBackgroundNoise();

        document.body.style = genBG + gen;
        left.textarea_el.style = gen;


      }, 100);
    }

    else {
      punkFX = null;
      document.body.style = 'text-shadow:none; background-image:none;';
      left.textarea_el.style = 'text-shadow:none;';
    }

});


window.addEventListener('dragover',function(e)
{
  e.stopPropagation();
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
});

window.addEventListener('drop', function(e)
{
  e.stopPropagation();
  e.preventDefault();

  var files = e.dataTransfer.files;
  var file = files[0];

  if (!file.type.match(/text.*/)) { console.log("Not text"); return false; }

  var reader = new FileReader();
  reader.onload = function(e){
    left.textarea_el.value = e.target.result;
    left.dictionary.update();
    left.refresh();
    left.refresh_settings();
  };
  reader.readAsText(file);
});

window.onbeforeunload = function(e)
{
  localStorage.setItem("backup", left.textarea_el.value);
};
