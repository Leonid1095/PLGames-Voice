import Container from "@components/Container";
import Text from "@components/Text";
import { useTranslation } from "react-i18next";

interface Props {
	error: Error;
}

function ErrorPage({ error }: Props) {
	const { t } = useTranslation();

	return (
		<Container>
			<Text>{t('errors.somethingWentWrong')}</Text>
			<pre>{error.message}</pre>
		</Container>
	);
}

export default ErrorPage;
