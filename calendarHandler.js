const roomOneID = '98453t5augch49p0m3a3v5cst0@group.calendar.google.com';
const roomTwoID = '7r16kglf0lom0bhshqcfin76sg@group.calendar.google.com';

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const promise = require('promise');

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_PATH = 'token.json';

// slack safety stuff
// const express = require('express');
// const bodyParser = require('body-parser');
// const app = express();
//
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// slack safety stuff


exports.generateDate = function (date, time) {
    let dateArray = date.split("/");
    let timeArray = time.split(":");

    let month = parseInt(dateArray[0]) - 1;
    let day = parseInt(dateArray[1]);
    let year = parseInt(dateArray[2]);

    let hour = parseInt(timeArray[0]);
    let minute = parseInt(timeArray[1]);

    let newDate = new Date(year, month, day, hour, minute);
    return newDate;
}

exports.verifyDates = function (date1, date2) {
    return (date1 <  date2);
}

exports.handleCheck = function (room, times, test) {
    fs.readFile('credentials.json', (err, content) => {
        if (err) {
            let data = {
                response_type: 'ephemeral',
                text: 'Error loading client secret file.'
            };
            test.json(data);
            return;
        }
        authorize(JSON.parse(content), check, room, times, test);
    });
}

exports.handleReserve = function (room, times, test) {
    fs.readFile('credentials.json', (err, content) => {
        if (err) {
            let data = {
                response_type: 'ephemeral',
                text: 'Error loading client secret file.'
            };
            test.json(data);
            return;
        }
        authorize(JSON.parse(content), reserve, room, times, test);
    });
}

function authorize(credentials, callback, room, times, test) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) {
            getAccessToken(oAuth2Client, callback, room, times, test);
            return;
        }
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client, room, times, test);
    });
}

function getAccessToken(oAuth2Client, callback, room, times, test) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client, room, times, test);
        });
    });
}

function check(auth, room, times, test) {
    let calendar = google.calendar({version: 'v3', auth});
    calendar.events.list({
        calendarId: room,
        timeMin: times[0].toISOString(),
        timeMax: times[1].toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
    }, (err, googleResponse) => {
        if (err) {
            let data = {
                response_type: 'ephemeral',
                text: 'The Google API returned an error'
            };
            test.json(data);
            return;
        }
        let events = googleResponse.data.items;
        let check = true;
        if (events.length) {
            for (let ev of events) {
                let start = new Date(ev.start.dateTime);
                let end = new Date(ev.end.dateTime);
                if ((start <= times[0] && times[0] < end) || (start <= times[1] && times[1] < end)) {
                    check = false;
                    break;
                }
            }
            if (!check) {
                let data = {
                    response_type: 'ephemeral',
                    text: 'This room is unavailable at the requested time'
                };
                test.json(data);
                return;
            }
        }
        let data = {
            response_type: 'ephemeral',
            text: 'This room is available at the requested time'
        };
        test.json(data);
        return;
    });
}

async function reserve(auth, room, times, test) {
    let calendar = google.calendar({version: 'v3', auth});
    let today = new Date(times[0].getFullYear(), times[0].getMonth(), times[0].getDate());
    let tomorrow = new Date(times[1].getFullYear(), times[1].getMonth(), times[1].getDate() + 1);
    let check = true;
    calendar.events.list({
        calendarId: room,
        timeMin: today.toISOString(),
        timeMax: tomorrow.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
    }, (err, googleResponse) => {
        let events = googleResponse.data.items;
        if (events.length) {
            for (let ev of events) {
                let start = new Date(ev.start.dateTime);
                let end = new Date(ev.end.dateTime);
                if ((start <= times[0] && times[0] < end) || (start <= times[1] && times[1] < end)) {
                    check = false;
                    break;
                }
            }
        }
    });
    await sleep(1000);      //DONT TOUCH THIS LINE OF CODE OTHERWISE IT DOES NOT WORK
    if (check) {
        let newEvent = {
            summary: 'Event',
            start: {'dateTime': times[0].toISOString()},
            end: {'dateTime': times[1].toISOString()}
        };
        calendar.events.insert({
            auth: auth,
            calendarId: room,
            resource: newEvent
        }, (err, googleResponse) => {
            if (err) {
                let data = {
                    response_type: 'ephemeral',
                    text: 'The Google Calendar API returned an error.'
                };
                test.json(data);
                return;
            }
        });
        let data = {
            response_type: 'ephemeral',
            text: 'Successfully reserved the room for the requested time.'
        };
        test.json(data);
        return;
    } else {
        let data = {
            response_type: 'ephemeral',
            text: 'This room is unavailable for reservation at the requested time.'
        };
        test.json(data);
        return;
    }
}

// async function delete(auth, room, time, test) {
//     let calendar = google.calendar({version: 'v3', auth});
//     let today = new Date(time.getFullYear(), time.getMonth(), time.getDate());
//     let tomorrow = new Date(time.getFullYear(), time.getMonth(), time.getDate() + 1);
//     let eventId = null;
//     calendar.events.list({
//         calendarId: room,
//         timeMin: today.toISOString(),
//         timeMax: tomorrow.toISOString(),
//         singleEvents: true,
//         orderBy: 'startTime'
//     }, (err, googleResponse) => {
//         let events = googleResponse.data.items;
//         if (events.length) {
//             for (let ev of events) {
//                 let start = new Date(ev.start.dateTime);
//                 let end = new Date(ev.end.dateTime);
//                 // console.log((start < times[0] && times[0] < end) || (start < times[1] && times[1] < end));
//                 if ((start < times[0] && times[0] < end) || (start < times[1] && times[1] < end)) {
//                     eventId = ev.id;
//                     break;
//                 }
//             }
//         }
//     });
//     await sleep(500);
//     console.log(eventId);
//     if (eventId == null) {
//         let data = {
//             response_type: 'ephemeral',
//             text: 'No events found to delete.'
//         };
//         test.json(data);
//         return;
//     }
//     calendar.events.delete({
//         calendarId: room,
//         eventId: eventId
//     }, (err, googleResponse) => {
//         if (err) {
//             let data = {
//                 response_type: 'ephemeral',
//                 text: 'The Google Calendar API returned an error.'
//             };
//             test.json(data);
//             return;
//         }
//     });
//     let data = {
//         response_type: 'ephemeral',
//         text: 'Successfully deleted the event'
//     };
//     test.json(data);
//     return;
// }

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}
