import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import Dashboard from "./components/Dashboard";
import { useAuth, AuthProvider } from "./context/AuthContext";
import ProfilesPage from "./components/ProfilesPage";
import Navbar from "./components/Navbar";
import SeekerProfileForm from "./components/SeekerProfileForm";
import CreateProjectForm from "./components/CreateProjectForm";
import ViewProjects from "./components/ViewProjects";
import ProjectDetails from "./components/ProjectDetails";
import AllProjects from "./components/AllProjects";
import ChatRoom from "./components/ChatRoom";
import MyChats from "./components/MyChats";
import Matches from "./components/Matches";
import UserProfile from "./components/UserProfile";
import LandingPage from "./components/LandingPage";

function ChatRoomWrapper() {
  const { projectId } = useParams();
  return <ChatRoom projectId={parseInt(projectId)} />;
}

function App() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLanding = location.pathname === "/";

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#EEF2FB" }}>
      <div className="spinner-border" style={{ color: "#2952A3" }} />
    </div>
  );

  return (
    <>
      {user && !isLanding && <Navbar />}
      <Routes>
        {/* Public landing page — always shown at / */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/edit-profile"
          element={<SeekerProfileForm isEditMode={true} />}
        />
        <Route path="/request-join" element={<Dashboard />} />

        {
          // <Route path="/seeker/profile" element={<SeekerProfileForm />} />
        }
        <Route
          path="/projects"
          element={user ? <AllProjects /> : <Navigate to="/login" />}
        />
        <Route
          path="/projects/:projectId"
          element={user ? <ProjectDetails /> : <Navigate to="/login" />}
        />
        <Route path="/profiles" element={<ProfilesPage />} />
        <Route
          path="/create-project"
          element={user ? <CreateProjectForm /> : <Navigate to="/login" />}
        />
        <Route
          path="/owner/projects"
          element={user ? <ViewProjects /> : <Navigate to="/dashboard" />}
        />
        <Route path="/profile/:userId" element={<UserProfile />} />
        <Route
          path="/matches"
          element={user ? <Matches /> : <Navigate to="/login" />}
        />
        <Route
          path="/chats"
          element={user ? <MyChats /> : <Navigate to="/login" />}
        />
        <Route
          path="/chat/project/:projectId"
          element={
            user ? (
              <ChatRoomWrapper />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
      <ToastContainer />
    </>
  );
}

export default App;
