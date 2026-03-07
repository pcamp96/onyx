import type { PluginManifest } from "@/lib/plugins/manifest";

const manifests: PluginManifest[] = [];

export function registerPluginManifest(manifest: PluginManifest) {
  manifests.push(manifest);
}

export function listPluginManifests() {
  return manifests;
}

// TODO: Load external plugin manifests from a trusted open-source plugin package directory.
