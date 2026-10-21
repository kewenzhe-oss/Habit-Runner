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
  RiAddLine, // add
  RiArrowDownSLine, // down
  RiArrowLeftSLine, // back
  RiArrowRightSLine, // next
  RiArrowRightUpLine, // arrowUpRight
  RiArrowUpDownLine, // sort
  RiArrowUpSLine, // up
  RiBarChart2Line, // history / insights
  RiBarChartLine, // statsBar
  RiBatteryChargeLine, // normalEnergy
  RiBatteryLowLine, // lowEnergy
  RiCalendarLine, // calendar
  RiCheckboxCircleFill, // checkCircle (filled — confirmed state)
  RiCheckboxLine, // todo
  RiCheckLine, // check
  RiCircleLine, // circle
  RiCloseCircleFill, // xCircle (filled — cancelled state)
  RiCloseLine, // close
  RiCompass3Line, // compass
  RiCupLine, // rest
  RiDeleteBinLine, // trash
  RiDoubleQuotesL, // quotes
  RiDownload2Line, // download
  RiEqualizer2Line, // mixer
  RiErrorWarningLine, // warning
  RiExternalLinkLine, // externalLink
  RiFileCopyLine, // copy
  RiFireLine, // fire
  RiFlashlightLine, // highEnergy
  RiFocus3Line, // habit
  RiGithubFill, // github (fill — brand logo)
  RiGlobalLine, // globe
  RiGoogleFill, // google (fill — brand logo)
  RiLayoutGridLine, // dashboard
  RiLeafLine, // spa
  RiLoader4Line, // spinner
  RiLogoutBoxRLine, // signout
  RiMentalHealthLine, // selfImprovement
  RiMoonLine, // moon
  RiMore2Line, // ellipsis
  RiRefreshLine, // refresh
  RiSettings3Line, // settings
  RiShieldCheckLine, // quitHabit
  RiSparklingLine, // sparkles
  RiStackLine, // layers
  RiStarLine, // star
  RiSunLine, // sun
  RiUpload2Line, // upload
  RiUserLine, // userAlt
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
  chevronRight: RiArrowRightSLine,
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
  download: RiDownload2Line,
  upload: RiUpload2Line,
  refresh: RiRefreshLine,
  copy: RiFileCopyLine,
  quotes: RiDoubleQuotesL,

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
