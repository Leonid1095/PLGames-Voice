import { Floating, FloatingTrigger } from "@components/floating";
import Icon from "@components/Icon";
import { SectionHeader } from "@components/SectionHeader";
import { useAppStore } from "@hooks/useAppStore";
import useLogger from "@hooks/useLogger";
import * as Icons from "@mdi/js";
import { Channel } from "@structures";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

const IconButton = styled.button`
	margin: 0;
	padding: 0;
	background-color: inherit;
	border: none;
`;

const CustomIcon = styled(Icon)<{ $active?: boolean }>`
	color: ${(props) => (props.$active ? "var(--text)" : "var(--text-secondary)")};

	&:hover {
		color: ${(props) => (props.$active ? "var(--text-secondary)" : "var(--text)")};
		cursor: pointer;
	}
`;

const Container = styled(SectionHeader)`
	background-color: var(--background-primary-alt);
`;

const Wrapper = styled.div`
	display: flex;
	flex: 1 1 auto;
	align-items: center;
`;

const ChannelNameText = styled.div`
	font-size: 16px;
	font-weight: var(--font-weight-medium);
`;

const Divider = styled.div`
	width: 1px;
	height: 16px;
	margin: 0 8px;
	background-color: var(--text-secondary);
`;

const TopicWrapper = styled.div`
	display: flex;
	flex: 1 1 auto;
`;

const ChannelTopicText = styled.div`
	font-size: 14px;
	font-weight: var(--font-weight-regular);
	color: var(--text-secondary);
`;

const ActionItemsWrapper = styled.div`
	display: flex;
	flex-direction: row-reverse;
	// margin-right: 15%;

	// remove the temporary padding that moves it over the chat area on smaller screens where the member list is hidden
	@media (max-width: 1050px) {
		margin-right: auto;
	}
`;

const DummySearch = styled.div`
	display: flex;
	flex: 0 0 208px;

	align-items: center;
	border-radius: 4px;
	background-color: var(--background-tertiary);
	margin-left: 8px; // to match the right padding from the main container
	padding: 0 8px;
	user-select: none;
	// cursor: text;
	cursor: not-allowed;
`;

const IconWrapper = styled.div`
	height: 24px;
	margin-left: 8px;
	flex: 0 0 auto;
`;

interface Props {
	channel?: Channel;
}

function ChannelTopic({ channel }: Props) {
	return (
		<TopicWrapper>
			{channel?.topic && (
				<>
					<Divider />
					<ChannelTopicText>{channel.topic}</ChannelTopicText>
				</>
			)}
		</TopicWrapper>
	);
}

interface ActionItemProps {
	icon: keyof typeof Icons;
	active?: boolean;
	ariaLabel?: string;
	tooltip: string;
	onClick?: () => void;
	disabled?: boolean;
	color?: string;
}

function ActionItem({ icon, active, ariaLabel, tooltip, disabled, color, onClick }: ActionItemProps) {
	const logger = useLogger("ChatHeader.tsx:ActionItem");

	return (
		<Floating
			placement="bottom"
			type="tooltip"
			props={{
				content: <span>{tooltip}</span>,
			}}
		>
			<FloatingTrigger>
				<IconWrapper>
					<IconButton onClick={onClick}>
						<CustomIcon
							$active={!disabled && active}
							icon={icon}
							size="24px"
							aria-label={ariaLabel}
							color={color}
						/>
					</IconButton>
				</IconWrapper>
			</FloatingTrigger>
		</Floating>
	);
}

/**
 * Top header for channel messages section
 */
function ChatHeader({ channel }: Props) {
	const { memberListVisible, toggleMemberList, updaterStore } = useAppStore();
	const { t } = useTranslation();

	return (
		<Container>
			<Wrapper>
				{/* // TODO: render a custom bar for the home page */}
				<ChannelNameText>#{channel?.name ?? "ChannelName"}</ChannelNameText>
				<ChannelTopic channel={channel} />
				{/* Action Items */}
				<ActionItemsWrapper>
					{updaterStore?.checkingForUpdates && (
						<ActionItem
							icon="mdiCloudSync"
							tooltip={t('updates.checking')}
							ariaLabel={t('updates.checking')}
							disabled
						/>
					)}
					{updaterStore?.updateAvailable && (
						<ActionItem icon="mdiUpdate" tooltip={t('updates.available')} ariaLabel={t('updates.available')} disabled />
					)}
					{updaterStore?.updateDownloading && (
						<ActionItem
							icon="mdiCloudDownload"
							tooltip={t('updates.downloading')}
							ariaLabel={t('updates.downloading')}
							disabled
						/>
					)}
					{updaterStore?.updateDownloaded && (
						<ActionItem
							icon="mdiDownload"
							tooltip={t('updates.ready')}
							ariaLabel={t('updates.ready')}
							color="var(--success)"
							onClick={() => {
								updaterStore.quitAndInstall();
							}}
						/>
					)}
					{/* <ActionItem icon="mdiPound" ariaLabel="Threads" /> */}
					<DummySearch>
						<span>{t('chat.search')}</span>
					</DummySearch>
					<ActionItem icon="mdiInbox" tooltip={t('chat.inbox')} ariaLabel={t('chat.inbox')} />
					<ActionItem
						icon="mdiAccountMultiple"
						tooltip={t('chat.memberList')}
						ariaLabel={t('chat.memberList')}
						active={memberListVisible}
						onClick={toggleMemberList}
					/>
					<ActionItem icon="mdiPin" tooltip={t('chat.pinnedMessages')} ariaLabel={t('chat.pinnedMessages')} />
					<ActionItem icon="mdiBellBadge" tooltip={t('chat.notificationSettings')} ariaLabel={t('chat.notificationSettings')} />
				</ActionItemsWrapper>
			</Wrapper>
		</Container>
	);
}

export default observer(ChatHeader);
