"use server";

import { redirect } from "next/navigation";
import { handleAdminReport, updateTeamStatusManually } from "@/lib/repository";

export async function updateTeamStatusAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    throw new Error("Unauthorized");
  }

  const slug = String(formData.get("slug") ?? "");
  await updateTeamStatusManually(slug, {
    status: String(formData.get("status") ?? ""),
    isPlayable: formData.get("isPlayable") === "on",
    eliminatedAt: String(formData.get("eliminatedAt") ?? ""),
    deathMatchId: String(formData.get("deathMatchId") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  });

  redirect(`/admin?password=${encodeURIComponent(password)}&updated=${encodeURIComponent(slug)}`);
}

export async function handleReportAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    throw new Error("Unauthorized");
  }

  const reportId = String(formData.get("reportId") ?? "");
  const action = String(formData.get("action") ?? "");
  await handleAdminReport(reportId, action === "hide_content" ? "hide_content" : "dismiss");

  redirect(`/admin?password=${encodeURIComponent(password)}&reportUpdated=${encodeURIComponent(reportId)}`);
}
