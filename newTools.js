const roomOneID = '98453t5augch49p0m3a3v5cst0@group.calendar.google.com';
const roomTwoID = '7r16kglf0lom0bhshqcfin76sg@group.calendar.google.com';

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_PATH = 'token.json';

exports.generateDate = function (date, time) {
    let dateArray = date.split("/");
    let timeArray = time.split(":");

    let month = parseInt(dateArray[0]);
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

exports.handleCheck = function (roomID, times) {
    let response = fs.readFile('credentials.json', (err, content) => {
        if (err) {
            // change this to send a response to slack later
            // return console.log('Error loading client secret file: ', err);
            let data = {
                response_type: 'ephemeral',
                text: 'An error occurred while loading the client secret file'
            };
            return data;
        }
        return authorize(JSON.parse(content), check, roomID, times);
    });
    return response;
}

exports.handleReserve = function (roomID, times) {
    let response = fs.readFile('credentials.json', (err, content) => {
        if (err) {
            // change this to send a response to slack later
            let data = {
                response_type: 'ephemeral',
                text: 'An error occurred while loading the client secret file'
            };
            // return console.log('Error loading client secret file: ', err);
            return data;
        }
        return authorize(JSON.parse(content), reserve, roomID, times);
    });
    return response;
}




function authorize(credentials, callback, roomID, times) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    return fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) {
            return getAccessToken(oAuth2Client, callback, roomID, times);
        }
        oAuth2Client.setCredentials(JSON.parse(token));
        let x = callback(oAuth2Client, roomID, times);
        console.log(x);
        console.log('yes');
        return callback(oAuth2Client, roomID, times);
    });
}

function getAccessToken(oAuth2Client, callback, roomID, times) {
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

function check(auth, roomID, times) {
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

function reserve(auth, roomID, times) {
    let calendar = google.calendar({version: 'v3', auth});
    // has to check if the room is available
    let condition = calendar.event.list({
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
