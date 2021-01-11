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
import * as d3scale from 'd3-scale';
import { Theme } from '../../utils';
import { DataGridColumn } from '../column/DataGridColumn';
import { HIGHLIGHTER_STYLE, IHighlighterState } from '../interface/IHighlighterState';
import { DataGridStyle } from '../style/DataGridStyle';
import { Highlighter } from './Highlighter';

export class HeatmapHighlighter extends Highlighter {
  colorScale: (value: any) => string;

  constructor(column: DataGridColumn, state: IHighlighterState) {
    super(column, state);

    this.state.minColor = DataGridStyle.formatColor(state.minColor || DataGridStyle.getDefaultColor('blue'));
    this.state.maxColor = DataGridStyle.formatColor(state.maxColor || DataGridStyle.getDefaultColor('red'));

    this.colorScale = d3scale
      .scaleLinear()
      .domain([this.state.minVal, this.state.maxVal])
      .range([this.state.minColor, this.state.maxColor]);
  }

  getBackgroundColor(config: CellRenderer.CellConfig): string {
    const value = this.getValueToHighlight(config);
    if (this.state.style === HIGHLIGHTER_STYLE.FULL_ROW) {
      return this.colorScale(value);
    }
    if (isNaN(value)) {
      return Theme.DEFAULT_COLOR;
    }
    return this.colorScale(value);
  }
}
