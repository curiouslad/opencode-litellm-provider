import { ModelData } from "./client";

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

export function clasify(model: ModelData) {
  const provider =
    model.model_info.litellm_provider ||
    model.litellm_params.custom_llm_provider;
  switch (provider) {
    case "anthropic":
      return { key: "anthropic", ...map.anthropic };
    case "openai":
      return { key: "openai", ...map.openai };
    default:
      return { key: "other", ...map.other };
  }
}
