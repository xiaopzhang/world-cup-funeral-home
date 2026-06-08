import {
  enforceRateLimit,
  getTombstoneDetails,
  leaveTribute,
  subjectHashForRequest,
} from "@/lib/repository";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: RouteContext<"/api/tombstones/[id]/tributes">,
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { tributeText: string; authorName: string };
    await enforceRateLimit("tribute", request);
    await leaveTribute(id, body.tributeText, body.authorName, subjectHashForRequest(request));
    return Response.json(await getTombstoneDetails(id));
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to receive tribute." },
      { status: 400 },
    );
  }
}
