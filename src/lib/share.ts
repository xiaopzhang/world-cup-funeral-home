type NavigatorLike = {
  share?: (data: ShareData) => Promise<void>;
  clipboard?: {
    writeText?: (text: string) => Promise<void>;
  };
};

type ShareInput = {
  title: string;
  text: string;
  url: string;
  navigatorLike?: NavigatorLike;
};

export type ShareResult =
  | "shared"
  | "copied"
  | {
      kind: "manual";
      text: string;
    };

export async function shareTombstone({
  title,
  text,
  url,
  navigatorLike,
}: ShareInput): Promise<ShareResult> {
  const shareText = text.includes(url) ? text : `${text}\n${url}`;
  const targetNavigator =
    navigatorLike ??
    (typeof navigator === "undefined" ? undefined : (navigator as NavigatorLike));

  if (targetNavigator?.share) {
    try {
      await targetNavigator.share({ title, text, url });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return { kind: "manual", text: shareText };
      }
    }
  }

  if (targetNavigator?.clipboard?.writeText) {
    try {
      await targetNavigator.clipboard.writeText(shareText);
      return "copied";
    } catch {
      return { kind: "manual", text: shareText };
    }
  }

  return { kind: "manual", text: shareText };
}
