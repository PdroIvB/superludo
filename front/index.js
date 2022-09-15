let socketClient = new WebSocket('ws://localhost:9999');

socketClient.addEventListener('open', function (event) {
    console.log('connected to ws server');
});

socketClient.addEventListener('message',  function (event) {
    console.log(JSON.parse(event.data));
});

const sendMessage = (message) => {
    const msg = {
        type: "message",
        text: message,
        // id: clientID,
        date: Date.now()
    }

    socketClient.send(JSON.stringify(msg))
    console.log('msg enviada?')
};

const conectar = () => {
    socketClient = new WebSocket('ws://localhost:9999');
    console.log('conectado novamente')
}