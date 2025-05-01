// src/pnpjsConfig.ts
import { SPFI, spfi } from "@pnp/sp";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { SPFx } from "@pnp/sp";

let _sp: SPFI;

export const initSP = (context: WebPartContext): void => {
  _sp = spfi().using(SPFx(context));
};

export const getSPInstance = (): SPFI => {
  if (!_sp) {
    throw Error("PnP SP is not initialized. Call initSP(context) in onInit().");
  }
  return _sp;
};
export const getSP = (): SPFI => {
  if (!_sp) {
    throw new Error("❌ SPFI not initialized. Call initSP(context) first.");
  }
  return _sp;
};