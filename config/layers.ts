import { Layer, LayerInfo } from "@/types"
import { getDictionary } from "@/lib/i18n"

const layersDict = getDictionary("zh").form.layers

export const LAYERS: Record<Layer, LayerInfo> = {
  BODY: {
    key: "BODY",
    label: layersDict.BODY.label,
    zhLabel: layersDict.BODY.zhLabel,
    description: layersDict.BODY.description,
    color: "#10B981", // Emerald
  },
  CRAFT: {
    key: "CRAFT",
    label: layersDict.CRAFT.label,
    zhLabel: layersDict.CRAFT.zhLabel,
    description: layersDict.CRAFT.description,
    color: "#3B82F6", // Blue
  },
  SIGNAL: {
    key: "SIGNAL",
    label: layersDict.SIGNAL.label,
    zhLabel: layersDict.SIGNAL.zhLabel,
    description: layersDict.SIGNAL.description,
    color: "#8B5CF6", // Purple
  },
  MEMORY: {
    key: "MEMORY",
    label: layersDict.MEMORY.label,
    zhLabel: layersDict.MEMORY.zhLabel,
    description: layersDict.MEMORY.description,
    color: "#EC4899", // Pink
  },
  JUDGMENT: {
    key: "JUDGMENT",
    label: layersDict.JUDGMENT.label,
    zhLabel: layersDict.JUDGMENT.zhLabel,
    description: layersDict.JUDGMENT.description,
    color: "#F59E0B", // Amber
  },
  CONTEMPLATION: {
    key: "CONTEMPLATION",
    label: layersDict.CONTEMPLATION.label,
    zhLabel: layersDict.CONTEMPLATION.zhLabel,
    description: layersDict.CONTEMPLATION.description,
    color: "#06B6D4", // Cyan
  },
  LIFE: {
    key: "LIFE",
    label: layersDict.LIFE.label,
    zhLabel: layersDict.LIFE.zhLabel,
    description: layersDict.LIFE.description,
    color: "#F97316", // Orange
  },
}

export const LAYER_LIST = Object.values(LAYERS)
