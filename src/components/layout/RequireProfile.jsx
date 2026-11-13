import { Navigate, Outlet, useLocation } from "react-router";
import { ROUTES } from "../../config/routes";
import { useSession } from "../../store/session";
import { Loading } from "../ui";

export function RequireProfile() {
  const { profile, ready } = useSession();
  const location = useLocation();
  if (!ready) return <Loading label="Loading your profile…" />;
  if (!profile) return <Navigate to={ROUTES.PROFILE} state={{ from: location.pathname + location.search }} replace />;
  return <Outlet />;
}
