/**
 * Created by Kaede on 2015/12/14.
 * spa.model.js
 * Model module
 */

/* global $, spa  */
spa.model = (function(){
    'use strict';
    var configMap = {anon_id: 'a0'};
    var stateMap = {
        anon_user: null,
        cid_serial: 0,
        people_cid_map: {},
        people_db: TAFFY(),
        is_connected: false,
        user: null
    };
    var isFakeData = true;

    var personProto, makeCid, clearPeopleDb, completeLogin, makePerson,
        removePerson, people, initModule, chat;

    personProto = {
        get_is_user: function(){
            return this.cid === stateMap.user.cid
        },
        get_is_anon: function(){
            return this.cid === stateMap.anon_user.cid;
        }
    };

    makeCid = function(){
        return 'c' + String(stateMap.cid_serial++)
    };

    clearPeopleDb = function(){
        var user = stateMap.user;
        stateMap.people_db = TAFFY();
        stateMap.people_cid_map = {};
        if (user){
            stateMap.people_db.insert(user);
            stateMap.people_cid_map[user.cid] = user
        }
    };

    completeLogin = function(user_list){
        var user_map = user_list[0];
        delete stateMap.people_cid_map[user_map.cid];
        stateMap.user.cid = user_map._id;
        stateMap.user.id = user_map._id;
        stateMap.user.css_map = user_map.css_map;
        stateMap.people_cid_map[user_map._id] = stateMap.user;

        // When we add chat, we should join here
        chat.join();
        $.gevent.publish('spa-login', [stateMap.user]);
    };

    /**
     * The chat object API
     * ------------------------
     * The chat object is available at spa.model.chat.
     * The chat object provides methods and events to manage
     * chat messaging. Its public methods include:
     * join() - joins the chat room. This routine sets up
     *          the chat protocol with the backend including
     *          publishers for 'spa-listchange' and 'spa-updatechat'
     *          global custom events. If the current is anonymous,
     *          join() abort and returns false;
     * get_chatee() - return the person object with whom the user is chatting
     *                with. If there is no chatee, null is returned.
     * set_chatee(<person_id>) - set the chatee to the person identified by person_id.
     *                           If the person_id does not exist in the people list, the
     *                           chatee is set to null. If the person requested is already
     *                           the chatee, it returns false. It publish a 'spa-setchatee'
     *                           global custom event.
     * send_msg(<msg_text>) - send message to the chatee. It published a 'spa-updatechat' global
     *                        custom event. If the user is anonymous or the chatee is null, it aborts
     *                        and returns false.
     * jQuery global custom events published by the object include;
     * update_avatar(<update_avtr_map>) - send the update_avtr_map to the backend. This results in an
     * 'spa-listchange' event which published the updated people list and avatar information(the css_map
     * in the person objects). The update_avtr_map must have the form {person_id: person_id, css_map: css_map}
     * spa-setchatee - This is published when a new chatee is set. A map of the form:
     * { old_chatee: <old_chatee_person_object>,
     *   new_chatee: <new_chatee_person_object>   }
     * is provided as data.
     *
     * spa-updatechat - This is published when a new message is received or sent. A map of the form:
     * { dest_id: <chatee_id>,
     *   dest_name: <chatee_name>,
     *   sender_id: <sender_id>,
     *   msg_text: <message_content>
     * }
     * is provided as data.
     *
     * *spa-listchange - This is published when the list of online people
     * changes in length.
     *
     * *spa-updatechat - This is published when a new message is received or sent. A map of the form:
     *                   { dest_id: <chatee_id>,
     *                     dest_name: <chatee_name>,
      *                    sender_id: <sender_id>,
     *                     msg_text: <message_content>
     *                   }
     * A subscriber to this event should get the people_db from the people
     * model for the update data.
     */
    chat = (function(){
        var _publish_listchange, _update_list, _leave_chat, join_chat,
            _publish_updatechat, get_chatee, send_msg, set_chatee, update_avatar;

        var chatee = null;

        // avatar_update_map should have the form:
        // { person_id: <string>, css_map: {
        //   top: <int>, left: <int>, 'background-color': <string>
        // }};
        update_avatar = function(avatar_update_map){
            var sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
            if (sio){
                sio.emit('updateavatar', avatar_update_map)
            }
        };

        // Begin internal methods
        _update_list = function(arg_list){
            var i, person_map, make_person_map, people_list = arg_list[0];
            var is_chatee_online = false;

            clearPeopleDb();

            PERSON:
            for (i=0;i<people_list.length;i++){
                person_map = people_list[i];
                if (!person_map.name){ continue PERSON };

                // if user defined, update css_map and skip remainder
                if (stateMap.user && stateMap.user.id === person_map._id){
                    stateMap.user.css_map = person_map.css_map;
                    continue PERSON;
                }

                make_person_map = {
                    cid: person_map._id,
                    css_map: person_map.css_map,
                    id: person_map._id,
                    name: person_map.name
                };

                if ( chatee && chatee.id === make_person_map.id ){
                    is_chatee_online = true
                }

                makePerson(make_person_map);
            }
            stateMap.people_db.sort('name');
            // If chatee is no longer online, we unset the chatee which triggers the 'spa-setchatee' global event
            if ( chatee && !is_chatee_online ){
                set_chatee('')
            }
        };

        _publish_listchange = function(arg_list){
            _update_list(arg_list);
            $.gevent.publish('spa-listchange', [arg_list]);
        };
        // End internal methods

        _publish_updatechat = function(arg_list){
            var msg_map = arg_list[0];

            if (!chatee){
                set_chatee(msg_map.sender_id)
            }else if ( msg_map.sender_id !== stateMap.user.id && msg_map.sender_id !== chatee.id ){
                set_chatee(msg_map.sender_id)
            }

            $.gevent.publish('spa-updatechat', [msg_map])
        };


        _leave_chat = function(){
            var sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
            chatee = null;
            stateMap.is_connected = false;
            if (sio){
                sio.emit('leavechat');
            }
        };

        get_chatee = function(){
            return chatee
        };

        join_chat = function(){
            var sio;

            if (stateMap.is_connected){
                return false
            }
            if (stateMap.user.get_is_anon()){
                console.warn('User must be defined before joining chat');
                return false
            }

            sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
            sio.on('listchange', _publish_listchange);
            sio.on('updatechat', _publish_updatechat);
            stateMap.is_connected = true;
            return true
        };

        send_msg = function(msg_text){
            var msg_map;
            var sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();

            if (!sio){
                return false
            }

            if (!(stateMap.user && chatee)){
                return false
            }

            msg_map = {
                dest_id: chatee.id,
                dest_name: chatee.name,
                sender_id: stateMap.user.id,
                msg_text: msg_text
            };

            // we published updatechat so we can show our outgoing messages
            _publish_updatechat([msg_map]);
            sio.emit('updatechat', msg_map);

            return true
        };

        set_chatee = function(person_id){
            var new_chatee;
            new_chatee = stateMap.people_cid_map[person_id];
            if (new_chatee){
                if (chatee && chatee.id === new_chatee.id){
                    return false
                }
            }else{
                new_chatee = null
            }

            $.gevent.publish('spa-setchatee', {
                old_chatee: chatee,
                new_chatee: new_chatee
            });
            chatee = new_chatee;
            return true
        };

        return {
            _leave: _leave_chat,
            get_chatee: get_chatee,
            join: join_chat,
            send_msg: send_msg,
            set_chatee: set_chatee,
            update_avatar: update_avatar
        }
    }());

    makePerson = function(person_map){
        var person;
        var cid = person_map.cid;
        var css_map = person_map.css_map;
        var id = person_map.id;
        var name = person_map.name;

        if (cid === undefined || !name){
            throw 'client id and name required'
        }

        person = Object.create(personProto);
        person.cid = cid;
        person.name = name;
        person.css_map = css_map;

        if (id){
            person.id = id
        }

        stateMap.people_cid_map[cid] = person;
        stateMap.people_db.insert(person);

        return person
    };

    removePerson = function(person){
        if (!person){ return false }
        // can't remove anonymous person
        if (person.id === configMap.anon_id){
            return false
        }

        stateMap.people_db({cid: person.cid}).remove();
        if (person.cid){
            delete stateMap.people_cid_map[person.cid]
        }
        return true
    };

    /*people = {
        get_db: function(){ return stateMap.people_db },
        get_cid_map: function(){ return stateMap.people_cid_map }
    };*/
    people = (function(){
        var get_by_cid, get_db, get_user, login, logout;

        get_by_cid = function(cid){
            return stateMap.people_cid_map[cid]
        };

        get_db = function(){
            return stateMap.people_db
        };

        get_user = function(){ return stateMap.user };

        login = function(name){
            var sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();

            stateMap.user = makePerson({
                cid: makeCid(),
                css_map: {top: 25, left: 25, 'background-color': '#8f8'},
                name: name
            });

            sio.on('userupdate', completeLogin);

            sio.emit('adduser', {
                cid: stateMap.user.cid,
                css_map: stateMap.user.css_map,
                name: stateMap.user.name
            })
        };

        logout = function(){
            var is_removed, user = stateMap.user;
            // when we add chat, we should leave the chatroom here

            chat._leave();
            is_removed = removePerson(user);
            stateMap.user = stateMap.anon_user;

            $.gevent.publish('spa-logout', [user]);
            return is_removed
        };

        return {
            get_by_cid: get_by_cid,
            get_db: get_db,
            get_user: get_user,
            login: login,
            logout: logout
        }
    }());

    initModule = function(){
        //var i, people_list, person_map;

        // initialize anonymous person
        stateMap.anon_user = makePerson({
            cid: configMap.anon_id,
            id: configMap.anon_id,
            name: 'anonymous'
        });
        stateMap.user = stateMap.anon_user;

    };

    return {
        initModule: initModule,
        people: people,
        chat: chat
    }
}());
