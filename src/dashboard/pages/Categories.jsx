import { useState } from "react";
import { admin } from "../api";
import ImageDrop from "../ImageDrop";
import { Button, Card, Field, Input, Notice, Page, Select, Spinner, Textarea, useAction, useLoad } from "../ui";

const BLANK = { id: null, name: "", description: "", parentCategory: "", thumbnail: "" };

const Categories = () => {
  const { data, error, loading, reload } = useLoad(() => admin.get("/categories"), []);
  const [form, setForm] = useState(null);
  const { busy, error: actionError, run } = useAction();
  const items = data?.items ?? [];
  const roots = items.filter((c) => !c.parentId);
  const childrenOf = (id) => items.filter((c) => c.parentId === id);
  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const save = (e) => {
    e.preventDefault();
    const body = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      thumbnail: form.thumbnail || null,
      parentCategory: form.parentCategory || null,
    };
    run(async () => {
      if (form.id) await admin.put(`/categories/${form.id}`, body);
      else await admin.post("/categories", body);
      setForm(null);
      await reload();
    });
  };

  const remove = (category) => {
    if (!window.confirm(`Delete ${category.name}?`)) return;
    run(async () => {
      await admin.delete(`/categories/${category.id}`);
      await reload();
    });
  };

  const edit = (c) =>
    setForm({
      id: c.id,
      name: c.name,
      description: c.description ?? "",
      parentCategory: c.parentId ?? "",
      thumbnail: c.thumbnail ?? "",
    });

  const Row = ({ category, depth }) => (
    <>
      <li className="flex flex-wrap items-center justify-between gap-2 py-2" style={{ paddingLeft: `${depth * 1.5}rem` }}>
        <span className="text-sm">
          <span className={depth ? "" : "font-medium"}>{category.name}</span>
          <span className="ml-2 text-xs text-gray-500">{category.productCount} products</span>
        </span>
        <span className="flex gap-2">
          <Button onClick={() => edit(category)}>Edit</Button>
          <Button variant="danger" disabled={busy} onClick={() => remove(category)}>Delete</Button>
        </span>
      </li>
      {childrenOf(category.id).map((child) => <Row key={child.id} category={child} depth={depth + 1} />)}
    </>
  );

  return (
    <Page
      title="Categories"
      subtitle="New categories appear in the shop straight away"
      actions={<Button variant="accent" onClick={() => setForm(BLANK)}>Add category</Button>}
    >
      <Notice>{error || actionError}</Notice>
      {form && (
        <Card title={form.id ? `Edit ${form.name}` : "New category"} className="mb-4">
          <form onSubmit={save} className="grid md:grid-cols-2 gap-4">
            <Field label="Name"><Input required maxLength={100} value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
            <Field label="Parent">
              <Select value={form.parentCategory} onChange={(e) => set("parentCategory", e.target.value)}>
                <option value="">None (top level)</option>
                {items.filter((c) => c.id !== form.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Description"><Textarea rows={2} maxLength={1000} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-700 mb-2">Thumbnail</p>
              <ImageDrop
                multiple={false}
                images={form.thumbnail ? [form.thumbnail] : []}
                onChange={(images) => set("thumbnail", images[0] ?? "")}
                target={{ scope: "category", name: form.name.trim() }}
                disabledReason={form.name.trim() ? null : "Enter a name first."}
                label="Add image"
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" variant="primary" disabled={busy}>Save</Button>
              <Button onClick={() => setForm(null)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}
      <Card>
        {loading && !data ? <Spinner /> : (
          <ul className="divide-y divide-gray-100">
            {roots.map((category) => <Row key={category.id} category={category} depth={0} />)}
          </ul>
        )}
      </Card>
    </Page>
  );
};

export default Categories;
