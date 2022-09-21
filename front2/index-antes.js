let socketClient = new WebSocket('ws://localhost:9999');
let name = document.getElementById('name');
let diceBtn = document.getElementById('diceBtn');
let initBtn = document.getElementById('initBtn');
diceBtn.addEventListener('click', dice);
diceBtn.style.display = 'none';
initBtn.addEventListener('click', init);
let playerID;
let numDado;
let hasDiced = false;
let msg;

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

                if(msg.room.turn !== null) {
                    msg.room.turnsPlayer = msg.room.players[msg.room.turn % 4];

                    if(msg.room.dice) {
                        console.log(`${msg.room.turnsPlayer.name} tirou ${msg.room.dice} no dado!`);

                        playOrPass();
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

    let msgInit = {
        type: 'initPlayer',
        playerName: name.value,
        playerID: playerID
    }

    socketClient.send(JSON.stringify(msgInit));
    name.value = '';
    initBtn.disabled = true;
    diceBtn.style.display = 'flex';
    name.style.display = 'none';
    initBtn.style.display = 'none';
};

function turn () {

    if (msg.room.turnsPlayer.id === playerID) {
        console.log(msg.room.turnsPlayer.name + ", Eh sua vez de jogar o dado!");
    } else {
        console.log('É a vez de: ' + msg.room.turnsPlayer.name);
    };

    ableDisableDiceBtn();
};

function dice () {
    numDado = Math.floor(Math.random() * 6 + 1);
    hasDiced = true;
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

        if(howManyPiecesHasOnBoard(msg.room.turnsPlayer) == 1 && msg.room.dice !== 6) {

            moveSinglePiece();
            console.log(`${msg.room.turnsPlayer.name} tem apenas uma peça em jogo, ela foi movida automaticamente e a vez será passada`);
            passTurn();
        } else {

            move();
        };

    } else if(!hasPiecesOnBoard(msg.room.turnsPlayer) && msg.room.dice == 6) {

        move()
    } else {

        console.log(`${msg.room.turnsPlayer.name} não tem peças no tabuleiro e não tirou 6 no dado, a vez será passada`)
        passTurn();
    }











    // if(hasPiecesOnBoard(msg.room.turnsPlayer) || msg.room.dice == 6) {

    //     if(msg.room.dice == 6) canDiceAgain();

    //     console.log(`${msg.room.turnsPlayer.name} tem ` + howManyPiecesHasOnBoard(msg.room.turnsPlayer) + ' peças em jogo');

    //     if(howManyPiecesHasOnBoard(msg.room.turnsPlayer) == 1) {

    //         console.log('escrever aqui logica pra andar peça sozinha');
    //         moveSinglePiece();

    //     } else if (false) {

    //         move();
    //     }

    // } else if(dice != 6) {

    //     if(hasPiecesOnBoard(msg.room.turnsPlayer)) {
    //         move();
    //     };

    //     console.log(`${msg.room.turnsPlayer.name} não tem peça no tabuleiro e não tirou 6. A vez será passada`);
    //     hasDiced = false;    

    //     passTurn();
    // };
};

function renderAll() {
    document.getElementById('casinhas').innerHTML = '';
    document.getElementById('table').innerHTML = '';

    for(let i = 1; i <= 15; i++) {
        let cell = document.createElement('div');
        cell.setAttribute('class', 'divs');
        cell.setAttribute('id', `casa${i}`);
        document.getElementById('table').appendChild(cell);
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

                document.getElementById(`casa${piece.position}`).appendChild(playerPiece);

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

        piece.position += numDado;

        renderAll();

        // e.target.remove();

        console.log('finalizando turno');
        document.body.removeEventListener('click', moving);    
        passTurn();
    } else {
        console.log("Clique nas suas peças!");
    };
};

function moveSinglePiece () {
    console.log("auto moving single piece");

    
};

function hasPiecesOnBoard (player) {
    return player.pieces.find(piece => piece.position !== null) ? true : false;
};

function howManyPiecesHasOnBoard(player) {
    return player.pieces.filter(piece => piece.position !==null).length;
};

function canDiceAgain () {

};