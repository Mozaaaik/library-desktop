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
import FinesPage from "./components/FinesPage";
import Dashboard from "./components/Dashboard";
import ReportsPage from "./components/ReportsPage";
import { DynamicQueryPage } from "./components/DynamicQueryPage";

import "./pages/appShell.css";

function App() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [user, setUser] = useState({ name: "", role: "" });

  // SAYFA + PARAMS (tek yerden yönet)
  const [route, setRoute] = useState({ page: "dashboard", params: {} });

  // TEK onNavigate (hem sidebar hem dashboard aynı fonksiyonu kullanacak)
  const onNavigate = (p, params = {}) => {
    if (p === "logout") {
      setIsAuthed(false);
      setUser({ name: "", role: "" });
      setRoute({ page: "dashboard", params: {} });
      return;
    }

    setRoute({ page: p, params });
  };

  const handleLogin = ({ name, role }) => {
    setUser({ name, role });
    setIsAuthed(true);
    setRoute({ page: "dashboard", params: {} });
  };

  if (!isAuthed) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const page = route.page;

  return (
    <div className="shell">
      <Sidebar active={page} onNavigate={onNavigate} user={user} />

      <main className="shellMain">
        {page === "members" && <MembersPage onNavigate={onNavigate} user={user} />}
        {page === "books" && <BooksPage onNavigate={onNavigate} user={user} />}
        {page === "loans" && <LoanPage user={user} />}
        {page === "returns" && <ReturnPage user={user} />}
        {page === "fines" && <FinesPage onNavigate={onNavigate} user={user} />}

        {/* ReportsPage'e navParams gönderiyoruz */}
        {page === "reports" && (
          <ReportsPage onNavigate={onNavigate} user={user} navParams={route.params} />
        )}

        {page === "dynamic-query" && (
          <DynamicQueryPage onNavigate={onNavigate} user={user} />
        )}

        {page === "dashboard" && <Dashboard onNavigate={onNavigate} user={user} />}

        {page !== "members" &&
          page !== "books" &&
          page !== "loans" &&
          page !== "returns" &&
          page !== "fines" &&
          page !== "dashboard" &&
          page !== "reports" &&
          page !== "dynamic-query" && (
            <div style={{ padding: 24, color: "#e5e7eb" }}>TODO: {page}</div>
          )}
      </main>
    </div>
  );
}

const container = document.getElementById("root");
createRoot(container).render(<App />);
