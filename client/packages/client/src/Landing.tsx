import { For, Show, createSignal } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { Titlebar } from "@revolt/app/interface/desktop/Titlebar";
import { useClientLifecycle } from "@revolt/client";
import { Navigate } from "@revolt/routing";

/* ── Полдень ────────────────────────────────────────────────────────
 *
 * Literals, not var(--md-sys-color-*): nobody is logged in here, so there is
 * no theme to read. These track the light ramps pinned in materialTheme.ts.
 *
 * Blue is the smallest channel in every neutral. That is the rule the app's
 * palette is built on — a warm shell keeps the signal red reading as red
 * rather than pink.
 */
const PAPER = "#FBF9F7";
const PAPER_2 = "#F1EDE8";
const INK = "#121110";
const INK_2 = "#1E1C1A";
const SIGNAL = "#E00A45";
const SIGNAL_DEEP = "#C00538";
const LIVE = "#00C48C";
const TEXT = "#1A1815";
const TEXT_2 = "#57534C";
const TEXT_3 = "#8A8479";
const LINE = "rgba(26,24,21,0.10)";
const LINE_INK = "rgba(251,249,247,0.14)";

const DOWNLOAD_WIN =
  "https://github.com/Leonid1095/PLGames-Voice/releases/latest/download/plg-voice-desktop-setup.exe";
const DOWNLOAD_LINUX =
  "https://github.com/Leonid1095/PLGames-Voice/releases/latest/download/PLG-Voice-linux-x64-2.0.0.zip";

/* Condensed capitals. The page's whole personality sits here, so it is worth
   stating once and reusing rather than re-typing per component. */
const DISPLAY = {
  fontFamily: "var(--pd-font-display)",
  fontVariationSettings: '"wght" 700, "wdth" var(--pd-display-wdth)',
  fontWeight: 700,
  textTransform: "uppercase",
  lineHeight: 0.92,
  letterSpacing: "0.005em",
} as const;

/* Mono, uppercase, widely tracked — the broadcast-overlay register this
   audience already reads in tournament streams. Used for every label, count
   and caption on the page, and nowhere else. */
const LABEL = {
  fontFamily: "var(--pd-font-mono)",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  fontWeight: 400,
} as const;

/* ── Logo ─────────────────────────────────────────── */

function Logo() {
  return (
    <LogoRow>
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <rect width="26" height="26" rx="7" fill={SIGNAL} />
        <g fill={PAPER}>
          <rect x="6" y="11" width="2.5" height="4" rx="1.25" />
          <rect x="10" y="8" width="2.5" height="10" rx="1.25" />
          <rect x="14" y="6" width="2.5" height="14" rx="1.25" />
          <rect x="18" y="10" width="2.5" height="6" rx="1.25" />
        </g>
      </svg>
      <LogoWord>
        PLG<b>VOICE</b>
      </LogoWord>
    </LogoRow>
  );
}

const LogoRow = styled("a", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none",
    color: TEXT,
    flexShrink: 0,
  },
});

const LogoWord = styled("span", {
  base: {
    ...DISPLAY,
    fontSize: "22px",
    letterSpacing: "0.02em",
    color: TEXT_3,
    "& b": { color: TEXT, fontWeight: 700 },
  },
});

/* ── The signature: a voice room, alive ──────────────
 *
 * The hero of a voice product should be a voice room, not an illustration of
 * one. This is the real object — roster, who is talking, what the connection
 * costs — rendered at rest so it can be read in a screenshot and animated so
 * it reads as live in the browser.
 *
 * The bars are .pd-meter from polden.css, the same component the app uses
 * beside a speaking user. Someone arriving from this page meets it again
 * five minutes later inside the product.
 */
const ROOM = [
  { name: "Колдун", ping: "11", speaking: true },
  { name: "Нерзул", ping: "14", speaking: false },
  { name: "Гром", ping: "9", speaking: true },
  { name: "Лия", ping: "23", speaking: false },
];

function VoiceRoom() {
  return (
    <RoomCard aria-hidden="true">
      <RoomHead>
        <RoomTitle>#&nbsp;РЕЙД</RoomTitle>
        <RoomLive>
          <LiveDot />
          <span>В ЭФИРЕ</span>
        </RoomLive>
      </RoomHead>

      <For each={ROOM}>
        {(member) => (
          <RoomRow speaking={member.speaking}>
            <RoomAvatar speaking={member.speaking}>
              {member.name.slice(0, 1)}
            </RoomAvatar>
            <RoomName>{member.name}</RoomName>
            <Show when={member.speaking}>
              <div class="pd-meter pd-meter--sm">
                <i />
                <i />
                <i />
                <i />
              </div>
            </Show>
            <RoomPing>{member.ping} ms</RoomPing>
          </RoomRow>
        )}
      </For>

      <RoomFoot>
        <RoomFootLabel>4 В ГОЛОСЕ</RoomFootLabel>
        <RoomFootLabel>KRISP ВКЛ</RoomFootLabel>
      </RoomFoot>
    </RoomCard>
  );
}

const RoomCard = styled("div", {
  base: {
    background: "#FFFFFF",
    border: `1px solid ${LINE}`,
    borderRadius: "18px",
    padding: "18px",
    width: "100%",
    maxWidth: "420px",
    /* A real shadow, not a tint: this card is the one object on the page
       allowed to sit above the paper. */
    boxShadow: "0 40px 80px -32px rgba(26,24,21,0.35)",
    display: "flex",
    flexDirection: "column",
    gap: "4px",

    animationName: "fadeSlideUp",
    animationDuration: "0.6s",
    animationTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
    animationFillMode: "both",
    animationDelay: "0.1s",

    lg: {
      /* Off-axis on desktop only. The tilt is what stops the page reading as
         a centred template; on a phone it would just look broken. */
      transform: "rotate(-1.6deg)",
    },
  },
});

const RoomHead = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "12px",
    marginBottom: "6px",
    borderBottom: `1px solid ${LINE}`,
  },
});

const RoomTitle = styled("span", { base: { ...LABEL, color: TEXT_2 } });

const RoomLive = styled("span", {
  base: { ...LABEL, color: LIVE, display: "flex", alignItems: "center", gap: "7px" },
});

const LiveDot = styled("i", {
  base: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: LIVE,
    flexShrink: 0,
  },
});

const RoomRow = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    padding: "9px 10px",
    borderRadius: "11px",
  },
  variants: {
    speaking: {
      true: { background: PAPER_2 },
      false: {},
    },
  },
});

const RoomAvatar = styled("span", {
  base: {
    width: "30px",
    height: "30px",
    borderRadius: "10px",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    background: "#DED8CF",
    color: TEXT_2,
    fontSize: "13px",
    fontWeight: 600,
  },
  variants: {
    speaking: {
      /* Jade, never the accent. In this product "someone is talking" and
         "this is a button" are not allowed to be the same colour. */
      true: { boxShadow: `0 0 0 2px #FFFFFF, 0 0 0 4px ${LIVE}` },
      false: {},
    },
  },
});

const RoomName = styled("span", {
  base: { flexGrow: 1, minWidth: 0, fontSize: "14px", fontWeight: 600, color: TEXT },
});

const RoomPing = styled("span", {
  base: {
    fontFamily: "var(--pd-font-mono)",
    fontSize: "11px",
    fontVariantNumeric: "tabular-nums",
    color: TEXT_3,
    flexShrink: 0,
  },
});

const RoomFoot = styled("div", {
  base: {
    display: "flex",
    gap: "16px",
    paddingTop: "12px",
    marginTop: "6px",
    borderTop: `1px solid ${LINE}`,
  },
});

const RoomFootLabel = styled("span", { base: { ...LABEL, color: TEXT_3 } });

/* ── Page ─────────────────────────────────────────── */

export default function LandingPage() {
  const { isLoggedIn } = useClientLifecycle();
  const [menuOpen, setMenuOpen] = createSignal(false);

  return (
    <Show when={!isLoggedIn()} fallback={<Navigate href="/" />}>
      <Titlebar />
      <Page>
        <Nav>
          <Logo />
          <NavButtons>
            <NavLink href={DOWNLOAD_WIN} target="_blank">
              Windows
            </NavLink>
            <NavLink href={DOWNLOAD_LINUX} target="_blank">
              Linux
            </NavLink>
            <BtnGhost href="/login">
              <Trans>Log in</Trans>
            </BtnGhost>
            <BtnPrimary href="/login/create">
              <Trans>Sign up</Trans>
            </BtnPrimary>
          </NavButtons>
          <BurgerButton
            onClick={() => setMenuOpen(!menuOpen())}
            aria-expanded={menuOpen()}
          >
            {menuOpen() ? "✕" : "☰"}
          </BurgerButton>
        </Nav>

        <Show when={menuOpen()}>
          <MobileMenu>
            <BtnPrimary href="/login/create">
              <Trans>Sign up</Trans>
            </BtnPrimary>
            <BtnGhost href="/login">
              <Trans>Log in</Trans>
            </BtnGhost>
            <NavLink href={DOWNLOAD_WIN} target="_blank">
              Windows
            </NavLink>
            <NavLink href={DOWNLOAD_LINUX} target="_blank">
              Linux
            </NavLink>
          </MobileMenu>
        </Show>

        {/* ── Hero ── */}
        <Hero>
          <HeroLeft>
            <Eyebrow>
              <Trans>Voice, text and servers</Trans>
            </Eyebrow>
            <HeroTitle>
              <Trans>Your crew.</Trans>
              <br />
              <em>
                <Trans>One room.</Trans>
              </em>
            </HeroTitle>
            <HeroSubtitle>
              <Trans>
                Bring the whole raid into one place and hear every call. Free,
                with no cap on how many people you bring.
              </Trans>
            </HeroSubtitle>
            <HeroCTA>
              <BtnPrimary href="/login/create" data-large>
                <Trans>Create a server</Trans>
              </BtnPrimary>
              <BtnOutline href="/login">
                <Trans>I already have an account</Trans>
              </BtnOutline>
            </HeroCTA>
          </HeroLeft>

          <HeroRight>
            <VoiceRoom />
          </HeroRight>
        </Hero>

        {/* ── Ticker ──
            Product facts, deliberately not live counters: a landing page
            should not invent numbers it cannot stand behind. */}
        <Ticker aria-hidden="true">
          <TickerTrack>
            <For each={[0, 1]}>
              {() => (
                <TickerRun>
                  <b>KRISP</b> шумодав
                  <s />
                  <b>1080p60</b> стримы
                  <s />
                  <b>40</b> человек в голосе
                  <s />
                  <b>СВОИ</b> роли и права
                  <s />
                  <b>БЕЗ</b> платных стен
                  <s />
                  <b>ОТКРЫТЫЙ</b> исходный код
                  <s />
                </TickerRun>
              )}
            </For>
          </TickerTrack>
        </Ticker>

        {/* ── Ink band ── */}
        <Band>
          <BandHead>
            <BandEyebrow>
              <Trans>Built for the way you actually play</Trans>
            </BandEyebrow>
            <BandTitle>
              <Trans>Nothing between you and the call</Trans>
            </BandTitle>
          </BandHead>

          <BandGrid>
            <BandItem data-wide>
              <BandItemTitle>
                <Trans>Voice that holds</Trans>
              </BandItemTitle>
              <BandItemText>
                <Trans>
                  Low-latency channels with noise suppression built in. Keyboard
                  clatter and fan noise drop out; the call stays up when the
                  boss does.
                </Trans>
              </BandItemText>
              <BandMeter class="pd-meter pd-meter--lg" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </BandMeter>
            </BandItem>

            <BandItem>
              <BandItemTitle>
                <Trans>See who is on what</Trans>
              </BandItemTitle>
              <BandItemText>
                <Trans>
                  The client picks up the game you launched and shows it next to
                  your name, so people know what they are joining.
                </Trans>
              </BandItemText>
            </BandItem>

            <BandItem>
              <BandItemTitle>
                <Trans>Moderation included</Trans>
              </BandItemTitle>
              <BandItemText>
                <Trans>
                  Roles, permissions, automod and an audit log ship with the
                  server. Nothing to buy, nothing to bolt on.
                </Trans>
              </BandItemText>
            </BandItem>

            <BandItem data-wide>
              <BandItemTitle>
                <Trans>Stream to the room</Trans>
              </BandItemTitle>
              <BandItemText>
                <Trans>
                  Share a screen at 1080p60 or run a full broadcast into the
                  channel. Recordings stay on your own server.
                </Trans>
              </BandItemText>
            </BandItem>
          </BandGrid>
        </Band>

        {/* ── Install ── */}
        <Install>
          <SectionEyebrow>
            <Trans>On your phone</Trans>
          </SectionEyebrow>
          <SectionTitle>
            <Trans>Install it in four taps</Trans>
          </SectionTitle>

          <InstallCards>
            <InstallCard>
              <InstallCardTitle>Android — Chrome</InstallCardTitle>
              <InstallStep>
                <StepNum>1</StepNum>
                <Trans>Open plgames-voice.ru in Chrome</Trans>
              </InstallStep>
              <InstallStep>
                <StepNum>2</StepNum>
                <Trans>Tap the menu (three dots) at the top right</Trans>
              </InstallStep>
              <InstallStep>
                <StepNum>3</StepNum>
                <Trans>Tap "Install app" or "Add to Home screen"</Trans>
              </InstallStep>
              <InstallStep>
                <StepNum>4</StepNum>
                <Trans>PLG Voice will appear as a native app on your phone</Trans>
              </InstallStep>
            </InstallCard>

            <InstallCard>
              <InstallCardTitle>iPhone — Safari</InstallCardTitle>
              <InstallStep>
                <StepNum>1</StepNum>
                <Trans>Open plgames-voice.ru in Safari</Trans>
              </InstallStep>
              <InstallStep>
                <StepNum>2</StepNum>
                <Trans>Tap the Share button (square with arrow)</Trans>
              </InstallStep>
              <InstallStep>
                <StepNum>3</StepNum>
                <Trans>Scroll down and tap "Add to Home Screen"</Trans>
              </InstallStep>
              <InstallStep>
                <StepNum>4</StepNum>
                <Trans>PLG Voice will open full-screen like a native app</Trans>
              </InstallStep>
            </InstallCard>
          </InstallCards>
        </Install>

        {/* ── Close ── */}
        <Close>
          <CloseTitle>
            <Trans>Get the crew in</Trans>
          </CloseTitle>
          <BtnPrimary href="/login/create" data-large data-invert>
            <Trans>Create a server</Trans>
          </BtnPrimary>
        </Close>

        <Footer>
          <span>PLG Voice</span>
          <span>plgames-voice.ru</span>
        </Footer>
      </Page>
    </Show>
  );
}

/* ── Shell ────────────────────────────────────────── */

const Page = styled("div", {
  base: {
    width: "100%",
    height: "100%",
    overflowY: "auto",
    overflowX: "hidden",
    background: PAPER,
    color: TEXT,
    fontFamily: "var(--pd-font-sans)",
    letterSpacing: "var(--pd-tracking-snug)",
  },
});

const Nav = styled("nav", {
  base: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    padding: "16px 20px",
    background: "rgba(251,249,247,0.85)",
    backdropFilter: "var(--pd-glass-blur)",
    WebkitBackdropFilter: "var(--pd-glass-blur)",
    borderBottom: `1px solid ${LINE}`,
    md: { padding: "18px 40px" },
  },
});

const NavButtons = styled("div", {
  base: { display: "none", alignItems: "center", gap: "8px", md: { display: "flex" } },
});

const NavLink = styled("a", {
  base: {
    ...LABEL,
    color: TEXT_2,
    textDecoration: "none",
    padding: "10px 12px",
    borderRadius: "10px",
    transition: "color var(--pd-transition-fast), background var(--pd-transition-fast)",
    _hover: { color: TEXT, background: PAPER_2 },
  },
});

const BurgerButton = styled("button", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "42px",
    height: "42px",
    background: "transparent",
    border: `1px solid ${LINE}`,
    borderRadius: "12px",
    cursor: "pointer",
    color: TEXT,
    fontSize: "18px",
    md: { display: "none" },
  },
});

const MobileMenu = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "16px 20px 20px",
    background: PAPER,
    borderBottom: `1px solid ${LINE}`,
    md: { display: "none" },
  },
});

/* ── Buttons ──
 *
 * One shape, three weights. The labels are condensed capitals like every
 * other piece of chrome, which is what stops them reading as the default
 * rounded rectangle they replaced.
 */
const buttonBase = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "13px 22px",
  borderRadius: "12px",
  textDecoration: "none",
  cursor: "pointer",
  whiteSpace: "nowrap",
  fontFamily: "var(--pd-font-display)",
  fontVariationSettings: '"wght" 700, "wdth" var(--pd-display-wdth)',
  fontWeight: 700,
  fontSize: "15px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  transition:
    "background var(--pd-transition-fast), color var(--pd-transition-fast), border-color var(--pd-transition-fast), transform var(--pd-transition-fast)",
  _active: { transform: "translateY(1px)" },
  "&[data-large]": { padding: "18px 34px", fontSize: "19px" },
} as const;

const BtnPrimary = styled("a", {
  base: {
    ...buttonBase,
    color: "#FFFFFF",
    background: SIGNAL,
    border: `1px solid ${SIGNAL}`,
    _hover: { background: SIGNAL_DEEP, borderColor: SIGNAL_DEEP },
    "&[data-invert]": {
      background: PAPER,
      color: INK,
      borderColor: PAPER,
      _hover: { background: "#FFFFFF", borderColor: "#FFFFFF" },
    },
  },
});

const BtnOutline = styled("a", {
  base: {
    ...buttonBase,
    color: TEXT,
    background: "transparent",
    border: `1px solid ${TEXT}`,
    _hover: { background: TEXT, color: PAPER },
  },
});

const BtnGhost = styled("a", {
  base: {
    ...buttonBase,
    fontSize: "14px",
    padding: "12px 18px",
    color: TEXT,
    background: "transparent",
    border: "1px solid transparent",
    _hover: { background: PAPER_2 },
  },
});

/* ── Hero ─────────────────────────────────────────── */

const Hero = styled("section", {
  base: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "48px",
    alignItems: "center",
    maxWidth: "1240px",
    margin: "0 auto",
    padding: "56px 20px 64px",
    lg: {
      /* Deliberately uneven. A 50/50 split would centre the page again. */
      gridTemplateColumns: "1.15fr 0.85fr",
      gap: "64px",
      padding: "96px 40px 104px",
    },
  },
});

const HeroLeft = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "22px",
    animationName: "fadeSlideUp",
    animationDuration: "0.55s",
    animationTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
    animationFillMode: "both",
  },
});

const HeroRight = styled("div", {
  base: { display: "flex", justifyContent: "center", lg: { justifyContent: "flex-end" } },
});

const Eyebrow = styled("span", {
  base: {
    ...LABEL,
    color: SIGNAL,
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    _before: {
      content: '""',
      width: "26px",
      height: "2px",
      background: SIGNAL,
      display: "inline-block",
    },
  },
});

const HeroTitle = styled("h1", {
  base: {
    ...DISPLAY,
    fontVariationSettings: '"wght" 700, "wdth" var(--pd-display-wdth-tight)',
    /* The single loudest thing on the page. Everything else is quiet so this
       can be this big. */
    fontSize: "clamp(52px, 11vw, 128px)",
    margin: 0,
    color: TEXT,
    textWrap: "balance",
    "& em": { fontStyle: "normal", color: SIGNAL },
  },
});

const HeroSubtitle = styled("p", {
  base: {
    fontSize: "clamp(16px, 1.6vw, 19px)",
    lineHeight: 1.55,
    color: TEXT_2,
    maxWidth: "34ch",
    margin: 0,
  },
});

const HeroCTA = styled("div", {
  base: { display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "6px" },
});

/* ── Ticker ───────────────────────────────────────── */

const Ticker = styled("div", {
  base: {
    borderBlock: `1px solid ${LINE}`,
    background: PAPER_2,
    overflow: "hidden",
    padding: "13px 0",
  },
});

const TickerTrack = styled("div", {
  base: {
    display: "flex",
    width: "max-content",
    animation: "marquee 34s linear infinite",
    "@media (prefers-reduced-motion: reduce)": { animation: "none" },
  },
});

const TickerRun = styled("div", {
  base: {
    ...LABEL,
    display: "flex",
    alignItems: "center",
    gap: "18px",
    paddingInlineEnd: "18px",
    color: TEXT_2,
    "& b": { color: TEXT, fontWeight: 700 },
    "& s": {
      width: "5px",
      height: "5px",
      borderRadius: "50%",
      background: SIGNAL,
      flexShrink: 0,
    },
  },
});

/* ── Ink band ─────────────────────────────────────── */

const Band = styled("section", {
  base: {
    background: INK,
    color: PAPER,
    padding: "72px 20px",
    md: { padding: "112px 40px" },
  },
});

const BandHead = styled("div", {
  base: {
    maxWidth: "1160px",
    margin: "0 auto 44px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
});

const BandEyebrow = styled("span", { base: { ...LABEL, color: LIVE } });

const BandTitle = styled("h2", {
  base: {
    ...DISPLAY,
    fontSize: "clamp(32px, 5.2vw, 66px)",
    margin: 0,
    maxWidth: "18ch",
    color: PAPER,
  },
});

const BandGrid = styled("div", {
  base: {
    maxWidth: "1160px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "1px",
    background: LINE_INK,
    border: `1px solid ${LINE_INK}`,
    borderRadius: "18px",
    overflow: "hidden",
    md: { gridTemplateColumns: "repeat(2, 1fr)" },
  },
});

const BandItem = styled("div", {
  base: {
    background: INK,
    padding: "30px 26px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    transition: "background var(--pd-transition-base)",
    _hover: { background: INK_2 },
    md: { padding: "40px 34px" },
  },
});

const BandItemTitle = styled("h3", {
  base: { ...DISPLAY, fontSize: "clamp(20px, 2.3vw, 28px)", margin: 0, color: PAPER },
});

const BandItemText = styled("p", {
  base: {
    fontSize: "15px",
    lineHeight: 1.6,
    color: "rgba(251,249,247,0.66)",
    margin: 0,
    maxWidth: "44ch",
  },
});

const BandMeter = styled("div", {
  base: { marginTop: "8px", color: LIVE },
});

/* ── Install ──────────────────────────────────────── */

const Install = styled("section", {
  base: {
    maxWidth: "1160px",
    margin: "0 auto",
    padding: "72px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    md: { padding: "112px 40px" },
  },
});

const SectionEyebrow = styled("span", { base: { ...LABEL, color: SIGNAL } });

const SectionTitle = styled("h2", {
  base: {
    ...DISPLAY,
    fontSize: "clamp(32px, 5.2vw, 66px)",
    margin: "0 0 28px",
    color: TEXT,
  },
});

const InstallCards = styled("div", {
  base: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "16px",
    sm: { gridTemplateColumns: "1fr 1fr" },
  },
});

const InstallCard = styled("div", {
  base: {
    background: "#FFFFFF",
    border: `1px solid ${LINE}`,
    borderRadius: "18px",
    padding: "26px",
    display: "flex",
    flexDirection: "column",
    gap: "13px",
  },
});

const InstallCardTitle = styled("h3", {
  base: { ...LABEL, color: SIGNAL, margin: "0 0 4px" },
});

const InstallStep = styled("div", {
  base: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    fontSize: "15px",
    lineHeight: 1.55,
    color: TEXT_2,
  },
});

const StepNum = styled("span", {
  base: {
    display: "inline-grid",
    placeItems: "center",
    minWidth: "22px",
    height: "22px",
    borderRadius: "7px",
    background: PAPER_2,
    color: TEXT,
    fontFamily: "var(--pd-font-mono)",
    fontSize: "11px",
    fontVariantNumeric: "tabular-nums",
    flexShrink: 0,
    marginTop: "1px",
  },
});

/* ── Close ────────────────────────────────────────── */

const Close = styled("section", {
  base: {
    background: SIGNAL,
    color: "#FFFFFF",
    padding: "80px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "28px",
    textAlign: "center",
    md: { padding: "120px 40px" },
  },
});

const CloseTitle = styled("h2", {
  base: {
    ...DISPLAY,
    fontVariationSettings: '"wght" 700, "wdth" var(--pd-display-wdth-tight)',
    fontSize: "clamp(40px, 8vw, 104px)",
    margin: 0,
    color: "#FFFFFF",
  },
});

const Footer = styled("footer", {
  base: {
    ...LABEL,
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
    padding: "28px 20px",
    color: TEXT_3,
    borderTop: `1px solid ${LINE}`,
    md: { padding: "32px 40px" },
  },
});
