class GoalService {
  constructor() {
    this.baseUrl = "http://localhost:5000/api/goal";
    this.userId = null;
    this.updateUserId();
  }

  updateUserId() {
    try {
      const userId = localStorage.getItem("userId");
      if (userId) {
        this.userId = userId;
      } else {
        this.userId = null;
        console.log("No user found in localStorage");
      }
    } catch (error) {
      console.error("Error getting userId from localStorage:", error);
      this.userId = null;
    }
  }

  async getAllGoals() {
    this.updateUserId();

    try {
      if (!this.userId) {
        console.warn("No user ID available, returning empty goals array");
        return [];
      }

      // Update to fetch goals by userId
      const response = await fetch(`${this.baseUrl}/${this.userId}`);
      if (!response.ok) {
        throw new Error(`Error fetching goals: ${response.statusText}`);
      }
      const data = await response.json();
      // Ensure we always return an array
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching goals:", error);
      // Return empty array on error instead of throwing
      return [];
    }
  }

  async getGoalById(id) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      if (!response.ok) {
        throw new Error(`Error fetching goal: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching goal ${id}:`, error);
      throw error;
    }
  }

  async createGoal(goalData) {
    this.updateUserId();

    if (!this.userId) {
      throw new Error("No user ID available");
    }

    // Prepare the data for the API
    const apiData = {
      userId: this.userId,
      title: goalData.title,
      description: goalData.description,
      goalType: goalData.category, // Map category to goalType
      targetValue: goalData.targetValue || parseInt(goalData.aim, 10), // Use targetValue if provided, otherwise convert aim
      progressValue: 0, // Start with 0 progress
      status: "active",
    };

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiData),
    });

    if (!response.ok) {
      throw new Error(`Error creating goal: ${response.statusText}`);
    }

    return response.json();
  }

  async updateGoal(goalId, goalData) {
    this.updateUserId();

    if (!this.userId) {
      throw new Error("No user ID available");
    }

    // Get the current goal to check its status
    const currentGoal = await this.getGoalById(goalId);

    // Prepare the data for the API
    const apiData = {
      title: goalData.title,
      description: goalData.description,
      goalType: goalData.category, // Map category to goalType
      targetValue: goalData.targetValue || parseInt(goalData.aim, 10), // Use targetValue if provided, otherwise convert aim
    };

    // If the current progress exceeds the new target, cap it and mark as completed
    if (currentGoal.progressValue >= apiData.targetValue) {
      apiData.progressValue = apiData.targetValue;
      apiData.status = "completed";
    } else if (
      currentGoal.status === "completed" &&
      currentGoal.progressValue < apiData.targetValue
    ) {
      // If goal was completed but target is now higher than progress, mark as active
      apiData.status = "active";
    }

    const response = await fetch(`${this.baseUrl}/${goalId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiData),
    });

    if (!response.ok) {
      throw new Error(`Error updating goal: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteGoal(id) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Error deleting goal: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error deleting goal ${id}:`, error);
      throw error;
    }
  }

  // Add method to update goal progress based on task completion
  async updateGoalProgressForTask(taskCategory, val) {
    try {
      // Get all goals of type "task"
      const goals = await this.getAllGoals();
      let taskGoals;
      val
        ? (taskGoals = goals.filter(
            (goal) => goal.goalType === "task" && goal.status !== "completed"
          ))
        : (taskGoals = goals.filter((goal) => goal.goalType === "task"));

      // For each relevant goal, increment progress
      for (const goal of taskGoals) {
        this.updateGoalProgress(goal._id, goal.progressValue + val);
      }
    } catch (error) {
      console.error("Error updating goal progress for task:", error);
    }
  }

  // Add method to update goal progress for time
  async updateGoalProgressForTime(durationInSeconds) {
    try {
      // Get all goals of type "time"
      const goals = await this.getAllGoals();
      const timeGoals = goals.filter(
        (goal) => goal.goalType === "time" && goal.status !== "completed"
      );

      // Skip if no active time goals
      if (timeGoals.length === 0) {
        return;
      }

      // For each relevant goal, add the focus duration to progress
      for (const goal of timeGoals) {
        await this.updateGoalProgress(
          goal._id,
          goal.progressValue + durationInSeconds
        );
      }
    } catch (error) {
      console.error("Error updating goal progress for time:", error);
    }
  }

  // Add method to update goal progress for meditation
  async updateGoalProgressForMeditation(durationInSeconds) {
    try {
      // Get all goals of type "meditation"
      const goals = await this.getAllGoals();
      const meditationGoals = goals.filter(
        (goal) => goal.goalType === "meditation" && goal.status !== "completed"
      );

      // Skip if no active meditation goals
      if (meditationGoals.length === 0) {
        return;
      }

      // For each relevant goal, update progress
      for (const goal of meditationGoals) {
        // Current progress in seconds
        const currentProgress = goal.progressValue;
        
        // Add new duration to progress
        const newProgress = currentProgress + durationInSeconds;
        
        // Cap at target value if needed
        const targetValue = goal.targetValue;
        const cappedProgress = Math.min(newProgress, targetValue);
        
        // Update the goal with new progress value
        await this.updateGoalProgress(goal._id, cappedProgress);
      }
    } catch (error) {
      console.error("Error updating goal progress for meditation:", error);
    }
  }

  // Simple method to update goal progress
  async updateGoalProgress(id, newProgress) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ progressValue: newProgress }),
      });
      
      if (!response.ok) {
        throw new Error(`Error updating goal progress: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error updating goal progress for ${id}:`, error);
      throw error;
    }
  }
}

export default new GoalService();





