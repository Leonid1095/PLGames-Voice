// loosely based on https://github.com/revoltchat/frontend/blob/master/components/app/menus/UserContextMenu.tsx

import { modalController } from "@/controllers/modals";
import { useAppStore } from "@hooks/useAppStore";
import { GuildMember, User } from "@structures";
import { useTranslation } from "react-i18next";
import { ContextMenu, ContextMenuButton, ContextMenuDivider } from "./ContextMenu";

interface MenuProps {
	user: User;
	member?: GuildMember;
}

function UserContextMenu({ user, member }: MenuProps) {
	const app = useAppStore();
	const { t } = useTranslation();
	const guild = member ? app.guilds.get(member.guild.id) : undefined;
	const guildMe = guild ? guild.members.get(app.account!.id) : undefined;

	/**
	 * Copy user id to clipboard
	 */
	function copyId() {
		navigator.clipboard.writeText(user.id);
	}

	/**
	 * Open kick modal
	 */
	function kick() {
		if (!member) return;
		modalController.push({
			type: "kick_member",
			target: member,
		});
	}

	/**
	 * Open ban modal
	 */
	function ban() {
		if (!member) return;
		modalController.push({
			type: "ban_member",
			target: member,
		});
	}

	return (
		<ContextMenu>
			<ContextMenuButton disabled>{t('user.profile')}</ContextMenuButton>
			<ContextMenuButton disabled>{t('user.mention')}</ContextMenuButton>
			<ContextMenuButton disabled>{t('user.message')}</ContextMenuButton>
			<ContextMenuDivider />
			{member && <ContextMenuButton disabled>{t('user.changeNickname')}</ContextMenuButton>}
			<ContextMenuButton disabled>{t('user.addFriend')}</ContextMenuButton>
			<ContextMenuButton disabled>{t('user.block')}</ContextMenuButton>
			<ContextMenuDivider />
			{member && guildMe && (
				<>
					{guildMe.hasPermission("KICK_MEMBERS") && (
						<ContextMenuButton destructive onClick={kick}>
							{t('user.kick', { name: member?.nick ?? user.username })}
						</ContextMenuButton>
					)}
					{guildMe.hasPermission("BAN_MEMBERS") && (
						<>
							<ContextMenuButton destructive onClick={ban}>
								{t('user.ban', { name: member?.nick ?? user.username })}
							</ContextMenuButton>
							<ContextMenuDivider />
						</>
					)}
					{guildMe.hasPermission("MANAGE_ROLES") && (
						<>
							<ContextMenuButton disabled icon="mdiChevronRight">
								{t('user.roles')}
							</ContextMenuButton>
							<ContextMenuDivider />
						</>
					)}
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
				{t('user.copyUserId')}
			</ContextMenuButton>
		</ContextMenu>
	);
}

export default UserContextMenu;
