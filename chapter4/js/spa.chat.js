/**
 * Created by Kaede on 2015/12/14.
 * spa.chat.js
 * Chat feature module for SPA
 */

/* global $, spa */

spa.chat = (function(){
    /* BEGIN MODULE SCOPE VARIABLES */
    var configMap = {
        main_html: String()
        + '<div style="padding: 1em;color: #fff;">'
        + 'Say hello to chat'
        + '</div>',
        settable_map: {}
    };
    var stateMap = {
        $container: null
    };
    var jqueryMap = {};
    var setJqueryMap, configModule, initModule;
    /* END MODULE SCOPE VARIABLES */

    /* BEGIN UTILITY METHODS */
    /* END UTILITY METHODS */

    /* BEGIN DOM METHODS */
    setJqueryMap = function(){
        var $container = stateMap.$container;
        jqueryMap = { $container: $container }
    };
    /* END DOM METHODS */

    /* BEGIN EVENT HANDLERS */
    /* END EVENT HANDLERS */

    /* BEGIN PUBLIC METHODS */

    // Begin public method /configModule/
    // Purpose: Adjust configuration of allowed keys
    // Arguments: A map of settable keys and values
    // Returns: true
    configModule = function(input_map){
        spa.util.setConfigMap({
            input_map: input_map,
            settable_map: configMap.settable_map,
            config_map: configMap
        });
        return true
    };

    // Begin public method /initModule/
    // Purpose: Initialize module
    // Arguments:
    // * $container: the jquery element used by this feature
    // Returns: true
    initModule = function($container){
        $container.html(configMap.main_html);
        stateMap.$container = $container;
        setJqueryMap();
        return true
    };

    /* END PUBLIC METHODS */

    // return public methods
    return{
        configModule: configModule,
        initModule: initModule
    }

}());