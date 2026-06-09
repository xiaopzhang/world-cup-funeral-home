import { describe, expect, it, vi } from "vitest";
import {
  buildDeepSeekMemePayload,
  deepSeekInternals,
  generateDeepSeekMemeContent,
} from "./deepseek";

const request = {
  teamName: "Brazil",
  teamSlug: "brazil",
  priority: "hot" as const,
  matchContext: "Brazil lost a knockout match.",
  existingCauses: ["Penalty heartbreak"],
  existingEpitaphs: ["The dance was beautiful. The ending was not."],
  causeCount: 2,
  epitaphCount: 2,
};

describe("deepseek meme client", () => {
  it("builds an OpenAI-compatible strict JSON payload", () => {
    const payload = buildDeepSeekMemePayload(request);

    expect(payload.model).toBe("deepseek-chat");
    expect(payload.response_format).toEqual({ type: "json_object" });
    expect(payload.messages[0]?.content).toContain("strict JSON");
    expect(payload.messages[1]?.content).toContain("Brazil");
  });

  it("rejects malformed DeepSeek content", () => {
    expect(() => deepSeekInternals.parseJsonObject("not json")).toThrow("JSON");
    expect(() => deepSeekInternals.assertMemeResponse({ causes: ["ok"] })).toThrow(
      "missing causes or epitaphs",
    );
  });

  it("parses valid DeepSeek responses", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                causes: ["Brazil football hope met the scoreboard"],
                epitaphs: ["Here lies Brazil football hope, loudly loved."],
              }),
            },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(generateDeepSeekMemeContent(request)).resolves.toEqual({
      causes: ["Brazil football hope met the scoreboard"],
      epitaphs: ["Here lies Brazil football hope, loudly loved."],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.deepseek.com/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-key" }),
      }),
    );

    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
});
