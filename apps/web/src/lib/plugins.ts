/**
 * Plugin registry — compile-time registration of every plugin in the monorepo.
 *
 * Add a new plugin by importing its manifest and registering it here.
 * There is no filesystem walk, no `require()`, no dynamic loader.
 */
import { createPluginRegistry, type PluginRegistry } from "@hawza/core/plugins";
import { manifest as pluginAuth } from "@hawza/plugin-auth";
import { manifest as pluginCatalog } from "@hawza/plugin-catalog";
import { manifest as pluginLearning } from "@hawza/plugin-learning";
import { manifest as pluginCredentials } from "@hawza/plugin-credentials";
import { manifest as pluginLocalization } from "@hawza/plugin-localization";

let _registry: PluginRegistry | null = null;

export function getPluginRegistry(): PluginRegistry {
  if (_registry) return _registry;
  _registry = createPluginRegistry()
    .register(pluginAuth)
    .register(pluginCatalog)
    .register(pluginLearning)
    .register(pluginCredentials)
    .register(pluginLocalization);
  return _registry;
}
