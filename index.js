'use strict'

const roomOneID = '98453t5augch49p0m3a3v5cst0@group.calendar.google.com';
const roomTwoID = '7r16kglf0lom0bhshqcfin76sg@group.calendar.google.com';
const calendarHandler = require('./calendarHandler');

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(3001, () => {
    console.log('Server listening on port %d in %s mode', server.address().port, app.settings.env);
});

app.post('/check', function(req, res) {
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
    let startDate = calendarHandler.generateDate(text[1], text[2]);
    let endDate = calendarHandler.generateDate(text[1], text[3]);
    let times = [startDate, endDate];

    if (calendarHandler.verifyDates(startDate, endDate)) {
        if (room == 'room1') {
            calendarHandler.handleCheck(roomOneID, times, res);
            return;
        } else if (room == 'room2') {
            calendarHandler.handleCheck(roomTwoID, times, res);
            return;
        } else {
            data = {
                response_type: 'ephemeral',
                text: 'When using the check command, the room name should be either "room1" or "room2".'
            };
            res.json(data);
            return;
        }
    } else {
        data = {
            response_type: 'ephemeral',
            text: 'When using the check command, the starting time must be less than the end time.'
        };
        res.json(data);
        return;
    }
});

app.post('/reserve', function(req, res) {
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
    let startDate = calendarHandler.generateDate(text[1], text[2]);
    let endDate = calendarHandler.generateDate(text[1], text[3]);
    let times = [startDate, endDate];

    if (calendarHandler.verifyDates(startDate, endDate)) {
        if (room == 'room1') {
            calendarHandler.handleReserve(roomOneID, times, res);
            return;
        } else if (room == 'room2') {
            calendarHandler.handleReserve(roomTwoID, times, res);
        } else {
            data = {
                response_type: 'ephemeral',
                text: 'When using the check command, the room name should be either "room1" or "room2".'
            };
            res.json(data);
            return;
        }
    } else {
        data = {
            response_type: 'ephemeral',
            text: 'When using the check command, the starting time must be less than the end time.'
        };
        res.json(data);
        return;
    }
});

app.post('/calendar_help', function(req, res) {
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
