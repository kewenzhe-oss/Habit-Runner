import type { Layer } from "@/types"

/**
 * The single default external-tool example for each life layer.
 * Keep this mapping centralized so every item form presents the same suggestion.
 */
export const DEFAULT_DOMAIN_EXAMPLES: Record<Layer, string> = {
  BODY: "https://postsoma-2050.website/",
  CRAFT: "https://www.205022.xyz/",
  SIGNAL: "https://postsomabooks.qzz.io/",
  MEMORY: "https://postsoma-2050.website/",
  JUDGMENT: "https://www.quantbrews.win/",
  CONTEMPLATION: "https://www.readselah.org/",
  LIFE: "https://205077.xyz/",
}

export function getDefaultDomainExample(layer: Layer): string {
  return DEFAULT_DOMAIN_EXAMPLES[layer]
}
