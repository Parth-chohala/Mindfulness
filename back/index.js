const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectToDB = require('./db');
const focusTimerRoutes = require('./routes/focustimerRoutes');
const breaksRoutes = require('./routes/breaksRouter');
const productivityStatusRoutes = require('./routes/productivitystatusRoutes');
const meditationSessionRoutes = require('./routes/meditationsessionRoutes');
const userMeditationProgressRoutes = require('./routes/usermeditationprogressRoutes');
const achievements = require('./routes/achievementsRoutes');
const task = require('./routes/taskRoutes');
const admin = require('./routes/adminRoutes');
// const user = require('./routes/userRoutes');
const user = require('./routes/userRoutes');
const goal = require('./routes/goalRoutes');

dotenv.config();
connectToDB();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', admin);
app.use('/api', user);
app.use('/api/task', task);
app.use('/api', focusTimerRoutes);
app.use('/api', breaksRoutes);
app.use('/api', productivityStatusRoutes);
app.use('/api', meditationSessionRoutes);  // This should register the meditation routes
app.use('/api', userMeditationProgressRoutes);
app.use('/api', achievements);
app.use('/api', goal);
app.use('/content', express.static('collection')); // Serve static files from the 'content' directory
// app.use('/api/auth', require('./routes/authRoutes'));

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Initialize database connection
    await connectToDB();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
