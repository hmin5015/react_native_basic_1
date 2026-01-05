import ko from "./ko.json";
import en from "./en.json";

export type Language = "ko" | "en";

export const resources = {
  ko,
  en,
};

export const DEFAULT_LANGUAGE: Language = "ko";
