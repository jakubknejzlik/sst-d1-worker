import { drizzle } from "drizzle-orm/sqlite-proxy";

export async function createDbApiConnection(
  accountId: string,
  token: string,
  databaseId: string
) {
  return drizzle(async (sql, params, method) => {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId!}/d1/database/${
      databaseId
    }/query`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params, method }),
    });

    const data: any = await res.json();

    if (res.status !== 200) {
      console.log("failed to run query", sql);

      throw new Error(
        `Error from sqlite proxy server: ${res.status} ${res.statusText}\n${JSON.stringify(data)}`
      );
    }
    if (data.errors.length > 0 || !data.success)
      throw new Error(
        `Error from sqlite proxy server: \n${JSON.stringify(data)}}`
      );

    const qResult = data.result[0];

    if (!qResult.success)
      throw new Error(
        `Error from sqlite proxy server: \n${JSON.stringify(data)}`
      );

    // https://orm.drizzle.team/docs/get-started-sqlite#http-proxy
    return { rows: qResult.results.map((r: any) => Object.values(r)) };
  });
}
