import { existsSync } from "node:fs";
import { setTimeout } from "node:timers/promises";

if (existsSync(".env")) {
  process.loadEnvFile();
}

async function main() {
  const { boss, startWorker, stopWorker } = await import("../lib/worker/boss");
  const { dbClient } = await import("../lib/db");
  const { JOB_NAMES } = await import("../lib/worker/job-types");
  try {
    await startWorker();
    const id = await boss.send(JOB_NAMES.SCAFFOLD_HEALTHCHECK, {});
    if (!id) {
      throw new Error("Healthcheck was not queued");
    }
    for (let attempt = 0; attempt < 30; attempt++) {
      const job = await boss.getJobById(JOB_NAMES.SCAFFOLD_HEALTHCHECK, id);
      if (job?.state === "completed") {
        console.log("Worker smoke test passed: healthcheck job completed.");
        return;
      }
      if (job?.state === "failed") {
        throw new Error("Healthcheck failed");
      }
      await setTimeout(1000);
    }
    throw new Error("Healthcheck timed out");
  } finally {
    await stopWorker();
    await dbClient.end();
  }
}

main().catch(() => {
  console.error(
    "Worker smoke test failed; check worker readiness and database connectivity."
  );
  process.exitCode = 1;
});
