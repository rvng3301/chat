const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));

const users = {};
const rooms = {}; // Об'єкт для зберігання інформації про кімнати

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  socket.on('new user', (data) => {
    const { username, room } = data;
    users[socket.id] = { username, room };
    socket.join(room); // Додаємо користувача до кімнати
    io.to(room).emit('user connected', username);
  });

  socket.on('send message', (data) => {
    const { message, recipient } = data;
    const sender = users[socket.id].username;
    const room = users[socket.id].room;
    const date = new Date();
    const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

    if (recipient) {
      // Send a private message
      const recipientSocket = Object.keys(users).find(id => users[id].username === recipient && users[id].room === room);
      if (recipientSocket) {
        io.to(recipientSocket).emit('private message', {
          sender,
          message,
          date: formattedDate,
        });
      }
    } else {
      // Send a public message
      io.to(room).emit('new message', {
        sender,
        message,
        date: formattedDate,
      });
    }
  });

  socket.on('disconnect', () => {
    const { username, room } = users[socket.id];
    delete users[socket.id];
    io.to(room).emit('user disconnected', username);
  });
});

http.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
