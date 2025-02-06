import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
interface RedisOptions {
    host: string;
    port: number;
    password?: string;
    db?: number;
}
interface RedisInfo {
    keyspace_hits?: string;
    used_memory?: string;
    connected_clients?: string;
    total_connections_received?: string;
}
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly options;
    private readonly logger;
    private client;
    constructor(options: RedisOptions);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    flushDb(): Promise<void>;
    keys(pattern: string): Promise<string[]>;
    ttl(key: string): Promise<number>;
    ping(): Promise<boolean>;
    info(): Promise<RedisInfo>;
    getStats(): Promise<{
        keyCount: number;
        memoryUsage: number;
    }>;
}
export {};
