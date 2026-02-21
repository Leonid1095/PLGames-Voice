import { ModalProps, modalController } from "@/controllers/modals";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAppStore } from "@hooks/useAppStore";
import { Routes } from "@spacebarchat/spacebar-api-types/v9";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import * as yup from "yup";
import { Modal } from "./ModalComponents";

const DescriptionText = styled.p`
	font-size: 16px;
	font-weight: var(--font-weight-regular);
	color: var(--text-header-secondary);
	margin-top: 8px;
`;

const TextArea = styled.textarea`
	flex: 1;
	padding: 8px;
	border-radius: 4px;
	background-color: var(--background-secondary-alt);
	border: none;
	color: var(--text);
	font-size: 16px;
	font-weight: var(--font-weight-regular);
	resize: none;
	outline: none;
`;

export function KickMemberModal({ target, ...props }: ModalProps<"kick_member">) {
	const app = useAppStore();
	const { t } = useTranslation();

	const schema = yup
		.object({
			reason: yup.string().max(512, t('modals.kick.reasonTooLong')),
		})
		.required();

	const {
		register,
		control,
		handleSubmit,
		formState: { disabled, isLoading, isSubmitting },
	} = useForm({
		resolver: yupResolver(schema),
	});

	const isDisabled = disabled || isLoading || isSubmitting;

	const onSubmit = handleSubmit((data) => {
		app.rest
			.delete(
				Routes.guildMember(target.guild.id, target.user!.id),
				undefined,
				data.reason
					? {
							"X-Audit-Log-Reason": data.reason,
					  }
					: undefined,
			)
			.then(() => {
				modalController.pop("close");
			})
			.catch((e) => {
				console.error(e);
			});
	});

	return (
		<Modal
			{...props}
			title={t('modals.kick.title', { name: target.user?.username })}
			description={
				<DescriptionText>
					{t('modals.kick.description', { name: target.user?.username })}
				</DescriptionText>
			}
			actions={[
				{
					onClick: onSubmit,
					children: <span>{t('modals.kick.kick')}</span>,
					palette: "danger",
					confirmation: true,
					disabled: isDisabled,
					size: "small",
				},
				{
					onClick: () => modalController.pop("close"),
					children: <span>{t('modals.kick.cancel')}</span>,
					palette: "link",
					disabled: isDisabled,
					size: "small",
				},
			]}
		>
			<TextArea {...register("reason")} id="reason" name="reason" placeholder={t('modals.kick.reason')} maxLength={512} />
		</Modal>
	);
}
