import { Plugin, PluginInput } from "@opencode-ai/plugin";
import { getConfigs, addConfig, removeConfig, LiteLLMConfig } from "./config";
import {
  fetchModels,
  normalizeUrl,
  LiteLLMModel,
  mapLitellmToOpenCodeModel,
  resolveModelID,
} from "./client";
import { createConnectTool } from "./tools";
import { clasify } from "./clasify";

// Provider-specific reasoning effort levels
const REASONING_VARIANTS: Record<string, Record<string, any>> = {
  openai: {
    off: { reasoningEffort: "off" },
    low: { reasoningEffort: "low" },
    medium: { reasoningEffort: "medium" },
    high: { reasoningEffort: "high" },
    xhigh: { reasoningEffort: "xhigh" },
  },
  chatgpt: {
    off: { reasoningEffort: "off" },
    low: { reasoningEffort: "low" },
    medium: { reasoningEffort: "medium" },
    high: { reasoningEffort: "high" },
    xhigh: { reasoningEffort: "xhigh" },
  },
  gemini: {
    off: { reasoningEffort: "off" },
    low: { reasoningEffort: "low" },
    medium: { reasoningEffort: "medium" },
    high: { reasoningEffort: "high" },
  },
  anthropic: {
    off: { reasoningEffort: "off" },
    low: { reasoningEffort: "low" },
    medium: { reasoningEffort: "medium" },
    high: { reasoningEffort: "high" },
  },
  deepseek: {
    off: { reasoningEffort: "off" },
    low: { reasoningEffort: "low" },
    medium: { reasoningEffort: "medium" },
    high: { reasoningEffort: "high" },
  },
};

const DEFAULT_REASONING_VARIANTS: Record<string, any> = {
  low: { reasoningEffort: "low" },
  medium: { reasoningEffort: "medium" },
  high: { reasoningEffort: "high" },
};

function getReasoningVariants(m: LiteLLMModel): Record<string, any> {
  if (m.litellmProvider && REASONING_VARIANTS[m.litellmProvider]) {
    return REASONING_VARIANTS[m.litellmProvider];
  }
  return DEFAULT_REASONING_VARIANTS;
}

/**
 * OpenCode LiteLLM provider plugin entry point.
 */
export const litellmPlugin: Plugin = async (ctx: PluginInput) => {
  // Cache for fetched models to avoid redundant API calls
  const modelCache = new Map<string, LiteLLMModel[]>();

  return {
    /**
     * Config hook — dynamically registers providers and models from all
     * configured LiteLLM servers.
     */
    config: async (config) => {
      if (!config.provider) config.provider = {};

      const serverConfigs = getConfigs();

      for (const sc of serverConfigs) {
        const providerID = `litellm`;
        const baseUrl = normalizeUrl(sc.url);
        // const aliases: Record<string, string> = {};

        // Fetch models if not cached
        let models = await fetchModels(sc.url, sc.key);

        if (models.length > 0) {
          for (const m of models) {
            // const id = resolveModelID(m, config.provider[providerID].models!);
            // if (id !== (m.model_info.id as string))
            //   aliases[id] = m.model_info.id as string;
            const overrides = clasify(m);
            if (!config.provider[`${providerID}-${overrides.key}`]) {
              config.provider[`${providerID}-${overrides.key}`] = {
                id: `${providerID}-${overrides.key}`,
                name: `${overrides.displayName})`,
                npm: overrides.npm,
                options: {
                  baseURL: `${baseUrl}/${overrides.baseURLSuffix}`,
                  apiKey: sc.key,
                  litellmProxy: true,
                },
                models: {},
              };
            }
            try {
              const modelConfig = mapLitellmToOpenCodeModel(m);

              // if (m.supportsReasoning) {
              //   modelConfig.variants = getReasoningVariants(m);
              // }

              // @ts-ignore
              config.provider[`${providerID}-${overrides.key}`].models[
                modelConfig.id!
              ] = modelConfig;
            } catch (e) {
              console.error(e);
            }
          }
        }
      }
    },

    /**
     * Auth hook — handles initial provider setup and credential verification.
     * Management (list, remove) lives in the litellm:connect tool.
     */
    auth: {
      provider: "litellm",
      methods: [
        {
          type: "api" as const,
          label: "Connect to LiteLLM",
          prompts: [
            {
              type: "text" as const,
              key: "alias",
              message: "Alias for this server (e.g. 'work', 'staging')",
              placeholder: "my-server",
              validate(value: string) {
                if (!value || value.trim().length === 0)
                  return "Alias is required";
                if (!/^[a-zA-Z0-9_-]+$/.test(value.trim()))
                  return "Alias must be alphanumeric (hyphens and underscores allowed)";
                return undefined;
              },
            },
            {
              type: "text" as const,
              key: "url",
              message: "LiteLLM base URL",
              placeholder: "https://litellm.example.com",
              validate(value: string) {
                if (!value || value.trim().length === 0)
                  return "URL is required";
                try {
                  new URL(value.trim());
                } catch {
                  return "Must be a valid URL (e.g. https://litellm.example.com)";
                }
                return undefined;
              },
            },
            {
              type: "text" as const,
              key: "apiKey",
              message: "API key",
              placeholder: "sk-...",
              validate(value: string) {
                if (!value || value.trim().length === 0)
                  return "API key is required";
                return undefined;
              },
            },
          ],
          async authorize(inputs?: Record<string, string>) {
            const alias = inputs?.alias?.trim();
            const url = inputs?.url?.trim();
            const apiKey = inputs?.apiKey?.trim();

            if (!alias || !url || !apiKey) {
              return { type: "failed" as const };
            }

            try {
              const models = await fetchModels(url, apiKey);
              // Persist to our config and cache
              modelCache.set(alias, models);
              addConfig({ alias, url, key: apiKey });

              return {
                type: "success" as const,
                key: apiKey,
                provider: `litellm-${alias}`,
              };
            } catch (error: any) {
              console.error(
                `[litellm] Verification failed for ${alias}:`,
                error.message,
              );
              return { type: "failed" as const };
            }
          },
        },
      ],
    },
    // event: (e) => {
    //   // console.log("[litellm] Event:", e);
    // },

    /**
     * Register management tools.
     */
    tool: {
      litellm_connect: createConnectTool(modelCache),
    },
  };
};
