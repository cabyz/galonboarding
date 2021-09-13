let base_url = 'http://localhost:3001/';
let user = {};
let business = "299570274432519";
/******************************************************************
* Loading SDK
******************************************************************/
window.fbAsyncInit = function() {
    FB.init({
        appId   : '419849085936757',
        oauth   : true,
        status  : true, // check login status
        cookie  : true, // enable cookies to allow the server to access the session
        xfbml   : true, // parse XFBML
        version : 'v8.0'
    });
};

/******************************************************************
* Login function
******************************************************************/
function fb_login() {
    //$("#loading").css({'display':'flex'});
    FB.login(function(response) {
        if (response.authResponse) {
            user.token = response.authResponse.accessToken;
            user.fid = response.authResponse.userID;
            check_permissions();
        }else {
            $("#loading").css({'display':'none'});
            console.log('Request is canceled.');
        }
    },{ scope: 'pages_show_list,public_profile,business_management'});
}
(function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/all.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

/******************************************************************
* Check permissions
******************************************************************/
function check_permissions(){
    var declined = 0;
    FB.api("/"+user.fid+"/permissions", function (permissions) {
        if (permissions && !permissions.error) {
            perms = permissions['data'];
            perms.forEach(function(entry) {
                if(entry.status == 'declined'){
                    declined = 1;
                }
            });
            if(declined != 1){
                get_user_data();
                get_client_pages();
            }else{
                console.log('Please accept all the permissions.');
                FB.api('/me/permissions', 'DELETE', function(response) {
                    location.reload();
                });
            }
        }
    });
}

/******************************************************************
* Get user data and subscribe pages to app
******************************************************************/
function get_user_data(){
    FB.api("/me", {fields: 'id,name,email'}, function (response) {
        if(typeof response.email == 'undefined'){
            user.email = null;
        }else{
            user.email = response.email;
        }
        user.fid = response.id;
        user.name = response.name;

        FB.api('/me/accounts',function(response){
            var pages = response.data;
            user.pages = [];

            $("#app").html('');
            $("#app").html('<div class="wrapper"><h2>Hi, ' +user.name+'</h2><p>Select and give access to any of the following pages.</p><div id="select-pages"></div></div>');

            for(i=0, len = pages.length; i < len; i++){
                var page = pages[i];
                user.pages.push(page);

                if( check_page(page.id) ){
                    var btn = '<button disabled="disabled" style="width: 115px;">Granted</button>';
                }else{
                    var btn = '<button data-id="'+page.id+'" data-name="'+page.name+'" data-token="'+page.access_token+'">Grant access</button>';
                }

                $("#app #select-pages").append('<p><span>'+page.name+'</span><span>'+btn+'</span></p>');
            }
            $("#loading").css({'display':'none'});
        });
    });
}

$(document).on('click', '#select-pages button', function() {
    //$("#loading").css({'display':'flex'});
    var page = {
        id: $(this).attr('data-id'),
        name: $(this).attr('data-name'),
        token: $(this).attr('data-token'),
    }

    if (confirm('Are you sure you want to grant page access to Generate Agent Leads?')) {
        grant_access(page);
    } else {
        $("#loading").css({'display':'none'});
    }
});

function grant_access(page){
    FB.api('/'+business+'/client_pages', 'post',
        {
            page_id: page.id,
            permitted_tasks: ['MANAGE', 'CREATE_CONTENT', 'MODERATE', 'ADVERTISE', 'ANALYZE'],
            access_token: user.token,
        },
        function(response){
            if(response.hasOwnProperty('access_status')){
                if(response.access_status == "CONFIRMED"){
                    $("#loading").css({'display':'none'});
                    alert(page.name+' page access is granted successfully.');
                    get_client_pages();
                    get_user_data();
                }
            }
        }
    );
}

function get_client_pages(){
    FB.api('/'+business+'/client_pages',function(response){
        user.granted = response.data; 
    });
}

function check_page(page_id){
    var found = false;
    if(user.granted){
    for(var i = 0; i < user.granted.length; i++) {
        if (user.granted[i].id == page_id) {
            found = true;
            break;
        }
    }
    }
    return found;
}

/******************************************************************
* Send data to API for storage
******************************************************************/
function save_data(){
    user.box_fk = 'random-box-fk';
    user.api_key = 'random-api-key';
    user.api_user = 'random-api-user';
    user.location_box_fk = 'random-location-box-fk';

    $.post(base_url+"app/save",{ data: user },
        function(data, status){
            console.log(data);
        }
    );
    return true;
}

/******************************************************************
* Subscribe all user Facebook pages for Leads
******************************************************************/
function subscribe(page_id, page_name, token){
    FB.api('/'+page_id+'/subscribed_apps', 'post',
    {
        access_token: token,
        subscribed_fields: 'leadgen'
    },
    function(response){
        return true;
    });
}
