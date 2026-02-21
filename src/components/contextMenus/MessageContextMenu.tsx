import { modalController } from "@/controllers/modals";
import { useAppStore } from "@hooks/useAppStore";
import { Message } from "@structures";
import { useTranslation } from "react-i18next";
import { ContextMenu, ContextMenuButton, ContextMenuDivider } from "./ContextMenu";

interface MenuProps {
	message: Message;
}

function MessageContextMenu({ message }: MenuProps) {
	const app = useAppStore();
	const { t } = useTranslation();

	function copyRaw() {
		navigator.clipboard.writeText(message.content);
	}

	async function deleteMessage(e: MouseEvent) {
		if (e.shiftKey) {
			await message.delete();
		} else {
			modalController.push({
				type: "delete_message",
				target: message as Message,
			});
		}
	}

	function copyId() {
		navigator.clipboard.writeText(message.id);
	}

	return (
		<ContextMenu>
			<ContextMenuButton icon="mdiReply" disabled>
				{t('messages.reply')}
			</ContextMenuButton>
			<ContextMenuButton icon="mdiContentCopy" onClick={copyRaw}>
				{t('messages.copyText')}
			</ContextMenuButton>
			<ContextMenuDivider />
			{((message instanceof Message && message.channel.hasPermission("MANAGE_MESSAGES")) ||
				message.author.id === app.account?.id) &&
				message instanceof Message && (
					<>
						<ContextMenuButton icon="mdiDelete" destructive onClick={deleteMessage}>
							{t('messages.deleteMessage')}
						</ContextMenuButton>
						<ContextMenuDivider />
					</>
				)}
			<ContextMenuButton
				icon="mdiIdentifier"
				onClick={copyId}
				iconProps={{
					style: {
						filter: "invert(100%)",
						background: "black",
						borderRadius: "4px",
					},
				}}
			>
				{t('messages.copyMessageId')}
			</ContextMenuButton>
		</ContextMenu>
	);
}

export default MessageContextMenu;
