import React, { useEffect, useState } from "react";
import {
  Users,
  BookOpen,
  Repeat,
  BadgeDollarSign,
  BarChart3,
  Search,
  Plus,
  ArrowRight,
  AlertTriangle,
  Clock,
} from "lucide-react";
import "../pages/Dashboard.css";

const API = "http://localhost:3000";

export default function Dashboard({ onNavigate, user }) {
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeLoans: 0,
    overdueLoans: 0,
    unpaidFines: 0,
  });

  const [recent, setRecent] = useState({
    overdueTop5: [],
    lastFines: [],
  });

  // İstersen backend bağlarsın:
  // const API = "http://localhost:3000/dashboard";
  // useEffect(() => { fetch(API).then(r=>r.json()).then(setData) }, []);
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch(`${API}/dashboard/summary`);
        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();
        if (!alive) return;

        // KPIs
        setStats({
          totalMembers: data?.kpis?.totalMembers ?? 0,
          activeLoans: data?.kpis?.activeLoans ?? 0,
          overdueLoans: data?.kpis?.overdueLoans ?? 0,
          unpaidFines: data?.kpis?.unpaidFines ?? 0,
        });

        // En çok gecikenler (UI'n senin eski şeklin: member, book, days)
        // Backend'de book yok, o yüzden sadece isim + gün göstereceğiz.
        setRecent({
          overdueTop5: (data?.topOverdue ?? []).map((x) => ({
            member: `${x.memberName}`,
            book: `${x.overdueCount} geciken ödünç`,
            days: x.overdueDays,
          })),
          // Son cezalar (UI: member, book, amount, status)
          lastFines: (data?.latestFines ?? []).map((x) => ({
            member: `${x.memberName}`,
            book: x.reason ?? "-",
            amount: x.amount ?? 0,
            status: x.status === "Paid" ? "Ödendi" : "Ödenmedi",
          })),
        });
      } catch (e) {
        console.error(e);
        // İstersen hata durumunda sıfırla
        setStats({ totalMembers: 0, activeLoans: 0, overdueLoans: 0, unpaidFines: 0 });
        setRecent({ overdueTop5: [], lastFines: [] });
      }
    })();

    return () => {
      alive = false;
    };
  }, []);


  const name = user?.name || "Görevli Personel";
  const role = user?.role || "Görevli";

  const cards = [
    {
      title: "Üye Yönetimi",
      desc: "Üye ekle, düzenle, listele",
      icon: <Users size={18} />,
      key: "members",
      color: "cyan",
    },
    {
      title: "Kitap Yönetimi",
      desc: "Kitap ekle, stok güncelle",
      icon: <BookOpen size={18} />,
      key: "books",
      color: "purple",
    },
    {
      title: "Ödünç İşlemleri",
      desc: "Ödünç ver / teslim al",
      icon: <Repeat size={18} />,
      key: "loans",
      color: "blue",
    },
    {
      title: "Ceza Görüntüleme",
      desc: "Ceza listele / ödeme",
      icon: <BadgeDollarSign size={18} />,
      key: "fines",
      color: "red",
    },
    {
      title: "Raporlar",
      desc: "Genel raporlar ve özetler",
      icon: <BarChart3 size={18} />,
      key: "reports",
      color: "green",
    },
    {
      title: "Dinamik Sorgu",
      desc: "Hazır sorgular / filtreli arama",
      icon: <Search size={18} />,
      key: "dynamic-query",
      color: "amber",
    },
  ];

  return (
    <div className="db">
      {/* HEADER */}
      <div className="dbTop">
        <div>
          <div className="dbTitle">Dashboard</div>
          <div className="dbHello">
            Hoş geldiniz, <b>{name}</b> <span className="dbRole">({role})</span>
          </div>
          <div className="dbSub">
            Bugünkü durumu hızlıca kontrol edip işlemlere geçebilirsin.
          </div>
        </div>

        <div className="dbQuickBtns">
          <button className="dbBtn" onClick={() => onNavigate?.("members", "add")}>
            <Plus size={16} /> Üye Ekle
          </button>
          <button className="dbBtn" onClick={() => onNavigate?.("books", "add")}>
            <Plus size={16} /> Kitap Ekle
          </button>
          <button className="dbBtn primary" onClick={() => onNavigate?.("loans", "create")}>
            <Repeat size={16} /> Ödünç Ver
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="dbStats">
        <div className="dbStatCard">
          <div className="dbStatLabel">Toplam Üye</div>
          <div className="dbStatValue">{stats.totalMembers}</div>
        </div>
        <div className="dbStatCard">
          <div className="dbStatLabel">Aktif Ödünç</div>
          <div className="dbStatValue">{stats.activeLoans}</div>
        </div>
        <div className="dbStatCard warn">
          <div className="dbStatLabel">
            <Clock size={14} /> Geciken Ödünç
          </div>
          <div className="dbStatValue">{stats.overdueLoans}</div>
        </div>
        <div className="dbStatCard danger">
          <div className="dbStatLabel">
            <AlertTriangle size={14} /> Ödenmemiş Ceza
          </div>
          <div className="dbStatValue">{stats.unpaidFines}</div>
        </div>
      </div>

      {/* NAV CARDS */}
      <div className="dbGrid">
        {cards.map((c) => (
          <button
            key={c.key}
            className={`dbNavCard ${c.color}`}
            onClick={() => onNavigate?.(c.key)}
            type="button"
          >
            <div className="dbNavIcon">{c.icon}</div>
            <div className="dbNavBody">
              <div className="dbNavTitle">{c.title}</div>
              <div className="dbNavDesc">{c.desc}</div>
            </div>
            <ArrowRight className="dbNavArrow" size={18} />
          </button>
        ))}
      </div>

      {/* TODAY PANELS */}
      <div className="dbPanels">
        <div className="dbPanel">
          <div className="dbPanelHead">
            <div className="dbPanelTitle">En Çok Gecikenler</div>
            <button
              className="dbLink"
              onClick={() => onNavigate?.("reports", { tab: "overdue", autoFetch: true })}
            >
              Tümünü gör <ArrowRight size={14} />
            </button>


          </div>

          {recent.overdueTop5.length === 0 ? (
            <div className="dbEmpty">Geciken kayıt yok</div>
          ) : (
            <div className="dbList">
              {recent.overdueTop5.map((x, i) => (
                <div key={i} className="dbRow">
                  <div className="dbRowMain">
                    <div className="dbRowTitle">{x.member}</div>
                    <div className="dbRowSub">{x.book}</div>
                  </div>
                  <div className="dbPill red">{x.days} gün</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dbPanel">
          <div className="dbPanelHead">
            <div className="dbPanelTitle">Son Cezalar</div>
            <button className="dbLink" onClick={() => onNavigate?.("fines")}>
              Tümünü gör <ArrowRight size={14} />
            </button>
          </div>

          {recent.lastFines.length === 0 ? (
            <div className="dbEmpty">Ceza kaydı yok</div>
          ) : (
            <div className="dbList">
              {recent.lastFines.map((x, i) => (
                <div key={i} className="dbRow">
                  <div className="dbRowMain">
                    <div className="dbRowTitle">{x.member}</div>
                    <div className="dbRowSub">{x.book}</div>
                  </div>
                  <div className={`dbPill ${x.status === "Ödendi" ? "green" : "red"}`}>
                    {x.amount}₺ • {x.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FOOT NOTE */}
      <div className="dbNote">
        İpucu: Dinamik Sorgu ekranında “üye no / kitap adı / ISBN” ile hızlı filtreleme sun.
      </div>
    </div>
  );
}
