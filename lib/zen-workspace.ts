// The Zen workspace's names, shared by the hook (hooks/useZenWorkspace.ts)
// and the notebook layout, which inlines WORKSPACE_BOOT. A plain module: a
// server component reading these from a client module would get references,
// not the values.

export const WORKSPACE_KEY = "lockin.workspace";
export const WORKSPACE_CLASS = "lk-zen-ws";

/** Where the workspace shows: a section's page and the Inbox. */
export const isWorkspacePath = (pathname: string) => pathname === "/inbox" || pathname.startsWith("/subjects/");

/**
 * Sets the class before the first paint of a full load, so a reload in the
 * workspace doesn't flash the paper first. Inlined by the notebook layout;
 * keep it in step with isWorkspacePath.
 */
export const WORKSPACE_BOOT = `try{if(localStorage.getItem(${JSON.stringify(WORKSPACE_KEY)})==="zen"&&/^\\/(inbox$|subjects\\/)/.test(location.pathname))document.documentElement.classList.add(${JSON.stringify(WORKSPACE_CLASS)})}catch(e){}`;
