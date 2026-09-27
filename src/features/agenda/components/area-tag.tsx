import { Icon } from "@/components/icons";
import type { AreaSummary } from "@/features/agenda/queries";

type Props = {
  area: AreaSummary;
};

export function AreaTag({ area }: Props) {
  return (
    <span className="inline-flex items-center gap-1 text-xs" style={{ color: area.color }}>
      <Icon name={area.icon} className="size-3.5" />
      {area.name}
    </span>
  );
}
