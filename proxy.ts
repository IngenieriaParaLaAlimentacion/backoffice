import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_EDGE_IP_HEADER,
  FORWARDED_USER_IP_HEADER,
  SERVICE_TOKEN_HEADER,
} from "@/constants/serviceHeaders";

/**
 * Tells the backend which user a forwarded call comes from, so its per-IP limits
 * count each user on their own.
 */
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  // The browser can send these itself; only this server is allowed to set them.
  headers.delete(SERVICE_TOKEN_HEADER);
  headers.delete(FORWARDED_USER_IP_HEADER);

  const token = process.env.INTERNAL_SERVICE_TOKEN;
  if (token) {
    headers.set(SERVICE_TOKEN_HEADER, token);

    const edgeIpHeader = process.env.CLIENT_IP_HEADER || DEFAULT_EDGE_IP_HEADER;
    const userIp = request.headers.get(edgeIpHeader)?.trim();
    if (userIp) {
      headers.set(FORWARDED_USER_IP_HEADER, userIp);
    }
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: "/api/:path*",
};
