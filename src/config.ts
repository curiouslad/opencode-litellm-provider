import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface LiteLLMConfig {
  alias: string;
  url: string;
  key: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.config', 'opencode');
const CONFIG_FILE = path.join(CONFIG_DIR, 'auth.json');

function ensureConfigExists(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ litellm: [] }, null, 2));
  } else {
    try {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const json = JSON.parse(data);
      if (!json.litellm) {
        json.litellm = [];
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(json, null, 2));
      }
    } catch (error) {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify({ litellm: [] }, null, 2));
    }
  }
}

export function getConfigs(): LiteLLMConfig[] {
  ensureConfigExists();
  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const json = JSON.parse(data);
    return json.litellm || [];
  } catch (error) {
    return [];
  }
}

export function addConfig(config: LiteLLMConfig): void {
  ensureConfigExists();
  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const json = JSON.parse(data);
    const configs: LiteLLMConfig[] = json.litellm || [];

    const index = configs.findIndex((c) => c.alias === config.alias);
    if (index !== -1) {
      configs[index] = config;
    } else {
      configs.push(config);
    }

    json.litellm = configs;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(json, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error adding configuration:', error);
  }
}

export function removeConfig(alias: string): void {
  ensureConfigExists();
  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const json = JSON.parse(data);
    const configs: LiteLLMConfig[] = json.litellm || [];

    const filteredConfigs = configs.filter((c) => c.alias !== alias);

    json.litellm = filteredConfigs;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(json, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error removing configuration:', error);
  }
}
