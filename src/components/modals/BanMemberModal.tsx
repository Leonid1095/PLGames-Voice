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

export function BanMemberModal({ target, type, ...props }: ModalProps<"ban_member">) {
	const app = useAppStore();
	const { t } = useTranslation();

	const schema = yup
		.object({
			reason: yup.string().max(512, t('modals.ban.reasonTooLong')),
		})
		.required();

	const {
		register,
		handleSubmit,
		formState: { disabled, isLoading, isSubmitting },
	} = useForm({
		resolver: yupResolver(schema),
	});

	const isDisabled = disabled || isLoading || isSubmitting;

	const onSubmit = handleSubmit((data) => {
		app.rest
			.put(
				Routes.guildBan(target.guild.id, target.user!.id),
				undefined,
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
			title={t('modals.ban.title', { name: target.user?.username })}
			description={
				<DescriptionText>
					{t('modals.ban.description', { name: target.user?.username })}
				</DescriptionText>
			}
			actions={[
				{
					onClick: onSubmit,
					children: <span>{t('modals.ban.ban')}</span>,
					palette: "danger",
					confirmation: true,
					disabled: isDisabled,
					size: "small",
				},
				{
					onClick: () => modalController.pop("close"),
					children: <span>{t('modals.ban.cancel')}</span>,
					palette: "link",
					disabled: isDisabled,
					size: "small",
				},
			]}
		>
			<img
				src="https://media1.tenor.com/m/TG5OF7UkLasAAAAd/thanos-infinity.gif"
				loading="lazy"
				alt="Thanos Snap GIF"
				height={300}
				style={{
					marginBottom: 20,
					borderRadius: 8,
				}}
			/>

			<TextArea {...register("reason")} id="reason" name="reason" placeholder={t('modals.ban.reason')} maxLength={512} />
		</Modal>
	);
}
