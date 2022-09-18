const express = require('express');
const app = express();
const port = 9999;
const server = require('http').createServer(app);
const WebSocket = require('ws');
const { v4 } = require('uuid');
const { request, get } = require('http');

app.use(express.json());

const wsServer = new WebSocket.Server({ server:server });

const players = [];
const rooms = [];

wsServer.on('connection', function connection(ws){
    console.log('a new client has connected');

    let player = {
        id: v4(),
        connection: ws,
        roomId: null,
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

        switch (msg.type) {
            case 'initPlayer':
                
                    let player = players.find(player => player.id === msg.playerID);
                    
                    player.name = msg.playerName;

                    insertPlayerInRoom(player);
                    
                    let uniqueRoom = getRoom(player);

                    if(isRoomFull(uniqueRoom)) {
                        uniqueRoom.turn = 0;
                        uniqueRoom.dice = null;
                    };

                    msgRoom = {
                        type: 'room',
                        room: uniqueRoom
                    };
                    
                    if(hasMoreThan1Player(uniqueRoom)) {
                        ws.send(JSON.stringify(msgRoom));

                        let otherRoomPlayers = [];

                        uniqueRoom.players.forEach(player => {
                            otherRoomPlayers.push(player);
                        });

                        otherRoomPlayers.pop();

                        askUpdateRoom(otherRoomPlayers);
                    } else {
                        ws.send(JSON.stringify(msgRoom));
                    };
                    
                break;
            
            case 'sendUpdatedRoom':

                    ws.send(JSON.stringify(msgRoom = {
                        type: 'room',
                        room: getRoom(getPlayer(msg.playerID))
                    }));

                break;

            case 'dado':

                    getRoom(msg.player).dice = msg.numDado;

                    askUpdateRoom(getRoom(msg.player).players);

                break;
        
            case 'endedTurn':

                    let serverSideRoom = rooms.find(room => room.id === msg.player.roomId)

                    serverSideRoom.dice = null;
                    serverSideRoom.turn = msg.room.turn;

                    let playerWhoPlayed = serverSideRoom.players.find(player => player.id === msg.player.id);

                    playerWhoPlayed.pieces = msg.player.pieces;

                    askUpdateRoom(serverSideRoom.players);

                break;

            // default:
            //     break;
        }

        // wsServer.clients.forEach(function each(client) {
        //     if(client !== ws && client.readyState === WebSocket.OPEN) {
        //         client.send(JSON.stringify(msg));
        //     };
        // });
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
        player.roomId = id;
        rooms.find(room => room.id === id).players.push(player);

    } else if (rooms[rooms.length - 1].players.length < 4) {

        player.roomId = rooms[rooms.length - 1].id;
        rooms[rooms.length - 1].players.push(player);

    } else {

        let id = v4();
        createRoom(id);
        player.roomId = id;
        rooms.find(room => room.id === id).players.push(player);

    }
}

function createRoom (id) {
    let room = {
        id: id,
        turn: null,
        players: []
    }

    rooms.push(room);
};

function getRoom (player) {
    return rooms.find(room => room.id === player.roomId);
};

function getPlayer (playerId) {
    return players.find(player => player.id === playerId);
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