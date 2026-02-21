// loosely based on https://github.com/revoltchat/frontend/blob/master/components/app/menus/UserContextMenu.tsx

import { modalController } from "@/controllers/modals";
import Channel from "@structures/Channel";
import { useTranslation } from "react-i18next";
import { ContextMenu, ContextMenuButton, ContextMenuDivider } from "./ContextMenu";

interface MenuProps {
	channel: Channel;
}

function ChannelContextMenu({ channel }: MenuProps) {
	const { t } = useTranslation();

	/**
	 * Copy id to clipboard
	 */
	function copyId() {
		navigator.clipboard.writeText(channel.id);
	}

	/**
	 * Copy link to clipboard
	 */
	function copyLink() {
		navigator.clipboard.writeText(`${window.location.origin}/channels/${channel.guildId}/${channel.id}`);
	}

	/**
	 * Open invite creation modal
	 */
	function openInviteCreateModal() {
		modalController.push({
			type: "create_invite",
			target: channel,
		});
	}

	return (
		<ContextMenu>
			<ContextMenuButton icon="mdiAccountPlus" onClick={openInviteCreateModal}>
				{t('channel.createInvite')}
			</ContextMenuButton>
			<ContextMenuButton icon="mdiLink" onClick={copyLink}>
				{t('channel.copyLink')}
			</ContextMenuButton>
			<ContextMenuDivider />
			{channel.hasPermission("MANAGE_CHANNELS") && (
				<>
					<ContextMenuButton disabled>{t('channel.editChannel')}</ContextMenuButton>
					<ContextMenuButton disabled destructive>
						{t('channel.deleteChannel')}
					</ContextMenuButton>
					<ContextMenuDivider />
				</>
			)}

			<ContextMenuButton
				icon="mdiIdentifier"
				iconProps={{
					style: {
						filter: "invert(100%)",
						background: "black",
						borderRadius: "4px",
					},
				}}
				onClick={copyId}
			>
				{t('channel.copyChannelId')}
			</ContextMenuButton>
		</ContextMenu>
	);
}

export default ChannelContextMenu;
