import { ModalProps, modalController } from "@/controllers/modals";
import Button from "@components/Button";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Modal } from "./ModalComponents";

const ActionWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;
export function AddServerModal({ ...props }: ModalProps<"add_server">) {
	const { t } = useTranslation();

	return (
		<Modal {...props} title={t('modals.addServer.title')} description={t('modals.addServer.description')}>
			<ActionWrapper>
				<Button
					palette="primary"
					grow
					onClick={() => {
						modalController.push({
							type: "create_server",
						});
					}}
				>
					{t('modals.addServer.create')}
				</Button>

				<Button
					palette="secondary"
					grow
					onClick={() => {
						modalController.push({
							type: "join_server",
						});
					}}
				>
					{t('modals.addServer.join')}
				</Button>
			</ActionWrapper>
		</Modal>
	);
}
