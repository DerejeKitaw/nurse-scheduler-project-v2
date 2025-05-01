import * as React from "react";
import {
  DetailsList, IColumn, IconButton, Persona, PersonaSize
} from "@fluentui/react";
import { NurseScheduleItem } from "../../../types/types";
import spListService from "../../../services/sp/spListService";

export interface ShiftTableProps {
  items: NurseScheduleItem[];
  onDelete: (id: number) => void;
}

export const ShiftTable: React.FC<ShiftTableProps> = ({ items, onDelete }) => {
  const cols: IColumn[] = [
    { key: "shiftDate", name: "Date",        fieldName: "ShiftDate",  minWidth: 90 },
    { key: "shiftType", name: "Shift",       fieldName: "ShiftType",  minWidth: 70 },
    { key: "hours",     name: "Hours",       fieldName: "WorkHours",  minWidth: 40 },
    { key: "role",      name: "Role",        fieldName: "Role",       minWidth: 70 },
    {
      key: "user", name: "User", minWidth: 120,
      onRender: i => <Persona text={i.User?.Title} size={PersonaSize.size24}/>
    },
    {
      key:"del", name:"", minWidth:32, onRender: i =>
        <IconButton iconProps={{iconName:"Delete"}} title="Cancel shift"
          onClick={async ()=>{
            await spListService.deleteScheduleItem(i.Id);
            onDelete(i.Id);
          }}/>
    }
  ];
  return <DetailsList items={items} columns={cols} compact />;
};
