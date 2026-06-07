import { createReport, enforceRateLimit } from "@/lib/repository";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await enforceRateLimit("report", request);
    const report = await createReport(body);
    return Response.json({ report }, { status: 201 });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to receive report." },
      { status: 400 },
    );
  }
}
