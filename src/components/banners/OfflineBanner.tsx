import Icon from "@components/Icon";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

const Wrapper = styled.div`
	display: flex;
	flex-direction: row;
	flex: 1;
	justify-content: center;
	align-items: center;
`;

const Text = styled.span`
	padding: 10px;
	color: var(--warning);
`;

function OfflineBanner() {
	const { t } = useTranslation();

	return (
		<Wrapper>
			<Text>{t('banner.offline')}</Text>
			<Icon icon="mdiWifiStrengthOff" color="var(--warning)" size="24px" />
		</Wrapper>
	);
}

export default OfflineBanner;
