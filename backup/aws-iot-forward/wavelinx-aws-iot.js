/*
 * Copyright 2010-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *  http://aws.amazon.com/apache2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

//node.js deps
const http = require('https');
const globalHost = '10.127.244.60';

//npm deps

//app deps
const deviceModule = require('..').device;
const cmdLineProcess = require('./lib/cmdline');
var globalLoginToken = '';
//begin module

function processTest(args) {
   //
   // The device module exports an MQTT instance, which will attempt
   // to connect to the AWS IoT endpoint configured in the arguments.
   // Once connected, it will emit events which our application can
   // handle.
   //
   const device = deviceModule({
      keyPath: args.privateKey,
      certPath: args.clientCert,
      caPath: args.caCert,
      clientId: args.clientId,
      region: args.region,
      baseReconnectTimeMs: args.baseReconnectTimeMs,
      keepalive: args.keepAlive,
      protocol: args.Protocol,
      port: args.Port,
      host: args.Host,
      debug: args.Debug
   });

   var timeout;
   var count = 0;
   const minimumDelay = 250;

   if (args.testMode === 1) {
      //device.subscribe('topic_1');
      device.subscribe('$aws/things/optimus-raspi/shadow/forward');
   } else {
      device.subscribe('$aws/things/optimus-raspi/shadow/forward');
   }
   if ((Math.max(args.delay, minimumDelay)) !== args.delay) {
      console.log('substituting ' + minimumDelay + 'ms delay for ' + args.delay + 'ms...');
   }
   timeout = setInterval(function() {
      count++;

      if (args.testMode === 1) {
         device.publish('topic_2', JSON.stringify({
            mode1Process: count
         }));
      } else {
         device.publish('topic_1', JSON.stringify({
            mode2Process: count
         }));
      }
   }, Math.max(args.delay, minimumDelay)); // clip to minimum

   //
   // Do a simple publish/subscribe demo based on the test-mode passed
   // in the command line arguments.  If test-mode is 1, subscribe to
   // 'topic_1' and publish to 'topic_2'; otherwise vice versa.  Publish
   // a message every four seconds.
   //
   device
      .on('connect', function() {
         console.log('connect');
      });
   device
      .on('close', function() {
         console.log('close');
      });
   device
      .on('reconnect', function() {
         console.log('reconnect');
      });
   device
      .on('offline', function() {
         console.log('offline');
      });
   device
      .on('error', function(error) {
         console.log('error', error);
      });
   device
      .on('message', function(topic, payload) {
         console.log('------------------------------------');
         console.log('Incoming Message');
         console.log(topic, payload.toString());
         const msgJson = JSON.parse(payload.toString());
         const command = msgJson.command;
         switch(command) {
            case "login":
               {
                  const jsonData = JSON.stringify({"userName":"WclAdmin","password":"wclAdmin"});
                  var options = {
                        //host: globalHost,
                        //path: '/v1/authentication/login',
                        host: 'httpbin.org',
                        path: '/post',
                        method: 'POST',
                        headers: {
                           'Content-Type': 'application/json',
                           'Content-Length': jsonData.length,
                           'Token':'XXX_LOGIN_TOKEN_XXX'
                        }
                  };

                  return new Promise((resolve, reject) => {
                     httpRequest(options,jsonData).then((response) => {
                         var respUserName = JSON.parse(response.data).userName.toString();
                         globalLoginToken = response.headers['Token'].toString();
                         console.log(respUserName + ' user logged in successfully !'); 
                         console.log(globalLoginToken); 
                     }).catch((error) => {
                        console.log(error.stack);
                     });
                  });

                  break;
               }

               case "logout":
               {
                  const jsonData = '';
                  var options = {
                        //host: globalHost,
                        //path: '/v1/authentication/logout',
                        host: 'httpbin.org',
                        path: '/post',
                        method: 'POST',
                        headers: {
                           'Content-Type': 'application/json',
                           'Content-Length': jsonData.length,
                           'Token': globalLoginToken
                        }                        
                  };

                  return new Promise((resolve, reject) => {
                     httpRequest(options,jsonData).then((response) => {
                         console.log(response.headers['Token'].toString()); 
                     }).catch((error) => {
                        console.log(error.stack);
                     });
                  });

                  break;
               }

               case "create_area":
               {
                  const areaName = msgJson.area.name.toString();
                  const jsonData = JSON.stringify({"parentId":null,"name": areaName,"defaultType":"normal","sceneToSceneFadeTime":1500,"offToSceneFadeTime":1500});
                  var options = {
                        //host: globalHost,
                        //path: '/v1/areas/0',
                        host: 'httpbin.org',
                        path: '/post',
                        method: 'POST',
                        headers: {
                           'Content-Type': 'application/json',
                           'Content-Length': jsonData.length,
                           'Token': globalLoginToken
                        }                        
                  };

                  return new Promise((resolve, reject) => {
                     httpRequest(options,jsonData).then((response) => {
                        var respAreaName = JSON.parse(response.data).name.toString();
                        console.log(respAreaName + ' area created successfully !'); 
                        console.log('Token: ' + response.headers['Token'].toString());                        
                     }).catch((error) => {
                        console.log(error.stack);
                     });
                  });

                  break;
               }

               case "create_zone":
               {
                  const areaName = msgJson.area.name.toString();
                  const zoneName = msgJson.zone.name.toString();
                  const jsonData = JSON.stringify({"name":zoneName,"dimmableLight":{"operationMode":"FOLO","maxLevel":90,"minLevel":0},"type":"DIMMABLE_LIGHT"});
                  var options = {
                        //host: globalHost,
                        //path: '/v1/areas/0',
                        host: 'httpbin.org',
                        path: '/post',
                        method: 'POST',
                        headers: {
                           'Content-Type': 'application/json',
                           'Content-Length': jsonData.length,
                           'Token': globalLoginToken
                        }                        
                  };

                  return new Promise((resolve, reject) => {
                     httpRequest(options,jsonData).then((response) => {
                        var respZoneName = JSON.parse(response.data).name.toString();
                        console.log(respZoneName + " zone created successfully in " + areaName + " area !"); 
                        console.log('Token: ' + response.headers['Token'].toString());                        
                     }).catch((error) => {
                        console.log(error.stack);
                     });
                  });
                  break;
               }
         }         
      });

}

function httpRequest(options, data) {
   return new Promise(((resolve, reject) => {
 
     const request = http.request(options, (response) => {
       response.setEncoding('utf8');
       let returnData = '';
         
       if (response.statusCode < 200 || response.statusCode >= 300) {
         return reject(new Error(`${response.statusCode}: ${response.req.getHeader('host')} ${response.req.path}`));
       }
 
       response.on('data', (chunk) => {
         returnData += chunk;
       });
 
       response.on('end', () => {
         resolve(JSON.parse(returnData));
       });
 
       response.on('error', (error) => {
         reject(error);
       });
     });
     
     request.on('error', function (error) {
       reject(error);
     });
     
     request.write(data);
     request.end();
   }));
 }

module.exports = cmdLineProcess;

if (require.main === module) {
   cmdLineProcess('connect to the AWS IoT service and publish/subscribe to topics using MQTT, test modes 1-2',
      process.argv.slice(2), processTest);
}
