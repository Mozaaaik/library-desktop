import { useEffect, useState } from "react";
import "../pages/DynamicQueryPage.css";

import {
  Search,
  X,
  Filter,
  FileSpreadsheet,
  FileText,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Loader,
} from "lucide-react";
import { toast } from "sonner";

const API = "http://localhost:3000";

/** CSV helpers */
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

export function DynamicQueryPage() {
  // Filters
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // Sorting
  const [sortBy, setSortBy] = useState("Baslik"); // Baslik | Yazar | Yayinevi | ISBN | MevcutAdet
  const [sortOrder, setSortOrder] = useState("asc"); // asc | desc

  // Categories
  const [categories, setCategories] = useState([]);

  // Results
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/books/categories`);
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) setCategories(data);
      } catch {
        // sessiz geç
      }
    })();
  }, []);

  const toggleSortOrder = () =>
    setSortOrder((p) => (p === "asc" ? "desc" : "asc"));

  const executeQuery = async () => {
    setIsLoading(true);
    setHasSearched(false);

    const qs = new URLSearchParams();
    if (title.trim()) qs.set("title", title.trim());
    if (author.trim()) qs.set("author", author.trim());
    if (categoryId !== "all") qs.set("categoryId", categoryId);
    if (onlyAvailable) qs.set("onlyAvailable", "true");
    if (sortBy) qs.set("sortBy", sortBy);
    if (sortOrder) qs.set("sortOrder", sortOrder);

    try {
      const res = await fetch(`${API}/books/dynamic-search?${qs.toString()}`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "İstek başarısız");
      }
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      setResults(arr);
      setCurrentPage(1);
      toast.success(`${arr.length} kitap bulundu`);
    } catch (e) {
      toast.error(
        "Dinamik sorgu endpointi yok / hata var. Backend’i kontrol et."
      );
      setResults([]);
    } finally {
      setIsLoading(false);
      setHasSearched(true);
    }
  };

  const clearFilters = () => {
    setTitle("");
    setAuthor("");
    setCategoryId("all");
    setOnlyAvailable(false);
    setSortBy("Baslik");
    setSortOrder("asc");
    setResults([]);
    setHasSearched(false);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(results.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResults = results.slice(startIndex, endIndex);

  const exportToExcel = () => {
    if (!hasSearched) return toast.error("Önce sorguyu çalıştır.");
    const cols = [
      { key: "Baslik", label: "Kitap Adı" },
      { key: "Yazar", label: "Yazar" },
      { key: "KategoriAdi", label: "Kategori" },
      { key: "Yayinevi", label: "Yayınevi" },
      { key: "ISBN", label: "ISBN" },
      { key: "MevcutAdet", label: "Mevcut Adet" },
    ];

    const csvContent = toCsv(results, cols);
    const BOM = "\uFEFF"; // Excel'in Türkçe karakterleri tanıması için şart

    downloadBlob(
      "kitap_raporu.csv",
      BOM + csvContent,
      "text/csv;charset=utf-8"
    );
    toast.success("Excel indiriliyor ✅");
  };

  const exportToPDF = () => {
    if (!hasSearched) return toast.error("Önce sorguyu çalıştır.");
    const cols = [
      { key: "Baslik", label: "Kitap Adı" },
      { key: "Yazar", label: "Yazar" },
      { key: "KategoriAdi", label: "Kategori" },
      { key: "MevcutAdet", label: "Adet" },
    ];
    printTablePdf("Kitap Sorgu Sonuçları", cols, results);
  };

  const canExport = hasSearched && results.length > 0;

  return (
    <div className="dq-page">
      {/* ✅ PageHeader yerine native header */}
      <div className="dq-header">
        <div className="dq-breadcrumbs">
          <span>Ana Sayfa</span>
          <span className="dq-sep">/</span>
          <span className="dq-bc-active">Dinamik Sorgu</span>
        </div>

        <div className="dq-headerRow">
          <div>
            <h1 className="dq-title">Dinamik Sorgu</h1>
            <p className="dq-desc">
              Kitap arama ve listeleme için gelişmiş parametrik sorgu
            </p>
          </div>
        </div>
      </div>

      <div className="dq-grid">
        {/* Left */}
        <div className="dq-left">
          <div className="dq-card dq-card--sticky">
            <div className="dq-card__title">
              <Filter className="dq-icon dq-icon--cyan" />
              <h3>Filtreler</h3>
            </div>

            <div className="dq-form">
              <div className="dq-field">
                <label className="dq-label">Kitap Adı</label>
                <input
                  className="dq-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Clean Code..."
                />
              </div>

              <div className="dq-field">
                <label className="dq-label">Yazar</label>
                <input
                  className="dq-input"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Robert C. Martin..."
                />
              </div>

              <div className="dq-field">
                <label className="dq-label">Kategori</label>
                <select
                  className="dq-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="all">Tüm Kategoriler</option>
                  {categories.map((c) => (
                    <option key={c.KategoriID} value={String(c.KategoriID)}>
                      {c.KategoriAdi}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dq-checkboxRow">
                <input
                  id="onlyAvailable"
                  type="checkbox"
                  className="dq-checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                />
                <label htmlFor="onlyAvailable" className="dq-checkboxLabel">
                  Sadece mevcut kitaplar (MevcutAdet &gt; 0)
                </label>
              </div>

              <div className="dq-divider" />

              <div className="dq-field">
                <label className="dq-label">Sıralama</label>
                <select
                  className="dq-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="Baslik">Kitap Adı</option>
                  <option value="Yazar">Yazar</option>
                  <option value="Yayinevi">Yayınevi</option>
                  <option value="ISBN">ISBN</option>
                  <option value="MevcutAdet">Mevcut Adet</option>
                </select>

                <button
                  type="button"
                  className="dq-btn dq-btn--ghost"
                  onClick={toggleSortOrder}
                >
                  <ArrowUpDown className="dq-icon" />
                  {sortOrder === "asc" ? "Artan" : "Azalan"}
                </button>
              </div>

              <div className="dq-actions">
                <button
                  type="button"
                  className="dq-btn dq-btn--primary"
                  onClick={executeQuery}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader className="dq-icon dq-spin" />
                      Sorgulanıyor...
                    </>
                  ) : (
                    <>
                      <Search className="dq-icon" />
                      Sorguyu Çalıştır
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="dq-btn dq-btn--icon"
                  onClick={clearFilters}
                  title="Temizle"
                >
                  <X className="dq-icon" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="dq-right">
          <div className="dq-card dq-resultsCard">
            <div className="dq-resultsHeader">
              <div className="dq-resultsHeaderLeft">
                <h3>Sonuçlar</h3>
                {hasSearched && (
                  <p className="dq-subText">
                    Bulunan sonuç:{" "}
                    <span className="dq-accent">{results.length}</span>
                  </p>
                )}
              </div>

              {canExport && (
                <div className="dq-export">
                  <button
                    type="button"
                    className="dq-btn dq-btn--export dq-btn--excel"
                    onClick={exportToExcel}
                  >
                    <FileSpreadsheet className="dq-icon" />
                    Excel İndir
                  </button>
                  <button
                    type="button"
                    className="dq-btn dq-btn--export dq-btn--pdf"
                    onClick={exportToPDF}
                  >
                    <FileText className="dq-icon" />
                    PDF İndir
                  </button>
                </div>
              )}
            </div>

            <div className="dq-resultsBody">
              {!hasSearched && !isLoading ? (
                <div className="dq-empty">
                  <Search className="dq-emptyIcon" />
                  <p>Filtre girip sorguyu çalıştırın</p>
                </div>
              ) : isLoading ? (
                <div className="dq-skeletonWrap">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="dq-skeletonRow" />
                  ))}
                </div>
              ) : results.length === 0 ? (
                <div className="dq-empty">
                  <Search className="dq-emptyIcon" />
                  <p>Sonuç bulunamadı</p>
                </div>
              ) : (
                <>
                  <div className="dq-tableWrap">
                    <table className="dq-table">
                      <thead>
                        <tr>
                          <th>Kitap Adı</th>
                          <th>Yazar</th>
                          <th>Kategori</th>
                          <th>Yayınevi</th>
                          <th>ISBN</th>
                          <th>Toplam</th>
                          <th>Mevcut</th>
                        </tr>
                      </thead>

                      <tbody>
                        {currentResults.map((book) => (
                          <tr key={book.KitapID}>
                            {/* bookName değil, Baslik kullanıyoruz */}
                            <td className="dq-tdTitle">{book.Baslik}</td>
                            <td>{book.Yazar || "-"}</td>
                            <td>
                              <span className="dq-badge dq-badge--purple">
                                {book.KategoriAdi || "-"}
                              </span>
                            </td>
                            <td>{book.Yayinevi || "-"}</td>
                            <td className="dq-mono">{book.ISBN || "-"}</td>
                            <td>{book.ToplamAdet ?? "-"}</td>
                            <td>
                              {Number(book.MevcutAdet) > 0 ? (
                                <span className="dq-badge dq-badge--green">
                                  {book.MevcutAdet} Adet
                                </span>
                              ) : (
                                <span className="dq-badge dq-badge--red">
                                  Yok
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="dq-pagination">
                      <div className="dq-subText">
                        Sayfa {currentPage} / {totalPages}
                      </div>

                      <div className="dq-pageBtns">
                        <button
                          type="button"
                          className="dq-btn dq-btn--icon"
                          onClick={() =>
                            setCurrentPage(Math.max(1, currentPage - 1))
                          }
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="dq-icon" />
                        </button>

                        <button
                          type="button"
                          className="dq-btn dq-btn--icon"
                          onClick={() =>
                            setCurrentPage(
                              Math.min(totalPages, currentPage + 1)
                            )
                          }
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="dq-icon" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
