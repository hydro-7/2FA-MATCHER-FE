import { useState } from "react";
import { useNavigate } from "react-router";
import { LIMITS } from "../constants/app";
import { ROUTES } from "../config/routes";
import { labelOf } from "../lib/format";
import { useMeta } from "../hooks/useMeta";
import { groupService } from "../services/groupService";
import { useSession } from "../store/session";
import { toast } from "../store/toast";
import { Field, Notice, RemoteState, Select } from "../components/ui";

const EMPTY_GROUP = { name: "", city: "", checkIn: "", checkOut: "", maxSize: "", budgetInr: "", itinerary: "" };

export function CreateGroup() {
  const meta = useMeta();
  const profile = useSession((state) => state.profile);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_GROUP);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const change = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    if (form.checkOut <= form.checkIn) return setError("Check-out must be after check-in.");
    setBusy(true);
    setError("");
    try {
      const group = await groupService.create({
        ...form,
        name: form.name.trim(),
        itinerary: form.itinerary.trim(),
        maxSize: Number(form.maxSize),
        budgetInr: Number(form.budgetInr),
      });
      toast("Group published. Requests will show up on your group page.");
      navigate(ROUTES.GROUP(group.id));
    } catch (failure) {
      setError(failure.message);
      setBusy(false);
    }
  }

  const dateWindow = meta.data?.dateWindow;
  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">MAKE ROOM FOR COMPANY</span>
          <h1 className="form-title">Create your group trip</h1>
        </div>
        <span className="badge">You lead the way</span>
      </div>
      <RemoteState resource={meta} />
      {meta.data && (
        <form onSubmit={submit}>
          <Field label="Group name">
            <input required maxLength={LIMITS.NAME} placeholder="Give your adventure a name" value={form.name} onChange={change("name")} />
          </Field>
          <div className="form-grid">
            <Field label="Destination">
              <Select required options={meta.data.cityOptions} value={form.city} onChange={change("city")} />
            </Field>
            <Field label="Budget per person (INR)" hint="Approximate overall trip budget, not just accommodation.">
              <input required type="number" min="1" step="1" value={form.budgetInr} onChange={change("budgetInr")} />
            </Field>
            <Field label="Check-in">
              <input required type="date" min={dateWindow.FIRST_CHECK_IN} max={dateWindow.LAST_CHECK_OUT} value={form.checkIn} onChange={change("checkIn")} />
            </Field>
            <Field label="Check-out">
              <input
                required
                type="date"
                min={form.checkIn || dateWindow.FIRST_CHECK_IN}
                max={dateWindow.LAST_CHECK_OUT}
                value={form.checkOut}
                onChange={change("checkOut")}
              />
            </Field>
            <Field label="Total travellers, including you">
              <input
                required
                type="number"
                min={meta.data.groupSize.MIN}
                max={meta.data.groupSize.MAX}
                value={form.maxSize}
                onChange={change("maxSize")}
              />
            </Field>
            <Field label="Group gender preference" hint="Uses the creator’s saved profile preference.">
              <input disabled value={labelOf("genderPreference", profile.genderPreference)} />
            </Field>
          </div>
          <Field label="Proposed itinerary" hint="A short description is enough. Your group can discuss the details together.">
            <textarea required rows={4} maxLength={LIMITS.ITINERARY} value={form.itinerary} onChange={change("itinerary")} />
          </Field>
          <Notice error>{error}</Notice>
          <button disabled={busy}>{busy ? "Publishing…" : "Publish group →"}</button>
        </form>
      )}
    </div>
  );
}
