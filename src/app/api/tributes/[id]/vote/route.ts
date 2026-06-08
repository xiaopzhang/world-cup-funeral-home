import {
  enforceRateLimit,
  getTombstoneDetailsByTributeId,
  subjectHashForRequest,
  voteOnTribute,
} from "@/lib/repository";
import type { TributeVoteType } from "@/lib/tribute-engagement";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: RouteContext<"/api/tributes/[id]/vote">,
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { voteType: TributeVoteType };
    await enforceRateLimit("tribute_vote", request);
    const vote = await voteOnTribute({
      tributeId: id,
      voteType: body.voteType,
      subjectHash: subjectHashForRequest(request),
    });
    const details = await getTombstoneDetailsByTributeId(id);
    return Response.json({ vote, details });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to record tribute vote." },
      { status: 400 },
    );
  }
}
