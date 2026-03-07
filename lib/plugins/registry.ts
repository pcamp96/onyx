import type { PluginManifest } from "@/lib/plugins/manifest";

const manifests: PluginManifest[] = [];

export function registerPluginManifest(manifest: PluginManifest) {
  manifests.push(manifest);
}

export function listPluginManifests() {
  return manifests;
}

// TODO: Extend registry bootstrap when additional first-party or local code-level plugins are added.
