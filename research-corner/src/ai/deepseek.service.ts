import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

// Custom interfaces for DeepSeek API types
interface DeepseekMessageContent {
  reasoning_content?: string;
}

type DeepseekMessage = OpenAI.ChatCompletionMessageParam & DeepseekMessageContent;

interface DeepseekChoice {
  message: OpenAI.ChatCompletionMessage & DeepseekMessageContent;
  index: number;
  finish_reason: string;
  logprobs: null; // Required by OpenAI.Choice but not used by DeepSeek
}

interface DeepseekChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: DeepseekChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface DeepseekParameters {
  temperature?: number;
  top_p?: number;
  top_k?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  repetition_penalty?: number;
  min_p?: number;
  top_a?: number;
}

@Injectable()
export class DeepseekService {
  private readonly client: OpenAI;
  private readonly defaultParameters: DeepseekParameters = {
    temperature: 0.7,
    top_p: 0.95,
    frequency_penalty: 0,
    presence_penalty: 0
  };

  constructor(private configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.get('DEEPSEEK_API_KEY'),
      baseURL: 'https://api.deepseek.com/v1',
    });
  }

  async createChatCompletion(
    messages: Array<DeepseekMessage>,
    parameters: Partial<DeepseekParameters> = {}
  ) {
    try {
      // Filter out any residual reasoning_content before sending
      const filteredMessages = messages.map(({ reasoning_content, ...rest }) => rest);
      
      const response = await this.client.chat.completions.create({
        model: 'deepseek-reasoner',
        messages: filteredMessages as OpenAI.ChatCompletionMessageParam[],
        ...this.defaultParameters,
        ...parameters
      }) as unknown as DeepseekChatResponse;

      return {
        content: response.choices[0].message.content,
        reasoning: response.choices[0].message.reasoning_content,
      };
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new Error(`DeepSeek API Error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get the supported parameters for the DeepSeek model
   */
  getSupportedParameters(): string[] {
    return [
      'temperature',
      'top_p',
      'top_k',
      'frequency_penalty',
      'presence_penalty',
      'repetition_penalty',
      'min_p',
      'top_a'
    ];
  }
}
