import React, { useState } from "react";
import { createRoot } from "react-dom/client";

import { LoginPage } from "./components/LoginPage";

// Layout + Pages
import Sidebar from "./components/SideBar";
import MembersPage from "./components/MembersPage";

import "./pages/appShell.css"; // shell css (yoksa ekle)

function App() {
    const [isAuthed, setIsAuthed] = useState(false);
    const [user, setUser] = useState({ name: "Admin User", role: "Admin" });
    const [page, setPage] = useState("members"); // default

    const handleLogin = ({ name, role }) => {
        setUser({ name, role });
        setIsAuthed(true);
        setPage("members");
    };

    const onNavigate = (p, sub) => {
        if (p === "logout") {
            setIsAuthed(false);
            setPage("members");
            return;
        }
        setPage(p);
        // subPage loglamak istersen:
        // console.log("sub:", sub);
    };

    if (!isAuthed) {
        return <LoginPage onLogin={handleLogin} />;
    }

    return (
        <div className="shell">
            <Sidebar active={page} onNavigate={onNavigate} user={user} />
            <main className="shellMain">
                {page === "members" && <MembersPage onNavigate={onNavigate} user={user} />}

                {page !== "members" && (
                    <div style={{ padding: 24, color: "#e5e7eb" }}>
                        TODO: {page}
                    </div>
                )}
            </main>
        </div>
    );
}

const container = document.getElementById("root");
createRoot(container).render(<App />);
