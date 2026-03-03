import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { registerRecurringJobs, startQueueWorkers } from "./queues/index.js";

async function bootstrap() {
  await prisma.$connect();
  startQueueWorkers();
  await registerRecurringJobs();

  app.listen(env.port, () => {
    console.log(`API running at http://localhost:${env.port}`);
  });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
