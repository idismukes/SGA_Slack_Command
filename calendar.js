// sorry for the messy formatting btw
// calendar.js contains the logic that will eventually be placed in tools.js
// tools.js will be the file that index.js (the REST API) will call methods from

const service_account = 'calendar@sga-slack-calendar.iam.gserviceaccount.com';
const keyIDs = 'a4057ec010a783c0717a266fe21b4893b35383f9';

// both of these calendars are ones on my google account
// eventually, these two calendars will be belonging to a google service account
// temp calendar representing room 1
const roomOneID = '98453t5augch49p0m3a3v5cst0@group.calendar.google.com';
// temp calendar respresenting room 2
const roomTwoID = '7r16kglf0lom0bhshqcfin76sg@group.calendar.google.com';

const testStartTime = new Date(2018, 8, 21, 16, 30);
const testEndTime = new Date(2018, 8, 21, 17, 28);


// everything from line 21 to line 113 is what's provided by google's node.js example
// SEE HERE: https://developers.google.com/calendar/quickstart/nodejs
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Calendar API.
  // authorize(JSON.parse(content), check);
  //authorize(JSON.parse(content), reserve);           // testing reserve method
  authorize(JSON.parse(content), listEvents);        // testing listEvents method
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
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
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth) {
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.list({
    calendarId: roomOneID,
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = res.data.items;
    if (events.length) {
      console.log('Upcoming 10 events:');
      events.map((event, i) => {
        const start = event.start.dateTime || event.start.date;
        console.log(`${start} - ${event.summary}`);
      });
    } else {
      console.log('No upcoming events found.');
    }
  });
}

// same function as that in tools.js, just here to test if it works
function check(auth) {
    console.log('reached');

    let searchMin = new Date(testStartTime.getFullYear(), testStartTime.getMonth(), testStartTime.getDate());
    let searchMax = new Date(testEndTime.getFullYear(), testEndTime.getMonth(), testEndTime.getDate() + 1);

    let calendar = google.calendar({version: 'v3', auth});
    let check = true;
    calendar.events.list({
        calendarId: roomOneID,
        timeMin: searchMin.toISOString(),
        timeMax: searchMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
    }, (err, res) => {
        if (err) return console.log('CHECK: The API returned an error ' + err);
        let events = res.data.items;

        if (events.length) {
            // events found
            // look for open spots
            // let check = true;
            for (let ev of events) {
                let s = new Date(ev.start.dateTime);
                let e = new Date(ev.end.dateTime);

                if ((s < testStartTime && testStartTime < e)
                || (s < testEndTime && testEndTime < e)) {
                    check = false;
                    break;
                }
            }
            if (check) {
                console.log('available');
            } else {
                console.log('occupied');
            }
            // return check;
        } else {
            // no events found
            console.log('available');
            // return true;
        }
    });
    return check;
}

function reserve(auth) {
    // auth might not be good for more than one request
    // might need to basically reimplement this method

    if (check(auth)) {
        let calendar = google.calendar({version: 'v3', auth});
        let addedEvent = {
            summary: 'test',
            start: {
                'dateTime': testStartTime.toISOString()
            },
            end: {
                'dateTime': testEndTime.toISOString()
            }
        };
        calendar.events.insert({
            auth: auth,
            calendarId: roomOneID,
            resource: addedEvent
        }, (err, addedEvent) => {
            if (err) return console.log('RESERVE: The API returned an error ' + err);
            console.log('created an event');
        });
        return true;
    } else {
        console.log("could not reserve room");
        return false;
    }
}
