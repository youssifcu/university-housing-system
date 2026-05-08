
const appJson = require('./app.json');

const extra = appJson.expo.extra || {};
const DEFAULT_AI_URL = 'https://aversion-clad-gag.ngrok-free.dev';
const DEFAULT_AI_MODEL = 'qwen2.5:7b';

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...extra,
      AI_ASSISTANT_URL:
        process.env.EXPO_PUBLIC_AI_ASSISTANT_URL?.trim() ||
        extra.AI_ASSISTANT_URL ||
        DEFAULT_AI_URL,
      AI_ASSISTANT_MODEL:
        process.env.EXPO_PUBLIC_AI_ASSISTANT_MODEL?.trim() ||
        extra.AI_ASSISTANT_MODEL ||
        DEFAULT_AI_MODEL,
    },
  },
};
