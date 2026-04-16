export interface LiteLLMModel {
  id: string;
  name: string;
  contextWindow: number;
  maxOutputTokens: number;
  supportsVision: boolean;
  supportsToolCalls: boolean;
  supportsReasoning: boolean;
  litellmProvider: string | null;
  supportedParams: string[];
}

export type OpenCodeModel = {
  id: string;
  providerID: string;
  api: {
    id: string;
    url: string;
    npm: string;
  };
  name: string;
  capabilities: {
    temperature: boolean;
    reasoning: boolean;
    attachment: boolean;
    toolcall: boolean;
    input: {
      text: boolean;
      audio: boolean;
      image: boolean;
      video: boolean;
      pdf: boolean;
    };
    output: {
      text: boolean;
      audio: boolean;
      image: boolean;
      video: boolean;
      pdf: boolean;
    };
  };
  cost: {
    input: number;
    output: number;
    cache: {
      read: number;
      write: number;
    };
    experimentalOver200K?: {
      input: number;
      output: number;
      cache: {
        read: number;
        write: number;
      };
    };
  };
  limit: {
    context: number;
    output: number;
  };
  status: "alpha" | "beta" | "deprecated" | "active";
  options: {
    [key: string]: unknown;
  };
  headers: {
    [key: string]: string;
  };
};

export function normalizeUrl(url: string): string {
  let normalized = url.trim();
  if (normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  if (normalized.endsWith("/v1")) {
    normalized = normalized.slice(0, -3);
  }
  return normalized;
}

export type ModelData = {
  model_name: string;
  litellm_params: Record<string, unknown>;
  model_info: Record<string, unknown>;
};

/**
 * Fetches available models from the LiteLLM server via /v1/models,
 * then enriches with capability data from /model/info when available.
 */
export async function fetchModels(
  url: string,
  key: string,
): Promise<ModelData[]> {
  const baseUrl = normalizeUrl(url);
  const headers = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  const response = await fetch(`${baseUrl}/model/info`, {
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Failed to fetch models: ${response.status} ${response.statusText}`;
    console.log(errorMessage);
    throw new Error(errorMessage);
  }
  const infoData = await response.json();
  console.log(
    "Models fetched successfully",
    infoData?.data.map((m: ModelData) => m.model_name),
  );
  return infoData?.data || [];
}

function exposedID(m: ModelData): string {
  if (m.model_info.mode !== "responses") return m.model_info.id as string;
  if (!(m.model_info.id as string).includes("/"))
    return m.model_info.id as string;
  if (
    !["chatgpt", "openai"].includes(
      (m.model_info.litellm_provider as string) || "",
    )
  ) {
    return m.model_info.id as string;
  }
  return (m.model_info.id as string).split("/").slice(1).join("/");
}

export function resolveModelID(
  m: ModelData,
  models: Record<string, any>,
): string {
  const id = exposedID(m);
  if (id === (m.model_info.id as string)) return id;
  if (models[id]) return m.model_info.id as string;
  return id;
}

export function mapLitellmToOpenCodeModel(
  model: ModelData,
): Partial<OpenCodeModel> {
  const openAiParams =
    (model.model_info.supported_openai_params as string[]) ?? [];
  return {
    name: model.model_name,
    id: model.model_name as string,
    limit: {
      context:
        ((model.model_info.max_input_tokens ||
          model.model_info.max_tokens) as number) || 200000,
      output:
        ((model.model_info.max_output_tokens ||
          model.model_info.max_tokens) as number) || 128000,
    },
    capabilities: {
      temperature: true,
      reasoning:
        model.model_info.supports_reasoning === true ||
        openAiParams.includes("reasoning_effort"),
      input: {
        audio: false,
        text: true,
        image: false,
        pdf: false,
        video: false,
      },
      output: {
        audio: false,
        text: true,
        image: false,
        pdf: false,
        video: false,
      },
      attachment: false,
      toolcall:
        !!model.model_info.supports_function_calling ||
        openAiParams.includes("function_calling"),
    },
    // cost: {
    //   input: (model.litellm_params.input_cost_per_token ||
    //     model.model_info.input_cost_per_token) as number,
    //   output: (model.litellm_params.output_cost_per_token ||
    //     model.model_info.output_cost_per_token) as number,
    // },
    // options
    headers: {
      ...(model.litellm_params.extra_headers as object),
    },
  };
}
