# opencode-litellm-plugin

OpenCode plugin that connects to [LiteLLM](https://docs.litellm.ai/) proxy servers. Auto-discovers models, capabilities, and reasoning variants.

## Install

```bash
npm install opencode-litellm-plugin
```

Or build from source:

```bash
npm run build
npm run deploy  # copies to ~/.config/opencode/plugins/
```

## Usage

Add to your `opencode.json`:

```json
{
  "plugin": ["opencode-litellm-plugin"]
}
```

Then connect via the auth flow in OpenCode.
```

## LiteLLM server permissions

The plugin calls `/model/info` to detect model capabilities (vision, tool calls, reasoning variants). If your API key is a **virtual key**, it must be allowed to access info routes — otherwise all models default to conservative capabilities with no reasoning variants.

In your LiteLLM proxy config, ensure the key has access to `info_routes`:

```yaml
general_settings:
  allowed_routes: ["llm_api_routes", "info_routes"]
```

## License

MIT — Dan Jeffries
