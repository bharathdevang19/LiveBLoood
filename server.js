const express = require('express');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const { pool } = require('./config/db'); // moved to top
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin:process.env.CLIENT_ORIGIN || '*', // Replace with your domain in production
    methods: ['GET', 'POST']
  }
});

// Passport config
require('./config/passport')(passport);

// View engine
app.set('view engine', 'ejs');

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

const sharedSession = require("express-socket.io-session");
const sessionMiddleware = session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
});

app.use(sessionMiddleware);
io.use(sharedSession(sessionMiddleware, {
  autoSave: true
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Global flash variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

// Routes
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/donor'));
app.use('/', require('./routes/dashboard'));
app.use('/chat', require('./routes/chat'));
app.use((req,res)=>{
  res.status(404).render('404');
})


// Socket.io handling
io.on('connection', socket => {
  socket.on('joinRoom', roomId => {
    socket.join(roomId);
  });

  socket.on('message', async ({ roomId, from, to, text }) => {
    const timestamp = Date.now();

    io.to(roomId).emit('message', { from, text, timestamp });

    try {
      await pool.query(
        'INSERT INTO messages (sender_id, receiver_id, message,created_at ) VALUES ($1, $2, $3, to_timestamp($4 / 1000.0))',
        [from, to, text, timestamp]
      );
    } catch (err) {
      console.error('Error saving chat:', err);
    }
  });

  // ✅ Add this block to track live donor location
  socket.on('locationUpdate', async ({latitude, longitude }) => {
    const session = socket.handshake.session;
    const userId = session?.passport?.user;
     console.log('LocationUpdate payload:', { userId, latitude, longitude }); // debugging
    if (!userId || isNaN(Number(userId)) || !latitude || !longitude) return;
    try {
       console.log("Received locationUpdate:", userId, latitude, longitude);
      await pool.query(
        'UPDATE donors SET latitude = $1, longitude = $2 WHERE user_id = $3',
        [latitude, longitude, Number(userId)]
      );
    } catch (err) {
      console.error('Error updating location:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});


// Listen
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
