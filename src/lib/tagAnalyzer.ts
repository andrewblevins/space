export default class TagAnalyzer {
  async analyzeTags(content: string): Promise<string[]> {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: "Extract 1-3 main topic tags from this message. Respond with only a JSON array of lowercase, single-word tags. Example: ['meditation', 'consciousness', 'growth']"
      }, {
        role: "user",
        content
      }],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.tags || [];
  }
} 