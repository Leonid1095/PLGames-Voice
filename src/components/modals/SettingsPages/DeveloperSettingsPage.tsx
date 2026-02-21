import SectionTitle from "@components/SectionTitle";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

const Content = styled.div`
	display: flex;
	flex-direction: column;
`;

function DeveloperSettingsPage() {
	const { t } = useTranslation();

	return (
		<div>
			<SectionTitle>{t('settings.developerOptions')}</SectionTitle>
			<Content></Content>
		</div>
	);
}

export default observer(DeveloperSettingsPage);
