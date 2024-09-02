# sst-d1-worker

D1 database worker with exposed ts-query

## Creating database

```typescript
import { d1Migrate } from "@jakub.knejzlik/sst-d1-worker";

export const database = new sst.cloudflare.D1("Database");

$resolve({
  id: database.nodes.database.id,
  accountId: database.nodes.database.accountId,
}).apply(async ({ id, accountId }) => {
  const apiToken = process.env["CLOUDFLARE_API_TOKEN"];
  if (!apiToken) {
    throw new Error("CLOUDFLARE_API_TOKEN is required");
  }

  await d1Migrate({
    migrationsFolder: "packages/d1-database/migrations",
    apiToken,
    accountId: accountId!,
    databaseId: id!,
  });
});
```

## Creating Cloudflare Worker

```typescript
import { createHonoRouter } from "@jakub.knejzlik/sst-d1-worker";
import { Resource } from "sst";

const { app } = createHonoRouter({
  accessToken: async () => Resource.DatabaseWorkerSecret.value,
});

export default app;
```

## Creating Client

```typescript
import { D1WorkerClient } from "@jakub.knejzlik/sst-d1-worker";
import { Resource } from "sst";

export const d1WorkerClient = new D1WorkerClient({
  url: Resource.DatabaseWorker.url,
  accessToken: Resource.DatabaseWorkerSecret.value,
});

export const runQueries = d1WorkerClient.runQueries.bind(d1WorkerClient);
export const runQueryAll = d1WorkerClient.runQueryAll.bind(d1WorkerClient);
export const runQueryFirst = d1WorkerClient.runQueryFirst.bind(d1WorkerClient);
```
