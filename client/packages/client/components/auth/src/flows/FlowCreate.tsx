import { Trans } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { CONFIGURATION } from "@revolt/common";
import { useNavigate } from "@revolt/routing";
import { Button } from "@revolt/ui";

import { useApi } from "../../../client";

import { FlowBase, FlowTitle } from "./Flow";
import { setFlowCheckEmail } from "./FlowCheck";
import { Fields, Form } from "./Form";

/* ── Discord-style link ──────────────────────────────── */

const LinkText = styled("a", {
  base: {
    color: "#A78BFA",
    fontSize: "14px",
    textDecoration: "none",
    cursor: "pointer",
    _hover: {
      textDecoration: "underline",
    },
  },
});

const BottomLinks = styled("div", {
  base: {
    fontSize: "14px",
    color: "#6E6889",
    marginTop: "4px",
  },
});

/**
 * Flow for creating a new account — Discord-style
 */
export default function FlowCreate() {
  const api = useApi();
  const navigate = useNavigate();

  async function create(data: FormData) {
    const email = data.get("email") as string;
    const password = data.get("password") as string;
    const captcha = data.get("captcha") as string;

    await api.post("/auth/account/create", {
      email,
      password,
      captcha,
    });

    setFlowCheckEmail(email);
    navigate("/login/check", { replace: true });
  }

  return (
    <FlowBase>
      <FlowTitle>
        <Trans>Create an account</Trans>
      </FlowTitle>

      <Form onSubmit={create} captcha={CONFIGURATION.HCAPTCHA_SITEKEY}>
        <Fields fields={["email", "password"]} />

        <Button
          type="submit"
          style={{
            width: "100%",
            "margin-top": "8px",
            background: "#7C3AED",
            color: "#fff",
          }}
        >
          <Trans>Register</Trans>
        </Button>

        <BottomLinks>
          <LinkText href="/login">
            <Trans>Already have an account?</Trans>
          </LinkText>
        </BottomLinks>
      </Form>
    </FlowBase>
  );
}
