import { Icon } from "@/components/icons";
import type { AreaSummary } from "@/features/agenda/queries";
import { cssColor } from "@/lib/palette";

type Props = {
  area: AreaSummary;
};

// Text stays in the muted text color; only the icon carries the area color
export function AreaTag({ area }: Props) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="flex" style={{ color: cssColor(area.color) }}>
        <Icon name={area.icon} className="size-3.5" />
      </span>
      {area.name}
    </span>
  );
}
