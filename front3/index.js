let socketClient = new WebSocket('ws://localhost:9999');
let name = document.getElementById('name');
let btnDado = document.getElementById('btnDado');
let room;
let player;
let playerID;
let turnNum = 0;
let numDado = 1;

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

                console.log(room);
            
                renderAll();

            break;

        case 'requestRoomUpdate':
            
                socketClient.send(JSON.stringify(requestRoomUpdate = {
                    type: 'sendUpdatedRoom',
                    playerID: player.id
                }));

            break;
    
        // default:
        //     break;
    }
};

function start() {

    let start = {
        type: 'start',
        playerName: name.value,
        playerID: playerID
    }

    socketClient.send(JSON.stringify(start));
    btnDado.disabled = false;
    name.value = '';

};

function sendMessage () {

    const msg = {
        type: "message",
        text: texto.value,
        // id: clientID,
        date: Date.now()
    }

    socketClient.send(JSON.stringify(msg));
};

function conectar () {

    socketClient = new WebSocket('ws://localhost:9999');

    console.log('conectado novamente')
};

function jogar() {
    numSort = Math.floor(Math.random() * 3 + 1);
    // console.log('num sorteado: ' + numSort);

    let selectedPiece = selectPiece();

    let numDado = {
        type: 'numDado',
        numSort: numSort,
    };

    socketClient.send(JSON.stringify(numDado))

    // turn(numSort);
};

function turn (numsort) {
    turnNum++;

    if((turnNum % 2) == 0) {

        console.log('andar com player 2');
        andar(player2, numsort);

    } else {

        console.log('andar com player 1');
        andar(player1, numsort);

    }
};

function andar (player, numsort) {
    cleanRender();

    player.position = player.position + numsort;

    console.log('posição player 1: ' + player1.position);
    console.log('posição player 2: ' + player2.position);

    render();
};

function render() {
    let div1Pos = player1.position;
    let div2Pos = player2.position;
    let divPos1 = document.getElementById(`${div1Pos}`);
    let divPos2 = document.getElementById(`${div2Pos}`);

    divPos1.innerHTML += `\n  ${player1.name}`;
    divPos2.innerHTML += `\n  ${player2.name}`;
};

function renderAll() {
    document.getElementById('casinhas').innerHTML = '';
    
    room.players.forEach( player => {
        let playerConteiner = document.createElement('div')
        playerConteiner.setAttribute('class', 'playerConteiner');
        playerConteiner.setAttribute('id', `${player.name}Conteiner`);
        document.getElementById('casinhas').appendChild(playerConteiner);
        let playerNameP = document.createElement('p');
        playerNameP.innerHTML = player.name;
        playerConteiner.appendChild(playerNameP);

        player.pieces.forEach(piece => {
    
            let playerPiece = document.createElement('div');
            playerPiece.setAttribute('class', 'piece');
            playerPiece.setAttribute('id', `${player.name}${piece.id}`);
            playerPiece.innerHTML = playerPiece.getAttribute('id');
            
            document.getElementById(`${player.name}Conteiner`).appendChild(playerPiece)
            
            playerPiece.addEventListener('click', movimentar);
        });
    })
};

function movimentar () {
    console.log(`vou movimentar essa peça ${numDado} casas` )
}