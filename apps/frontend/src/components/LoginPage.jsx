import { useMemo, useState } from "react";
import { BookOpen, Eye, EyeOff, Loader2 } from "lucide-react";
import "../pages/LoginPage.css";

export function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false); // ileride localStorage bağlanabilir
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL = "http://localhost:3000";

  // Giriş butonunun aktiflik durumu
  const canSubmit = useMemo(() => {
    return !!username.trim() && !!password && !isLoading;
  }, [username, password, isLoading]);

  // Giriş butonuna basıldığında çalışır
  const handleSubmit = async (e) => {
    e.preventDefault(); // Formun sayfayı yenilemesini engeller
    setError("");
    setIsLoading(true);

    try {
      console.log("GİRİŞ GÖNDERİLEN VERİ =>", {
        kullaniciAdi: username.trim(),
        sifre: password,
      });

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kullaniciAdi: username.trim(),
          sifre: password,
        }),
      });

      if (!res.ok) {
        // Backend UnauthorizedException → 401
        if (res.status === 401) {
          throw new Error("Kullanıcı adı veya şifre hatalı");
        }
        throw new Error("Giriş işlemi başarısız");
      }

      const data = await res.json();
      // data: { personelId, kullaniciAdi, rol, adSoyad }

      onLogin({
        name: data.adSoyad,
        role: data.rol,
      });

    } catch (error) {
      setError(error?.message || "Beklenmeyen bir hata oluştu");
      setIsLoading(false);
    }
  };

  return (
    <div className="loginPage">
      <div className="loginBg" aria-hidden="true">
        <span className="blob blobCyan" />
        <span className="blob blobPurple" />
        <span className="gridNoise" />
      </div>

      <div className="loginWrap">
        <div className="loginCard" role="region" aria-label="Giriş Kartı">
          <div className="logoArea">
            <div className="logo">
              <BookOpen size={28} />
            </div>
            <h1 className="title">UniLib Yönetim Sistemi</h1>
            <p className="subtitle">Admin / Personel Girişi</p>
          </div>

          <form onSubmit={handleSubmit} className="form">
            <div className="field">
              <label className="label" htmlFor="username">
                Kullanıcı Adı
              </label>
              <input
                id="username"
                className="input"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Kullanıcı adınızı girin"
                disabled={isLoading}
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="password">
                Şifre
              </label>

              <div className="passwordWrap">
                <input
                  id="password"
                  className="input"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Şifrenizi girin"
                  disabled={isLoading}
                />

                <button
                  type="button"
                  className="eyeBtn"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="errorBox" role="alert">
                {error}
              </div>
            )}

            <button className="submitBtn" type="submit" disabled={!canSubmit}>
              {isLoading ? (
                <>
                  <Loader2 className="spin" size={18} />
                  Giriş yapılıyor...
                </>
              ) : (
                "Giriş Yap"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
