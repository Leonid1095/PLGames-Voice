import "@fontsource/roboto-mono/100.css";
import "@fontsource/roboto-mono/200.css";
import "@fontsource/roboto-mono/300.css";
import "@fontsource/roboto-mono/400.css";
import "@fontsource/roboto-mono/500.css";
import "@fontsource/roboto-mono/600.css";
import "@fontsource/roboto-mono/700.css";
import "@fontsource/roboto/100.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource/roboto/900.css";

import { ModalRenderer } from "@/controllers/modals";
import dayjs from "dayjs";
import calendar from "dayjs/plugin/calendar";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ru";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { ErrorBoundaryContext } from "react-use-error-boundary";
import App from "./App";
import TitleBar from "./components/TitleBar";
import { ContextMenuContextProvider } from "./contexts/ContextMenuContextProvider";
import Theme from "./contexts/Theme";
import "./i18n";
import "./index.css";
import i18n from "./i18n";

const lang = i18n.language || "ru";
dayjs.locale(lang === "ru" ? "ru" : "en");

const calendarStrings = i18n.t("calendar", { returnObjects: true }) as Record<string, string>;
dayjs.extend(relativeTime);
dayjs.extend(calendar, calendarStrings);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<ErrorBoundaryContext>
		<HashRouter>
			<TitleBar />
			<ContextMenuContextProvider>
				<App />
				<ModalRenderer />
			</ContextMenuContextProvider>
			<Theme />
		</HashRouter>
	</ErrorBoundaryContext>,
);
