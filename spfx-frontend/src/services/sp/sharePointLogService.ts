import { SPFI } from "@pnp/sp";
import { getSPInstance } from "../../pnpjsConfig";

const LIST_NAME = "UnmatchedPrompts";

export const logUnmatchedPromptToSharePoint = async (entry: {
  Title: string;
  Message: string;
  UserId: string;
  ResponseUsed: string;
}): Promise<void> => {
  try {
    const sp: SPFI = getSPInstance();

    await sp.web.lists.getByTitle(LIST_NAME).items.add({
      Title: entry.Title,
      Message: entry.Message,
      UserId: entry.UserId,
      ResponseUsed: entry.ResponseUsed,
      AgentUsed: "Fallback",
      Source: "SPFx Chat",
      Timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("❌ SharePoint log failed:", err);
  }
};

