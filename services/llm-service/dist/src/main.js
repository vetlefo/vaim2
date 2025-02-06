"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'Last-Event-ID'],
        exposedHeaders: ['Content-Type', 'Last-Event-ID'],
        credentials: true,
    });
    app.setGlobalPrefix('api/v1');
    await app.listen(3003);
    console.log('🚀 LLM Service running on: http://[::1]:3003');
    console.log('🔥 GraphQL Playground: http://[::1]:3003/graphql');
    console.log('💓 Health Check: http://[::1]:3003/api/v1/monitoring/health');
}
bootstrap();
//# sourceMappingURL=main.js.map