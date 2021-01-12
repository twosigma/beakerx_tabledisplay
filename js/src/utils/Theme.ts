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

  '--md-blue-A100': '#82b1ff',
  '--md-blue-A200': '#448aff',
  '--md-blue-A400': '#2979ff',
  '--md-blue-A700': '#2962ff',

};

export function formatColor(color: string, factor = 1): string {
  const rgba = color.match(/rgba\((\d+),\s?(\d+),\s?(\d+),\s?(\d+\.?\d*)\)/);
  if (rgba) {
    const r: number = Math.ceil(Number.parseInt(rgba[1], 10));
    const g: number = Math.ceil(Number.parseInt(rgba[2], 10));
    const b: number = Math.ceil(Number.parseInt(rgba[3], 10));
    const a: number = Math.ceil(Number.parseInt(rgba[4], 10)) * factor;
    return CommonUtils.rgbaToHex(r, g, b, a);
  } 
  
  const rgb = color.match(/rgb\((\d+),\s?(\d+),\s?(\d+)\)/);
  if (rgb) {
    const r: number = Math.ceil(Number.parseInt(rgba[1], 10)) * factor;
    const g: number = Math.ceil(Number.parseInt(rgba[2], 10)) * factor;
    const b: number = Math.ceil(Number.parseInt(rgba[3], 10)) * factor;
    return CommonUtils.rgbaToHex(r, g, b);
  }

  const hex = color.match(/#(\w{2}|\w)?(\w{2}|\w)?(\w{2}|\w)?(\w{2}|\w)?/);
  if (factor !== 1 && hex) {
    if (hex[4]) {
      const r: number = parseInt(hex[1] || '00', 16);
      const g: number = parseInt(hex[2] || '00', 16);
      const b: number = parseInt(hex[3] || '00', 16);
      const a: number = parseInt(hex[4] || '00', 16) * factor;
      return CommonUtils.rgbaToHex(r, g, b, a);
    } else {
      const r: number = parseInt(hex[1] || '00', 16) * factor;
      const g: number = parseInt(hex[2] || '00', 16) * factor;
      const b: number = parseInt(hex[3] || '00', 16) * factor;
      return CommonUtils.rgbaToHex(r, g, b);
    }
  }

  return color;
}

export function evaluateCSSVariable(name: string, factor = 1): string {
  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name);
  if (value) {
    return formatColor(value, factor);
  } else {
    return defaults[name];
  }
}

export class Theme {

  public static updateStyle(): void {
    // Header color
    this.DEFAULT_HEADER_FONT_COLOR = evaluateCSSVariable('--jp-ui-font-color1');
    this.DEFAULT_HEADER_BACKGROUND = evaluateCSSVariable('--jp-layout-color3');
    this.DEFAULT_COLOR = '';

    // Cell color
    this.DEFAULT_DATA_FONT_COLOR = evaluateCSSVariable('--jp-ui-font-color0');
    this.DEFAULT_CELL_BACKGROUND = evaluateCSSVariable('--jp-rendermime-table-row-background');
    this.FOCUSED_CELL_BACKGROUND = evaluateCSSVariable('--jp-accent-color2');
    this.SELECTED_CELL_BACKGROUND = evaluateCSSVariable('--jp-brand-color1');
    this.DATA_BARS_COLOR = evaluateCSSVariable('--md-blue-A200');
    this.DEFAULT_HIGHLIGHT_COLOR = evaluateCSSVariable('--jp-warn-color0');
    this.HIGHLIGHTED_CELL_BACKGROUND_EVEN = evaluateCSSVariable('--jp-success-color1');
    this.HIGHLIGHTED_CELL_BACKGROUND_ODD = evaluateCSSVariable('--jp-info-color1');
    this.MIN_LIGHTNESS_VALUE = 25;
    this.MIN_SATURATION_VALUE = 25;
  }

  public static getStyle(): DataGrid.Style {
    return {
      ...DataGrid.defaultStyle,
      voidColor: evaluateCSSVariable('--jp-layout-color0'),
      backgroundColor: evaluateCSSVariable('--jp-layout-color1'),
      rowBackgroundColor: (i) => {
        return i % 2 === 0 ? 
          evaluateCSSVariable('--jp-rendermime-table-row-background') :
          evaluateCSSVariable('--jp-rendermime-table-row-background', 0.7);
      },
      gridLineColor: evaluateCSSVariable('--jp-border-color3'),
      headerBackgroundColor: evaluateCSSVariable('--jp-layout-color3'),
      headerGridLineColor: evaluateCSSVariable('--jp-border-color3'),
    };
  }

  // Header color
  public static DEFAULT_HEADER_FONT_COLOR: string = evaluateCSSVariable('--jp-ui-font-color1');
  public static DEFAULT_HEADER_BACKGROUND: string = evaluateCSSVariable('--jp-layout-color3');
  public static DEFAULT_COLOR: string = '';

  // Cell color
  public static DEFAULT_DATA_FONT_COLOR: string = evaluateCSSVariable('--jp-ui-font-color0');
  public static DEFAULT_CELL_BACKGROUND: string = evaluateCSSVariable('--jp-rendermime-table-row-background');
  public static FOCUSED_CELL_BACKGROUND: string = evaluateCSSVariable('--jp-accent-color2');
  public static SELECTED_CELL_BACKGROUND: string = evaluateCSSVariable('--jp-brand-color1');
  public static DATA_BARS_COLOR: string = evaluateCSSVariable('--md-blue-A200');
  public static DEFAULT_HIGHLIGHT_COLOR: string = evaluateCSSVariable('--jp-warn-color0');
  public static HIGHLIGHTED_CELL_BACKGROUND_EVEN: string = evaluateCSSVariable('--jp-success-color1');
  public static HIGHLIGHTED_CELL_BACKGROUND_ODD: string = evaluateCSSVariable('--jp-info-color1');
  public static MIN_LIGHTNESS_VALUE: number = 25;
  public static MIN_SATURATION_VALUE: number = 25;
}
