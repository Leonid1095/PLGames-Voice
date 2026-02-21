import { isElectron } from "@utils/Utils";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

const TitleBarContainer = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 32px;
	background-color: var(--background-secondary);
	-webkit-app-region: drag;
	user-select: none;
	flex-shrink: 0;
	width: 100%;
	z-index: 9999;
`;

const TitleText = styled.span`
	font-size: 12px;
	color: var(--text-muted);
	padding-left: 12px;
	font-weight: 500;
`;

const ButtonGroup = styled.div`
	display: flex;
	height: 100%;
	-webkit-app-region: no-drag;
`;

const WindowButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 46px;
	height: 100%;
	border: none;
	background: transparent;
	color: var(--text-muted);
	cursor: pointer;
	padding: 0;
	outline: none;

	&:hover {
		background-color: var(--background-primary-alt);
	}

	& svg {
		width: 16px;
		height: 16px;
	}
`;

const CloseButton = styled(WindowButton)`
	&:hover {
		background-color: #e81123;
		color: white;
	}
`;

function TitleBar() {
	const { t } = useTranslation();
	if (!isElectron) return null;

	// @ts-expect-error electron preload
	const native = window.native as {
		min: () => void;
		max: () => void;
		close: () => void;
	};

	return (
		<TitleBarContainer>
			<TitleText>PLG Voice</TitleText>
			<ButtonGroup>
				<WindowButton onClick={() => native.min()} title={t('titlebar.minimize')}>
					<svg viewBox="0 0 16 16" fill="currentColor">
						<path d="M3 8h10v1H3z" />
					</svg>
				</WindowButton>
				<WindowButton onClick={() => native.max()} title={t('titlebar.maximize')}>
					<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1">
						<rect x="3" y="3" width="10" height="10" />
					</svg>
				</WindowButton>
				<CloseButton onClick={() => native.close()} title={t('titlebar.close')}>
					<svg viewBox="0 0 16 16" fill="currentColor">
						<path d="M3.646 3.646a.5.5 0 0 1 .708 0L8 7.293l3.646-3.647a.5.5 0 0 1 .708.708L8.707 8l3.647 3.646a.5.5 0 0 1-.708.708L8 8.707l-3.646 3.647a.5.5 0 0 1-.708-.708L7.293 8 3.646 4.354a.5.5 0 0 1 0-.708z" />
					</svg>
				</CloseButton>
			</ButtonGroup>
		</TitleBarContainer>
	);
}

export default TitleBar;
