import { ModalProps, modalController } from "@/controllers/modals";
import { Input, InputErrorText, InputLabel, LabelWrapper } from "@components/AuthComponents";
import { TextDivider } from "@components/Divider";
import { useAppStore } from "@hooks/useAppStore";
import useLogger from "@hooks/useLogger";
import { Routes } from "@spacebarchat/spacebar-api-types/v9";
import { messageFromFieldError } from "@utils";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Modal } from "./ModalComponents";

const InviteInputContainer = styled.div`
	display: flex;
	flex-direction: column;
`;

type FormValues = {
	code: string;
};

export function JoinServerModal({ ...props }: ModalProps<"join_server">) {
	const logger = useLogger("JoinServerModal");
	const app = useAppStore();
	const navigate = useNavigate();
	const { t } = useTranslation();

	const {
		register,
		handleSubmit,
		formState: { errors, isLoading },
		setError,
		setValue,
	} = useForm<FormValues>();

	const onSubmit = handleSubmit((data) => {
		const code = data.code.split("/").reverse()[0];

		app.rest
			.post<never, { guild_id: string; channel_id: string }>(Routes.invite(code))
			.then((r) => {
				navigate(`/channels/${r.guild_id}/${r.channel_id}`);
				modalController.closeAll();
			})
			.catch((r) => {
				if ("message" in r) {
					if (r.errors) {
						const fieldError = messageFromFieldError(r.errors);
						if (fieldError) {
							setError(fieldError.field as keyof FormValues, {
								type: "manual",
								message: fieldError.error,
							});
						} else {
							setError("code", {
								type: "manual",
								message: r.message,
							});
						}
					} else {
						setError("code", {
							type: "manual",
							message: r.message,
						});
					}
				} else {
					// unknown error
					logger.error(r);
					setError("code", {
						type: "manual",
						message: "Unknown Error",
					});
				}
			});
	});

	return (
		<Modal
			{...props}
			onClose={() => modalController.closeAll()}
			title={t('modals.joinServer.title')}
			description={t('modals.joinServer.description')}
			actions={[
				{
					onClick: onSubmit,
					children: <span>{t('modals.joinServer.join')}</span>,
					palette: "primary",
					confirmation: true,
					disabled: isLoading,
				},
				{
					onClick: () => modalController.pop("close"),
					children: <span>{t('modals.joinServer.back')}</span>,
					palette: "link",
					disabled: isLoading,
				},
			]}
		>
			<form
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						onSubmit();
					}
				}}
			>
				<InviteInputContainer>
					<LabelWrapper error={!!errors.code}>
						<InputLabel>{t('modals.joinServer.inviteLink')}</InputLabel>

						{errors.code && (
							<InputErrorText>
								<>
									<TextDivider>-</TextDivider>
									{errors.code.message}
								</>
							</InputErrorText>
						)}
					</LabelWrapper>
					<Input
						{...register("code", { required: true })}
						placeholder={`${window.location.origin}/invite/`}
						type="text"
						maxLength={9999}
						required
						error={!!errors.code}
						disabled={isLoading}
						autoFocus
						minLength={6}
					/>
				</InviteInputContainer>
			</form>
		</Modal>
	);
}
