import { useInstanceValidation } from "@/hooks/useInstanceValidation";
import {
	AuthContainer,
	AuthSwitchPageContainer,
	AuthSwitchPageLabel,
	AuthSwitchPageLink,
	FormContainer,
	Header,
	Input,
	InputContainer,
	InputErrorText,
	InputLabel,
	InputWrapper,
	LabelWrapper,
	SubmitButton,
	Wrapper,
} from "@components/AuthComponents";
import { TextDivider } from "@components/Divider";
import DOBInput from "@components/DOBInput";
import HCaptcha from "@components/HCaptcha";
import HCaptchaLib from "@hcaptcha/react-hcaptcha";
import { useAppStore } from "@hooks/useAppStore";
import useLogger from "@hooks/useLogger";
import { Routes } from "@spacebarchat/spacebar-api-types/v9";
import {
	Globals,
	IAPILoginResponseSuccess,
	IAPIRegisterRequest,
	IAPIRegisterResponseError,
	messageFromFieldError,
} from "@utils";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

type FormValues = {
	instance: string;
	email: string;
	username: string;
	password: string;
	date_of_birth: string;
	captcha_key?: string;
};

function RegistrationPage() {
	const { t } = useTranslation();
	const app = useAppStore();
	const logger = useLogger("RegistrationPage");
	const navigate = useNavigate();
	const [loading, setLoading] = React.useState(false);
	const [captchaSiteKey, setCaptchaSiteKey] = React.useState<string>();

	const captchaRef = React.useRef<HCaptchaLib>(null);

	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
		setError,
		clearErrors,
	} = useForm<FormValues>();

	const _ = register("date_of_birth", {
		required: true,
		pattern: /^\d{4}-\d{2}-\d{2}$/,
	});

	const resetCaptcha = () => {
		captchaRef.current?.resetCaptcha();
		setValue("captcha_key", undefined);
	};

	const { handleInstanceChange, isCheckingInstance } = useInstanceValidation<FormValues>(
		setError,
		clearErrors,
		"instance",
	);

	const onSubmit = handleSubmit((data) => {
		if (errors.date_of_birth) return;

		setLoading(true);
		setCaptchaSiteKey(undefined);
		setValue("captcha_key", undefined);

		const { instance, ...rest } = data;

		app.rest
			.post<IAPIRegisterRequest, IAPILoginResponseSuccess>(Routes.register(), {
				...rest,
				consent: true,
			})
			.then((r) => {
				if ("token" in r) {
					// success
					app.setToken(r.token, true);
					return;
				} else {
					// unknown error
					logger.error(r);
					setError("email", {
						type: "manual",
						message: t('auth.unknownError'),
					});
				}
			})
			.catch((r: IAPIRegisterResponseError) => {
				if ("captcha_key" in r) {
					// catcha required
					if (r.captcha_key[0] !== "captcha-required") {
						// some kind of captcha error
						setError("email", {
							type: "manual",
							message: t('auth.captchaError', { error: r.captcha_key[0] }),
						});
					} else if (r.captcha_service !== "hcaptcha") {
						// recaptcha or something else
						setError("email", {
							type: "manual",
							message: t('auth.unsupportedCaptcha', { service: r.captcha_service }),
						});
					} else {
						// hcaptcha
						setCaptchaSiteKey(r.captcha_sitekey);
						captchaRef.current?.execute();
						return;
					}

					resetCaptcha();
				} else if ("message" in r) {
					// error
					if (r.errors) {
						const fieldError = messageFromFieldError(r.errors);
						if (fieldError) {
							setError(fieldError.field as keyof FormValues, {
								type: "manual",
								message: fieldError.error,
							});
						} else {
							setError("email", {
								type: "manual",
								message: r.message,
							});
						}
					} else {
						setError("email", {
							type: "manual",
							message: r.message,
						});
					}

					resetCaptcha();
				} else {
					// unknown error
					logger.error(r);
					setError("email", {
						type: "manual",
						message: t('auth.unknownError'),
					});
					resetCaptcha();
				}
			})
			.finally(() => setLoading(false));
	});

	const onCaptchaVerify = (token: string) => {
		setValue("captcha_key", token);
		onSubmit();
	};

	if (captchaSiteKey) {
		return <HCaptcha captchaRef={captchaRef} sitekey={captchaSiteKey} onVerify={onCaptchaVerify} />;
	}

	return (
		<Wrapper>
			<AuthContainer>
				<Header>{t('auth.registerHeader')}</Header>

				<FormContainer onSubmit={onSubmit}>
					<InputContainer marginBottom={true} style={{ marginTop: 0 }}>
						<LabelWrapper error={!!errors.instance}>
							<InputLabel>{t('auth.server')}</InputLabel>
							{isCheckingInstance != false && (
								<InputErrorText>
									<>
										<TextDivider>-</TextDivider>
										{t('auth.checking')}
									</>
								</InputErrorText>
							)}
							{errors.instance && (
								<InputErrorText>
									<>
										<TextDivider>-</TextDivider>
										{errors.instance.message}
									</>
								</InputErrorText>
							)}
						</LabelWrapper>
						<InputWrapper>
							<Input
								type="url"
								{...register("instance", {
									required: true,
									value: Globals.routeSettings.wellknown,
								})}
								placeholder={t('auth.serverPlaceholder')}
								onChange={handleInstanceChange}
								error={!!errors.instance}
								disabled={loading}
							/>
						</InputWrapper>
					</InputContainer>
					<InputContainer marginBottom={true} style={{ marginTop: 0 }}>
						<LabelWrapper error={!!errors.email}>
							<InputLabel>{t('auth.email')}</InputLabel>
							{errors.email && (
								<InputErrorText>
									<>
										<TextDivider>-</TextDivider>
										{errors.email.message}
									</>
								</InputErrorText>
							)}
						</LabelWrapper>
						<InputWrapper>
							<Input
								type="email"
								placeholder={t('auth.emailPlaceholder')}
								autoFocus
								{...register("email", { required: true })}
								error={!!errors.email}
								disabled={loading}
							/>
						</InputWrapper>
					</InputContainer>

					<InputContainer marginBottom={true} style={{ marginTop: 0 }}>
						<LabelWrapper error={!!errors.username}>
							<InputLabel>{t('auth.username')}</InputLabel>
							{errors.username && (
								<InputErrorText>
									<>
										<TextDivider>-</TextDivider>
										{errors.username.message}
									</>
								</InputErrorText>
							)}
						</LabelWrapper>
						<InputWrapper>
							<Input
								{...register("username", { required: true })}
								placeholder={t('auth.usernamePlaceholder')}
								error={!!errors.username}
								disabled={loading}
							/>
						</InputWrapper>
					</InputContainer>

					<InputContainer marginBottom>
						<LabelWrapper error={!!errors.password}>
							<InputLabel>{t('auth.password')}</InputLabel>
							{errors.password && (
								<InputErrorText>
									<>
										<TextDivider>-</TextDivider>
										{errors.password.message}
									</>
								</InputErrorText>
							)}
						</LabelWrapper>
						<InputWrapper>
							<Input
								type="password"
								placeholder={t('auth.passwordPlaceholder')}
								{...register("password", { required: true })}
								error={!!errors.password}
								disabled={loading}
							/>
						</InputWrapper>
					</InputContainer>

					<InputContainer marginBottom={true}>
						<LabelWrapper error={!!errors.date_of_birth}>
							<InputLabel>{t('auth.dateOfBirth')}</InputLabel>
							{errors.date_of_birth && (
								<InputErrorText>
									<>
										<TextDivider>-</TextDivider>
										{errors.date_of_birth.message}
									</>
								</InputErrorText>
							)}
						</LabelWrapper>

						<InputWrapper>
							<DOBInput
								onChange={(value) => setValue("date_of_birth", value)}
								onErrorChange={(errors) => {
									const hasError = Object.values(errors).some((error) => error);
									if (hasError) {
										// set to first error
										setError("date_of_birth", {
											type: "manual",
											message: Object.values(errors).filter((x) => x)[0],
										});
									} else clearErrors("date_of_birth");
								}}
								error={!!errors.date_of_birth}
								disabled={loading}
							/>
						</InputWrapper>
					</InputContainer>

					<SubmitButton palette="primary" type="submit" disabled={loading}>
						{t('auth.createAccount')}
					</SubmitButton>

					<AuthSwitchPageContainer>
						<AuthSwitchPageLabel>{t('auth.haveAccount')}&nbsp;</AuthSwitchPageLabel>
						<AuthSwitchPageLink
							onClick={() => {
								navigate("/login");
							}}
							type="button"
						>
							{t('auth.login')}
						</AuthSwitchPageLink>
					</AuthSwitchPageContainer>
				</FormContainer>
			</AuthContainer>
		</Wrapper>
	);
}

export default RegistrationPage;
