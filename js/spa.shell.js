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
        is_chat_retracted: true
    };
    var jqueryMap = {};
    var setJqueryMap, toggleChat, onClickChat, initModule;
    // END MODULE SCOPE VARIABLES

    // BEGIN DOM method
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

    onClickChat = function(){
        toggleChat(stateMap.is_chat_retracted);
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
            .click(onClickChat)

    };
    // END DOM method

    return {initModule: initModule}
}());