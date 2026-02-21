import {
	AuthContainer,
	FormContainer,
	Header,
	HeaderContainer,
	Input,
	InputContainer,
	InputErrorText,
	InputLabel,
	InputWrapper,
	LabelWrapper,
	Link,
	SubHeader,
	SubmitButton,
	Wrapper,
} from "@components/AuthComponents";
import { TextDivider } from "@components/Divider";
import { useAppStore } from "@hooks/useAppStore";
import useLogger from "@hooks/useLogger";
import { Routes } from "@spacebarchat/spacebar-api-types/v9";
import {
	IAPIError,
	IAPILoginResponseMFARequired,
	IAPILoginResponseSuccess,
	IAPITOTPRequest,
	messageFromFieldError,
} from "@utils";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

type FormValues = {
	code: string;
};

interface Props extends IAPILoginResponseMFARequired {
	close: () => void;
}

function MFA(props: Props) {
	const { t } = useTranslation();
	const app = useAppStore();
	const logger = useLogger("MFA");
	const navigate = useNavigate();
	const [loading, setLoading] = React.useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
		setError,
	} = useForm<FormValues>();

	const onSubmit = handleSubmit((data) => {
		setLoading(true);

		app.rest
			.post<IAPITOTPRequest, IAPILoginResponseSuccess>(Routes.mfaTotp(), {
				...data,
				ticket: props.ticket,
			})
			.then((r) => {
				app.setToken(r.token, true);
				navigate("/app", { replace: true });
			})
			.catch((r: IAPIError) => {
				if ("message" in r) {
					// error
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
						message: t('auth.unknownError'),
					});
				}
			})
			.finally(() => setLoading(false));
	});

	return (
		<Wrapper>
			<AuthContainer>
				<HeaderContainer>
					<Header>{t('auth.mfaHeader')}</Header>
					<SubHeader>{t('auth.mfaDescription')}</SubHeader>

					<FormContainer onSubmit={onSubmit}>
						<InputContainer marginBottom={true} style={{ marginTop: 0 }}>
							<LabelWrapper error={!!errors.code}>
								<InputLabel>{t('auth.mfaCodeLabel')}</InputLabel>
								{errors.code && (
									<InputErrorText>
										<>
											<TextDivider>-</TextDivider>
											{errors.code.message}
										</>
									</InputErrorText>
								)}
							</LabelWrapper>
							<InputWrapper>
								<Input
									type="text"
									autoFocus
									{...register("code", { required: true })}
									error={!!errors.code}
									disabled={loading}
									placeholder={t('auth.mfaCodePlaceholder')}
								/>
							</InputWrapper>
						</InputContainer>

						<SubmitButton palette="primary" type="submit" disabled={loading}>
							{t('auth.login')}
						</SubmitButton>

						<Link onClick={() => props.close()} type="button">
							{t('auth.mfaBackToLogin')}
						</Link>
					</FormContainer>
				</HeaderContainer>
			</AuthContainer>
		</Wrapper>
	);
}

export default MFA;
