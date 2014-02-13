
var config=require('./config.js');
var utility=require('./utility.js');
var mongo = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var monk = require('monk');
 var mailer= require('./mailsender.js');
 var parser=require('./parser.js');
 var mimelib = require("mimelib-noiconv");
 var BSON = require('mongodb').BSONPure;
var fs = require('fs');


function getMeetingToll(response,meetingno,country){
  mongo.MongoClient.connect(config.MONGO_CONNECTION_STRING, function(err, connection) {
   var collection = connection.collection('MeetingTolls');
  collection.findOne({MeetingID:meetingno,Country:country}, function(error, result) {
    if(error){
      utility.log("Error in find MeetingTolls : "+error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write('{\"Status\":\"Unsuccess\"}');
      response.end();
      connection.close();
    }
    else{
      utility.log('Meeting Toll for MeetingID: '+meetingno+' and country: '+country);
      console.log(result);
      response.setHeader("content-type", "text/plain");
      response.write(JSON.stringify(result));
      response.end();
      connection.close();
    }
  });
});
}

function AuthenticateUser(response,session,username,pass){
 
 mongo.MongoClient.connect(config.MONGO_CONNECTION_STRING, function(err, connection) {
   var collection = connection.collection('Logins');
  collection.findOne({UserName:username,Password:pass}, function(error, result) {
    if(error){
      utility.log("Error in find logins : "+error,'ERROR');
      response.setHeader("content-type", "application/json");
      response.write('{\"Status\":\"Internal Server Error. Please try again.\"}');
      response.end();
    }
    else{
          if(result !=null){
            session.set('username',username);
            utility.log("AuthenticateUser OK.");
            response.setHeader("content-type", "application/json");
            response.write('{\"Status\":\"Success\"}');
            response.end();
          }
          else{
            utility.log("AuthenticateUser Failed.");
            response.setHeader("content-type", "application/json");
            response.write('{\"Status\":\"User name or password is wrong. Please try again.\"}');
            response.end();
          }

    }

  });
});
 

}

function getRemainderTime(response,userID)
{
 
  var entity = {
    "UserID": userID
  };
mongo.MongoClient.connect(config.MONGO_CONNECTION_STRING, function(err, connection) {
   var collection = connection.collection('Registrations');
  collection.findOne(entity, function(error, result) {
    if(error)
    {
      utility.log("getRemainderTime() error: " + error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write('{\"Status\":\"Unsuccess\"}');
      response.end();
      connection.close();
    }
    else
    {
      utility.log(result);
      response.setHeader("content-type", "text/plain");
      response.write(JSON.stringify(result));
      response.end();
      connection.close();
    }
  });
});
}
function setRemainder(response,userID,remainder){
 
  
 var entity_update = {
   "RemainderMinute": remainder,
   "TimeStamp": new Date()
 };
mongo.MongoClient.connect(config.MONGO_CONNECTION_STRING, function(err, connection) {
   var collection = connection.collection('Registrations');
 collection.update({"UserID":userID}, {$set:entity_update}, function(error, result){
        if(error)
        {
          utility.log("setRemainder() error: " + error,'ERROR');
          response.setHeader("content-type", "text/plain");
          response.write('{\"Status\":\"Unsuccess\"}');
          response.end();
          connection.close();
        }
        else
        {
          utility.log("Set Remainder Successfully");
          response.setHeader("content-type", "text/plain");
          response.write('{\"Status\":\"Success\"}');
          response.end();
          connection.close();
        }
        
      });
});
}

function insertPushURL(response,url,userID){
  
  var entity_insert = {
   "Handle":url,
   "UserID":userID,
   "RemainderMinute": 10,
   "TimeStamp": new Date()
 };
 var entity_update = {
   "Handle":url,
   "TimeStamp": new Date()
 };
 mongo.MongoClient.connect(config.MONGO_CONNECTION_STRING, function(err, connection) {
  var collection = connection.collection('Registrations');
 collection.findOne({"UserID":userID}, function(error, result) {
  if(error)
  {
    utility.log("getUser() error: " + error,'ERROR');
    response.setHeader("content-type", "text/plain");
    response.write('{\"Status\":\"Unsuccess\"}');
    response.end();
    connection.close();
  }
  else
  {
    if(result == null)
    {

      collection.insert(entity_insert, function(error, result){
        if(error)
        {
          utility.log("insertPushURL() error: " + error,'ERROR');
          response.setHeader("content-type", "text/plain");
          response.write('{\"Status\":\"Unsuccess\"}');
          response.end();
          connection.close();
        }
        else
        {
          utility.log("Push URL inserted Successfully");
          response.setHeader("content-type", "text/plain");
          response.write('{\"Status\":\"Success\"}');
          response.end();
          connection.close();
        }
      });
    }
    else
    {
      collection.update({"UserID":userID}, {$set:entity_update}, function(error, result){
        if(error)
        {
          utility.log("updateRegister() error: " + error,'ERROR');
          response.setHeader("content-type", "text/plain");
          response.write('{\"Status\":\"Unsuccess\"}');
          response.end();
          connection.close();
        }
        else
        {
          utility.log("Push URL Updated Successfully");
          response.setHeader("content-type", "text/plain");
          response.write('{\"Status\":\"Success\"}');
          response.end();
          connection.close();
        }
        
      });
    }
  }
});
});
}

function replaceAll(find, replace, str) {
  return str.replace(new RegExp(find, 'g'), replace);
}

function insertCalendarEvent(response,Subject,Details,StartTime,EndTime,OrganizarName,OrganizarEmail,AttendeesName,AttendeesEmail,AccountName,AccountKind,Location,Status,IsPrivate,IsAllDayEvent)
{


 var entity = {
   "Subject":Subject,
   "Details": Details,
   "StartTime":StartTime, 
   "EndTime":EndTime, 
   "OrganizarName":OrganizarName, 
   "OrganizarEmail":OrganizarEmail, 
   "AttendeesName":AttendeesName, 
   "AttendeesEmail":AttendeesEmail, 
   "AccountName":AccountName, 
   "AccountKind":AccountKind, 
   "Location":Location, 
   "Status":Status, 
   "IsPrivate":IsPrivate, 
   "IsAllDayEvent":IsAllDayEvent
 };

var addresses = mimelib.parseAddresses(replaceAll(';', ',', AttendeesEmail));
var out=parser.parseString(Details, ':', '\\n', true, false);
var invite_entity = {
                ToEmails : AttendeesEmail,
                FromEmail: OrganizarEmail,
                InvDate : StartTime,
                InvTime : StartTime,
                EndTime: EndTime,
                Subject: Subject,
                Toll: utility.isNull(out['toll'],''),
                PIN: utility.isNull(out['pin'],''),
                AccessCode: utility.isNull(out['code'],''),
                Password: utility.isNull(out['password'],''),
                DialInProvider:utility.isNull(out['provider'],''),
                TimeStamp: new Date(),
                Agenda:utility.isNull(out['agenda'],''),
                MessageID: ''
                };

mongo.MongoClient.connect(config.MONGO_CONNECTION_STRING, function(err, connection) {
  var collection = connection.collection('CalendarEvents'); 
 collection.insert(entity, function(error, result){
  if(error)
  {
    utility.log("insertCalendarEvent() error: " + error,'ERROR');
    response.setHeader("content-type", "text/plain");
    response.write('{\"Status\":\"Unsuccess\"}');
    response.end();
    connection.close();
  }
  else
  {

    utility.log("Calendar Event inserted Successfully");
    response.setHeader("content-type", "text/plain");
    response.write('{\"Status\":\"Success\"}');
    response.end();
    connection.close();
     insertInvitationEntity(invite_entity,addresses);
  }
});
});
}


/// User Creation Method Exposed here
//http://localhost:8080/user?userID=sumon@live.com&deviceID=1323809&firstName=Shams&lastName=Sumon%20Bhai&phoneNo=0181256341&masterEmail=sumon@live.com&location=Magura
function insertUser(response,userID,deviceID,firstName,lastName,phoneNo,masterEmail,password,location)
{


 
  var insert_entity = {
    "UserID": userID,
    "DeviceID": deviceID,
    "FirstName": firstName,
    "LastName": lastName,
    "PhoneNo": phoneNo,
    "MasterEmail": masterEmail,
    "Password": "",
    "Location": location,
    "RegistrationTime": new Date(),
    "IsBlackListed": false
  };
  var update_entity = {
    "UserID": userID,
    "DeviceID": deviceID,
    "FirstName": firstName,
    "LastName": lastName,
    "PhoneNo": phoneNo,
    "MasterEmail": masterEmail,
    "Password": "",
    "Location": location
  };


  utility.log('User object to add');
  utility.log(insert_entity);
  mongo.MongoClient.connect(config.MONGO_CONNECTION_STRING, function(err, connection) {
  var collection = connection.collection('Users');
  collection.findOne({"UserID":userID}, function(error, result) {
    if(error)
    {
      utility.log("getUser() error: " + error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write('{\"Status\":\"Unsuccess\"}');
      response.end();
      connection.close();
    }
    else
    {
      if(result == null)
      {
        collection.insert(insert_entity, function(error, result){
          if(error)
          {
            utility.log("insertUser() error: " + error,'ERROR');
            response.setHeader("content-type", "text/plain");
            response.write('{\"Status\":\"Unsuccess\"}');
            response.end();
            connection.close();
          }
          else
          {
            AddMasterEmail(userID,userID);
            utility.log("Invitation inserted Successfully");
            response.setHeader("content-type", "text/plain");
            response.write('{\"Status\":\"Success\"}');
            response.end();
            connection.close();
          }
        });
      }
      else
      {
       collection.update({"UserID":userID}, {$set:update_entity}, function(error, result){
        if(error)
        {
          utility.log("updateUser() error: " + error,'ERROR');
          response.setHeader("content-type", "text/plain");
          response.write('{\"Status\":\"Unsuccess\"}');
          response.end();
          connection.close();
        }
        else
        {
          AddMasterEmail(userID,userID);
          utility.log("User Updated Successfully");
          response.setHeader("content-type", "text/plain");
          response.write('{\"Status\":\"Success\"}');
          response.end();
          connection.close();
        }
        
      });
     }
   }
 });
});
}

function AddMasterEmail(userID,emailID){

var entity = {
    "UserID": userID,
    "EmailID": emailID,
    "Verified": true
  };

  mongo.MongoClient.connect(config.MONGO_CONNECTION_STRING, function(err, connection) {
 var collection = connection.collection('EmailAddresses');
 collection.findOne({"UserID":userID,"EmailID":emailID},function(err,addr){
 if(err){
  utility.log('Email Addreess FindOne error: '+err,'ERROR');
   //connection.close();
  return;
 }
 else{
  if(addr==null){
    collection.insert(entity, function(error, result){
    if(error)
    {
      utility.log("insertEmailAddress() error: " + error,'ERROR');
      
      //connection.close();
      return;
    }
    else
    {
      utility.log("Email(s) inserted Successfully");

      //connection.close();
      return;
    }
  });
  }
 }
 });
});
}
function SendConfirmationEmail(id,email){

  var link=config.SITE_ROOT_URL+"/eac?e="+email+"&_id="+id;
      utility.log("Email Addreess Confirmation Link : "+link);
      var msg=config.EMAIL_ADDRESS_CONFIRMATION_BODY.replace('[LINK]',link);
      mailer.sendMail(config.EMAIL_ADDRESS_CONFIRMATION_SUBJECT,msg,email);
}
function VerifiedEmailAddress(response,id,email){

  var sid = BSON.ObjectID.createFromHexString(id);

  mongo.MongoClient.connect(config.MONGO_CONNECTION_STRING, function(err, connection) {
  var collection = connection.collection('EmailAddresses');
  // collection.findOne({ _id: sid}, function(error, result){
  collection.update({ _id: sid,EmailID:email}, {$set : {Verified: true} }, function(error,result){
  // collection.update(where, {$set:entity}, function(error,result){
    if(error)
    {
      utility.log("VerifiedEmailAddress() error: " + error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write('{\"Status\":\"Unsuccess\"}');
      response.end();
      connection.close();
    }
    else
    {
      console.log(result);
      if(result>0)
      {
      utility.log("VerifiedEmailAddress updated Successfully to true");

      fs.readFile("crm/emailverifyok.html" ,function(error,data){
            if(error){
               response.writeHead(404,{"Content-type":"text/plain"});
               response.end("Sorry the page was not found"+error);
            }else{
               response.writeHead(202,{"Content-type":"text/html"});
               response.end(data);

            }
        });

      // response.setHeader("content-type", "text/plain");
      // response.write('{\"Status\":\"Success\",\"Message\":\"Your Email Addreess '+ email +' Verified Successfully\"}');
      // response.end();
      connection.close();
      }
      else
      {
        utility.log("VerifiedEmailAddress not updated due to wrong info");
        fs.readFile("crm/emailverifyfail.html" ,function(error,data){
            if(error){
               response.writeHead(404,{"Content-type":"text/plain"});
               response.end("Sorry the page was not found"+error);
            }else{
               response.writeHead(202,{"Content-type":"text/html"});
               response.end(data);

            }
        });
        // response.setHeader("content-type", "text/plain");
        // response.write('{\"Status\":\"Unsuccess\",\"Message\":\"The link is incorrect or has been expired.\"}');
        // response.end();
        connection.close();
      }
    }
  });
});
}


// http://localhost:8080/addemail?userID=sumon@live.com&emailID=sumon3@live.com
//// Add method to add User's Other Emails 
function insertEmailAddress(response,userID,emailID)
{
 
  var entity = {
    "UserID": userID,
    "EmailID": emailID,
    "Verified": false
  };
mongo.MongoClient.connect(config.MONGO_CONNECTION_STRING, function(err, connection) {
 var collection = connection.collection('EmailAddresses');
  collection.insert(entity, function(error, result){
    if(error)
    {
      utility.log("insertEmailAddress() error: " + error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write('{\"Status\":\"Unsuccess\"}');
      response.end();
      connection.close();
    }
    else
    {
      utility.log("Email(s) inserted Successfully");

      SendConfirmationEmail(result[0]._id,result[0].EmailID);

      response.setHeader("content-type", "text/plain");
      response.write('{\"Status\":\"Success\"}');
      response.end();
      connection.close();
    }
  });
});
}


// http://localhost:8080/removeemail?userID=sumon@live.com&emailID=sumon3@live.com
//// Remove method to remove User's Other Emails
function deleteEmailAddress(response,userID,emailID)
{
  
  var entity = {
    "UserID": userID,
    "EmailID": emailID
  };
  mongo.MongoClient.connect(config.MONGO_CONNECTION_STRING, function(err, connection) {
  var collection = connection.collection('EmailAddresses');
  collection.remove(entity, function(error, result){
    if(error)
    {
      utility.log("deleteEmail() error: " + error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write('{\"Status\":\"Unsuccess\"}');
      response.end();
      connection.close();
    }
    else
    {
      utility.log("Email Address deleted Successfully");
      response.setHeader("content-type", "text/plain");
      response.write('{\"Status\":\"Success\"}');
      response.end();
      connection.close();
    }
  });
});
}

// http://localhost:8080/editemail?userID=sumon@live.com&oldEmailID=sumon4@live.com&newEmailID=sumon3@live.com
function updateEmailAddress(response,userID,oldEmailID,newEmailID)
{
  
  var entity = {
    "EmailID": newEmailID,
    "Verified": false
  };
   mongo.MongoClient.connect(config.MONGO_CONNECTION_STRING, function(err, connection) {
  var collection = connection.collection('EmailAddresses');
  collection.update({"UserID":userID,"EmailID":oldEmailID}, {$set:entity}, function(error,result){
    if(error)
    {
      utility.log("updateEmail() error: " + error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write('{\"Status\":\"Unsuccess\"}');
      response.end();
      connection.close();
    }
    else
    {
      utility.log("EmailAddress updated Successfully");

      SendConfirmationEmail(result[0]._id,result[0].EmailID);

      response.setHeader("content-type", "text/plain");
      response.write('{\"Status\":\"Success\"}');
      response.end();
      connection.close();
    }
  });
});
}

// http://localhost:8080/getemail?userID=sumon@live.com
function getEmailAddresses(response,userID)
{
  
  var entity = {
    "UserID":userID
  };
  mongo.MongoClient.connect(config.MONGO_CONNECTION_STRING, function(err, connection) {
    var collection = connection.collection('EmailAddresses');
  collection.find(entity).toArray(function(error,result){
    if(error)
    {
      utility.log("getEmail() error: " + error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write('{\"Status\":\"UnSuccess\"}');
      response.end();
      connection.close();
    }
    else
    {
      utility.log(result);
      response.setHeader("content-type", "text/plain");
      response.write("{\"Emails\":" + JSON.stringify(result) + "}");
      response.end();
      connection.close();
    }
  });
});
}

// http://localhost:8080/addcalllog?userID=harun@live.com&startTime=2013-12-31%2016:00:00&endTime=2013-12-31%2016:10:00&callNo=+8801816745951
/// User Call Log History
function insertCallLog(response,userID,startTime,endTime,callNo)
{
  
  var entity = {
    "UserID": userID,
    "StartTime": startTime,
    "EndTime": endTime,
    "CallNo": callNo
  };
mongo.MongoClient.connect(config.MONGO_CONNECTION_STRING, function(err, connection) {
  var collection = connection.collection('CallLog');
  collection.insert(entity ,function(error,result){
    if(error)
    {
      utility.log("insertCallLog() error: " + error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write('{\"Status\":\"Unsuccess\"}');
      response.end();
      connection.close();
    }
    else
    {
      utility.log("CallLog inserted Successfully");
      response.setHeader("content-type", "text/plain");
      response.write('{\"Status\":\"Success\"}');
      response.end();
      connection.close();
    }
  });
});
}

/// Mapping Dial In 
// http://localhost:8080/toll?area=Australia&dialInProvider=WebEx
// {"Tolls":[{"ID":1,"Area":"Australia","Number":"+61 29037 1692","Provider":"WebEx"}]}

function getTollNo(response,meetingno,area,city,dialInProvider)
{
  
  var where1 = {
    "Area": area,
    "City":city,
    "Provider": dialInProvider
  };
  var where2 = {
    "Area": area,
    "Provider": dialInProvider
  };
  var where3 = {
    "Country": area,
    "MeetingID": meetingno
  };
  var where4 = {
    "MeetingID": meetingno
  };
mongo.MongoClient.connect(config.MONGO_CONNECTION_STRING, function(err, connection) {
  var collection = connection.collection('DialInNumbers');
  var MeetingTolls = connection.collection('MeetingTolls');
  /////////Start Pick with Country and City From Global DialIns////////////////
  collection.findOne(where1, function(error1, result1) {
    if(error1)
    {
      utility.log("getTollNo("+area+","+city+","+dialInProvider+")  error: " + error1,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write('{\"Status\":\"Unsuccess\"}');
      response.end();
      connection.close();
    }
    else
    {
      utility.log("getTollNo("+area+","+city+","+dialInProvider+"): ");
      console.log(result1);
      if(result1 !=null){
        response.setHeader("content-type", "text/plain");
        response.write(JSON.stringify(result1));
        response.end();
        connection.close();
    }
    else{

      ///////////////Start Pick with only Country FROM Global DialIns/////////
    collection.findOne(where2, function(error2, result2) {
    if(error2)
    {
      utility.log("getTollNo("+area+","+dialInProvider+") error: " + error2,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write('{\"Status\":\"Unsuccess\"}');
      response.end();
      connection.close();
    }
    else
    {
        utility.log("getTollNo("+area+","+dialInProvider+"): ");
        console.log(result2);
        if(result2 !=null){
        response.setHeader("content-type", "text/plain");
        response.write(JSON.stringify(result2));
        response.end();
        connection.close();
      }
      else{
        ////////////////Start Pick with Country FROM MeetingTolls///////////////
          MeetingTolls.findOne(where3,function(error3,result3){
            if(error3)
              {
              utility.log("getTollNo("+meetingno+","+area+") error: " + error3,'ERROR');
              response.setHeader("content-type", "text/plain");
              response.write('{\"Status\":\"Unsuccess\"}');
              response.end();
              connection.close();
              }
              else{
                utility.log("getTollNo("+meetingno+","+area+"): ");
                console.log(result3);
                if(result3 !=null)
                {
                response.setHeader("content-type", "text/plain");
                response.write(JSON.stringify(result3));
                response.end();
                connection.close();
                }
                else{

                  ////////////////////Start Pick By Meeting ID only//////////////////////
                  MeetingTolls.findOne(where4,function(error4,result4){
                  if(error3)
                    {
                    utility.log("getTollNo("+meetingno+") error: " + error4,'ERROR');
                    response.setHeader("content-type", "text/plain");
                    response.write('{\"Status\":\"Unsuccess\"}');
                    response.end();
                    connection.close();
                    }
                    else
                    {
                      utility.log("getTollNo("+meetingno+"): ");
                      console.log(result4);
                       response.setHeader("content-type", "text/plain");
                        response.write(JSON.stringify(result4));
                        response.end();
                        connection.close();
                    }
                  });
                  ////////////////////End Pick By Meeting ID only//////////////////////

                }
              }
          });
        ///////////////End Pick with Country FROM MeetingTolls/////////////////
      }
    }
  });
      //////////End Pick with only Country FROM Global DialIns///////////////
    }
    }
  });
  ///////////////////End Pick with Country and City From Global DialIns///////////
});
}
function deleteDialInNumber(response,id){
  var sid = BSON.ObjectID.createFromHexString(id);
  mongo.MongoClient.connect(config.MONGO_CONNECTION_STRING, function(err, connection) {
  var collection = connection.collection('DialInNumbers');
  collection.remove({_id:sid},function(error, result) {
    if(error)
    {
      utility.log("deleteDialInNumber() error: " + error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write('{\"Status\":\"Unsuccess\"}');
      response.end();
      connection.close();
    }
    else
    {
      utility.log("DialInNumber deleted successfully");
      response.setHeader("content-type", "application/json");
      response.write('{\"Status\":\"Successfully dleleted.\"}');
      response.end();
      connection.close();
    }
  });
});
}
function getDialInNumbers(response)
{
  mongo.MongoClient.connect(config.MONGO_CONNECTION_STRING, function(err, connection) {
  var collection = connection.collection('DialInNumbers');
    // var entity = {
    //   "Area": area,
    //   "Provider": dialInProvider
    // };

    collection.find({}).toArray( function(error, result) {
      if(error)
      {
        utility.log("getDialInNumbers() error: " + error,'ERROR');
        response.setHeader("content-type", "text/plain");
        response.write('{\"Status\":\"Unsuccess\"}');
        response.end();
        connection.close();
      }
      else
      {
          // utility.log(result);
          // response.setHeader("content-type", "text/html");
          // //response.write("{\"Tolls\":" + JSON.stringify(result) + "}");
          // var tb="<table>";
          // tb +="<tr><td>Area</td><td>Number</td><td>Provider</td></tr>";
          // for (var i = 0; i < result.length; i++) {
          //  tb +="<tr>"+ "<td>"+result[i].Area+"</td>"+"<td>"+result[i].Number+"</td>"+"<td>"+result[i].Provider +"</td>"+"</tr>";
          // };
          // tb += "</table>";
          // response.write(tb);
          // response.end();

          utility.log(result);
          response.setHeader("content-type", "application/json");
          response.write("{\"data\":" + JSON.stringify(result) + "}");
          response.end();
          connection.close();




        }
      });
});
}

function AddDialInNumbersAction(response,area,city,number,dialInProvider)
{
  //console.log(area+' : '+dialInProvider);
 
  var entity = {
    "Area": area,
    "City": city,
    "Number":number,
    "Provider": dialInProvider
  };

    // if (entity.length == 0) {

    // } else {

    // }
mongo.MongoClient.connect(config.MONGO_CONNECTION_STRING, function(err, connection) {
   var collection = connection.collection('DialInNumbers');
    collection.insert(entity, function(error, result) {
      if(error)
      {
        utility.log("AddDialInNumbers() error: " + error,'ERROR');
        response.setHeader("content-type", "application/json");
        response.write('{\"Status\":\"Error in Adding !!!\"}');
        response.end();
        connection.close();
      }
      else
      {
        utility.log("AddDialInNumbers Success");
        response.setHeader("content-type", "application/json");
        response.write('{\"Status\":\"Successfully added.\"}');
        response.end();
        connection.close();
      }
    });
  });
  }

// Get user's call credit info
// http://localhost:8080/credit?userID=harun@live.com
// {"_id":"52d8fd70e4b04b3452b13eb3","UserID":"harun@live.com","Credit":100}

function getCreditBalance(response,userID)
{
 
  var entity = {
    "UserID": userID,
  };
mongo.MongoClient.connect(config.MONGO_CONNECTION_STRING, function(err, connection) {
   var collection = connection.collection('UserCredits');
  collection.findOne(entity, function(error, result) {
    if(error)
    {
      utility.log("getCreditBalance() error: " + error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write('{\"Status\":\"Unsuccess\"}');
      response.end();
      connection.close();
    }
    else
    {
      utility.log(result);
      response.setHeader("content-type", "text/plain");
      response.write(JSON.stringify(result));
      response.end();
      connection.close();
    }
  });
});
}
function deductCreditBalance(response,userID){
    utility.log('Deduct credit balance for '+userID);

   
 
   mongo.MongoClient.connect(config.MONGO_CONNECTION_STRING, function(err, connection) {
  var collection = connection.collection('UserCredits');
  collection.findOne({"UserID":userID},function(err,data){
  if(err)
    {
      utility.log("User Credit FindOne() error: " + error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write('{\"Status\":\"Unsuccess\"}');
      response.end();
      connection.close();
    }
    else
    {
    if( data !=null){
       utility.log("Previous Balance");
       console.log(data);
      var entity = {
      "Credit": data.Credit-1
      };

    collection.update({"UserID":userID}, {$set:entity}, function(error,result){
    if(error)
    {
      utility.log("deductCreditBalance() error: " + error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write('{\"Status\":\"Unsuccess\"}');
      response.end();
      connection.close();
    }
    else
    {
      utility.log("UserCredits updated Successfully");
      response.setHeader("content-type", "text/plain");
      response.write('{\"Status\":\"Success\"}');
      response.end();
      connection.close();
    }
  });

    }
  }
  });
  
});


}

function getPinlessInvitation(response){

  
  mongo.MongoClient.connect(config.MONGO_CONNECTION_STRING, function(err, connection) {
    var Invitations = connection.collection('Invitations');
    

          Invitations.find({ $or: [{PIN : ''},{PIN:'Shown after joining the meeting'}]}).sort({InvTime:-1}).toArray(
          function (error, result) {
          if(error)
          {
            utility.log("Pinless Invitations find error: " + error,'ERROR');
            response.setHeader("content-type", "text/plain");
            response.write('{\"Status\":\"Unsuccess\"}');
            response.end();
            connection.close();
          }
          else
          {
            utility.log(result);
            // response.setHeader("content-type", "text/plain");
            response.setHeader("content-type", "application/json");
             response.write("{\"data\":" + JSON.stringify(result) + "}");
            response.end();
            connection.close();
          }

          });

        /////
      
  });
}

function getPinOfInvitation(response,code){

  
  mongo.MongoClient.connect(config.MONGO_CONNECTION_STRING, function(err, connection) {
    var Invitations = connection.collection('Invitations');
        
          //var pincode=replaceAll(code,'-','');
          Invitations.findOne({ AccessCode : code},function (error, inv) {
          if(error)
          {
            utility.log("Get Invitations find by AccessCode error: " + error,'ERROR');
            response.setHeader("content-type", "text/plain");
            response.write('{\"Status\":\"Unsuccess\"}');
            response.end();
            connection.close();
          }
          else
          {
            utility.log(inv);
            if(inv !=null)
            {
             var pinInv={
              AccessCode: inv.AccessCode,
              PIN: inv.PIN
             };
            // response.setHeader("content-type", "text/plain");
            response.setHeader("content-type", "application/json");
             response.write(JSON.stringify(pinInv));
            response.end();
            connection.close();
            }
            else
            {
             utility.log("Get Invitations find by AccessCode: Not found for AccessCode " + code);
            response.setHeader("content-type", "text/plain");
            response.write('{\"Status\":\"Unsuccess\"}');
            response.end();
            connection.close();
            }
          }

          });

        /////
      
  });
}
function updatePIN(response,id,pin){
  var sid = BSON.ObjectID.createFromHexString(id);
  mongo.MongoClient.connect(config.MONGO_CONNECTION_STRING, function(err, connection) {
  var collection = connection.collection('Invitations');
  collection.update({_id:sid},{$set:{PIN:pin}},function(error, result) {
    if(error)
    {
      utility.log("updatePIN() error: " + error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write('{\"Status\":\"Unsuccess\"}');
      response.end();
      connection.close();
    }
    else
    {
      utility.log("Invitation updated successfully by PIN");
      response.setHeader("content-type", "application/json");
      response.write('{\"Status\":\"Successfully Set the PIN.\"}');
      response.end();
      connection.close();
    }
  });
});
}
function getInvitations(response,userID,id){

  if( userID == null ) userID = 'sumon@live.com';
  if( id == null ) id = 0;
//console.log(config.MONGO_CONNECTION_STRING);
  mongo.MongoClient.connect(config.MONGO_CONNECTION_STRING, function(err, connection) {
    var Invitations = connection.collection('Invitations');
    var Invitees = connection.collection('Invitees');

    Invitees.find({ UserID: userID}).toArray(
    function (error, result) {
      if(error)
      {
        utility.log("Invitees find error: " + error,'ERROR');
        response.setHeader("content-type", "text/plain");
        response.write('{\"Status\":\"Unsuccess\"}');
        response.end();
        connection.close();
      }
      else
      {
        console.log(result);
        /////

          var Invitations_ids = [];
          for (var i = 0; i < result.length; i++) {
            Invitations_ids.push(result[i].Invitations_id);
          };

          Invitations.find({ _id: {$in : Invitations_ids}, EndTime : {$gte : new Date()}}).toArray(
          function (error, result) {
          if(error)
          {
            utility.log("Invitations find error: " + error,'ERROR');
            response.setHeader("content-type", "text/plain");
            response.write('{\"Status\":\"Unsuccess\"}');
            response.end();
            connection.close();
          }
          else
          {
            utility.log(result);
            response.setHeader("content-type", "text/plain");
            response.write("{\"invitations\":"+JSON.stringify(result)+"}");
            response.end();
            connection.close();
          }

          });

        /////
      }
    });
  });
}


function InsertMeetingInvitees (EmailAddresses,Invitees,invID,addresses,i,callback) {
if(i<addresses.length){
  
   EmailAddresses.findOne({EmailID: addresses[i].address}, function(error, result1){
                if(!error){
                  if(result1==null){
                    utility.log(addresses[i].address+' not found in white list');
                      //send email
                     
                    mailer.sendMail(config.NOT_WHITELISTED_EMAIL_SUBJECT,config.NOT_WHITELISTED_EMAIL_BODY,addresses[i].address);
                    InsertMeetingInvitees(EmailAddresses,Invitees,invID,addresses,i+1,callback);
                  }
                  else{
                    //var userID = result1.UserID;
                    var entity = {
                    "UserID": result1.UserID,
                    "EmailID": result1.EmailID,
                    "Invitations_id": invID
                  };
                   console.log('invitee object to insert');
                   console.log(entity);
                  Invitees.insert(entity,function(e,r){
                    if(e){
                       utility.log("insert Invitee error: " + e, 'ERROR');
                       //connection.close();
                    }
                    else
                    {
                     mailer.sendMail(config.ATTENDEE_EMAIL_SUBJECT,config.ATTENDEE_EMAIL_BODY,result1.EmailID);
                     utility.log('Parsed Success email sent to '+result1.EmailID);
                     //connection.close();
                     InsertMeetingInvitees(EmailAddresses,Invitees,invID,addresses,i+1,callback);
                   }
                  });
                 
                    
                  }
                  
                }
              });
}
else{
  utility.log('EmailAddresses processed completed');
  if(callback !=null)
    callback();
}
  // body...
}



function insertInvitationEntity(entity,addresses)
{
  mongo.MongoClient.connect(config.MONGO_CONNECTION_STRING, function(err, connection) {
  var Invitations = connection.collection('Invitations');
  var Invitees = connection.collection('Invitees');
  var EmailAddresses = connection.collection('EmailAddresses');

   EmailAddresses.findOne({"EmailID":entity.FromEmail},function(senderError,sender){
 if(senderError){
  utility.log('Error in finding sender email in whitelist','ERROR');
  return;
 }
 else{
  if(sender==null){
    utility.log('Sender Email address '+ entity.FromEmail +' is not found in whitelist.');
     mailer.sendMail(config.NOT_WHITELISTED_EMAIL_SUBJECT,config.NOT_WHITELISTED_EMAIL_BODY,entity.FromEmail);
    return;
  }
  else{
    utility.log('Sender Email '+entity.FromEmail+' is found in whitelist with userID '+sender.UserID);
    //////////////////////Start Invitation Process/////////////  

  Invitations.findOne({"AccessCode": entity.AccessCode}, function(error, result_invite){
    if(error){
      utility.log("Error in find invitation with AccessCode to check duplicate" + error,'ERROR');
       connection.close();
    } else{
      //console.log("Invitation  found nor" + result_invite);
        if(result_invite == null){
         Invitations.insert(entity, function(error, result) {
          if(error)
          {
            utility.log("insertInvitationEntity() error: " + error, 'ERROR');
            connection.close();
          }
          else
          {
            utility.log('insert invitation result.........');
            console.log(result);
            utility.log("Invitation inserted Successfully");
            InsertMeetingInvitees(EmailAddresses,Invitees,result[0]._id,addresses,0,null);
            //connection.close();  
            
          }
        });
      }
      else{
        utility.log("Invitation already exist for AccessCode: "+result_invite.AccessCode);
        Invitations.update({"_id":result_invite._id}, {$set:entity}, function(error,result){
          if(error)
          {
            utility.log("update error in insertInvitationEntity() error: " + error, 'ERROR');
            connection.close();
          }
          else
          {
            utility.log('update invitation result.........');
            console.log(result);
            utility.log("Invitation updated Successfully");
            Invitees.remove({Invitations_id:result_invite._id},function(err,res){
              if(err){
              utility.log("delete error in insertInvitationEntity() error: " + error, 'ERROR');
              connection.close();
              }
              else{
                utility.log('deleted all previous invitees.')
                 InsertMeetingInvitees(EmailAddresses,Invitees,result_invite._id,addresses,0,null);
              }
            });
           
            //connection.close();  
            
          }
        });
      }
    }
  });

 //////////////////////End Invitation Process//////////////
  }
 }

 });

});

}



function insertInvitationEntity_backdated(entity,addresses)
{
  mongo.MongoClient.connect(config.MONGO_CONNECTION_STRING, function(err, connection) {
  var Invitations = connection.collection('Invitations');
  var Invitees = connection.collection('Invitees');
  var EmailAddresses = connection.collection('EmailAddresses');

  

  Invitations.findOne({"AccessCode": entity.AccessCode}, function(error, result_invite){
    if(error){
      console.log("Error in find invitation with AccessCode to check duplicate" + error);
    } else{
      //console.log("Invitation  found nor" + result_invite);
        if(result_invite == null){
         Invitations.insert(entity, function(error, result) {
          if(error)
          {
            utility.log("insertInvitationEntity() error: " + error, 'ERROR');
            connection.close();
          }
          else
          {
            console.log('insert invitation result.........||');
            console.log(result);
            utility.log("Invitation inserted Successfully");
            for (var i = 0; i < addresses.length; i++) {
              //var emailID = addresses[i].address;
              EmailAddresses.findOne({EmailID: addresses[i].address}, function(error, result1){
                if(!error){
                  if(result1==null){
                    utility.log(addresses[i].address+' not found in white list');
                      //send email
                     
                    mailer.sendMail(config.NOT_WHITELISTED_EMAIL_SUBJECT,config.NOT_WHITELISTED_EMAIL_BODY,addresses[i].address);
                  
                  }
                  else{
                    //var userID = result1.UserID;
                    var entity = {
                    "UserID": result1.UserID,
                    "EmailID": result1.EmailID,
                    "Invitations_id": result[0]._id
                  };
                   console.log('invitee object to insert');
                   console.log(entity);
                  Invitees.insert(entity,function(e,r){
                    if(e){
                       utility.log("insert Invitee error: " + e, 'ERROR');
                       //connection.close();
                    }
                    else
                    {
                     mailer.sendMail(config.ATTENDEE_EMAIL_SUBJECT,config.ATTENDEE_EMAIL_BODY,result1.EmailID);
                     //connection.close();
                   }
                  });
                 
                    
                  }
                  
                }
              });
            }
            //connection.close();  
            
          }
        });
      }
      else{
        console.log("Invitation already exist for AccessCode: "+entity.AccessCode);
      }
    }
  });
});

}




function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes*60000);
}
function minutesDiff(start, end){
  var diff = start.getTime() - end.getTime(); // this is a time in milliseconds
  return parseInt(diff/(1000*60));
}



//////////////////////////////


/// Exposes all methods to call outsite this file, using its object   
exports.VerifiedEmailAddress=VerifiedEmailAddress;
exports.insertUser=insertUser;
exports.insertEmailAddress=insertEmailAddress;
exports.deleteEmailAddress=deleteEmailAddress;
exports.insertCallLog=insertCallLog;
//exports.insertPushURL=insertPushURL;
exports.insertInvitationEntity=insertInvitationEntity;
exports.getInvitations=getInvitations;
//exports.PushNotification=PushNotification
//exports.getNotifications=getNotifications;
exports.getTollNo=getTollNo;
exports.updateEmailAddress=updateEmailAddress;
exports.getEmailAddresses=getEmailAddresses;
exports.getCreditBalance=getCreditBalance;
exports.deductCreditBalance=deductCreditBalance;
exports.AddDialInNumbersAction=AddDialInNumbersAction;
exports.getDialInNumbers=getDialInNumbers;
exports.deleteDialInNumber=deleteDialInNumber;
exports.insertCalendarEvent=insertCalendarEvent;
exports.insertPushURL=insertPushURL;
exports.setRemainder=setRemainder;
exports.getRemainderTime=getRemainderTime;
exports.getPinlessInvitation=getPinlessInvitation;
exports.getPinOfInvitation=getPinOfInvitation;
exports.updatePIN=updatePIN;
exports.AuthenticateUser=AuthenticateUser;
exports.getMeetingToll=getMeetingToll;
