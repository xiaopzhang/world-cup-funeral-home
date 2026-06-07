import { createTombstoneRecord, enforceRateLimit } from "@/lib/repository";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await enforceRateLimit("create_tombstone", request);
    const tombstone = await createTombstoneRecord(body);
    return Response.json({ tombstone }, { status: 201 });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to publish tombstone." },
      { status: 400 },
    );
  }
}
