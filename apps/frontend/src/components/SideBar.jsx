import React from "react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Repeat,
  ClipboardCheck, // YENİ: İade ikonu eklendi
  BadgeDollarSign,
  BarChart3,
  SearchCode,
  LogOut,
  Library,
} from "lucide-react";
import "../pages/SideBar.css";

export default function Sidebar({ active = "members", onNavigate, user }) {
  const items = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    { key: "members", label: "Üye Yönetimi", icon: <Users size={18} /> },
    { key: "books", label: "Kitap Yönetimi", icon: <BookOpen size={18} /> },
    { key: "loans", label: "Ödünç İşlemleri", icon: <Repeat size={18} /> },
    { key: "returns", label: "İade İşlemleri", icon: <ClipboardCheck size = {18} />},
    {
      key: "fines",
      label: "Ceza Görüntüleme",
      icon: <BadgeDollarSign size={18} />,
    },
    { key: "reports", label: "Raporlar", icon: <BarChart3 size={18} /> },
    {
      key: "dynamic-query",
      label: "Dinamik Sorgu Ekranı",
      icon: <SearchCode size={18} />,
    },
  ];

  return (
    <aside className="sb">
      <div className="sbBrand">
        <div className="sbLogo">
          <Library size={18} />
        </div>
        <div>
          <div className="sbTitle">UniLib</div>
          <div className="sbSub">Management</div>
        </div>
      </div>

      <nav className="sbNav">
        {items.map((it) => (
          <button
            key={it.key}
            className={`sbItem ${active === it.key ? "active" : ""}`}
            onClick={() => onNavigate(it.key)}
            type="button"
          >
            <span className="sbIcon">{it.icon}</span>
            <span className="sbText">{it.label}</span>
            {active === it.key ? <span className="sbDot" /> : null}
          </button>
        ))}
      </nav>

      <div className="sbFooter">
        <div className="sbUser">
          <div className="sbAvatar">{(user?.name || "A")[0].toUpperCase()}</div>
          <div className="sbUserMeta">
            <div className="sbUserName">{user?.name || "Admin User"}</div>
            <div className="sbUserRole">{user?.role || "Admin"}</div>
          </div>
        </div>

        <button
          className="sbLogout"
          type="button"
          onClick={() => onNavigate("logout")}
        >
          <LogOut size={18} />
          <span>Çıkış</span>
        </button>
      </div>
    </aside>
  );
}
