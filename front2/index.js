let socketClient = new WebSocket('ws://localhost:9999');
let name = document.getElementById('name');
let diceBtn = document.getElementById('diceBtn');
let initBtn = document.getElementById('initBtn');
diceBtn.addEventListener('click', jogar);
diceBtn.style.display = 'none';
initBtn.addEventListener('click', init);
let room;
let player;
let playerID;
let numDado;
let hasDiced = false;

socketClient.onopen = () => {
    console.log('connecteeeedd')
};

socketClient.onmessage = (event) => {
    let msg = JSON.parse(event.data);

    switch (msg.type) {
        case 'identifier':

                playerID = msg.playerID;
                
            break;

        case 'room':

                room = msg.room;
                player = room.players.find(player => player.id === playerID);

                if(room.turn !== null) turn();
                if(room.dice) console.log(`${room.turnsPlayer.name} tirou ${room.dice} no dado!`);
                
                renderAll();
            break;

        case 'updateRoomRequest':
            
                socketClient.send(JSON.stringify(requestRoomUpdate = {
                    type: 'sendUpdatedRoom',
                    playerID: player.id
                }));

            break;

        case 'turn':

                a;

            break;
    
        // default:
        //     break;
    }
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
    room.turnsPlayer = room.players[room.turn % 4];

    if ( player === room.turnsPlayer ) {
        console.log(room.turnsPlayer.name + ", Eh sua vez de jogar o dado!");
    } else {
        console.log('É a vez de: ' + room.turnsPlayer.name);
    };

    ableDisableDiceBtn();
};

function passTurn () {
    room.turn++;
    document.body.removeEventListener('click', moving);
    hasDiced = false;

    let msgEndedTurn = {
        type: 'endedTurn',
        player: player,
        room: room
    };

    socketClient.send(JSON.stringify(msgEndedTurn));
};

function jogar () {
    numDado = Math.floor(Math.random() * 3 + 1);
    hasDiced = true;
    diceBtn.disabled = true;
    
    let msgDado = {
        type: 'dado',
        numDado: numDado,
        player: player
    };
    
    socketClient.send(JSON.stringify(msgDado));
    
    move();
};

function renderAll() {
    document.getElementById('casinhas').innerHTML = '';
    document.getElementById('table').innerHTML = '';

    for(let i = 1; i < 30; i++) {
        let cell = document.createElement('div');
        cell.setAttribute('class', 'divs');
        cell.setAttribute('id', `casa${i}`);
        document.getElementById('table').appendChild(cell);
    };
    
    room.players.forEach( player => {
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
    if ( player === room.turnsPlayer && !hasDiced) {
        diceBtn.disabled = false;
    } else {
        diceBtn.disabled = true;
    };
};

function move () {

    document.body.addEventListener("click", moving);
};

function moving (e) {

    if(e.target.matches(`[data-playerid="${room.turnsPlayer.id}"]`)) {

        let pieceData =  e.target.attributes.id.value.split('-');
        let piece = room.turnsPlayer.pieces.find(piece => piece.id == pieceData[1]);

        piece.position += numDado;

        renderAll();

        e.target.remove();

        console.log('finalizando turno');
        passTurn();
    } else {
        console.log("Clique nas suas peças!");
    };
};