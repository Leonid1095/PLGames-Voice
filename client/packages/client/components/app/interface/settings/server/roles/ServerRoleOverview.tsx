import { Show } from "solid-js";
import { GripVertical, List, UserPlus } from "lucide-solid";

import { Trans } from "@lingui-solid/solid/macro";
import { useMutation } from "@tanstack/solid-query";
import { Server } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useModals } from "@revolt/modal";
import { CategoryButton, Column, Draggable, Text, iconSize } from "@revolt/ui";
import { createDragHandle } from "@revolt/ui/components/utils/Draggable";

import { useSettingsNavigation } from "../../Settings";

/**
 * Menu to see all roles
 */
export function ServerRoleOverview(props: { context: Server }) {
  const { navigate } = useSettingsNavigation();
  const { openModal, showError } = useModals();

  const change = useMutation(() => ({
    mutationFn: (order: string[]) => props.context.setRoleOrdering(order),
    onError: showError,
  }));

  function createRole() {
    openModal({
      type: "create_role",
      server: props.context,
      callback(roleId) {
        navigate(`roles/${roleId}`);
      },
    });
  }

  return (
    <Column gap="lg">
      <Column gap="sm">
        <CategoryButton
          icon={<List size={20} />}
          action="chevron"
          description={<Trans>Affects all roles and users</Trans>}
          onClick={() => navigate("roles/default")}
        >
          <Trans>Default Permissions</Trans>
        </CategoryButton>
        <CategoryButton
          icon={<UserPlus {...iconSize(20)} />}
          action="chevron"
          description={<Trans>Create a new role</Trans>}
          onClick={createRole}
        >
          <Trans>Create Role</Trans>
        </CategoryButton>
      </Column>

      <Column gap="sm">
        <Text class="label">
          <Trans>Server Roles</Trans>
          <Show when={change.isPending}>
            {" "}
            <Trans>(changes are being saved…)</Trans>
          </Show>
        </Text>
        <Draggable
          dragHandles
          items={props.context.orderedRoles}
          onChange={change.mutate}
        >
          {(entry) => (
            <ItemContainer>
              <GripVertical
                {...createDragHandle(entry.dragDisabled, entry.setDragDisabled)}
              />

              <CategoryButton
                icon={
                  <RoleIcon
                    style={{
                      background:
                        entry.item.colour ??
                        "var(--md-sys-color-outline-variant)",
                    }}
                  />
                }
                action="chevron"
                onClick={() => navigate(`roles/${entry.item.id}`)}
              >
                {entry.item.name}
              </CategoryButton>
            </ItemContainer>
          )}
        </Draggable>
      </Column>
    </Column>
  );
}

const RoleIcon = styled("div", {
  base: {
    width: "100%",
    height: "100%",
    aspectRatio: "1/1",
    borderRadius: "100%",
  },
});

const ItemContainer = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-md)",
    paddingBottom: "var(--gap-md)",

    // grow the button to full width
    "& > :nth-child(2)": {
      flexGrow: 1,
    },
  },
});
