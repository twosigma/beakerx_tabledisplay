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

import { DataGrid } from '@lumino/datagrid';

const defaults: { [keys: string]: string; } = {
  '--jp-layout-color0': 'white',
  '--jp-layout-color1': 'white',
  '--jp-layout-color2': '#eeeeee',
  '--jp-layout-color3': '#bdbdbd',
  '--jp-layout-color4': '#757575',

  '--jp-inverse-layout-color0': '#111111',
  '--jp-inverse-layout-color1': '#212121',
  '--jp-inverse-layout-color2': '#424242',
  '--jp-inverse-layout-color3': '#616161',
  '--jp-inverse-layout-color4': '#757575',

  '--jp-ui-font-color0': '#00000000',
  '--jp-ui-font-color1': '#000000CC',
  '--jp-ui-font-color2': '#0000007F',
  '--jp-ui-font-color3': '#0000004C',

  '--jp-ui-inverse-font-color0': '#ffffffff',
  '--jp-ui-inverse-font-color1': '#ffffffD8',
  '--jp-ui-inverse-font-color2': '#ffffff8C',
  '--jp-ui-inverse-font-color3': '#ffffff66',

  '--jp-brand-color0': '#455a64',
  '--jp-brand-color1': '#607d8b',
  '--jp-brand-color2': '#90a4ae',
  '--jp-brand-color3': '#cfd8dc',
  '--jp-brand-color4': '#eceff1',

  '--jp-accent-color0': '#388e3c',
  '--jp-accent-color1': '#4caf50',
  '--jp-accent-color2': '#81c784',
  '--jp-accent-color3': '#c8e6c9',

  '--jp-info-color0': '#0097a7',
  '--jp-info-color1': '#00bcd4',
  '--jp-info-color2': '#4dd0e1',
  '--jp-info-color3': '#b2ebf2'

};

export function evaluateCSSVariable(name: string) {
  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name);
  return value ? value : defaults[name];
}

export class Theme {
  public static get isDark(): boolean {
    return document.body.getAttribute('data-jp-theme-light') == 'false';
  }

  public static getStyle(): DataGrid.Style & { isDark: boolean } {
    return {
      ...DataGrid.defaultStyle,
      voidColor: evaluateCSSVariable('--jp-layout-color1'),
      backgroundColor: evaluateCSSVariable('--jp-layout-color0'),
      headerBackgroundColor: evaluateCSSVariable('--jp-layout-color2'),
      rowBackgroundColor: (i) => (i % 2 === 0 ? evaluateCSSVariable('--jp-layout-color1') : evaluateCSSVariable('--jp-layout-color2')),
      gridLineColor: evaluateCSSVariable('--jp-layout-color3'),
      headerGridLineColor: evaluateCSSVariable('--jp-layout-color4'),
      isDark: this.isDark,
    };
  }

  // Header color
  public static get DEFAULT_HEADER_FONT_COLOR(): string {
    return evaluateCSSVariable('--jp-ui-font-color1');
  }

  public static get DEFAULT_HEADER_BACKGROUND(): string {
    return evaluateCSSVariable('--jp-layout-color2');
  }

  // Cell color
  public static get DEFAULT_DATA_FONT_COLOR(): string {
    return evaluateCSSVariable('--jp-ui-font-color0');
  }

  public static get DEFAULT_CELL_BACKGROUND(): string {
    return '';// evaluateCSSVariable('--jp-layout-color0');
  }

  public static get FOCUSED_CELL_BACKGROUND(): string {
    return evaluateCSSVariable('--jp-accent-color2');
  }

  public static get SELECTED_CELL_BACKGROUND(): string {
    return evaluateCSSVariable('--jp-info-color0');
  }

  public static get DEFAULT_HIGHLIGHT_COLOR(): string {
    return evaluateCSSVariable('--jp-inverse-layout-color0');
  }

  public static get HIGHLIGHTED_CELL_BACKGROUND_EVEN(): string {
    return evaluateCSSVariable('--jp-layout-color3');
  }

  public static get HIGHLIGHTED_CELL_BACKGROUND_ODD(): string {
    return evaluateCSSVariable('--jp-layout-color2');
  }

  public static get MIN_LIGHTNESS_VALUE(): number {
    return this.isDark ? 15 : 35;
  }

  public static get MIN_SATURATION_VALUE(): number {
    return this.isDark ? 15 : 35;
  }
}
