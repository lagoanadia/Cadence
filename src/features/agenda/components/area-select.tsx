import { Field, Select } from "@/components/ui/field";
import type { AreaSummary } from "@/features/agenda/queries";

type Props = {
  areas: AreaSummary[];
  defaultValue?: string | null;
  errors?: string[];
};

export function AreaSelect({ areas, defaultValue, errors }: Props) {
  return (
    <Field label="Area" htmlFor="areaId" errors={errors}>
      <Select id="areaId" name="areaId" defaultValue={defaultValue ?? ""}>
        <option value="">No area</option>
        {areas.map((area) => (
          <option key={area.id} value={area.id}>
            {area.name}
          </option>
        ))}
      </Select>
    </Field>
  );
}
