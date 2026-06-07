import { rollbackTeamStatus } from "@/lib/repository";

export const dynamic = "force-dynamic";

function isAdmin(request: Request) {
  const password = process.env.ADMIN_PASSWORD;
  return Boolean(password && request.headers.get("x-admin-password") === password);
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/admin/team-status/[slug]/rollback">,
) {
  if (!isAdmin(request)) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug } = await context.params;
    return Response.json(await rollbackTeamStatus(slug));
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to rollback team." },
      { status: 400 },
    );
  }
}
