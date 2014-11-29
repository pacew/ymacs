function ymacs_buffer_advance_to_string(string) {
    var buffer = Ymacs_Keymap_Query_Replace().buffer;
    var contents = buffer.getCode();
    var position = contents.indexOf(string, buffer.point());
    if (position != -1) {
        buffer._repositionCaret(position + string.length);
    }
    buffer.cmd("ensure_caret_visible");
    return position;
}

function ymacs_query_replace(from_string, to_string) {
    var buffer = Ymacs_Keymap_Query_Replace().buffer;
    var pos = buffer.point();

    buffer._replaceText(pos - from_string.length, pos, to_string);
}

function ymacs_finish_query_replace() {
    var km = Ymacs_Keymap_Query_Replace();
    km.buffer.popKeymap(km);
    km.buffer.setMinibuffer("Replaced " + km.replacements + " occurrences.");
}

DEFINE_SINGLETON("Ymacs_Keymap_Query_Replace", Ymacs_Keymap, function(D, P){
    P.defaultHandler = [ Ymacs_Interactive(function(){
        var km = Ymacs_Keymap_Query_Replace();
        var ev = this.interactiveEvent();
	var key = Ymacs_Keymap.unparseKey (ev);

        var position = null;
        
        switch (key) {
          case "SPACE":
            ymacs_query_replace(km.from_string, km.to_string);
            position = ymacs_buffer_advance_to_string(km.from_string);
            km.replacements++;
            break;
          case "n":
            position = ymacs_buffer_advance_to_string(km.from_string);
            break;
          case ".":
            ymacs_query_replace(km.from_string, km.to_string);
            km.replacements++;
            ymacs_finish_query_replace();
            return true;
          default:
            ymacs_finish_query_replace();
            return false;
        }

        if (position == -1) {
            ymacs_finish_query_replace();
        }
        return true;
    }) ];
});

Ymacs_Buffer.newCommands({
    query_replace: Ymacs_Interactive (["MQuery replace: ", "MReplace with: "], function(from_string, to_string) {
        var km = Ymacs_Keymap_Query_Replace ();
        km.buffer = ymacs.getActiveBuffer();
        km.replacements = 0;
        km.from_string = from_string;
        km.to_string = to_string;
        this.pushKeymap (km);
        if (! this.isMinibuffer) {
            this.setMinibuffer ("Query replacing " + from_string + " with "
                                + to_string + " (space, n, or .) ");
        }
        ymacs_buffer_advance_to_string(from_string);
    }),
});

Ymacs_Keymap_Emacs().defineKeys({
    "M-%": "query_replace"
});
