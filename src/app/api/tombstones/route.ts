import { createTombstoneRecord } from "@/lib/demo-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tombstone = createTombstoneRecord(body);
    return Response.json({ tombstone }, { status: 201 });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to publish tombstone." },
      { status: 400 },
    );
  }
}
