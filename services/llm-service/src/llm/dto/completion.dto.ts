import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { ChatMessage } from '@app/interfaces/provider.interface';

@InputType()
export class CompletionOptionsInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  model?: string;

  @Field(() => Number, { nullable: true })
  @IsNumber()
  @IsOptional()
  temperature?: number;

  @Field(() => Number, { nullable: true })
  @IsNumber()
  @IsOptional()
  maxTokens?: number;

  @Field(() => Number, { nullable: true })
  @IsNumber()
  @IsOptional()
  topP?: number;

  @Field(() => Number, { nullable: true })
  @IsNumber()
  @IsOptional()
  frequencyPenalty?: number;

  @Field(() => Number, { nullable: true })
  @IsNumber()
  @IsOptional()
  presencePenalty?: number;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  stop?: string[];
}

@InputType()
export class ChatMessageInput implements ChatMessage {
  @Field(() => String)
  @IsString()
  role: 'system' | 'user' | 'assistant';

  @Field(() => String)
  @IsString()
  content: string;
}

@ObjectType()
class CompletionUsage {
  @Field(() => Number)
  promptTokens: number;

  @Field(() => Number)
  completionTokens: number;

  @Field(() => Number)
  totalTokens: number;
}

@ObjectType()
class CompletionMetadata {
  @Field(() => String)
  model: string;

  @Field(() => String)
  provider: string;

  @Field(() => Number)
  latency: number;

  @Field(() => String)
  timestamp: string;
}

@ObjectType()
export class CompletionResponse {
  @Field(() => String)
  text: string;

  @Field(() => CompletionUsage)
  usage: CompletionUsage;

  @Field(() => CompletionMetadata)
  metadata: CompletionMetadata;
}

@ObjectType()
export class StreamCompletionResponse {
  @Field(() => String)
  text: string;

  @Field(() => CompletionMetadata)
  metadata: CompletionMetadata;
}