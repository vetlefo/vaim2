import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMProvider, ProviderConfig, ProviderFactory, ModelCapabilities } from '../interfaces/provider.interface';
export declare class LLMProviderFactory implements ProviderFactory, OnModuleInit {
    private configService;
    private providers;
    private defaultProvider;
    private modelMap;
    private modelCapabilities;
    constructor(configService: ConfigService);
    private initializeModelMap;
    private initializeModelCapabilities;
    getModelCapabilities(model: string): ModelCapabilities | undefined;
    onModuleInit(): Promise<void>;
    private initializeDefaultProviders;
    createProvider(name: string, config: ProviderConfig): Promise<LLMProvider>;
    getProvider(name?: string): LLMProvider;
    listProviders(): string[];
    listModels(provider: string): string[];
    healthCheck(): Promise<{
        [key: string]: boolean;
    }>;
    getBestProvider(): Promise<LLMProvider>;
}
