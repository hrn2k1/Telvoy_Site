/* lib/mailee.js
 *
 * Reads unread mails from imap inbox defined in config.js.
 * Checks if sender is an user in SqERL and parses email
 * sender, subject, body and image attachment to new whatshot
 * item poster, title, body and image respectively. Mails
 * are then marked as read. This is currently run from app.js
 * peridiocally.
 */



var fs = require('fs');
var inspect = require('util').inspect;
var config = require('./config.js');
var dao=require('./dataaccess.js');
var mimelib = require("mimelib-noiconv");
var utility=require('./utility.js');
var querystring = require("querystring");

var debug = config.IS_DEBUG_MODE;






var http = require("http");
var url = require("url");
var fs = require('fs');


process.on('uncaughtException', function (err) {
    fs.writeFile("test.txt",  err, "utf8");    
})
http.createServer(function(request, response) {
    var uri = url.parse(request.url).pathname;

    if(debug==true)
    {
        utility.log('Requested URL: '+request.url);
        utility.log('Requested Query String: '+ url.parse(request.url).query);
    }
    //console.log(request.url);
    if (uri.toLowerCase() === "/conf") {
        var query = url.parse(request.url).query;
        var params=querystring.parse(query);
          dao.getInvitations(response,utility.Nullify(params['userID']),utility.Nullify(params['id']));
         
    }
    
    else if (uri.toLowerCase() === "/notif") {
        utility.log(request.url);
        dao.getNotifications(response);
        
    } 
    else if (uri.toLowerCase() === "/user") {
        var query = url.parse(request.url).query;
        var user=querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        //utility.log(user);
        dao.insertUser(response,utility.Nullify(user['userID']),utility.Nullify(user['deviceID']),utility.Nullify(user['firstName']),utility.Nullify(user['lastName']),utility.Nullify(user['phoneNo']),utility.Nullify(user['masterEmail']),utility.Nullify(user['password']),utility.Nullify(user['location']) );
        
    }
    //
    else if (uri.toLowerCase() === "/register") {
        var query = url.parse(request.url).query;
        var user=querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        //console.log(u);
        dao.insertPushURL(response,utility.Nullify(user['handle']),utility.Nullify(user['userID']));
        
    }
    else if(uri.toLowerCase() === "/setremainder") {
        var query = url.parse(request.url).query;
        var user=querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        //console.log(u);
        dao.setRemainder(response,utility.isNull(user['userID'],''),utility.isNull(user['remainder'],10));
        
    }
    else if(uri.toLowerCase() === "/getregister") {
        var query = url.parse(request.url).query;
        var user=querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        //console.log(u);
        dao.getRemainderTime(response,utility.isNull(user['userID'],''));
        
    }
    else if (uri.toLowerCase() === "/addemail") {
        var query = url.parse(request.url).query;
        var user=querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        utility.log(user);
        // dao.insertEmailAddress(response,utility.Nullify(user['userID']),utility.Nullify(user['emailID']));
        dao.insertEmailAddress(response,utility.Nullify(user['userID']),utility.Nullify(user['emailID']));
    }
    else if (uri.toLowerCase() === "/removeemail") {
        var query = url.parse(request.url).query;
        var user=querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        //console.log(u);
        dao.deleteEmailAddress(response,utility.Nullify(user['userID']),utility.Nullify(user['emailID']));
        
    }
    else if (uri.toLowerCase() === "/editemail") {
        var query = url.parse(request.url).query;
        var user=querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        //console.log(u);
        dao.updateEmailAddress(response,utility.Nullify(user['userID']),utility.Nullify(user['oldEmailID']),utility.Nullify(user['newEmailID']));
        
    }
    else if (uri.toLowerCase() === "/getemail") {
        var query = url.parse(request.url).query;
        var user=querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        //console.log(u);
        dao.getEmailAddresses(response,utility.Nullify(user['userID']));
        
    }
    else if (uri.toLowerCase() === "/eac") {
        var query = url.parse(request.url).query;
        var params=querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        //console.log(params);
        dao.VerifiedEmailAddress(response,utility.isNull(params['_id'],'0000000'),utility.isNull(params['e'],'empty@empty.empty'));
        
    }
    else if (uri.toLowerCase() === "/addcalllog") {
        var query = url.parse(request.url).query;
        var user=querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        //console.log(u);
        dao.insertCallLog(response,utility.Nullify(user['userID']),new Date(Date.parse(utility.isNull(user['startTime'],''))),new Date(Date.parse(utility.isNull(user['endTime'],''))),utility.Nullify(user['callNo']));
        
    }
    else if (uri.toLowerCase() === "/toll") {
        var query = url.parse(request.url).query;
        var user=querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        //console.log(u);

        dao.getTollNo(response,utility.isNull(user['area'],''),utility.isNull(user['dialInProvider'],'WebEx'));
        
    }
    else if (uri.toLowerCase() === "/credit") {
        var query = url.parse(request.url).query;
        var user=querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        //console.log(u);

        dao.getCreditBalance(response,utility.Nullify(user['userID']));
        
    }
    else if(uri.toLowerCase()=="/deductcredit")
    {

        var query = url.parse(request.url).query;
        var user=   querystring.parse(query);
        dao.deductCreditBalance(response,utility.Nullify(user['userID']));
    }
    else if(uri.toLowerCase()=="/config")
    {
              utility.log('Showing Configuration Settings');
              response.setHeader("content-type", "text/plain");
              response.write(JSON.stringify(config));
              response.end();
    }
    else if(uri.toLowerCase()=="/log")
    {
        fs.readFile("../../LogFiles/Application/index.html" ,function(error,data){
            if(error){
               response.writeHead(404,{"Content-type":"text/plain"});
               response.end("Sorry the page was not found"+error);
            }else{
               response.writeHead(202,{"Content-type":"text/html"});
               response.end(data);

            }
        });
    }
    else if(uri.toLowerCase()=="/adddialinnumbers")
    {
        fs.readFile("crm/DialInNumbers.html" ,function(error,data){
            if(error){
               response.writeHead(404,{"Content-type":"text/plain"});
               response.end("Sorry the page was not found"+error);
            }else{
               response.writeHead(202,{"Content-type":"text/html"});
               response.end(data);

            }
        });
    }
    else if (uri.toLowerCase() === "/adddialinnumbersaction") {
        var query = url.parse(request.url).query;
       
        var user = querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        

        dao.AddDialInNumbersAction(response,utility.isNull(user['area'],''),utility.isNull(user['number'],''),utility.isNull(user['provider'],'WebEx'));
        
    }
    else if(uri.toLowerCase() === "/dialinnumbers") {
        var query = url.parse(request.url).query;
        var user = querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        console.log(user);

        dao.getDialInNumbers(response);
    }
    else if(uri.toLowerCase() === "/deletenumber") {
        var query = url.parse(request.url).query;
        var user = querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        console.log(user);

        dao.deleteDialInNumber(response,utility.isNull(user['_id'],'0'));
    }    
    else if(RightString(uri,3).toLowerCase()=="txt"){
         //console.log(RightString(uri,3));
         fs.readFile("../../LogFiles/Application"+uri ,function(error,data){
       if(error){
           response.writeHead(404,{"Content-type":"text/plain"});
           response.end("Sorry the page was not found"+error);
       }else{
           response.writeHead(202,{"Content-type":"text/plain"});
           response.end(data);

       }
        });
    }
    ///addcalendarevent?subject=meeting2&startTime=2014-01-26 15:00:00 PM&&endTime=2014-01-26 15:30:00 PM&organizarName=Imtaz&organizarEmail=imtiaz@live.com&attendeesName=rabbi,harun&attendeesEmail=rabbi@live.com,harun@live.com&accountName=harun&accountKind=public&location=dhaka&status=active&isPrivate=true&isAllDayEvent=false
    else if (uri.toLowerCase() === "/addcalendarevent") {
        // var query = url.parse(request.url).query;
        // var params=querystring.parse(query);
        // utility.log(params);

         var requestBody = '';
            request.on('data', function(data) {
              requestBody += data;
              if(requestBody.length > 1e7) {
                response.end('');
              }
            });

            request.on('end', function() {
                var formData = querystring.parse(requestBody);
                console.log('form post data');
                console.log(formData);
                dao.insertCalendarEvent(response,utility.isNull(formData['subject'],'[no subject]'),utility.isNull(formData['details'],''),utility.isNull(formData['startTime'],''),utility.isNull(formData['endTime'],''),utility.isNull(formData['organizarName'],''),utility.isNull(formData['organizarEmail'],''),utility.isNull(formData['attendeesName'],''),utility.isNull(formData['attendeesEmail'],''),utility.isNull(formData['accountName'],''),utility.isNull(formData['accountKind'],''),utility.isNull(formData['location'],''),utility.isNull(formData['status'],''),utility.isNull(formData['isPrivate'],false),utility.isNull(formData['isAllDayEvent'],false));
            });
        }
    else {
        response.setHeader("content-type", "text/plain");
        response.write(JSON.stringify(url.parse(request.url)));
        response.end();
    }
}).listen(process.env.port || 8080);

function RightString(str, n){
        if (n <= 0)
        return "";
        else if (n > String(str).length)
        return str;
        else {
        var intLen = String(str).length;
        return String(str).substring(intLen, intLen - n);
            }
}

function replaceAll(find, replace, str) {
  return str.replace(new RegExp(find, 'g'), replace);
}

