import type { Chapter } from '../types'
import { INTRO } from './01-intro'
import { SELECT_BASICS } from './02-select'
import { AGGREGATE } from './03-aggregate'
import { JOIN } from './04-join'
import { MODIFY } from './05-modify'
import { ADVANCED } from './06-advanced'

export const CHAPTERS: Chapter[] = [INTRO, SELECT_BASICS, AGGREGATE, JOIN, MODIFY, ADVANCED]
