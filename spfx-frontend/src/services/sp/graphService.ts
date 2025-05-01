import { AadHttpClient, AadHttpClientResponse } from '@microsoft/sp-http';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import defaultAvatar from '../../assets/defaultAvatar.png';

// ✅ Required PnP imports
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";

export interface NurseItem {
  Id: number;
  Title: string;
  Email: string;
  Role?: string;
  [key: string]: unknown;
}

export interface NurseScheduleItem {
  Id: number;
  NurseName: string;
  Shift: string;
  Date: string;
  UserId: string;
  [key: string]: unknown;
}

let graphClient: AadHttpClient;

const graphService = {
  async init(context: WebPartContext): Promise<void> {
    graphClient = await context.aadHttpClientFactory.getClient("https://graph.microsoft.com");
  },

  async getUserPhoto(): Promise<string> {
    const isWorkbench = window.location.pathname.indexOf("_layouts/15/workbench.aspx") !== -1;

    if (isWorkbench) {
      return defaultAvatar;
    }

    try {
      const response: AadHttpClientResponse = await graphClient.get(
        "https://graph.microsoft.com/v1.0/me/photo/$value",
        AadHttpClient.configurations.v1
      );

      if (!response.ok) throw new Error(`Graph responded with ${response.status}`);

      const blob = await response.blob();
      return await graphService.blobToDataUrl(blob);
    } catch (error) {
      console.warn("⚠️ Failed to fetch user photo:", error);
      return defaultAvatar;
    }
  },

  blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
};

export default graphService;
