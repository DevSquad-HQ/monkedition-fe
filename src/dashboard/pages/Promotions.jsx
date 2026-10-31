import { useState } from "react";
import { admin } from "../api";
import { Badge, Button, Card, Field, Input, Notice, Page, Select, Spinner, Table, dateTime, rupees, useAction, useLoad } from "../ui";

const BLANK = { code: "", type: "PERCENT", value: "", maxDiscount: "", minSubtotal: "", startsAt: "", endsAt: "", maxRedemptions: "", perUserLimit: "1" };

const paise = (rupeesText) => (rupeesText === "" ? null : Math.round(Number(rupeesText) * 100));
const whole = (text) => (text === "" ? null : Number(text));
const date = (text) => (text ? new Date(text).toISOString() : null);

const discountText = (p) =>
  p.type === "PERCENT"
    ? `${(p.percentBps ?? 0) / 100}%${p.maxDiscountPaise ? ` up to ${rupees(p.maxDiscountPaise)}` : ""}`
    : rupees(p.amountPaise);

const Promotions = () => {
  const { data, error, loading, reload } = useLoad(() => admin.get("/promotions"), []);
  const [form, setForm] = useState(null);
  const { busy, error: actionError, run } = useAction();
  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const save = (e) => {
    e.preventDefault();
    const body = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      ...(form.type === "PERCENT"
        ? { percentBps: Math.round(Number(form.value) * 100), maxDiscountPaise: paise(form.maxDiscount) }
        : { amountPaise: paise(form.value) }),
      minSubtotalPaise: paise(form.minSubtotal),
      startsAt: date(form.startsAt),
      endsAt: date(form.endsAt),
      maxRedemptions: whole(form.maxRedemptions),
      perUserLimit: whole(form.perUserLimit),
    };
    run(async () => {
      await admin.post("/promotions", body);
      setForm(null);
      await reload();
    });
  };

  const setActive = (promotion, active) =>
    run(async () => {
      await admin.patch(`/promotions/${promotion.id}`, { active });
      await reload();
    });

  return (
    <Page title="Promo codes" actions={<Button variant="accent" onClick={() => setForm(BLANK)}>Add code</Button>}>
      <Notice>{error || actionError}</Notice>
      {form && (
        <Card title="New promo code" className="mb-4">
          <form onSubmit={save} className="grid md:grid-cols-3 gap-4">
            <Field label="Code"><Input required maxLength={40} pattern="[A-Za-z0-9_\-]+" value={form.code} onChange={(e) => set("code", e.target.value)} placeholder="WELCOME10" /></Field>
            <Field label="Type">
              <Select value={form.type} onChange={(e) => set("type", e.target.value)}>
                <option value="PERCENT">Percentage off</option>
                <option value="FLAT">Fixed amount off</option>
              </Select>
            </Field>
            <Field label={form.type === "PERCENT" ? "Percent off" : "Amount off (₹)"}>
              <Input type="number" required min="0.01" max={form.type === "PERCENT" ? "90" : undefined} step="0.01" value={form.value} onChange={(e) => set("value", e.target.value)} />
            </Field>
            {form.type === "PERCENT" && (
              <Field label="Most it can take off (₹)" hint="Optional"><Input type="number" min="1" step="0.01" value={form.maxDiscount} onChange={(e) => set("maxDiscount", e.target.value)} /></Field>
            )}
            <Field label="Minimum order (₹)" hint="Optional"><Input type="number" min="0" step="0.01" value={form.minSubtotal} onChange={(e) => set("minSubtotal", e.target.value)} /></Field>
            <Field label="Total uses allowed" hint="Empty means no limit"><Input type="number" min="1" value={form.maxRedemptions} onChange={(e) => set("maxRedemptions", e.target.value)} /></Field>
            <Field label="Uses per customer" hint="Empty means no limit"><Input type="number" min="1" value={form.perUserLimit} onChange={(e) => set("perUserLimit", e.target.value)} /></Field>
            <Field label="Starts" hint="Optional"><Input type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} /></Field>
            <Field label="Ends" hint="Optional"><Input type="datetime-local" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} /></Field>
            <div className="md:col-span-3 flex gap-2">
              <Button type="submit" variant="primary" disabled={busy}>Create code</Button>
              <Button onClick={() => setForm(null)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}
      <Card>
        {loading && !data ? <Spinner /> : (
          <Table
            rows={data?.items}
            rowKey={(p) => p.id}
            empty="No promo codes yet."
            columns={[
              { label: "Code", render: (p) => <strong>{p.code}</strong> },
              { label: "Discount", render: discountText },
              { label: "Used", render: (p) => `${p.redemptionCount ?? 0}${p.maxRedemptions ? ` of ${p.maxRedemptions}` : ""}` },
              { label: "Ends", render: (p) => dateTime(p.endsAt) },
              { label: "Status", render: (p) => <Badge value={p.active ? "ACTIVE" : "INACTIVE"} /> },
              {
                label: "",
                render: (p) => <Button disabled={busy} onClick={() => setActive(p, !p.active)}>{p.active ? "Turn off" : "Turn on"}</Button>,
                className: "text-right",
              },
            ]}
          />
        )}
      </Card>
    </Page>
  );
};

export default Promotions;
