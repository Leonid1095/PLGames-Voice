import { For, createSignal } from "solid-js";
import { createFormControl, createFormGroup } from "solid-forms";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";
import { ulid } from "ulid";

import { useNavigate } from "@revolt/routing";
import { Column, Dialog, DialogProps, Form2, Text } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { useModals } from "..";
import { Modals } from "../types";

interface ServerTemplate {
  id: string;
  icon: string;
  name: string;
  description: string;
  categories: { title: string; channels: { name: string; type: "Text" | "VoiceChannel" }[] }[];
}

const TEMPLATES: ServerTemplate[] = [
  {
    id: "empty",
    icon: "add_circle",
    name: "Empty",
    description: "Start from scratch",
    categories: [],
  },
  {
    id: "gaming",
    icon: "sports_esports",
    name: "Gaming",
    description: "For gaming communities",
    categories: [
      {
        title: "💬 Общение",
        channels: [
          { name: "общий", type: "Text" },
          { name: "мемы", type: "Text" },
          { name: "скриншоты", type: "Text" },
        ],
      },
      {
        title: "🎮 Игры",
        channels: [
          { name: "поиск-тиммейтов", type: "Text" },
          { name: "гайды", type: "Text" },
        ],
      },
      {
        title: "🔊 Голос",
        channels: [
          { name: "Лобби", type: "VoiceChannel" },
          { name: "Игровой 1", type: "VoiceChannel" },
          { name: "Игровой 2", type: "VoiceChannel" },
          { name: "AFK", type: "VoiceChannel" },
        ],
      },
    ],
  },
  {
    id: "community",
    icon: "groups",
    name: "Community",
    description: "For communities and clubs",
    categories: [
      {
        title: "📢 Информация",
        channels: [
          { name: "правила", type: "Text" },
          { name: "объявления", type: "Text" },
        ],
      },
      {
        title: "💬 Общение",
        channels: [
          { name: "общий", type: "Text" },
          { name: "офф-топик", type: "Text" },
          { name: "медиа", type: "Text" },
        ],
      },
      {
        title: "🔊 Голос",
        channels: [
          { name: "Общий", type: "VoiceChannel" },
          { name: "Музыка", type: "VoiceChannel" },
        ],
      },
    ],
  },
  {
    id: "study",
    icon: "school",
    name: "Study",
    description: "For study groups",
    categories: [
      {
        title: "📚 Учёба",
        channels: [
          { name: "расписание", type: "Text" },
          { name: "домашка", type: "Text" },
          { name: "вопросы", type: "Text" },
          { name: "материалы", type: "Text" },
        ],
      },
      {
        title: "💬 Общение",
        channels: [
          { name: "общий", type: "Text" },
          { name: "мемы", type: "Text" },
        ],
      },
      {
        title: "🔊 Голос",
        channels: [
          { name: "Занятие", type: "VoiceChannel" },
          { name: "Свободная", type: "VoiceChannel" },
        ],
      },
    ],
  },
  {
    id: "friends",
    icon: "favorite",
    name: "Friends",
    description: "For a group of friends",
    categories: [
      {
        title: "💬 Чат",
        channels: [
          { name: "общий", type: "Text" },
          { name: "фото", type: "Text" },
        ],
      },
      {
        title: "🔊 Голос",
        channels: [
          { name: "Тусим", type: "VoiceChannel" },
          { name: "Кино", type: "VoiceChannel" },
        ],
      },
    ],
  },
];

/**
 * Modal to create a new server with template selection
 */
export function CreateServerModal(
  props: DialogProps & Modals & { type: "create_server" },
) {
  const { t } = useLingui();
  const navigate = useNavigate();
  const { showError } = useModals();

  const [selectedTemplate, setSelectedTemplate] = createSignal("empty");

  const group = createFormGroup({
    name: createFormControl("", { required: true }),
  });

  async function onSubmit() {
    try {
      const server = await props.client.servers.createServer({
        name: group.controls.name.value,
      });

      // Apply template
      const template = TEMPLATES.find((t) => t.id === selectedTemplate());
      if (template && template.categories.length > 0) {
        const categories: { id: string; title: string; channels: string[] }[] = [];

        for (const cat of template.categories) {
          const channelIds: string[] = [];
          for (const ch of cat.channels) {
            try {
              const channel = await server.createChannel({
                type: ch.type,
                name: ch.name,
              });
              channelIds.push(channel.id);
            } catch {
              // Skip failed channel creation
            }
          }
          categories.push({
            id: ulid(),
            title: cat.title,
            channels: channelIds,
          });
        }

        // Remove default "General" channel from uncategorized
        try {
          await server.edit({ categories });
        } catch {
          // Non-critical
        }
      }

      setTimeout(() => navigate(`/server/${server.id}`));
      props.onClose();
    } catch (error) {
      showError(error);
    }
  }

  const submit = Form2.useSubmitHandler(group, onSubmit);

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Create server</Trans>}
      actions={[
        { text: <Trans>Close</Trans> },
        {
          text: <Trans>Create</Trans>,
          onClick: () => {
            onSubmit();
            return false;
          },
          isDisabled: !Form2.canSubmit(group),
        },
      ]}
      isDisabled={group.isPending}
    >
      <form onSubmit={submit}>
        <Column gap="md">
          <Form2.TextField
            name="name"
            control={group.controls.name}
            label={t`Server Name`}
          />
          <TemplateLabel>
            <Trans>Template</Trans>
          </TemplateLabel>
          <TemplateGrid>
            <For each={TEMPLATES}>
              {(tmpl) => (
                <TemplateCard
                  selected={selectedTemplate() === tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl.id)}
                >
                  <Symbol size={24}>{tmpl.icon}</Symbol>
                  <TemplateName>{tmpl.name}</TemplateName>
                  <TemplateDesc>{tmpl.description}</TemplateDesc>
                </TemplateCard>
              )}
            </For>
          </TemplateGrid>
        </Column>
      </form>
    </Dialog>
  );
}

const TemplateLabel = styled("div", {
  base: {
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "var(--md-sys-color-on-surface-variant)",
  },
});

const TemplateGrid = styled("div", {
  base: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    gap: "8px",
  },
});

const TemplateCard = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    padding: "12px 8px",
    borderRadius: "8px",
    cursor: "pointer",
    border: "2px solid transparent",
    background: "var(--md-sys-color-surface-container)",
    transition: "all 0.15s",
    "&:hover": {
      background: "var(--md-sys-color-surface-container-high)",
    },
  },
  variants: {
    selected: {
      true: {
        borderColor: "var(--md-sys-color-primary)",
        background: "color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent)",
      },
    },
  },
});

const TemplateName = styled("span", {
  base: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--md-sys-color-on-surface)",
  },
});

const TemplateDesc = styled("span", {
  base: {
    fontSize: "10px",
    color: "var(--md-sys-color-on-surface-variant)",
    textAlign: "center",
  },
});
