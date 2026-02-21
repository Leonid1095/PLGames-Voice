import Button from "@components/Button";
import Container from "@components/Container";
import { useAppStore } from "@hooks/useAppStore";
import { observer } from "mobx-react-lite";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import PulseLoader from "react-spinners/PulseLoader";
import styled from "styled-components";

const Wrapper = styled.div`
	justify-content: center;
	align-items: center;
	display: flex;
	flex-direction: column;
	flex: 1;
`;

const LogoText = styled.h1`
	font-size: 48px;
	font-weight: 700;
	color: var(--text);
	margin-bottom: 32px;
	user-select: none;
`;

function LoadingPage() {
	const { t } = useTranslation();
	const app = useAppStore();

	return (
		<Container
			style={{
				flex: 1,
			}}
		>
			<Wrapper>
				<LogoText>PLG Voice</LogoText>
				<PulseLoader color="var(--text)" />
				{app.token && (
					<div
						style={{
							position: "absolute",
							bottom: "30vh",
						}}
					>
						<Button palette="danger" onClick={() => app.logout()}>
							{t('logout')}
						</Button>
					</div>
				)}
			</Wrapper>
		</Container>
	);
}

export default observer(LoadingPage);

export const LoadingSuspense = ({ children }: { children: React.ReactNode }) => (
	<Suspense fallback={<LoadingPage />}>{children}</Suspense>
);
