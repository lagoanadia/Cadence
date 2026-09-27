"use client";

import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Icon, type IconName } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { IconColorPicker } from "@/components/ui/icon-color-picker";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteCategoryAction, saveCategoryAction } from "@/features/expenses/actions";
import type { Category } from "@/features/expenses/queries";
import { cssColor } from "@/lib/palette";
import { useActionForm } from "@/lib/use-action-form";

const CATEGORY_ICONS: IconName[] = [
  "utensils",
  "coffee",
  "shopping-cart",
  "shopping-bag",
  "bus",
  "car",
  "fuel",
  "plane",
  "house",
  "ticket",
  "film",
  "gamepad",
  "wine",
  "shirt",
  "gift",
  "pill",
  "smartphone",
  "book-open",
  "graduation-cap",
  "paw",
  "baby",
  "dumbbell",
  "package",
  "receipt",
];

type Props = {
  categories: Category[];
};

/** List of categories; tapping one (or "Add") swaps the list for its form. */
export function CategoryManager({ categories }: Props) {
  const [editing, setEditing] = useState<Category | "new" | null>(null);

  if (editing) {
    return (
      <CategoryForm
        key={editing === "new" ? "new" : editing.id}
        category={editing === "new" ? undefined : editing}
        onDone={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="ios-list ios-rows [--row-inset:60px]">
        {categories.map((category) => (
          <li key={category.id}>
            <button
              type="button"
              onClick={() => setEditing(category)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-surface-2"
            >
              <span
                className="flex size-[30px] items-center justify-center rounded-[8px] text-white"
                style={{ backgroundColor: cssColor(category.color) }}
              >
                <Icon name={category.icon} className="size-[18px]" />
              </span>
              <span className="flex-1 text-[17px]">{category.name}</span>
              <ChevronRight className="size-4 text-muted" />
            </button>
          </li>
        ))}
      </ul>
      <Button type="button" variant="secondary" onClick={() => setEditing("new")}>
        <Plus className="size-5" />
        New category
      </Button>
    </div>
  );
}

type FormProps = {
  category?: Category;
  onDone: () => void;
};

function CategoryForm({ category, onDone }: FormProps) {
  const { state, pending, onSubmit, errors } = useActionForm(saveCategoryAction, onDone);
  const [deleting, startDelete] = useTransition();

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {category && <input type="hidden" name="id" value={category.id} />}
      <Field label="Name" htmlFor="category-name" errors={errors.name}>
        <Input id="category-name" name="name" defaultValue={category?.name} placeholder="Coffee" required />
      </Field>
      <IconColorPicker
        icons={CATEGORY_ICONS}
        defaultIcon={category?.icon}
        defaultColor={category?.color}
        errors={errors}
      />
      <FormMessage status={state.status} message={state.status === "error" ? state.message : undefined} />
      <div className="flex gap-3">
        <Button type="button" variant="plain" onClick={onDone}>
          Back
        </Button>
        {category && (
          <Button
            type="button"
            variant="danger"
            disabled={deleting}
            aria-label="Delete category"
            onClick={() =>
              startDelete(async () => {
                await deleteCategoryAction(category.id);
                onDone();
              })
            }
          >
            <Trash2 className="size-5" />
          </Button>
        )}
        <SubmitButton pending={pending} className="flex-1">
          {category ? "Save" : "Add category"}
        </SubmitButton>
      </div>
    </form>
  );
}
