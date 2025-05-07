// Wrapper around fetch that logs request details

const enabled = false;

export const loggedFetch =
  (type: string) =>
  async (url: string, options: RequestInit = {}): Promise<Response> => {
    if (!enabled)
      return fetch(url, {
        ...options,
        cache: "no-store",
      });
    console.log(`[${type}] Request`);
    console.log(`\t\t\tURL:`, url);
    console.log(`\t\t\tMethod:`, options.method || "GET");
    const headers: Record<string | number, string | [string, string]> = {};
    if (options.headers && typeof options.headers.forEach === "function") {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    }
    console.log(`\t\t\tHeaders:`, headers);

    if (options.body) {
      console.log(
        `\t\t\tBody:`,
        options.body instanceof Blob ? "(blob)" : options.body
      );
      if (options.body instanceof Blob) {
        const clonedBlob = options.body.slice();
        try {
          console.log(`\t\t\tBody Text:`, await clonedBlob.text());
        } catch (e) {
          console.log(`\t\t\tCould not read request body as text:`, e);
        }
      }
    }
    // Make the actual fetch request
    return fetch(url, {
      ...options,
      cache: "no-store",
    });
  };
