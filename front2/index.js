let socketClient = new WebSocket('ws://localhost:9999');
let name = document.getElementById('name');
let diceBtn = document.getElementById('diceBtn');
let initBtn = document.getElementById('initBtn');
diceBtn.addEventListener('click', dice);
diceBtn.style.display = 'none';
initBtn.addEventListener('click', init);
let playerID;
let msg;
let allPieces;
let room;

socketClient.onopen = () => {
    console.log('connecteeeedd')
};

socketClient.onmessage = (event) => {
    msg = JSON.parse(event.data);

    switch (msg.type) {
        case 'identifier':

                playerID = msg.playerID;
                
            break;

        case 'roomUpdate':
                console.log('room just when arrived: ', msg.room);

                room = msg.room;

                if(msg.room.turn !== null) {

                    turn();

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

        case 'makeAMove':

                document.body.addEventListener("click", moving);

            break;

        case 'updateMsg':

                console.log(`${msg.updateMsg}`)

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
            autoMove(); //TODO ver o q fazer com o bot do front
        }
    };

    ableDisableDiceBtn();
};

function dice () {
    diceBtn.disabled = true;
    
    let msgDado = {
        type: 'dado',
    };
    
    socketClient.send(JSON.stringify(msgDado));
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
    if ( msg.room.turnsPlayer.id === playerID) {
        diceBtn.disabled = false;
    } else {
        diceBtn.disabled = true;
    };
};

function moving (e) {

    if(e.target.matches(`[data-playerid="${msg.playerID}"]`)) {

        let pieceData =  e.target.attributes.id.value.split('-');
        let piece = room.players.find(player => player.id === msg.playerID).pieces.find(piece => piece.id == pieceData[1]);

        if(piece.position !== null || msg.dice == 6){

            socketClient.send(JSON.stringify({
                type: 'move',
                piece: piece
            }));

            document.body.removeEventListener('click', moving);

        } else if (piece.position === null) {

            console.log('ce num tirou 6 véi, então clica numa pc q ja tá em jogo parça');
        }

    } else {
        console.log("Clique nas suas peças!");
    };
};
