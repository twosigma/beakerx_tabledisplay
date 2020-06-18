/*
 *  Copyright 2018 TWO SIGMA OPEN SOURCE, LLC
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
import { BeakerXDataGrid } from '../../../src/dataGrid/BeakerXDataGrid';
import { CellFocusManager } from "../../../src/dataGrid/cell/CellFocusManager";
import { COLUMN_TYPES } from "../../../src/dataGrid/column/enums";
import { KEYBOARD_KEYS } from "../../../src/dataGrid/event/enums";
import { createStore } from "../../../src/dataGrid/store/BeakerXDataStore";
import { Theme } from "../../../src/utils";
import { cellConfigMock, cellDataMock, modelStateMock, tableDisplayWidgetMock } from "../mock";

describe('CellFocusManager', () => {
  let dataGrid;
  let dataStore;
  let cellFocusManager;
  let focusedCell = {...cellDataMock};

  before(() => {
    dataStore = createStore(modelStateMock);
    dataGrid = new BeakerXDataGrid({}, dataStore, tableDisplayWidgetMock as any);
    cellFocusManager = dataGrid.cellFocusManager;
  });

  after(() => {
    dataGrid.destroy();
  });

  it('should be an instance of CellFocusManager', () => {
    expect(cellFocusManager).to.be.an.instanceof(CellFocusManager);
  });

  it('should have the focusedCellData property', () => {
    expect(cellFocusManager).to.have.property('focusedCellData');
  });

  it('should implement setFocusedCell method', () => {
    expect(cellFocusManager).to.have.property('setFocusedCell');
    expect(cellFocusManager.setFocusedCell).to.be.a('Function');

    cellFocusManager.setFocusedCell(focusedCell);
    expect(cellFocusManager.focusedCellData).to.equal(focusedCell);
  });

  it('should implement getFocussedCellBackground method', () => {
    expect(cellFocusManager).to.have.property('getFocussedCellBackground');
    expect(cellFocusManager.getFocussedCellBackground).to.be.a('Function');
    expect(cellFocusManager.getFocussedCellBackground(cellConfigMock)).to.equal(Theme.FOCUSED_CELL_BACKGROUND);
    expect(cellFocusManager.getFocussedCellBackground({
      ...cellConfigMock,
      column: 1
    })).to.equal(Theme.DEFAULT_CELL_BACKGROUND);
  });

  it('should implement setFocusedCellByNavigationKey method', () => {
    expect(cellFocusManager).to.have.property('setFocusedCellByNavigationKey');
    expect(cellFocusManager.setFocusedCellByNavigationKey).to.be.a('Function');

    cellFocusManager.setFocusedCellByNavigationKey(KEYBOARD_KEYS.ArrowRight);
    expect(cellFocusManager.focusedCellData.column).to.equal(1);
    expect(cellFocusManager.focusedCellData.row).to.equal(0);
    expect(cellFocusManager.focusedCellData.type).to.equal(COLUMN_TYPES.body);

    cellFocusManager.setFocusedCellByNavigationKey(KEYBOARD_KEYS.ArrowDown);
    expect(cellFocusManager.focusedCellData.column).to.equal(1);
    expect(cellFocusManager.focusedCellData.row).to.equal(1);
    expect(cellFocusManager.focusedCellData.type).to.equal(COLUMN_TYPES.body);

    cellFocusManager.setFocusedCellByNavigationKey(KEYBOARD_KEYS.ArrowLeft);
    expect(cellFocusManager.focusedCellData.column).to.equal(0);
    expect(cellFocusManager.focusedCellData.row).to.equal(1);
    expect(cellFocusManager.focusedCellData.type).to.equal(COLUMN_TYPES.body);

    cellFocusManager.setFocusedCellByNavigationKey(KEYBOARD_KEYS.ArrowUp);
    expect(cellFocusManager.focusedCellData.column).to.equal(0);
    expect(cellFocusManager.focusedCellData.row).to.equal(0);
    expect(cellFocusManager.focusedCellData.type).to.equal(COLUMN_TYPES.body);

    cellFocusManager.setFocusedCellByNavigationKey(KEYBOARD_KEYS.ArrowLeft);
    expect(cellFocusManager.focusedCellData.column).to.equal(0);
    expect(cellFocusManager.focusedCellData.row).to.equal(0);
    expect(cellFocusManager.focusedCellData.type).to.equal(COLUMN_TYPES.index);
  });
});
