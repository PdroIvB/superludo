let socketClient = new WebSocket('ws://localhost:9999');
let name = document.getElementById('name');
let diceBtn = document.getElementById('diceBtn');
let initBtn = document.getElementById('initBtn');
diceBtn.addEventListener('click', dice);
diceBtn.style.display = 'none';
initBtn.addEventListener('click', init);
let playerID;
let numDado;
let msg;
let allPieces;

socketClient.onopen = () => {
    console.log('connecteeeedd')
};

socketClient.onmessage = (event) => {
    msg = JSON.parse(event.data);

    switch (msg.type) {
        case 'identifier':

                playerID = msg.playerID;
                
            break;

        case 'room':
                console.log('room just when arrived: ', msg.room);

                if(msg.room.players.filter(player => player.isBot === true)) {
                    msg.room.players.filter(player => player.isBot === true).forEach(disconnectedPlayer => console.log(`${disconnectedPlayer.name} desconectou da sala.`));
                };

                if(msg.room.turn !== null) {
                    msg.room.turnsPlayer = msg.room.players[msg.room.turn % 4];

                    if(msg.room.dice) {
                        console.log(`${msg.room.turnsPlayer.name} tirou ${msg.room.dice} no dado!`);

                        if(msg.room.turnsPlayer.isBot) {
                            autoMove();
                        } else {
                            playOrPass();
                        }
                    };

                    if(!msg.room.diced) turn();

                } else {

                    console.log('Aguardando outros jogadores entrarem para iniciar a partida!');
                };

                renderAll();

            break;

        case 'updateRoomRequest':
            
                socketClient.send(JSON.stringify(requestRoomUpdate = {
                    type: 'sendUpdatedRoom',
                    playerID: playerID
                }));

            break;
    };
};

function init() {

    let nameToSend = !name.value ? `JogadorSemNome` : name.value;

    let msgInit = {
        type: 'initPlayer',
        playerName: nameToSend,
        playerID: playerID
    }

    socketClient.send(JSON.stringify(msgInit));
    name.value = '';
    name.style.display = 'none';
    initBtn.disabled = true;
    initBtn.style.display = 'none';
    diceBtn.style.display = 'flex';
};

function turn () {

    if (msg.room.turnsPlayer.id === playerID) {
        console.log(msg.room.turnsPlayer.name + ", Eh sua vez de jogar o dado!");
    } else {
        console.log('É a vez de: ' + msg.room.turnsPlayer.name);
        if (msg.room.turnsPlayer.isBot) {
            autoMove();
        }
    };

    ableDisableDiceBtn();
};

function dice () {
    numDado = Math.floor(Math.random() * 6 + 1);
    // numDado = 6;
    diceBtn.disabled = true;
    console.log('numDado ' + numDado);
    
    let msgDado = {
        type: 'dado',
        numDado: numDado
    };
    
    socketClient.send(JSON.stringify(msgDado));
};

function passTurn () {
    if(msg.room.turnsPlayer.id === playerID) {
        msg.room.turn++;
        
        console.log('sala rifhtbefore sending: ', msg.room);
        let msgEndedTurn = {
            type: 'endedTurn',
            room: msg.room
        };
    
        socketClient.send(JSON.stringify(msgEndedTurn));
    } else {
        console.log(`não sou o jogador da vez, esperando ${msg.room.turnsPlayer.name} enviar o fim do turno`);
    }
};

function playOrPass () {

    if(hasPiecesOnBoard(msg.room.turnsPlayer)) {

        if(playerPiecesOnBoard(msg.room.turnsPlayer).length == 1 && msg.room.dice !== 6) {

            moveSinglePiece();

            console.log(`${msg.room.turnsPlayer.name} tem apenas uma peça em jogo, ela foi movida automaticamente e a vez será passada`);

            passTurn();

        } else if(playerPiecesOnBoard(msg.room.turnsPlayer).length == 1 && msg.room.dice === 6) { 

            move();

        } else {

            move();
        };

    } else if(!hasPiecesOnBoard(msg.room.turnsPlayer) && msg.room.dice == 6) {

        move()
    } else {

        console.log(`${msg.room.turnsPlayer.name} não tem peças no tabuleiro e não tirou 6 no dado, a vez será passada`)
        passTurn();
    }

};

function renderAll() {
    document.getElementById('casinhas').innerHTML = '';
    document.getElementById('table').innerHTML = '';
    document.getElementById('retaFinal-0').innerHTML = '';
    document.getElementById('retaFinal-1').innerHTML = '';
    document.getElementById('retaFinal-2').innerHTML = '';
    document.getElementById('retaFinal-3').innerHTML = '';

    for(let i = 1; i <= 52; i++) {
        let cell = document.createElement('div');
        cell.setAttribute('class', 'divs');
        cell.setAttribute('id', `casa${i}`);
        cell.innerHTML = i;
        document.getElementById('table').appendChild(cell);
    };

    for(let i = 101; i <= 106; i++) {
        let finalCell = document.createElement('div');
        finalCell.setAttribute('class', 'finalCells');
        finalCell.setAttribute('id', `casaFinal-${i}`);
        finalCell.innerHTML = `casaFinal-${i}`;
        document.getElementById('retaFinal-0').appendChild(finalCell);
    };
    for(let i = 107; i <= 111; i++) {
        let finalCell = document.createElement('div');
        finalCell.setAttribute('class', 'finalCells');
        finalCell.setAttribute('id', `casaFinal-${i}`);
        finalCell.innerHTML = `casaFinal-${i}`;
        document.getElementById('retaFinal-1').appendChild(finalCell);
    };
    for(let i = 112; i <= 116; i++) {
        let finalCell = document.createElement('div');
        finalCell.setAttribute('class', 'finalCells');
        finalCell.setAttribute('id', `casaFinal-${i}`);
        finalCell.innerHTML = `casaFinal-${i}`;
        document.getElementById('retaFinal-2').appendChild(finalCell);
    };
    for(let i = 117; i <= 121; i++) {
        let finalCell = document.createElement('div');
        finalCell.setAttribute('class', 'finalCells');
        finalCell.setAttribute('id', `casaFinal-${i}`);
        finalCell.innerHTML = `casaFinal-${i}`;
        document.getElementById('retaFinal-3').appendChild(finalCell);
    };
    
    msg.room.players.forEach( player => {
        let playerConteiner = document.createElement('div');
        playerConteiner.setAttribute('class', 'playerConteiner');
        playerConteiner.setAttribute('id', `${player.name}Conteiner`);
        document.getElementById('casinhas').appendChild(playerConteiner);
        let playerNameP = document.createElement('p');
        playerNameP.innerHTML = player.name;
        playerConteiner.appendChild(playerNameP);

        player.pieces.forEach(piece => {
            let playerPiece = document.createElement('div');
            playerPiece.setAttribute('class', 'piece');
            playerPiece.setAttribute('id', `${player.name}-${piece.id}`);
            playerPiece.innerHTML = playerPiece.getAttribute('id');
            
            playerPiece.setAttribute('data-playerid', `${player.id}`);
            
            if(piece.position !== null) {                
                if(piece.position > 100){

                    document.getElementById(`casaFinal-${piece.position}`).appendChild(playerPiece);

                } else {

                    document.getElementById(`casa${piece.position}`).appendChild(playerPiece);
                }

            } else {

                document.getElementById(`${player.name}Conteiner`).appendChild(playerPiece)
            };
        });
    })
};

function ableDisableDiceBtn () {
    if ( msg.room.turnsPlayer.id === playerID && !msg.room.diced) {
        diceBtn.disabled = false;
    } else {
        diceBtn.disabled = true;
    };
};

function move () {

    if (msg.room.turnsPlayer.id === playerID ) {
        document.body.addEventListener("click", moving);
        console.log('clique em uma de suas peças para movê-la no tabuleiro');
    } else {
        console.log(`${msg.room.turnsPlayer.name} está tomando sua ação!`);
    };

};

function moving (e) {

    if(e.target.matches(`[data-playerid="${msg.room.turnsPlayer.id}"]`)) {

        let pieceData =  e.target.attributes.id.value.split('-');
        let piece = msg.room.turnsPlayer.pieces.find(piece => piece.id == pieceData[1]);

        if(piece.position !== null || msg.room.dice == 6){

            sumPiecePosition(piece);
            
            console.log('finalizando turno');

            document.body.removeEventListener('click', moving);    

            passTurn();

        } else if (piece.position === null) {

            console.log('ce num tirou 6 véi, então clica numa pc q ja tá em jogo parça');
        }

    } else {
        console.log("Clique nas suas peças!");
    };
};

function moveSinglePiece () {
    console.log("auto moving single piece");

    // msg.room.turnsPlayer.pieces.find(piece => piece.position !== null).position += msg.room.dice;

    sumPiecePosition(msg.room.turnsPlayer.pieces.find(piece => piece.position !== null));
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

        if(!msg.room.diced) {

            console.log("jogando dado pelo bot")

            dice();

        } else {
            console.log('movimentar a peça do bot');

            if(hasPiecesOnBoard(msg.room.turnsPlayer)) {

                if(playerPiecesOnBoard(msg.room.turnsPlayer).length == 1 && msg.room.dice !== 6) {
        
                    // msg.room.turnsPlayer.pieces.reduce(function(prev, current) {
                    //     return (prev.position > current.position) ? prev : current
                    // }).position += msg.room.dice;

                    sumPiecePosition(msg.room.turnsPlayer.pieces.reduce(function(prev, current) {
                        return (prev.position > current.position) ? prev : current
                    }));
        
                    console.log(`${msg.room.turnsPlayer.name} tem apenas uma peça em jogo, ela foi movida automaticamente e a vez será passada`);
        
                    passTurnForBot();
        
                } else if(playerPiecesOnBoard(msg.room.turnsPlayer).length == 1 && msg.room.dice === 6) { 

                    // msg.room.turnsPlayer.pieces.find(piece => piece.position === null).position += msg.room.dice;

                    sumPiecePosition(msg.room.turnsPlayer.pieces.find(piece => piece.position === null));

                    passTurnForBot();
        
                } else {

                    console.log("bot tem mais de uma peça no tabuleiro e nao tirou 6, decidir com qual movimentar");

                    // msg.room.turnsPlayer.pieces.reduce(function(prev, current) {
                    //     return (prev.position > current.position) ? prev : current
                    // }).position += msg.room.dice;

                    sumPiecePosition(msg.room.turnsPlayer.pieces.reduce(function(prev, current) {
                        return (prev.position > current.position) ? prev : current
                    }));


                    passTurnForBot()
                };
        
            } else if(!hasPiecesOnBoard(msg.room.turnsPlayer) && msg.room.dice == 6) {
        
                console.log("bot sem peças no tabuleiro mas tirou 6 no dado, fazer a lógica de tirar alguma peça da casinha");

                // msg.room.turnsPlayer.pieces[0].position += msg.room.dice;

                sumPiecePosition(msg.room.turnsPlayer.pieces[0]);

                passTurnForBot();

            } else {
        
                console.log(`${msg.room.turnsPlayer.name} não tem peças no tabuleiro e não tirou 6 no dado, a vez será passada`)
                passTurnForBot();
            }
        };

    } else {
        console.log("aguardando a jogada do bot");
    }
}

function passTurnForBot () {
    if(isWhoIsGoingToPlayForBot()) {
        msg.room.turn++;
        
        console.log('sala rifhtbefore sending: ', msg.room);
        let msgEndedTurn = {
            type: 'endedTurn',
            room: msg.room
        };
    
        socketClient.send(JSON.stringify(msgEndedTurn));
    } else {
        console.log(`não sou o jogador da vez, esperando ${msg.room.turnsPlayer.name} enviar o fim do turno`);
    }
};

function isWhoIsGoingToPlayForBot () {
    if(((++msg.room.turn) % 4) == msg.room.players.indexOf(msg.room.players.find(player => player.id === playerID))) {
        --msg.room.turn;
        return true;
    } else {
        --msg.room.turn;
        return false;
    }
};

function sumPiecePosition (piece) {

    if(!hasPiecesOnBoard(msg.room.turnsPlayer)){
        if(msg.room.turnsPlayer === msg.room.players[0]) {
            piece.position = piece.position - 5 + msg.room.dice;
        } else if (msg.room.turnsPlayer === msg.room.players[1]) {
            piece.position = piece.position + 7 + msg.room.dice;
            
        } else if (msg.room.turnsPlayer === msg.room.players[2]) {
            piece.position = piece.position + 19 + msg.room.dice;
            
        } else if (msg.room.turnsPlayer === msg.room.players[3]) {
            piece.position = piece.position + 31 + msg.room.dice;
            
        };
    } else if (piece.position === null) {
        if(msg.room.turnsPlayer === msg.room.players[0]) {
            piece.position = piece.position - 5 + msg.room.dice;
        } else if (msg.room.turnsPlayer === msg.room.players[1]) {
            piece.position = piece.position + 7 + msg.room.dice;
            
        } else if (msg.room.turnsPlayer === msg.room.players[2]) {
            piece.position = piece.position + 19 + msg.room.dice;
            
        } else if (msg.room.turnsPlayer === msg.room.players[3]) {
            piece.position = piece.position + 31 + msg.room.dice;
            
        };
    } else {

        movePieceCorrectly(piece);

    };

    if(piece.position > 52 && !piece.final) {
        piece.position = piece.position - 52
        piece.canEntryFinal = true;
    };
};

function killAnotherPiece (pieceInMoving) {
    if(hasPìeceWithPositionConflict(pieceInMoving)){
        console.log("Tem peça pra matar")
        pieceWithPositionConflict(pieceInMoving).final = false;   
        pieceWithPositionConflict(pieceInMoving).canEntryFinal = false;   
        pieceWithPositionConflict(pieceInMoving).position = null;
        msg.room.killed = true;
    } else {
        return;
    };
};

function reuneAllPieces () {
    allPieces = [];
    msg.room.players.forEach(player => {
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

function movePieceCorrectly (piece) {
    switch (msg.room.players.indexOf(msg.room.turnsPlayer)) {
        case 0:
                piece.position += msg.room.dice;
                killAnotherPiece(piece);
                if(piece.position > 51 && !piece.final) {
                    piece.position = 100 + (piece.position - 51);
                    piece.final = true;
                }
                if(piece.position > 105) console.log(`ACABOOOU O JOOOOGO!!! ${msg.room.turnsPlayer.name} VENCEEEEEU!!!`);

            break;
                
        case 1:
                piece.position += msg.room.dice;
                killAnotherPiece(piece);
                if(piece.position > 11 && piece.canEntryFinal) {
                    piece.position = 105 + (piece.position - 11);
                    piece.final = true;
                }
                if(piece.position > 110) console.log(`ACABOOOU O JOOOOGO!!! ${msg.room.turnsPlayer.name} VENCEEEEEU!!!`);
            break;
            
        case 2:
                piece.position += msg.room.dice;
                killAnotherPiece(piece);
                if(piece.position > 23 && piece.canEntryFinal) {
                    piece.position = 110 + (piece.position - 23);
                    piece.final = true;
                }
                if(piece.position > 115) console.log(`ACABOOOU O JOOOOGO!!! ${msg.room.turnsPlayer.name} VENCEEEEEU!!!`);
            break;
            
        case 3:
                piece.position += msg.room.dice;
                killAnotherPiece(piece);
                if(piece.position > 35 && piece.canEntryFinal) {
                    piece.position = 115 + (piece.position - 35);
                    piece.final = true;
                }
                if(piece.position > 120) console.log(`ACABOOOU O JOOOOGO!!! ${msg.room.turnsPlayer.name} VENCEEEEEU!!!`);
            break;
    }
};