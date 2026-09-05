import { http, HttpResponse, PathParams } from "msw";

export type BaseHandlerOptions<T> = {
  method: "get" | "post" | "put" | "delete" | "patch";
  status?: 400 | 401 | 403 | 407 | 500 | 200 | 201;
  data?: Partial<T>;
  error?: { type?: string; title?: string; detail: string };
  onRequest?: (request: Request) => void | Promise<void>;
  once?: boolean;
};

export type HandlerOptions<T> = Omit<BaseHandlerOptions<T>, "method">;

export function baseHandler<T, TPath extends PathParams<keyof TPath>>(
  path: string,
  { method = "get", status = 200, ...options }: BaseHandlerOptions<T>,
) {
  const url = path;
  return http[method]<TPath>(
    url,
    async ({ request }) => {
      await options.onRequest?.(request);

      if (status !== 200 && status !== 201) {
        return HttpResponse.json(
          {
            type: options.error?.type || "about:blank",
            status,
            detail: options.error?.detail || "An error occurred",
            title: options.error?.title || "Unknown error",
            instance: path,
          },
          {
            status: status,
            headers: { "Content-Type": "application/problem+json" },
          },
        );
      }
      return options.data
        ? HttpResponse.json(options.data, { status })
        : HttpResponse.json({}, { status });
    },
    { once: options.once },
  );
}
