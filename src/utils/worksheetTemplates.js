// Template questions and worksheet structures for Terminal worksheets.

export const worksheetQuestions = [
  { id: 'life_areas', question: "Name up to three areas of your life and how you would like to work on them. (Example: Career - I want to start an interior design practice; Physical Health - I'd like to do a handstand; Personal - I'd like to create a warm and inviting home environment)." },
  { id: 'inspiring_people', question: "Name up to three real people, living or dead, who you find inspiring. What do you admire about each of them?" },
  { id: 'fictional_characters', question: "Name up to three fictional characters you resonate with, and say what feels notable about each of them." },
  { id: 'viewquake_books', question: "Name up to three \"viewquake books\" that have helped shape your worldview." },
  { id: 'wisdom_traditions', question: "Name any philosophical or wisdom traditions that you practice or are interested in." },
  { id: 'aspirational_words', question: "Say three words about the type of person that you are interested in becoming or find inspiring." }
];

// Predefined worksheet templates used when creating new worksheets.
export const WORKSHEET_TEMPLATES = {
  'advisor-basic': {
    id: 'advisor-basic',
    type: 'basic',
    name: 'AI Advisor Board Worksheet (Basic)',
    description: 'A simple worksheet to help configure your AI advisory board',
    questions: worksheetQuestions,
  },
  'advisor-detailed': {
    id: 'advisor-detailed',
    type: 'detailed',
    name: 'AI Advisor Board Worksheet (Detailed)',
    description: 'An in-depth worksheet to help configure your AI advisory board',
    sections: [
      {
        name: 'Biography',
        questions: [
          { id: 'age_gender', question: 'What is your current age and gender?' },
          { id: 'origin', question: 'Where are you from?' },
          { id: 'location', question: 'Where do you live now, and how do you feel about it? Where else have you lived?' },
          { id: 'occupation', question: 'What is your current occupation, and how do you feel about it? What else have you done for work?' },
          { id: 'education', question: 'What has your education looked like?' },
        ],
      },
      {
        name: 'People',
        questions: [
          { id: 'family', question: 'Describe the basic shape of your family and how you tend to relate to them.' },
          { id: 'social_circles', question: 'Describe your current social circle(s). Who do you spend most of your time with?' },
          { id: 'energizing_people', question: 'Who are the people who energize you the most? Why?' },
          { id: 'desired_relationships', question: 'Which relationships would you like to develop or strengthen?' },
          { id: 'mentors', question: 'Who are your mentors or role models in your immediate life?' },
          { id: 'social_contexts', question: 'In what social contexts do you feel most alive?' },
        ],
      },
      {
        name: 'Values & Preferences',
        questions: [
          { id: 'delights', question: 'Name an aspect of the world—a thing, a place, an experience—that consistently delights you.' },
          { id: 'beauty', question: 'What do you find beautiful?' },
          { id: 'philosophies', question: 'Are there any traditions or philosophies that really click with how you approach life?' },
          { id: 'differences', question: "What's something other people do, that you never do?" },
        ],
      },
      {
        name: 'Inspiration',
        questions: [
          { id: 'inspiring_people', question: 'Name three real people, living or dead, who you find inspiring. What do you admire about each of them?' },
          { id: 'fictional_characters', question: 'Name three fictional characters you resonate with, and say what feels notable about each of them.' },
          { id: 'archetypes', question: 'What archetypal figures (e.g., The Sage, The Creator, The Explorer) do you most identify with? Why?' },
          { id: 'influences', question: 'What books, articles, talks, or works of art have significantly influenced your worldview?' },
        ],
      },
      {
        name: 'Personality',
        questions: [
          { id: 'frameworks', question: 'What personality frameworks (e.g. Myers-Briggs, Enneagram) have you found helpful in understanding yourself?' },
          { id: 'types', question: 'What type(s) do you identify with in those frameworks and why?' },
          { id: 'animal', question: 'What kind of animal do you most feel like / would you like to be?' },
          { id: 'descriptions', question: 'What descriptions of you from friends and family have struck a chord?' },
        ],
      },
      {
        name: 'Direction',
        questions: [
          { id: 'future_self', question: 'Who do you want to become in the next 5-10 years?' },
          { id: 'desired_qualities', question: 'What skills or qualities would you like to develop?' },
          { id: 'wildly_good', question: 'What would be a wildly good outcome of an advisor conversation for you?' },
        ],
      },
      {
        name: 'Reflection Notes',
        questions: [
          { id: 'additional_thoughts', question: 'Use this space to capture any additional thoughts, patterns, or insights that emerged while completing this worksheet:' },
        ],
      },
    ],
  },
};

export default WORKSHEET_TEMPLATES;
