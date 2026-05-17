import { Match, Show, Switch } from "solid-js";
import { ArrowLeft } from "lucide-solid";

import { Trans } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { useClientLifecycle } from "@revolt/client";
import { State, TransitionType } from "@revolt/client/Controller";
import { useModals } from "@revolt/modal";
import { Navigate } from "@revolt/routing";
import { useState } from "@revolt/state";
import {
  Button,
  CircularProgress,
  Column,
  Row,
  Text,
  iconSize,
} from "@revolt/ui";

import { FlowBase, FlowTitle } from "./Flow";
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

const ForgotLink = styled("a", {
  base: {
    color: "#A78BFA",
    fontSize: "14px",
    textDecoration: "none",
    cursor: "pointer",
    marginTop: "-12px",
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
    background: "#7C3AED",
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

/* ── component ──────────────────────────────────────── */

export default function FlowHome() {
  const state = useState();
  const modals = useModals();
  const { lifecycle, isLoggedIn, login, selectUsername } =
    useClientLifecycle();

  async function performLogin(data: FormData) {
    const email = data.get("email") as string;
    const password = data.get("password") as string;

    await login(
      {
        email,
        password,
      },
      modals,
    );
  }

  async function select(data: FormData) {
    const username = data.get("username") as string;
    await selectUsername(username);
  }

  return (
    <Switch
      fallback={
        <>
          <Show when={isLoggedIn()}>
            <Navigate href={state.layout.popNextPath() ?? "/app"} />
          </Show>

          <FlowBase>
            <FlowTitle
              subtitle={<Trans>We're so excited to see you again!</Trans>}
            >
              <Trans>Welcome back!</Trans>
            </FlowTitle>

            <Form onSubmit={performLogin}>
              <Fields fields={["email", "password"]} />

              <ForgotLink href="/login/reset">
                <Trans>Forgot your password?</Trans>
              </ForgotLink>

              <AuthButton type="submit">
                <Trans>Login</Trans>
              </AuthButton>

              <BottomLinks>
                <Trans>Need an account?</Trans>{" "}
                <LinkText href="/login/create">
                  <Trans>Register</Trans>
                </LinkText>
              </BottomLinks>
            </Form>
          </FlowBase>
        </>
      }
    >
      <Match when={lifecycle.state() === State.LoggingIn}>
        <FlowBase>
          <CircularProgress />
        </FlowBase>
      </Match>
      <Match when={lifecycle.state() === State.Onboarding}>
        <FlowBase>
          <FlowTitle>
            <Trans>Choose a username</Trans>
          </FlowTitle>

          <Text style={{ color: "#A098B8", "font-size": "14px" }}>
            <Trans>
              Pick a username that you want people to be able to find you by.
              This can be changed later in your user settings.
            </Trans>
          </Text>

          <Form onSubmit={select}>
            <Fields fields={["username"]} />
            <Row align justify>
              <Button
                variant="text"
                onPress={() =>
                  lifecycle.transition({
                    type: TransitionType.Cancel,
                  })
                }
              >
                <ArrowLeft {...iconSize("1.2em")} /> <Trans>Cancel</Trans>
              </Button>
              <Button type="submit">
                <Trans>Confirm</Trans>
              </Button>
            </Row>
          </Form>
        </FlowBase>
      </Match>
      <Match when={lifecycle.permanentError === "InvalidSession"}>
        <FlowBase>
          <FlowTitle>
            <Trans>You were logged out!</Trans>
          </FlowTitle>

          <Button
            variant="filled"
            onPress={() =>
              lifecycle.transition({
                type: TransitionType.Dismiss,
              })
            }
          >
            <Trans>OK</Trans>
          </Button>
        </FlowBase>
      </Match>
    </Switch>
  );
}
