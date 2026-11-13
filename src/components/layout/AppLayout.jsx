import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { NAV_ITEMS, PHOTO_CREDITS_PATH } from "../../constants/app";
import { ROUTES } from "../../config/routes";
import { assetUrl } from "../../lib/format";
import { travellerService } from "../../services/travellerService";
import { useSession } from "../../store/session";
import { useToasts } from "../../store/toast";
import { IdentityModal } from "../IdentityModal";
import { Avatar } from "../ui";

function useLoadProfile() {
  const { userId, profile, setProfile, signOut } = useSession();
  useEffect(() => {
    if (!userId) return signOut();
    if (profile?.id === userId) return;
    let active = true;
    const selectedId = userId;
    const stillSelected = () =>
      active && useSession.getState().userId === selectedId;
    travellerService
      .me()
      .then((loadedProfile) => {
        if (stillSelected()) setProfile(loadedProfile);
      })
      .catch((error) => {
        if (!stillSelected()) return;
        if (error.status === 401) signOut();
        else useSession.setState({ ready: true });
      });
    return () => {
      active = false;
    };
  }, [userId, profile, setProfile, signOut]);
}

export function AppLayout() {
  useLoadProfile();
  const profile = useSession((state) => state.profile);
  const toasts = useToasts((state) => state.toasts);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [switching, setSwitching] = useState(false);

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <button
            className="brand"
            onClick={() => navigate(ROUTES.HOME)}
            aria-label="Travel Together home"
          >
            <span className="brand-symbol">b.</span>
            <span>
              Travel Together
              <small>A little company. A bigger adventure.</small>
            </span>
          </button>
          <button
            className="profile-button"
            aria-label={
              profile ? `${profile.name}, view profile` : "Your profile"
            }
            onClick={() => navigate(ROUTES.PROFILE)}
          >
            <Avatar person={profile} />
            <span>{profile?.name || "Your profile"}</span>
          </button>
          <button className="switch-button" onClick={() => setSwitching(true)}>
            Switch traveller
          </button>
        </div>
      </header>
      {switching && <IdentityModal onClose={() => setSwitching(false)} />}
      <nav className="main-nav" aria-label="Main navigation">
        <div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.to}
              className={pathname === item.to ? "active" : ""}
              onClick={() => navigate(item.to)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
      <main key={profile?.id}>
        <Outlet />
      </main>
      <footer>
        Travel Together{" "}
        <span>
          Made for shared adventures.{" "}
          <a
            href={assetUrl(PHOTO_CREDITS_PATH)}
            target="_blank"
            rel="noreferrer"
          >
            Photo credits
          </a>
        </span>
      </footer>
      <div className="toasts" aria-live="polite">
        {toasts.map((item) => (
          <div key={item.id} className={`toast ${item.tone}`}>
            {item.message}
          </div>
        ))}
      </div>
    </>
  );
}
