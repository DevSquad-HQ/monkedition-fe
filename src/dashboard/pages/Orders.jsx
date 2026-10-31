import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { admin, query } from "../api";
import { Badge, Card, Notice, Page, Pagination, SearchBox, Select, Spinner, Table, dateTime, rupees, useLoad } from "../ui";

const STATUSES = [
  "PENDING_PAYMENT",
  "PAYMENT_FAILED",
  "FULFILMENT_REQUESTED",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "DISPUTED",
  "CANCELLED",
  "REFUNDED",
];

const Orders = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "";
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const { data, error, loading } = useLoad(
    () => admin.get(`/orders${query({ status, q, page })}`),
    [status, q, page],
  );

  return (
    <Page title="Orders" subtitle="Search by order number, customer name, email or phone">
      <Card>
        <div className="flex flex-wrap gap-3 mb-4">
          <SearchBox placeholder="Search orders" onSearch={(value) => { setQ(value); setPage(1); }} />
          <div className="w-full sm:w-56 -mt-1">
            <Select
              aria-label="Filter by status"
              value={status}
              onChange={(e) => {
                setPage(1);
                setParams(e.target.value ? { status: e.target.value } : {});
              }}
            >
              <option value="">All statuses</option>
              {STATUSES.map((value) => (
                <option key={value} value={value}>{value.replace(/_/g, " ")}</option>
              ))}
            </Select>
          </div>
        </div>
        <Notice>{error}</Notice>
        {loading && !data ? (
          <Spinner />
        ) : (
          <>
            <Table
              rows={data?.items}
              rowKey={(order) => order.orderNumber}
              onRowClick={(order) => navigate(`/dashboard/orders/${order.orderNumber}`)}
              empty="No orders match."
              columns={[
                { label: "Order", render: (o) => <span className="font-medium whitespace-nowrap">{o.orderNumber}</span> },
                { label: "Customer", render: (o) => o.customerName ?? "—" },
                { label: "Status", render: (o) => <Badge value={o.status} /> },
                { label: "Payment", render: (o) => <span className="whitespace-nowrap">{o.paymentMethod} · <Badge value={o.paymentStatus} /></span> },
                { label: "Total", render: (o) => rupees(o.grandTotal), className: "text-right" },
                { label: "Placed", render: (o) => <span className="whitespace-nowrap">{dateTime(o.placedAt)}</span> },
              ]}
            />
            <Pagination page={data?.page} onChange={setPage} />
          </>
        )}
      </Card>
    </Page>
  );
};

export default Orders;
