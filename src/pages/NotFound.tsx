import Container from "@components/Container";
import Text from "@components/Text";
import { useTranslation } from "react-i18next";

function NotFoundPage() {
	const { t } = useTranslation();

	return (
		<Container>
			<Text>{t('notFound')}</Text>
		</Container>
	);
}

export default NotFoundPage;
