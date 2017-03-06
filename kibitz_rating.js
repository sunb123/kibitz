// 'use strict';

// POST
// payload has 'rating' as key to rating value.

// throw error if no session cookie provided


// TODO: provide API call (to backend) to determine if user is logged in.

/*
    item_id
    login_api
    get_api
    post_api

    session cookie field?

*/


$(document).ready(function() {
    $( "[kibitz-rating]" ).each(function(){
        var item_id = $(this).attr("item-id")
        var login_api = $(this).attr("login-api")
        var session_cookie_field = $(this).attr("session-cookie-field")
        var get_api = $(this).attr("get-api")
        var get_val;

        $.ajax({
            method: 'GET',
            url: login_api,
            dataType: 'json',
            xhrFields: {
                withCredentials: true
            },
            success: function(data, status){
                console.log(data)
            },
            error: function(data, status){
                console.log(data, status);
            },
        });

        $.ajax({
            method: 'GET',
            url: get_api,
            dataType: 'json',
            data: {
                item_id: item_id
            },
            xhrFields: {
                withCredentials: true
            },
            success: function(data, status){
                get_val = data
                alert(get_val.message)
                console.log(get_val)
            },
            error: function(data, status){
                console.log(data, status);
            },
        });

        $(this).val(get_val) // set value to get return value
    });

    $( "[kibitz-rating]" ).on( "change", function() {
        var item_id = $(this).attr("item-id")
        var login_api = $(this).attr("login-api")
        var session_cookie_field = $(this).attr("session-cookie-field")
        var post_api = $(this).attr("post-api")
        var rating_val = $(this).val()

        $.ajax({
            method: 'POST',
            url: post_api,
            dataType: 'json',
            xhrFields: {
                withCredentials: true
            },
            data: {
                rating: rating_val,
                item_id: item_id,
            },
            success: function(data, status){
                alert(data.message)
                console.log(data, status);
            },
            error: function(data, status){
                console.log(data, status);
            },
        });
    });

});