import { getHomeSnapshot } from "@/lib/demo-store";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(getHomeSnapshot());
}
