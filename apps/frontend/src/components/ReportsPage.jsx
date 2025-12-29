import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Filter,
  Search,
  X,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import "../pages/ReportsPage.css";

const API = "http://localhost:3000";

/**
 * Beklenen backend endpoint önerisi:
 * 1) GET  /reports/loans?startDate=&endDate=&memberId=&category=&status=
 * 2) GET  /reports/overdue?memberId=&category=&minDays=
 * 3) GET  /reports/most-borrowed?startDate=&endDate=&category=&topN=
 *
 * Export:
 * - CSV (Excel) client-side yapılır (aşağıda var)
 * - PDF için basit print-to-pdf açıyoruz (aşağıda var)
 */

const mockMembers = [
  { id: "1", name: "Ahmet Yılmaz", studentNo: "2021001" },
  { id: "2", name: "Zeynep Kaya", studentNo: "2021002" },
  { id: "3", name: "Mehmet Demir", studentNo: "2021003" },
  { id: "4", name: "Ayşe Şahin", studentNo: "2021004" },
];

const mockCategories = [
  "Software Engineering",
  "Computer Science",
  "Database Systems",
  "Algorithms",
  "Web Development",
];

const mockLoanData = [
  {
    id: 1,
    memberName: "Ahmet Yılmaz",
    studentNo: "2021001",
    bookName: "Clean Code",
    category: "Software Engineering",
    loanDate: "2024-12-01",
    dueDate: "2024-12-15",
    returnDate: "2024-12-14",
    status: "returned",
  },
  {
    id: 2,
    memberName: "Zeynep Kaya",
    studentNo: "2021002",
    bookName: "Design Patterns",
    category: "Software Engineering",
    loanDate: "2024-12-10",
    dueDate: "2024-12-24",
    returnDate: null,
    status: "active",
  },
  {
    id: 3,
    memberName: "Mehmet Demir",
    studentNo: "2021003",
    bookName: "Introduction to Algorithms",
    category: "Algorithms",
    loanDate: "2024-11-20",
    dueDate: "2024-12-04",
    returnDate: null,
    status: "overdue",
  },
  {
    id: 4,
    memberName: "Ayşe Şahin",
    studentNo: "2021004",
    bookName: "Database Systems",
    category: "Database Systems",
    loanDate: "2024-12-05",
    dueDate: "2024-12-19",
    returnDate: "2024-12-18",
    status: "returned",
  },
];

const mockOverdueData = [
  {
    id: 1,
    memberName: "Mehmet Demir",
    studentNo: "2021003",
    bookName: "Introduction to Algorithms",
    category: "Algorithms",
    loanDate: "2024-11-20",
    dueDate: "2024-12-04",
    overdueDays: 25,
  },
  {
    id: 2,
    memberName: "Elif Yıldız",
    studentNo: "2021005",
    bookName: "JavaScript: The Good Parts",
    category: "Web Development",
    loanDate: "2024-12-01",
    dueDate: "2024-12-15",
    overdueDays: 14,
  },
  {
    id: 3,
    memberName: "Burak Arslan",
    studentNo: "2021006",
    bookName: "Operating Systems",
    category: "Computer Science",
    loanDate: "2024-12-15",
    dueDate: "2024-12-27",
    overdueDays: 2,
  },
];

const mockMostBorrowedData = [
  { bookName: "Clean Code", author: "Robert C. Martin", category: "Software Engineering", count: 45 },
  { bookName: "Design Patterns", author: "Gang of Four", category: "Software Engineering", count: 38 },
  { bookName: "Introduction to Algorithms", author: "Cormen et al.", category: "Algorithms", count: 32 },
  { bookName: "The Pragmatic Programmer", author: "Hunt & Thomas", category: "Software Engineering", count: 28 },
  { bookName: "Database Systems", author: "Elmasri & Navathe", category: "Database Systems", count: 25 },
];

function safeDateISO(d) {
  // input: "YYYY-MM-DD"
  if (!d) return "";
  return String(d).slice(0, 10);
}

function toCsv(rows, columns) {
  const esc = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = columns.map((c) => esc(c.label)).join(",");
  const body = rows
    .map((r) => columns.map((c) => esc(r[c.key])).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

function downloadBlob(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function printTablePdf(title, columns, rows) {
  const html = `
  <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 18px; }
        h2 { margin: 0 0 12px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
        th { background: #f2f2f2; text-align: left; }
      </style>
    </head>
    <body>
      <h2>${title}</h2>
      <table>
        <thead>
          <tr>${columns.map((c) => `<th>${c.label}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (r) =>
                `<tr>${columns
                  .map((c) => `<td>${r[c.key] ?? ""}</td>`)
                  .join("")}</tr>`
            )
            .join("")}
        </tbody>
      </table>
      <script>
        window.onload = () => { window.print(); };
      </script>
    </body>
  </html>`;
  const w = window.open("", "_blank");
  if (!w) return alert("Pop-up engellendi. PDF için pop-up izni ver.");
  w.document.open();
  w.document.write(html);
  w.document.close();
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("date-range");

  // dropdown data (istersen backend'den çekersin)
  const [members] = useState(mockMembers);
  const [categories] = useState(mockCategories);

  // TAB1: Tarih aralığı ödünç
  const [startDate, setStartDate] = useState("2024-12-01");
  const [endDate, setEndDate] = useState("2024-12-29");
  const [selectedMemberId, setSelectedMemberId] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRows, setDateRows] = useState([]);
  const [dateLoaded, setDateLoaded] = useState(false);
  const [dateLoading, setDateLoading] = useState(false);

  // TAB2: Geciken kitaplar
  const [overdueMemberId, setOverdueMemberId] = useState("all");
  const [overdueCategory, setOverdueCategory] = useState("all");
  const [minOverdueDays, setMinOverdueDays] = useState("");
  const [overdueRows, setOverdueRows] = useState([]);
  const [overdueLoaded, setOverdueLoaded] = useState(false);
  const [overdueLoading, setOverdueLoading] = useState(false);

  // TAB3: En çok ödünç alınan
  const [borrowStartDate, setBorrowStartDate] = useState("2024-12-01");
  const [borrowEndDate, setBorrowEndDate] = useState("2024-12-29");
  const [borrowCategory, setBorrowCategory] = useState("all");
  const [topN, setTopN] = useState("10");
  const [mostRows, setMostRows] = useState([]);
  const [mostLoaded, setMostLoaded] = useState(false);
  const [mostLoading, setMostLoading] = useState(false);

  const memberNameById = useMemo(() => {
    const map = {};
    members.forEach((m) => (map[m.id] = m.name));
    return map;
  }, [members]);

  // TAB1 fetch
  const fetchDateRange = async () => {
    setDateLoading(true);
    setDateLoaded(false);

    const qs = new URLSearchParams({
      startDate: safeDateISO(startDate),
      endDate: safeDateISO(endDate),
      memberId: selectedMemberId,
      category: selectedCategory,
      status: selectedStatus,
    });

    try {
      const res = await fetch(`${API}/reports/loans?${qs.toString()}`);
      if (!res.ok) throw new Error("backend yok");
      const data = await res.json();
      setDateRows(Array.isArray(data) ? data : []);
    } catch {
      // fallback mock (figma demosu)
      let filtered = [...mockLoanData];

      // tarih aralığı (mock'ta loanDate üzerinden)
      filtered = filtered.filter((x) => x.loanDate >= startDate && x.loanDate <= endDate);

      if (selectedMemberId !== "all") {
        const nm = memberNameById[selectedMemberId];
        filtered = filtered.filter((x) => x.memberName === nm);
      }
      if (selectedCategory !== "all") filtered = filtered.filter((x) => x.category === selectedCategory);
      if (selectedStatus !== "all") {
        if (selectedStatus === "returned") filtered = filtered.filter((x) => x.status === "returned");
        if (selectedStatus === "active") filtered = filtered.filter((x) => x.status === "active" || x.status === "overdue");
        if (selectedStatus === "overdue") filtered = filtered.filter((x) => x.status === "overdue");
      }

      setDateRows(filtered);
    } finally {
      setDateLoaded(true);
      setDateLoading(false);
    }
  };

  const clearDateRange = () => {
    setStartDate("2024-12-01");
    setEndDate("2024-12-29");
    setSelectedMemberId("all");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setDateRows([]);
    setDateLoaded(false);
  };

  // TAB2 fetch
  const fetchOverdue = async () => {
    setOverdueLoading(true);
    setOverdueLoaded(false);

    const qs = new URLSearchParams({
      memberId: overdueMemberId,
      category: overdueCategory,
      minDays: minOverdueDays || "",
    });

    try {
      const res = await fetch(`${API}/reports/overdue?${qs.toString()}`);
      if (!res.ok) throw new Error("backend yok");
      const data = await res.json();
      setOverdueRows(Array.isArray(data) ? data : []);
    } catch {
      let filtered = [...mockOverdueData];

      if (overdueMemberId !== "all") {
        const nm = memberNameById[overdueMemberId];
        filtered = filtered.filter((x) => x.memberName === nm);
      }
      if (overdueCategory !== "all") filtered = filtered.filter((x) => x.category === overdueCategory);
      if (minOverdueDays) {
        const n = parseInt(minOverdueDays, 10);
        if (!Number.isNaN(n)) filtered = filtered.filter((x) => x.overdueDays >= n);
      }

      setOverdueRows(filtered);
    } finally {
      setOverdueLoaded(true);
      setOverdueLoading(false);
    }
  };

  const clearOverdue = () => {
    setOverdueMemberId("all");
    setOverdueCategory("all");
    setMinOverdueDays("");
    setOverdueRows([]);
    setOverdueLoaded(false);
  };

  // TAB3 fetch
  const fetchMostBorrowed = async () => {
    setMostLoading(true);
    setMostLoaded(false);

    const qs = new URLSearchParams({
      startDate: safeDateISO(borrowStartDate),
      endDate: safeDateISO(borrowEndDate),
      category: borrowCategory,
      topN: topN,
    });

    try {
      const res = await fetch(`${API}/reports/most-borrowed?${qs.toString()}`);
      if (!res.ok) throw new Error("backend yok");
      const data = await res.json();
      setMostRows(Array.isArray(data) ? data : []);
    } catch {
      let filtered = [...mockMostBorrowedData];

      if (borrowCategory !== "all") filtered = filtered.filter((x) => x.category === borrowCategory);
      const lim = parseInt(topN, 10);
      filtered = filtered.slice(0, Number.isNaN(lim) ? 10 : lim);

      setMostRows(filtered);
    } finally {
      setMostLoaded(true);
      setMostLoading(false);
    }
  };

  const clearMostBorrowed = () => {
    setBorrowStartDate("2024-12-01");
    setBorrowEndDate("2024-12-29");
    setBorrowCategory("all");
    setTopN("10");
    setMostRows([]);
    setMostLoaded(false);
  };

  // KPI'lar
  const tab1Total = dateRows.length;
  const tab1Returned = dateRows.filter((x) => x.status === "returned").length;
  const tab1NotReturned = tab1Total - tab1Returned;

  const tab2Total = overdueRows.length;
  const tab2Avg = tab2Total ? Math.round(overdueRows.reduce((s, x) => s + (x.overdueDays || 0), 0) / tab2Total) : 0;
  const tab2Max = tab2Total ? Math.max(...overdueRows.map((x) => x.overdueDays || 0)) : 0;

  const tab3TotalCount = mostRows.reduce((s, x) => s + (x.count || 0), 0);
  const tab3TopBook = mostRows[0]?.bookName || "-";
  const tab3RangeText = `${borrowStartDate} - ${borrowEndDate}`;

  // Export helpers
  const exportExcel = () => {
    if (activeTab === "date-range" && dateLoaded) {
      const cols = [
        { key: "memberName", label: "Üye Adı" },
        { key: "studentNo", label: "Öğrenci No" },
        { key: "bookName", label: "Kitap Adı" },
        { key: "category", label: "Kategori" },
        { key: "loanDate", label: "Ödünç Tarihi" },
        { key: "dueDate", label: "Son Teslim" },
        { key: "status", label: "Durum" },
      ];
      const csv = toCsv(dateRows, cols);
      downloadBlob("tarih_araligi_odunc.csv", csv, "text/csv;charset=utf-8");
      return;
    }

    if (activeTab === "overdue" && overdueLoaded) {
      const cols = [
        { key: "memberName", label: "Üye" },
        { key: "studentNo", label: "Öğrenci No" },
        { key: "bookName", label: "Kitap" },
        { key: "category", label: "Kategori" },
        { key: "loanDate", label: "Ödünç Tarihi" },
        { key: "dueDate", label: "Son Teslim" },
        { key: "overdueDays", label: "Gecikme Günü" },
      ];
      const csv = toCsv(overdueRows, cols);
      downloadBlob("geciken_kitaplar.csv", csv, "text/csv;charset=utf-8");
      return;
    }

    if (activeTab === "most-borrowed" && mostLoaded) {
      const cols = [
        { key: "bookName", label: "Kitap Adı" },
        { key: "author", label: "Yazar" },
        { key: "category", label: "Kategori" },
        { key: "count", label: "Ödünç Sayısı" },
      ];
      const csv = toCsv(mostRows, cols);
      downloadBlob("en_cok_odunc_alinan.csv", csv, "text/csv;charset=utf-8");
      return;
    }

    alert("Önce raporu getir.");
  };

  const exportPDF = () => {
    if (activeTab === "date-range" && dateLoaded) {
      const cols = [
        { key: "memberName", label: "Üye Adı" },
        { key: "studentNo", label: "Öğrenci No" },
        { key: "bookName", label: "Kitap" },
        { key: "category", label: "Kategori" },
        { key: "loanDate", label: "Ödünç" },
        { key: "dueDate", label: "Son Teslim" },
        { key: "status", label: "Durum" },
      ];
      printTablePdf("Tarih Aralığına Göre Ödünç Raporu", cols, dateRows);
      return;
    }

    if (activeTab === "overdue" && overdueLoaded) {
      const cols = [
        { key: "memberName", label: "Üye" },
        { key: "studentNo", label: "Öğrenci No" },
        { key: "bookName", label: "Kitap" },
        { key: "category", label: "Kategori" },
        { key: "loanDate", label: "Ödünç" },
        { key: "dueDate", label: "Son Teslim" },
        { key: "overdueDays", label: "Gecikme" },
      ];
      printTablePdf("Geciken Kitaplar Raporu", cols, overdueRows);
      return;
    }

    if (activeTab === "most-borrowed" && mostLoaded) {
      const cols = [
        { key: "bookName", label: "Kitap" },
        { key: "author", label: "Yazar" },
        { key: "category", label: "Kategori" },
        { key: "count", label: "Ödünç Sayısı" },
      ];
      printTablePdf("En Çok Ödünç Alınan Kitaplar", cols, mostRows);
      return;
    }

    alert("Önce raporu getir.");
  };

  const showExport = useMemo(() => {
    if (activeTab === "date-range") return dateLoaded;
    if (activeTab === "overdue") return overdueLoaded;
    if (activeTab === "most-borrowed") return mostLoaded;
    return false;
  }, [activeTab, dateLoaded, overdueLoaded, mostLoaded]);

  // küçük: tab değişince scroll toparla
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  return (
    <div className="repPage">
      {/* HEADER */}
      <div className="repHeader">
        <div className="repCrumbs">
          <span>Ana Sayfa</span>
          <span className="sep">›</span>
          <span className="active">Raporlar</span>
        </div>
        <h1 className="repTitle">Raporlar</h1>
        <p className="repSub">
          Ödünç işlemleri, gecikmeler ve istatistiksel raporları görüntüleyin
        </p>

        <div className="repTabs">
          <button
            className={`repTab ${activeTab === "date-range" ? "active cyan" : ""}`}
            onClick={() => setActiveTab("date-range")}
            type="button"
          >
            <Calendar size={16} />
            <span>Tarih Aralığı Ödünç</span>
          </button>

          <button
            className={`repTab ${activeTab === "overdue" ? "active red" : ""}`}
            onClick={() => setActiveTab("overdue")}
            type="button"
          >
            <span>Geciken Kitaplar</span>
          </button>

          <button
            className={`repTab ${activeTab === "most-borrowed" ? "active purple" : ""}`}
            onClick={() => setActiveTab("most-borrowed")}
            type="button"
          >
            <span>En Çok Ödünç Alınan</span>
          </button>
        </div>
      </div>

      {/* CONTENT */}
      {activeTab === "date-range" && (
        <div className="repGrid">
          {/* Filters */}
          <div className="repCard repFilters">
            <div className="repCardHead">
              <div className="repHeadIcon cyan">
                <Filter size={18} />
              </div>
              <div>
                <div className="repHeadTitle">Filtreler</div>
                <div className="repHeadSub">Tarih aralığına göre ödünç raporu</div>
              </div>
            </div>

            <div className="repForm">
              <div className="repField">
                <label>Başlangıç Tarihi</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>

              <div className="repField">
                <label>Bitiş Tarihi</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>

              <div className="repField">
                <label>Üye Seç (Opsiyonel)</label>
                <select value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)}>
                  <option value="all">Tüm Üyeler</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.studentNo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="repField">
                <label>Kategori Seç (Opsiyonel)</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option value="all">Tüm Kategoriler</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="repField">
                <label>Durum</label>
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option value="all">Hepsi</option>
                  <option value="returned">Teslim Edildi</option>
                  <option value="active">Teslim Edilmedi</option>
                  <option value="overdue">Gecikmiş</option>
                </select>
              </div>

              <div className="repActions">
                <button className="repBtn primary cyan" type="button" onClick={fetchDateRange} disabled={dateLoading}>
                  <Search size={16} />
                  {dateLoading ? "Getiriliyor..." : "Raporu Getir"}
                </button>

                <button className="repBtn icon" type="button" onClick={clearDateRange} title="Temizle">
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="repRight">
            {dateLoaded && (
              <div className="repKpis">
                <div className="repKpiCard">
                  <div className="kpiLabel">Toplam Kayıt</div>
                  <div className="kpiValue">{tab1Total}</div>
                </div>
                <div className="repKpiCard">
                  <div className="kpiLabel">Teslim Edilen</div>
                  <div className="kpiValue green">{tab1Returned}</div>
                </div>
                <div className="repKpiCard">
                  <div className="kpiLabel">Teslim Edilmemiş</div>
                  <div className="kpiValue orange">{tab1NotReturned}</div>
                </div>
              </div>
            )}

            <div className="repCard repTableCard">
              <div className="repTableHead">
                <div>
                  <div className="repHeadTitle">Sonuçlar</div>
                  <div className="repHeadSub">Üye, kitap, tarih ve durum bilgileri</div>
                </div>

                {showExport && (
                  <div className="repExport">
                    <button className="repBtn outline" type="button" onClick={exportExcel}>
                      <FileSpreadsheet size={16} />
                      Excel İndir
                    </button>
                    <button className="repBtn outline" type="button" onClick={exportPDF}>
                      <FileText size={16} />
                      PDF İndir
                    </button>
                  </div>
                )}
              </div>

              {!dateLoaded ? (
                <div className="repEmpty">
                  <Calendar size={48} />
                  <p>Filtre seçip raporu getirin</p>
                </div>
              ) : (
                <div className="repTableWrap">
                  <table className="repTable">
                    <thead>
                      <tr>
                        <th>Üye Adı</th>
                        <th>Öğrenci No</th>
                        <th>Kitap Adı</th>
                        <th>Kategori</th>
                        <th>Ödünç Tarihi</th>
                        <th>Son Teslim Tarihi</th>
                        <th>Teslim Durumu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dateRows.map((r) => (
                        <tr key={r.id}>
                          <td className="textWhite">{r.memberName}</td>
                          <td className="textMuted">{r.studentNo}</td>
                          <td className="textSoft">{r.bookName}</td>
                          <td>
                            <span className="repBadge purple">{r.category}</span>
                          </td>
                          <td className="textMuted">{r.loanDate}</td>
                          <td className="textMuted">{r.dueDate}</td>
                          <td>
                            {r.status === "returned" && <span className="repBadge green">Teslim Edildi</span>}
                            {r.status === "active" && <span className="repBadge cyan">Aktif</span>}
                            {r.status === "overdue" && <span className="repBadge red">Gecikmiş</span>}
                          </td>
                        </tr>
                      ))}
                      {dateRows.length === 0 && (
                        <tr>
                          <td colSpan={7} className="repNoRow">
                            Kayıt bulunamadı.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "overdue" && (
        <div className="repGrid">
          {/* Filters */}
          <div className="repCard repFilters">
            <div className="repCardHead">
              <div className="repHeadIcon red">
                <Filter size={18} />
              </div>
              <div>
                <div className="repHeadTitle">Filtreler</div>
                <div className="repHeadSub">Teslim edilmemiş gecikmeler</div>
              </div>
            </div>

            <div className="repForm">
              <div className="repField">
                <label>Üye (Opsiyonel)</label>
                <select value={overdueMemberId} onChange={(e) => setOverdueMemberId(e.target.value)}>
                  <option value="all">Tüm Üyeler</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.studentNo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="repField">
                <label>Kategori (Opsiyonel)</label>
                <select value={overdueCategory} onChange={(e) => setOverdueCategory(e.target.value)}>
                  <option value="all">Tüm Kategoriler</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="repField">
                <label>Minimum Gecikme Günü</label>
                <input
                  type="number"
                  placeholder="Örn: 3"
                  value={minOverdueDays}
                  onChange={(e) => setMinOverdueDays(e.target.value)}
                />
              </div>

              <div className="repActions">
                <button className="repBtn primary red" type="button" onClick={fetchOverdue} disabled={overdueLoading}>
                  <Search size={16} />
                  {overdueLoading ? "Getiriliyor..." : "Raporu Getir"}
                </button>

                <button className="repBtn icon" type="button" onClick={clearOverdue} title="Temizle">
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="repRight">
            {overdueLoaded && (
              <div className="repKpis">
                <div className="repKpiCard">
                  <div className="kpiLabel">Toplam Geciken</div>
                  <div className="kpiValue red">{tab2Total}</div>
                </div>
                <div className="repKpiCard">
                  <div className="kpiLabel">Ortalama Gecikme</div>
                  <div className="kpiValue orange">{tab2Avg} gün</div>
                </div>
                <div className="repKpiCard">
                  <div className="kpiLabel">En Yüksek Gecikme</div>
                  <div className="kpiValue redStrong">{tab2Max} gün</div>
                </div>
              </div>
            )}

            <div className="repCard repTableCard">
              <div className="repTableHead">
                <div>
                  <div className="repHeadTitle">Geciken Kitaplar</div>
                  <div className="repHeadSub">Son teslim tarihi geçmiş kayıtlar</div>
                </div>

                {showExport && (
                  <div className="repExport">
                    <button className="repBtn outline" type="button" onClick={exportExcel}>
                      <FileSpreadsheet size={16} />
                      Excel İndir
                    </button>
                    <button className="repBtn outline" type="button" onClick={exportPDF}>
                      <FileText size={16} />
                      PDF İndir
                    </button>
                  </div>
                )}
              </div>

              {!overdueLoaded ? (
                <div className="repEmpty">
                  <Calendar size={48} />
                  <p>Filtre seçip raporu getirin</p>
                </div>
              ) : (
                <div className="repTableWrap">
                  <table className="repTable">
                    <thead>
                      <tr>
                        <th>Üye</th>
                        <th>Kitap</th>
                        <th>Ödünç Tarihi</th>
                        <th>Son Teslim Tarihi</th>
                        <th>Gecikme Günü</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overdueRows.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <div className="cellStack">
                              <div className="textWhite">{r.memberName}</div>
                              <div className="textTiny">{r.studentNo}</div>
                            </div>
                          </td>
                          <td>
                            <div className="cellStack">
                              <div className="textSoft">{r.bookName}</div>
                              <div className="textTiny">{r.category}</div>
                            </div>
                          </td>
                          <td className="textMuted">{r.loanDate}</td>
                          <td className="textMuted">{r.dueDate}</td>
                          <td>
                            {r.overdueDays <= 3 ? (
                              <span className="repBadge orange">{r.overdueDays} gün</span>
                            ) : (
                              <span className="repBadge red">{r.overdueDays} gün</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {overdueRows.length === 0 && (
                        <tr>
                          <td colSpan={5} className="repNoRow">
                            Kayıt bulunamadı.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "most-borrowed" && (
        <div className="repGrid">
          {/* Filters */}
          <div className="repCard repFilters">
            <div className="repCardHead">
              <div className="repHeadIcon purple">
                <Filter size={18} />
              </div>
              <div>
                <div className="repHeadTitle">Filtreler</div>
                <div className="repHeadSub">Belirli aralıkta en çok ödünç</div>
              </div>
            </div>

            <div className="repForm">
              <div className="repField">
                <label>Başlangıç Tarihi</label>
                <input type="date" value={borrowStartDate} onChange={(e) => setBorrowStartDate(e.target.value)} />
              </div>

              <div className="repField">
                <label>Bitiş Tarihi</label>
                <input type="date" value={borrowEndDate} onChange={(e) => setBorrowEndDate(e.target.value)} />
              </div>

              <div className="repField">
                <label>Kategori (Opsiyonel)</label>
                <select value={borrowCategory} onChange={(e) => setBorrowCategory(e.target.value)}>
                  <option value="all">Tüm Kategoriler</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="repField">
                <label>Top N</label>
                <select value={topN} onChange={(e) => setTopN(e.target.value)}>
                  <option value="10">Top 10</option>
                  <option value="20">Top 20</option>
                  <option value="50">Top 50</option>
                </select>
              </div>

              <div className="repActions">
                <button className="repBtn primary purple" type="button" onClick={fetchMostBorrowed} disabled={mostLoading}>
                  <Search size={16} />
                  {mostLoading ? "Getiriliyor..." : "Raporu Getir"}
                </button>

                <button className="repBtn icon" type="button" onClick={clearMostBorrowed} title="Temizle">
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="repRight">
            {mostLoaded && (
              <div className="repKpis">
                <div className="repKpiCard">
                  <div className="kpiLabel">Toplam Ödünç</div>
                  <div className="kpiValue purple">{tab3TotalCount}</div>
                </div>
                <div className="repKpiCard">
                  <div className="kpiLabel">En Popüler Kitap</div>
                  <div className="kpiValue text">{tab3TopBook}</div>
                </div>
                <div className="repKpiCard">
                  <div className="kpiLabel">Seçili Aralık</div>
                  <div className="kpiValue small">{tab3RangeText}</div>
                </div>
              </div>
            )}

            {/* mini chart (CSS bar) */}
            {mostLoaded && mostRows.length > 0 && (
              <div className="repCard repChartCard">
                <div className="repTableHead noBorder">
                  <div>
                    <div className="repHeadTitle">Ödünç Sayısı Grafiği</div>
                    <div className="repHeadSub">Kitaplara göre ödünç adedi</div>
                  </div>
                </div>

                <div className="repBars">
                  {mostRows.map((b, i) => {
                    const max = Math.max(...mostRows.map((x) => x.count || 0)) || 1;
                    const pct = Math.round(((b.count || 0) / max) * 100);
                    return (
                      <div className="repBarRow" key={i}>
                        <div className="repBarLabel" title={b.bookName}>
                          {b.bookName}
                        </div>
                        <div className="repBarTrack">
                          <div className="repBarFill" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="repBarValue">{b.count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="repCard repTableCard">
              <div className="repTableHead">
                <div>
                  <div className="repHeadTitle">En Çok Ödünç Alınan Kitaplar</div>
                  <div className="repHeadSub">COUNT ile sıralanmış liste</div>
                </div>

                {showExport && (
                  <div className="repExport">
                    <button className="repBtn outline" type="button" onClick={exportExcel}>
                      <FileSpreadsheet size={16} />
                      Excel İndir
                    </button>
                    <button className="repBtn outline" type="button" onClick={exportPDF}>
                      <FileText size={16} />
                      PDF İndir
                    </button>
                  </div>
                )}
              </div>

              {!mostLoaded ? (
                <div className="repEmpty">
                  <Calendar size={48} />
                  <p>Filtre seçip raporu getirin</p>
                </div>
              ) : (
                <div className="repTableWrap">
                  <table className="repTable">
                    <thead>
                      <tr>
                        <th>Kitap Adı</th>
                        <th>Yazar</th>
                        <th>Kategori</th>
                        <th>Ödünç Sayısı</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mostRows.map((r, idx) => (
                        <tr key={idx}>
                          <td className="textWhite">{r.bookName}</td>
                          <td className="textSoft">{r.author}</td>
                          <td>
                            <span className="repBadge purple">{r.category}</span>
                          </td>
                          <td>
                            <span className="repBadge cyan strong">{r.count}</span>
                          </td>
                        </tr>
                      ))}
                      {mostRows.length === 0 && (
                        <tr>
                          <td colSpan={4} className="repNoRow">
                            Kayıt bulunamadı.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
