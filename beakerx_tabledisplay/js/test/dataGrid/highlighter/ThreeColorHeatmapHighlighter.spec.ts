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
import { HeatmapHighlighter } from "../../../src/dataGrid/highlighter/HeatmapHighlighter";
import { ThreeColorHeatmapHighlighter } from "../../../src/dataGrid/highlighter/ThreeColorHeatmapHighlighter";
import { HIGHLIGHTER_TYPE } from "../../../src/dataGrid/interface/IHighlighterState";
import { createStore } from "../../../src/dataGrid/store/BeakerXDataStore";
import {
  cellConfigMock,
  columnOptionsMock,
  highlighterStateMock,
  modelStateMock,
  tableDisplayWidgetMock
} from "../mock";

describe('ThreeColorHeatmapHighlighter', () => {
  const dataStore = createStore({...modelStateMock, types: ['double', 'double']});
  const dataGrid = new BeakerXDataGrid({}, dataStore, tableDisplayWidgetMock as any);
  const column = new DataGridColumn(
    columnOptionsMock,
    dataGrid,
    dataGrid.columnManager
  );

  let threeColorHeatmapHighlighter = new ThreeColorHeatmapHighlighter(
    column,
    {...highlighterStateMock, type: HIGHLIGHTER_TYPE.threeColorHeatmap}
  );

  it('should be an instance of highlighter', () => {
    expect(threeColorHeatmapHighlighter).to.be.an.instanceof(HeatmapHighlighter);
  });

  it('should have the getBackgroundColor method', () => {
    expect(threeColorHeatmapHighlighter).to.have.property('getBackgroundColor');
  });

  it('should have the minColor state property', () => {
    expect(threeColorHeatmapHighlighter.state).to.have.property('minColor');
  });

  it('should have the maxColor state property', () => {
    expect(threeColorHeatmapHighlighter.state).to.have.property('maxColor');
  });

  it('should have the midColor state property', () => {
    expect(threeColorHeatmapHighlighter.state).to.have.property('midColor');
  });

  it('should return proper backgroud color', () => {
    expect(threeColorHeatmapHighlighter.getBackgroundColor(cellConfigMock))
      .to.equal('rgb(255, 0, 0)');
    expect(threeColorHeatmapHighlighter.getBackgroundColor({...cellConfigMock, value: 0}))
      .to.equal('rgb(0, 0, 255)');
    expect(threeColorHeatmapHighlighter.getBackgroundColor({...cellConfigMock, value: 0.5}))
      .to.equal('rgb(0, 255, 0)');
  });
});
