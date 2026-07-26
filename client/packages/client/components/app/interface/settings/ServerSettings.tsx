/*
 * Lucide, matching the rest of the app. This sidebar was the last surface on
 * filled Boxicons, and it reused them lazily -- Roles, XP and Giveaways all
 * wore the same flag, three sections shared one envelope. Each entry now has
 * an icon that says what the section is.
 */
import {
  BarChart3,
  Bot,
  CalendarDays,
  ClipboardList,
  Gift,
  Info,
  LayoutDashboard,
  Mail,
  ScrollText,
  Shield,
  Smile,
  SmilePlus,
  Sparkles,
  Trash2,
  TrendingUp,
  UserX,
  Users,
} from "lucide-solid";

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
              icon: <LayoutDashboard size={20} stroke-width={1.75} />,
              title: t`Overview`,
            },
            {
              hidden: !server.havePermission("ManageServer"),
              id: "welcome",
              icon: <Sparkles size={20} stroke-width={1.75} />,
              title: t`Greetings and roles`,
            },
            {
              hidden: !server.havePermission("ManageServer"),
              id: "leveling",
              icon: <TrendingUp size={20} stroke-width={1.75} />,
              title: t`XP and levels`,
            },
          ],
        },
        {
          hidden: !server.havePermission("ManageCustomisation"),
          title: t`Customisation`,
          entries: [
            {
              id: "emojis",
              icon: <Smile size={20} stroke-width={1.75} />,
              title: t`Emoji`,
            },
          ],
        },
        {
          hidden:
            !server.havePermission("ManageServer") &&
            !server.havePermission("BanMembers"),
          title: t`Management`,
          entries: [
            {
              hidden: true,
              id: "members",
              icon: <Users size={20} stroke-width={1.75} />,
              title: t`Members`,
            },
            {
              hidden: !(
                server.havePermission("ManageRole") ||
                server.havePermission("ManagePermissions")
              ),
              id: "roles",
              icon: <Shield size={20} stroke-width={1.75} />,
              title: t`Roles`,
            },
            {
              hidden: !server.havePermission("ManageServer"),
              id: "invites",
              icon: <Mail size={20} stroke-width={1.75} />,
              title: t`Invites`,
            },
            {
              hidden: !server.havePermission("BanMembers"),
              id: "bans",
              icon: <UserX size={20} stroke-width={1.75} />,
              title: t`Bans`,
            },
            {
              hidden: !server.havePermission("ManageServer"),
              id: "events",
              icon: <CalendarDays size={20} stroke-width={1.75} />,
              title: t`Events`,
            },
            {
              hidden: !server.havePermission("ManageServer"),
              id: "forms",
              icon: <ClipboardList size={20} stroke-width={1.75} />,
              title: t`Forms`,
            },
            {
              hidden: !server.havePermission("ManageServer"),
              id: "giveaways",
              icon: <Gift size={20} stroke-width={1.75} />,
              title: t`Giveaways`,
            },
            {
              hidden: !server.havePermission("ManageServer"),
              id: "reaction-roles",
              icon: <SmilePlus size={20} stroke-width={1.75} />,
              title: t`Reaction roles`,
            },
            {
              hidden: !server.havePermission("ManageServer"),
              id: "automod",
              icon: <Bot size={20} stroke-width={1.75} />,
              title: t`Automod`,
            },
            {
              hidden: !server.havePermission("ManageServer"),
              id: "analytics",
              icon: <BarChart3 size={20} stroke-width={1.75} />,
              title: t`Analytics`,
            },
            {
              hidden: !server.havePermission("ManageServer"),
              id: "audit-log",
              icon: <ScrollText size={20} stroke-width={1.75} />,
              title: t`Audit log`,
            },
          ],
        },
        {
          hidden: !(server.ownerId === user()?.id),
          entries: [
            {
              icon: (
                <Trash2 size={20} stroke-width={1.75} color="var(--md-sys-color-error)" />
              ),
              title: t`Delete server`,
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
