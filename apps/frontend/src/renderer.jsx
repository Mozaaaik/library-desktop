import React, { useState } from "react";
import { createRoot } from "react-dom/client";

import { LoginPage } from "./components/LoginPage";

// Layout
import Sidebar from "./components/SideBar";

// Pages
import MembersPage from "./components/MembersPage";
import BooksPage from "./components/BooksPage";
import LoanPage from "./components/LoanPage";
import ReturnPage from "./components/ReturnPage";

import "./pages/appShell.css";
import FinesPage from "./components/FinesPage";
import Dashboard from "./components/Dashboard";

function App() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [user, setUser] = useState({ name: "", role: "" });
  const [page, setPage] = useState("members"); // login sonrası default

  const handleLogin = ({ name, role }) => {
    setUser({ name, role });
    setIsAuthed(true);
    setPage("members");
  };

  const onNavigate = (p, subPage) => {
    if (p === "logout") {
      setIsAuthed(false);
      setUser({ name: "", role: "" });
      setPage("members");
      return;
    }
    setPage(p);
    // subPage şimdilik kullanmıyoruz (detail-1 vs. gibi)
  };

  if (!isAuthed) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="shell">
      <Sidebar active={page} onNavigate={onNavigate} user={user} />

      <main className="shellMain">
        {page === "members" && (
          <MembersPage onNavigate={onNavigate} user={user} />
        )}

        {page === "books" && <BooksPage onNavigate={onNavigate} user={user} />}

        {page === "loans" && <LoanPage user={user} />}

        {page === "returns" && <ReturnPage user={user} />}

        {page === "fines" && <FinesPage onNavigate={onNavigate} user={user} />}

        {page === "dashboard" && (
          <Dashboard onNavigate={onNavigate} user={user} />
        )}

        {page !== "members" &&
          page !== "books" &&
          page !== "loans" &&
          page !== "returns" &&
          page !== "fines" &&
          page !== "dashboard" && (
            <div style={{ padding: 24, color: "#e5e7eb" }}>TODO: {page}</div>
          )}
      </main>
    </div>
  );
}

const container = document.getElementById("root");
createRoot(container).render(<App />);

