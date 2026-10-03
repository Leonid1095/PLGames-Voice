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

import { AuthSubmit, FlowBase, FlowTitle } from "./Flow";
import { Fields, Form } from "./Form";
import { useEmailEnabled } from "./useEmailEnabled";

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

const ForgotLink = styled("a", {
  base: {
    color: "#E00A45",
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
    color: "#57534C",
    marginTop: "4px",
  },
});

/* ── component ──────────────────────────────────────── */

export default function FlowHome() {
  const state = useState();
  const modals = useModals();
  const { email } = useEmailEnabled();
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
            <Navigate href={state.layout.popNextPath() ?? "/"} />
          </Show>

          <FlowBase>
            <FlowTitle
              subtitle={<Trans>Your servers and voice are right here.</Trans>}
            >
              <Trans>Welcome back!</Trans>
            </FlowTitle>

            <Form onSubmit={performLogin}>
              <Fields fields={["email", "password"]} />

              <Show when={email()}>
                <ForgotLink href="/login/reset">
                  <Trans>Forgot your password?</Trans>
                </ForgotLink>
              </Show>

              <AuthSubmit type="submit">
                <Trans>Login</Trans>
              </AuthSubmit>

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

          <Text style={{ color: "#57534C", "font-size": "14px" }}>
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
