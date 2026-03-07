export interface PluginManifest {
  name: string;
  slug: string;
  version: string;
  capabilities: string[];
  entrypoint: string;
  enabled: boolean;
}
