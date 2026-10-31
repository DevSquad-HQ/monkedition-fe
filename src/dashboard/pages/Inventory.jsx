import { useState } from "react";
import { admin, query } from "../api";
import { Button, Card, Field, Input, Notice, Page, Pagination, SearchBox, Spinner, Table, dateTime, useAction, useLoad } from "../ui";

const Adjust = ({ item, onDone }) => {
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const { busy, error, run } = useAction();
  const history = useLoad(() => admin.get(`/inventory/${encodeURIComponent(item._id)}/history`), [item._id]);
  const change = Number(delta);

  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      await admin.post(`/inventory/${encodeURIComponent(item._id)}/adjust`, {
        delta: change,
        reason: reason.trim(),
        productId: item.productId ?? null,
      });
      setDelta("");
      setReason("");
      await Promise.all([onDone(), history.reload()]);
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 p-3 bg-gray-50 rounded-lg">
      <form onSubmit={submit} className="space-y-3">
        <Notice>{error}</Notice>
        <Field label="Change by" hint="Use a minus sign to remove units, e.g. -5">
          <Input type="number" required step="1" value={delta} onChange={(e) => setDelta(e.target.value)} />
        </Field>
        <Field label="Reason">
          <Input required maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="New delivery" />
        </Field>
        <Button type="submit" variant="primary" disabled={busy || !Number.isInteger(change) || change === 0 || !reason.trim()}>
          {Number.isInteger(change) && change !== 0 ? `Set to ${item.onHand + change} on hand` : "Update stock"}
        </Button>
      </form>
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Recent changes</p>
        <ul className="space-y-1 text-xs text-gray-600 max-h-52 overflow-y-auto">
          {history.data?.items?.map((row) => (
            <li key={row._id} className="flex justify-between gap-3">
              <span className="min-w-0 break-words">
                {row.reason}{row.note ? `: ${row.note}` : ""}
              </span>
              <span className="whitespace-nowrap">
                {row.availableDelta > 0 ? "+" : ""}{row.availableDelta} · {dateTime(row.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const Inventory = () => {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const { data, error, loading, reload } = useLoad(() => admin.get(`/inventory${query({ q, page })}`), [q, page]);
  const openItem = data?.items?.find((item) => item._id === open);

  return (
    <Page title="Inventory" subtitle="Lowest stock first. Reserved units are in unpaid or unprocessed orders.">
      <Card>
        <div className="mb-4">
          <SearchBox placeholder="Search by SKU" onSearch={(value) => { setQ(value); setPage(1); }} />
        </div>
        <Notice>{error}</Notice>
        {loading && !data ? (
          <Spinner />
        ) : (
          <>
            {openItem && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-800 mb-2 break-all">
                  {openItem.productName ?? "Unknown product"} · {openItem.variantId ?? openItem._id}
                </p>
                <Adjust key={openItem._id} item={openItem} onDone={reload} />
              </div>
            )}
            <Table
              rows={data?.items}
              rowKey={(item) => item._id}
              empty="No stock records match."
              columns={[
                { label: "Product", render: (i) => i.productName ?? "—" },
                { label: "Variant", render: (i) => i.variantId ?? "—" },
                { label: "SKU", render: (i) => <span className="text-xs text-gray-500 break-all">{i._id}</span> },
                { label: "On hand", render: (i) => i.onHand, className: "text-right" },
                { label: "Reserved", render: (i) => i.reserved, className: "text-right" },
                {
                  label: "Available",
                  render: (i) => <strong className={i.available <= 10 ? "text-orange-700" : ""}>{i.available}</strong>,
                  className: "text-right",
                },
                {
                  label: "",
                  render: (i) => (
                    <Button onClick={() => setOpen(open === i._id ? null : i._id)} aria-expanded={open === i._id}>
                      {open === i._id ? "Close" : "Adjust"}
                    </Button>
                  ),
                  className: "text-right",
                },
              ]}
            />
            <Pagination page={data?.page} onChange={setPage} />
          </>
        )}
      </Card>
    </Page>
  );
};

export default Inventory;
