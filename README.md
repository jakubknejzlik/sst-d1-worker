# sst-d1-worker

D1 database worker with exposed ts-query

## Creating database

```typescript
// infra/d1-database.ts
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
// packages/functions/d1-worker.ts
import { createHonoRouter } from "@jakub.knejzlik/sst-d1-worker";
import { Resource } from "sst";

const { app } = createHonoRouter({
  accessToken: async () => Resource.DatabaseWorkerSecret.value,
});

export default app;
```

```typescript
// infra/d1-database-worker.ts
import { database } from "./d1-database";

sst.Linkable.wrap(random.RandomString, (resource) => ({
  properties: {
    value: resource.result,
  },
}));

export const databaseWorkerSecret = new random.RandomString(
  "DatabaseWorkerSecret",
  {
    length: 32,
  }
);

export const databaseWorker = new sst.cloudflare.Worker("DatabaseWorker", {
  url: true,
  handler: "packages/functions/src/d1-worker.ts",
  link: [database, databaseWorkerSecret],
});
```

## Creating Client

```typescript
import { D1WorkerClient } from "@jakub.knejzlik/sst-d1-worker";
import { Q } from "@jakub.knejzlik/ts-query";
import { Resource } from "sst";

export const d1WorkerClient = new D1WorkerClient({
  url: Resource.DatabaseWorker.url,
  accessToken: Resource.DatabaseWorkerSecret.value,
});

// then You can call
const res = await d1WorkerClient.runQueries(Q.select().from("table_name"));
console.log(res); // {results:[...],error:undefined,meta:{}}
```
