import { D1Database } from "@cloudflare/workers-types";
import { Q, SQLiteFlavor } from "@jakub.knejzlik/ts-query";
import { Hono } from "hono";

import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const sqlite = new SQLiteFlavor();

type CreateHonoRouterOpts = {
  accessToken?: () => Promise<string>;
};

export const createHonoRouter = ({ accessToken }: CreateHonoRouterOpts) => {
  let app = new Hono<{
    Bindings: { Database: D1Database };
  }>();

  if (accessToken) {
    app = app.use(async (c, next) => {
      const auth = c.req.header("authorization");
      if (auth !== `Bearer ${await accessToken()}`) {
        return c.json({ error: "Unauthorized" }, { status: 401 });
      }
      return next();
    });
  }

  const runQueryRoute = app.post(
    "/*",
    zValidator("json", z.object({ queries: z.array(z.string()) })),
    async (c) => {
      try {
        const db = c.env.Database;

        const { queries } = c.req.valid("json");

        const results = await Promise.all(
          queries.map(async (query) => {
            const sql = Q.deserialize(query).toSQL(sqlite);
            // console.log("running sql", sql);
            const { error, results, meta } = await db.prepare(sql).all();

            if (error) {
              throw error;
            }

            return { results, meta, error: null };
          })
        );

        return c.json({ results, error: null });
      } catch (e) {
        return c.json(
          { error: (e as Error).message, results: [], meta: {} },
          { status: 400 }
        );
      }
    }
  );
  return { app, runQueryRoute };
};

export type RunQueryRouteType = ReturnType<
  typeof createHonoRouter
>["runQueryRoute"];
