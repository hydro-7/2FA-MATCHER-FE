import { useState } from "react";
import { api } from "./api";
import { Field, Modal, Notice, RemoteState, useResource } from "./components";

export default function Identity({ current, onSelect, onClose }) {
  const resource = useResource(api.travellers, "travellers");
  const [id, setId] = useState(current?.id || "");
  return (
    <Modal title="Choose your traveller" onClose={onClose}>
      <p className="muted">
        Use an existing traveller or create a new profile. Your trips stay saved
        with that identity.
      </p>
      <RemoteState resource={resource} />
      {resource.data && (
        <>
          <Field label="Traveller">
            <select value={id} onChange={(event) => setId(event.target.value)}>
              <option value="">Select a traveller</option>
              {resource.data.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name} · {person.homeCity}
                </option>
              ))}
            </select>
          </Field>
          <div className="actions">
            <button disabled={!id} onClick={() => onSelect(id)}>
              Use this traveller
            </button>
            <button className="secondary" onClick={() => onSelect("")}>
              Create new profile
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
