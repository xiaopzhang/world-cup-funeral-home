import { describe, expect, it, vi } from "vitest";
import { formatTombstoneShareText, shareTombstone } from "./share";

describe("shareTombstone", () => {
  it("uses native share when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);

    const result = await shareTombstone({
      title: "World Cup Funeral Home",
      text: "I just buried Italy.",
      url: "http://localhost:3000/tombstone/1",
      navigatorLike: { share, clipboard: { writeText: vi.fn() } },
    });

    expect(result).toBe("shared");
    expect(share).toHaveBeenCalledWith({
      title: "World Cup Funeral Home",
      text: "I just buried Italy.",
      url: "http://localhost:3000/tombstone/1",
    });
  });

  it("falls back to clipboard when native share is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    const result = await shareTombstone({
      title: "World Cup Funeral Home",
      text: "I just buried Italy.",
      url: "http://localhost:3000/tombstone/1",
      navigatorLike: { clipboard: { writeText } },
    });

    expect(result).toBe("copied");
    expect(writeText).toHaveBeenCalledWith("I just buried Italy.\nhttp://localhost:3000/tombstone/1");
  });

  it("returns manual text when browser sharing and clipboard both fail", async () => {
    const result = await shareTombstone({
      title: "World Cup Funeral Home",
      text: "I just buried Italy.",
      url: "http://localhost:3000/tombstone/1",
      navigatorLike: {
        clipboard: { writeText: vi.fn().mockRejectedValue(new Error("Denied")) },
      },
    });

    expect(result).toEqual({
      kind: "manual",
      text: "I just buried Italy.\nhttp://localhost:3000/tombstone/1",
    });
  });

  it("formats shares around the tombstone first", () => {
    expect(
      formatTombstoneShareText({
        teamName: "Brazil",
        causeOfDeath: "Samba ran into a low block",
        epitaph: "The dance was beautiful. The ending was not.",
        hook: "Come pay respects.",
        url: "https://example.com/tombstone/brazil-tombstone-abc12",
      }),
    ).toBe(
      [
        "Brazil Tombstone",
        "Cause of death: Samba ran into a low block",
        "\"The dance was beautiful. The ending was not.\"",
        "",
        "Come pay respects.",
        "https://example.com/tombstone/brazil-tombstone-abc12",
      ].join("\n"),
    );
  });
});
