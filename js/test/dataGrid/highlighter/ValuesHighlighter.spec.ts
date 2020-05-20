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

import { expect } from 'chai';
import { BeakerXDataGrid } from "../../../src/dataGrid/BeakerXDataGrid";
import { DataGridColumn } from "../../../src/dataGrid/column/DataGridColumn";
import { ValueHighlighter } from "../../../src/dataGrid/highlighter/ValueHighlighter";
import { HIGHLIGHTER_TYPE } from "../../../src/dataGrid/interface/IHighlighterState";
import { createStore } from "../../../src/dataGrid/store/BeakerXDataStore";
import {
  cellConfigMock,
  columnOptionsMock,
  highlighterStateMock,
  modelStateMock,
  tableDisplayWidgetMock
} from "../mock";

describe('ValueHighlighter', () => {
  const dataStore = createStore(modelStateMock);
  const dataGrid = new BeakerXDataGrid({}, dataStore, tableDisplayWidgetMock as any);
  const column = new DataGridColumn(
    columnOptionsMock,
    dataGrid,
    dataGrid.columnManager
  );

  let valueHighlighter = new ValueHighlighter(
    column,
    { ...highlighterStateMock, type: HIGHLIGHTER_TYPE.value }
  );

  it('should be an instance of highlighter', () => {
    expect(valueHighlighter).to.be.an.instanceof(ValueHighlighter);
  });

  it('should have the getBackgroundColor method', () => {
    expect(valueHighlighter).to.have.property('getBackgroundColor');
  });

  it('should have the midColor state property', () => {
    expect(valueHighlighter.state).to.have.property('colors');
  });

  it('should return proper backgroud color', () => {
    expect(valueHighlighter.getBackgroundColor(cellConfigMock))
      .to.equal('#ff0000');
    expect(valueHighlighter.getBackgroundColor({ ...cellConfigMock, row: 1 }))
      .to.equal('#00ff00');
  });
});
