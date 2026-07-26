import { JSX, Show, createMemo, splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";

import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowRight,
  ArrowUpRight,
  AtSign,
  Ban,
  Bell,
  BellOff,
  Bookmark,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  CircleDashed,
  Clock,
  Copy,
  CreditCard,
  Crown,
  Download,
  Eye,
  EyeOff,
  FileText,
  Film,
  Globe,
  Hash,
  Headphones,
  HeadphoneOff,
  Heart,
  HelpCircle,
  Home,
  Image,
  Info,
  LayoutGrid,
  ListChecks,
  Link,
  Lock,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  MessageCircle,
  MessageSquareDot,
  MessagesSquare,
  Mic,
  MicOff,
  Monitor,
  MoreHorizontal,
  MoreVertical,
  Moon,
  Palette,
  Paperclip,
  PartyPopper,
  Pencil,
  Phone,
  PhoneOff,
  Pin,
  Plus,
  Repeat,
  Search,
  SearchX,
  Send,
  Settings,
  Shield,
  Sliders,
  Smile,
  Sparkles,
  Square,
  Star,
  Sun,
  ThumbsUp,
  Trash2,
  Unlock,
  User,
  UserPlus,
  Users,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Waves,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-solid";

import { css } from "styled-system/css";
import { splitCssProps, styled } from "styled-system/jsx";
import { HTMLStyledProps } from "styled-system/types";

interface Props {
  /**
   * Whether to use the filled version of this symbol.
   * Filled symbols should only be used when there is an active state (ex: pages in a nav bar or toggled icon buttons).
   */
  fill?: boolean;
  /**
   * Font size for the symbol. This can be a number (in pixels) or any valid CSS size string (ex: "24px", "1.5em", "2rem").
   * @deprecated passing to css() does nothing
   */
  fontSize?: string | number;
  /**
   * The grade of the symbol, which adjusts the weight slightly. This can be a number between -25 and 700. To preview use the Google Fonts web app.
   */
  grade?: number;
  /**
   * The optical size of the symbol, which adjusts the design for different sizes. This should be "auto" unless it causes issues.
   */
  opticalSize?: number | "auto";
  /**
   * The type of symbol to use. This can be "outlined", "rounded", or "sharp". Defaults to "outlined".
   */
  type?: "outlined" | "rounded" | "sharp";
  /**
   * The weight of the symbol, which adjusts the thickness of the lines. This can be a number between 100 and 700.
   */
  weight?: number;
  /**
   * The symbol to display. This should be the exact text name of the symbol as defined by Google. See https://fonts.google.com/icons for a list of available symbols.
   */
  children: string | JSX.Element;
  /**
   * Symbol size
   */
  size?: number;
}

/*
 * Quiet Pro icon mapping — Material Symbols → Lucide.
 * For every name we recognise, render the Lucide stroke icon directly so the
 * UI matches the lucide-style mockup. Unknown names fall back to the
 * Material Symbols variable font.
 */
type Lucide = (props: { size?: number | string; "stroke-width"?: number }) => JSX.Element;
const LUCIDE_MAP: Record<string, Lucide> = {
  // navigation / structure
  home: Home,
  group: Users,
  groups: Users,
  bookmark: Bookmark,
  note_stack: FileText,
  forum: MessagesSquare,
  chat: MessageCircle,
  tag: Hash,
  grid_3x3: Hash,
  alternate_email: AtSign,
  pin: Pin,

  // common actions
  add: Plus,
  close: X,
  send: Send,
  check: Check,
  delete: Trash2,
  edit: Pencil,
  search: Search,
  search_off: SearchX,
  link: Link,
  download: Download,
  open_in_new: ArrowUpRight,
  menu: Menu,
  more_vert: MoreVertical,
  more_horiz: MoreHorizontal,
  block: Ban,

  // people / status
  person: User,
  person_add: UserPlus,
  account_circle: User,

  // voice / video
  mic: Mic,
  mic_off: MicOff,
  headset: Headphones,
  headset_off: HeadphoneOff,
  speaker: Volume2,
  volume_up: Volume2,
  no_sound: VolumeX,
  spatial_audio_off: Volume2,
  noise_aware: Waves,
  graphic_eq: Waves,
  videocam: Video,
  videocam_off: VideoOff,
  voice_chat: Mic,
  screen_share: Monitor,
  stop_screen_share: Monitor,
  desktop_windows: Monitor,

  // visuals / media
  emoticon: Smile,
  spa: Sparkles,
  star: Star,
  star_border: Star,
  thumb_up: ThumbsUp,
  favorite: Heart,
  image: Image,
  attach_file: Paperclip,
  gif_box: Film,

  // settings / system
  settings: Settings,
  tune: Sliders,
  shield: Shield,
  lock: Lock,
  lock_open: Unlock,
  schedule: Clock,
  schedule_send: CalendarClock,
  light_mode: Sun,
  dark_mode: Moon,
  contrast: CircleDashed,
  notifications: Bell,
  notifications_off: BellOff,
  zoom_in: ZoomIn,
  zoom_out: ZoomOut,

  // state / feedback
  circle: Circle,
  check_circle: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  help: HelpCircle,

  // chevrons / arrows
  expand_more: ChevronDown,
  expand_less: ChevronUp,
  chevron_left: ChevronLeft,
  chevron_right: ChevronRight,
  arrow_back: ArrowLeft,
  arrow_forward: ArrowRight,
  arrow_drop_down: ChevronDown,
  arrow_drop_up: ChevronUp,
  keyboard_arrow_down: ChevronDown,
  keyboard_arrow_up: ChevronUp,

  // misc
  payments: CreditCard,
  rate_review: MessageSquareDot,
  public: Globe,
  workspace_premium: Crown,
  campaign: Megaphone,
  visibility: Eye,
  visibility_off: EyeOff,
  logout: LogOut,
  mail: Mail,
  email: Mail,
  palette: Palette,
  square: Square,
  // Names that were still falling through to the Material Symbols font, so
  // those few icons sat on a different grid and weight to everything around
  // them. The mockup asks for one family; this closes the gap.
  all_inclusive: Repeat,
  arrow_downward: ArrowDown,
  arrow_upward: ArrowUp,
  ballot: ListChecks,
  bookmark_border: Bookmark,
  brightness_alert: AlertTriangle,
  call: Phone,
  call_end: PhoneOff,
  camera_video: Video,
  category: LayoutGrid,
  celebration: PartyPopper,
  chat_bubble: MessageCircle,
  content_copy: Copy,
  delete_sweep: Trash2,
  exit_to_app: LogOut,

  // additional aliases
  pencil: Pencil,
  trash: Trash2,
  delete_forever: Trash2,
};

export function Symbol(rawProps: Props & HTMLStyledProps<"span">) {
  const [local, props] = splitProps(rawProps, [
    "fill",
    "fontSize",
    "grade",
    "opticalSize",
    "weight",
    "type",
    "size",
  ]);

  const [cssProps, restProps] = splitCssProps(props);

  // If this is a known name, render the Lucide stroke icon directly.
  const lucideIcon = createMemo(() => {
    if (typeof rawProps.children !== "string") return null;
    return LUCIDE_MAP[rawProps.children] ?? null;
  });

  const memoClassName = createMemo(() => {
    return css(
      {
        fontSize: local.fontSize ?? "inherit",
        fontWeight: `${local.weight} !important`,
        fontOpticalSizing: local.opticalSize === "auto" ? "auto" : undefined,
      },
      cssProps,
    );
  });

  const memoFontVarSettings = createMemo(() => {
    // Quiet Pro defaults Material-Symbols fallback to weight 300.
    const wght = local.weight ?? 300;
    return `"FILL" ${local.fill ? 1 : 0}, "wght" ${wght}, "GRAD" ${local.grade ?? 0}${
      (local.opticalSize ?? "auto") === "auto"
        ? ""
        : `, "opsz" ${local.opticalSize}`
    }`;
  });

  return (
    <Show
      when={lucideIcon()}
      fallback={
        <styled.span
          class={`material-symbols-${local.type ?? "outlined"} ${memoClassName()}`}
          style={{
            display: "block",
            "font-variation-settings": memoFontVarSettings(),
            "font-size": local.size ? `${local.size}px` : undefined,
          }}
          aria-hidden="true"
          {...restProps}
          // @codegen directives props=props include=floating
        />
      }
    >
      {(Icon) => (
        <styled.span
          class={memoClassName()}
          style={{
            display: "inline-flex",
            "align-items": "center",
            "justify-content": "center",
            "line-height": 0,
            "font-size": local.size ? `${local.size}px` : undefined,
          }}
          aria-hidden="true"
          {...restProps}
          // @codegen directives props=props include=floating
        >
          <Dynamic
            component={Icon()}
            size={local.size ?? "1em"}
            stroke-width={1.75}
          />
        </styled.span>
      )}
    </Show>
  );
}
