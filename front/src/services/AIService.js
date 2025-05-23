import axios from 'axios';

class AIService {
  constructor() {
    this.apiKey = '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';
    this.apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.model = 'anthropic/claude-3-haiku';
  }

  async getMotivationalResponse(messages) {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `You are a supportive, empathetic mindfulness coach and motivator. 
              Your goal is to help users stay motivated, overcome challenges, and maintain their mindfulness practice.
              Provide positive, encouraging responses that are concise (1-3 sentences) and actionable.
              Focus on mindfulness techniques, stress reduction, productivity tips, and positive psychology.
              Avoid generic platitudes - be specific and personalized in your advice.
              If the user seems distressed, emphasize self-compassion and small, manageable steps.
              Always maintain a warm, supportive tone.`
            },
            ...messages
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error in AI service:', error);
      throw error;
    }
  }
}

export default new AIService();