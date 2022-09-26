let socketClient = new WebSocket('ws://localhost:9999');
let name = document.getElementById('name');
let diceBtn = document.getElementById('diceBtn');
let initBtn = document.getElementById('initBtn');
diceBtn.addEventListener('click', dice);
diceBtn.style.display = 'none';
initBtn.addEventListener('click', sendName);
let playerID;
let msg;
let allPieces;
let room;

socketClient.onopen = () => {
    console.log('connecteeeedd');

    // let token = localStorage.getItem('token');

    /* if(token) {
        name.value = '';
        name.style.display = 'none';
        initBtn.disabled = true;
        initBtn.style.display = 'none';
        socketClient.send(JSON.stringify({
            type: 'reconnection',
            token: token //enviar o token do front pro back por aqui
        }));
    }; */
};

socketClient.onmessage = (event) => {
    msg = JSON.parse(event.data);

    switch (msg.type) {
        case 'identifier':
                
                playerID = msg.playerID;
                localStorage.setItem('token', msg.token);
                
            break;

        case 'verifyConnection':

            let token = localStorage.getItem('token');

            if(token) {

                socketClient.send(JSON.stringify({
                    type: 'reconnection',
                    token: token
                }));

            } else {

                socketClient.send(JSON.stringify({
                    type: 'initPlayer'
                }));
            };

            break;

        case 'roomUpdate':

                if (msg.playerID) {
                    playerID = msg.playerID
                }

                document.getElementById("piecesToSelect").innerHTML = "";

                console.log('room just when arrived: ', msg.room);

                room = msg.room;

                diceBtn.style.display = 'flex';

                if(msg.room.turn !== null) {
                };

                renderAll();

            break;

        case 'updateRoomRequest':
                name.value = '';
                name.style.display = 'none';
                initBtn.disabled = true;
                initBtn.style.display = 'none';

                if (msg.playerID) {
                    playerID = msg.playerID
                }

                socketClient.send(JSON.stringify(requestRoomUpdate = {
                    type: 'sendUpdatedRoom',
                    playerID: playerID
                }));

            break;

        case 'makeAMove':

                document.body.addEventListener("click", moving);

            break;

        case 'updateMsg':

                console.log(msg.msg);

            break;

        case 'selectAPiece':
                document.getElementById("piecesToSelect").innerHTML = "";

                console.log(`Selecione uma das peças: `, msg.pieces);

                renderPieces(msg.pieces);

            break;

        case 'numDado':

                console.log(msg.msg);
                //esse caminho só vai entregar o numero do dado

            break;

        case 'ableDiceBtn':

                diceBtn.disabled = false;
                console.log(`abledar esse dicebtn aí`);

            break;
    };
};

function renderPieces (arrPieces) {

    arrPieces.forEach((piecePosition) => {
        if(piecePosition || piecePosition === 0) {

            let piece = document.createElement('div');

            piece.setAttribute('class', 'divs');
            piece.innerHTML = `${piecePosition}`;

            piece.addEventListener('click', () => {
                socketClient.send(JSON.stringify({
                    type: 'selectedPiece',
                    position: piecePosition
                }));
            });

            document.getElementById("piecesToSelect").appendChild(piece);
        };
    });
};

function sendName() {

    let nameToSend = !name.value ? `JogadorSemNome` : name.value;

    let msgInit = {
        type: 'setName',
        playerName: nameToSend,
    }

    socketClient.send(JSON.stringify(msgInit));
    name.value = '';
    name.style.display = 'none';
    initBtn.disabled = true;
    initBtn.style.display = 'none';
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

    for(let i = 101; i <= 105; i++) {
        let finalCell = document.createElement('div');
        finalCell.setAttribute('class', 'finalCells');
        finalCell.setAttribute('id', `casaFinal-${i}`);
        finalCell.innerHTML = `casaFinal-${i}`;
        document.getElementById('retaFinal-0').appendChild(finalCell);
    };
    for(let i = 106; i <= 110; i++) {
        let finalCell = document.createElement('div');
        finalCell.setAttribute('class', 'finalCells');
        finalCell.setAttribute('id', `casaFinal-${i}`);
        finalCell.innerHTML = `casaFinal-${i}`;
        document.getElementById('retaFinal-1').appendChild(finalCell);
    };
    for(let i = 111; i <= 115; i++) {
        let finalCell = document.createElement('div');
        finalCell.setAttribute('class', 'finalCells');
        finalCell.setAttribute('id', `casaFinal-${i}`);
        finalCell.innerHTML = `casaFinal-${i}`;
        document.getElementById('retaFinal-2').appendChild(finalCell);
    };
    for(let i = 116; i <= 120; i++) {
        let finalCell = document.createElement('div');
        finalCell.setAttribute('class', 'finalCells');
        finalCell.setAttribute('id', `casaFinal-${i}`);
        finalCell.innerHTML = `casaFinal-${i}`;
        document.getElementById('retaFinal-3').appendChild(finalCell);
    };
    
    msg.room.players.forEach( player => {
        if(player){

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
        }
    })
};

function moving (e) {

    if(e.target.matches(`[data-playerid="${msg.playerID}"]`)) {

        let pieceData =  e.target.attributes.id.value.split('-');
        let piece = room.players.find(player => player.id === msg.playerID).pieces.find(piece => piece.id == pieceData[1]);

        if(piece.position !== null || msg.dice == 6 || piece.position !== 0 ){

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
