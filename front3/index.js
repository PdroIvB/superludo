let btnPlay = document.getElementById('btnPlay')
let btnConectar = document.getElementById('btnConectar');
btnPlay.addEventListener('click', dado);
btnConectar.addEventListener('click', conectar);
let numSort;
let turnNum = 0;
let isConnected = false;
btnPlay.disabled = true;

let player1 = {
    name: 'player1',
    position: 0
}

let player2 = {
    name: 'player2',
    position: 0
}

function conectar () {

    let socketClient = new WebSocket('ws://localhost:9999');

    isConnected = true;

    console.log('conectado ao ws server');

    if(isConnected){
        turnAbleToPlay();
    }
}

function turnAbleToPlay() {
    btnPlay.disabled = false;
}

function turn (numsort) {
    console.log('turn Num: ' + turnNum);
    turnNum++;
    console.log('turn Num: ' + turnNum);

    if((turnNum % 2) == 0) {

        console.log('andar com player 2');
        andar(player2, numsort);

    } else {

        console.log('andar com player 1');
        andar(player1, numsort);
    }
}

function dado () {
    numSort = Math.floor(Math.random() * 3 + 1);
    console.log('num sorteado: ' + numSort);
    turn(numSort);
}

function andar (player, numsort) {
    cleanRender();

    player.position = player.position + numsort;

    console.log('posição player 1: ' + player1.position);
    console.log('posição player 2: ' + player2.position);

    render();
}

function render() {
    let div1Pos = player1.position;
    let div2Pos = player2.position;
    let divPos1 = document.getElementById(`${div1Pos}`);
    let divPos2 = document.getElementById(`${div2Pos}`);

    divPos1.innerHTML += `\n  ${player1.name}`;
    divPos2.innerHTML += `\n  ${player2.name}`;
}

function cleanRender() {
    let div1Pos = player1.position;
    let div2Pos = player2.position;
    let divPos1 = document.getElementById(`${div1Pos}`);
    let divPos2 = document.getElementById(`${div2Pos}`);

    divPos1.innerHTML = '';
    divPos2.innerHTML = '';
}