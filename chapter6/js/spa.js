/**
 * Created by Kaede on 2015/12/6.
 */
var spa = (function(){
    'use strict';

    var initModule = function($container){
        spa.model.initModule();
        spa.shell.initModule($container)
    };

    return { initModule: initModule }
}());