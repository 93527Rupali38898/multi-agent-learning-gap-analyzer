const axios = require('axios');

function initializeMobileLensSocket(io) {
  const lensNamespace = io.of('/lens');

  lensNamespace.on('connection', (socket) => {
    console.log('📱 Mobile Lens connected:', socket.id);

    // Join room based on sessionId
    socket.on('join-session', (sessionId) => {
      socket.join(sessionId);
      console.log(`📱 Joined session: ${sessionId}`);
      
      // Notify desktop that mobile is connected
      socket.to(sessionId).emit('mobile-connected', { sessionId });
    });

    // Handle video frames from mobile
    socket.on('video-frame', async (data) => {
      const { sessionId, frame, timestamp } = data;

      try {
        // Send frame to Python AI Engine for vision analysis
        const response = await axios.post(
          `${process.env.PYTHON_API_URL || 'http://localhost:8000'}/analyze-vision`,
          { frame, timestamp },
          { timeout: 5000 }
        );

        // Send analysis back to desktop in the same session
        lensNamespace.to(sessionId).emit('vision-analysis', {
          timestamp,
          analysis: response.data.analysis,
          detectedText: response.data.detectedText,
          suggestions: response.data.suggestions
        });
      } catch (error) {
        console.error('Vision analysis error:', error.message);
        lensNamespace.to(sessionId).emit('vision-error', { 
          error: 'Failed to analyze frame' 
        });
      }
    });

    // Handle audio from mobile
    socket.on('audio-data', async (data) => {
      const { sessionId, audio, timestamp } = data;

      try {
        // Send audio to Python AI Engine
        const response = await axios.post(
          `${process.env.PYTHON_API_URL || 'http://localhost:8000'}/analyze-audio`,
          { audio, timestamp },
          { timeout: 5000 }
        );

        lensNamespace.to(sessionId).emit('audio-analysis', {
          timestamp,
          transcription: response.data.transcription,
          response: response.data.aiResponse
        });
      } catch (error) {
        console.error('Audio analysis error:', error.message);
      }
    });

    socket.on('leave-session', (sessionId) => {
      socket.leave(sessionId);
      socket.to(sessionId).emit('mobile-disconnected', { sessionId });
    });

    socket.on('disconnect', () => {
      console.log('📱 Mobile Lens disconnected:', socket.id);
    });
  });
}

module.exports = { initializeMobileLensSocket };
