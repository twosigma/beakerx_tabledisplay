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
import { Theme } from '../../utils/Theme';
import { DataGridColumn } from '../column/DataGridColumn';
import { HIGHLIGHTER_STYLE, IHighlighterState } from '../interface/IHighlighterState';
import { DataGridStyle } from '../style/DataGridStyle';
import { Highlighter } from './Highlighter';

export class ValueHighlighter extends Highlighter {
  constructor(column: DataGridColumn, state: IHighlighterState) {
    super(column, state);

    this.state.style = HIGHLIGHTER_STYLE.SINGLE_COLUMN;
    this.state.colors = this.state.colors || [];
  }

  getBackgroundColor(config: CellRenderer.CellConfig) {
    return (
      (this.state.colors && DataGridStyle.formatColor(this.state.colors[config.row])) || Theme.DEFAULT_COLOR
    );
  }
}
