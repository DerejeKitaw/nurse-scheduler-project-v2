// src/utils/showInitialGreeting.ts

const greetings = [
  "👋 Hey there! I'm your Nurse Scheduling Assistant.",
  "🩺 Ready to plan your shifts?",
  "📅 Let’s build your perfect schedule!",
  "🤖 Need help with your availability or conflicts?",
  "👩‍⚕️ I’m here to make scheduling simple!"
];

export const showInitialGreeting = (): string => {
  const random = Math.floor(Math.random() * greetings.length);
  return `${greetings[random]}\n\nYou can ask me things like:
• “Schedule me for Monday morning 23”
• “What’s my availability?”
• “Am I double booked next week?”`;
};