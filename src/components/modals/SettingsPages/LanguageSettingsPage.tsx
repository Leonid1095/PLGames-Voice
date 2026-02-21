import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import styled from "styled-components";

const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
`;

const Title = styled.h1`
	font-size: 20px;
	font-weight: var(--font-weight-bold);
	color: var(--text);
	margin-bottom: 8px;
`;

const LanguageGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	gap: 8px;
`;

const LanguageButton = styled.button<{ selected?: boolean }>`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	padding: 12px 16px;
	border-radius: 8px;
	border: 2px solid ${(props) => (props.selected ? "var(--primary)" : "var(--background-secondary)")};
	background: ${(props) => (props.selected ? "hsl(var(--primary-hsl) / 0.1)" : "var(--background-secondary)")};
	color: var(--text);
	cursor: pointer;
	transition: all 0.15s ease;

	&:hover {
		border-color: var(--primary);
		background: hsl(var(--primary-hsl) / 0.05);
	}
`;

const LangName = styled.span`
	font-size: 16px;
	font-weight: var(--font-weight-bold);
`;

const LangNative = styled.span`
	font-size: 13px;
	color: var(--text-muted);
	margin-top: 2px;
`;

const LANGUAGES = [
	{ code: "ru", name: "Russian", native: "Русский" },
	{ code: "en", name: "English", native: "English" },
];

function LanguageSettingsPage() {
	const { t, i18n } = useTranslation();

	const changeLanguage = (code: string) => {
		i18n.changeLanguage(code);
		localStorage.setItem("plg_language", code);
		dayjs.locale(code === "ru" ? "ru" : "en");
	};

	return (
		<Container>
			<Title>{t("settings.language")}</Title>
			<LanguageGrid>
				{LANGUAGES.map((lang) => (
					<LanguageButton
						key={lang.code}
						selected={i18n.language === lang.code}
						onClick={() => changeLanguage(lang.code)}
					>
						<LangName>{lang.native}</LangName>
						<LangNative>{lang.name}</LangNative>
					</LanguageButton>
				))}
			</LanguageGrid>
		</Container>
	);
}

export default LanguageSettingsPage;
