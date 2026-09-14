// Change this one number to update the queue count everywhere.
const PEOPLE_IN_LINE = 14;

const menuButton = document.querySelector("#menuButton");
const siteMenu = document.querySelector("#siteMenu");
const menuBackdrop = document.querySelector("#menuBackdrop");
const queueNumber = document.querySelector("#queueNumber");
const queueStatus = document.querySelector("#queueStatus");
const priorityButton = document.querySelector("#priorityButton");
const celebrationMessage = document.querySelector("#celebrationMessage");
const installButton = document.querySelector("#installButton");
const views = [...document.querySelectorAll(".view")];
const viewButtons = [...document.querySelectorAll("[data-view-target]")];
const navLinks = [...document.querySelectorAll(".nav-link")];

let deferredInstallPrompt = null;
let menuCloseTimer = null;

queueNumber.textContent = PEOPLE_IN_LINE;

function setMenu(open) {
  window.clearTimeout(menuCloseTimer);
  document.body.classList.toggle("menu-open", open);
  menuButton.classList.toggle("is-open", open);
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  siteMenu.classList.toggle("is-open", open);
  siteMenu.setAttribute("aria-hidden", String(!open));

  if (open) {
    menuBackdrop.hidden = false;
    requestAnimationFrame(() => menuBackdrop.classList.add("is-visible"));
    siteMenu.querySelector(".nav-link.is-active")?.focus({ preventScroll: true });
  } else {
    menuBackdrop.classList.remove("is-visible");
    menuCloseTimer = window.setTimeout(() => {
      menuBackdrop.hidden = true;
    }, 260);
  }
}

function showView(viewId, updateHistory = true) {
  const nextView = document.getElementById(viewId);
  if (!nextView || nextView.classList.contains("is-visible")) {
    setMenu(false);
    return;
  }

  const currentView = views.find((view) => view.classList.contains("is-visible"));
  currentView?.classList.remove("is-visible");

  window.setTimeout(() => {
    views.forEach((view) => {
      const selected = view.id === viewId;
      view.hidden = !selected;
      view.setAttribute("aria-hidden", String(!selected));
    });

    requestAnimationFrame(() => nextView.classList.add("is-visible"));
    document.title = viewId === "eye-rolling" ? "Eye Rolling · For Litzy" : "How to Always Be Right · For Litzy";
    navLinks.forEach((link) => link.classList.toggle("is-active", link.dataset.viewTarget === viewId));

    if (updateHistory) {
      history.replaceState(null, "", `#${viewId}`);
    }

    window.scrollTo({ top: 0, behavior: "instant" });
  }, 170);

  setMenu(false);
}

menuButton.addEventListener("click", () => {
  setMenu(!siteMenu.classList.contains("is-open"));
});

menuBackdrop.addEventListener("click", () => setMenu(false));

viewButtons.forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.viewTarget));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && siteMenu.classList.contains("is-open")) {
    setMenu(false);
    menuButton.focus();
  }
});

function moveQuentinToFront() {
  const alreadyMoved = priorityButton.classList.contains("is-complete");

  if (alreadyMoved) {
    queueStatus.textContent = "Quentin’s spot is still being guarded very carefully.";
    celebrationMessage.textContent = "No take-backs. Those are the rules ♡";
  } else {
    priorityButton.classList.add("is-complete");
    priorityButton.querySelector(".button-label").textContent = "Quentin is now #1";
    priorityButton.querySelector(".button-heart").textContent = "♥";
    queueStatus.textContent = `Still ${PEOPLE_IN_LINE} in line — but Quentin skipped all of them.`;
    celebrationMessage.textContent = "Special treatment has been officially approved ♡";
  }

  queueNumber.classList.remove("bump");
  celebrationMessage.classList.remove("pop");
  requestAnimationFrame(() => {
    queueNumber.classList.add("bump");
    celebrationMessage.classList.add("pop");
  });

  return {
    peopleInLine: PEOPLE_IN_LINE,
    quentinPosition: 1,
    alreadyAtFront: alreadyMoved
  };
}

priorityButton.addEventListener("click", moveQuentinToFront);

if (document.modelContext?.registerTool) {
  try {
    void Promise.resolve(
      document.modelContext.registerTool({
        name: "move_quentin_to_front",
        title: "Move Quentin to the front",
        description: "Move Quentin to position #1 in Litzy's eye-rolling queue and update the visible queue message.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false
        },
        annotations: {
          readOnlyHint: false,
          untrustedContentHint: false
        },
        execute(input) {
          if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length > 0) {
            throw new TypeError("This action does not accept any options.");
          }

          if (!document.querySelector("#eye-rolling").classList.contains("is-visible")) {
            showView("eye-rolling");
          }

          return moveQuentinToFront();
        }
      })
    ).catch(() => {});
  } catch {
    // WebMCP is optional; the visible interface remains fully functional.
  }
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButton.hidden = false;
});

installButton.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installButton.hidden = true;
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installButton.hidden = true;
});

const initialView = location.hash.slice(1);
if (initialView && document.getElementById(initialView)) {
  showView(initialView, false);
}

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {
      // The main site still works if offline support cannot be registered.
    });
  });
}
