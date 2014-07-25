var fs = require('fs');
var inspect = require('util').inspect;
var config = require('./config.js');
var dao=require('./dataaccess.js');
var mimelib = require("mimelib-noiconv");
var utility=require('./utility.js');
var querystring = require("querystring");
var MongoClient = require('mongodb').MongoClient;
var mongo = require('mongodb');
var debug = config.IS_DEBUG_MODE;


var http = require("http");
var url = require("url");
var fs = require('fs');

var Sessions = require("sessions"), sessionHandler = new Sessions(); // memory store by default


    function CheckSession(response,session,targetpage){
        utility.debug("CheckSession...");
        //console.log(session.get('username'));
        if(session.get('username')==null){
           
            fs.readFile("crm/login.html" ,function(error,data){
                    if(error){
                       response.writeHead(404,{"Content-type":"text/plain"});
                       response.end("Sorry the page was not found"+error);
                    }else{
                       response.writeHead(202,{"Content-type":"text/html"});
                       response.end(data);

                    }
                });
        }
        else{
            utility.debug("SessionID : "+ session.uid());
            fs.readFile(targetpage ,function(error,data){
            if(error){
                response.writeHead(404,{"Content-type":"text/plain"});
                response.end("Sorry the page was not found"+error);
            }else{
                response.writeHead(202,{"Content-type":"text/html"});
                response.end(data);

            }
            });  
        }
    }

process.on('uncaughtException', function (err) {
    //fs.writeFile("test.txt",  err, "utf8");   
     fs.appendFile("siteerrorlog.txt", (new Date()).toISOString()+'>>'+ err+"   ", "utf8");   
});

mongo.MongoClient.connect(config.MONGO_CONNECTION_STRING, function(err, connection) {
   if(err) {
      utility.log('database connection error: '+err,'ERROR');
    
  }
else{

http.createServer(function(request, response) {
    var uri = url.parse(request.url).pathname;

   /* http.get(config.THREAD_SITE_URL+'/ping',function(res){
        //utility.log("parser is running.");
    }).on('error',function(e){
         utility.log("parser is not running. Error: "+e);
    });*/
    utility.log('Requested URL: '+request.url +' '+ url.parse(request.url).query);
      

    //console.log('Session module');
    //console.log(new Sessions());
     sessionHandler.httpRequest(request, response,function(err, session){
        //console.log(err);
        //console.log(session);

        if (err) {
        return res.end("session error");
        }

        

        //response.end(request.url);
     //session.set('user','hArUn');
   
     //console.log(session);
    //console.log(request.url);
    if(uri.toLowerCase()=="/login")
            {
                
                fs.readFile("crm/login.html" ,function(error,data){
                    if(error){
                       response.writeHead(404,{"Content-type":"text/plain"});
                       response.end("Sorry the page was not found"+error);
                    }else{
                       response.writeHead(202,{"Content-type":"text/html"});
                       response.end(data);

                    }
                });
            }
    else if(RightString(uri,4).toLowerCase()==".log"){
         //console.log(RightString(uri,3));
         fs.readFile(__dirname+uri  ,function(error,data){
       if(error){
           response.writeHead(404,{"Content-type":"text/plain"});
           response.end("Sorry the page was not found"+error);
       }else{
           response.writeHead(202,{"Content-type":"text/plain"});
           response.end(data);

       }
        });
    }
    else if(uri.toLowerCase()=="/logo")
            {
                
                fs.readFile("crm/telvoy.png" ,function(error,data){
                    if(error){
                       response.writeHead(404,{"Content-type":"text/plain"});
                       response.end("Sorry the page was not found"+error);
                    }else{
                       response.writeHead(202,{"Content-type":"image/png"});
                       response.end(data);

                    }
                });
            }
    else if(uri.toLowerCase()=="/country.js")
            {
                
                fs.readFile("crm/country.js" ,function(error,data){
                    if(error){
                       response.writeHead(404,{"Content-type":"text/plain"});
                       response.end("Sorry the page was not found"+error);
                    }else{
                       response.writeHead(202,{"Content-type":"text/javascript"});
                       response.end(data);

                    }
                });
            }
     else if(uri.toLowerCase()=="/tablesorter.js")
            {
                
                fs.readFile("crm/tablesorter.js" ,function(error,data){
                    if(error){
                       response.writeHead(404,{"Content-type":"text/plain"});
                       response.end("Sorry the page was not found"+error);
                    }else{
                       response.writeHead(202,{"Content-type":"text/javascript"});
                       response.end(data);

                    }
                });
            }       
    else if(uri.toLowerCase()=="/logout")
            {
                session.set('username',null);
                fs.readFile("crm/login.html" ,function(error,data){
                    if(error){
                       response.writeHead(404,{"Content-type":"text/plain"});
                       response.end("Sorry the page was not found"+error);
                    }else{
                       response.writeHead(202,{"Content-type":"text/html"});
                       response.end(data);

                    }
                });
            }
    else if(uri.toLowerCase()=="/admin")
            {
                CheckSession(response,session,"crm/admin.html")
            
            }
    else if (uri.toLowerCase() === "/authenticate") {
        var query = url.parse(request.url).query;
        var params=querystring.parse(query);
          dao.AuthenticateUser(response,connection,session,utility.isNull(params['username'],''),utility.isNull(params['pass'],''));
         
    }
     else if (uri.toLowerCase() === "/savelocation") {
        //utility.log('I am in /conf');
        var query = url.parse(request.url).query;
        var params=querystring.parse(query);
          dao.SaveUserLocation(response,connection,utility.Nullify(params['userID']),utility.Nullify(params['country']),utility.Nullify(params['city']));
         
    }
    else if (uri.toLowerCase() === "/getlocation") {
        //utility.log('I am in /conf');
        var query = url.parse(request.url).query;
        var params=querystring.parse(query);
          dao.getUserLocation(response,connection,utility.Nullify(params['userID']));
         
    }
    else if (uri.toLowerCase() === "/conf") {
        //utility.log('I am in /conf');
        var query = url.parse(request.url).query;
        var params=querystring.parse(query);
          dao.getInvitations(response,connection,utility.Nullify(params['userID']),utility.Nullify(params['id']));
         
    }
     else if(uri.toLowerCase()=="/sendtile"){
      var query = url.parse(request.url).query;
      var params=querystring.parse(query);
      dao.SendSelfTile(response, utility.isNull(params['handle'],''), utility.isNull(params['userID'],''), utility.isNull(params['subject'],''), utility.isNull(params['day'],''), utility.isNull(params['time'],''), utility.isNull(params['count'],'0'));
    }
     else if (uri.toLowerCase() === "/getsettings") {
                    //utility.log('I am in /conf');
                    var query = url.parse(request.url).query;
                    var params = querystring.parse(query);
                    dao.GetUserSettings(response, connection, utility.Nullify(params['userID']));
         
                }
    else if (uri.toLowerCase() === "/notif") {
        utility.log(request.url);
        dao.getNotifications(response,connection);
        
    } 
    else if (uri.toLowerCase() === "/user") {
        var query = url.parse(request.url).query;
        var user=querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        //utility.log(user);
        dao.insertUser(response,connection,utility.Nullify(user['userID']),utility.Nullify(user['deviceID']),utility.Nullify(user['firstName']),utility.Nullify(user['lastName']),utility.Nullify(user['phoneNo']),utility.Nullify(user['masterEmail']),utility.Nullify(user['password']),utility.Nullify(user['location']) );
        
    }
    //
    else if (uri.toLowerCase() === "/register") {
        var query = url.parse(request.url).query;
        var user=querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        //console.log(u);
        //dao.insertPushURL(response,connection,utility.Nullify(user['handle']),utility.Nullify(user['userID']));
        dao.insertPushURL(response,connection,utility.Nullify(user['handle']),utility.Nullify(user['userID']),utility.isNull(user['timeZone'],0));
      
    }
    else if(uri.toLowerCase() === "/setremainder") {
        var query = url.parse(request.url).query;
        var user=querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        //console.log(u);
        dao.setRemainder(response,connection,utility.isNull(user['userID'],''),utility.isNull(user['remainder'],10));
        
    }
    else if(uri.toLowerCase() === "/getregister") {
        var query = url.parse(request.url).query;
        var user=querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        //console.log(u);
        dao.getRemainderTime(response,connection,utility.isNull(user['userID'],''));
        
    }
    else if (uri.toLowerCase() === "/addemail") {
        var query = url.parse(request.url).query;
        var user=querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        utility.log(user);
        // dao.insertEmailAddress(response,connection,utility.Nullify(user['userID']),utility.Nullify(user['emailID']));
        dao.insertEmailAddress(response,connection,utility.Nullify(user['userID']),utility.Nullify(user['emailID']));
    }
    else if (uri.toLowerCase() === "/removeemail") {
        var query = url.parse(request.url).query;
        var user=querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        //console.log(u);
        dao.deleteEmailAddress(response,connection,utility.Nullify(user['userID']),utility.Nullify(user['emailID']));
        
    }
    else if (uri.toLowerCase() === "/editemail") {
        var query = url.parse(request.url).query;
        var user=querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        //console.log(u);
        dao.updateEmailAddress(response,connection,utility.Nullify(user['userID']),utility.Nullify(user['oldEmailID']),utility.Nullify(user['newEmailID']));
        
    }
    else if (uri.toLowerCase() === "/getemail") {
        var query = url.parse(request.url).query;
        var user=querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        //console.log(u);
        dao.getEmailAddresses(response,connection,utility.Nullify(user['userID']));
        
    }
    else if (uri.toLowerCase() === "/eac") {
        var query = url.parse(request.url).query;
        var params=querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        //console.log(params);
        dao.VerifiedEmailAddress(response,connection,utility.isNull(params['_id'],'0000000'),utility.isNull(params['e'],'empty@empty.empty'));
        
    }
    else if (uri.toLowerCase() === "/addcalllog") {
        var query = url.parse(request.url).query;
        var user=querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        //console.log(u);
        dao.insertCallLog(response,connection,utility.Nullify(user['userID']),new Date(Date.parse(utility.isNull(user['startTime'],''))),new Date(Date.parse(utility.isNull(user['endTime'],''))),utility.Nullify(user['callNo']));
        
    }
    else if (uri.toLowerCase() === "/toll") {
        var query = url.parse(request.url).query;
        var params=querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        //console.log(u);

        dao.getTollNo(response,connection,utility.isNull(params['meetingno'],''),utility.isNull(params['area'],''),utility.isNull(params['city'],''),utility.isNull(params['dialInProvider'],'WebEx'));
        
    }
    else if (uri.toLowerCase() === "/meetingtoll") {
        var query = url.parse(request.url).query;
        var params=querystring.parse(query);
        dao.getMeetingToll(response,connection,utility.isNull(params['meetingno'],''),utility.isNull(params['country'],''));
        
    }
    
    else if (uri.toLowerCase() === "/credit") {
        var query = url.parse(request.url).query;
        var user=querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        //console.log(u);

        dao.getCreditBalance(response,connection,utility.Nullify(user['userID']));
        
    }
    else if(uri.toLowerCase()=="/deductcredit")
    {

        var query = url.parse(request.url).query;
        var user=   querystring.parse(query);
        dao.deductCreditBalance(response,connection,utility.Nullify(user['userID']));
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
        CheckSession(response,session,"crm/DialInNumbers.html");
        // fs.readFile("crm/DialInNumbers.html" ,function(error,data){
        //     if(error){
        //        response.writeHead(404,{"Content-type":"text/plain"});
        //        response.end("Sorry the page was not found"+error);
        //     }else{
        //        response.writeHead(202,{"Content-type":"text/html"});
        //        response.end(data);

        //     }
        // });
    }
    else if (uri.toLowerCase() === "/adddialinnumbersaction") {
        var query = url.parse(request.url).query;
       
        var user = querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        

        dao.AddDialInNumbersAction(response,connection,utility.isNull(user['area'],''),utility.isNull(user['city'],''),utility.isNull(user['number'],''),utility.isNull(user['provider'],'WebEx'));
        
    }
    else if(uri.toLowerCase() === "/dialinnumbers") {
        var query = url.parse(request.url).query;
        var user = querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        utility.log(user);

        dao.getDialInNumbers(response,connection);
    }
    else if(uri.toLowerCase() === "/deletenumber") {
        var query = url.parse(request.url).query;
        var user = querystring.parse(query);
        //var u=utility.Nullify(user['u']);
        utility.log(user);

        dao.deleteDialInNumber(response,connection,utility.isNull(user['_id'],'0'));
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
                utility.log('form post data');
                utility.log(formData);
                dao.insertCalendarEvent(response,connection,utility.isNull(formData['subject'],'[no subject]'),utility.isNull(formData['details'],''),utility.isNull(formData['startTime'],''),utility.isNull(formData['endTime'],''),utility.isNull(formData['organizarName'],''),utility.isNull(formData['organizarEmail'],''),utility.isNull(formData['attendeesName'],''),utility.isNull(formData['attendeesEmail'],''),utility.isNull(formData['accountName'],''),utility.isNull(formData['accountKind'],''),utility.isNull(formData['location'],''),utility.isNull(formData['status'],''),utility.isNull(formData['isPrivate'],false),utility.isNull(formData['isAllDayEvent'],false));
            });
        }

        //////////////////////////
        else if(uri.toLowerCase()=="/pinlessinvitations")
            {
                dao.getPinlessInvitation(response,connection);
            }
        else if(uri.toLowerCase()=="/getpin")
            {
                var query = url.parse(request.url).query;
                var params = querystring.parse(query);
                //var u=utility.Nullify(user['u']);
                //console.log(params);
                dao.getPinOfInvitation(response,connection,utility.isNull(params['meetingno'],''));
            }
        else if(uri.toLowerCase()=="/setpin")
            {
                var query = url.parse(request.url).query;
                var params = querystring.parse(query);
                //var u=utility.Nullify(user['u']);
                //console.log(params);
                dao.updatePIN(response,connection,utility.isNull(params['_id'],''),utility.isNull(params['pin'],''));
            }
        else if(uri.toLowerCase()=="/assignpin")
            {
                CheckSession(response,connection,session,"crm/assignpin.html");
                // console.log('Session.....');
                // console.log(session.uid()+" >> "+session.get('userid'));
                // fs.readFile("crm/assignpin.html" ,function(error,data){
                //     if(error){
                //        response.writeHead(404,{"Content-type":"text/plain"});
                //        response.end("Sorry the page was not found"+error);
                //     }else{
                //        response.writeHead(202,{"Content-type":"text/html"});
                //        response.end(data);

                //     }
                // });
            }
        /////////////////////////
    else {
        response.setHeader("content-type", "text/plain");
        response.write(JSON.stringify(url.parse(request.url)));
        response.end();
    }
    });
}).listen(process.env.port || 8080);
}
});
sessionHandler.on("expired", function (uid) {
utility.debug("Session ID: %s ! expired", uid);
});

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

