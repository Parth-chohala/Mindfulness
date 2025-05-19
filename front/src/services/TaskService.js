import goalService from './GoalService';

// Task service for API interactions
class TaskService {
  constructor() {
    // Update the baseUrl to match the backend route structure
    this.baseUrl = 'http://localhost:5000/api/task';
    this.userId = null;
    this.updateUserId();
  }

  // Update user ID from localStorage
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

  // Get all tasks for the current user
  async getTasks() {
    // Update user ID before making the request
    this.updateUserId();
    
    if (!this.userId) {
      throw new Error('User not logged in');
    }

    try {
      const response = await fetch(`${this.baseUrl}/${this.userId}`);
      if (!response.ok) {
        throw new Error(`Error fetching tasks: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }

  // Get a specific task by ID
  async getTaskById(taskId) {
    try {
      const response = await fetch(`${this.baseUrl}/task/${taskId}`);
      if (!response.ok) {
        throw new Error(`Error fetching task: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching task ${taskId}:`, error);
      throw error;
    }
  }

  // Create a new task
  async createTask(taskData) {
    // Update user ID before making the request
    this.updateUserId();
    
    if (!this.userId) {
      throw new Error('User not logged in');
    }

    // Format the task data
    const task = {
      userId: this.userId,
      ...taskData,
      deadline: taskData.deadline ? new Date(taskData.deadline).toISOString() : new Date().toISOString()
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(task)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error creating task: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const responseText = await response.text();
      return responseText ? JSON.parse(responseText) : { success: true };
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  // Update an existing task
  async updateTask(taskId, taskData) {
    try {
      // Format the deadline if it exists
      const formattedData = { ...taskData };
      if (formattedData.deadline) {
        formattedData.deadline = new Date(formattedData.deadline).toISOString();
      }

      const response = await fetch(`${this.baseUrl}/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formattedData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error updating task: ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error updating task ${taskId}:`, error);
      throw error;
    }
  }

  // Delete a task
  async deleteTask(taskId) {
    try {
      const response = await fetch(`${this.baseUrl}/${taskId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Error deleting task: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error deleting task ${taskId}:`, error);
      throw error;
    }
  }

  // Mark a task as completed or not completed
  async toggleTaskCompletion(taskId, completed) {
    try {
      const task = await this.getTaskById(taskId);
      
      const updateData = {
        completed,
        completedAt: completed ? new Date().toISOString() : null
      };

      const result = await this.updateTask(taskId, updateData);
      
      // Update related goals based on completion status
      if (completed) {
        // If task is marked as completed, increment goal progress
        await goalService.updateGoalProgressForTask(task.category, 1);
      } else {
        // If task is unmarked (unchecked), decrement goal progress
        await goalService.updateGoalProgressForTask(task.category, -1);
      }
      
      return result;
    } catch (error) {
      console.error(`Error toggling completion for task ${taskId}:`, error);
      throw error;
    }
  }
}

// Create a singleton instance
const taskService = new TaskService();

export default taskService;













