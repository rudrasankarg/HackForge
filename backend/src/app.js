require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');

const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const hackathonRoutes = require('./routes/hackathons');
const projectRoutes = require('./routes/projects');
const evaluationRoutes = require('./routes/evaluations');
const assignmentRoutes = require('./routes/assignments');
const announcementRoutes = require('./routes/announcements');
const chatRoutes = require('./routes/chat');
const resultsRoutes = require('./routes/results');
const analyticsRoutes = require('./routes/analytics');
const registrationRoutes = require('./routes/registration');
const teamRoutes = require('./routes/teams');
const feedbackRoutes = require('./routes/feedback');
const appealRoutes = require('./routes/appeals');
const organizerRoutes = require('./routes/organizers');
const ticketRoutes = require('./routes/tickets');
const aiEvaluationRoutes = require('./routes/aiEvaluations');


const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:5000'];

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] },
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(mongoSanitize());
app.use(xssClean());
app.use(generalLimiter);

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, _res, next) => { req.io = io; next(); });

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hackathons', hackathonRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', analyticsRoutes);
app.use('/api/registration', registrationRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/appeals', appealRoutes);
app.use('/api/organizers', organizerRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/ai-evaluation', aiEvaluationRoutes);


app.get('/api/health', (_req, res) => res.json({ status: 'ok', version: '2.0.0', timestamp: new Date() }));

// SPA fallback for react router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error-handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors).map(val => val.message).join(', ') });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid identifier format: ${err.path}` });
  }
  res.status(err.status || 500).json({ message: err.message || 'An unexpected error occurred. Please try again.' });
});



const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Team = require('./models/Team');

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication required'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return next(new Error('User not found'));
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  socket.on('join-room', (room) => {
    if (room === 'general') {
      socket.join(room);
    } else if (room === 'admin-alerts') {
      if (socket.user && socket.user.role === 'admin') {
        socket.join(room);
      }
    } else if (room.startsWith('team-')) {
      const teamId = room.replace('team-', '');
      if (socket.user) {
        Team.findOne({ _id: teamId, members: socket.user._id }).then((teamObj) => {
          if (teamObj) socket.join(room);
        }).catch(() => {});
      }
    } else if (room.startsWith('chatbot-')) {
      const userId = room.replace('chatbot-', '');
      if (socket.user && socket.user._id.toString() === userId) {
        socket.join(room);
      }
    } else if (room === 'instructions') {
      if (socket.user && (socket.user.role === 'admin' || socket.user.role === 'reviewer')) {
        socket.join(room);
      }
    }
  });
  socket.on('chat-message', (data) => {
    const room = data.room;
    if (room === 'general') {
      io.to(room).emit('chat-message', data);
    } else if (room === 'instructions') {
      if (socket.user && (socket.user.role === 'admin' || socket.user.role === 'reviewer')) {
        io.to(room).emit('chat-message', data);
      }
    } else if (room.startsWith('team-')) {
      const teamId = room.replace('team-', '');
      if (socket.user) {
        Team.findOne({ _id: teamId, members: socket.user._id }).then((teamObj) => {
          if (teamObj) io.to(room).emit('chat-message', data);
        }).catch(() => {});
      }
    } else if (room.startsWith('chatbot-')) {
      const userId = room.replace('chatbot-', '');
      if (socket.user && socket.user._id.toString() === userId) {
        io.to(room).emit('chat-message', data);
      }
    }
  });
  socket.on('disconnect', () => {});
});

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hackforge';

mongoose.connect(MONGO_URI).then(() => {
  console.log('MongoDB connected');
  server.listen(process.env.PORT || 5000, () =>
    console.log(`HackForge API running on port ${process.env.PORT || 5000}`)
  );
}).catch((err) => { console.error('DB connection failed', err); process.exit(1); });
