import { UAParser } from "ua-parser-js";

export type DeviceType = "desktop" | "mobile" | "tablet" | "unknown";

export function getDeviceType(userAgent: string): DeviceType {
  const parser = new UAParser(userAgent);
  const device = parser.getDevice();

  if (device.type === "mobile") return "mobile";
  if (device.type === "tablet") return "tablet";
  if (!device.type) return "desktop";
  return "unknown";
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
