import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Activity, Cpu, Layers, RadioTower, ShieldCheck, Star } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useEffect, useLayoutEffect, useState } from 'react';
import { Background } from './components/Background';
import { ExperienceCanvas } from './components/ExperienceCanvas';
import { KineticText } from './components/KineticText';
import { LoadingScreen } from './components/LoadingScreen';
import { assetPath } from './constants';
import { pickInitialEveningStarVariant } from './variants';

gsap.registerPlugin(ScrollTrigger);

const featureCards = [
  {
    icon: Cpu,
    label: 'Core board',
    copy: 'A product-first view of the Evening Star PCB, framed for inspection instead of decoration.'
  },
  {
    icon: RadioTower,
    label: 'Signal field',
    copy: 'Animated traces and variant-tuned cloud motion keep the page tied to electronics and telemetry.'
  },
  {
    icon: ShieldCheck,
    label: 'Assured flow',
    copy: 'Pinned deployment, typed source, browser checks, and dependency tracking are built in.'
  }
];

const initialVariant = pickInitialEveningStarVariant();

type ThemeStyle = CSSProperties & Record<`--${string}`, string>;

function App() {
  const [variant] = useState(initialVariant);
  const [modelReady, setModelReady] = useState(false);
  const stats = [
    ['01', 'Interactive GLB'],
    ['02', `${variant.label} PCB`],
    ['03', 'HDR-lit product stage']
  ];

  useEffect(() => {
    const favicon =
      document.querySelector<HTMLLinkElement>('link[rel~="icon"]') ??
      document.head.appendChild(document.createElement('link'));
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

    favicon.rel = 'icon';
    favicon.type = 'image/svg+xml';
    favicon.href = assetPath(`favicons/favicon-${variant.id}.svg`);

    if (themeColor) {
      themeColor.content = variant.fog;
    }
  }, [variant]);

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.reveal-block').forEach((element) => {
        gsap.fromTo(
          element,
          { autoAlpha: 0, y: 34 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: element,
              start: 'top 82%'
            }
          }
        );
      });

      gsap.utils.toArray<HTMLElement>('.kinetic-text__char').forEach((character) => {
        gsap.fromTo(
          character,
          { yPercent: 18 },
          {
            yPercent: -12,
            ease: 'none',
            scrollTrigger: {
              trigger: character.closest('section') ?? character,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true
            }
          }
        );
      });
    });

    return () => context.revert();
  }, []);

  return (
    <div className="theme-root" data-variant={variant.id} style={variant.cssVariables as ThemeStyle}>
      <Background />
      <ExperienceCanvas onReady={() => setModelReady(true)} variant={variant} />
      <LoadingScreen ready={modelReady} />

      <main className="page-shell">
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="site-mark">CIA</div>
          <div className="hero-section__copy reveal-block">
            <p className="eyebrow">PCB DISPLAY / CONTROLLED INTELLIGENCE AVIONICS</p>
            <h1 id="hero-title" className="hero-heading" aria-label="Evening Star">
              <KineticText as="span" className="hero-title" text="Evening" />
              <span className="hero-heading__line hero-heading__line--star">
                <KineticText as="span" className="hero-title hero-title--second" outline text="Star" />
                <span className="hero-heading__star-mark" aria-hidden="true">
                  <Star className="hero-heading__star" strokeWidth={2.15} />
                </span>
              </span>
            </h1>
            <p className="hero-section__body">
              A scrolling product stage for the Evening Star PCB, with the board model held at the center of the
              experience and the interface built around motion, depth, and inspection.
            </p>
            <ul className="stat-strip" aria-label="Project highlights">
              {stats.map(([value, label]) => (
                <li className="stat-strip__item" key={label}>
                  <span>{value}</span>
                  <strong>{label}</strong>
                </li>
              ))}
            </ul>
          </div>
          <div className="scroll-cue" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </section>

        <section className="statement-section" aria-labelledby="statement-title">
          <div className="statement-section__copy reveal-block">
            <div className="crosshair" aria-hidden="true" />
            <p className="eyebrow">MODEL-LED PRODUCT PAGE</p>
            <h2 id="statement-title">
              <span>PCB presence,</span>
              <span>not a static render</span>
            </h2>
            <p>
              The model responds to pointer movement in the first viewport, then shifts with the page as the copy moves
              through the product story. Each page load picks a PCB colorway and tunes the surrounding circuit-cloud
              field to match it.
            </p>
          </div>
        </section>

        <section className="feature-section" aria-labelledby="feature-title">
          <div className="feature-section__copy reveal-block">
            <p className="eyebrow">EVENING STAR / FIRST ITERATION</p>
            <h2 id="feature-title">Focused single-page display</h2>
            <p>
              This first pass keeps the site deliberately direct: no navigation, no marketing detour, just the board,
              the brand mark, and a set of production checks ready for GitHub Pages.
            </p>
          </div>

          <div className="feature-grid reveal-block">
            {featureCards.map(({ icon: Icon, label, copy }) => (
              <article className="feature-card" key={label}>
                <Icon aria-hidden="true" size={24} strokeWidth={1.8} />
                <h3>{label}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="inspection-section" aria-labelledby="inspection-title">
          <div className="inspection-section__copy reveal-block">
            <div className="inspection-section__header">
              <Activity aria-hidden="true" size={28} strokeWidth={1.8} />
              <p className="eyebrow">DEPLOYMENT SIGNAL</p>
            </div>
            <h2 id="inspection-title">Built to ship cleanly</h2>
            <p>
              The repository includes typed builds, linting, browser rendering checks, pinned Pages actions, and
              Dependabot updates for npm and workflow dependencies.
            </p>
          </div>
          <ul className="inspection-rail reveal-block" aria-label="Implementation notes">
            <li>
              <Layers aria-hidden="true" size={22} strokeWidth={1.8} />
              <span>React / Vite / Three</span>
            </li>
            <li>
              <Cpu aria-hidden="true" size={22} strokeWidth={1.8} />
              <span>GLB + HDR public assets</span>
            </li>
            <li>
              <ShieldCheck aria-hidden="true" size={22} strokeWidth={1.8} />
              <span>Pages workflow pinned by SHA</span>
            </li>
          </ul>
        </section>

        <footer className="site-footer">
          <p>CIA</p>
          <KineticText as="strong" text="Evening Star" />
        </footer>
      </main>
    </div>
  );
}

export default App;
