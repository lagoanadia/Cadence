"use client";

import { Icon, type IconName } from "@/components/icons";
import { PALETTE } from "@/lib/palette";

type Props = {
  icons: IconName[];
  defaultIcon?: string;
  defaultColor?: string;
  /** Hide the color row when the thing has no color (e.g. chores) */
  withColor?: boolean;
  errors: Record<string, string[] | undefined>;
};

/** Two rows of radio buttons (icon + color), styled as tappable swatches. */
export function IconColorPicker({ icons, defaultIcon, defaultColor, withColor = true, errors }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {withColor && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 px-1 text-[13px] font-medium tracking-wide text-muted uppercase">Color</legend>
          <div className="ios-list flex justify-between px-3 py-3">
            {PALETTE.map((color, index) => (
              <label key={color.name} className="cursor-pointer">
                <input
                  type="radio"
                  name="color"
                  value={color.light}
                  defaultChecked={defaultColor ? defaultColor === color.light : index === 0}
                  className="peer sr-only"
                />
                <span
                  aria-label={color.name}
                  className="block size-8 rounded-full ring-offset-2 ring-offset-surface peer-checked:ring-2 peer-checked:ring-text/70 peer-focus-visible:ring-2 peer-focus-visible:ring-accent"
                  style={{ backgroundColor: `var(--c-${color.name})` }}
                />
              </label>
            ))}
          </div>
          {errors.color?.map((error) => (
            <p key={error} className="px-1 text-[13px] text-danger">
              {error}
            </p>
          ))}
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 px-1 text-[13px] font-medium tracking-wide text-muted uppercase">Icon</legend>
        <div className="ios-list grid grid-cols-6 gap-1 p-2">
          {icons.map((name, index) => (
            <label key={name} className="flex cursor-pointer justify-center">
              <input
                type="radio"
                name="icon"
                value={name}
                defaultChecked={defaultIcon ? defaultIcon === name : index === 0}
                className="peer sr-only"
              />
              <span
                aria-label={name}
                className="flex size-11 items-center justify-center rounded-full text-muted peer-checked:bg-accent-fill peer-checked:text-accent-text peer-focus-visible:ring-2 peer-focus-visible:ring-accent"
              >
                <Icon name={name} className="size-5" />
              </span>
            </label>
          ))}
        </div>
        {errors.icon?.map((error) => (
          <p key={error} className="px-1 text-[13px] text-danger">
            {error}
          </p>
        ))}
      </fieldset>
    </div>
  );
}
