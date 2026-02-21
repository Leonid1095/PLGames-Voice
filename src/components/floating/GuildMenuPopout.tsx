import useLogger from "@hooks/useLogger";
import styled from "styled-components";

import { modalController } from "@/controllers/modals";
import { ContextMenu, ContextMenuButton, ContextMenuDivider } from "@components/contextMenus/ContextMenu";
import { useAppStore } from "@hooks/useAppStore";
import { Permissions } from "@utils";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

const CustomContextMenu = styled(ContextMenu)`
	width: 200px;
`;

function GuildMenuPopout() {
	const { activeGuild, account } = useAppStore();
	const logger = useLogger("GuildMenuPopout");
	const { t } = useTranslation();

	const [hasCreateChannelPermission, setHasCreateChannelPermission] = React.useState(false);

	useEffect(() => {
		if (!activeGuild) return;

		const permission = Permissions.getPermission(account!.id, activeGuild, undefined);
		const hasPermission = permission.has("MANAGE_CHANNELS");
		setHasCreateChannelPermission(hasPermission);
	}, [activeGuild]);

	if (!activeGuild) {
		logger.error("activeGuild is undefined");
		return null;
	}

	function leaveGuild() {
		modalController.push({
			type: "leave_server",
			target: activeGuild!,
		});
	}

	function onChannelCreateClick() {
		modalController.push({
			type: "create_channel",
			guild: activeGuild!,
		});
	}

	return (
		<CustomContextMenu>
			<ContextMenuButton icon="mdiCog" disabled>
				{t('guild.serverSettings')}
			</ContextMenuButton>
			{hasCreateChannelPermission && (
				<>
					<ContextMenuButton icon="mdiPlusCircle" onClick={onChannelCreateClick}>
						{t('guild.createChannel')}
					</ContextMenuButton>
					<ContextMenuButton icon="mdiFolderPlus" disabled>
						{t('guild.createCategory')}
					</ContextMenuButton>
				</>
			)}
			<ContextMenuDivider />
			<ContextMenuButton icon="mdiBell" disabled>
				{t('guild.notificationSettings')}
			</ContextMenuButton>
			<ContextMenuButton icon="mdiShieldLock" disabled>
				{t('guild.privacySettings')}
			</ContextMenuButton>
			<ContextMenuDivider />
			<ContextMenuButton icon="mdiLocationExit" destructive onClick={leaveGuild}>
				{t('guild.leaveGuild')}
			</ContextMenuButton>
		</CustomContextMenu>
	);
}

export default GuildMenuPopout;
