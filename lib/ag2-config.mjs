export function hasOpenAiApiKey(env = process.env) {
  return typeof env.OPENAI_API_KEY === "string" && env.OPENAI_API_KEY.trim().length > 0;
}

export function missingOpenAiApiKeyMessage() {
  return "OpenAI API key is not configured for the AG2 agent.";
}