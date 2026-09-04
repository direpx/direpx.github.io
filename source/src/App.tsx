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
          <span>direpx@gmail.com</span>
        </div>
        <div className="footer-meta">
          <a href="/privacy/">Privacy</a>
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
          <a
            className="store-link"
            href="https://apps.apple.com/us/app/direpx-%EB%94%94%EB%A0%99%EC%97%91%EC%8A%A4/id6754797035"
            target="_blank"
            rel="noreferrer"
            aria-label="App Store에서 Direpx 다운로드 (새 탭)"
          >
            App Store
          </a>
          <a
            className="store-link"
            href="https://play.google.com/store/apps/details?id=com.Direp.DirepApp&hl=ko"
            target="_blank"
            rel="noreferrer"
            aria-label="Google Play에서 Direpx 다운로드 (새 탭)"
          >
            Google Play
          </a>
        </nav>
        <a
          className="contact-link"
          href="https://forms.gle/RE6j43gTQNJ13XT29"
          target="_blank"
          rel="noreferrer"
          aria-label="Google Form으로 문의하기 (새 탭)"
        >
          Contact
        </a>
      </section>
      <SiteFooter />
    </main>
  );
}
