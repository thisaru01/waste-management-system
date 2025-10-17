import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "../AuthContext.jsx";

function Harness() {
  const { user, token, signIn, signOut, hasRole } = useAuth();
  return (
    <div>
      <div data-testid="token">{token || ""}</div>
      <div data-testid="name">
        {user ? `${user.firstName} ${user.lastName}` : ""}
      </div>
      <div data-testid="isCollector">{hasRole("collector") ? "yes" : "no"}</div>
      <button
        onClick={() =>
          signIn({
            token: "t123",
            user: {
              firstName: "C",
              lastName: "U",
              roles: [{ name: "collector" }],
            },
          })
        }
      >
        signIn
      </button>
      <button onClick={() => signOut()}>signOut</button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("AuthContext", () => {
  it("signIn stores token/user and hasRole works", async () => {
    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );

    expect(screen.getByTestId("token").textContent).toBe("");
    expect(screen.getByTestId("isCollector").textContent).toBe("no");

    await userEvent.click(screen.getByText("signIn"));

    expect(screen.getByTestId("token").textContent).toBe("t123");
    expect(screen.getByTestId("name").textContent).toBe("C U");
    expect(screen.getByTestId("isCollector").textContent).toBe("yes");
    expect(localStorage.getItem("token")).toBe("t123");
    expect(JSON.parse(localStorage.getItem("user"))).toMatchObject({
      firstName: "C",
    });
  });

  it("signOut clears token/user", async () => {
    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );

    await userEvent.click(screen.getByText("signIn"));
    await userEvent.click(screen.getByText("signOut"));

    expect(screen.getByTestId("token").textContent).toBe("");
    expect(screen.getByTestId("name").textContent).toBe("");
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });
});
