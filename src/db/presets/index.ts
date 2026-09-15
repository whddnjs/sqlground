import type { Preset } from './preset'
import { SCHOOL_PRESET } from './school'
import { SHOP_PRESET } from './shop'

export type { Preset }
export const PRESETS: Preset[] = [SHOP_PRESET, SCHOOL_PRESET]
