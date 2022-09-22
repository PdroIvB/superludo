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
let uniqueRoom;
let contador = 0;

wsServer.on('connection', function connection(ws){
    console.log('a new client has connected');

    
    createPlayer(ws);
    sendIdentifier(getPlayer(ws), ws);
    
    ws.on('message', function Incoming(message){
        let msg = JSON.parse(message);

        switch (msg.type) {
            case 'initPlayer':

                    let player = getPlayer(ws);
                    
                    player.name = msg.playerName;

                    insertPlayerInRoom(player);
                    
                    uniqueRoom = getRoom(player);

                    if(isRoomFull(uniqueRoom)) {
                        uniqueRoom.turn = 0;
                        uniqueRoom.dice = null;
                        uniqueRoom.diced = false;
                        uniqueRoom.turnsPlayer = uniqueRoom.players[uniqueRoom.turn % 4];
                    };

                    console.log("chegamos no type room");
                    askUpdateRoom(uniqueRoom.players);

                break;
            
            case 'sendUpdatedRoom':

                    contador++;
                    console.log("enviando a sala atualizada", contador);

                    ws.send(JSON.stringify(msgRoom = {
                        type: 'roomUpdate',
                        room: getRoom(getPlayer(ws))
                    }));

                break;

            case 'dado':

                    console.log('chegamos no type dado');
                
                    numDado = Math.floor(Math.random() * 6 + 1);

                    console.log(`${uniqueRoom.turnsPlayer.name} tirou ${numDado} no dado!`)
                    sendAllPlayersUpdateMsg(ws, `${uniqueRoom.turnsPlayer.name} tirou ${numDado} no dado!`)

                    uniqueRoom = getRoom(getPlayer(ws));
                    uniqueRoom.dice = numDado;
                    uniqueRoom.diced = true;

                    playOrPass(ws);

                break;

            case 'move':

                    console.log("recebido info do move");

                    sumPiecePosition(ws, getPiece(msg.piece));

                    passTurn();

                break;
        };
    });

    ws.on('close', function Closing () {
        if(getPlayer(ws).name) {
            getPlayer(ws).isBot = true;

            console.log(`Player ${getPlayer(ws).name} has disconnected from ${getRoom(getPlayer(ws)).id} room`);

            askUpdateRoom(getRoom(getPlayer(ws)).players);
        } else {

            console.log("A potencial player has disconnected before been inserted in a room");
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
        diced: false
    }

    rooms.push(room);
};

function getRoom (player) {
    return rooms.find(room => room.id === player.roomID);
};

function getPlayer (ws) {
    return players.find(player => player.connection === ws);
}

function getPiece (msgPiece) {
    return uniqueRoom.players.find(player => player.id === msgPiece.playerID).pieces.find(piece => piece.id === msgPiece.id);
};

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

function sendOtherPlayersUpdateMsg (ws, updateMsg) {
    getRoom(getPlayer(ws)).players.filter(player => player.connection !== ws).forEach(player => {
        player.connection.send(JSON.stringify({
            type: 'updateMsg',
            updateMsg: `${updateMsg}`
        }));
    });
};

function sendAllPlayersUpdateMsg (ws, updateMsg) {
    getRoom(getPlayer(ws)).players.forEach(player => {
        player.connection.send(JSON.stringify({
            type: 'updateMsg',
            updateMsg: `${updateMsg}`
        }));
    });
};

function sendThisPlayerMsg (ws, msg) {
    ws.send(JSON.stringify({
        type: 'updateMsg',
        updateMsg: `${msg}`
    }))
};

function createPlayer(ws) {
    let id = v4();

    let player = {
        id: id,
        connection: ws,
        roomID: null,
        pieces:[
            {
                id: 0,
                position: null,
                sprite: null,
                final: false,
                canEntryFinal: false,
                playerID: id
            },
            {
                id: 1,
                position: null,
                sprite: null,
                final: false,
                canEntryFinal: false,
                playerID: id
            },
            {
                id: 2,
                position: null,
                sprite: null,
                final: false,
                canEntryFinal: false,
                playerID: id
            },
            {
                id: 3,
                position: null,
                sprite: null,
                final: false,
                canEntryFinal: false,
                playerID: id
            }
        ]
    }

    players.push(player);
};

///////////////////  Lógica do jogo a partir daqui  ///////////////////////////////

function playOrPass (ws) {

    if(hasPiecesOnBoard(uniqueRoom.turnsPlayer)) {

        if(playerPiecesOnBoard(uniqueRoom.turnsPlayer).length == 1 && uniqueRoom.dice !== 6) {

            moveSinglePiece(ws);

            sendAllPlayersUpdateMsg(ws, `${uniqueRoom.turnsPlayer.name} tem apenas uma peça em jogo, ela foi movida automaticamente e a vez será passada`)

            passTurn();

        } else if(playerPiecesOnBoard(uniqueRoom.turnsPlayer).length == 1 && uniqueRoom.dice === 6) { 

            move(ws);

        } else {

            move(ws);
        };

    } else if(!hasPiecesOnBoard(uniqueRoom.turnsPlayer) && uniqueRoom.dice == 6) {

        move(ws);
    } else {

        console.log(`${uniqueRoom.turnsPlayer.name} não tem peças no tabuleiro e não tirou 6 no dado, a vez será passada`)

        sendAllPlayersUpdateMsg(ws, `${uniqueRoom.turnsPlayer.name} não tem peças no tabuleiro e não tirou 6 no dado, a vez será passada`);

        passTurn();
    };
};

function passTurn () {

        uniqueRoom.turn++

        if(uniqueRoom.dice == 6 || uniqueRoom.killed) {
            --uniqueRoom.turn
            uniqueRoom.killed = false;
        }

        uniqueRoom.turnsPlayer = uniqueRoom.players[uniqueRoom.turn % 4];
        uniqueRoom.dice = null;
        uniqueRoom.diced = false;

        askUpdateRoom(uniqueRoom.players);
    };

function move (ws) {

    sendOtherPlayersUpdateMsg(ws, `${uniqueRoom.turnsPlayer.name} está fazendo sua jogada!`);

    sendThisPlayerMsg(ws, `${uniqueRoom.turnsPlayer.name}, sua vez de movimentar um peça! Clique em uma delas!`)

    ws.send(JSON.stringify(msgMakeMove = {
        type: 'makeAMove',
        playerID: uniqueRoom.turnsPlayer.id,
        dice: numDado
    }));
};

function moveSinglePiece (ws) {

    sendAllPlayersUpdateMsg(ws, `auto moving single piece`)

    sumPiecePosition(ws, uniqueRoom.turnsPlayer.pieces.find(piece => piece.position !== null));
};

function hasPiecesOnBoard (player) {
    return player.pieces.find(piece => piece.position !== null) ? true : false;
};

function playerPiecesOnBoard(player) {
    return player.pieces.filter(piece => piece.position !== null);
};

function autoMove() {

    if(isWhoIsGoingToPlayForBot()) {
        console.log("vou jogar pelo bot");

        if(!uniqueRoom.diced) {

            console.log("jogando dado pelo bot")

            dice();

        } else {
            console.log('movimentar a peça do bot');

            if(hasPiecesOnBoard(uniqueRoom.turnsPlayer)) {

                if(playerPiecesOnBoard(uniqueRoom.turnsPlayer).length == 1 && uniqueRoom.dice !== 6) {
        
                    // uniqueRoom.turnsPlayer.pieces.reduce(function(prev, current) {
                    //     return (prev.position > current.position) ? prev : current
                    // }).position += uniqueRoom.dice;

                    sumPiecePosition(ws, uniqueRoom.turnsPlayer.pieces.reduce(function(prev, current) {
                        return (prev.position > current.position) ? prev : current
                    }));
        
                    console.log(`${uniqueRoom.turnsPlayer.name} tem apenas uma peça em jogo, ela foi movida automaticamente e a vez será passada`);
        
                    passTurnForBot();
        
                } else if(playerPiecesOnBoard(uniqueRoom.turnsPlayer).length == 1 && uniqueRoom.dice === 6) { 

                    // uniqueRoom.turnsPlayer.pieces.find(piece => piece.position === null).position += uniqueRoom.dice;

                    sumPiecePosition(ws, uniqueRoom.turnsPlayer.pieces.find(piece => piece.position === null));

                    passTurnForBot();
        
                } else {

                    console.log("bot tem mais de uma peça no tabuleiro e nao tirou 6, decidir com qual movimentar");

                    // uniqueRoom.turnsPlayer.pieces.reduce(function(prev, current) {
                    //     return (prev.position > current.position) ? prev : current
                    // }).position += uniqueRoom.dice;

                    sumPiecePosition(ws, uniqueRoom.turnsPlayer.pieces.reduce(function(prev, current) {
                        return (prev.position > current.position) ? prev : current
                    }));


                    passTurnForBot()
                };
        
            } else if(!hasPiecesOnBoard(uniqueRoom.turnsPlayer) && uniqueRoom.dice == 6) {
        
                console.log("bot sem peças no tabuleiro mas tirou 6 no dado, fazer a lógica de tirar alguma peça da casinha");

                // uniqueRoom.turnsPlayer.pieces[0].position += uniqueRoom.dice;

                sumPiecePosition(ws, uniqueRoom.turnsPlayer.pieces[0]);

                passTurnForBot();

            } else {
        
                console.log(`${uniqueRoom.turnsPlayer.name} não tem peças no tabuleiro e não tirou 6 no dado, a vez será passada`)
                passTurnForBot();
            }
        };

    } else {
        console.log("aguardando a jogada do bot");
    }
}

function passTurnForBot () {
    if(isWhoIsGoingToPlayForBot()) {
        uniqueRoom.turn++;
        
        console.log('sala rifhtbefore sending: ', uniqueRoom);
        let msgEndedTurn = {
            type: 'endedTurn',
            room: uniqueRoom
        };
    
        socketClient.send(JSON.stringify(msgEndedTurn));
    } else {
        console.log(`não sou o jogador da vez, esperando ${uniqueRoom.turnsPlayer.name} enviar o fim do turno`);
    }
};

function isWhoIsGoingToPlayForBot () {
    if(((++uniqueRoom.turn) % 4) == uniqueRoom.players.indexOf(uniqueRoom.players.find(player => player.id === playerID))) {
        --uniqueRoom.turn;
        return true;
    } else {
        --uniqueRoom.turn;
        return false;
    }
};

function sumPiecePosition (ws, piece) {

    if(!hasPiecesOnBoard(uniqueRoom.turnsPlayer)){
        if(uniqueRoom.turnsPlayer === uniqueRoom.players[0]) {
            piece.position = piece.position - 5 + uniqueRoom.dice;
        } else if (uniqueRoom.turnsPlayer === uniqueRoom.players[1]) {
            piece.position = piece.position + 7 + uniqueRoom.dice;
            
        } else if (uniqueRoom.turnsPlayer === uniqueRoom.players[2]) {
            piece.position = piece.position + 19 + uniqueRoom.dice;
            
        } else if (uniqueRoom.turnsPlayer === uniqueRoom.players[3]) {
            piece.position = piece.position + 31 + uniqueRoom.dice;
            
        };
    } else if (piece.position === null) {
        if(uniqueRoom.turnsPlayer === uniqueRoom.players[0]) {
            piece.position = piece.position - 5 + uniqueRoom.dice;
        } else if (uniqueRoom.turnsPlayer === uniqueRoom.players[1]) {
            piece.position = piece.position + 7 + uniqueRoom.dice;
            
        } else if (uniqueRoom.turnsPlayer === uniqueRoom.players[2]) {
            piece.position = piece.position + 19 + uniqueRoom.dice;
            
        } else if (uniqueRoom.turnsPlayer === uniqueRoom.players[3]) {
            piece.position = piece.position + 31 + uniqueRoom.dice;
            
        };
    } else {

        movePieceCorrectly(ws, piece);

    };

    if(piece.position > 52 && !piece.final) {
        piece.position = piece.position - 52
        piece.canEntryFinal = true;
        killAnotherPiece(ws, piece);
    };
};

function killAnotherPiece (ws, pieceInMoving) {
    if(hasPìeceWithPositionConflict(pieceInMoving)){

        sendOtherPlayersUpdateMsg(ws, `${uniqueRoom.turnsPlayer.name} matou a peça de ${uniqueRoom.players.find(player => player.id ===pieceWithPositionConflict(pieceInMoving).playerID).name}! Hahaha`)

        sendThisPlayerMsg(ws, `Você matou uma peça de ${uniqueRoom.players.find(player => player.id ===pieceWithPositionConflict(pieceInMoving).playerID).name}! Hahaha`)

        pieceWithPositionConflict(pieceInMoving).final = false;   
        pieceWithPositionConflict(pieceInMoving).canEntryFinal = false;   
        pieceWithPositionConflict(pieceInMoving).position = null;

        uniqueRoom.killed = true;
    } else {
        return;
    };
};

function reuneAllPieces () {
    allPieces = [];
    uniqueRoom.players.forEach(player => {
        player.pieces.forEach(piece => {
            allPieces.push(piece);
        })
    })
    return allPieces;
};

function hasPìeceWithPositionConflict (pieceInMoving) {
    return reuneAllPieces().find(piece => piece.position === pieceInMoving.position && piece.playerID !== pieceInMoving.playerID && !isPieceInProtectedCell([1,8,13,20,25,32,37], pieceInMoving)) ? true : false;
};

function pieceWithPositionConflict (pieceInMoving) {
    return reuneAllPieces().find(piece => piece.position === pieceInMoving.position && piece.playerID !== pieceInMoving.playerID && !isPieceInProtectedCell([1,8,13,20,25,32,37], pieceInMoving));
};

function isPieceInProtectedCell (protectedCells, piece) {
	let result = false;
    protectedCells.forEach( (cell) => {
        if (piece.position == cell) {
            result = true;
        }
    })
    return result;
}

function movePieceCorrectly (ws, piece) {
    switch (uniqueRoom.players.indexOf(uniqueRoom.turnsPlayer)) {
        case 0:
                piece.position += uniqueRoom.dice;
                killAnotherPiece(ws, piece);
                if(piece.position > 51 && !piece.final) {
                    piece.position = 100 + (piece.position - 51);
                    piece.final = true;
                }
                if(piece.position > 105) console.log(`ACABOOOU O JOOOOGO!!! ${uniqueRoom.turnsPlayer.name} VENCEEEEEU!!!`);

            break;
                
        case 1:
                piece.position += uniqueRoom.dice;
                killAnotherPiece(ws, piece);
                if(piece.position > 11 && piece.canEntryFinal) {
                    piece.position = 105 + (piece.position - 11);
                    piece.final = true;
                }
                if(piece.position > 110) console.log(`ACABOOOU O JOOOOGO!!! ${uniqueRoom.turnsPlayer.name} VENCEEEEEU!!!`);
            break;
            
        case 2:
                piece.position += uniqueRoom.dice;
                killAnotherPiece(ws, piece);
                if(piece.position > 23 && piece.canEntryFinal) {
                    piece.position = 110 + (piece.position - 23);
                    piece.final = true;
                }
                if(piece.position > 115) console.log(`ACABOOOU O JOOOOGO!!! ${uniqueRoom.turnsPlayer.name} VENCEEEEEU!!!`);
            break;
            
        case 3:
                piece.position += uniqueRoom.dice;
                killAnotherPiece(ws, piece);
                if(piece.position > 35 && piece.canEntryFinal) {
                    piece.position = 115 + (piece.position - 35);
                    piece.final = true;
                }
                if(piece.position > 120) console.log(`ACABOOOU O JOOOOGO!!! ${uniqueRoom.turnsPlayer.name} VENCEEEEEU!!!`);
            break;
    }
};

server.listen(port, () => {console.log(`server listening on port ${port}`)});