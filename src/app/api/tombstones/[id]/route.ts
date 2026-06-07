import { getTombstoneDetails } from "@/lib/demo-store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/tombstones/[id]">,
) {
  const { id } = await context.params;
  const details = getTombstoneDetails(id);

  if (!details) {
    return Response.json({ message: "Tombstone not found." }, { status: 404 });
  }

  return Response.json(details);
}
