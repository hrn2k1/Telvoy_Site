var config = require('./config.js');
var utility = require('./utility.js');

var mailer = require('./mailsender.js');
var parser = require('./parser.js');
var mimelib = require("mimelib-noiconv");
var BSON = require('mongodb').BSONPure;
var fs = require('fs');
var moment = require('moment');
var debug = config.IS_DEBUG_MODE;

function CreateGeneralResponse(Status,StatusCode,ErrorCode,ErrorMsg,SecCode,DataObj)
{
    var Obj={
    "status": Status,
    "status_code":StatusCode,
    "error_code":ErrorCode,
    "error_message":ErrorMsg,
    "security_code":SecCode,
    "data":DataObj
    };
    return JSON.stringify(Obj);
}

function unSuccessJson(error){
  // var msg={"Status":"Unsuccess","Error":error};
  // return JSON.stringify(msg);
  return CreateGeneralResponse(false,'100','500',error,'',[]);
}
function SuccessJson(){
  // var msg={"Status":"Success","Error":""};
  // return JSON.stringify(msg);
  return CreateGeneralResponse(true,'200','','','',[]);
}
function SuccessJsonWithObjects(DataObjs){
  return CreateGeneralResponse(true,'200','','','',DataObjs);
}
function SuccessJsonWithSingleObject(DataObj){
  var DataObjs=[];
  DataObjs.push(DataObj);
  return CreateGeneralResponse(true,'200','','','',DataObjs);
}

function getUserLocation(response,connection,userID){

   if(connection==null) {
      utility.log('database connection is null','ERROR');
      response.setHeader("content-type", "text/plain");
      response.write(unSuccessJson("Database Connection Failed."));
      response.end();
      return;
  }
  var emptyLoc={"UserID":userID,"Country":"","City":"","_id":""};
  var collection=connection.collection('UserLocation');
  collection.findOne({UserID:userID},function(error,result){
  if(error){
      utility.log("Error in find UserLocation : "+error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write(unSuccessJson(error));
      response.end();
      
    }
    else{

       utility.log('UserLocation for UserID: '+userID);
       utility.log(result);
       if(result==null){
        response.setHeader("content-type", "text/plain");
        //response.write(JSON.stringify(emptyLoc));
        response.write(SuccessJsonWithSingleObject(emptyLoc));
        response.end();
       }
       else{
      response.setHeader("content-type", "text/plain");
      response.write(SuccessJsonWithSingleObject(result));
      response.end();
    }
    }

  });
}


function SaveUserLocation(response,connection,userID,country,city){

   if(connection==null) {
      utility.log('database connection is null','ERROR');
      response.setHeader("content-type", "text/plain");
      response.write(unSuccessJson("Database Connection Failed."));
      response.end();
      return;
  }
  var collection=connection.collection('UserLocation');
  collection.findOne({UserID:userID},function(error,result){
    if(error){
      utility.log("Error in find UserLocation : "+error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write( unSuccessJson(error));
      response.end();
      
    }
    else{
      if(result==null){
        collection.insert({UserID:userID,Country:country,City:city},function(error,result){
          if(error){
                  utility.log("Error in Insert UserLocation : "+error,'ERROR');
                  response.setHeader("content-type", "text/plain");
                  response.write( unSuccessJson(error));
                  response.end();
                  
                }
                else
                {
                  utility.log("Successfully Inserted UserLocation");
                  response.setHeader("content-type", "text/plain");
                  response.write(SuccessJson());
                  response.end();
                }
        });
      }
      else
      {
        collection.update({UserID:userID},{$set:{Country:country,City:city}},function(error,result){
          if(error){
                  utility.log("Error in Update UserLocation : "+error,'ERROR');
                  response.setHeader("content-type", "text/plain");
                  response.write( unSuccessJson(error));
                  response.end();
                  
                }
                else
                {
                  utility.log("Successfully Updated UserLocation");
                  response.setHeader("content-type", "text/plain");
                  response.write(SuccessJson());
                  response.end();
                }
        });
      }
    }
  });
}
/* Some Invitation mail body contains toll/dial in numbers with a few country list.
This Method is to store them into MeetingTolls Collection*/
function getMeetingToll(response,connection,meetingno,country){
  
  if(connection==null) {
      utility.log('database connection is null','ERROR');
      response.setHeader("content-type", "text/plain");
      response.write(unSuccessJson("Database Connection Failed."));
      response.end();
      return;
  }

   var collection = connection.collection('MeetingTolls');
  collection.findOne({MeetingID:meetingno,Country:country}, function(error, result) {
    if(error){
      utility.log("Error in find MeetingTolls : "+error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write( unSuccessJson(error));
      response.end();
      
    }
    else{
      utility.log('Meeting Toll for MeetingID: '+meetingno+' and country: '+country);
      console.log(result);
      response.setHeader("content-type", "text/plain");
      response.write(SuccessJsonWithSingleObject(result));
      response.end();
      
    }
  });

}

function SendToastNotification(connection,userID,boldText,normalText,callback){
    if(connection==null) {
        utility.log('database connection is null','ERROR');
        return;
    }
    var Registrations = connection.collection('Registrations');
    Registrations.findOne({UserID: userID.trim()}, function(error, registration) {
        if(error)
        {
          utility.log("find registration error: " + error, 'ERROR');
        }
        else
        {
          // if(debug==true)
          // {
          utility.log('Invitees Push URL Info for sending Toast. User: '+userID );
          utility.log(registration);
          // }
          if(registration != null)
          {
            var pushUri=registration.Handle;
             mpns.sendToast(pushUri,boldText,normalText,function(error,result){
              if(error){
                utility.log("Can't Send Toast to User "+userID+" Error:"); 
                utility.log(error);
              }
              else{
                 utility.log('Successfully Sent Toast to User '+userID+' and result:');
                 utility.log(result); 
              }
              if(callback !=null)
                callback(error,result);
          });
          }
        }
    });
}

function AuthenticateUser(response,connection,session,username,pass){
 
  if(connection==null) {
      utility.log('database connection is null.','ERROR');
      response.setHeader("content-type", "text/plain");
      response.write('{\"Status\":\"Internal Server Error. Please try again.\"}');
      response.end();
      return;
  }
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

 

}

function getRemainderTime(response,connection,userID)
{
 
  var entity = {
    "UserID": userID
  };
if(connection==null) {
      utility.log('database connection is null.','ERROR');
      response.setHeader("content-type", "text/plain");
      response.write(unSuccessJson("Database Connection Failed."));
      response.end();
      return;
  }
   var collection = connection.collection('Registrations');
  collection.findOne(entity, function(error, result) {
    if(error)
    {
      utility.log("getRemainderTime() error: " + error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write( unSuccessJson(error));
      response.end();
      
    }
    else
    {
      utility.log(result);
      response.setHeader("content-type", "text/plain");
      //response.write(JSON.stringify(result));
       response.write(SuccessJsonWithSingleObject(result));
      response.end();
      
    }
  });

}
function setRemainder(response,connection,userID,remainder){
 
  
 var entity_update = {
   "RemainderMinute": remainder,
   "TimeStamp": new Date()
 };
if(connection==null) {
      utility.log('database connection eis null','ERROR');
      response.setHeader("content-type", "text/plain");
      response.write(unSuccessJson("Database Connection Failed."));
      response.end();
      return;
  }
   var collection = connection.collection('Registrations');
 collection.update({"UserID":userID}, {$set:entity_update}, function(error, result){
        if(error)
        {
          utility.log("setRemainder() error: " + error,'ERROR');
          response.setHeader("content-type", "text/plain");
          response.write( unSuccessJson(error));
          response.end();
          
        }
        else
        {
          utility.log("Set Remainder Successfully");
          response.setHeader("content-type", "text/plain");
          response.write(SuccessJson());
          response.end();
          
        }
        
      });

}

function insertPushURL(response,connection,url,userID,timeZone){
  
  var entity_insert = {
   "Handle":url,
   "UserID":userID,
   "RemainderMinute": 10,
   "TimeZone": timeZone,
   "TimeStamp": new Date()
 };
 var entity_update = {
   "Handle":url,
   "TimeZone": timeZone,
   "TimeStamp": new Date()
 };
if(connection==null) {
      utility.log('database connection is null','ERROR');
      response.setHeader("content-type", "text/plain");
      response.write(unSuccessJson("Database Connection Failed."));
      response.end();
      return;
  }
  var collection = connection.collection('Registrations');
 collection.findOne({"UserID":userID}, function(error, result) {
  if(error)
  {
    utility.log("getUser() error: " + error,'ERROR');
    response.setHeader("content-type", "text/plain");
    response.write( unSuccessJson(error));
    response.end();
    
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
          response.write( unSuccessJson(error));
          response.end();
          
        }
        else
        {
          utility.log("Push URL inserted Successfully");
          response.setHeader("content-type", "text/plain");
          response.write(SuccessJson());
          response.end();
          
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
          response.write( unSuccessJson(error));
          response.end();
          
        }
        else
        {
          utility.log("Push URL Updated Successfully");
          response.setHeader("content-type", "text/plain");
          response.write(SuccessJson());
          response.end();
          
        }
        
      });
    }
  }
});

}

function replaceAll(find, replace, str) {
  return str.replace(new RegExp(find, 'g'), replace);
}

function insertCalendarEvent(response,connection,Subject,Details,StartTime,EndTime,OrganizarName,OrganizarEmail,AttendeesName,AttendeesEmail,AccountName,AccountKind,Location,Status,IsPrivate,IsAllDayEvent)
{
 
   console.log('Subject: '+Subject+' StartTime: '+StartTime+' EndTime: '+EndTime); 
    AttendeesEmail = replaceAll(';', ',', AttendeesEmail.toLowerCase());
    AttendeesEmail = replaceAll('mailto:', '', AttendeesEmail);
    // console.log(entity);
    var addresses = mimelib.parseAddresses(AttendeesEmail);

    if(OrganizarEmail !=null && OrganizarEmail !='')
    {
        var fromAttendee = {"address":OrganizarEmail,"name":""};
        addresses.push(fromAttendee);
    }
    var out = parser.parseString(Details, ':', '\\n', true, false);
    var accessCode = parser.parseCode(Details);
    //var mmnt=moment(StartTime, "DD-MM-YYYY HH:mm:ss");
    var mInvTime = moment(StartTime, "DD-MM-YYYY HH:mm:ss")._d;
    var mInvDate = moment(StartTime, "DD-MM-YYYY HH:mm:ss").startOf('day')._d;
    
    //var mmnt1=moment(EndTime, "DD-MM-YYYY HH:mm:ss");
    var mEndTime = moment(EndTime, "DD-MM-YYYY HH:mm:ss")._d; 
    var entity = {
       "Subject":Subject,
       "Details": Details,
       "StartTime":mInvTime,
       "EndTime":mEndTime,
       "OrganizarName":OrganizarName,
       "OrganizarEmail":OrganizarEmail,
       "AttendeesName":AttendeesName,
       "AttendeesEmail":AttendeesEmail,
       "AccountName":AccountName,
       "AccountKind":AccountKind,
       "Location":Location,
       "Status":Status,
       "IsPrivate":IsPrivate,
       "IsAllDayEvent":IsAllDayEvent,
       "AccessCode":utility.isNull(accessCode,'')
    };
    console.log(entity);
    var invite_entity = {
        ToEmails : AttendeesEmail,
        Forwarder: OrganizarEmail,
        FromEmail: OrganizarEmail,
        InvDate : mInvDate,
        InvTime : mInvTime,
        EndTime: mEndTime,
        Subject: Subject.replace('FW: ',''),
        Toll: utility.isNull(out['toll'],''),
        PIN: utility.isNull(out['pin'],''),
        AccessCode: utility.isNull(accessCode,''),
        Password: utility.isNull(out['password'],''),
        DialInProvider:utility.isNull(out['provider'],''),
        TimeStamp: new Date(),
        Agenda:utility.isNull(out['agenda'],''),
        MessageID: ''
    };
console.log(invite_entity);
    if(connection==null) {
          utility.log('database connection is null', 'ERROR');
          response.setHeader("content-type", "text/plain");
          response.write(unSuccessJson("Database Connection Failed."));
          response.end();
          return;
    }
    var collection = connection.collection('CalendarEvents'); 
    collection.findOne({"AccessCode":utility.isNull(accessCode,'')},function(err,calevent){
      if(err){
            utility.log("Error in find CalendarEvents with AccessCode to check duplicate" + error,'ERROR');
             } else{
              if(calevent == null){
                utility.log('New Calendar Event for'+accessCode);
                collection.insert(entity, function(error, result){
                if(error)
                {
                    utility.log("insert CalendarEvent() error: " + error, 'ERROR');
                    response.setHeader("content-type", "text/plain");
                    response.write( unSuccessJson(error));
                    response.end();
                }
                else
                {
                    // console.log(result);
                    utility.log("Calendar Event inserted Successfully");
                    response.setHeader("content-type", "text/plain");
                    response.write(SuccessJson());
                    response.end();
                    insertInvitationEntity(connection,invite_entity,addresses,out['tolls']);
                }
            });

              }
              else{

                utility.log('Calendar Event for'+accessCode+' already exist');
                collection.update({"_id":calevent._id},{$set:entity}, function(error, result){
                if(error)
                {
                    utility.log("update CalendarEvent() error: " + error, 'ERROR');
                    response.setHeader("content-type", "text/plain");
                    response.write( unSuccessJson(error));
                    response.end();
                }
                else
                {
                    // console.log(result);
                    utility.log("Calendar Event updated Successfully");
                    response.setHeader("content-type", "text/plain");
                    response.write(SuccessJson());
                    response.end();
                    insertInvitationEntity(connection,invite_entity,addresses,out['tolls']);
                }
            });


              }
            }
    });
    
}
function insertCalendarEvent_bak(response,connection,Subject,Details,StartTime,EndTime,OrganizarName,OrganizarEmail,AttendeesName,AttendeesEmail,AccountName,AccountKind,Location,Status,IsPrivate,IsAllDayEvent)
{
    
    AttendeesEmail = replaceAll(';', ',', AttendeesEmail.toLowerCase());
    AttendeesEmail = replaceAll('mailto:', '', AttendeesEmail);
    // console.log(entity);
    var addresses = mimelib.parseAddresses(AttendeesEmail);

    if(OrganizarEmail !=null && OrganizarEmail !='')
    {
        var fromAttendee = {"address":OrganizarEmail,"name":""};
        addresses.push(fromAttendee);
    }
    var out = parser.parseString(Details, ':', '\\n', true, false);
    var accessCode = parser.parseCode(Details);
    var mInvDate = moment(StartTime, "D-M-YYYY H:mm:ss")._d;
    var mInvTime = moment(StartTime, "D-M-YYYY H:mm:ss")._d;
    var mEndTime = moment(EndTime, "D-M-YYYY H:mm:ss")._d;
    
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
       "IsAllDayEvent":IsAllDayEvent,
       "AccessCode":utility.isNull(accessCode,'')
    };
    
    var invite_entity = {
        ToEmails : AttendeesEmail,
        Forwarder: OrganizarEmail,
        FromEmail: OrganizarEmail,
        InvDate : mInvDate,
        InvTime : mInvTime,
        EndTime: mEndTime,
        Subject: Subject.replace('FW: ',''),
        Toll: utility.isNull(out['toll'],''),
        PIN: utility.isNull(out['pin'],''),
        AccessCode: utility.isNull(accessCode,''),
        Password: utility.isNull(out['password'],''),
        DialInProvider:utility.isNull(out['provider'],''),
        TimeStamp: new Date(),
        Agenda:utility.isNull(out['agenda'],''),
        MessageID: ''
    };

    if(connection==null) {
          utility.log('database connection is null', 'ERROR');
          response.setHeader("content-type", "text/plain");
          response.write(unSuccessJson("Database Connection Failed."));
          response.end();
          return;
    }
    var collection = connection.collection('CalendarEvents'); 
    collection.insert(entity, function(error, result){
        if(error)
        {
            utility.log("insertCalendarEvent() error: " + error, 'ERROR');
            response.setHeader("content-type", "text/plain");
            response.write( unSuccessJson(error));
            response.end();
        }
        else
        {
            // console.log(result);
            utility.log("Calendar Event inserted Successfully");
            response.setHeader("content-type", "text/plain");
            response.write(SuccessJson());
            response.end();
            insertInvitationEntity(connection,invite_entity,addresses,out['tolls']);
        }
    });
}

function insertInvitationEntity(connection,entity,addresses,localtolls)
{
    //console.log(entity.InvTime,entity.EndTime);
    // if(entity.EndTime=="" || entity.EndTime==null || entity.EndTime=="undefined"){
    //     entity.EndTime = addMinutes(entity.InvTime, 60); 
    //     utility.log("Empty EndTime. and added 1 hr to InvTime: ", entity.EndTime);
    // }
    // utility.log("----------Working----------");
    
    // entity.EndTime = (entity.EndTime) ? addMinutes(entity.InvTime, 60) : '';

    if(localtolls != null && localtolls.length > 0){
        for (var i = 0; i < localtolls.length; i++) {
            localtolls[i].MeetingID = entity.AccessCode;
        };
    }

    if(connection == null) {
        utility.log('database connection is null','ERROR');
        return;
    }
    var Invitations = connection.collection('Invitations');
    var EmailAddresses = connection.collection('EmailAddresses');

    EmailAddresses.findOne({"EmailID":entity.Forwarder, "Verified":true},function(senderError,sender){
        if(senderError){
            utility.log('Error in finding sender email in whitelist','ERROR');
            return;
        }
        else{
            if(sender == null){
                utility.log('Sender(Forwarder) Email address ' + entity.Forwarder +' is not found in whitelist.');
                mailer.sendMail(config.NOT_WHITELISTED_EMAIL_SUBJECT,config.NOT_WHITELISTED_EMAIL_BODY,entity.Forwarder);
                return;
            }
            else{
                utility.log('Sender(Forwarder) Email ' + entity.Forwarder + ' is found in whitelist with userID ' + sender.UserID);
                //////////////////////Start Invitation Process/////////////
                var mailSubject = entity.Subject.replace('Fwd: ','');
                ProcessInvitees(connection,addresses,function(error,addrs){
                    if(error){
                        utility.log('ProcessInvitees error: '+error);
                      }
                      else{
                        utility.log('Allowed Attendees...');
                        utility.log(addrs);
                        entity.Attendees=addrs;

                        Invitations.findOne({"AccessCode": entity.AccessCode}, function(error, result_invite){
                        if(error){
                            utility.log("Error in find invitation with AccessCode to check duplicate" + error,'ERROR');
                        } else{
                            console.log("Invitation found nor" + result_invite);
                            if(result_invite == null){
                                Invitations.insert(entity, function(error, result) {
                                    if(error)
                                    {
                                        utility.log("insertInvitationEntity() error: " + error, 'ERROR');
                                    }
                                    else
                                    {
                                        utility.log('insert invitation result.........');
                                        utility.log(result);
                                        utility.log("Invitation inserted Successfully fn insertInvitationEntity");
                                    }
                                });
                            }
                            else{
                                utility.log("Invitation already exist for AccessCode: "+result_invite.AccessCode);
                                Invitations.update({"_id":result_invite._id}, {$set:entity}, function(error,result){
                                    if(error)
                                    {
                                        utility.log("update error in insertInvitationEntity() error: " + error, 'ERROR');
                                    }
                                    else
                                    {
                                        utility.log('update invitation result.........');
                                        utility.log(result);
                                        utility.log("Invitation updated Successfully fn insertInvitationEntity");
                                    }
                                });
                            }
                        }
                        });
                    }
                });
            //////////////////////End Invitation Process//////////////
            }
        }
    });
}

/*Recurssive Method to handle Invitees. 
Due to IO non-blocking feature of Node.js normal looping is not applicable here*/
function ProcessInvitees(dbConnection,addresses,callback){
    if(dbConnection == null) {
        utility.log('database connection is null','ERROR');
        return;
    }

    var Atts=[];
    var EmailAddresses = dbConnection.collection('EmailAddresses');

    addresses.forEach(function(addr,j){
        EmailAddresses.findOne({EmailID: addr.address,Verified:true}, function(error, result1){
            if(!error){
                if(result1 == null){
                    utility.log(addr.address + ' not found in white list');
                    //send email
                    mailer.sendMail(config.NOT_WHITELISTED_EMAIL_SUBJECT,config.NOT_WHITELISTED_EMAIL_BODY,addr.address);
                    if(j+1 == addresses.length)
                    {
                        if(callback !=null) callback(null,Atts);
                    }
                }
                else{
                    Atts.push( {"UserID": result1.UserID,"EmailID": result1.EmailID} );
                    //console.log(j,Atts);
                    // mailer.sendMail(config.ATTENDEE_EMAIL_SUBJECT,config.ATTENDEE_EMAIL_BODY,result1.EmailID);
                    utility.log('Parsed Success email sent to '+result1.EmailID);
                    SendToastNotification(dbConnection,result1.UserID,config.ATTENDEE_EMAIL_SUBJECT,config.ATTENDEE_EMAIL_BODY,null);
                    if(j+1==addresses.length)
                    {
                        if(callback !=null) callback(null,Atts);
                    }
                }
            }
            else{
                if(callback !=null) callback(error,null);
            }
        });
    });
}


/// User Creation Method Exposed here
//http://localhost:8080/user?userID=sumon@live.com&deviceID=1323809&firstName=Shams&lastName=Sumon%20Bhai&phoneNo=0181256341&masterEmail=sumon@live.com&location=Magura
function insertUser(response,connection,userID,deviceID,firstName,lastName,phoneNo,masterEmail,password,location)
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


  utility.debug('User object to add');
  utility.debug(insert_entity);
  if(connection==null) {
      utility.log('database connection is null','ERROR');
      response.setHeader("content-type", "text/plain");
      response.write(unSuccessJson("Database Connection Failed."));
      response.end();
      return;
  }
  var collection = connection.collection('Users');
  collection.findOne({"UserID":userID}, function(error, result) {
    if(error)
    {
      utility.log("getUser() error: " + error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write( unSuccessJson(error));
      response.end();
      
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
            response.write( unSuccessJson(error));
            response.end();
            
          }
          else
          {
            AddMasterEmail(connection,userID,userID);
            utility.log("Invitation inserted Successfully");
            response.setHeader("content-type", "text/plain");
            response.write(SuccessJson());
            response.end();
            
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
          response.write( unSuccessJson(error));
          response.end();
          
        }
        else
        {
          AddMasterEmail(connection,userID,userID);
          utility.log("User Updated Successfully");
          response.setHeader("content-type", "text/plain");
          response.write(SuccessJson());
          response.end();
          
        }
        
      });
     }
   }
 });

}

function AddMasterEmail(connection,userID,emailID){

var entity = {
    "UserID": userID,
    "EmailID": emailID,
    "Verified": true
  };

  if(connection==null) {
      utility.log('database connection is null','ERROR');
     
      return;
  }
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
      utility.debug("Email(s) inserted Successfully");

      //connection.close();
      return;
    }
  });
  }
 }
 });

}
function SendConfirmationEmail(id,email){

  var link=config.SITE_ROOT_URL+"/eac?e="+email+"&_id="+id;
      utility.log("Email Addreess Confirmation Link : "+link);
      var msg=config.EMAIL_ADDRESS_CONFIRMATION_BODY.replace('[LINK]',link);
      mailer.sendMail(config.EMAIL_ADDRESS_CONFIRMATION_SUBJECT,msg,email);
}
function VerifiedEmailAddress(response,connection,id,email){

  var sid = BSON.ObjectID.createFromHexString(id);

  if(connection==null) {
      utility.log('database connection is null','ERROR');
      response.setHeader("content-type", "text/plain");
      response.write(unSuccessJson("Database Connection Failed."));
      response.end();
      return;
  }
  var collection = connection.collection('EmailAddresses');
  // collection.findOne({ _id: sid}, function(error, result){
  collection.update({ _id: sid,EmailID:email}, {$set : {Verified: true} }, function(error,result){
  // collection.update(where, {$set:entity}, function(error,result){
    if(error)
    {
      utility.log("VerifiedEmailAddress() error: " + error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write( unSuccessJson(error));
      response.end();
      
    }
    else
    {
      utility.debug(result);
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
        
      }
    }
  });

}


// http://localhost:8080/addemail?userID=sumon@live.com&emailID=sumon3@live.com
//// Add method to add User's Other Emails 
function insertEmailAddress(response,connection,userID,emailID)
{
 
  var entity = {
    "UserID": userID,
    "EmailID": emailID,
    "Verified": false
  };
if(connection==null) {
      utility.log('database connection is null','ERROR');
      response.setHeader("content-type", "text/plain");
      response.write(unSuccessJson("Database Connection Failed."));
      response.end();
      return;
  }
 var collection = connection.collection('EmailAddresses');
  collection.insert(entity, function(error, result){
    if(error)
    {
      utility.log("insertEmailAddress() error: " + error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write( unSuccessJson(error));
      response.end();
      
    }
    else
    {
      utility.log("Email(s) inserted Successfully");

      SendConfirmationEmail(result[0]._id,result[0].EmailID);

      response.setHeader("content-type", "text/plain");
      response.write(SuccessJson());
      response.end();
      
    }
  });

}


// http://localhost:8080/removeemail?userID=sumon@live.com&emailID=sumon3@live.com
//// Remove method to remove User's Other Emails
function deleteEmailAddress(response,connection,userID,emailID)
{
  
  var entity = {
    "UserID": userID,
    "EmailID": emailID
  };
 if(connection==null) {
      utility.log('database connection is null','ERROR');
      response.setHeader("content-type", "text/plain");
      response.write(unSuccessJson("Database Connection Failed."));
      response.end();
      return;
  }
  var collection = connection.collection('EmailAddresses');
  collection.remove(entity, function(error, result){
    if(error)
    {
      utility.log("deleteEmail() error: " + error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write( unSuccessJson(error));
      response.end();
      
    }
    else
    {
        mailer.sendMail('Telvoy : Email Address Delete Notification','Your Email Address '+emailID+' has been deleted from whitelist of '+userID,emailID);
      utility.log("Email Address deleted Successfully");
      response.setHeader("content-type", "text/plain");
      response.write(SuccessJson());
      response.end();
      
    }
  });

}

// http://localhost:8080/editemail?userID=sumon@live.com&oldEmailID=sumon4@live.com&newEmailID=sumon3@live.com
function updateEmailAddress(response,connection,userID,oldEmailID,newEmailID)
{
  
  var entity = {
    "EmailID": newEmailID,
    "Verified": false
  };
   if(connection==null) {
      utility.log('database connection is null','ERROR');
      response.setHeader("content-type", "text/plain");
      response.write(unSuccessJson("Database Connection Failed."));
      response.end();
      return;
  }
  var collection = connection.collection('EmailAddresses');
  collection.update({"UserID":userID,"EmailID":oldEmailID}, {$set:entity}, function(error,result){
    if(error)
    {
      utility.log("updateEmail() error: " + error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write( unSuccessJson(error));
      response.end();
      
    }
    else
    {
      utility.log("EmailAddress updated Successfully");
      collection.findOne({"UserID":userID,"EmailID":newEmailID},function(e,r){
        if(!e && r !=null)
        SendConfirmationEmail(r._id,r.EmailID);

      });
      

      response.setHeader("content-type", "text/plain");
      response.write(SuccessJson());
      response.end();
      
    }
  });

}

// http://localhost:8080/getemail?userID=sumon@live.com
function getEmailAddresses(response,connection,userID)
{
  
  var entity = {
    "UserID":userID
  };
  if(connection==null) {
      utility.log('database connection is null','ERROR');
      response.setHeader("content-type", "text/plain");
      response.write(unSuccessJson("Database Connection Failed."));
      response.end();
      return;
  }
    var collection = connection.collection('EmailAddresses');
  collection.find(entity).toArray(function(error,result){
    if(error)
    {
      utility.log("getEmail() error: " + error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write( unSuccessJson(error));
      response.end();
      
    }
    else
    {
      utility.debug(result);
      response.setHeader("content-type", "text/plain");
      //response.write("{\"Emails\":" + JSON.stringify(result) + "}");
       response.write(SuccessJsonWithObjects(result));
      response.end();
      
    }
  });

}

// http://localhost:8080/addcalllog?userID=harun@live.com&startTime=2013-12-31%2016:00:00&endTime=2013-12-31%2016:10:00&callNo=+8801816745951
/// User Call Log History
function insertCallLog(response,connection,userID,startTime,endTime,callNo)
{
  
  var entity = {
    "UserID": userID,
    "StartTime": startTime,
    "EndTime": endTime,
    "CallNo": callNo
  };
if(connection==null) {
      utility.log('database connection is null','ERROR');
      response.setHeader("content-type", "text/plain");
      response.write(unSuccessJson("Database Connection Failed."));
      response.end();
      return;
  }
  var collection = connection.collection('CallLog');
  collection.insert(entity ,function(error,result){
    if(error)
    {
      utility.log("insertCallLog() error: " + error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write( unSuccessJson(error));
      response.end();
      
    }
    else
    {
      utility.log("CallLog inserted Successfully");
      response.setHeader("content-type", "text/plain");
      response.write(SuccessJson());
      response.end();
      
    }
  });

}

/// Mapping Dial In 
// http://localhost:8080/toll?area=Australia&dialInProvider=WebEx
// {"Tolls":[{"ID":1,"Area":"Australia","Number":"+61 29037 1692","Provider":"WebEx"}]}

function getTollNo(response,connection,meetingno,area,city,dialInProvider)
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
  var emptyNumber={"_id":"","Area":area,"City":city,"Number": "","Provider":dialInProvider};
if(connection==null) {
      utility.log('database connection is null','ERROR');
      response.setHeader("content-type", "text/plain");
      response.write(unSuccessJson("Database Connection Failed."));
      response.end();
      return;
  }
  var collection = connection.collection('DialInNumbers');
  var MeetingTolls = connection.collection('MeetingTolls');
  /////////Start Pick with Country and City From Global DialIns////////////////
  collection.findOne(where1, function(error1, result1) {
    if(error1)
    {
      utility.log("getTollNo("+area+","+city+","+dialInProvider+")  error: " + error1,'ERROR');
      response.setHeader("content-type", "text/plain");
      //response.write(JSON.stringify(emptyNumber));
       response.write(SuccessJsonWithSingleObject(emptyNumber));
      response.end();
      
    }
    else
    {
      utility.log("getTollNo("+area+","+city+","+dialInProvider+"): ");
      utility.log(result1);
      if(result1 !=null){
        response.setHeader("content-type", "text/plain");
        //response.write(JSON.stringify(result1));
        response.write(SuccessJsonWithSingleObject(result1));
        response.end();
        
    }
    else{

      ///////////////Start Pick with only Country FROM Global DialIns/////////
    collection.findOne(where2, function(error2, result2) {
    if(error2)
    {
      utility.log("getTollNo("+area+","+dialInProvider+") error: " + error2,'ERROR');
      response.setHeader("content-type", "text/plain");
      //response.write( JSON.stringify(emptyNumber));
      response.write(SuccessJsonWithSingleObject(emptyNumber));
      response.end();
      
    }
    else
    {
        utility.log("getTollNo("+area+","+dialInProvider+"): ");
        console.log(result2);
        if(result2 !=null){
        response.setHeader("content-type", "text/plain");
        //response.write(JSON.stringify(result2));
        response.write(SuccessJsonWithSingleObject(result2));
        response.end();
        
      }
      else{
        ////////////////Start Pick with Country FROM MeetingTolls///////////////
          MeetingTolls.findOne(where3,function(error3,result3){
            if(error3)
              {
              utility.log("getTollNo("+meetingno+","+area+") error: " + error3,'ERROR');
              response.setHeader("content-type", "text/plain");
              //response.write(JSON.stringify(emptyNumber));
              response.write(SuccessJsonWithSingleObject(emptyNumber));
              response.end();
              
              }
              else{
                utility.log("getTollNo("+meetingno+","+area+"): ");
                utility.log(result3);
                if(result3 !=null)
                {
                response.setHeader("content-type", "text/plain");
                //response.write(JSON.stringify(result3));
                response.write(SuccessJsonWithSingleObject(result3));
                response.end();
                
                }
                else{

                  ////////////////////Start Pick By Meeting ID only//////////////////////
                  MeetingTolls.findOne(where4,function(error4,result4){
                  if(error3)
                    {
                    utility.log("getTollNo("+meetingno+") error: " + error4,'ERROR');
                    response.setHeader("content-type", "text/plain");
                    //response.write(JSON.stringify(emptyNumber));
                    response.write(SuccessJsonWithSingleObject(emptyNumber));
                    response.end();
                    
                    }
                    else
                    {
                      utility.log("getTollNo("+meetingno+"): ");
                      utility.log(result4);
                      if(result4 !=null)
                      {
                       response.setHeader("content-type", "text/plain");
                        //response.write(JSON.stringify(result4));
                        response.write(SuccessJsonWithSingleObject(result4));
                        response.end();
                      }
                      else
                      {
                        utility.log("Toll not found");
                        response.setHeader("content-type", "text/plain");
                        //response.write(JSON.stringify(emptyNumber));
                        response.write(SuccessJsonWithSingleObject(emptyNumber));
                        response.end();
                      }
                        
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

}
function deleteDialInNumber(response,connection,id){
  var sid = BSON.ObjectID.createFromHexString(id);
  if(connection==null) {
      utility.log('database connection is null','ERROR');
      response.setHeader("content-type", "text/plain");
      response.write(unSuccessJson("Database Connection Failed."));
      response.end();
      return;
  }
  var collection = connection.collection('DialInNumbers');
  collection.remove({_id:sid},function(error, result) {
    if(error)
    {
      utility.log("deleteDialInNumber() error: " + error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write( unSuccessJson(error));
      response.end();
      
    }
    else
    {
      utility.log("DialInNumber deleted successfully");
      response.setHeader("content-type", "application/json");
      response.write('{\"Status\":\"Successfully dleleted.\"}');
      response.end();
      
    }
  });

}
function getDialInNumbers(response,connection)
{
  
  if(connection==null) {
      utility.log('database connection is null','ERROR');
      response.setHeader("content-type", "text/plain");
      response.write(unSuccessJson("Database Connection Failed."));
      response.end();
      return;
  }
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
        response.write( unSuccessJson(error));
        response.end();
        
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

          utility.debug(result);
          response.setHeader("content-type", "application/json");
          response.write("{\"data\":" + JSON.stringify(result) + "}");
          response.end();
          




        }
      });

}

function AddDialInNumbersAction(response,connection,area,city,number,dialInProvider)
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
if(connection==null) {
      utility.log('database connection is null','ERROR');
      response.setHeader("content-type", "text/plain");
      response.write(unSuccessJson("Database Connection Failed."));
      response.end();
      return;
  }
   var collection = connection.collection('DialInNumbers');
    collection.insert(entity, function(error, result) {
      if(error)
      {
        utility.log("AddDialInNumbers() error: " + error,'ERROR');
        response.setHeader("content-type", "application/json");
        response.write('{\"Status\":\"Error in Adding !!!\"}');
        response.end();
        
      }
      else
      {
        utility.log("AddDialInNumbers Success");
        response.setHeader("content-type", "application/json");
        response.write('{\"Status\":\"Successfully added.\"}');
        response.end();
        
      }
    });

  }

// Get user's call credit info
// http://localhost:8080/credit?userID=harun@live.com
// {"_id":"52d8fd70e4b04b3452b13eb3","UserID":"harun@live.com","Credit":100}

function getCreditBalance(response,connection,userID)
{
 
  var entity = {
    "UserID": userID,
  };
if(connection==null) {
      utility.log('database connection is null','ERROR');
      response.setHeader("content-type", "text/plain");
      response.write(unSuccessJson("Database Connection Failed."));
      response.end();
      return;
  }
   var collection = connection.collection('UserCredits');
  collection.findOne(entity, function(error, result) {
    if(error)
    {
      utility.log("getCreditBalance() error: " + error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write( unSuccessJson(error));
      response.end();
      
    }
    else
    {
      utility.debug(result);
      response.setHeader("content-type", "text/plain");
      //response.write(JSON.stringify(result));
      response.write(SuccessJsonWithSingleObject(result));
      response.end();
      
    }
  });

}
function deductCreditBalance(response,connection,userID){
    utility.debug('Deduct credit balance for '+userID);

   
 
  if(connection==null) {
      utility.log('database connection is null','ERROR');
      response.setHeader("content-type", "text/plain");
      response.write(unSuccessJson("Database Connection Failed."));
      response.end();
      return;
  }
  var collection = connection.collection('UserCredits');
  collection.findOne({"UserID":userID},function(err,data){
  if(err)
    {
      utility.log("User Credit FindOne() error: " + error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write( unSuccessJson(error));
      response.end();
      
    }
    else
    {
    if( data !=null){
       utility.debug("Previous Balance");
       utility.debug(data);
      var entity = {
      "Credit": data.Credit-1
      };

    collection.update({"UserID":userID}, {$set:entity}, function(error,result){
    if(error)
    {
      utility.log("deductCreditBalance() error: " + error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write( unSuccessJson(error));
      response.end();
      
    }
    else
    {
      utility.log("UserCredits updated Successfully");
      response.setHeader("content-type", "text/plain");
      response.write(SuccessJson());
      response.end();
      
    }
  });

    }
  }
  });
  


}

function getPinlessInvitation(response,connection){

  
  if(connection==null) {
      utility.log('database connection is null','ERROR');
      response.setHeader("content-type", "text/plain");
      response.write(unSuccessJson("Database Connection Failed."));
      response.end();
      return;
  }
    var Invitations = connection.collection('Invitations');
    

          Invitations.find({ $or: [{PIN : ''},{PIN:'Shown after joining the meeting'}]}).sort({InvTime:-1}).toArray(
          function (error, result) {
          if(error)
          {
            utility.log("Pinless Invitations find error: " + error,'ERROR');
            response.setHeader("content-type", "text/plain");
            response.write( unSuccessJson(error));
            response.end();
            
          }
          else
          {
            utility.log(result);
            // response.setHeader("content-type", "text/plain");
            response.setHeader("content-type", "application/json");
             response.write("{\"data\":" + JSON.stringify(result) + "}");
            response.end();
            
          }

          });

        /////

}

function getPinOfInvitation(response,connection,code){

  
  if(connection==null) {
      utility.log('database connection is null','ERROR');
      response.setHeader("content-type", "text/plain");
      response.write(unSuccessJson("Database Connection Failed."));
      response.end();
      return;
  }
    var Invitations = connection.collection('Invitations');
        
          //var pincode=replaceAll(code,'-','');
          Invitations.findOne({ AccessCode : code},function (error, inv) {
          if(error)
          {
            utility.log("Get Invitations find by AccessCode error: " + error,'ERROR');
            response.setHeader("content-type", "text/plain");
            response.write( unSuccessJson(error));
            response.end();
            
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
            
            }
            else
            {
             utility.log("Get Invitations find by AccessCode: Not found for AccessCode " + code);
            response.setHeader("content-type", "text/plain");
            response.write( unSuccessJson("Invitation not found for AccessCode"+code));
            response.end();
            
            }
          }

          });

        /////
  
}
function updatePIN(response,connection,id,pin){
  var sid = BSON.ObjectID.createFromHexString(id);
 if(connection==null) {
      utility.log('database connection is null','ERROR');
      response.setHeader("content-type", "text/plain");
      response.write(unSuccessJson("Database Connection Failed."));
      response.end();
      return;
  }
  var collection = connection.collection('Invitations');
  collection.update({_id:sid},{$set:{PIN:pin}},function(error, result) {
    if(error)
    {
      utility.log("updatePIN() error: " + error,'ERROR');
      response.setHeader("content-type", "text/plain");
      response.write( unSuccessJson(error));
      response.end();
      
    }
    else
    {
      utility.log("Invitation updated successfully by PIN");
      response.setHeader("content-type", "application/json");
      response.write('{\"Status\":\"Successfully Set the PIN.\"}');
      response.end();
      
    }
  });

}
function getInvitations(response,connection,userID,id){

    if( userID == null ) userID = 'mmnitol@outlook.com';
    if( id == null ) id = 0;
    //console.log(config.MONGO_CONNECTION_STRING);
    if(connection==null) {
        utility.log('database connection is null','ERROR');
        response.setHeader("content-type", "text/plain");
        //response.write('{\"invitations\":[]}');
        response.write(SuccessJsonWithObjects([]));
        response.end();
        return;
    }
    var Invitations = connection.collection('Invitations');

    Invitations.find({ EndTime : { $gte : new Date() }, Attendees : { $elemMatch : { UserID : userID } } }, { Attendees : 0 }).sort({InvTime:1}).toArray(
    function (error, result) {
      if(error)
      {
        utility.log("Invitations find error: " + error,'ERROR');
        response.setHeader("content-type", "text/plain");
        response.write( unSuccessJson(error));
        response.end();
        
      }
      else
      {
        utility.log(result);
        response.setHeader("content-type", "text/plain");
        //response.write("{\"invitations\":"+JSON.stringify(result)+"}");
        response.write(SuccessJsonWithObjects(result));
        response.end();
        
      }
    });
}
function getInvitations_back(response,connection,userID,id){

  if( userID == null ) userID = 'sumon@live.com';
  if( id == null ) id = 0;
//console.log(config.MONGO_CONNECTION_STRING);
 if(connection==null) {
      utility.log('database connection is null','ERROR');
      response.setHeader("content-type", "text/plain");
      //response.write(unSuccessJson("Database Connection Failed."));
      response.write('{\"invitations\":[]}');
      response.end();
      return;
  }
    var Invitations = connection.collection('Invitations');
    var Invitees = connection.collection('Invitees');

    Invitees.find({ UserID: userID}).toArray(
    function (error, result) {
      if(error)
      {
        utility.log("Invitees find error: " + error,'ERROR');
        response.setHeader("content-type", "text/plain");
        response.write( unSuccessJson(error));
        response.end();
        
      }
      else
      {
        utility.log(result);
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
            response.write( unSuccessJson(error));
            response.end();
            
          }
          else
          {
            utility.log(result);
            response.setHeader("content-type", "text/plain");
            response.write("{\"invitations\":"+JSON.stringify(result)+"}");
            response.end();
            
          }

          });

        /////
      }
    });

}


function InsertMeetingInvitees (EmailAddresses,Invitees,invID,addresses,i,callback) {
if(i<addresses.length){
  
   EmailAddresses.findOne({EmailID: addresses[i].address,Verified:true}, function(error, result1){
                if(!error){
                  if(result1==null){
                    utility.log(addresses[i].address+' not found in white list or not Verified.');
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
                   utility.debug('invitee object to insert');
                   utility.debug(entity);
                  Invitees.insert(entity,function(e,r){
                    if(e){
                       utility.log("insert Invitee error: " + e, 'ERROR');
                       //connection.close();
                    }
                    else
                    {
                     mailer.sendMail(config.ATTENDEE_EMAIL_SUBJECT,config.ATTENDEE_EMAIL_BODY,result1.EmailID);
                     utility.log('Parsed Success email sent to '+result1.EmailID+ ' ('+result1.UserID+')');
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



function InsertMeetingTolls(connection,localtolls){
  if(localtolls=='undefined') return;
  if(localtolls==null) return;
  if(localtolls.length==0) return;

  utility.debug("Meeting Tolls to insert");
  utility.debug(localtolls);
  if(connection==null) {
      utility.log('database connection is null','ERROR');
      
      return;
  }
      var Tolls = connection.collection('MeetingTolls');
      Tolls.insert(localtolls,function(err,rslt){
          if(err){
            utility.log('Insert MeetingTolls Error: '+err,'ERROR');
            
          }
          else{
            utility.log("Successfully Inserted "+localtolls.length+" Meeting Tolls.");
            
          }
      });
      
 
}


function insertInvitationEntity_back(connection,entity,addresses,localtolls)
{
  if(entity.EndTime=="" || entity.EndTime==null || entity.EndTime=="undefined"){ 
  entity.EndTime= addMinutes(entity.InvTime,60); 
  utility.log("Empty EndTime. and added 1 hr to InvTime: ",entity.EndTime);
  }
   if(localtolls!=null && localtolls.length>0){
    for (var i = 0; i < localtolls.length; i++) {
      localtolls[i].MeetingID=entity.AccessCode;
    };
   }


 if(connection==null) {
      utility.log('database connection is null','ERROR');
     
      return;
  }
  var Invitations = connection.collection('Invitations');
  var Invitees = connection.collection('Invitees');
  var EmailAddresses = connection.collection('EmailAddresses');

 EmailAddresses.findOne({"EmailID":entity.Forwarder,"Verified":true},function(senderError,sender){
 if(senderError){
  utility.log('Error in finding sender email in whitelist or not Verified','ERROR');
  return;
 }
 else{
  if(sender==null){
    utility.log('Sender(Forwarder) Email address '+ entity.Forwarder +' is not found in whitelist or not Verified.');
     mailer.sendMail(config.NOT_WHITELISTED_EMAIL_SUBJECT,config.NOT_WHITELISTED_EMAIL_BODY,entity.Forwarder);
    return;
  }
  else{
    utility.log('Sender(Forwarder) Email '+entity.Forwarder+' is found in whitelist with userID '+sender.UserID);
    //////////////////////Start Invitation Process/////////////

    Invitations.findOne({"AccessCode": entity.AccessCode}, function(error, result_invite){
    if(error){
      utility.log("Error in find invitation with AccessCode to check duplicate" + error,'ERROR');
       
    } else{
      //console.log("Invitation  found nor" + result_invite);
        if(result_invite == null){
         Invitations.insert(entity, function(error, result) {
          if(error)
          {
            utility.log("insertInvitationEntity() error: " + error, 'ERROR');
            
          }
          else
          {
            utility.debug('insert invitation result.........');
            utility.debug(result);
            utility.log("Invitation inserted Successfully fn insertInvitationEntity_back");
            InsertMeetingInvitees(EmailAddresses,Invitees,result[0]._id,addresses,0,function(){ InsertMeetingTolls(connection,localtolls);});
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
            
          }
          else
          {
            utility.debug('update invitation result.........');
            utility.debug(result);
            utility.log("Invitation updated Successfully fn insertInvitationEntity_back");
            Invitees.remove({Invitations_id:result_invite._id},function(err,res){
              if(err){
              utility.log("delete error in insertInvitationEntity() error: " + error, 'ERROR');
              
              }
              else{
                utility.debug('deleted all previous invitees.')
                 InsertMeetingInvitees(EmailAddresses,Invitees,result_invite._id,addresses,0,function(){ InsertMeetingTolls(connection,localtolls);});
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
  



}






function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes*60000);
}
function minutesDiff(start, end){
  var diff = start.getTime() - end.getTime(); // this is a time in milliseconds
  return parseInt(diff/(1000*60));
}



//////////////////////////////


function GetUserSettings(response, connection, userID) {
    if (connection == null) {
        utility.log('database connection is null', 'ERROR');
        response.setHeader("content-type", "text/plain");
        response.write(unSuccessJson("Database Connection Failed."));
        response.end();
        return;
    }
    var setting = {
        "UserInfo": {},
        "Registration": {},
        "EmailAddresses": [],
        "Location": {}
    };
    
    var Users = connection.collection('Users');
    var Registrations = connection.collection('Registrations');
    var EmailAddresses = connection.collection('EmailAddresses');
    var UserLocation = connection.collection('UserLocation');

    Users.findOne({ "UserID": userID }, function (err, usr) {
        if (err) {
            utility.log("Error in find Users : " + err, 'ERROR');
            response.setHeader("content-type", "text/plain");
            response.write(unSuccessJson(error));
            response.end();
        }
        setting.UserInfo = usr;

        Registrations.findOne({ "UserID": userID }, function (err, reg) {
            if (err) {
                utility.log("Error in find Registrations : " + err, 'ERROR');
                response.setHeader("content-type", "text/plain");
                response.write(unSuccessJson(error));
                response.end();
            }
            setting.Registration = reg;

            EmailAddresses.find({ "UserID": userID }).toArray(function (err, emails) {
                if (err) {
                    utility.log("Error in find EmailAddresses : " + err, 'ERROR');
                    response.setHeader("content-type", "text/plain");
                    response.write(unSuccessJson(error));
                    response.end();
                }
                setting.EmailAddresses = emails;

                UserLocation.findOne({ "UserID": userID }, function (err, loc) {
                    if (err) {
                        utility.log("Error in find UserLocation : " + err, 'ERROR');
                        response.setHeader("content-type", "text/plain");
                        response.write(unSuccessJson(error));
                        response.end();
                    }
                    setting.Location = loc;

                    utility.log(setting);
                    response.setHeader("content-type", "text/plain");
                    //response.write("{\"Emails\":" + JSON.stringify(result) + "}");
                    response.write(SuccessJsonWithObjects(setting));
                    response.end();

                });

            });

        });


    });
    
    
    
    

    
    
}


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
exports.SaveUserLocation=SaveUserLocation;
exports.getUserLocation=getUserLocation;
exports.GetUserSettings = GetUserSettings;
