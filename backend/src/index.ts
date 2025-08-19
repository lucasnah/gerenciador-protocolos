import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import authRoutes from './routes/auth';
import protocolRoutes from './routes/protocols';

// Validate essential environment variables on startup
if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in the .env file.");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("FATAL ERROR: DATABASE_URL is not defined in the .env file.");
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // In production, restrict this to your frontend's URL
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.API_PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Protocol routes - protected by middleware
app.use('/api/protocols', protocolRoutes);

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  // Placeholder for protocol events
  socket.on('protocol:updateData', (data) => {
    console.log('Received protocol data update:', data);
    // Here you would save the data to the DB and broadcast to other clients
    socket.broadcast.emit('protocol:dataUpdated', data);
  });
});

server.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
