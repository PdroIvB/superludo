const express = require('express');
const app = express();
const port = 9999;
const server = require('http').createServer(app);
const WebSocket = require('ws');
const { v4 } = require('uuid');
const { request } = require('http');

app.use(express.json());

const wsServer = new WebSocket.Server({ server:server });

const players = [];
const rooms = [];

wsServer.on('connection', function connection(ws){
    console.log('a new client has connected');

    let player = {
        playerID: v4(),
        connection: ws,
        roomId: null,
        pieces:[
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
            },
            {
                id: 4,
                position: null,
                sprite: null
            }
        ]
    }

    insertPlayer(player);
    sendIdentifier(player, ws);
    
    ws.on('message', function Incoming(message){
        let msg = JSON.parse(message);

        switch (msg.type) {
            case 'setPlayerName':

                    players.find(player => player.playerID === msg.playerID).playerName = msg.name;

                break;
            
            case 'play':

                let player = players.find(player => player.playerID === msg.playerID);
                let piece = player.pieces.find(piece => piece.id === msg.pieceID);
                piece.position = piece.position + msg.numSort;

                let pieceUpdate = {
                    player:
                };

                ws.send(JSON.stringify(pieceUpdate));

                break;
        
            // default:
            //     break;
        }

        wsServer.clients.forEach(function each(client) {
            if(client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(msg));
            };
        });
    });
});

function sendIdentifier(player, ws) {
    let identifier = {
        type: 'identifier',
        playerID: player.playerID
    };
    ws.send(JSON.stringify(identifier))
}

function insertPlayer (player) {
    players.push(player);

    if(rooms.length === 0 ) {

        let id = v4();
        createRoom(id);
        player.roomId = id;
        rooms.find(room => room.id === id).players.push(player);

    } else if (rooms[rooms.length - 1].players.length < 4) {

        player.roomId = rooms[rooms.length - 1].id;
        rooms[rooms.length - 1].players.push(player);
    }
}

function createRoom (id) {
    let room = {
        id: id,
        players: []
    }

    rooms.push(room);
};


server.listen(port, () => {console.log(`server listening on port ${port}`)});