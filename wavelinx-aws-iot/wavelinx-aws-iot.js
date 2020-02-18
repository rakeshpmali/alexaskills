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
const ledTopic = '$aws/things/optimus-raspi/shadow/ledaction';
const wavelinxTopic = '$aws/things/optimus-raspi/shadow/wavelinx';

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
      device.subscribe(wavelinxTopic);
   } else {
      device.subscribe(ledTopic);
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

         if(topic === ledTopic)
         {
            const action = msgJson.action;
            var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
            var LED = new Gpio(17, 'out'); //use GPIO pin 4, and specify that it is output

            switch(action)
            {
               case 'turn on':
                  {
                     LED.writeSync(1);
                     break;
                  }
               case 'turn off':
                  {
                     LED.writeSync(0);
                     break;
                  }
               case 'blink':
                  {
                     var blinkInterval = setInterval(blinkLED, 250); //run the blinkLED function every 250ms

                     function blinkLED() { //function to start blinking
                        if (LED.readSync() === 0) { //check the pin state, if the state is 0 (or off)
                           LED.writeSync(1); //set pin state to 1 (turn LED on)
                        } else {
                           LED.writeSync(0); //set pin state to 0 (turn LED off)
                        }
                     }
         
                     function endBlink() { //function to stop blinking
                        clearInterval(blinkInterval); // Stop blink intervals
                        LED.writeSync(0); // Turn LED off
                        LED.unexport(); // Unexport GPIO to free resources
                     }
         
                     setTimeout(endBlink, 5000); //stop blinking after 5 seconds

                     break;
                  }
                  
                  default:
                  {
                  console.log("Error: Incorrect Action");
                  }
            }        

         } else if(topic == wavelinxTopic)
         {
            const command = msgJson.command;
            switch(command) {
               case "login":
                  {
                     //const jsonData = JSON.stringify({"userName":"WclAdmin","password":"wclAdmin@123"});
                     const jsonData = JSON.stringify({"userName":"DarkCAPI","password":"IamBatmanCunningham!"});
                     var options = {
                           host: globalHost,
                           path: '/v1/authentication/login',
                           method: 'POST',
                           headers: {
                              'Content-Type': 'application/json',
                              'Content-Length': jsonData.length,
                           }
                     };

                     return new Promise((resolve, reject) => {
                        httpRequest(options,jsonData).then((response) => {
                           globalLoginToken = JSON.parse(JSON.stringify(response)).token.toString();
                           console.log('token: ' + globalLoginToken);
                           console.log('user logged in successfully !'); 
                          }).catch((error) => {
                           console.log(error.stack);
                        });
                     });

                     break;
                  }

                  case "logout":
                  {
                     const jsonData = '';
                     console.log('token: ' + globalLoginToken);
                     var options = {
                           host: globalHost,
                           path: '/v1/authentication/logout',
                           method: 'POST',
                           headers: {
                              'Content-Type': 'application/json',
                              'Content-Length': jsonData.length,
                              'Token': globalLoginToken
                           }                        
                     };

                     return new Promise((resolve, reject) => {
                        httpRequest(options,jsonData).then((response) => {   
                           if(response.hasOwnProperty('info'))
                           {
                              console.log('user logged out successfully !');
                           }
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
                           host: globalHost,
                           path: '/v1/areas/0',
                           method: 'POST',
                           headers: {
                              'Content-Type': 'application/json',
                              'Content-Length': jsonData.length,
                              'Token': globalLoginToken
                           }                        
                     };

                     return new Promise((resolve, reject) => {
                        httpRequest(options,jsonData).then((response) => {
                           console.log('token: ' + globalLoginToken);
                           console.log('area created successfully !');                
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
                           host: globalHost,
                           path: '/v1/areas/6/zones/0',
                           method: 'POST',
                           headers: {
                              'Content-Type': 'application/json',
                              'Content-Length': jsonData.length,
                              'Token': globalLoginToken
                           }                        
                     };

                     return new Promise((resolve, reject) => {
                        httpRequest(options,jsonData).then((response) => {
                           console.log('token: ' + globalLoginToken);
                           console.log('zone created successfully');                       
                        }).catch((error) => {
                           console.log(error.stack);
                        });
                     });
                     break;
                  }
            }      
         }   
      });

}

function httpRequest(options, data) {
   return new Promise(((resolve, reject) => {
 
      process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
      const request = http.request(options, (response) => {
       response.setEncoding('utf8');
       let returnData = '';
         
       if (response.statusCode < 200 || response.statusCode >= 300) {
         return reject(new Error(`${response.statusCode}: ${response.req.getHeader('host')} ${response.req.path}`));
       }
 
       response.on('data', (chunk) => {
         //console.log('chunk: ' + chunk.toString());
         returnData += chunk;
       });
 
       response.on('end', () => {
          if(returnData.length > 0)
          {
            resolve(JSON.parse(returnData));
          } else {
            resolve({"info":"no response"}); 
          }
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
