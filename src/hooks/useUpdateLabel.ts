import { useI18n } from "./useI18n";
import { buildUpdateLabel } from "../ui/time";

export function useUpdateLabel(time?: string) {
  const { t } = useI18n();

  return buildUpdateLabel(time, {
    live: t("live"),
    updated: t("updated"),
  });
}
