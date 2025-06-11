// Mock for OpenAI
export class OpenAI {
  constructor(config) {
    this.config = config;
  }
  
  chat = {
    completions: {
      create: jest.fn(() => Promise.resolve({
        choices: [
          {
            message: {
              content: 'Mock OpenAI response'
            }
          }
        ]
      }))
    }
  };
}