"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringModule = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const axios_1 = require("@nestjs/axios");
const prometheus_service_1 = require("./prometheus.service");
const monitoring_controller_1 = require("./monitoring.controller");
const redis_module_1 = require("../redis/redis.module");
let MonitoringModule = class MonitoringModule {
};
exports.MonitoringModule = MonitoringModule;
exports.MonitoringModule = MonitoringModule = __decorate([
    (0, common_1.Module)({
        imports: [
            terminus_1.TerminusModule,
            axios_1.HttpModule,
            redis_module_1.RedisModule,
        ],
        providers: [prometheus_service_1.PrometheusService],
        controllers: [monitoring_controller_1.MonitoringController],
        exports: [prometheus_service_1.PrometheusService],
    })
], MonitoringModule);
//# sourceMappingURL=monitoring.module.js.map