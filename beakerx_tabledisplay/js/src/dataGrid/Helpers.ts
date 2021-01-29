/*
 *  Copyright 2017 TWO SIGMA OPEN SOURCE, LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import { CellRenderer } from '@lumino/datagrid';
import { SectionList } from "@lumino/datagrid/types/sectionlist";
import moment from 'moment-timezone';
import { SanitizeUtils, Theme } from '../utils';
import { BeakerXDataGrid } from './BeakerXDataGrid';
import { DataGridColumn } from './column/DataGridColumn';
import { KEYBOARD_KEYS } from './event/enums';
import { DataGridStyle } from './style/DataGridStyle';

export class DataGridHelpers {
  public static readonly urlRegex = /((https?|ftp|file):\/\/)(?:\([-A-Z0-9+&@#/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#/%=~_|$?!:,.]*\)|[A-Z0-9+&@#/%=~_|$])/i;
  public static readonly htmlCharactersReplacementMap = {
    '"': '&quot;',
    '&': '&amp;',
    "'": '&#39;',
    '/': '&#47;',
    '<': '&lt;',
    '>': '&gt;',
  };

  public static escapeHTML(text: any): any {
    if (typeof text === 'string') {
      return text.replace(/['&/<>]/g, (a) => DataGridHelpers.htmlCharactersReplacementMap[a]);
    }

    return text;
  }

  public static truncateString(text, limit = 1000): string {
    if (text && text.length > limit) {
      text = text.substring(0, limit);
      text += '...';
    }

    return text;
  }

  public static disableKeyboardManager(): void {
    try {
      Jupyter.keyboard_manager.enabled = false;
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }

  public static enableKeyboardManager(): void {
    try {
      Jupyter.keyboard_manager.enabled = true;
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }

  public static enableNotebookEditMode() {
    try {
      Jupyter.notebook.edit_mode();
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }

  public static getStringSize(value: any, fontSize: number | null | undefined) {
    const divEl: HTMLSpanElement = document.createElement('div');

    divEl.innerHTML = SanitizeUtils.sanitizeHTML(value, true);
    divEl.style.fontFamily = 'Lato, Helvetica, sans-serif';
    divEl.style.fontSize = `${fontSize || DataGridStyle.DEFAULT_DATA_FONT_SIZE}px`;
    divEl.style.padding = '5px';
    divEl.style.position = 'absolute';
    divEl.style.display = 'inline-block';
    divEl.style.visibility = 'hidden';
    document.body.appendChild(divEl);

    const rect = divEl.getBoundingClientRect();

    const width = Math.ceil(rect.width);
    const height = Math.ceil(rect.height);

    document.body.removeChild(divEl);

    return { width, height };
  }

  public static findSectionIndex(list: SectionList, cursorPosition: number): { index: number; delta: number } | null {
    // Bail early if the list is empty or the position is invalid.
    if (list.count === 0 || cursorPosition < 0 || cursorPosition - list.length > 0) {
      return null;
    }

    const index = list.indexOf(cursorPosition);
    const delta = cursorPosition - list.offsetOf(index);

    if (index >= 0) {
      return { index, delta };
    }

    return null;
  }

  public static throttle<T, U>(
    func: (...args) => unknown,
    limit: number,
    context: any = this,
    controlObject?: { timerId: any },
  ): (T?) => U | undefined {
    const control = controlObject || { timerId: undefined };
    let lastRan;

    return (...args: T[]): U | undefined => {
      if (!lastRan) {
        func.apply(context, args);
        lastRan = Date.now();

        return;
      }

      clearTimeout(control.timerId);
      control.timerId = setTimeout(() => {
        if (Date.now() - lastRan < limit) {
          return;
        }

        func.apply(context, args);
        lastRan = Date.now();
      }, limit - (Date.now() - lastRan));
    };
  }

  public static debounce<A>(f: (a: A) => void, delay: number, controllObject?: { timerId: number }) {
    const control: { timerId: any } = controllObject || { timerId: undefined };

    return (a: A) => {
      clearTimeout(control.timerId);
      control.timerId = setTimeout(() => f(a), delay);
    };
  }

  public static isUrl(url: string) {
    return DataGridHelpers.urlRegex.test(String(url));
  }

  public static retrieveUrl(text: string): string | null {
    if (typeof text !== 'string') {
      return null;
    }

    const matched = text && text.match(DataGridHelpers.urlRegex);

    return matched ? matched[0] : null;
  }

  public static getEventKeyCode(event: KeyboardEvent) {
    if (event.which || event.charCode || event.keyCode) {
      return event.which || event.charCode || event.keyCode;
    }

    if (event.code) {
      return KEYBOARD_KEYS[event.code];
    }

    return event.key.charAt(0) || 0;
  }

  public static sortColumnsByPositionCallback(columnA: DataGridColumn, columnB: DataGridColumn) {
    const positionA = columnA.getPosition();
    const positionB = columnB.getPosition();

    if (positionA.region === positionB.region) {
      return positionA.value - positionB.value;
    }

    return positionA.region === 'row-header' ? -1 : 1;
  }

  public static applyTimezone(timestamp, tz) {
    const time = moment(timestamp, 'x');

    if (!tz) {
      return time;
    }

    if (tz.startsWith('GMT')) {
      time.utcOffset(tz);
    } else {
      time.tz(tz);
    }

    return time;
  }

  public static formatTimestamp(timestamp, tz, format) {
    return DataGridHelpers.applyTimezone(timestamp, tz).format(format);
  }

  public static hasUpperCaseLetter(value: string) {
    return /[A-Z]+/gm.test(value);
  }

  public static getBackgroundColor(dataGrid: BeakerXDataGrid, config: CellRenderer.CellConfig): string {
    const selectionColor = dataGrid.cellSelectionManager.getBackgroundColor(config);
    const highlighterColor = dataGrid.highlighterManager.getCellBackground(config);
    const focusedColor = dataGrid.cellFocusManager.getFocussedCellBackground(config);
    const initialColor = selectionColor && highlighterColor && DataGridStyle.darken(highlighterColor);

    return (
      focusedColor ||
      selectionColor ||
      highlighterColor ||
      initialColor ||
      Theme.DEFAULT_CELL_BACKGROUND
    );
  }
}
