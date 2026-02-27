import { Match, Show, Switch } from "solid-js";

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

import MdArrowBack from "@material-design-icons/svg/filled/arrow_back.svg?component-solid";

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

              <Button
                type="submit"
                style={{
                  width: "100%",
                  "margin-top": "8px",
                  background: "#7C3AED",
                  color: "#fff",
                }}
              >
                <Trans>Login</Trans>
              </Button>

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
                <MdArrowBack {...iconSize("1.2em")} /> <Trans>Cancel</Trans>
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
