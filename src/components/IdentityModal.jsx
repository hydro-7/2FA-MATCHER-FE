import { useState } from "react";
import { useNavigate } from "react-router";
import { ROUTES } from "../config/routes";
import { useResource } from "../hooks/useResource";
import { travellerService } from "../services/travellerService";
import { useSession } from "../store/session";
import { Field, Modal, RemoteState, Select } from "./ui";

export function IdentityModal({ onClose }) {
  const { userId, switchTo } = useSession();
  const navigate = useNavigate();
  const travellers = useResource(travellerService.list, "travellers");
  const [selected, setSelected] = useState(userId);
  const options = travellers.data?.map((person) => ({ id: person.id, label: `${person.name} · ${person.homeCity}` }));

  function choose(id) {
    switchTo(id);
    onClose();
    navigate(id ? ROUTES.TRIPS : ROUTES.PROFILE);
  }

  return (
    <Modal title="Choose your traveller" onClose={onClose}>
      <p className="muted">Use an existing traveller or create a new profile. Your trips stay saved with that identity.</p>
      <RemoteState resource={travellers} />
      {options && (
        <>
          <Field label="Traveller">
            <Select options={options} placeholder="Select a traveller" value={selected} onChange={(e) => setSelected(e.target.value)} />
          </Field>
          <div className="actions">
            <button disabled={!selected} onClick={() => choose(selected)}>
              Use this traveller
            </button>
            <button className="secondary" onClick={() => choose("")}>
              Create new profile
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
