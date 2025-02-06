"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMModule = void 0;
const common_1 = require("@nestjs/common");
const llm_service_1 = require("./llm.service");
const llm_resolver_1 = require("./llm.resolver");
const llm_controller_1 = require("./llm.controller");
const provider_factory_1 = require("../providers/provider.factory");
const redis_module_1 = require("../redis/redis.module");
const monitoring_module_1 = require("../monitoring/monitoring.module");
let LLMModule = class LLMModule {
};
exports.LLMModule = LLMModule;
exports.LLMModule = LLMModule = __decorate([
    (0, common_1.Module)({
        imports: [redis_module_1.RedisModule, monitoring_module_1.MonitoringModule],
        providers: [
            llm_service_1.LLMService,
            llm_resolver_1.LLMResolver,
            provider_factory_1.LLMProviderFactory,
        ],
        controllers: [llm_controller_1.LLMController],
        exports: [llm_service_1.LLMService],
    })
], LLMModule);
//# sourceMappingURL=llm.module.js.map