const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync(`${__dirname}/../client/index.html`);

const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.0.1: ${port}`);

const io = socketio(app);

const rect = {
  x: 300,
  y: 300,
  height: 25,
  width: 70,
  color: 'black',
};

const user = {
  name: 'default',
};

let time = 0;

io.on('connect', (socket) => {
  socket.join('room');

  socket.on('draw', (data) => {
    rect.x = data.x;
    rect.y = data.y;
    rect.color = data.color;

    io.sockets.in('room').emit('update', rect);
  });

  socket.on('setTime', (data) => {
    time = data;

    io.sockets.in('room').emit('timeChange', time);
  });

  socket.on('join', (data) => {
    user.name = data;
    const message = {
      msg: `${user.name} has joined`,
      name: 'server',
    };

    io.sockets.in('room').emit('receiveMsg', message);
  });

  socket.on('sendMsg', (data) => {
    const message = {
      msg: data.msg,
      name: data.name,
    };

    io.sockets.in('room').emit('receiveMsg', message);
  });
});
