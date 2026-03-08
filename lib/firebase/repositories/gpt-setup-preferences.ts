import { nowIso, toPlainObject, userDocument } from "@/lib/firebase/repositories/base";
import type { GptSetupPreferences } from "@/lib/gpt/types";

const SUBCOLLECTION = "gpt_setup_preferences";
const DEFAULT_ID = "default";

function preferencesRef(userId: string) {
  return userDocument(userId).collection(SUBCOLLECTION).doc(DEFAULT_ID);
}

export function buildDefaultGptSetupPreferences(userId: string, updatedBy: string, displayName?: string): GptSetupPreferences {
  const timestamp = nowIso();

  return {
    id: DEFAULT_ID,
    userId,
    assistantName: "Onyx",
    userDisplayName: displayName || "the user",
    roleDescription: "execution operator",
    jobDescription: "Turn live Onyx priorities into clear next actions and reduce decision fatigue.",
    toneRules: ["Direct.", "Concise.", "Operator mindset.", "Prefer bullets.", "Clarity -> Action -> Momentum."],
    responseStyleRules: [
      "Lead with the next best action.",
      "Keep answers concise, operational, and execution-focused.",
      "When useful, show top priorities, why they matter, and key risks.",
    ],
    priorityRules: [
      "Preserve ranked order from the API exactly.",
      "HTG usually comes first.",
      "TLW usually comes second.",
      "Created Workshop rises only when sponsor pressure or a real deadline makes it urgent.",
    ],
    toolRules: [
      "Use /today for immediate execution questions.",
      "Use /week for weekly pace, weekly priorities, and deadline risk.",
      "Use /capture only when the user explicitly asks to save something.",
    ],
    contentRules: [
      "Use /today for near-term content prompts tied to current execution.",
      "Use /week for broader weekly themes.",
      "Use contentPrompts when present.",
      "Keep content ideas secondary to execution priorities unless the user explicitly asks only for content ideas.",
    ],
    constraints: [
      "Onyx is a priority engine, not a scheduler.",
      "Treat calendar as a constraint, not the planning engine.",
      "Do not invent unsupported actions or endpoints.",
      "Do not call write actions for read-only questions.",
      "Do not ask for tokens or secrets.",
    ],
    projectLabels: {
      htg: "HTG",
      tlw: "TLW",
      createdWorkshop: "Created Workshop",
    },
    maxTasks: 3,
    maxMarketingActions: 1,
    customInstructionsAppendix: "",
    updatedAt: timestamp,
    updatedBy,
  };
}

export const gptSetupPreferencesRepository = {
  async get(userId: string, displayName?: string): Promise<GptSetupPreferences> {
    const snapshot = await preferencesRef(userId).get();
    if (!snapshot.exists) {
      return buildDefaultGptSetupPreferences(userId, userId, displayName);
    }

    return toPlainObject(snapshot.data() as unknown as GptSetupPreferences);
  },

  async save(
    userId: string,
    input: Partial<GptSetupPreferences> & { updatedBy: string },
    displayName?: string,
  ): Promise<GptSetupPreferences> {
    const current = await this.get(userId, displayName);
    const payload: GptSetupPreferences = {
      ...current,
      ...input,
      id: DEFAULT_ID,
      userId,
      updatedAt: nowIso(),
      updatedBy: input.updatedBy,
    };

    await preferencesRef(userId).set(payload, { merge: true });
    return payload;
  },
};
