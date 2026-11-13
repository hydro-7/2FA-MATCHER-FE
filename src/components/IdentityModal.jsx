import { useState } from "react";
import { useNavigate } from "react-router";
import { ROUTES } from "../config/routes";
import { useResource } from "../hooks/useResource";
import { travellerService } from "../services/travellerService";
import { useSession } from "../store/session";
import { Field, Modal, RemoteState } from "./ui";

export function IdentityModal({ onClose }) {
  const { userId, switchTo } = useSession();
  const navigate = useNavigate();
  const travellers = useResource(travellerService.list, "travellers");
  const [selected, setSelected] = useState(userId);
  const [query, setQuery] = useState("");
  const options = travellers.data?.filter((person) => `${person.name} ${person.homeCity}`.toLowerCase().includes(query.trim().toLowerCase()));

  function choose(id) {
    switchTo(id);
    onClose();
    navigate(id ? ROUTES.TRIPS : ROUTES.PROFILE);
  }

  return (
    <Modal title="Choose your traveller" onClose={onClose} className="identity-modal">
      <p className="muted">Use an existing traveller or create a new profile. Your trips stay saved with that identity.</p>
      <RemoteState resource={travellers} />
      {options && (
        <div className="identity-picker">
          <Field label="Find a traveller">
            <input type="search" placeholder="Search by name or home city" value={query} onChange={(event) => setQuery(event.target.value)} />
          </Field>
          <div className="identity-list" role="group" aria-label="Travellers">
            {options.map((person) => (
              <label key={person.id} className={`identity-option${selected === person.id ? " selected" : ""}`}>
                <input type="radio" name="traveller" value={person.id} checked={selected === person.id} onChange={() => setSelected(person.id)} />
                <span><strong>{person.name}</strong><small>{person.homeCity}</small></span>
                {person.id === userId && <small className="identity-current">Current</small>}
              </label>
            ))}
            {!options.length && <p className="muted">No travellers found. Try another name or city.</p>}
          </div>
          <div className="actions">
            <button disabled={!selected} onClick={() => choose(selected)}>
              Use this traveller
            </button>
            <button className="secondary" onClick={() => choose("")}>
              Create new profile
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
