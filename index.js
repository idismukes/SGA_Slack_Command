// this file contains the server that the slack / commands will call
// classic node.js app stuff
'use strict'
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const moment = require('moment');
const tools = require('./newTools');
const promise = require('promise');

// calendar ids for room 1 and room 2
const roomOneCalId = '98453t5augch49p0m3a3v5cst0@group.calendar.google.com';
const roomTwoCalId = '7r16kglf0lom0bhshqcfin76sg@group.calendar.google.com';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(3000, () => { console.log('Server listening on '
    + 'port %d in %s mode', server.address().port,
    app.settings.env);});

app.post('/check', function (req, res) {
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
            data = promise.denodeify(tools.handleCheck(roomOneCalId, times), );
            // console.log(tools.handleCheck(roomOneCalId, times));
        } else if (room == 'room2') {
            data = promise.denodeify(tools.handleCheck(roomTwoCalId, times));
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
            data = promise.denodeify(tools.handleReserve(roomOneCalId, times));
        } else if (room == 'room2') {
            data = promise.denodeify(tools.handleReserve(roomTwoCalId, times));
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
