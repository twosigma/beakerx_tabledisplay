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

import { expect } from "chai";
import * as sinon from 'sinon';
import { BeakerXDataGrid } from "../../../src/dataGrid/BeakerXDataGrid";
import { DataGridColumn } from "../../../src/dataGrid/column/DataGridColumn";
import { COLUMN_TYPES } from "../../../src/dataGrid/column/enums";
import { createStore } from "../../../src/dataGrid/store/BeakerXDataStore";
import { cellConfigMock, modelStateMock, tableDisplayWidgetMock } from "../mock";

describe('ColumnManager', () => {
  let dataGrid;
  let dataStore;
  let columnManager;

  before(() => {
    dataStore = createStore(modelStateMock);
    dataGrid = new BeakerXDataGrid({}, dataStore, tableDisplayWidgetMock as any);
    columnManager = dataGrid.columnManager;
  });

  after(() => {
    dataGrid.destroy();
  });

  it('should create index column', () => {
    expect(columnManager.columns).to.have.property(`${COLUMN_TYPES.index}`);
    expect(columnManager.columns[COLUMN_TYPES.index]).to.have.length(1);
    expect(columnManager.columns[COLUMN_TYPES.index][0]).to.be.an.instanceof(DataGridColumn);
  });

  it('should create body column', () => {
    expect(columnManager.columns).to.have.property(`${COLUMN_TYPES.body}`);
    expect(columnManager.columns[COLUMN_TYPES.body]).to.have.length(2);
    expect(columnManager.columns[COLUMN_TYPES.body][0]).to.be.an.instanceof(DataGridColumn);
  });

  it('should return column', () => {
    expect(columnManager.getColumn(cellConfigMock)).to.equal(columnManager.columns[COLUMN_TYPES.body][0]);
  });

  it('should return column by column name', () => {
    expect(columnManager.getColumnByName('test')).to.equal(columnManager.columns[COLUMN_TYPES.body][0]);
  });

  it('should implement destroy method', () => {
    const destroyStub = sinon.stub(columnManager, 'destroyAllColumns');

    columnManager.destroy();
    expect(destroyStub.calledOnce).to.be.true;
    destroyStub.restore();
  });
});
