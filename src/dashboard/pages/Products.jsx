import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { admin, query } from "../api";
import { LinkButton, Badge, Button, Card, Notice, Page, Pagination, SearchBox, Spinner, Table, useLoad } from "../ui";

const Products = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const { data, error, loading } = useLoad(() => admin.get(`/products${query({ q, page })}`), [q, page]);

  return (
    <Page
      title="Products"
      actions={<LinkButton to="/dashboard/products/new" variant="accent">Add product</LinkButton>}
    >
      <Card>
        <div className="mb-4">
          <SearchBox placeholder="Search products" onSearch={(value) => { setQ(value); setPage(1); }} />
        </div>
        <Notice>{error}</Notice>
        {loading && !data ? (
          <Spinner />
        ) : (
          <>
            <Table
              rows={data?.items}
              rowKey={(product) => product.id}
              onRowClick={(product) => navigate(`/dashboard/products/${product.id}`)}
              empty="No products match."
              columns={[
                {
                  label: "Product",
                  render: (p) => (
                    <span className="flex items-center gap-3 min-w-[14rem]">
                      {p.image ? (
                        <img src={p.image} alt="" className="h-12 w-12 rounded-lg object-cover bg-gray-100" />
                      ) : (
                        <span className="h-12 w-12 rounded-lg bg-gray-100" />
                      )}
                      <span className="font-medium">{p.name}</span>
                    </span>
                  ),
                },
                { label: "Status", render: (p) => <Badge value={p.status} /> },
                { label: "Price", render: (p) => `₹${p.price}`, className: "text-right" },
                { label: "MRP", render: (p) => (p.mrp != null ? `₹${p.mrp}` : "—"), className: "text-right" },
                {
                  label: "In stock",
                  render: (p) => <span className={p.available <= 10 ? "text-orange-700 font-medium" : ""}>{p.available}</span>,
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

export default Products;
