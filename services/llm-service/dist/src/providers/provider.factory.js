"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMProviderFactory = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const provider_interface_1 = require("../interfaces/provider.interface");
let LLMProviderFactory = class LLMProviderFactory {
    constructor(configService) {
        this.configService = configService;
        this.providers = new Map();
        this.modelMap = new Map();
        this.modelCapabilities = new Map();
        this.defaultProvider = this.configService.get('DEFAULT_LLM_PROVIDER', 'openrouter');
        this.initializeModelMap();
        this.initializeModelCapabilities();
    }
    initializeModelMap() {
        this.modelMap.set('openrouter', [
            'anthropic/claude-3.5-sonnet',
            'openai/o1',
            'google/gemini-pro',
            'mistral/codestral-2501',
            'openai/gpt-4o',
            'deepseek/deepseek-v3',
            'minimax/minimax-01',
            'mistral/mistral-7b',
            'mistral/ministral-8b',
        ]);
        this.modelMap.set('deepseek', [
            'deepseek-v3',
            'deepseek-coder',
            'deepseek-chat',
            'deepseek-math',
        ]);
    }
    initializeModelCapabilities() {
        this.modelCapabilities.set('anthropic/claude-3.5-sonnet', {
            contextWindow: 200000,
            maxOutputTokens: 8000,
            pricing: {
                input: 1.50,
                output: 5.50
            },
            strengths: [
                'Strong at bridging statements, summary layers, multi-step reasoning',
                'Excellent at "big-picture" analysis and data unification',
                'Great for advanced data science or code reasoning'
            ],
            useCases: [
                'Architectural planning',
                'Summaries of large corpora',
                'High-level design reviews'
            ]
        });
        this.modelCapabilities.set('openai/o1', {
            contextWindow: 200000,
            maxOutputTokens: 100000,
            pricing: {
                input: 15.00,
                output: 60.00,
                images: 21.68
            },
            strengths: [
                'Extreme STEM performance',
                'Multi-path reasoning with advanced backtracking',
                'PhD-level physics, math, HPC-like analysis'
            ],
            useCases: [
                'High-stakes correctness',
                'HPC code validations',
                'Large-scale problem solving'
            ]
        });
        this.modelCapabilities.set('google/gemini-pro', {
            contextWindow: 2000000,
            pricing: {
                input: 1.25,
                output: 5.00,
                images: 0.6575
            },
            strengths: [
                'Enormous context window',
                'Multimodal capabilities',
                'Good for code gen and complex data extraction'
            ],
            useCases: [
                'Huge document sets',
                'Multimedia tasks',
                'Large-scale text ingestion'
            ],
            multimodal: true
        });
        this.modelCapabilities.set('deepseek/deepseek-v3', {
            contextWindow: 128000,
            pricing: {
                input: 0.14,
                output: 0.28
            },
            strengths: [
                'Open-source orientation',
                'Strong code analysis',
                'Good performance across multiple domains'
            ],
            useCases: [
                'Self-hosted deployments',
                'Large codebase analysis',
                'General domain tasks'
            ]
        });
        this.modelCapabilities.set('minimax/minimax-01', {
            contextWindow: 1000000,
            pricing: {
                input: 0.20,
                output: 1.10
            },
            strengths: [
                'Large context at budget-friendly rate',
                'Hybrid architecture',
                'Decent multimodal capabilities'
            ],
            useCases: [
                'Massive text ingestion',
                'Large data transformations',
                'Cost-effective processing'
            ],
            multimodal: true
        });
        this.modelCapabilities.set('mistral/mistral-7b', {
            contextWindow: 32000,
            pricing: {
                input: 0.03,
                output: 0.055
            },
            strengths: [
                'Very cheap input & output cost',
                'Good for simpler tasks & high volumes',
                'Strong for quick queries'
            ],
            useCases: [
                'High-volume tasks',
                'Basic QA or summaries',
                'Budget-constrained operations'
            ]
        });
    }
    getModelCapabilities(model) {
        return this.modelCapabilities.get(model);
    }
    async onModuleInit() {
        await this.initializeDefaultProviders();
    }
    async initializeDefaultProviders() {
        const openrouterApiKey = this.configService.get('OPENROUTER_API_KEY');
        if (openrouterApiKey) {
            await this.createProvider('openrouter', {
                apiKey: openrouterApiKey,
                baseUrl: 'https://openrouter.ai/api/v1',
                siteUrl: this.configService.get('SITE_URL'),
                siteName: this.configService.get('SITE_NAME'),
                defaultModel: 'anthropic/claude-3.5-sonnet',
                maxRetries: this.configService.get('OPENROUTER_MAX_RETRIES', 3),
                timeout: this.configService.get('OPENROUTER_TIMEOUT', 30000),
            });
        }
        const deepseekApiKey = this.configService.get('DEEPSEEK_API_KEY');
        if (deepseekApiKey) {
            await this.createProvider('deepseek', {
                apiKey: deepseekApiKey,
                model: this.configService.get('DEEPSEEK_MODEL', 'deepseek-chat'),
                maxRetries: this.configService.get('DEEPSEEK_MAX_RETRIES', 3),
                timeout: this.configService.get('DEEPSEEK_TIMEOUT', 30000),
            });
        }
    }
    async createProvider(name, config) {
        try {
            const { default: ProviderClass } = await Promise.resolve(`${`./implementations/${name}.provider`}`).then(s => __importStar(require(s)));
            const provider = new ProviderClass(config);
            await provider.initialize();
            this.providers.set(name, provider);
            return provider;
        }
        catch (error) {
            throw new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.PROVIDER_ERROR, `Failed to create provider ${name}: ${error.message}`, name, error);
        }
    }
    getProvider(name) {
        const providerName = name || this.defaultProvider;
        const provider = this.providers.get(providerName);
        if (!provider) {
            throw new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.PROVIDER_ERROR, `Provider ${providerName} not found`, providerName);
        }
        return provider;
    }
    listProviders() {
        return Array.from(this.providers.keys());
    }
    listModels(provider) {
        const models = this.modelMap.get(provider);
        if (!models) {
            throw new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.PROVIDER_ERROR, `Provider ${provider} not found or has no models defined`, provider);
        }
        return models;
    }
    async healthCheck() {
        const results = {};
        for (const [name, provider] of this.providers.entries()) {
            try {
                results[name] = await provider.healthCheck();
            }
            catch (error) {
                results[name] = false;
            }
        }
        return results;
    }
    async getBestProvider() {
        const defaultProvider = this.getProvider();
        try {
            const isHealthy = await defaultProvider.healthCheck();
            if (isHealthy) {
                return defaultProvider;
            }
        }
        catch (error) {
        }
        for (const [name, provider] of this.providers.entries()) {
            if (name === this.defaultProvider)
                continue;
            try {
                const isHealthy = await provider.healthCheck();
                if (isHealthy) {
                    return provider;
                }
            }
            catch (error) {
                continue;
            }
        }
        throw new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.PROVIDER_ERROR, 'No healthy providers available', undefined);
    }
};
exports.LLMProviderFactory = LLMProviderFactory;
exports.LLMProviderFactory = LLMProviderFactory = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LLMProviderFactory);
//# sourceMappingURL=provider.factory.js.map