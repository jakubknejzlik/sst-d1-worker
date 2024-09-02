import { ISerializable } from "@jakub.knejzlik/ts-query";

import { hc } from "hono/client";
import { RunQueryRouteType } from "./server/hono";

let clientMap: Record<
  string,
  ReturnType<typeof hc<RunQueryRouteType>> | undefined
> = {};

const getClient = (url: string) => {
  if (!clientMap[url]) {
    clientMap[url] = hc<RunQueryRouteType>(url);
  }
  return clientMap[url]!;
};

type QueryResult<T> = {
  results: T[];
  meta: Record<string, any>;
  error: string | null;
};

type D1WorkerClientConfig = {
  url: string;
  accessToken?: string;
};

export class D1WorkerClient {
  constructor(private config: D1WorkerClientConfig) {}

  async runQueries<T>(
    queries: ISerializable[]
  ): Promise<Array<QueryResult<T>>> {
    const { url, accessToken } = this.config;

    const result = await getClient(url)["*"].$post(
      {
        json: { queries: queries.map((q) => q.serialize()) },
      },
      {
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : undefined,
      }
    );
    const json = await result.json();
    if (json.error) {
      throw new Error(`Error running queries: ${json.error}`);
    }
    return json.results as QueryResult<T>[];
  }

  async runQueryAll<T>(query: ISerializable): Promise<Array<T>> {
    const results = await this.runQueries([query]);
    return results[0]?.results as T[];
  }

  async runQueryFirst<T>(query: ISerializable): Promise<T | null> {
    const results = await this.runQueries([query]);
    return (results[0]?.results?.[0] ?? null) as T | null;
  }
}
