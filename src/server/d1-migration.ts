import { migrate } from "drizzle-orm/sqlite-proxy/migrator";
import { sql } from "drizzle-orm";
import { createDbApiConnection } from "./d1-api-connection";

type D1MigrateOpts = {
  // path to drizzle-kit migrations (eg. packages/d1-database/migrations)
  migrationsFolder: string;
  apiToken: string;
  databaseId: string;
  accountId: string;
};

export const d1Migrate = async ({
  migrationsFolder,
  apiToken,
  accountId,
  databaseId,
}: D1MigrateOpts) => {
  const db = await createDbApiConnection(accountId, apiToken, databaseId);
  await migrate(
    db,
    async (migrationQueries) => {
      for (const query of migrationQueries) {
        // remove sql comments
        const processedQuery = query.replace(/\/\*(\n|.)+\*\//gm, "").trim();
        if (processedQuery.length === 0) {
          continue;
        }
        await db.run(sql.raw(processedQuery));
      }
    },
    { migrationsFolder }
  );
};
