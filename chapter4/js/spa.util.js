/**
 * Created by Kaede on 2015/12/14.
 * spa.util.js
 * General Javascript utilities
 */

spa.util = (function(){
    var makeError, setConfigMap;

    // Begin public constructor /makeError/
    // Purpose: a convenience wrapper to create an error object
    // Arguments:
    //  * name_text - the error name
    //  * msg_text -long error message
    //  * data - optional data attached to error object
    // Returns: newly constructed error object
    makeError = function(name_text, msg_text, data){
        var error = new Error();
        error.name = name_text;
        error.message = msg_text;

        if (data){
            error.data = data
        }

        return error
    };
    // End public constructor /makeError/

    // Begin public method /setConfigMap/
    // Purpose: Common code to set configs in feature modules
    // Argument:
    //  * input_map - map of key-values to set in config
    //  * settable_map - map of allowable keys to set
    //  * config_map - map to apply settings to
    // Returns: true
    setConfigMap = function(arg_map){
        var input_map = arg_map.input_map;
        var settable_map = arg_map.settable_map;
        var config_map = arg_map.config_map;
        var key_name, error;

        for (key_name in input_map){
            if (input_map.hasOwnProperty(key_name)){
                if (settable_map.hasOwnProperty(key_name)){
                    config_map[key_name] = input_map[key_name]
                }
                else{
                    error = makeError('Bad Input', 'Setting config key | ' + key_name + '| is not supported');
                    throw error
                }
            }
        }
    };
    // End public method /setConfigMap/

    return {
        makeError: makeError,
        setConfigMap: setConfigMap
    }
}());
