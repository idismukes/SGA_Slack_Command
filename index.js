// this file contains the server that the slack / commands will call
// classic node.js app stuff
'use strict'
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const moment = require('moment');
const tools = require('./tools');

// calendar ids for room 1 and room 2
const roomOneCalId = '98453t5augch49p0m3a3v5cst0@group.calendar.google.com';
const roomTwoCalId = '7r16kglf0lom0bhshqcfin76sg@group.calendar.google.com';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(8081, () => { console.log('Server listening on '
    + 'port %d in %s mode', server.address().port,
    app.settings.env);});


app.post('/reserve', function (req, res) {
    let text = req.body.text.split(" ");
    if (text[1] == 'room1') {
        // reserve room1
    } else if (text[1] == 'room2') {
        // reserve room2
    } else {
        // reserve whatever room is available
    }
    let data = {
        response_type: 'in_channel',
        text: 'reserve called'
    };
    res.json(data);
});
app.post('/check', function (req, res) {
    // slack response
    let data;
    // an ideal response will be of the format
    // roomName, date, startTime, endTime
    let text = req.body.text.split(" ");
    if (text.length != 4) {
        data = {
            response_type: 'ephemeral',
            text: 'When using the check command, please format your response as '
                + '"Room Name" "Date (MM/DD/YYYY)" "Start Time" "End Time"'
        }
    } else {
        let data;
        let slackResponse;
        let room = text[0];

        let startDate = tools.generateDate(text[1], text[2]);
        let endDate = tools.generateDate(text[1], text[3]);

        console.log(startDate);
        console.log(endDate);

        if (tools.verifyDates(startDate, endDate)) {
            let params = [startDate, endDate];
            if (room = 'room1') {
                // check room1
                tools.handleCheck(roomOneCalId, params, data);
                let b = tools.handleCheck(roomOneCalId, params, data);
                if (b) {
                    slackResponse = 'room1 reserved from '
                        + startDate.toDateString() + ' to ' + endDate.toDateString();
                } else {
                    slackResponse = 'room1 unavailable';
                }
                data = {
                    response_type: 'ephemeral',
                    text: slackResponse
                };
            } else if (room == 'room2') {
                // check room2
                let b = tools.handleCheck(roomTwoID, params, data);
                if (b) {
                    slackResponse = 'room2 reserved from '
                        + startDate.toDateString() + ' to ' + endDate.toDateString();
                } else {
                    slackResponse = 'room2 unavailable';
                }
                data = {
                    response_type: 'ephemeral',
                    text: slackResponse
                };
            } else {
                // check both rooms or handle bad input idk yet
                data = {
                    response_type: 'ephemeral',
                    text: 'room name is invalid'
                }
            }
        } else {
            // dates are invalid
            data = {
                response_type: 'ephemeral',
                text: 'times are invalid'
            };
        }
    }
    res.json(data);
});
