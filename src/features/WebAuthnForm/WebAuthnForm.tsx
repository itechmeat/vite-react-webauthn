import { FC, useCallback, useEffect, useState } from "react";
import { client, parsers } from "@passwordless-id/webauthn";
import { AuthenticationParsed } from "@passwordless-id/webauthn/dist/esm/types";
import styles from "./WebAuthnForm.module.css";

export const WebAuthnForm: FC = () => {
  const [username, setUsername] = useState<string>(
    window.localStorage.getItem("username") || ""
  );

  const isClientAvailable = client.isAvailable();

  // Registration

  const [isRegistered, setIsRegistered] = useState(false);
  const challenge =
    window.localStorage.getItem("challenge_" + username) ||
    window.crypto.randomUUID();

  const checkIsRegistered = useCallback(async () => {
    setIsRegistered(!!window.localStorage.getItem("credential_" + username));
  }, [username]);

  useEffect(() => {
    if (username) {
      checkIsRegistered();
    }
  }, [checkIsRegistered, username]);

  const register = useCallback(async () => {
    const res = await client.register(username, challenge, {
      authenticatorType: "auto",
      userVerification: "required",
      timeout: 60000,
      attestation: false,
      debug: false,
    });
    const parsed = parsers.parseRegistration(res);
    window.localStorage.setItem("username", username);
    window.localStorage.setItem("credential_" + username, parsed.credential.id);
    window.localStorage.setItem("challenge_" + username, challenge);
    checkIsRegistered();
  }, [challenge, checkIsRegistered, username]);

  // Login

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticationData, setAuthenticationData] =
    useState<AuthenticationParsed | null>(null);

  const login = useCallback(async () => {
    const res = await client.authenticate(
      [window.localStorage.getItem("credential_" + username) || ""],
      challenge,
      {
        authenticatorType: "auto",
        userVerification: "required",
        timeout: 60000,
      }
    );
    const parsed = parsers.parseAuthentication(res);
    setIsAuthenticated(true);
    setAuthenticationData(parsed);
  }, [challenge, username]);

  if (!isClientAvailable) {
    return <div>WebAuthn is not available</div>;
  }

  return (
    <div className={styles.form}>
      {!isAuthenticated && (
        <p>
          <b>Username:</b>{" "}
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </p>
      )}

      <p>
        <button
          disabled={isRegistered || !!authenticationData}
          onClick={register}
        >
          Register
        </button>
        <span> </span>
        <button
          disabled={!isRegistered || !!authenticationData}
          onClick={login}
        >
          Login
        </button>
      </p>

      {authenticationData && (
        <>
          <h3>AuthenticationData</h3>
          <pre className={styles.data}>
            <code>{JSON.stringify(authenticationData, null, 2)}</code>
          </pre>
        </>
      )}
    </div>
  );
};
