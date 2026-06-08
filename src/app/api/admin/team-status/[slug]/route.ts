import { updateTeamStatusManually } from "@/lib/repository";

export const dynamic = "force-dynamic";

function isAdmin(request: Request) {
  const password = process.env.ADMIN_PASSWORD;
  return Boolean(password && request.headers.get("x-admin-password") === password);
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/team-status/[slug]">,
) {
  if (!isAdmin(request)) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug } = await context.params;
    const body = await request.json();
    return Response.json(await updateTeamStatusManually(slug, body));
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to update team." },
      { status: 400 },
    );
  }
}
