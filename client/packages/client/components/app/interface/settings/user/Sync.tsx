import { Trans } from "@lingui-solid/solid/macro";
import { Brush, Globe, Palette } from "lucide-solid";

import {
  CategoryButton,
  CategoryButtonGroup,
  Checkbox,
  Column,
  Time,
  iconSize,
} from "@revolt/ui";

/**
 * Sync Configuration Page
 */
export default function Sync() {
  return (
    <Column gap="lg">
      <CategoryButtonGroup>
        <CategoryButton
          action={<Checkbox checked onChange={(value) => void value} />}
          onClick={() => void 0}
          icon={<Palette {...iconSize(22)} />}
          description={
            <Trans>
              Sync appearance options, such as chosen emoji pack and message
              density.
            </Trans>
          }
        >
          <Trans>Appearance</Trans>
        </CategoryButton>
        <CategoryButton
          action={<Checkbox checked onChange={(value) => void value} />}
          onClick={() => void 0}
          icon={<Brush {...iconSize(22)} />}
          description={
            <Trans>Sync your chosen theme, colours, and any custom CSS.</Trans>
          }
        >
          <Trans>Theme</Trans>
        </CategoryButton>
        <CategoryButton
          action={<Checkbox checked onChange={(value) => void value} />}
          onClick={() => void 0}
          icon={<Globe {...iconSize(22)} />}
          description={<Trans>Sync your currently chosen language.</Trans>}
        >
          <Trans>Language</Trans>
        </CategoryButton>
      </CategoryButtonGroup>
      <CategoryButtonGroup>
        <CategoryButton>
          <Trans>
            Last sync <Time format="relative" value={0} />
          </Trans>
        </CategoryButton>
      </CategoryButtonGroup>
    </Column>
  );
}
