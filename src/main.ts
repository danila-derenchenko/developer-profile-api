import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

const port = Number(process.env.PORT ?? 4000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}
const app = await NestFactory.create(AppModule);
app.enableShutdownHooks();
await app.init();
// Vercel captures listen() during import and opens the socket afterwards.
// Awaiting listen() at module scope would prevent that import from finishing.
void app.listen(port, '0.0.0.0').then(() => {
  console.log(`Apollo Sandbox: http://localhost:${port}/graphql`);
}).catch(async (error: unknown) => {
  console.error('Failed to start HTTP server:', error);
  await app.close();
  process.exitCode = 1;
});
