import { Trans } from "@lingui-solid/solid/macro";
import { AlertCircle } from "lucide-solid";

import { useError } from "@revolt/i18n";
import { Dialog, DialogProps, iconSize } from "@revolt/ui";

import { Modals } from "../types";

export function Error2Modal(props: DialogProps & Modals & { type: "error2" }) {
  const err = useError();

  return (
    <Dialog
      icon={<AlertCircle {...iconSize(24)} />}
      show={props.show}
      onClose={props.onClose}
      title={<Trans>An error occurred.</Trans>}
      actions={[{ text: <Trans>OK</Trans> }]}
    >
      {err(props.error)}
    </Dialog>
  );
}
