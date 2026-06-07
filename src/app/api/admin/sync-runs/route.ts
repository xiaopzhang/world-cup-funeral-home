import { getAdminSnapshot } from "@/lib/repository";

export const dynamic = "force-dynamic";

function isAdmin(request: Request) {
  const password = process.env.ADMIN_PASSWORD;
  return Boolean(password && request.headers.get("x-admin-password") === password);
}

export async function GET(request: Request) {
  if (!isAdmin(request)) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  return Response.json(await getAdminSnapshot());
}
