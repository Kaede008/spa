spa.shell = (function(){

    // BEGIN MODULE SCOPE VARIABLES
    var main_html="";
    main_html += "<div class=\"spa-shell-head\">";
    main_html += "<div class=\"spa-shell-head-logo\"><\/div>";
    main_html += "<div class=\"spa-shell-head-acct\"><\/div>";
    main_html += "<div class=\"spa-shell-head-search\"><\/div>";
    main_html += "<\/div>";
    main_html += "<div class=\"spa-shell-main\">";
    main_html += "<div class=\"spa-shell-main-nav\"><\/div>";
    main_html += "<div class=\"spa-shell-main-content\"><\/div>";
    main_html += "<\/div>";
    main_html += "<div class=\"spa-shell-foot\"><\/div>";
    main_html += "<div class=\"spa-shell-modal\"><\/div>";

    var configMap = {
        anchor_schema_map: {
            chat: { opened: true, closed: true }
        },
        main_html: main_html,
        chat_extend_time: 250,
        chat_retract_time: 300,
        chat_extend_height: 450,
        chat_retract_height: 15,
        chat_extended_title: 'Click to retract',
        chat_retracted_title: 'Click to extend',

        resize_interval: 200
    };

    var stateMap = {
        anchor_map: {},
        resize_idto: undefined // retain the resize timeout ID
    };
    var jqueryMap = {};
    var setJqueryMap, setChatAnchor, initModule, copyAnchorMap,
        changeAnchorPart, onHashchange, onResize;
    // END MODULE SCOPE VARIABLES

    // BEGIN DOM method
    copyAnchorMap = function(){
        return $.extend(true, {}, stateMap.anchor_map)
    };

    changeAnchorPart = function(arg_map){
        var anchor_map_revise = copyAnchorMap();
        var bool_return = true;
        var key_name, key_name_dep;

        // Begin merge changes into anchor map
        KEYVAL:
        for (key_name in arg_map){
            if (arg_map.hasOwnProperty(key_name)){
                // skip dependent keys during iteration
                if (key_name.indexOf('_') === 0) { continue KEYVAL }

                // update independent key value
                anchor_map_revise[key_name] = arg_map[key_name];

                // update matching dependent key
                key_name_dep = '_' + key_name;
                if (arg_map[key_name_dep]){
                    anchor_map_revise[key_name_dep] = arg_map[key_name_dep]
                }else{
                    delete anchor_map_revise[key_name_dep];
                    delete anchor_map_revise['_s' + key_name_dep];
                }
            }
        }
        // End merge changes into anchor map

        // Begin attempt to update URI; revert if not successful
        try{
            $.uriAnchor.setAnchor(anchor_map_revise)
        }
        catch(error){
            // replace URI with existing state
            $.uriAnchor.setAnchor(stateMap.anchor_map, null, true);
            bool_return = false
        }
        // End attempt to update URI...
        return bool_return
    };

    onHashchange = function(event){
        var is_ok = true;
        var anchor_map_previous = copyAnchorMap();
        var anchor_map_proposed;
        var _s_chat_previous, _s_chat_proposed, s_chat_proposed;

        // attempt to parse anchor
        try{
            anchor_map_proposed = $.uriAnchor.makeAnchorMap()
        } catch(error){
            $.uriAnchor.setAnchor(anchor_map_previous, null, true);
            return false
        }
        stateMap.anchor_map = anchor_map_proposed;

        // convenience vars
        _s_chat_previous = anchor_map_previous._s_chat;
        _s_chat_proposed = anchor_map_proposed._s_chat;

        // Begin adjust chat component if changed
        if (!anchor_map_previous || _s_chat_previous !== _s_chat_proposed){
            s_chat_proposed = anchor_map_proposed.chat;
            switch(s_chat_proposed){
                case 'opened':
                    is_ok = spa.chat.setSliderPosition('opened');
                    break;
                case 'closed':
                    is_ok = spa.chat.setSliderPosition('closed');
                    break;
                default:
                    spa.chat.setSliderPosition('closed');
                    delete anchor_map_proposed.chat;
                    $.uriAnchor.setAnchor(anchor_map_proposed, null, true)
            }
        }
        // End adjust chat component if changed

        // Begin revert anchor if slider change denied
        if (!is_ok){
            if (anchor_map_previous){
                $.uriAnchor.setAnchor(anchor_map_previous, null, true)
            }else{
                delete anchor_map_proposed.chat;
                $.uriAnchor.setAnchor(anchor_map_proposed, null, true)
            }
        }
        // End revert anchor if slider change denied

        return false
    };

    /**
     * Begin Event handler /onResize/
     */
    onResize = function(){
        if (stateMap.resize_idto){
            return true
        }

        spa.chat.handleResize();
        stateMap.resize_idto = setTimeout(
            function(){ stateMap.resize_idto = undefined },
            configMap.resize_interval
        );

        return true; // return true from the window.resize event handler so that jQuery doesn't preventDefault() or stopPropagation()
    };

    setJqueryMap = function(){
        var $container = stateMap.$container;
        jqueryMap = {
            $container: $container
        }
    };

    // END DOM method

    // BEGIN CALLBACKS
    /**
     * Begin callback method /setChatAnchor/
     * Example: setChatAnchor('closed')
     * Purpose: Change the chat component of the anchor
     * @param position_type - may be 'closed' or 'opened'
     * Action: Change the URI anchor parameter 'chat' to the requested value if possible
     * @return: true - requested anchor part was updated
     *          false - requested anchor part was not updated
     */
    setChatAnchor = function(position_type){
        return changeAnchorPart({chat: position_type})
    };

    // BEGIN PUBLIC METHODS
    /**
     * Begin Public method /initModule/
     * Example: spa.shell.initModule($('#app_div_id'))
     * Purpose: Directs the shell to offer its capability to the user
     * @param $container - (example: $('#app_div_id'))
     *                     A jQuery collection that should represent a single DOM container
     * Action: Populates $container with the shell of the UI and configures and initialize
     *         feature modules. The shell is also responsible for browser-wide issues such
     *         as URI anchor and cookie management.
     */
    initModule = function($container){
        // load HTML and map jQuery collections
        stateMap.$container = $container;
        $container.html(configMap.main_html);
        setJqueryMap();

        // configure uriAnchor to use our schema
        $.uriAnchor.configModule({
            schema_map: configMap.anchor_schema_map
        });

        // configure and initialize feature modules
        spa.chat.configModule({
            set_chat_anchor: setChatAnchor,
            chat_model: spa.model.chat,
            people_model: spa.model.people
        });
        spa.chat.initModule(jqueryMap.$container);

        $(window)
            .bind('resize', onResize)
            .bind('hashchange', onHashchange)
            .trigger('hashchange');
    };

    // END PUBLIC METHODS

    return {initModule: initModule};
}());