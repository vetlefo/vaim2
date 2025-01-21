import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import WebSocket from 'ws';
import { AppModule } from '../src/app.module';
import { ChatMessage } from '@app/interfaces/provider.interface';

describe('LLM Service (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('REST API', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Hello, world!' },
    ];

    it('/llm/complete (POST)', () => {
      return supertest(httpServer)
        .post('/api/v1/llm/complete')
        .send({ messages })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('text');
          expect(res.body).toHaveProperty('usage');
          expect(res.body).toHaveProperty('metadata');
        });
    });

    it('/llm/providers (GET)', () => {
      return supertest(httpServer)
        .get('/api/v1/llm/providers')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('/llm/providers/:provider/models (GET)', () => {
      return supertest(httpServer)
        .get('/api/v1/llm/providers/openrouter/models')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('/health (GET)', () => {
      return supertest(httpServer)
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body.status).toBe('ok');
        });
    });
  });

  describe('GraphQL API', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Hello, world!' },
    ];

    it('complete query', () => {
      return supertest(httpServer)
        .post('/graphql')
        .send({
          query: `
            query {
              complete(
                messages: [{ role: "user", content: "Hello, world!" }]
              ) {
                text
                usage {
                  promptTokens
                  completionTokens
                  totalTokens
                }
                metadata {
                  model
                  provider
                  latency
                  timestamp
                }
              }
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.complete).toBeDefined();
          expect(res.body.data.complete.text).toBeDefined();
          expect(res.body.data.complete.usage).toBeDefined();
          expect(res.body.data.complete.metadata).toBeDefined();
        });
    });

    it('listProviders query', () => {
      return supertest(httpServer)
        .post('/graphql')
        .send({
          query: `
            query {
              listProviders
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data.listProviders)).toBe(true);
          expect(res.body.data.listProviders.length).toBeGreaterThan(0);
        });
    });

    it('listModels query', () => {
      return supertest(httpServer)
        .post('/graphql')
        .send({
          query: `
            query {
              listModels(provider: "openrouter")
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data.listModels)).toBe(true);
          expect(res.body.data.listModels.length).toBeGreaterThan(0);
        });
    });
  });

  describe('WebSocket Streaming', () => {
    it('should handle streaming completion', (done) => {
      const wsClient = new WebSocket(
        `ws://localhost:${process.env.WS_PORT}/graphql`
      );

      wsClient.onopen = () => {
        wsClient.send(
          JSON.stringify({
            type: 'connection_init',
          })
        );

        wsClient.send(
          JSON.stringify({
            id: '1',
            type: 'start',
            payload: {
              query: `
                subscription {
                  streamCompletion(streamId: "test-stream") {
                    text
                    metadata {
                      model
                      provider
                      latency
                      timestamp
                    }
                  }
                }
              `,
            },
          })
        );
      };

      const messages: string[] = [];

      wsClient.onmessage = (event) => {
        const data = JSON.parse(event.data.toString());
        if (data.type === 'data') {
          messages.push(data.payload.data.streamCompletion.text);
          if (data.payload.data.streamCompletion.text === '[DONE]') {
            expect(messages.length).toBeGreaterThan(1);
            wsClient.close();
            done();
          }
        }
      };

      wsClient.onerror = (error) => {
        done(error);
      };
    });
  });
});