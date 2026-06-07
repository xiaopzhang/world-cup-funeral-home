import { runWorldCupSync } from "@/lib/repository";
import { shouldRunCron } from "@/lib/world-cup-sync";

export const dynamic = "force-dynamic";

async function handleSync(request: Request) {
  const url = new URL(request.url);
  if (
    !shouldRunCron(
      process.env.CRON_SECRET,
      request.headers.get("authorization"),
      url.searchParams.get("secret"),
    )
  ) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    return Response.json(await runWorldCupSync());
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error ? error.message : "Unable to sync World Cup data.",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return handleSync(request);
}

export async function POST(request: Request) {
  return handleSync(request);
}
