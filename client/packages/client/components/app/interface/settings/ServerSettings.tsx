import {
  BiSolidEnvelope,
  BiSolidFlagAlt,
  BiSolidGroup,
  BiSolidHappyBeaming,
  BiSolidInfoCircle,
  BiSolidShield,
  BiSolidTrash,
  BiSolidUserX,
} from "solid-icons/bi";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { Server } from "stoat.js";

import { useUser } from "@revolt/client";
import { TextWithEmoji } from "@revolt/markdown";
import { useModals } from "@revolt/modal";
import { ColouredText } from "@revolt/ui";

import { SettingsConfiguration } from ".";
import { ChannelPermissionsEditor } from "./channel/permissions/ChannelPermissionsEditor";
import Overview from "./server/Overview";
import { ListServerBans } from "./server/bans/ListBans";
import { EmojiList } from "./server/emojis/EmojiList";
import { ListServerInvites } from "./server/invites/ListServerInvites";
import { Analytics } from "./server/Analytics";
import { AuditLog } from "./server/AuditLog";
import { Automod } from "./server/Automod";
import { Events } from "./server/Events";
import { Forms } from "./server/Forms";
import { Giveaways } from "./server/Giveaways";
import { Leveling } from "./server/Leveling";
import { ReactionRoles } from "./server/ReactionRoles";
import { Welcome } from "./server/Welcome";
import { ServerRoleEditor } from "./server/roles/ServerRoleEditor";
import { ServerRoleOverview } from "./server/roles/ServerRoleOverview";

const Config: SettingsConfiguration<Server> = {
  /**
   * Page titles
   * @param key
   */
  title(ctx, key) {
    const { t } = useLingui();

    if (key.startsWith("roles/")) {
      if (key === "roles/default") return t`Default Permissions`;

      return ctx.context.roles.get(key.substring(6))?.name ?? "";
    }

    return ctx.entries
      .flatMap((category) => category.entries)
      .find((entry) => entry.id === key)?.title as string;
  },

  /**
   * Render the current server settings page
   */
  // we take care of the reactivity ourselves
  /* eslint-disable solid/components-return-once */
  render(props, server) {
    const id = props.page();

    if (!server.$exists) {
      useModals().pop();
      return null;
    }

    if (id?.startsWith("roles/")) {
      if (id === "roles/default") {
        return (
          <ChannelPermissionsEditor type="server_default" context={server} />
        );
      }

      return <ServerRoleEditor context={server} roleId={id.substring(6)} />;
    }

    switch (id) {
      case "overview":
        return <Overview server={server} />;
      case "emojis":
        return <EmojiList server={server} />;
      case "roles":
        return <ServerRoleOverview context={server} />;
      case "invites":
        return <ListServerInvites server={server} />;
      case "bans":
        return <ListServerBans server={server} />;
      case "audit-log":
        return <AuditLog server={server} />;
      case "welcome":
        return <Welcome server={server} />;
      case "leveling":
        return <Leveling server={server} />;
      case "automod":
        return <Automod server={server} />;
      case "analytics":
        return <Analytics server={server} />;
      case "reaction-roles":
        return <ReactionRoles server={server} />;
      case "giveaways":
        return <Giveaways server={server} />;
      case "events":
        return <Events server={server} />;
      case "forms":
        return <Forms server={server} />;

      default:
        return null;
    }
  },
  /* eslint-enable solid/components-return-once */

  /**
   * Generate list of categories / entries for server settings
   * @returns List
   */
  list(server) {
    const { t } = useLingui();
    const user = useUser();
    const { openModal } = useModals();

    return {
      context: server,
      entries: [
        {
          title: <TextWithEmoji content={server.name} />,
          entries: [
            {
              id: "overview",
              icon: <BiSolidInfoCircle size={20} />,
              title: t`Обзор`,
            },
            {
              hidden: !server.havePermission("ManageServer"),
              id: "welcome",
              icon: <BiSolidEnvelope size={20} />,
              title: t`Приветствия и роли`,
            },
            {
              hidden: !server.havePermission("ManageServer"),
              id: "leveling",
              icon: <BiSolidFlagAlt size={20} />,
              title: t`XP и уровни`,
            },
          ],
        },
        {
          hidden: !server.havePermission("ManageCustomisation"),
          title: t`Кастомизация`,
          entries: [
            {
              id: "emojis",
              icon: <BiSolidHappyBeaming size={20} />,
              title: t`Эмодзи`,
            },
          ],
        },
        {
          hidden:
            !server.havePermission("ManageServer") &&
            !server.havePermission("BanMembers"),
          title: t`Управление`,
          entries: [
            {
              hidden: true,
              id: "members",
              icon: <BiSolidGroup size={20} />,
              title: t`Участники`,
            },
            {
              hidden: !(
                server.havePermission("ManageRole") ||
                server.havePermission("ManagePermissions")
              ),
              id: "roles",
              icon: <BiSolidFlagAlt size={20} />,
              title: t`Роли`,
            },
            {
              hidden: !server.havePermission("ManageServer"),
              id: "invites",
              icon: <BiSolidEnvelope size={20} />,
              title: t`Приглашения`,
            },
            {
              hidden: !server.havePermission("BanMembers"),
              id: "bans",
              icon: <BiSolidUserX size={20} />,
              title: t`Баны`,
            },
            {
              hidden: !server.havePermission("ManageServer"),
              id: "events",
              icon: <BiSolidInfoCircle size={20} />,
              title: t`События`,
            },
            {
              hidden: !server.havePermission("ManageServer"),
              id: "forms",
              icon: <BiSolidEnvelope size={20} />,
              title: t`Формы`,
            },
            {
              hidden: !server.havePermission("ManageServer"),
              id: "giveaways",
              icon: <BiSolidFlagAlt size={20} />,
              title: t`Розыгрыши`,
            },
            {
              hidden: !server.havePermission("ManageServer"),
              id: "reaction-roles",
              icon: <BiSolidHappyBeaming size={20} />,
              title: t`Роли по реакции`,
            },
            {
              hidden: !server.havePermission("ManageServer"),
              id: "automod",
              icon: <BiSolidShield size={20} />,
              title: t`Автомодерация`,
            },
            {
              hidden: !server.havePermission("ManageServer"),
              id: "analytics",
              icon: <BiSolidInfoCircle size={20} />,
              title: t`Аналитика`,
            },
            {
              hidden: !server.havePermission("ManageServer"),
              id: "audit-log",
              icon: <BiSolidShield size={20} />,
              title: t`Аудит-лог`,
            },
          ],
        },
        {
          hidden: !(server.ownerId === user()?.id),
          entries: [
            {
              icon: (
                <BiSolidTrash size={20} color="var(--md-sys-color-error)" />
              ),
              title: t`Удалить сервер`,
              /**
               * Handle server deletion request
               */
              onClick() {
                openModal({
                  type: "delete_server",
                  server,
                });
              },
            },
          ],
        },
      ],
    };
  },
};

export default Config;

export type ServerSettingsProps = {
  /**
   * Server
   */
  server: Server;
};
