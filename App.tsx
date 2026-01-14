import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { PromptEditor } from './components/PromptEditor';
import { Stats } from './components/Stats';
import { ProjectList } from './components/ProjectList';
import { CalendarView } from './components/CalendarView';
import { HabitsView } from './components/HabitsView';
import {
  PromptEntry,
  Project,
  Habit,
  ViewState,
  PromptFolder,
  HabitFrequency
} from './types';
import {
  INITIAL_PROMPTS,
  INITIAL_PROJECTS,
  INITIAL_HABITS,
  INITIAL_FOLDERS,
  PROJECT
