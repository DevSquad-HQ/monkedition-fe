import { useState } from "react";
import { admin, query } from "../api";
import { useAuth } from "../../context/NewAuthContext";
import { Badge, Button, Card, Field, Input, Notice, Page, Pagination, SearchBox, Spinner, Table, dateTime, useAction, useLoad } from "../ui";

const isStaff = (user) => user.roles?.some((role) => role === "ADMIN" || role === "OPS");

const People = () => {
  const { user: me } = useAuth();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [staffOnly, setStaffOnly] = useState(false);
  const [email, setEmail] = useState("");
  const { data, error, loading, reload } = useLoad(
    () => admin.get(`/users${query({ q, page, staff: staffOnly ? "true" : "" })}`),
    [q, page, staffOnly],
  );
  const { busy, error: actionError, run } = useAction();

  const setAccess = (target, value) => {
    const message = value
      ? `Give ${target} full dashboard access, including prices, refunds and staff accounts?`
      : `Remove dashboard access from ${target}?`;
    if (!window.confirm(message)) return Promise.resolve(false);
    return run(async () => {
      await admin.put("/staff", { email: target, isStaff: value });
      await reload();
    });
  };

  const addStaff = async (e) => {
    e.preventDefault();
    if (await setAccess(email.trim(), true)) setEmail("");
  };

  return (
    <Page title="Customers & staff" subtitle="All staff have the same full access. A change signs that person out.">
      <Notice>{error || actionError}</Notice>
      <Card title="Add staff" className="mb-4">
        <form onSubmit={addStaff} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[16rem]">
            <Field label="Email" hint="They need a shop account first. They sign in with it, then open /dashboard.">
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
          </div>
          <Button type="submit" variant="primary" disabled={busy} className="mb-5">Add staff</Button>
        </form>
      </Card>
      <Card>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <SearchBox placeholder="Search name, email or phone" onSearch={(value) => { setQ(value); setPage(1); }} />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={staffOnly} onChange={(e) => { setStaffOnly(e.target.checked); setPage(1); }} />
            Staff only
          </label>
        </div>
        {loading && !data ? <Spinner /> : (
          <>
            <Table
              rows={data?.items}
              rowKey={(user) => user.id}
              empty="Nobody matches."
              columns={[
                { label: "Name", render: (u) => [u.firstName, u.lastName].filter(Boolean).join(" ") || "—" },
                { label: "Email", render: (u) => <span className="break-all">{u.email}</span> },
                { label: "Phone", render: (u) => u.phone ?? "—" },
                { label: "Email verified", render: (u) => (u.emailVerified ? "Yes" : "No") },
                { label: "Joined", render: (u) => <span className="whitespace-nowrap">{dateTime(u.createdAt)}</span> },
                { label: "Access", render: (u) => <Badge value={isStaff(u) ? "STAFF" : "CUSTOMER"} /> },
                {
                  label: "",
                  className: "text-right",
                  render: (u) =>
                    u.id === me?._id ? (
                      <span className="text-xs text-gray-500">You</span>
                    ) : (
                      <Button disabled={busy} variant={isStaff(u) ? "danger" : "secondary"} onClick={() => setAccess(u.email, !isStaff(u))}>
                        {isStaff(u) ? "Remove" : "Make staff"}
                      </Button>
                    ),
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

export default People;
