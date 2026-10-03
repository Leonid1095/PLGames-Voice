import { Show } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";

import { useApi } from "@revolt/client";
import { CONFIGURATION } from "@revolt/common";
import { useNavigate } from "@revolt/routing";
import { Button, CircularProgress, Text } from "@revolt/ui";

import { FlowBase, FlowTitle } from "./Flow";
import { setFlowCheckEmail } from "./FlowCheck";
import { Fields, Form } from "./Form";
import { useEmailEnabled } from "./useEmailEnabled";

/**
 * Flow for sending password reset
 */
export default function FlowReset() {
  const api = useApi();
  const navigate = useNavigate();
  const { loading, email } = useEmailEnabled();
  const { t } = useLingui();
  const resetUnavailable = t`Password reset is sent by email. This server is not sending mail yet, so sign in with your current password.`;

  /**
   * Send password reset
   * @param data Form Data
   */
  async function reset(data: FormData) {
    const email = data.get("email") as string;
    const captcha = data.get("captcha") as string;

    await api.post("/auth/account/reset_password", {
      email,
      captcha,
    });

    setFlowCheckEmail(email);
    navigate("/login/check", { replace: true });
  }

  return (
    <FlowBase>
      <FlowTitle>
        <Trans>Reset password</Trans>
      </FlowTitle>
      <Show when={!loading()} fallback={<CircularProgress />}>
        <Show
          when={email()}
          fallback={
            <Text style={{ color: "#57534C", "font-size": "14px" }}>
              {resetUnavailable}
            </Text>
          }
        >
          <Form onSubmit={reset} captcha={CONFIGURATION.HCAPTCHA_SITEKEY}>
            <Fields fields={["email"]} />
            <Button type="submit">
              <Trans>Reset</Trans>
            </Button>
          </Form>
        </Show>
      </Show>
      <a href="/login/auth">
        <Button variant="text">
          <Trans>Go back to login</Trans>
        </Button>
      </a>
      {import.meta.env.DEV && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            background: "white",
            color: "black",
            cursor: "pointer",
          }}
          onClick={() => {
            navigate("/login/reset/abc", { replace: true });
          }}
        >
          Mock Reset Screen
        </div>
      )}
    </FlowBase>
  );
}
