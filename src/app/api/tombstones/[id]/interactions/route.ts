import { getTombstoneDetails, interactWithTombstone } from "@/lib/demo-store";
import type { InteractionType } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: RouteContext<"/api/tombstones/[id]/interactions">,
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { interactionType: InteractionType };
    interactWithTombstone(id, body.interactionType);
    return Response.json(getTombstoneDetails(id));
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to record ritual." },
      { status: 400 },
    );
  }
}
