import { handleAdminReport } from "@/lib/repository";

export const dynamic = "force-dynamic";

function isAdmin(request: Request) {
  const password = process.env.ADMIN_PASSWORD;
  return Boolean(password && request.headers.get("x-admin-password") === password);
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/reports/[id]">,
) {
  if (!isAdmin(request)) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { action: "dismiss" | "hide_content" };
    return Response.json(await handleAdminReport(id, body.action));
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to update report." },
      { status: 400 },
    );
  }
}
