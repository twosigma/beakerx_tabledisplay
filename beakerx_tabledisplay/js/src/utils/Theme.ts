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
import { CommonUtils } from './CommonUtils';

const defaults: { [keys: string]: string; } = {
  '--jp-layout-color0': '#ffffff',
  '--jp-layout-color1': '#ffffff',
  '--jp-layout-color2': '#eeeeee',
  '--jp-layout-color3': '#bdbdbd',
  '--jp-layout-color4': '#757575',

  '--jp-inverse-layout-color0': '#111111',
  '--jp-inverse-layout-color1': '#212121',
  '--jp-inverse-layout-color2': '#424242',
  '--jp-inverse-layout-color3': '#616161',
  '--jp-inverse-layout-color4': '#757575',

  '--jp-border-color0': '#9e9e9e',
  '--jp-border-color1': '#bdbdbd',
  '--jp-border-color2': '#e0e0e0',
  '--jp-border-color3': '#eeeeee',

  '--jp-ui-font-color0': '#00000000',
  '--jp-ui-font-color1': '#000000CC',
  '--jp-ui-font-color2': '#0000007F',
  '--jp-ui-font-color3': '#0000004C',

  '--jp-ui-inverse-font-color0': '#ffffffff',
  '--jp-ui-inverse-font-color1': '#ffffffD8',
  '--jp-ui-inverse-font-color2': '#ffffff8C',
  '--jp-ui-inverse-font-color3': '#ffffff66',

  '--jp-rendermime-table-row-background': '#F5F5F5',

  '--jp-brand-color0': '#455a64',
  '--jp-brand-color1': '#607d8b',
  '--jp-brand-color2': '#90a4ae',
  '--jp-brand-color3': '#cfd8dc',
  '--jp-brand-color4': '#eceff1',

  '--jp-accent-color0': '#388e3c',
  '--jp-accent-color1': '#4caf50',
  '--jp-accent-color2': '#81c784',
  '--jp-accent-color3': '#c8e6c9',

  '--jp-warn-color0': '#f57c00',
  '--jp-warn-color1': '#ff9800',
  '--jp-warn-color2': '#ffb74d',
  '--jp-warn-color3': '#ffe0b2',

  '--jp-error-color0': '#d32f2f',
  '--jp-error-color1': '#f44336',
  '--jp-error-color2': '#e57373',
  '--jp-error-color3': '#ffcdd2',

  '--jp-success-color0': '#388e3c',
  '--jp-success-color1': '#4caf50',
  '--jp-success-color2': '#81c784',
  '--jp-success-color3': '#c8e6c9',

  '--jp-info-color0': '#0097a7',
  '--jp-info-color1': '#00bcd4',
  '--jp-info-color2': '#4dd0e1',
  '--jp-info-color3': '#b2ebf2',

};

export function formatColor(color: string): string {
  const rgba = color.match(/rgba\((\d+),\s?(\d+),\s?(\d+),\s?(\d+\.?\d*)\)/);
  if (rgba) {
    const r: number = Math.ceil(Number.parseInt(rgba[1], 10));
    const g: number = Math.ceil(Number.parseInt(rgba[2], 10));
    const b: number = Math.ceil(Number.parseInt(rgba[3], 10));
    const a: number = Math.ceil(Number.parseInt(rgba[4], 10));
    return CommonUtils.rgbaToHex(r, g, b, a);
  }

  const rgb = color.match(/rgb\((\d+),\s?(\d+),\s?(\d+)\)/);
  if (rgb) {
    const r: number = Math.ceil(Number.parseInt(rgba[1], 10));
    const g: number = Math.ceil(Number.parseInt(rgba[2], 10));
    const b: number = Math.ceil(Number.parseInt(rgba[3], 10));
    return CommonUtils.rgbaToHex(r, g, b);
  }

  return color;
}

export function evaluateCSSVariable(name: string): string {
  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name);

  if (value) {
    return formatColor(value);
  } else {
    return defaults[name];
  }
}

export class Theme {

  public static updateStyle(): void {
    // Header color
    this._default_header_font_color = evaluateCSSVariable('--jp-ui-font-color1');
    this._default_header_background = evaluateCSSVariable('--jp-layout-color2');
    this._default_header_border = evaluateCSSVariable('--jp-border-color0');
    this._default_color = '';

    // Cell color
    this._default_data_font_color = evaluateCSSVariable('--jp-ui-font-color0');
    this._void_color = evaluateCSSVariable('--jp-layout-color0');
    this._default_cell_background = evaluateCSSVariable('--jp-layout-color0');
    this._default_cell_background_2 = evaluateCSSVariable('--jp-rendermime-table-row-background');
    this._default_cell_border = evaluateCSSVariable('--jp-border-color1');
    this._focused_cell_background = evaluateCSSVariable('--jp-layout-color3');
    this._selected_cell_background = evaluateCSSVariable('--jp-brand-color2');
    this._data_bars_color = evaluateCSSVariable('--jp-brand-color1');
    this._default_highlight = evaluateCSSVariable('--jp-info-color0');
    this._highlighted_cell_dackgraund_even = evaluateCSSVariable('--jp-layout-color2');
    this._highlighted_cell_dackgraund_odd = evaluateCSSVariable('--jp-layout-color3');
    this._min_lightness_value = 25;
    this._min_saturation_value = 25;
  }

  public static getStyle(): DataGrid.Style {
    return {
      ...DataGrid.defaultStyle,
      voidColor: this._void_color, //('--jp-layout-color0'),
      backgroundColor: this._default_cell_background, //('--jp-layout-color1'),
      rowBackgroundColor: (i) => {
        return i % 2 === 0 ?
          this._default_cell_background : //('--jp-layout-color1') :
          this._default_cell_background_2; // ('--jp-layout-color2');
      },
      gridLineColor: this._default_cell_border, //('--jp-border-color1'),
      headerBackgroundColor: this._default_header_background, //('--jp-layout-color3'),
      headerGridLineColor: this._default_header_border, //('--jp-border-color3'),
    };
  }

  // Header color
  public static get DEFAULT_HEADER_FONT_COLOR(): string {
    return this._default_header_font_color;
  }
  public static get DEFAULT_HEADER_BACKGROUND(): string {
    return this._default_header_background;
  }
  public static get DEFAULT_HEADER_BORDER(): string {
    return this._default_header_border;
  }
  public static get DEFAULT_COLOR(): string {
    return this._default_color;
  }

  // Cell color
  public static get DEFAULT_DATA_FONT_COLOR(): string {
    return this._default_data_font_color;
  }
  public static get DEFAULT_CELL_BACKGROUND(): string {
    return this._default_cell_background;
  }
  public static get DEFAULT_CELL_BACKGROUND_2(): string {
    return this._default_cell_background_2;
  }
  public static get DEFAULT_CELL_BORDER(): string {
    return this._default_cell_border;
  }
  public static get FOCUSED_CELL_BACKGROUND(): string {
    return this._focused_cell_background;
  }
  public static get SELECTED_CELL_BACKGROUND(): string {
    return this._selected_cell_background;
  }
  public static get DATA_BARS_COLOR(): string {
    return this._data_bars_color;
  }
  public static get DEFAULT_HIGHLIGHT_COLOR(): string {
    return this._default_highlight;
  }
  public static get HIGHLIGHTED_CELL_BACKGROUND_EVEN(): string {
    return this._highlighted_cell_dackgraund_even;
  }
  public static get HIGHLIGHTED_CELL_BACKGROUND_ODD(): string {
    return this._highlighted_cell_dackgraund_odd;
  }
  public static get MIN_LIGHTNESS_VALUE(): number {
    return this._min_lightness_value;
  }
  public static get MIN_SATURATION_VALUE(): number {
    return this._min_saturation_value;
  }

  private static _void_color: string;

  // Header color
  private static _default_header_font_color: string;
  private static _default_header_background: string;
  private static _default_header_border: string;
  private static _default_color: string;

  // Cell color
  private static _default_data_font_color: string;
  private static _default_cell_background: string;
  private static _default_cell_background_2: string;
  private static _default_cell_border: string;
  private static _focused_cell_background: string;
  private static _selected_cell_background: string;
  private static _data_bars_color: string;
  private static _default_highlight: string;
  private static _highlighted_cell_dackgraund_even: string;
  private static _highlighted_cell_dackgraund_odd: string;
  private static _min_lightness_value: number;
  private static _min_saturation_value: number;
}
