/**
 * Unified icon system — powered by Remix Icon (@remixicon/react)
 * All icons use the "line" (outline) style by default.
 * Fill variants are used only for confirmed interactive states (e.g. checkCircle, xCircle).
 *
 * Size conventions:
 *  - Mobile nav: text-[22px] / h-[22px] w-[22px]
 *  - List action icons: h-4 w-4 (16px)
 *  - Inline button icons: h-3.5 w-3.5 (14px)
 *  - Status indicators: h-3 w-3 (12px)
 */
import {
  RiLayoutGridLine,       // dashboard
  RiBarChart2Line,        // history / insights
  RiSettings3Line,        // settings
  RiAddLine,              // add
  RiCheckLine,            // check
  RiCheckboxCircleFill,   // checkCircle (filled — confirmed state)
  RiCircleLine,           // circle
  RiCloseCircleFill,      // xCircle (filled — cancelled state)
  RiCloseLine,            // close
  RiArrowLeftSLine,       // back
  RiArrowRightSLine,      // next
  RiArrowUpSLine,         // up
  RiArrowDownSLine,       // down
  RiDeleteBinLine,        // trash
  RiMore2Line,            // ellipsis
  RiErrorWarningLine,     // warning
  RiLogoutBoxRLine,       // signout
  RiCalendarLine,         // calendar
  RiExternalLinkLine,     // externalLink
  RiArrowRightUpLine,     // arrowUpRight
  RiLoader4Line,          // spinner
  RiGlobalLine,           // globe
  RiUserLine,             // userAlt
  RiArrowUpDownLine,      // sort
  RiStarLine,             // star
  RiFireLine,             // fire
  RiBarChartLine,         // statsBar
  RiEqualizer2Line,       // mixer
  RiFocus3Line,           // habit
  RiShieldCheckLine,      // quitHabit
  RiCheckboxLine,         // todo
  RiFlashlightLine,       // highEnergy
  RiBatteryChargeLine,    // normalEnergy
  RiBatteryLowLine,       // lowEnergy
  RiCupLine,              // rest
  RiSparklingLine,        // sparkles
  RiLeafLine,             // spa
  RiStackLine,            // layers
  RiCompass3Line,         // compass
  RiMentalHealthLine,     // selfImprovement
  RiSunLine,              // sun
  RiMoonLine,             // moon
  RiGoogleFill,           // google (fill — brand logo)
  RiGithubFill,           // github (fill — brand logo)
} from "@remixicon/react"

export type IconKeys = keyof typeof icons

type IconsType = {
  [key in IconKeys]: React.ElementType
}

const icons = {
  // Providers (brand logos use fill)
  google: RiGoogleFill,
  github: RiGithubFill,

  // Dashboard & Navigation
  dashboard: RiLayoutGridLine,
  activity: RiBarChart2Line,
  settings: RiSettings3Line,
  history: RiBarChart2Line,
  globe: RiGlobalLine,

  // Mode Toggle
  moon: RiMoonLine,
  sun: RiSunLine,

  // Navigation & Actions
  back: RiArrowLeftSLine,
  next: RiArrowRightSLine,
  up: RiArrowUpSLine,
  down: RiArrowDownSLine,
  close: RiCloseLine,
  trash: RiDeleteBinLine,
  spinner: RiLoader4Line,
  userAlt: RiUserLine,
  ellipsis: RiMore2Line,
  warning: RiErrorWarningLine,
  add: RiAddLine,
  signout: RiLogoutBoxRLine,
  calendar: RiCalendarLine,
  sort: RiArrowUpDownLine,
  fire: RiFireLine,
  statsBar: RiBarChartLine,
  mixer: RiEqualizer2Line,
  check: RiCheckLine,
  star: RiStarLine,
  externalLink: RiExternalLinkLine,
  arrowUpRight: RiArrowRightUpLine,

  // Habit Runner Energy States
  highEnergy: RiFlashlightLine,
  normalEnergy: RiBatteryChargeLine,
  lowEnergy: RiBatteryLowLine,
  rest: RiCupLine,
  sparkles: RiSparklingLine,

  // Item Types
  habit: RiFocus3Line,
  quitHabit: RiShieldCheckLine,
  todo: RiCheckboxLine,

  // CheckIn States
  circle: RiCircleLine,
  checkCircle: RiCheckboxCircleFill,
  xCircle: RiCloseCircleFill,

  // Layers & Taxonomy
  layers: RiStackLine,
  compass: RiCompass3Line,
  selfImprovement: RiMentalHealthLine,
  spa: RiLeafLine,
}

export const Icons: IconsType = icons
