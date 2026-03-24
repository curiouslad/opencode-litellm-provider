import { tool, ToolDefinition } from '@opencode-ai/plugin';
import { fetchModels, LiteLLMModel } from './client';
import { addConfig, getConfigs, removeConfig } from './config';

const z = tool.schema;

/**
 * Creates the LiteLLM connection tool with access to the model cache.
 */
export const createConnectTool = (modelCache: Map<string, LiteLLMModel[]>): ToolDefinition => {
  return tool({
    description: 'Manage LiteLLM server connections',
    args: {
      action: z.enum(['add', 'list', 'remove']),
      alias: z.string().optional(),
      url: z.string().optional(),
      key: z.string().optional(),
    },
    async execute(args) {
      const action = args.action as string;
      const alias = args.alias as string | undefined;
      const url = args.url as string | undefined;
      const key = args.key as string | undefined;

      if (action === 'add') {
        if (!alias || !url || !key) {
          throw new Error('Missing required arguments for "add" action: alias, url, and key are required.');
        }
        
        // Test the connection by fetching models.
        const models = await fetchModels(url, key);
        
        // If successful, save the configuration.
        addConfig({ alias, url, key });
        
        // Update the cache so the config hook can use it immediately.
        modelCache.set(alias, models);
        
        return `Successfully connected to LiteLLM server "${alias}" with ${models.length} models available.`;
      }

      if (action === 'list') {
        const configs = getConfigs();
        
        if (configs.length === 0) {
          return 'No LiteLLM servers configured.';
        }
        
        const list = configs.map((c) => `- ${c.alias}: ${c.url}`).join('\n');
        return `Configured LiteLLM servers:\n${list}`;
      }

      if (action === 'remove') {
        if (!alias) {
          throw new Error('Missing required argument for "remove" action: alias is required.');
        }
        
        removeConfig(alias);
        modelCache.delete(alias); // Clear the cache for this alias.
        
        return `Successfully removed LiteLLM server "${alias}".`;
      }

      throw new Error(`Unsupported action: ${action}`);
    },
  });
};
