// Development-only harness. Not imported by the application or its production build.
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { CaseWorkspace } from "../src/components/case-workspace";
import { browserFixtures } from "./case-fixtures";
import "../src/styles.css";

// Test-only microphone: no access to the user's actual audio devices.
class FakeRecorder {
  state = "inactive";
  mimeType = "audio/webm";
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror = null;
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["test audio"]) });
    this.onstop?.();
  }
}
Object.defineProperty(navigator, "mediaDevices", {
  configurable: true,
  value: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) },
});
window.MediaRecorder = FakeRecorder as unknown as typeof MediaRecorder;
const storageSetItem = Storage.prototype.setItem;

export function Harness() {
  const [index, setIndex] = useState(0);
  const [largeText, setLargeText] = useState(false);
  const [storageFailure, setStorageFailure] = useState(false);
  const definition = browserFixtures[index]!;
  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          zIndex: 9999,
          background: "#222",
          padding: 4,
          height: 40,
          fontSize: 12,
        }}
      >
        <label>
          Testcase{" "}
          <select
            aria-label="Testcase"
            value={index}
            onChange={(event) => setIndex(Number(event.target.value))}
          >
            {browserFixtures.map((item, i) => (
              <option key={item.id} value={i}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={largeText}
            onChange={(event) => setLargeText(event.target.checked)}
          />
          200 % tekst
        </label>
        <label>
          <input
            type="checkbox"
            checked={storageFailure}
            onChange={(event) => {
              setStorageFailure(event.target.checked);
              Storage.prototype.setItem = event.target.checked
                ? () => {
                    throw new Error("Simulated quota error");
                  }
                : storageSetItem;
            }}
          />
          Lagringsfeil
        </label>
      </div>
      <style>{`html { font-size: ${largeText ? 32 : 16}px; } .case-workspace { padding-bottom: 40px; }`}</style>
      <CaseWorkspace
        key={definition.id}
        definition={definition}
        onExit={() => setIndex((value) => (value + 1) % browserFixtures.length)}
      />
    </>
  );
}

const route = createRootRoute({ component: Harness });
const router = createRouter({
  routeTree: route,
  history: createMemoryHistory({ initialEntries: ["/"] }),
});
createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
