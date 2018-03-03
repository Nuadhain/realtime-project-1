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

const objectives = ['Make sure the entire wall is painted', 'Make sure the entire wall is one color', 'Pick a color and make sure it stays on the wall', 'Just before the paint dries change the color of the wall', 'Draw an image on the wall at least once', 'Come up with your own objective but do not let your friends know what it is', 'Start a Bolshevik revolution'];

const users = [];

let time = 0;
let key = 0;

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
    users[key] = data;

    if (key === 0) {
      socket.emit('setHost', true);
    }

    key++;
    const message = {
      msg: `${data.name} has joined`,
      name: 'server',
    };

    io.sockets.in('room').emit('setKey', key);
    io.sockets.in('room').emit('receiveMsg', message);
  });

  socket.on('disconnect', (data) => {
    const message = {
      msg: `${data.name} has disconnected`,
      name: 'server',
    };

    io.sockets.in('room').emit('receiveMsg', message);

    socket.leave('room');

    delete users[data.key];
  });

  socket.on('sendMsg', (data) => {
    const message = {
      msg: data.msg,
      name: data.name,
    };

    io.sockets.in('room').emit('receiveMsg', message);
  });

  socket.on('readied', (data) => {
    let usersReady = 0;

    if (users[data.key] === data) {
      users[data.key].name = data.name;
      users[data.key].ready = data.ready;
    }
    if (users[data.key].ready) {
      usersReady++;
      // Send Users an objective
      const objv = objectives[Math.floor((Math.random() * objectives.length))];
      const sendData = {
        user: users[data.key],
        objective: objv,
      };

      io.sockets.in('room').emit('receiveObjective', sendData);
    }

    if (usersReady === users.length && users.length >= 4) {
      io.sockets.in('room').emit('allReady', usersReady);
    }
  });
});
