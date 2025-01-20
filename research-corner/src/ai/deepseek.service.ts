import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class DeepseekService {
  private readonly client: OpenAI;

  constructor(private configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.get('DEEPSEEK_API_KEY'),
      baseURL: 'https://api.deepseek.com/v1',
    });
  }

  async createChatCompletion(messages: Array<OpenAI.ChatCompletionMessageParam>) {
    try {
      // Filter out any residual reasoning_content before sending
      const filteredMessages = messages.map(({ reasoning_content, ...rest }) => rest);
      
      const response = await this.client.chat.completions.create({
        model: 'deepseek-reasoner',
        messages: filteredMessages,
      });

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
}
