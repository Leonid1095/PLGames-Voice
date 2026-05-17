import { Trans } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";
import { Bug, ListOrdered, Star } from "lucide-solid";

import {
  CategoryButton,
  CategoryButtonGroup,
  Column,
  iconSize,
} from "@revolt/ui";

const FEEDBACK_URL = "https://github.com/Leonid1095/PLGames-Voice/issues";

/**
 * Feedback
 */
export function Feedback() {
  return (
    <Column gap="lg">
      <CategoryButtonGroup>
        <CategoryButton
          action="external"
          icon={<Star {...iconSize(22)} />}
          onClick={() => window.open(`${FEEDBACK_URL}/new?labels=enhancement&template=feature_request.md`, "_blank")}
          description={
            <Trans>Suggest new PLG Voice features.</Trans>
          }
        >
          <Trans>Submit feature suggestion</Trans>
        </CategoryButton>
        <CategoryButton
          action="external"
          icon={<ListOrdered {...iconSize(22)} />}
          onClick={() => window.open(`${FEEDBACK_URL}/new`, "_blank")}
          description={<Trans>Submit feedback</Trans>}
        >
          <Trans>Feedback</Trans>
        </CategoryButton>
        <CategoryButton
          action="external"
          icon={<Bug {...iconSize(22)} />}
          onClick={() => window.open(`${FEEDBACK_URL}?q=is%3Aissue+label%3Abug`, "_blank")}
          description={<Trans>View currently active bug reports here.</Trans>}
        >
          <Trans>Bug Tracker</Trans>
        </CategoryButton>
      </CategoryButtonGroup>
    </Column>
  );
}

/**
 * Link without decorations
 */
const Link = styled("a", {
  base: {
    textDecoration: "none",
  },
});
