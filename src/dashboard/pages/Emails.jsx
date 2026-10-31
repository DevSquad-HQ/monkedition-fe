import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { admin, query } from "../api";
import { Badge, Button, Card, Field, Input, Notice, Page, Pagination, Select, Spinner, Table, dateTime, useAction, useLoad } from "../ui";

const STATUSES = ["QUEUED", "SENDING", "SENT", "FAILED", "SKIPPED", "SUPPRESSED", "EXPIRED"];
const label = (template) => template.replace(/\./g, " ").replace(/([A-Z])/g, " $1").toLowerCase();

const Emails = () => {
  const [params] = useSearchParams();
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [page, setPage] = useState(1);
  const [address, setAddress] = useState("");
  const log = useLoad(() => admin.get(`/notifications${query({ status, page })}`), [status, page]);
  const blocked = useLoad(() => admin.get("/suppressions"), []);
  const { busy, error, run } = useAction();

  return (
    <Page title="Emails" subtitle="Everything the shop has sent. Provider delivery details are in Brevo.">
      <Notice>{log.error || blocked.error || error}</Notice>
      <Card className="mb-4">
        <div className="w-full sm:w-56 mb-4">
          <Select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
          </Select>
        </div>
        {log.loading && !log.data ? <Spinner /> : (
          <>
            <Table
              rows={log.data?.items}
              rowKey={(row) => row._id}
              empty="No emails match."
              columns={[
                { label: "Email", render: (n) => label(n.template) },
                { label: "To", render: (n) => <span className="break-all">{n.to}</span> },
                { label: "Status", render: (n) => <Badge value={n.status} /> },
                { label: "Tries", render: (n) => n.attempts, className: "text-right" },
                { label: "Created", render: (n) => <span className="whitespace-nowrap">{dateTime(n.createdAt)}</span> },
                { label: "Last error", render: (n) => <span className="text-xs text-red-700">{n.lastError ?? ""}</span> },
                {
                  label: "",
                  className: "text-right",
                  render: (n) =>
                    n.status === "FAILED" && !n.linkExpiresAt ? (
                      <Button
                        disabled={busy}
                        onClick={() =>
                          run(async () => {
                            await admin.post(`/notifications/${encodeURIComponent(n._id)}/retry`);
                            await log.reload();
                          })
                        }
                      >
                        Send again
                      </Button>
                    ) : null,
                },
              ]}
            />
            <Pagination page={log.data?.page} onChange={setPage} />
          </>
        )}
      </Card>
      <Card title="Do-not-email list">
        <form
          className="flex flex-wrap items-end gap-3 mb-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await admin.post("/suppressions", { address: address.trim() });
              setAddress("");
              await blocked.reload();
            });
          }}
        >
          <div className="flex-1 min-w-[16rem]">
            <Field label="Address"><Input type="email" required value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
          </div>
          <Button type="submit" disabled={busy}>Add</Button>
        </form>
        <Table
          rows={blocked.data?.items}
          rowKey={(row) => row._id}
          empty="No blocked addresses."
          columns={[
            { label: "Address", render: (s) => <span className="break-all">{s._id}</span> },
            { label: "Reason", render: (s) => s.reason },
            {
              label: "",
              className: "text-right",
              render: (s) => (
                <Button
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await admin.delete(`/suppressions/${encodeURIComponent(s._id)}`);
                      await blocked.reload();
                    })
                  }
                >
                  Remove
                </Button>
              ),
            },
          ]}
        />
      </Card>
    </Page>
  );
};

export default Emails;
