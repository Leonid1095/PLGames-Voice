import { Trans } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { CONFIGURATION } from "@revolt/common";
import { useNavigate } from "@revolt/routing";

import { useApi } from "../../../client";

import { FlowBase, FlowTitle } from "./Flow";
import { setFlowCheckEmail } from "./FlowCheck";
import { Fields, Form } from "./Form";

const AuthButton = styled("button", {
  base: {
    width: "100%",
    marginTop: "8px",
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
    color: "#fff",
    background: "var(--md-sys-color-primary)",
    transition: "background var(--transition-medium), box-shadow var(--transition-medium)",
    _hover: {
      background: "#6D28D9",
      boxShadow: "0 0 20px rgba(124,58,237,0.25)",
    },
    _active: {
      background: "#5B21B6",
    },
  },
});

/* ── Discord-style link ──────────────────────────────── */

const LinkText = styled("a", {
  base: {
    color: "var(--md-sys-color-primary)",
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

        <AuthButton type="submit">
          <Trans>Register</Trans>
        </AuthButton>

        <BottomLinks>
          <LinkText href="/login">
            <Trans>Already have an account?</Trans>
          </LinkText>
        </BottomLinks>
      </Form>
    </FlowBase>
  );
}
