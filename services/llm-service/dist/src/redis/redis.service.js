"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
let RedisService = RedisService_1 = class RedisService {
    constructor(options) {
        this.options = options;
        this.logger = new common_1.Logger(RedisService_1.name);
    }
    async onModuleInit() {
        try {
            this.client = new ioredis_1.default({
                host: this.options.host,
                port: this.options.port,
                password: this.options.password,
                db: this.options.db,
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
                maxRetriesPerRequest: 3,
            });
            this.client.on('error', (error) => {
                this.logger.error('Redis client error:', error);
            });
            this.client.on('connect', () => {
                this.logger.log('Connected to Redis');
            });
            await this.client.ping();
        }
        catch (error) {
            this.logger.error('Failed to connect to Redis:', error);
            throw error;
        }
    }
    async onModuleDestroy() {
        if (this.client) {
            await this.client.quit();
        }
    }
    async get(key) {
        try {
            return await this.client.get(key);
        }
        catch (error) {
            this.logger.error(`Error getting key ${key}:`, error);
            throw error;
        }
    }
    async set(key, value, ttl) {
        try {
            if (ttl) {
                await this.client.set(key, value, 'EX', ttl);
            }
            else {
                await this.client.set(key, value);
            }
        }
        catch (error) {
            this.logger.error(`Error setting key ${key}:`, error);
            throw error;
        }
    }
    async del(key) {
        try {
            await this.client.del(key);
        }
        catch (error) {
            this.logger.error(`Error deleting key ${key}:`, error);
            throw error;
        }
    }
    async exists(key) {
        try {
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            this.logger.error(`Error checking existence of key ${key}:`, error);
            throw error;
        }
    }
    async flushDb() {
        try {
            await this.client.flushdb();
        }
        catch (error) {
            this.logger.error('Error flushing database:', error);
            throw error;
        }
    }
    async keys(pattern) {
        try {
            return await this.client.keys(pattern);
        }
        catch (error) {
            this.logger.error(`Error getting keys with pattern ${pattern}:`, error);
            throw error;
        }
    }
    async ttl(key) {
        try {
            return await this.client.ttl(key);
        }
        catch (error) {
            this.logger.error(`Error getting TTL for key ${key}:`, error);
            throw error;
        }
    }
    async ping() {
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        }
        catch (error) {
            this.logger.error('Error pinging Redis:', error);
            return false;
        }
    }
    async info() {
        try {
            const info = await this.client.info();
            const infoObj = {};
            info.split('\n').forEach(line => {
                const [key, value] = line.split(':');
                if (key && value) {
                    infoObj[key.trim()] = value.trim();
                }
            });
            return infoObj;
        }
        catch (error) {
            this.logger.error('Error getting Redis info:', error);
            throw error;
        }
    }
    async getStats() {
        try {
            const info = await this.info();
            const keys = await this.keys('*');
            return {
                keyCount: keys.length,
                memoryUsage: parseInt(info.used_memory || '0', 10),
            };
        }
        catch (error) {
            this.logger.error('Error getting Redis stats:', error);
            throw error;
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('REDIS_OPTIONS')),
    __metadata("design:paramtypes", [Object])
], RedisService);
//# sourceMappingURL=redis.service.js.map