import { getTombstoneDetails } from "@/lib/repository";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/tombstones/[id]">,
) {
  const { id } = await context.params;
  const details = await getTombstoneDetails(id);

  if (!details) {
    return Response.json({ message: "Tombstone not found." }, { status: 404 });
  }

  return Response.json(details);
}
