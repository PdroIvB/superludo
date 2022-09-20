const express = require('express');
const app = express();
const port = 9999;
const server = require('http').createServer(app);
const WebSocket = require('ws');
const { v4 } = require('uuid');
const { request, get } = require('http');
const { inspect } = require('node:util');

app.use(express.json());

const wsServer = new WebSocket.Server({ server:server });

const players = [];
const rooms = [];
let contador = 0;

wsServer.on('connection', function connection(ws){
    console.log('a new client has connected');

    let player = {
        id: v4(),
        connection: ws,
        roomID: null,
        pieces:[
            {
                id: 0,
                position: null,
                sprite: null
            },
            {
                id: 1,
                position: null,
                sprite: null
            },
            {
                id: 2,
                position: null,
                sprite: null
            },
            {
                id: 3,
                position: null,
                sprite: null
            }
        ]
    }

    players.push(player);
    sendIdentifier(player, ws);
    
    ws.on('message', function Incoming(message){
        let msg = JSON.parse(message);
        let uniqueRoom = getRoom(ws);


        switch (msg.type) {
            case 'initPlayer':
                
                    player = players.find(player => player.id === msg.playerID);
                    
                    player.name = msg.playerName;

                    insertPlayerInRoom(player);
                    
                    uniqueRoom = getRoom(player);

                    if(isRoomFull(uniqueRoom)) {
                        uniqueRoom.turn = 0;
                        uniqueRoom.dice = null;
                    };

                    msgRoom = {
                        type: 'room',
                        room: uniqueRoom
                    };
                    
                    if(hasMoreThan1Player(uniqueRoom)) {

                        askUpdateRoom(uniqueRoom.players);
                    } else {

                        ws.send(JSON.stringify(msgRoom));
                    };
                    
                break;
            
            case 'sendUpdatedRoom':

                    contador++;
                    console.log("enviando a sala atualizada", contador);

                    ws.send(JSON.stringify(msgRoom = {
                        type: 'room',
                        room: getRoom(getPlayer(ws))
                    }));

                break;

            case 'dado':

                    console.log('chegamos no type dado');
                    uniqueRoom = getRoom(getPlayer(ws));
                    uniqueRoom.dice = msg.numDado;
                    uniqueRoom.diced = true;
                    uniqueRoom.turnsPlayer = uniqueRoom.players[uniqueRoom.turn % 4];

                    askUpdateRoom(uniqueRoom.players);

                break;
        
            case 'endedTurn':

                    console.log('chegamos ao type endedturn');
                    uniqueRoom = getRoom(getPlayer(ws));
                    
                    uniqueRoom.dice = null;
                    uniqueRoom.diced = false;
                    uniqueRoom.turn = msg.room.turn;
                    uniqueRoom.turnsPlayer.pieces = msg.room.turnsPlayer.pieces;

                    askUpdateRoom(uniqueRoom.players);

                break;
        };
    });
});

function sendIdentifier(player, ws) {
    
    let identifier = {
        type: 'identifier',
        playerID: player.id
    };

    ws.send(JSON.stringify(identifier))
}

function insertPlayerInRoom (player) {

    if(rooms.length === 0 ) {

        let id = v4();
        createRoom(id);
        player.roomID = id;
        rooms.find(room => room.id === id).players.push(player);

    } else if (rooms[rooms.length - 1].players.length < 4) {

        player.roomID = rooms[rooms.length - 1].id;
        rooms[rooms.length - 1].players.push(player);

    } else {

        let id = v4();
        createRoom(id);
        player.roomID = id;
        rooms.find(room => room.id === id).players.push(player);

    }
}

function createRoom (id) {
    let room = {
        id: id,
        turn: null,
        players: [],
        dice: null,
        diced: null
    }

    rooms.push(room);
};

function getRoom (player) {
    return rooms.find(room => room.id === player.roomID);
};

function getPlayer (ws) {
    return players.find(player => player.connection === ws);
}

function hasMoreThan1Player (room) {
    return room.players.length > 1 ? true : false;
}

function isRoomFull (room) {
    return room.players.length === 4 ? true : false;
};

function askUpdateRoom (players) {

    players.forEach(player => {
        player.connection.send(JSON.stringify(sendUpdateRoomRequest = {
            type: 'updateRoomRequest'
        }));
    });
};

server.listen(port, () => {console.log(`server listening on port ${port}`)});