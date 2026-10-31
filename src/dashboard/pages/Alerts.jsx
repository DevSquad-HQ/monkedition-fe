import { admin } from "../api";
import { Button, Card, Notice, Page, Spinner, Table, dateTime, useAction, useLoad } from "../ui";

const Alerts = () => {
  const alerts = useLoad(() => admin.get("/alerts"), []);
  const dead = useLoad(() => admin.get("/events/dead"), []);
  const { busy, error, run } = useAction();

  return (
    <Page title="Alerts" subtitle="Problems the background jobs found. One that is still happening will come back after you close it.">
      <Notice>{alerts.error || dead.error || error}</Notice>
      <Card title="Open alerts" className="mb-4">
        {alerts.loading && !alerts.data ? <Spinner /> : (
          <Table
            rows={alerts.data?.items}
            rowKey={(row) => row._id}
            empty="All clear."
            columns={[
              { label: "Type", render: (a) => <span className="text-xs font-medium whitespace-nowrap">{a.code.replace(/_/g, " ")}</span> },
              { label: "What happened", render: (a) => <span className="break-words">{a.message}</span> },
              { label: "Last seen", render: (a) => <span className="whitespace-nowrap">{dateTime(a.lastSeenAt)}</span> },
              {
                label: "",
                className: "text-right",
                render: (a) => (
                  <Button
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        await admin.post(`/alerts/${encodeURIComponent(a._id)}/resolve`);
                        await alerts.reload();
                      })
                    }
                  >
                    Close
                  </Button>
                ),
              },
            ]}
          />
        )}
      </Card>
      <Card title="Stuck background events">
        {dead.loading && !dead.data ? <Spinner /> : (
          <Table
            rows={dead.data?.items}
            rowKey={(row) => row._id}
            empty="None stuck."
            columns={[
              { label: "Event", render: (e) => e.type },
              { label: "Tries", render: (e) => e.attempts },
              { label: "Error", render: (e) => <span className="text-xs text-red-700 break-words">{String(e.lastError ?? "")}</span> },
              {
                label: "",
                className: "text-right",
                render: (e) => (
                  <Button
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        await admin.post(`/events/${encodeURIComponent(e._id)}/replay`);
                        await dead.reload();
                      })
                    }
                  >
                    Run again
                  </Button>
                ),
              },
            ]}
          />
        )}
      </Card>
    </Page>
  );
};

export default Alerts;
