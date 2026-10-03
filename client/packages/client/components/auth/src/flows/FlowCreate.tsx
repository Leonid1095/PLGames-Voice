import { Trans } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { useApi, useClientLifecycle } from "@revolt/client";
import { CONFIGURATION } from "@revolt/common";
import { useModals } from "@revolt/modal";
import { useNavigate } from "@revolt/routing";

import { AuthSubmit, FlowBase, FlowTitle } from "./Flow";
import { setFlowCheckEmail } from "./FlowCheck";
import { Fields, Form } from "./Form";

const LinkText = styled("a", {
  base: {
    color: "#E00A45",
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
    color: "#57534C",
    marginTop: "4px",
  },
});

/**
 * Create-account flow — same card and CTA as the landing.
 */
type RootConfig = {
  features?: {
    email?: boolean;
  };
};

export default function FlowCreate() {
  const api = useApi();
  const navigate = useNavigate();
  const modals = useModals();
  const { login } = useClientLifecycle();

  async function create(data: FormData) {
    const email = data.get("email") as string;
    const password = data.get("password") as string;
    const captcha = data.get("captcha") as string;

    // Mail stays on unless the server explicitly says it is off.
    // A failed config request must not log someone into an unverified account.
    let emailOn = true;
    try {
      const root = (await api.get("/")) as RootConfig;
      emailOn = root.features?.email === true;
    } catch {
      emailOn = true;
    }

    await api.post("/auth/account/create", {
      email,
      password,
      captcha,
    });

    if (emailOn) {
      setFlowCheckEmail(email);
      navigate("/login/check", { replace: true });
      return;
    }

    await login({ email, password }, modals);
    navigate("/login", { replace: true });
  }

  return (
    <FlowBase>
      <FlowTitle>
        <Trans>Create an account</Trans>
      </FlowTitle>

      <Form onSubmit={create} captcha={CONFIGURATION.HCAPTCHA_SITEKEY}>
        <Fields fields={["email", "password"]} />

        <AuthSubmit type="submit">
          <Trans>Register</Trans>
        </AuthSubmit>

        <BottomLinks>
          <LinkText href="/login">
            <Trans>Already have an account?</Trans>
          </LinkText>
        </BottomLinks>
      </Form>
    </FlowBase>
  );
}
