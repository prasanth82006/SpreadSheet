import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { connectDB } from './config/db';
import Document from './models/Document';
import authRoutes from './routes/auth';
import { protect } from './middleware/auth';

// Connect to Database
connectDB();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Auth Routes
app.use('/api/auth', authRoutes);

// Document Routes
app.get('/api/documents', protect, async (req, res) => {
  try {
    const docs = await Document.find({}).sort({ updatedAt: -1 });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching documents' });
  }
});

app.post('/api/documents', protect, async (req, res) => {
  try {
    const doc = await Document.create({ 
      title: req.body.title || 'Untitled Spreadsheet',
      owner: (req as any).user?._id
    });
    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ message: 'Error creating document' });
  }
});

app.get('/api/documents/:id', protect, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching document' });
  }
});

app.get('/', (req, res) => {
    res.send('Server is Live!');
});


// In-memory room tracking: docId -> { socketId -> user }
const rooms: Record<string, Record<string, any>> = {};

// Socket logic with persistence
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-document', async ({ docId, user }) => {
    socket.join(docId);
    
    // Track user presence
    if (!rooms[docId]) rooms[docId] = {};
    rooms[docId][socket.id] = user;
    
    console.log(`User ${user.name} (${socket.id}) joined ${docId}`);
    
    // Broadcast updated user list to everyone in the room
    io.to(docId).emit('user-list-update', rooms[docId]);
  });

  socket.on('cell-change', async ({ docId, cellId, value }) => {
    try {
      // Find document and update the data Map
      const doc = await Document.findById(docId);
      if (doc) {
        doc.data.set(cellId, value);
        await doc.save();
        socket.to(docId).emit('document-update', { [cellId]: value });
      }
    } catch (error) {
      console.error('Error saving cell change:', error);
    }
  });

  socket.on('title-change', async ({ docId, title }) => {
    try {
      const doc = await Document.findById(docId);
      if (doc) {
        doc.title = title;
        await doc.save();
        socket.to(docId).emit('title-update', title);
      }
    } catch (error) {
      console.error('Error saving title change:', error);
    }
  });

  socket.on('format-change', async ({ docId, cellId, format }) => {
    try {
      const doc = await Document.findById(docId);
      if (doc) {
        const currentFormat = doc.formatting.get(cellId) || {};
        const newFormat = { ...currentFormat, ...format };
        doc.formatting.set(cellId, newFormat);
        await doc.save();
        socket.to(docId).emit('format-update', { [cellId]: newFormat });
      }
    } catch (error) {
      console.error('Error saving format change:', error);
    }
  });

  socket.on('column-resize', async ({ docId, colIndex, width }) => {
    try {
      const doc = await Document.findById(docId);
      if (doc) {
        doc.columnWidths.set(colIndex.toString(), width);
        await doc.save();
        socket.to(docId).emit('column-resize-update', { colIndex, width });
      }
    } catch (error) {
      console.error('Error saving column resize:', error);
    }
  });

  socket.on('row-resize', async ({ docId, rowIndex, height }) => {
    try {
      const doc = await Document.findById(docId);
      if (doc) {
        doc.rowHeights.set(rowIndex.toString(), height);
        await doc.save();
        socket.to(docId).emit('row-resize-update', { rowIndex, height });
      }
    } catch (error) {
      console.error('Error saving row resize:', error);
    }
  });

  socket.on('column-reorder', async ({ docId, order }) => {
    try {
      const doc = await Document.findById(docId);
      if (doc) {
        doc.columnOrder = order;
        await doc.save();
        socket.to(docId).emit('column-reorder-update', order);
      }
    } catch (error) {
      console.error('Error saving column reorder:', error);
    }
  });

  socket.on('row-reorder', async ({ docId, order }) => {
    try {
      const doc = await Document.findById(docId);
      if (doc) {
        doc.rowOrder = order;
        await doc.save();
        socket.to(docId).emit('row-reorder-update', order);
      }
    } catch (error) {
      console.error('Error saving row reorder:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Remove user from all rooms they were in
    Object.keys(rooms).forEach(docId => {
      if (rooms[docId] && rooms[docId][socket.id]) {
        delete rooms[docId][socket.id];
        // If room is empty, optionally delete it
        if (Object.keys(rooms[docId]).length === 0) {
          delete rooms[docId];
        } else {
          // Broadcast updated list
          io.to(docId).emit('user-list-update', rooms[docId]);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));
