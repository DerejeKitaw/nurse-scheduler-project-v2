/* Minimal calendar that keeps the chosen date
   ─────────────────────────────────────────── */
   import * as React from "react";
   
   export interface NurseCalendarRef {
     getPickedISO: () => string | undefined;
   }
   
   export default function NurseCalendar({ onPick }: { onPick: (iso: string) => void }) {
    const [ , setDate] = React.useState<Date | null>(null);
  
    return (
      <div style={{ padding: 10 }}>
        <input
          type="date"
          onChange={(e) => {
            const val = e.target.value;
            if (val) {
              const iso = new Date(val).toISOString();
              setDate(new Date(val));
              onPick(iso);
            }
          }}
        />
      </div>
    );
  }
  
   

   