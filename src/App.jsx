import { BrowserRouter, Route, Routes } from "react-router";
import { AppLayout } from "./components/layout/AppLayout";
import { RequireProfile } from "./components/layout/RequireProfile";
import { Empty } from "./components/ui";
import { Home, Start } from "./screens/Home";
import { Profile } from "./screens/Profile";
import { CreateGroup } from "./screens/CreateGroup";
import { Discover } from "./screens/Discover";
import { MyTrips } from "./screens/MyTrips";
import { MemberProfile } from "./screens/MemberProfile";
import { GroupLayout } from "./screens/group/GroupLayout";
import { Overview } from "./screens/group/Overview";
import { Itinerary } from "./screens/group/Itinerary";
import { Members } from "./screens/group/Members";
import { Stays } from "./screens/group/Stays";
import { Chat } from "./screens/group/Chat";
import { Requests } from "./screens/group/Requests";

function NotFound() {
  return <Empty title="Page not found">Use the menu above to get back on track.</Empty>;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="profile" element={<Profile />} />
          <Route element={<RequireProfile />}>
            <Route path="start" element={<Start />} />
            <Route path="discover" element={<Discover />} />
            <Route path="trips" element={<MyTrips />} />
            <Route path="groups/new" element={<CreateGroup />} />
            <Route path="groups/:groupId" element={<GroupLayout />}>
              <Route index element={<Overview />} />
              <Route path="itinerary" element={<Itinerary />} />
              <Route path="members" element={<Members />} />
              <Route path="stays" element={<Stays />} />
              <Route path="chat" element={<Chat />} />
              <Route path="requests" element={<Requests />} />
            </Route>
            <Route path="travellers/:travellerId" element={<MemberProfile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
