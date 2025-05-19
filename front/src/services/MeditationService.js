import goalService from './GoalService';

class MeditationService {
  constructor() {
    this.baseUrl = 'http://localhost:5000/api/meditationSessions';  // Updated to match backend route
    this.progressUrl = 'http://localhost:5000/api/userMeditationProgress';
    this.medialurl = 'http://localhost:5000/content/';  // Add this for media URLs
    this.userId = null;
    this.completedIds = [];
    this.updateUserId();
  }

  updateUserId() {
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        this.userId = userId;
      } else {
        this.userId = null;
      }
    } catch (error) {
      console.error('Error getting userId from localStorage:', error);
      this.userId = null;
    }
  }

  async getMeditationSessions() {
    try {
      console.log('Fetching meditation sessions from:', this.baseUrl);
      const response = await fetch(this.baseUrl);
      
      if (!response.ok) {
        console.error(`Error response: ${response.status} ${response.statusText}`);
        throw new Error(`Error fetching meditation sessions: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched meditation sessions:', data);
      return data;
    } catch (error) {
      console.error('Error fetching meditation sessions:', error);
      throw error;
    }
  }

  async getMeditationSessionById(id) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      if (!response.ok) {
        throw new Error(`Error fetching meditation session: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching meditation session ${id}:`, error);
      throw error;
    }
  }

  async getuserneditationsession() {
    this.updateUserId();
    if (!this.userId) {
      return [];
    }

    try {
      console.log('Fetching user meditation progress from:', `${this.progressUrl}/user/${this.userId}`);
      const response = await fetch(`${this.progressUrl}/user/${this.userId}`);
      
      if (!response.ok) {
        console.error(`Error response: ${response.status} ${response.statusText}`);
        throw new Error(`Error fetching user meditation progress: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched user meditation progress:', data);
      
      // Extract session IDs from the progress data
      this.completedIds = data.map(item => item.sessionId);
      console.log('Completed session IDs:', this.completedIds);
      
      return data;
    } catch (error) {
      console.error('Error fetching user meditation progress:', error);
      return [];
    }
  }

  async markSessionComplete(sessionId, durationInSeconds = 300) {
    this.updateUserId();
    if (!this.userId) {
      throw new Error("No user ID available");
    }

    try {
      // Create a progress record for this session
      const progressData = {
        userId: this.userId,
        sessionId: sessionId,
        completionDate: new Date().toISOString(),
        duration: durationInSeconds
      };

      console.log('Marking session complete:', progressData);
      const response = await fetch(this.progressUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progressData),
      });

      if (!response.ok) {
        console.error(`Error response: ${response.status} ${response.statusText}`);
        throw new Error(`Error marking session complete: ${response.statusText}`);
      }

      // Update our local completedIds array
      if (!this.completedIds.includes(sessionId)) {
        this.completedIds.push(sessionId);
      }
      
      // Update meditation goals with the duration
      if (durationInSeconds > 0) {
        console.log(`Updating meditation goals with duration: ${durationInSeconds} seconds`);
        await goalService.updateGoalProgressForMeditation(durationInSeconds);
      }

      // Refresh the user's meditation progress
      await this.getuserneditationsession();
      
      return await response.json();
    } catch (error) {
      console.error('Error marking session complete:', error);
      throw error;
    }
  }
}

const meditationService = new MeditationService();
export default meditationService;








