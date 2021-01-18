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

import { CommonUtils } from '../../utils';

export class DataGridStyle {
  public static readonly DEFAULT_COLORS = {
    ['default']: {
      red: CommonUtils.rgbaToHex(241, 88, 84),
      blue: CommonUtils.rgbaToHex(93, 165, 218),
      green: CommonUtils.rgbaToHex(96, 189, 104),
    },
    ['ambiance']: {
      red: CommonUtils.rgbaToHex(191, 39, 31),
      blue: CommonUtils.rgbaToHex(46, 119, 191),
      green: CommonUtils.rgbaToHex(75, 160, 75),
    },
  };

  public static formatColor(hexColor: string): string {
    //remove alpha
    return hexColor.length > 7 ? '#' + hexColor.substr(3) : hexColor;
  }

  public static getDefaultColor(color) {
    return DataGridStyle.DEFAULT_COLORS['default'][color];
  }

  // Darken function for color in 'rgb(r, g, b)' format
  public static darken(color: string, factor = 0.8): string {
    const match = color.match(/rgb\((\d+)\s?,(\d+)\s?,(\d+)\)/);
    if (!match) {
      return color;
    }
    const r: number = Math.ceil(Number.parseInt(match[1], 10)) * factor;
    const g: number = Math.ceil(Number.parseInt(match[2], 10)) * factor;
    const b: number = Math.ceil(Number.parseInt(match[3], 10)) * factor;

    return CommonUtils.rgbaToHex(r, g, b);
  }

  public static readonly DEFAULT_BORDER_COLOR = '#d4d0d0';
  public static readonly DEFAULT_DATA_FONT_SIZE = 13;
  public static readonly DEFAULT_GRID_PADDING = 20;
  public static readonly DEFAULT_GRID_BORDER_WIDTH = 1;
  public static readonly MIN_COLUMN_WIDTH = 40;
  public static readonly DEFAULT_ROW_HEIGHT = 24;
}
