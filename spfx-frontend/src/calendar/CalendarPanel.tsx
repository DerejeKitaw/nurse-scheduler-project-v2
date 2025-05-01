import * as React from "react";
import { Panel } from "@fluentui/react/lib/Panel";
import { DefaultButton } from "@fluentui/react/lib/Button";
import NurseCalendar from "./NurseCalendar";

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onDayPick: (iso: string) => void;
}

export const CalendarPanel: React.FC<Props> = ({ visible, onDismiss, onDayPick }) => {
  const [selected, setSelected] = React.useState<string | null>(null);

  return (
    <Panel
      isOpen={visible}
      onDismiss={onDismiss}
      headerText="Pick a date"
      isLightDismiss
      closeButtonAriaLabel="Close"
    >
      <NurseCalendar onPick={(iso: string) => setSelected(iso)} />

      {selected && (
        <div style={{ marginTop: 20 }}>
          <strong>Selected:</strong> {selected}
          <br />
          <DefaultButton
            text="Select"
            style={{ marginTop: 10 }}
            onClick={() => {
              onDayPick(selected);
              onDismiss();
            }}
          />
        </div>
      )}
    </Panel>
  );
};
