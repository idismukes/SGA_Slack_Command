// This file will handle the google api calls for index.js

// temp calendar representing room 1
const roomOneID = '98453t5augch49p0m3a3v5cst0@group.calendar.google.com';
// temp calendar respresenting room 2
const roomTwoID = '7r16kglf0lom0bhshqcfin76sg@group.calendar.google.com';

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_PATH = 'token.json';

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback, roomId, times, data) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getAccessToken(oAuth2Client, callback, roomId, times);
      oAuth2Client.setCredentials(JSON.parse(token));
      callback(oAuth2Client, roomId, times);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback, roomId, times) {
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
            callback(oAuth2Client, roomId, times);
        });
    });
}

// handles a reserve call
exports.handleReserve = function (roomId, times) {
    // Load client secrets from a local file.
    fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Calendar API.
        authorize(JSON.parse(content), reserve, roomId, times);
    });

    function reserve(auth, id, times) {
        const calendar = google.calendar({version: 'v3', auth});
        calendar.events.list({})
    }
}

// handles a check call
exports.handleCheck = function (roomId, times) {
    console.log('reached handleCheck');
    // Load client secrets from a local file.
    fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Calendar API.
        // authorize(JSON.parse(content), listEvents);
        authorize(JSON.parse(content), check, roomId, times);
    });

    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     * @param {Object} credentials The authorization client credentials.
     * @param {function} callback The callback to call with the authorized client.
     */
    function authorize(credentials, callback, roomId, times, data) {
        const {client_secret, client_id, redirect_uris} = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris[0]);

      // Check if we have previously stored a token.
      fs.readFile(TOKEN_PATH, (err, token) => {
          if (err) return getAccessToken(oAuth2Client, callback, roomId, times);
          oAuth2Client.setCredentials(JSON.parse(token));
          callback(oAuth2Client, roomId, times);
        });
    }

    /**
     * Get and store new token after prompting for user authorization, and then
     * execute the given callback with the authorized OAuth2 client.
     * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
     * @param {getEventsCallback} callback The callback for the authorized client.
     */
    function getAccessToken(oAuth2Client, callback, roomId, times) {
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
                callback(oAuth2Client, roomId, times);
            });
        });
    }

    function check(auth, id, times) {
        console.log('reached');
        let calendar = google.calendar({version: 'v3', auth});
        let check = true;
        calendar.events.list({
            calendarId: id,
            timeMin: times[0].toISOString(),
            timeMax: times[1].toISOString(),
            singleEvents: true,
            orderBy: 'startTime'
        }, (err, res) => {
            if (err) return console.log('The API returned an error');
            let events = res.data.items;
            if (events.length) {
                // events found
                // look for open spots

                // iterates through events
                for (let ev of events) {
                    let s = new Date(ev.start.dateTime);            // gets an event's start time
                    let e = new Date(ev.end.dateTime);              // gets an event's end time
                    if ((s < times[0] && times[0] < e)
                        || (e < times[1] && times[1] < e)) {
                            check = false;
                            break;
                    }
                }
                return check;
            } else {
                // no events found
                return true;
            }
        });
    }
}

exports.generateDate = function (date, time) {
    let datArr = date.split("/");
    let timArr = time.split(":");

    let mo = parseInt(datArr[0]);
    let da = parseInt(datArr[1]);
    let ye = parseInt(datArr[2]);

    let hr = parseInt(timArr[0]);
    let mi = parseInt(timArr[1]);

    let finalDate = new Date(ye, mo, da, hr, mi);
    return finalDate;
}

exports.verifyDates = function (date1, date2) {
    return (date1 <= date2) <= 0;
}
