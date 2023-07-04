import { useCallback, useEffect, useState } from "react";
import { client, parsers } from "@passwordless-id/webauthn";
import "./App.css";

function App() {
  // https://github.com/passwordless-id/webauthn
  // https://github.com/passwordless-id/webauthn/blob/main/demos/js/basic.js

  const isClientAvailable = client.isAvailable();

  const [username, setUsername] = useState<string>(
    window.localStorage.getItem("username") || ""
  );
  const [isRegistered, setIsRegistered] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const challenge =
    window.localStorage.getItem("challenge_" + username) ||
    window.crypto.randomUUID();
  const [authenticationData, setAuthenticationData] = useState<any>(null);

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
    <div style={{ textAlign: "left", width: "80vw" }}>
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
          <pre
            style={{
              width: "100%",
              overflow: "auto",
              background: "rgba(255, 255, 255, 0.2)",
              padding: "20px",
            }}
          >
            <code>{JSON.stringify(authenticationData, null, 2)}</code>
          </pre>
        </>
      )}
    </div>
  );
}

export default App;
