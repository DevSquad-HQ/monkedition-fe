import { useState } from "react";
import { admin } from "../api";
import ImageDrop from "../ImageDrop";
import { Button, Card, Empty, Field, Input, Notice, Page, Spinner, useAction, useLoad } from "../ui";

const BLANK = { id: null, title: "", subtitle: "", cta: "", ctaLink: "", order: "0", isActive: true, desktop: "", mobile: "" };

const Sliders = () => {
  const { data, error, loading, reload } = useLoad(() => admin.get("/sliders"), []);
  const [form, setForm] = useState(null);
  const { busy, error: actionError, setError, run } = useAction();
  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const folderName = form?.title.trim() || "Slide";

  const save = (e) => {
    e.preventDefault();
    if (!form.desktop || !form.mobile) return setError("Add both a desktop and a mobile image.");
    const body = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      cta: form.cta.trim(),
      ctaLink: form.ctaLink.trim() || "#",
      order: Number(form.order) || 0,
      isActive: form.isActive,
      desktopImage: { url: form.desktop },
      mobileImage: { url: form.mobile },
    };
    return run(async () => {
      if (form.id) await admin.put(`/sliders/${form.id}`, body);
      else await admin.post("/sliders", body);
      setForm(null);
      await reload();
    });
  };

  const remove = (slider) => {
    if (!window.confirm(`Delete "${slider.title || "this slide"}"?`)) return;
    run(async () => {
      await admin.delete(`/sliders/${slider.id}`);
      await reload();
    });
  };

  return (
    <Page title="Home sliders" actions={<Button variant="accent" onClick={() => setForm(BLANK)}>Add slide</Button>}>
      <Notice>{error || actionError}</Notice>
      {form && (
        <Card title={form.id ? "Edit slide" : "New slide"} className="mb-4">
          <form onSubmit={save} className="grid md:grid-cols-2 gap-4">
            <Field label="Title"><Input maxLength={200} value={form.title} onChange={(e) => set("title", e.target.value)} /></Field>
            <Field label="Subtitle"><Input maxLength={300} value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} /></Field>
            <Field label="Button text"><Input maxLength={50} value={form.cta} onChange={(e) => set("cta", e.target.value)} /></Field>
            <Field label="Button link"><Input maxLength={500} value={form.ctaLink} onChange={(e) => set("ctaLink", e.target.value)} placeholder="/collection/men/anime-verse" /></Field>
            <Field label="Position" hint="Lower numbers show first">
              <Input type="number" min="0" value={form.order} onChange={(e) => set("order", e.target.value)} />
            </Field>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 self-center">
              <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
              Show on the home page
            </label>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Desktop image</p>
              <ImageDrop multiple={false} label="Add image" images={form.desktop ? [form.desktop] : []} onChange={(i) => set("desktop", i[0] ?? "")} target={{ scope: "slider", name: folderName }} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Mobile image</p>
              <ImageDrop multiple={false} label="Add image" images={form.mobile ? [form.mobile] : []} onChange={(i) => set("mobile", i[0] ?? "")} target={{ scope: "slider", name: folderName }} />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" variant="primary" disabled={busy}>Save</Button>
              <Button onClick={() => setForm(null)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}
      {loading && !data ? <Spinner /> : !data?.items?.length ? <Card><Empty>No slides yet.</Empty></Card> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.items.map((slider) => (
            <Card key={slider.id}>
              <img src={slider.desktopImage?.url} alt={slider.title ?? ""} className="w-full h-32 object-cover rounded-lg bg-gray-100" />
              <p className="mt-2 font-medium text-sm">{slider.title || "Untitled"}</p>
              <p className="text-xs text-gray-500">
                Position {slider.order ?? 0} · {slider.isActive ? "Showing" : "Hidden"} · {slider.impressionCount ?? 0} views · {slider.clickCount ?? 0} clicks
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  onClick={() =>
                    setForm({
                      id: slider.id,
                      title: slider.title ?? "",
                      subtitle: slider.subtitle ?? "",
                      cta: slider.cta ?? "",
                      ctaLink: slider.ctaLink ?? "",
                      order: String(slider.order ?? 0),
                      isActive: slider.isActive ?? true,
                      desktop: slider.desktopImage?.url ?? "",
                      mobile: slider.mobileImage?.url ?? "",
                    })
                  }
                >
                  Edit
                </Button>
                <Button variant="danger" disabled={busy} onClick={() => remove(slider)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Page>
  );
};

export default Sliders;
