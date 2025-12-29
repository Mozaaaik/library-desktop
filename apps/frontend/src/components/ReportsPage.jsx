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
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";

// bazı bundlerlarda pdfFonts.pdfMake.vfs, bazılarında pdfFonts.vfs oluyor
pdfMake.vfs = pdfFonts?.pdfMake?.vfs || pdfFonts?.vfs;

if (!pdfMake.vfs) {
  console.error("pdfMake vfs yüklenemedi:", pdfFonts);
}

function exportXlsx(filename, sheetName, rows, columns) {
  // rows + columns => Excel'e uygun obje listesi
  const data = rows.map((r) => {
    const obj = {};
    columns.forEach((c) => {
      obj[c.label] = r?.[c.key] ?? "";
    });
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(data);

  // Kolon genişlikleri
  ws["!cols"] = columns.map((c) => ({
    wch: Math.min(45, Math.max(12, String(c.label).length + 2)),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // ✅ Browser’da en stabil yöntem: array buffer -> Blob -> saveAs
  const arrayBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, filename);
}

const API = "http://localhost:3000";

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

function isValidDate(d) {
  return d && !Number.isNaN(new Date(d).getTime());
}

function daysBetween(a, b) {
  // a, b: Date
  const ms = 24 * 60 * 60 * 1000;
  return Math.floor((a.getTime() - b.getTime()) / ms);
}

function computeStatus(loan) {
  // returnDate varsa returned
  if (loan.returnDate) return "returned";

  // dueDate yoksa active say
  if (!loan.dueDate || !isValidDate(loan.dueDate)) return "active";

  const due = new Date(loan.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  return due < today ? "overdue" : "active";
}

function exportPdfBlob(filename, title, columns, rows) {
  const headerRow = columns.map((c) => ({
    text: c.label,
    style: "th",
  }));

  const body = [
    headerRow,
    ...rows.map((r) =>
      columns.map((c) => {
        const v = r?.[c.key] ?? "";
        return { text: String(v), style: "td" };
      })
    ),
  ];

  const docDefinition = {
    pageSize: "A4",
    pageOrientation: columns.length > 6 ? "landscape" : "portrait",
    pageMargins: [20, 50, 20, 30],

    header: {
      margin: [20, 15, 20, 0],
      columns: [
        { text: title, style: "title" },
        {
          text: new Date().toLocaleString("tr-TR"),
          alignment: "right",
          style: "meta",
        },
      ],
    },

    footer: function (currentPage, pageCount) {
      return {
        margin: [20, 0, 20, 15],
        columns: [
          { text: "Library Desktop - Rapor", style: "meta" },
          {
            text: `${currentPage} / ${pageCount}`,
            alignment: "right",
            style: "meta",
          },
        ],
      };
    },

    content: [
      {
        table: {
          headerRows: 1,
          widths: columns.map(() => "*"),
          body,
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? "#f2f2f2" : null),
          hLineColor: () => "#ddd",
          vLineColor: () => "#ddd",
        },
      },
    ],

    styles: {
      title: { fontSize: 14, bold: true },
      meta: { fontSize: 9, color: "#666" },
      th: { fontSize: 10, bold: true, margin: [4, 4, 4, 4] },
      td: { fontSize: 9, margin: [4, 3, 4, 3] },
    },
    defaultStyle: {
      fontSize: 9,
    },
  };

  // ✅ Excel gibi direkt indir
  pdfMake.createPdf(docDefinition).getBlob((blob) => {
    saveAs(blob, filename);
  });
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("date-range");

  // dropdown data (istersen backend'den çekersin)
  const [members, setMembers] = useState([]);
  const [categories, setCategories] = useState([]); // string kategori adları

  // Sayfalama Stateleri
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 9 sayfalık sınır

  // Tab değiştiğinde sayfayı sıfırla
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // TAB1: Tarih aralığı ödünç
  const [startDate, setStartDate] = useState("2024-12-01");
  const [endDate, setEndDate] = useState("2027-12-29");
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
  const [borrowEndDate, setBorrowEndDate] = useState("2027-12-29");
  const [borrowCategory, setBorrowCategory] = useState("all");
  const [topN, setTopN] = useState("10");
  const [mostRows, setMostRows] = useState([]);
  const [mostLoaded, setMostLoaded] = useState(false);
  const [mostLoading, setMostLoading] = useState(false);

  const paginatedData = useMemo(() => {
    let activeRows = [];
    if (activeTab === "date-range") activeRows = dateRows;
    else if (activeTab === "overdue") activeRows = overdueRows;
    else if (activeTab === "most-borrowed") activeRows = mostRows;

    const startIndex = (currentPage - 1) * itemsPerPage;
    return activeRows.slice(startIndex, startIndex + itemsPerPage);
  }, [activeTab, dateRows, overdueRows, mostRows, currentPage]);

  // Toplam sayfa sayısı hesaplama
  const totalRows =
    activeTab === "date-range"
      ? dateRows.length
      : activeTab === "overdue"
        ? overdueRows.length
        : mostRows.length;
  const totalPages = Math.ceil(totalRows / itemsPerPage);

  // TAB1 fetch
  const fetchDateRange = async () => {
    setDateLoading(true);
    setDateLoaded(false);

    try {
      // 1. Backend'deki /reports/loans endpoint'i için query parametrelerini hazırla
      const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate,
        memberId: selectedMemberId, // "all" veya sayı
        category: selectedCategory, // "all" veya kategori adı
        status: selectedStatus, // "all", "returned", "active", "overdue"
      });

      const url = `${API}/reports/loans?${params.toString()}`;

      // 2. İsteği at
      const res = await fetch(url);
      if (!res.ok) throw new Error("Rapor verisi alınamadı");

      const data = await res.json();

      // 3. Veriyi tabloya yerleştir
      // Backend zaten 'memberName', 'studentNo', 'loanDate' gibi alanları dönüyor
      setDateRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Rapor hatası:", e);
      setDateRows([]);
    } finally {
      setDateLoading(false);
      setDateLoaded(true);
    }
  };

  const clearDateRange = () => {
    setStartDate("2024-12-01");
    setEndDate("2027-12-29");
    setSelectedMemberId("all");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setDateRows([]);
    setDateLoaded(false);
  };
  // ---- helpers (ReportsPage içinde yukarıya koyabilirsin) ----
  function extractArray(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.loans)) return payload.loans;
    if (Array.isArray(payload?.rows)) return payload.rows;
    return [];
  }

  function normalizeDateToISO(v) {
    if (!v) return "";
    const s = String(v);

    // ISO gibi: 2024-12-29T...
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);

    // 29/12/2024
    const slash = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (slash) return `${slash[3]}-${slash[2]}-${slash[1]}`;

    // 29.12.2024
    const dot = s.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
    if (dot) return `${dot[3]}-${dot[2]}-${dot[1]}`;

    // fallback
    return s.slice(0, 10);
  }

  // ---- TAB2 fetch (bunu komple değiştir) ----
  // TAB2 fetch - DOĞRU ENDPOINT
  const fetchOverdue = async () => {
    setOverdueLoading(true);
    setOverdueLoaded(false);

    try {
      const params = new URLSearchParams();
      params.set("memberId", overdueMemberId || "all");
      params.set("category", overdueCategory || "all");

      // backend minDays bekliyorsa:
      const min = (minOverdueDays ?? "").toString().trim();
      params.set("minDays", min !== "" ? min : "0");

      const url = `${API}/reports/overdue?${params.toString()}`;
      console.log("[OVERDUE] URL:", url);

      const res = await fetch(url);
      if (!res.ok) {
        console.error("[OVERDUE] failed:", res.status);
        setOverdueRows([]);
        return;
      }

      const data = await res.json();
      console.log("[OVERDUE] response sample:", data?.[0]);

      const rows = Array.isArray(data) ? data : (data?.data ?? []);
      setOverdueRows(rows);
    } catch (e) {
      console.error("fetchOverdue error:", e);
      setOverdueRows([]);
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

    try {
      const memberIds = members.map((m) =>
        String(m.id ?? m.UyeID ?? m.MemberID)
      );

      const all = await Promise.all(
        memberIds.map(async (id) => {
          const res = await fetch(`${API}/members/${id}/loans`);
          const data = res.ok ? await res.json() : [];
          return Array.isArray(data) ? data : [];
        })
      );

      let rows = all.flat().map((x) => ({
        bookName: x.bookName ?? x.Baslik ?? x.title ?? "-",
        author: x.author ?? x.Yazar ?? "-",
        category: x.category ?? x.KategoriAdi ?? "-",
        loanDate: (x.loanDate ?? x.OduncTarihi ?? x.tarih ?? "").slice(0, 10),
      }));

      // tarih filtresi
      rows = rows.filter((r) => {
        if (borrowStartDate && r.loanDate && r.loanDate < borrowStartDate)
          return false;
        if (borrowEndDate && r.loanDate && r.loanDate > borrowEndDate)
          return false;
        if (borrowCategory !== "all" && r.category !== borrowCategory)
          return false;
        return true;
      });

      // group by kitap
      const map = new Map();
      for (const r of rows) {
        const key = `${r.bookName}__${r.author}__${r.category}`;
        map.set(key, (map.get(key) || 0) + 1);
      }

      let list = Array.from(map.entries()).map(([key, count]) => {
        const [bookName, author, category] = key.split("__");
        return { bookName, author, category, count };
      });

      list.sort((a, b) => b.count - a.count);

      const lim = parseInt(topN, 10);
      if (!Number.isNaN(lim)) list = list.slice(0, lim);

      setMostRows(list);
    } catch (e) {
      console.error(e);
      setMostRows([]);
    } finally {
      setMostLoaded(true);
      setMostLoading(false);
    }
  };

  const clearMostBorrowed = () => {
    setBorrowStartDate("2024-12-01");
    setBorrowEndDate("2027-12-29");
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
  const tab2Avg = tab2Total
    ? Math.round(
        overdueRows.reduce((s, x) => s + (x.overdueDays || 0), 0) / tab2Total
      )
    : 0;
  const tab2Max = tab2Total
    ? Math.max(...overdueRows.map((x) => x.overdueDays || 0))
    : 0;

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
      exportXlsx("tarih_araligi_odunc.xlsx", "TarihAraligi", dateRows, cols);
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
      exportXlsx("geciken_kitaplar.xlsx", "Gecikenler", overdueRows, cols);
      return;
    }

    if (activeTab === "most-borrowed" && mostLoaded) {
      const cols = [
        { key: "bookName", label: "Kitap Adı" },
        { key: "author", label: "Yazar" },
        { key: "category", label: "Kategori" },
        { key: "count", label: "Ödünç Sayısı" },
      ];
      exportXlsx("en_cok_odunc_alinan.xlsx", "EnCokOdunc", mostRows, cols);
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
      exportPdfBlob(
        "tarih_araligi_odunc.pdf",
        "Tarih Aralığına Göre Ödünç Raporu",
        cols,
        dateRows
      );
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
        { key: "overdueDays", label: "Gecikme (gün)" },
      ];
      exportPdfBlob(
        "geciken_kitaplar.pdf",
        "Geciken Kitaplar Raporu",
        cols,
        overdueRows
      );
      return;
    }

    if (activeTab === "most-borrowed" && mostLoaded) {
      const cols = [
        { key: "bookName", label: "Kitap" },
        { key: "author", label: "Yazar" },
        { key: "category", label: "Kategori" },
        { key: "count", label: "Ödünç Sayısı" },
      ];
      exportPdfBlob(
        "en_cok_odunc_alinan.pdf",
        "En Çok Ödünç Alınan Kitaplar",
        cols,
        mostRows
      );
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

  const PaginationControls = () =>
    totalPages > 1 && (
      <div className="repPagination">
        <button
          className="repPageBtn"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
        >
          <ChevronLeft size={18} /> Geri
        </button>
        <span className="repPageInfo">
          Sayfa {currentPage} / {totalPages}
        </span>
        <button
          className="repPageBtn"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
        >
          İleri <ChevronRight size={18} />
        </button>
      </div>
    );

  // küçük: tab değişince scroll toparla
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  // dropdown verilerini yükle
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        // MEMBERS
        const mRes = await fetch(`${API}/members`);
        const mRaw = mRes.ok ? await mRes.json() : [];

        const mArr = Array.isArray(mRaw) ? mRaw : (mRaw?.data ?? []);
        console.log("RAW /members:", mRaw);
        console.log("FIRST MEMBER:", mArr?.[0]);

        const normalizedMembers = (Array.isArray(mArr) ? mArr : [])
          .map((m) => {
            const id = m.id ?? m.UyeID ?? m.uyeId ?? m.MemberID ?? m.memberId;
            const name =
              m.name ??
              m.AdSoyad ??
              m.adSoyad ??
              m.UyeAdi ??
              m.uyeAdi ??
              m.fullName ??
              // ✅ backend: ad + soyad
              [m.ad, m.soyad].filter(Boolean).join(" ");

            const studentNo =
              m.studentNo ??
              m.OgrenciNo ??
              m.ogrenciNo ??
              m.student_no ??
              m.StudentNo ??
              // ✅ backend: studentId
              m.studentId ??
              m.studentID;

            return {
              id: id != null ? String(id) : "",
              name: name ? String(name) : "-",
              studentNo: studentNo ? String(studentNo) : "-",
            };
          })
          .filter((m) => m.id);

        setMembers(normalizedMembers);

        // CATEGORIES
        const cRes = await fetch(`${API}/books/categories`);
        const cData = cRes.ok ? await cRes.json() : [];
        const names = Array.isArray(cData)
          ? [...new Set(cData.map((x) => x.KategoriAdi).filter(Boolean))]
          : [];
        setCategories(names);

        console.log("members normalized:", normalizedMembers);
      } catch (e) {
        console.error("Dropdown load error:", e);
        setMembers([]);
        setCategories([]);
      }
    };

    loadDropdowns();
  }, []);

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
                <div className="repHeadSub">
                  Tarih aralığına göre ödünç raporu
                </div>
              </div>
            </div>

            <div className="repForm">
              <div className="repField">
                <label>Başlangıç Tarihi</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="repField">
                <label>Bitiş Tarihi</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="repField">
                <label>Üye Seç (Opsiyonel)</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                >
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
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
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
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all">Hepsi</option>
                  <option value="returned">Teslim Edildi</option>
                  <option value="active">Teslim Edilmedi</option>
                  <option value="overdue">Gecikmiş</option>
                </select>
              </div>

              <div className="repActions">
                <button
                  className="repBtn primary cyan"
                  type="button"
                  onClick={fetchDateRange}
                  disabled={dateLoading}
                >
                  <Search size={16} />
                  {dateLoading ? "Getiriliyor..." : "Raporu Getir"}
                </button>

                <button
                  className="repBtn icon"
                  type="button"
                  onClick={clearDateRange}
                  title="Temizle"
                >
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
                  <div className="repHeadSub">
                    Üye, kitap, tarih ve durum bilgileri
                  </div>
                </div>

                {showExport && (
                  <div className="repExport">
                    <button
                      className="repBtn outline"
                      type="button"
                      onClick={exportExcel}
                    >
                      <FileSpreadsheet size={16} />
                      Excel İndir
                    </button>
                    <button
                      className="repBtn outline"
                      type="button"
                      onClick={exportPDF}
                    >
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
                      {paginatedData.map((r) => (
                        <tr key={r.id}>
                          <td className="textWhite">{r.memberName}</td>
                          <td className="textMuted">{r.studentNo}</td>
                          <td className="textSoft">{r.bookName}</td>
                          <td>
                            <span className="repBadge purple">
                              {r.category}
                            </span>
                          </td>
                          <td className="textMuted">{r.loanDate}</td>
                          <td className="textMuted">{r.dueDate}</td>
                          <td>
                            {r.status === "returned" && (
                              <span className="repBadge green">
                                Teslim Edildi
                              </span>
                            )}
                            {r.status === "active" && (
                              <span className="repBadge cyan">Aktif</span>
                            )}
                            {r.status === "overdue" && (
                              <span className="repBadge red">Gecikmiş</span>
                            )}
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
                  {totalPages > 1 && (
                    <div className="repPagination">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => prev - 1)}
                        className="repPageBtn"
                      >
                        Geri
                      </button>

                      <div className="repPageInfo">
                        <span>
                          Sayfa {currentPage} / {totalPages}
                        </span>
                      </div>

                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                        className="repPageBtn"
                      >
                        İleri
                      </button>
                    </div>
                  )}
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
                <select
                  value={overdueMemberId}
                  onChange={(e) => setOverdueMemberId(e.target.value)}
                >
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
                <select
                  value={overdueCategory}
                  onChange={(e) => setOverdueCategory(e.target.value)}
                >
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
                <button
                  className="repBtn primary red"
                  type="button"
                  onClick={fetchOverdue}
                  disabled={overdueLoading}
                >
                  <Search size={16} />
                  {overdueLoading ? "Getiriliyor..." : "Raporu Getir"}
                </button>

                <button
                  className="repBtn icon"
                  type="button"
                  onClick={clearOverdue}
                  title="Temizle"
                >
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
                  <div className="repHeadSub">
                    Son teslim tarihi geçmiş kayıtlar
                  </div>
                </div>

                {showExport && (
                  <div className="repExport">
                    <button
                      className="repBtn outline"
                      type="button"
                      onClick={exportExcel}
                    >
                      <FileSpreadsheet size={16} />
                      Excel İndir
                    </button>
                    <button
                      className="repBtn outline"
                      type="button"
                      onClick={exportPDF}
                    >
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
                              <span className="repBadge orange">
                                {r.overdueDays} gün
                              </span>
                            ) : (
                              <span className="repBadge red">
                                {r.overdueDays} gün
                              </span>
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
                <input
                  type="date"
                  value={borrowStartDate}
                  onChange={(e) => setBorrowStartDate(e.target.value)}
                />
              </div>

              <div className="repField">
                <label>Bitiş Tarihi</label>
                <input
                  type="date"
                  value={borrowEndDate}
                  onChange={(e) => setBorrowEndDate(e.target.value)}
                />
              </div>

              <div className="repField">
                <label>Kategori (Opsiyonel)</label>
                <select
                  value={borrowCategory}
                  onChange={(e) => setBorrowCategory(e.target.value)}
                >
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
                <button
                  className="repBtn primary purple"
                  type="button"
                  onClick={fetchMostBorrowed}
                  disabled={mostLoading}
                >
                  <Search size={16} />
                  {mostLoading ? "Getiriliyor..." : "Raporu Getir"}
                </button>

                <button
                  className="repBtn icon"
                  type="button"
                  onClick={clearMostBorrowed}
                  title="Temizle"
                >
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
                    const max =
                      Math.max(...mostRows.map((x) => x.count || 0)) || 1;
                    const pct = Math.round(((b.count || 0) / max) * 100);
                    return (
                      <div className="repBarRow" key={i}>
                        <div className="repBarLabel" title={b.bookName}>
                          {b.bookName}
                        </div>
                        <div className="repBarTrack">
                          <div
                            className="repBarFill"
                            style={{ width: `${pct}%` }}
                          />
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
                  <div className="repHeadTitle">
                    En Çok Ödünç Alınan Kitaplar
                  </div>
                  <div className="repHeadSub">COUNT ile sıralanmış liste</div>
                </div>

                {showExport && (
                  <div className="repExport">
                    <button
                      className="repBtn outline"
                      type="button"
                      onClick={exportExcel}
                    >
                      <FileSpreadsheet size={16} />
                      Excel İndir
                    </button>
                    <button
                      className="repBtn outline"
                      type="button"
                      onClick={exportPDF}
                    >
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
                            <span className="repBadge purple">
                              {r.category}
                            </span>
                          </td>
                          <td>
                            <span className="repBadge cyan strong">
                              {r.count}
                            </span>
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
