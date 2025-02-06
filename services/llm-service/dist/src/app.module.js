"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const llm_module_1 = require("./llm/llm.module");
const redis_module_1 = require("./redis/redis.module");
const rate_limit_module_1 = require("./rate-limit/rate-limit.module");
const health_module_1 = require("./health/health.module");
const monitoring_module_1 = require("./monitoring/monitoring.module");
const env_validation_1 = require("./config/env.validation");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                validate: env_validation_1.validate,
                isGlobal: true,
            }),
            llm_module_1.LLMModule,
            redis_module_1.RedisModule,
            rate_limit_module_1.RateLimitModule,
            health_module_1.HealthModule,
            monitoring_module_1.MonitoringModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map