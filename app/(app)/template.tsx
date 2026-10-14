import { ViewTransition } from "react";

// Moving between pages of the notebook: the page leaving fades, the one
// arriving settles up into place (globals.css, "Motion"). A template remounts
// on every navigation where the layout stays, so enter and exit fire here;
// opening a note or switching tabs only changes the query and doesn't.
export default function PageTurn({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="lk-page-in" exit="lk-page-out" default="none">
      {children}
    </ViewTransition>
  );
}
