export const TALLY_FORM_URL = "https://tally.so/r/7Rgxz6";

interface TallyPopupOptions {
  layout: "modal";
  width: number;
}

interface TallyWindow {
  Tally?: {
    openPopup: (id: string, options: TallyPopupOptions) => void;
  };
}

export function openTallyForm(): void {
  const match = TALLY_FORM_URL.match(/\/r\/([a-zA-Z0-9]+)/);
  const formId = match ? match[1] : "7Rgxz6";

  const win = window as unknown as TallyWindow;

  if (typeof win.Tally?.openPopup === "function") {
    win.Tally.openPopup(formId, { layout: "modal", width: 700 });
  } else {
    window.open(TALLY_FORM_URL, "_blank");
  }
}
