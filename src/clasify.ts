// config.provider[providerID] = {
//           id: providerID,
//           name: `LiteLLM (${sc.alias})`,
//           npm: "@ai-sdk/openai",
//           api: "openai",
//           options: {
//             baseURL: `${baseUrl}/v1`,
//             apiKey: sc.key,
//           },
//           models: {},

import { LiteLLMModel } from "./client";

const map = {
  anthropic: {
    npm: "@ai-sdk/anthropic",
    displayName: "LiteLLM (Anthropic)",
    baseURLSuffix: "v1",
  },
  openai: {
    npm: "@ai-sdk/openai",
    displayName: "LiteLLM (OpenAI)",
    baseURLSuffix: "v1",
  },
  other: {
    npm: "@ai-sdk/openai-compatible",
    displayName: "LiteLLM (Other)",
    baseURLSuffix: "v1",
  },
};

export function clasify(model: LiteLLMModel) {
  switch (model.litellmProvider) {
    case "anthropic":
      return { key: "anthropic", ...map.anthropic };
    case "openai":
      return { key: "openai", ...map.openai };
    default:
      return { key: "other", ...map.other };
  }
}
