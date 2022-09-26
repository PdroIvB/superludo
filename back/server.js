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

const playersWithToken = [];
const rooms = [];
let contador = 0;

wsServer.on('connection', function connection(ws){
    console.log('a new client has connected');

    ws.send(JSON.stringify({
        type: 'verifyConnection'
    }))
    
    ws.on('message', function Incoming(message){
        let msg = JSON.parse(message);

        switch (msg.type) {
            case 'initPlayer':
                    console.log("Entrou no initPlayer");
                    createPlayer(ws);
                    sendIdentifier(getPlayer(ws));

                break;

            case 'setName':

                    let player = getPlayer(ws);

                    player.name = msg.playerName;

                    identifyPlayerToRoom(player);

                    sendPiecesToSelect(ws);

                break;

            case 'selectedPiece':

                    insertPLayerInRoomWithPieces(ws, msg.position);

                    initGameWithRandom1stPlayer(ws, getRoom(getPlayer(ws)));

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
                    
                    sendAllPlayersInThisRoom(ws, 'updateMsg', `${getRoom(getPlayer(ws)).turnsPlayer.name} tirou ${numDado} no dado!`)

                    sendAllPlayersInThisRoom(ws, 'numDado', numDado);
                    
                    getRoom(getPlayer(ws)).dice = numDado;
                    getRoom(getPlayer(ws)).diced = true;

                    playNPass(ws);

                break;

            case 'move':

                    console.log("recebido info do move");

                    movePiece(ws, getPiece(ws, msg.piece));

                    passTurn(ws);

                break;

            case 'reconnection':
                console.log("Entrou no reconnection");
                let tempPlayer;
                playersWithToken.forEach(playerWithToken => {
                    if (playerWithToken.token === msg.token) {
                        playerWithToken.player.connection = ws;
                        tempPlayer = getPlayer(ws);
                    }
                });
                if(tempPlayer){
                    tempPlayer.isBot = false;
                    // console.log("Erro do token: ", tempPlayer);

                    sendOtherPlayersUpdateMsg(ws, `${tempPlayer.name} se reconectou!`);

                    sendThisPlayerMsg(ws, `Você se reconectou com sucesso!`);
                    // let roomPlayers = getRoom(getPlayer(ws)).players;
                    
                    ws.send(JSON.stringify(sendUpdateRoomRequest = {
                        type: 'updateRoomRequest',
                        playerID: tempPlayer.id
                    }));
            
                } else {
                    
                    createPlayer(ws);
                    sendIdentifier(getPlayer(ws));
                }

                break;
        };
    });

    ws.on('close', function Closing () {
        if(getPlayer(ws).roomID) {
            getPlayer(ws).isBot = true;

            console.log(`Player ${getPlayer(ws).name} has disconnected from ${getRoom(getPlayer(ws)).id} room`);

            sendAllPlayersInThisRoom(ws, 'updateMsg', `${getPlayer(ws).name} disconectou da sala.`)

        } else {

            console.log("A potencial player has disconnected before been inserted in a room");
        };
    });
});

function selectWhereDontHavePlayers (players) {

    let piecesThatCanBeChosen = [];

    players.forEach((element,index) => {
        if(!element) piecesThatCanBeChosen.push(index);
    });

    return piecesThatCanBeChosen;
}

function initGameWithRandom1stPlayer (ws, room) {

    if(isRoomFull(room)) {

        room.turn = Math.floor(Math.random() * 4);
        sendAllPlayersInThisRoom(ws, 'updateMsg', `${room.players[room.turn % 4].name} foi o jogador sorteado pra jogar primeiro!`);
        room.dice = null;
        room.diced = false;
        room.turnsPlayer = room.players[room.turn % 4];
        // console.log("turnsPlayer error", room.turnsPlayer);

    } else {

        sendAllPlayersInThisRoom(ws, 'updateMsg', `Aguardando outros jogadores entrarem para iniciar partida`);
    }

    askUpdateRoom(room.players);
}

function sendIdentifier(player) {
    let currentPlayer = playersWithToken.find(playerWithToken => playerWithToken.player.connection === player.connection);
    console.log("Esse é o playerID: ", currentPlayer);
    let identifier = {
        type: 'identifier',
        playerID: currentPlayer.player.id,
        token: currentPlayer.token
    };

    console.log("Esse é o identifier: ", identifier);

    player.connection.send(JSON.stringify(identifier))
}

function identifyPlayerToRoom (player) {

    if(rooms.length === 0 ) {

        let id = v4();
        createRoom(id);
        player.roomID = id;

    } else {

        let playersCount = 0;

        rooms[rooms.length - 1].players.forEach(player => player != undefined ? playersCount++ : playersCount = playersCount);

        if(playersCount < 4){

            player.roomID = rooms[rooms.length - 1].id;

        } else if (playersCount === 4) {

            let id = v4();
            createRoom(id);
            player.roomID = id;
        };
    };
};

function insertPLayerInRoomWithPieces (ws, position) {
    
    if(isRoomFull(getRoom(getPlayer(ws)))){

        sendThisPlayer(ws, 'updateMsg', `4 jogadores já escolheram lugares pra sentar nessa sala, escolha suas peças novamente e vá para uma nova sala.`);

        identifyPlayerToRoom(getPlayer(ws))

        sendPiecesToSelect(ws);

    } else {

        if (rooms.find(room => room.id === getPlayer(ws).roomID).players[position]) {

            sendThisPlayer(ws, 'updateMsg', `Outro jogador já escolheu essas peças. Escolha alguma outra!`);

            identifyPlayerToRoom(getPlayer(ws))

            sendPiecesToSelect(ws);

        } else {
            
            rooms.find(room => room.id === getPlayer(ws).roomID).players[position] = getPlayer(ws);
        };
    };
};

function sendPiecesToSelect (ws) {

    let selectPiecesMsg = {
        type: 'selectAPiece',
        pieces: selectWhereDontHavePlayers(getRoom(getPlayer(ws)).players)
    };

    getPlayer(ws).connection.send(JSON.stringify(selectPiecesMsg))
};

function createRoom (id) {
    let room = {
        id: id,
        turn: null,
        players: [undefined,undefined,undefined,undefined],
        dice: null,
        diced: false
    }

    rooms.push(room);
};

function getRoom (player) {
    return rooms.find(room => room.id === player.roomID);
};

function getPlayer (ws) {
    let currentPlayer = playersWithToken.find(playerWithToken => playerWithToken.player.connection === ws)
    return currentPlayer.player;
}

function getPiece (ws, msgPiece) {
    return getRoom(getPlayer(ws)).players.find(player => player.id === msgPiece.playerID).pieces.find(piece => piece.id === msgPiece.id);
};

function isRoomFull (room) {
    let playersCount = 0;

    room.players.forEach(player => player != undefined ? playersCount++ : playersCount = playersCount);

    return playersCount === 4 ? true : false;
};

function askUpdateRoom (players) {
    players.forEach(player => {
        if(player !== undefined){
            player.connection.send(JSON.stringify(sendUpdateRoomRequest = {
                type: 'updateRoomRequest'
            }));
        };
    });
};

function sendOtherPlayers (ws, msgType, msg) {
    getRoom(getPlayer(ws)).players.filter(player => player.connection !== ws).forEach(player => {
        player.connection.send(JSON.stringify({
            // type: 'updateMsg',
            type: msgType,
            msg: msg
        }));
    });
};

function sendAllPlayersInThisRoom (ws, msgType, msg) {
    getRoom(getPlayer(ws)).players.forEach(player => {
        if(player !== undefined) {
            player.connection.send(JSON.stringify({
                // type: 'updateMsg',
                type: msgType,
                msg: `${msg}`
            }))
        };
    });
};

function sendThisPlayer (ws, msgType,msg) {
    ws.send(JSON.stringify({
        // type: 'updateMsg',
        type: msgType,
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
                playerID: id,
                finished: false
            },
            {
                id: 1,
                position: null,
                sprite: null,
                final: false,
                canEntryFinal: false,
                playerID: id,
                finished: false
            },
            {
                id: 2,
                position: null,
                sprite: null,
                final: false,
                canEntryFinal: false,
                playerID: id,
                finished: false
            },
            {
                id: 3,
                position: null,
                sprite: null,
                final: false,
                canEntryFinal: false,
                playerID: id,
                finished: false
            }
        ]
    }

    let playerWithToken = {
        token: v4(), //gerar o token aqui
        player: player
    }

    playersWithToken.push(playerWithToken);
};

///////////////////  Lógica do jogo a partir daqui  ///////////////////////////////

function playNPass (ws) {

    if(hasPiecesOnBoard(getRoom(getPlayer(ws)).turnsPlayer)) {

        if(playerPiecesOnBoard(getRoom(getPlayer(ws)).turnsPlayer).length === 1 && getRoom(getPlayer(ws)).dice !== 6) {

            moveSinglePiece(ws);

            sendAllPlayersInThisRoom(ws, 'updateMsg', `${getRoom(getPlayer(ws)).turnsPlayer.name} tem apenas uma peça em jogo, ela foi movida automaticamente e a vez será passada`);

            passTurn(ws);

        } else if(playerPiecesOnBoard(getRoom(getPlayer(ws)).turnsPlayer).length === 1 && getRoom(getPlayer(ws)).dice === 6) { 

            if(!hasPiecesToEnterBoard(ws)) {

                moveSinglePiece(ws);

                passTurn(ws);
            } else {

                move(ws);
            };

        } else {

            move(ws);
        };

    } else if(!hasPiecesOnBoard(getRoom(getPlayer(ws)).turnsPlayer) && getRoom(getPlayer(ws)).dice == 6) {

        move(ws);

    } else {

        sendAllPlayersInThisRoom(ws, 'updateMsg', `${getRoom(getPlayer(ws)).turnsPlayer.name} não tem peças no tabuleiro e não tirou 6 no dado, a vez será passada`);

        passTurn(ws);
    };
};

function passTurn (ws) {

    getRoom(getPlayer(ws)).turn++

    if(getRoom(getPlayer(ws)).dice == 6 || getRoom(getPlayer(ws)).killed || getRoom(getPlayer(ws)).justFinishedPiece) {
        --getRoom(getPlayer(ws)).turn
        getRoom(getPlayer(ws)).killed = false;
        getRoom(getPlayer(ws)).justFinishedPiece = false;
    }

    getRoom(getPlayer(ws)).turnsPlayer = getRoom(getPlayer(ws)).players[getRoom(getPlayer(ws)).turn % 4];
    getRoom(getPlayer(ws)).dice = null;
    getRoom(getPlayer(ws)).diced = false;

    askUpdateRoom(getRoom(getPlayer(ws)).players);
};

function move (ws) {

    sendOtherPlayers(ws, 'updateMsg', `${getRoom(getPlayer(ws)).turnsPlayer.name} está fazendo sua jogada!`);

    sendThisPlayer(ws, 'updateMsg',`${getRoom(getPlayer(ws)).turnsPlayer.name}, sua vez de movimentar um peça! Clique em uma delas!`)

    ws.send(JSON.stringify(msgMakeMove = {
        type: 'makeAMove',
        playerID: getRoom(getPlayer(ws)).turnsPlayer.id,
        dice: numDado
    }));
};

function moveSinglePiece (ws) {

    sendAllPlayersInThisRoom(ws, 'updateMsg', `auto moving single piece`)

    movePiece(ws, getRoom(getPlayer(ws)).turnsPlayer.pieces.find(piece => piece.position !== null && piece.finished !== true));
};

function hasPiecesOnBoard (player) {
    return player.pieces.find(piece => piece.position !== null && piece.finished !== true) ? true : false;
};

function playerPiecesOnBoard(player) {
    return player.pieces.filter(piece => piece.position !== null && piece.finished !== true);
};

function bot() {

};

function passTurnForBot () {
    if(isWhoIsGoingToPlayForBot()) {
        getRoom(getPlayer(ws)).turn++;
        
        console.log('sala rifhtbefore sending: ', getRoom(getPlayer(ws)));
        let msgEndedTurn = {
            type: 'endedTurn',
            room: getRoom(getPlayer(ws))
        };
    
        socketClient.send(JSON.stringify(msgEndedTurn));
    } else {
        console.log(`não sou o jogador da vez, esperando ${getRoom(getPlayer(ws)).turnsPlayer.name} enviar o fim do turno`);
    }
};

function isWhoIsGoingToPlayForBot () {
    if(((++getRoom(getPlayer(ws)).turn) % 4) == getRoom(getPlayer(ws)).players.indexOf(getRoom(getPlayer(ws)).players.find(player => player.id === playerID))) {
        --getRoom(getPlayer(ws)).turn;
        return true;
    } else {
        --getRoom(getPlayer(ws)).turn;
        return false;
    }
};

function killAnotherPiece (ws, pieceInMoving) {
    if(hasPìeceWithPositionConflict(ws, pieceInMoving)){

        sendOtherPlayers(ws, 'updateMsg', `${getRoom(getPlayer(ws)).turnsPlayer.name} matou a peça de ${getRoom(getPlayer(ws)).players.find(player => player.id ===pieceWithPositionConflict(ws, pieceInMoving).playerID).name}! Hahaha`)

        sendThisPlayer(ws, 'updateMsg', `Você matou uma peça de ${getRoom(getPlayer(ws)).players.find(player => player.id ===pieceWithPositionConflict(ws, pieceInMoving).playerID).name}! Hahaha`)

        pieceWithPositionConflict(ws, pieceInMoving).final = false;
        pieceWithPositionConflict(ws, pieceInMoving).canEntryFinal = false;
        pieceWithPositionConflict(ws, pieceInMoving).position = null;

        getRoom(getPlayer(ws)).killed = true;
    } else {
        return;
    };
};

function reuneAllPieces (ws) {
    let allPieces = [];
    getRoom(getPlayer(ws)).players.forEach(player => {
        player.pieces.forEach(piece => {
            allPieces.push(piece);
        })
    })
    return allPieces;
};

function hasPìeceWithPositionConflict (ws, pieceInMoving) {
    return reuneAllPieces(ws).find(piece => piece.position === pieceInMoving.position && piece.playerID !== pieceInMoving.playerID && !isPieceInProtectedCell([0,1,9,14,22,27,35,40,48], pieceInMoving)) ? true : false;
};

function hasPiecesToEnterBoard (ws) {
    let piecesOffBoard = getPlayer(ws).pieces.filter(piece => piece.position === null);

    return piecesOffBoard.length === 0 ? false : true;
};

function pieceWithPositionConflict (ws, pieceInMoving) {
    return reuneAllPieces(ws).find(piece => piece.position === pieceInMoving.position && piece.playerID !== pieceInMoving.playerID && !isPieceInProtectedCell([0,1,9,14,22,27,35,40,48], pieceInMoving));
};

function isPieceInProtectedCell (protectedCells, piece) {
	let result = false;
    protectedCells.forEach( (cell) => {
        if (piece.position == cell) {
            result = true;
        }
    })
    return result;
};

function movePiece (ws, piece) {

    if(!hasPiecesOnBoard(getRoom(getPlayer(ws)).turnsPlayer)){
        if(getRoom(getPlayer(ws)).turnsPlayer === getRoom(getPlayer(ws)).players[0]) {
            piece.position = piece.position - 5 + getRoom(getPlayer(ws)).dice;
        } else if (getRoom(getPlayer(ws)).turnsPlayer === getRoom(getPlayer(ws)).players[1]) {
            piece.position = piece.position + 8 + getRoom(getPlayer(ws)).dice;
            
        } else if (getRoom(getPlayer(ws)).turnsPlayer === getRoom(getPlayer(ws)).players[2]) {
            piece.position = piece.position + 21 + getRoom(getPlayer(ws)).dice;
            
        } else if (getRoom(getPlayer(ws)).turnsPlayer === getRoom(getPlayer(ws)).players[3]) {
            piece.position = piece.position + 34 + getRoom(getPlayer(ws)).dice;
            
        };
    } else if (piece.position === null) {
        if(getRoom(getPlayer(ws)).turnsPlayer === getRoom(getPlayer(ws)).players[0]) {
            piece.position = piece.position - 5 + getRoom(getPlayer(ws)).dice;
        } else if (getRoom(getPlayer(ws)).turnsPlayer === getRoom(getPlayer(ws)).players[1]) {
            piece.position = piece.position + 8 + getRoom(getPlayer(ws)).dice;
            
        } else if (getRoom(getPlayer(ws)).turnsPlayer === getRoom(getPlayer(ws)).players[2]) {
            piece.position = piece.position + 21 + getRoom(getPlayer(ws)).dice;
            
        } else if (getRoom(getPlayer(ws)).turnsPlayer === getRoom(getPlayer(ws)).players[3]) {
            piece.position = piece.position + 34 + getRoom(getPlayer(ws)).dice;
            
        };
    } else {

        sumPiecePosition(ws, piece);
    };
    
    if(piece.position > 52 && !piece.final) {
        piece.position = piece.position - 52
        piece.canEntryFinal = true;
        piece.final = true;
    };
    
    killAnotherPiece(ws, piece);

    if(getRoom(getPlayer(ws)).players.find(player => player.pieces.filter(piece=> piece.finished === true).length === 4)) {
        sendAllPlayersInThisRoom(ws, 'updateMsg', `${getRoom(getPlayer(ws)).players.find(player => player.pieces.filter(piece=> piece.finished === true).length === 4).name} VENCEU O JOGO`);
    };
};

function sumPiecePosition (ws, piece) {
    switch (getRoom(getPlayer(ws)).players.indexOf(getRoom(getPlayer(ws)).turnsPlayer)) {
        case 0:

                if(piece.position > 100) {
                    //Aqui é se está na reta final

                    if(getRoom(getPlayer(ws)).dice <= (106 - piece.position)) {

                        piece.position += getRoom(getPlayer(ws)).dice;

                        if(piece.position > 105) {
                            //Aqui é se terminou
        
                            piece.finished = true;
                            piece.position = 0;
                        }

                    } else {

                        sendAllPlayersInThisRoom(ws, 'updateMsg', `${getRoom(getPlayer(ws)).turnsPlayer.name}, para terminar, você tem que tirar um número menor ou igual as casas que faltam!`);

                        break;
                    };
                    
                } else if(((piece.position + getRoom(getPlayer(ws)).dice) > 51) && !piece.final) {
                    //Aqui é se precisar entrar na reta final

                    piece.position += getRoom(getPlayer(ws)).dice;
                    piece.position = 100 + (piece.position - 51);
                    piece.final = true;

                    finalizePiece(piece);

                } else if (piece.position !== 0 ) {
                    //Aqui é o 'padrão'

                    piece.position += getRoom(getPlayer(ws)).dice;
                } ;
            break;

        case 1:

                if(piece.position > 105) {
                    //Aqui é se está na reta final

                    if(getRoom(getPlayer(ws)).dice <= (111 - piece.position)) {

                        piece.position += getRoom(getPlayer(ws)).dice;

                        finalizePiece(piece);

                    } else break;

                } else if(((piece.position + getRoom(getPlayer(ws)).dice) > 12) && piece.canEntryFinal) {
                    //Aqui é se precisar entrar na reta final

                    piece.position += getRoom(getPlayer(ws)).dice;
                    piece.position = 105 + (piece.position - 12);
                    piece.final = true;

                    finalizePiece(piece);

                } else if (piece.position !== 0 ) {
                    //Aqui é o 'padrão'

                    piece.position += getRoom(getPlayer(ws)).dice;
                } ;
            break;

        case 2:

            if(piece.position > 110) {
                //Aqui é se está na reta final

                if(getRoom(getPlayer(ws)).dice <= (116 - piece.position)) {

                    piece.position += getRoom(getPlayer(ws)).dice;

                    finalizePiece(piece);

                } else break;

            } else if(((piece.position + getRoom(getPlayer(ws)).dice) > 25) && piece.canEntryFinal) {
                //Aqui é se precisar entrar na reta final

                piece.position += getRoom(getPlayer(ws)).dice;
                piece.position = 110 + (piece.position - 25);
                piece.final = true;

                finalizePiece(piece);

            } else if (piece.position !== 0 ) {
                //Aqui é o 'padrão'

                piece.position += getRoom(getPlayer(ws)).dice;
            } ;
            break;
            
        case 3:

            if(piece.position > 115) {
                //Aqui é se está na reta final

                if(getRoom(getPlayer(ws)).dice <= (121 - piece.position)) {

                    piece.position += getRoom(getPlayer(ws)).dice;

                    finalizePiece(piece);

                } else break;

            } else if(((piece.position + getRoom(getPlayer(ws)).dice) > 38) && piece.canEntryFinal) {
                //Aqui é se precisar entrar na reta final

                piece.position += getRoom(getPlayer(ws)).dice;
                piece.position = 115 + (piece.position - 38);
                piece.final = true;

                finalizePiece(piece);

            } else if (piece.position !== 0 ) {
                //Aqui é o 'padrão'

                piece.position += getRoom(getPlayer(ws)).dice;
            } ;
            break;
    }
};

function finalizePiece(piece){
    switch (getRoom(getPlayer(ws)).players.indexOf(getRoom(getPlayer(ws)).turnsPlayer)) {
        case 0:

            if(piece.position > 105) {
                //Aqui é se terminou

                piece.finished = true;
                piece.position = 0;
                getRoom(getPlayer(ws)).justFinishedPiece = true;
            }

            break;

        case 1:

            if(piece.position > 110) {
                //Aqui é se terminou

                piece.finished = true;
                piece.position = 0;
                getRoom(getPlayer(ws)).justFinishedPiece = true;
            }

            break;
        
        case 2:

            if(piece.position > 115) {
                //Aqui é se terminou

                piece.finished = true;
                piece.position = 0;
                getRoom(getPlayer(ws)).justFinishedPiece = true;
            } 

            break;

        case 3:

            if(piece.position > 120) {
                //Aqui é se terminou

                piece.finished = true;
                piece.position = 0;
                getRoom(getPlayer(ws)).justFinishedPiece = true;
            }

            break;
    };
};

server.listen(port, () => {console.log(`server listening on port ${port}`)});