// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
// 1. Constants ===========================================================================
const Alexa = require('ask-sdk-core');
const http = require('https');

const invocationName = "wave lexa";

// 2. Intent Handlers =============================================

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Welcome to WaveLexa, The Wavelinx Assistant. How may I help you ?';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'How may I help you ?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

const CreateAreaIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'CreateAreaIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        var areaName = request.intent.slots.area_name.value;

        //let say = 'Creating Area, Please Wait ...';
        const jsonData = JSON.stringify({"name" : areaName});
        
       /*var options = {
            host: '49.35.32.92',
            path: '/v1/areas/0',
            port: '52725',
            method: 'POST',
            'Content-Type': 'application/json',
            'Content-Length': jsonData.length
        };*/
        /*
        var options = {
            host: 'httpbin.org',
            path: '/get',
            method: 'GET',
        };*/
        
        
        var options = {
            host: 'httpbin.org',
            path: '/post',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': jsonData.length
            },
        };
        
        return new Promise((resolve, reject) => {
                httpRequest(options,jsonData).then((response) => {
                    var respAreaName = JSON.parse(response.data).name
                    console.log('Area Created: ');
                    console.log(areaName);
                    resolve(handlerInput.responseBuilder
                    .speak(respAreaName + " area created successfully !")
                    .reprompt(respAreaName + " area created successfully !")
                    .getResponse());
            }).catch((error) => {
                resolve(handlerInput.responseBuilder.speak('Request Failed !').getResponse());
            });
        });
    },
};

const CreateZoneIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'CreateZoneIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        var areaName = request.intent.slots.area_name.value;
        var zoneType = request.intent.slots.zone_type.value;
        
        const jsonData = JSON.stringify({"area":{"name" : areaName}, "zone":{"name" : zoneType}});
        
        var options = {
            host: 'httpbin.org',
            path: '/post',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': jsonData.length
            },
        };

        return new Promise((resolve, reject) => {
                httpRequest(options,jsonData).then((response) => {
                    var respAreaName = JSON.parse(response.data).area.name
                    var respZoneName = JSON.parse(response.data).zone.name
                    console.log('Created Zone: ');
                    console.log(respZoneName);
                    console.log('In Area: ');
                    console.log(respAreaName);
                    resolve(handlerInput.responseBuilder
                    .speak(respZoneName + " zone created successfully in " + respAreaName + " area")
                    .reprompt(respZoneName + " zone created successfully in " + respAreaName + " area")
                    .getResponse());
            }).catch((error) => {
                resolve(handlerInput.responseBuilder.speak('Request Failed !').getResponse());
            });
        });
    },
};


function httpRequest(options, data) {
  return new Promise(((resolve, reject) => {

    const request = http.request(options, (response) => {
      response.setEncoding('utf8');
      let returnData = '';

        console.log('Request Data : ');
        console.log(request.data);
        console.log('Response Data: ');
        console.log(response.data);
        
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

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
/*const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};*/

const SessionEndedHandler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
        return handlerInput.responseBuilder.getResponse();
    }
};
// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// 3.  Helper Functions ===================================================================
function getSlotValues(filledSlots) { 
    const slotValues = {}; 
 
    Object.keys(filledSlots).forEach((item) => { 
        const name  = filledSlots[item].name; 
 
        if (filledSlots[item] && 
            filledSlots[item].resolutions && 
            filledSlots[item].resolutions.resolutionsPerAuthority[0] && 
            filledSlots[item].resolutions.resolutionsPerAuthority[0].status && 
            filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) { 
            switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) { 
                case 'ER_SUCCESS_MATCH': 
                    slotValues[name] = { 
                        heardAs: filledSlots[item].value, 
                        resolved: filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name, 
                        ERstatus: 'ER_SUCCESS_MATCH' 
                    }; 
                    break; 
                case 'ER_SUCCESS_NO_MATCH': 
                    slotValues[name] = { 
                        heardAs: filledSlots[item].value, 
                        resolved: '', 
                        ERstatus: 'ER_SUCCESS_NO_MATCH' 
                    }; 
                    break; 
                default: 
                    break; 
            } 
        } else { 
            slotValues[name] = { 
                heardAs: filledSlots[item].value, 
                resolved: '', 
                ERstatus: '' 
            }; 
        } 
    }, this); 
 
    return slotValues; 
} 

function getExampleSlotValues(intentName, slotName) { 
 
    let examples = []; 
    let slotType = ''; 
    let slotValuesFull = []; 
 
    let intents = model.interactionModel.languageModel.intents; 
    for (let i = 0; i < intents.length; i++) { 
        if (intents[i].name === intentName) { 
            let slots = intents[i].slots; 
            for (let j = 0; j < slots.length; j++) { 
                if (slots[j].name === slotName) { 
                    slotType = slots[j].type; 
 
                } 
            } 
        } 
         
    } 
    let types = model.interactionModel.languageModel.types; 
    for (let i = 0; i < types.length; i++) { 
        if (types[i].name === slotType) { 
            slotValuesFull = types[i].values; 
        } 
    } 
 
 
    examples.push(slotValuesFull[0].name.value); 
    examples.push(slotValuesFull[1].name.value); 
    if (slotValuesFull.length > 2) { 
        examples.push(slotValuesFull[2].name.value); 
    } 
 
 
    return examples; 
} 
 
function sayArray(myData, penultimateWord = 'and') { 
    let result = ''; 
 
    myData.forEach(function(element, index, arr) { 
 
        if (index === 0) { 
            result = element; 
        } else if (index === myData.length - 1) { 
            result += ` ${penultimateWord} ${element}`; 
        } else { 
            result += `, ${element}`; 
        } 
    }); 
    return result; 
} 

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        CreateAreaIntent_Handler,
        CreateZoneIntent_Handler,
        //IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
        SessionEndedHandler
    )
    .addErrorHandlers(
        ErrorHandler,
    )
    .lambda();

// End of Skill code -------------------------------------------------------------
// Static Language Model for reference

const model = {
  "interactionModel": {
    "languageModel": {
      "invocationName": "wave lexa",
      "intents": [
        {
          "name": "AMAZON.CancelIntent",
          "samples": []
        },
        {
          "name": "AMAZON.HelpIntent",
          "samples": []
        },
        {
          "name": "AMAZON.StopIntent",
          "samples": []
        },
        {
          "name": "CreateAreaIntent",
          "slots": [
            {
              "name": "area_name",
              "type": "AREA_NAMES"
            }
          ],
          "samples": [
            "create area {area_name}"
          ]
        },
        {
          "name": "AMAZON.NavigateHomeIntent",
          "samples": []
        },
        {
          "name": "CreateZoneIntent",
          "slots": [
            {
              "name": "zone_type",
              "type": "ZONE_TYPES"
            },
            {
              "name": "area_name",
              "type": "AREA_NAMES"
            }
          ],
          "samples": [
            "create {zone_type} zone in area {area_name}"
          ]
        },
        {
          "name": "LaunchRequest"
        }
      ],
      "types": [
        {
          "name": "AREA_NAMES",
          "values": [
            {
              "name": {
                "value": "Staffroom"
              }
            },
            {
              "name": {
                "value": "Music Room"
              }
            },
            {
              "name": {
                "value": "Laboratory"
              }
            },
            {
              "name": {
                "value": "Gymnasium"
              }
            },
            {
              "name": {
                "value": "Classroom"
              }
            }
          ]
        },
        {
          "name": "ZONE_TYPES",
          "values": [
            {
              "name": {
                "value": "White Tuning"
              }
            },
            {
              "name": {
                "value": "Receptacle"
              }
            },
            {
              "name": {
                "value": "Dimmable"
              }
            }
          ]
        }
      ]
    }
  }
};
