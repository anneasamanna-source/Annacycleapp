"use client";

import { useActionState, useEffect, useRef } from "react";
import { Info } from "lucide-react";
import { createListingAction, type FormState } from "@/app/(app)/surplus/new/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { CONDITIONS, UNITS } from "@/lib/domain/enums";
import type { Dict } from "@/lib/i18n/config";
import { DISTRICTS, type FieldName } from "@/lib/validation/listing";

type Props = { t: Dict["surplus"]; conditions: Dict["market"]["conditions"]; crops: { value: string; label: string }[] };
const initial: FormState = { errors: {}, values: {} };

export function ListingForm({ t, conditions, crops }: Props) {
  const [state, action, pending] = useActionState(createListingAction, initial);
  const summary = useRef<HTMLDivElement>(null);
  const v = (f: FieldName) => state.values[f] ?? "";
  const err = (f: FieldName) => (state.errors[f] ? t.errors[state.errors[f]!] : undefined);
  const req = (s: string) => `${s} *`;
  const errorFields = (Object.keys(state.errors) as (FieldName | "form")[]).filter((k) => k !== "form") as FieldName[];

  // Move focus to the error list so keyboard and screen-reader users land on it.
  useEffect(() => {
    if (Object.keys(state.errors).length) summary.current?.focus();
  }, [state]);

  return (
    <form action={action} noValidate className="space-y-8">
      {Object.keys(state.errors).length ? (
        <div ref={summary} tabIndex={-1} role="alert" className="rounded-2xl border-2 border-red-700 bg-red-50 p-5 text-red-900">
          <p className="font-bold">{state.errors.form ? t.errors[state.errors.form] : t.errorSummary}</p>
          {errorFields.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {errorFields.map((f) => (
                <li key={f}>
                  <a href={`#f-${f}`} className="font-semibold underline">{t.fields[f === "crop" ? "crop" : f]}</a>: {t.errors[state.errors[f]!]}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <Card className="space-y-5">
        <h2 className="text-lg font-bold text-forest">{t.sections.produce}</h2>
        <Select id="f-crop" name="crop" label={req(t.fields.crop)} defaultValue={v("crop")} error={err("crop")}>
          <option value="">{t.fields.cropChoose}</option>
          {crops.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </Select>
        <Input id="f-name" name="name" label={t.fields.name} hint={t.fields.nameHint} defaultValue={v("name")} error={err("name")} />
      </Card>

      <Card className="space-y-5">
        <h2 className="text-lg font-bold text-forest">{t.sections.price}</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input id="f-quantity" name="quantity" label={req(t.fields.quantity)} hint={t.fields.numHint} inputMode="decimal" autoComplete="off" defaultValue={v("quantity")} error={err("quantity")} />
          <Select id="f-unit" name="unit" label={req(t.fields.unit)} defaultValue={v("unit") || "kg"} error={err("unit")}>
            {UNITS.map((u) => <option key={u} value={u}>{t.units[u]}</option>)}
          </Select>
        </div>
        <Input id="f-price" name="price" label={req(t.fields.price)} hint={t.fields.priceHint} inputMode="decimal" autoComplete="off" defaultValue={v("price")} error={err("price")} />
      </Card>

      <Card className="space-y-5">
        <h2 className="text-lg font-bold text-forest">{t.sections.where}</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Select id="f-district" name="district" label={req(t.fields.district)} defaultValue={v("district")} error={err("district")}>
            <option value="">—</option>
            {DISTRICTS.map((x) => <option key={x} value={x}>{x}</option>)}
          </Select>
          <Input id="f-area" name="area" label={req(t.fields.area)} hint={t.fields.areaHint} autoComplete="off" defaultValue={v("area")} error={err("area")} />
        </div>
      </Card>

      <Card className="space-y-5">
        <h2 className="text-lg font-bold text-forest">{t.sections.condition}</h2>
        <fieldset aria-describedby="f-condition-hint" aria-invalid={err("condition") ? true : undefined}>
          <legend id="f-condition" className="text-sm font-semibold">{req(t.fields.condition)}</legend>
          <p id="f-condition-hint" className="mt-1 text-sm text-charcoal/70">{t.fields.conditionHint}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CONDITIONS.map((c) => (
              <label key={c} className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-charcoal/25 bg-white px-3 text-center text-sm font-semibold has-[:checked]:border-forest has-[:checked]:bg-forest has-[:checked]:text-ivory">
                <input type="radio" name="condition" value={c} defaultChecked={v("condition") === c} className="sr-only" />
                {conditions[c]}
              </label>
            ))}
          </div>
          {err("condition") ? <p className="mt-2 text-sm font-medium text-red-700">{err("condition")}</p> : null}
        </fieldset>
        <Textarea id="f-notes" name="notes" label={t.fields.notes} defaultValue={v("notes")} error={err("notes")} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input id="f-harvested" name="harvested" type="datetime-local" label={t.fields.harvested} defaultValue={v("harvested")} error={err("harvested")} />
          <Input id="f-purchased" name="purchased" type="datetime-local" label={t.fields.purchased} defaultValue={v("purchased")} error={err("purchased")} />
        </div>
        <Input id="f-storage" name="storage" label={t.fields.storage} hint={t.fields.storageHint} defaultValue={v("storage")} error={err("storage")} />
      </Card>

      <Card className="space-y-5">
        <h2 className="text-lg font-bold text-forest">{t.sections.timing}</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input id="f-collectFrom" name="collectFrom" type="datetime-local" label={req(t.fields.collectFrom)} defaultValue={v("collectFrom")} error={err("collectFrom")} />
          <Input id="f-collectUntil" name="collectUntil" type="datetime-local" label={req(t.fields.collectUntil)} defaultValue={v("collectUntil")} error={err("collectUntil")} />
        </div>
        <Input id="f-recoverBy" name="recoverBy" type="datetime-local" label={req(t.fields.recoverBy)} hint={t.fields.recoverHint} defaultValue={v("recoverBy")} error={err("recoverBy")} />
      </Card>

      <p className="flex gap-2 text-sm text-charcoal/70"><Info className="mt-0.5 size-4 shrink-0" aria-hidden />{t.photoNote}</p>
      <Button type="submit" size="lg" disabled={pending}>{pending ? t.submitting : t.submit}</Button>
    </form>
  );
}
