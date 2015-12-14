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
    main_html += "<div class=\"spa-shell-chat\"><\/div>";
    main_html += "<div class=\"spa-shell-modal\"><\/div>";

    var configMap = {
        anchor_schema_map: {
            chat: { open: true, closed: true }
        },
        main_html: main_html,
        chat_extend_time: 250,
        chat_retract_time: 300,
        chat_extend_height: 450,
        chat_retract_height: 15,
        chat_extended_title: 'Click to retract',
        chat_retracted_title: 'Click to extend'
    };

    var stateMap = {
        $container: null,
        anchor_map: {},
        is_chat_retracted: true
    };
    var jqueryMap = {};
    var setJqueryMap, toggleChat, onClickChat, initModule, copyAnchorMap, changeAnchorPart, onHashchange;
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
                case 'open':
                    toggleChat(true);
                    break;
                case 'closed':
                    toggleChat(false);
                    break;
                default:
                    toggleChat(false);
                    delete anchor_map_proposed.chat;
                    $.uriAnchor.setAnchor(anchor_map_proposed, null, true)
            }
        }
        // End adjust chat component if changed

        return false
    };

    setJqueryMap = function(){
        var $container = stateMap.$container;
        jqueryMap = {
            $container: $container,
            $chat: $container.find('.spa-shell-chat')
        }
    };

    toggleChat = function(do_extend, callback){
        var px_chat_ht = jqueryMap.$chat.height();
        var is_open = px_chat_ht === configMap.chat_extend_height;
        var is_closed = px_chat_ht === configMap.chat_retract_height;
        var is_sliding = !is_open && !is_closed;

        if (is_sliding) { return false };

        // Begin extend chat slider
        if (do_extend){
            jqueryMap.$chat.animate(
                {height: configMap.chat_extend_height},
                configMap.chat_extend_time,
                function(){
                    jqueryMap.$chat.attr('title', configMap.chat_extended_title);
                    stateMap.is_chat_retracted = false;
                    if (callback) { callback(jqueryMap.$chat) }
                }
            );
            return true
        }

        // Begin retract chat slider
        jqueryMap.$chat.animate(
            {height: configMap.chat_retract_height},
            configMap.chat_retract_time,
            function(){
                jqueryMap.$chat.attr('title', configMap.chat_retracted_title);
                stateMap.is_chat_retracted = true;
                if (callback) { return callback(jqueryMap.$chat) }
            }
        );
        return true
    };

    onClickChat = function(event){
        changeAnchorPart({
            chat: (stateMap.is_chat_retracted ? 'open' : 'closed')
        });
        return false
    };

    initModule = function($container){
        stateMap.$container = $container;
        $container.html(configMap.main_html);
        setJqueryMap();

        // initialize chat slider and bind click handler
        stateMap.is_chat_retracted = true;
        jqueryMap.$chat
            .attr('title', configMap.chat_retracted_title)
            .click(onClickChat);

        // configure uriAnchor to use our schema
        $.uriAnchor.configModule({
            schema_map: configMap.anchor_schema_map
        });
        $(window)
            .bind('hashchange', onHashchange)
            .trigger('hashchange');
    };
    // END DOM method

    return {initModule: initModule}
}());