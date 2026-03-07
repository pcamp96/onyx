export interface PluginHookContext {
  event: string;
  payload: Record<string, unknown>;
}

export interface PluginHook {
  name: string;
  run(context: PluginHookContext): Promise<void>;
}
