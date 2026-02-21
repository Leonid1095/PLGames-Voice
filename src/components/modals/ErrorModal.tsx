import { ModalProps } from "@/controllers/modals/types";
import { useTranslation } from "react-i18next";
import { Modal } from "./ModalComponents";

export function ErrorModal({ error, ...props }: ModalProps<"error">) {
	const { t } = useTranslation();

	return (
		<Modal
			{...props}
			actions={[
				{
					onClick: () => true,
					confirmation: true,
					children: <span>{t('modals.error.dismiss')}</span>,
					palette: "primary",
					disabled: !(props.recoverable ?? true),
				},
			]}
			nonDismissable={!(props.recoverable ?? true)}
		>
			{error}
		</Modal>
	);
}
