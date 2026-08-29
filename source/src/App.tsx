import { CrystalCubScene } from "./CrystalCubScene";
import { DirepxWordmark } from "./DirepxWordmark";

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-business-summary" aria-label="direpx 사업자 정보">
          <span>디렙엑스(Direpx)</span>
          <span>대표 김준엽·황휘성</span>
          <span>사업자등록번호 243-06-03760</span>
          <a href="mailto:direpx@gmail.com">direpx@gmail.com</a>
        </div>

        <div className="footer-meta">
          <span>© 2026 direpx</span>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <main className="direpx-page">
      <section className="brand-stage" aria-label="Direpx interactive mascot landing page">
        <div className="canvas-shell">
          <CrystalCubScene />
        </div>

        <DirepxWordmark />

        <nav className="stores" aria-label="앱 다운로드 링크">
          <a className="store-link" href="#app-store">
            App Store
          </a>
          <a className="store-link" href="#google-play">
            Google Play
          </a>
        </nav>
      </section>

      <SiteFooter />
    </main>
  );
}
