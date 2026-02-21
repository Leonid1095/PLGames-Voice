import { ModalProps, modalController } from "@/controllers/modals";
import { useAppStore } from "@hooks/useAppStore";
import useLogger from "@hooks/useLogger";
import { Routes } from "@spacebarchat/spacebar-api-types/v9";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Modal } from "./ModalComponents";

export function LeaveServerModal({ target, ...props }: ModalProps<"leave_server">) {
	const app = useAppStore();
	const logger = useLogger("LeaveServerModal");
	const navigate = useNavigate();
	const { t } = useTranslation();
	const [isDisabled, setDisabled] = useState(false);

	async function leaveGuild() {
		setDisabled(true);
		await app.rest
			.delete(Routes.userGuild(target.id))
			.then(() => {
				navigate("/channels/@me");
				modalController.pop("close");
			})
			.catch((e) => {
				logger.error(e);
				modalController.pop("close");
				modalController.push({
					type: "error",
					error: e,
					title: "Failed to leave server",
					description: "An error occurred while trying to leave the server.",
				});
			})
			.finally(() => setDisabled(false));
	}

	return (
		<Modal
			{...props}
			title={t('modals.leaveServer.title', { name: target.name })}
			description={
				<span>
					{t('modals.leaveServer.description', { name: target.name })}
				</span>
			}
			actions={[
				{
					onClick: leaveGuild,
					children: <span>{t('modals.leaveServer.leave')}</span>,
					palette: "danger",
					confirmation: true,
					disabled: isDisabled,
					size: "small",
				},
				{
					onClick: () => modalController.pop("close"),
					children: <span>{t('modals.leaveServer.cancel')}</span>,
					palette: "link",
					disabled: isDisabled,
					size: "small",
				},
			]}
		/>
	);
}
