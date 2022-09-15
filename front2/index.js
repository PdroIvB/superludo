let socketClient = new WebSocket('ws://localhost:9999');
let name = document.getElementById('name');
let playerID;
let btnDado = document.getElementById('btnDado');
let turnNum = 0;

socketClient.onopen = () => {
    console.log('connecteeeedd')
};

socketClient.onmessage = (event) => {
    let msg = JSON.parse(event.data);

    switch (msg.type) {
        case 'identifier':
                playerID = msg.playerID;            
            break;
    
        // default:
        //     break;
    }
};

function setPlayerName() {

    let dados = {
        type: 'setPlayerName',
        name: name.value,
        playerID: playerID
    }

    socketClient.send(JSON.stringify(dados));
    btnDado.disabled = false;
    document.getElementById('nomeDoJogador').innerHTML = name.value;
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
    turn(numSort);
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

function cleanRender() {
    let div1Pos = player1.position;
    let div2Pos = player2.position;
    let divPos1 = document.getElementById(`${div1Pos}`);
    let divPos2 = document.getElementById(`${div2Pos}`);

    divPos1.innerHTML = '';
    divPos2.innerHTML = '';
};