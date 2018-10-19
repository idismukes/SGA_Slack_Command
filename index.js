// this file contains the server that the slack / commands will call
// classic node.js app stuff
'use strict'
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const moment = require('moment');
const tools = require('./newTools');
const promise = require('promise');

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_PATH = 'token.json';

// calendar ids for room 1 and room 2
const roomOneCalId = '98453t5augch49p0m3a3v5cst0@group.calendar.google.com';
const roomTwoCalId = '7r16kglf0lom0bhshqcfin76sg@group.calendar.google.com';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(3000, () => { console.log('Server listening on '
    + 'port %d in %s mode', server.address().port,
    app.settings.env);});

app.post('/check', async function (req, res) {
    let text = req.body.text.split(" ");
    let data;

    if (text.length != 4) {
        data = {
            response_type: 'ephemeral',
            text: 'When using the check command, please format your response as '
                 + '"Room Name" "Date (MM/DD/YYYY)" "Start Time" "End Time".'
        };
        res.json(data);
        return;
    }

    let room = text[0];
    let startDate = tools.generateDate(text[1], text[2]);
    let endDate = tools.generateDate(text[1], text[3]);
    let times = [startDate, endDate];

    if (tools.verifyDates(startDate, endDate)) {
        if (room == 'room1') {
            data = new Promise(resolve => resolve(handle(roomOneCalId, times, check)));
            data.then(() =>{
                console.log(data);
            });
            // console.log(tools.handleCheck(roomOneCalId, times));
        } else if (room == 'room2') {
            data = handle(roomTwoCalId, times, check);
        } else {
            data = {
                response_type: 'ephemeral',
                text: 'When using the check command, the room name should be either '
                    + '"room1" or "room2".'
            };
        }
        res.json(data);
        return;
    } else {
        data = {
            response_type: 'ephemeral',
            text: 'When using the check command, the starting time must be less than '
                + 'the ending time'
        };
        res.json(data);
        return;
    }
});

app.post('/reserve', function (req, res) {
    let text = req.body.text.split(" ");
    let data;

    if (text.length != 4) {
        data = {
            response_type: 'ephemeral',
            text: 'When using the check command, please format your response as '
                 + '"Room Name" "Date (MM/DD/YYYY)" "Start Time" "End Time".'
        };
        res.json(data);
        return;
    }

    let room = text[0];
    let startDate = tools.generateDate(text[1], text[2]);
    let endDate = tools.generateDate(text[1], text[3]);
    let times = [startDate, endDate];

    if (tools.verifyDates(startDate, endDate)) {
        if (room == 'room1') {
            // data = promise.denodeify(tools.handleReserve(roomOneCalId, times));
            data = handle(roomOneCalId, times, reserve);
            console.log(data);
        } else if (room == 'room2') {
            // data = promise.denodeify(tools.handleReserve(roomTwoCalId, times));
            data = handle(roomTwoCalId, times, reserve);
            console.log(data);
        } else {
            data = {
                response_type: 'ephemeral',
                text: 'When using the reserve command, the room name should be either '
                    + '"room1" or "room2".'
            };
        }
        res.json(data);
        return;
    } else {
        data = {
            response_type: 'ephemeral',
            text: 'When using the reserve command, the starting time must be less than '
                + 'the ending time'
        };
        res.json(data);
        return;
    }

});

app.post('/calendar_help', function (req, res) {
    let help_check = 'Check use: "/check ROOM MM/DD/YYYY HH:MM HH:MM"\n';
    let help_reserve = 'Reserve use: "/reserve ROOM MM/DD/YYYY HH:MM HH:MM"';
    let help = help_check + help_reserve;

    let data = {
        response_type: 'ephemeral',
        text: help
    };
    res.json(data);
    return;
});


// app.post('/reserve', function (req, res) {
//     let text = req.body.text.split(" ");
//     if (text[1] == 'room1') {
//         // reserve room1
//     } else if (text[1] == 'room2') {
//         // reserve room2
//     } else {
//         // reserve whatever room is available
//     }
//     let data = {
//         response_type: 'in_channel',
//         text: 'reserve called'
//     };
//     res.json(data);
// });
// app.post('/check', function (req, res) {
//     // slack response
//     let data;
//     // an ideal response will be of the format
//     // roomName, date, startTime, endTime
//     let text = req.body.text.split(" ");
//     if (text.length != 4) {
//         data = {
//             response_type: 'ephemeral',
//             text: 'When using the check command, please format your response as '
//                 + '"Room Name" "Date (MM/DD/YYYY)" "Start Time" "End Time"'
//         }
//     } else {
//         let data;
//         let slackResponse;
//         let room = text[0];
//
//         let startDate = tools.generateDate(text[1], text[2]);
//         let endDate = tools.generateDate(text[1], text[3]);
//
//         console.log(startDate);
//         console.log(endDate);
//
//         if (tools.verifyDates(startDate, endDate)) {
//             let params = [startDate, endDate];
//             if (room = 'room1') {
//                 // check room1
//                 tools.handleCheck(roomOneCalId, params, data);
//                 let b = tools.handleCheck(roomOneCalId, params, data);
//                 if (b) {
//                     slackResponse = 'room1 reserved from '
//                         + startDate.toDateString() + ' to ' + endDate.toDateString();
//                 } else {
//                     slackResponse = 'room1 unavailable';
//                 }
//                 data = {
//                     response_type: 'ephemeral',
//                     text: slackResponse
//                 };
//             } else if (room == 'room2') {
//                 // check room2
//                 let b = tools.handleCheck(roomTwoID, params, data);
//                 if (b) {
//                     slackResponse = 'room2 reserved from '
//                         + startDate.toDateString() + ' to ' + endDate.toDateString();
//                 } else {
//                     slackResponse = 'room2 unavailable';
//                 }
//                 data = {
//                     response_type: 'ephemeral',
//                     text: slackResponse
//                 };
//             } else {
//                 // check both rooms or handle bad input idk yet
//                 data = {
//                     response_type: 'ephemeral',
//                     text: 'room name is invalid'
//                 }
//             }
//         } else {
//             // dates are invalid
//             data = {
//                 response_type: 'ephemeral',
//                 text: 'times are invalid'
//             };
//         }
//     }
//     res.json(data);
// });
async function handle(roomID, times, callback) {
    let response = await fs.readFile('credentials.json', (err, content) => {
        if (err) {
            // change this to send a response to slack later
            let data = {
                response_type: 'ephemeral',
                text: 'An error occurred while loading the client secret file'
            };
            // return console.log('Error loading client secret file: ', err);
            return data;
        }
        return authorize(JSON.parse(content), callback, roomID, times);
    });
    return response;
}

async function authorize(credentials, callback, roomID, times) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    return await fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) {
            return getAccessToken(oAuth2Client, callback, roomID, times);
        }
        oAuth2Client.setCredentials(JSON.parse(token));
        let x = callback(oAuth2Client, roomID, times);
        console.log(x);
        console.log('yes');
        // return callback(oAuth2Client, roomID, times);
        return x;
    });
}

async function getAccessToken(oAuth2Client, callback, roomID, times) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            return callback(oAuth2Client, roomID, times);
        });
    });
}

async function check(auth, roomID, times) {
    let calendar = google.calendar({version: 'v3', auth});
    let check = true;
    return calendar.events.list({
        calendarId: roomID,
        timeMin: times[0].toISOString(),
        timeMax: times[1].toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
    }, (err, res) => {
        if (err) {
            let data = {
                response_type: 'ephemeral',
                text: 'The Google Calendar API returned an error.'
            };
            return data;
        }
        let events = res.data.items;
        if (events.length) {
            for (let ev of events) {
                let s = new Date(ev.start.dateTime);
                let e = new Date(ev.end.dateTime);
                if ((s < times[0] && times[0] < e)
                    || (s < times[1] && times[1] < e)) {
                    check = false;
                    break;
                }
            }
            if (!check) {
                let data = {
                    response_type: 'ephemeral',
                    text: 'This room is unavailable for reservation at the requested time.'
                };
                return data;
            }
        }
        let data = {
            response_type: 'in_channel',
            text: 'This room is available for reservation at the requested time.'
        };
        return data;
    });
}

async function reserve(auth, roomID, times) {
    let calendar = google.calendar({version: 'v3', auth});
    console.log(calendar);
    // has to check if the room is available
    var condition = calendar.events.list({
        calendarId: roomID,
        timeMin: times[0].toISOString(),
        timeMax: times[1].toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
    }, (err, res) => {
        if (err) {
            let data = {
                response_type: 'ephemeral',
                text: 'The Google Calendar API returned an error.'
            };
            return data;
        }
        let events = res.data.items;
        let check = true
        if (events.length) {
            for (let ev of events) {
                let s = new Date(ev.start.dateTime);
                let e = new Date(ev.end.dateTime);
                if ((s < times[0] && times[0] < e)
                    || (s < times[1] && times[1] < e)) {
                    check = false;
                    break;
                }
            }
        }
        return check;
    });
    if (condition) {
        let addedEvent = {
            summary: 'New Event',
            start: {'dateTime': times[0].toISOString()},
            end: {'dateTime': times[1].toISOString()}
        };
        calendar.events.insert({
            auth: auth,
            calendarId: roomID,
            resource: addedEvent
        }, (err, res) => {
            if (err) {
                let data = {
                    response_type: 'ephemeral',
                    text: 'The Google Calendar API returned an error.'
                };
                return data;
            }
        });
        let data = {
            response_type: 'in_channel',
            text: 'Successfully reserved room for the requested time.'
        }
        return data;
    } else {
        let data = {
            response_type: 'ephemeral',
            text: 'This room is unavailable for reservation at the requested time'
        };
        return data;
    }
}
