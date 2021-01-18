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

import { iter, MapIterator } from '@lumino/algorithm';
import { DataModel } from '@lumino/datagrid';
import { ColumnManager } from '../column/ColumnManager';
import { COLUMN_TYPES } from '../column/enums';
import { DataFormatter } from '../DataFormatter';
import { ALL_TYPES } from '../dataTypes';
import { IColumn } from '../interface/IColumn';
import { IDataGridModelState } from '../interface/IDataGridModelState';
import { DataGridRow } from '../row/DataGridRow';
import { RowManager } from '../row/RowManager';
import { BeakerXDataStore } from '../store/BeakerXDataStore';
import { DataGridAction } from '../store/DataGridAction';

export const UPDATE_MODEL_DATA = 'UPDATE_MODEL_DATA';
export const UPDATE_MODEL_VALUES = 'UPDATE_MODEL_VALUES';
export const UPDATE_MODEL_FONT_COLOR = 'UPDATE_MODEL_FONT_COLOR';
export const UPDATE_COLUMN_RENDERER = 'UPDATE_COLUMN_RENDERER';
export const UPDATE_COLUMN_ORDER = 'UPDATE_COLUMN_ORDER';
export const UPDATE_COLUMN_FROZEN = 'UPDATE_COLUMN_FROZEN';
export const UPDATE_COLUMN_VISIBLE = 'UPDATE_COLUMN_VISIBLE';
export const UPDATE_COLUMNS_VISIBLE = 'UPDATE_COLUMNS_VISIBLE';
export const RESET_COLUMNS_ORDER = 'RESET_COLUMNS_ORDER';
export const ADD_COLUMN_HIGHLIGHTER = 'ADD_COLUMN_HIGHLIGHTER';
export const REMOVE_COLUMN_HIGHLIGHTER = 'REMOVE_COLUMN_HIGHLIGHTER';


export class BeakerXDataGridModel extends DataModel {
  store: BeakerXDataStore;
  dataFormatter: DataFormatter;
  columnManager: ColumnManager;
  rowManager: RowManager;
  headerRowsCount: number;

  static DEFAULT_INDEX_COLUMN_TYPE = ALL_TYPES[1]; // integer

  constructor(store: BeakerXDataStore, columnManager: ColumnManager, rowManager: RowManager) {
    super();

    this.addProperties(store, columnManager, rowManager);
  }

  destroy(): void {
    this.dataFormatter.destroy();

    setTimeout(() => {
      this.store = null;
      this.dataFormatter = null;
      this.columnManager = null;
      this.rowManager = null;
    });
  }

  reset() {
    this.emitChanged({ type: 'model-reset' });
  }

  emitChanged(args: DataModel.ChangedArgs) {
    super.emitChanged(args);
  }

  addProperties(store: BeakerXDataStore, columnManager: ColumnManager, rowManager: RowManager) {
    this.store = store;
    this.dataFormatter = new DataFormatter(store);
    this.columnManager = columnManager;
    this.rowManager = rowManager;
    this.headerRowsCount = 1;

    this.setState({
      columnsVisible: this.store.selectColumnsVisible() || {},
    });
  }

  updateData(state: IDataGridModelState) {
    this.columnManager.resetColumnStates();
    this.store.dispatch(new DataGridAction(UPDATE_MODEL_DATA, state));
    this.rowManager.createRows(this.store, this.store.selectHasIndex());
    this.rowManager.setRowsToShow(this.store.selectRowsToShow());
    this.reset();
  }

  updateValues(state: IDataGridModelState) {
    this.store.dispatch(new DataGridAction(UPDATE_MODEL_VALUES, state));
    this.store.dispatch(new DataGridAction(UPDATE_MODEL_FONT_COLOR, state));
    this.rowManager.createRows(this.store, this.store.selectHasIndex());
    this.rowManager.filterRows();
    this.rowManager.keepSorting();
    this.columnManager.restoreColumnStates();
    this.reset();
  }

  rowCount(region: DataModel.RowRegion): number {
    if (region !== 'body') {
      return this.headerRowsCount;
    }
    if (this.rowManager === null) {
      return 0;
    }
    return this.rowManager.rows.length;
  }

  columnCount(region: DataModel.ColumnRegion): number {
    if (this.store === null) {
      return 0;
    }
    const frozenColumnsCount = this.store.selectVisibleColumnsFrozenCount();

    if (region === 'row-header') {
      return frozenColumnsCount + 1;
    }

    return region === 'body' ? this.store.selectVisibleBodyColumns(this.store.selectColumnOrder()).length - frozenColumnsCount : 1;
  }

  data(region: DataModel.CellRegion, row: number, position: number): any {
    const columnRegion = ColumnManager.getColumnRegionByCell({ region });
    const index = this.store.selectColumnIndexByPosition({ region: columnRegion, value: position });
    const dataGridRow = this.rowManager.getRow(row) || { index: row, cells: [], getValue: () => [] };

    if (region === 'row-header' && position === 0) {
      return dataGridRow.index;
    }

    if (region === 'column-header' || (region === 'corner-header' && position > 0)) {
      return row === 0 ? this.columnManager.bodyColumnNames[index] : '';
    }

    if (region === 'corner-header') {
      return row === 0 ? this.columnManager.indexColumnNames[index] : '';
    }

    return index !== undefined ? dataGridRow.getValue(index) : '';
  }

  metadata(region: DataModel.CellRegion, row: number, position: number): DataModel.Metadata {
    const column = this.columnManager.getColumnByPosition({
      value: position,
      region: ColumnManager.getColumnRegionByCell({ region }),
    });

    return {
      dataType: ALL_TYPES[column.getDisplayType()],
    };
  }

  setState(state) {
    this.store.dispatch(new DataGridAction(UPDATE_MODEL_DATA, state));
  }

  setFilterHeaderVisible(visible: boolean) {
    this.headerRowsCount = visible ? 2 : 1;
    this.reset();
  }

  getColumnValuesIterator(column: IColumn): MapIterator<number, number> {
    if (column.type === COLUMN_TYPES.index) {
      return new MapIterator<DataGridRow, any>(iter(this.rowManager.rows), (row) => row.index);
    }

    return new MapIterator(iter(this.rowManager.rows), (row) => row.getValue(column.index));
  }

  setHeaderTextVertical(headersVertical: boolean) {
    this.setState({ headersVertical });
    this.reset();
  }

  getColumnValueResolver(dataType: ALL_TYPES): (value: any) => any {
    switch (dataType) {
      case ALL_TYPES.datetime:
      case ALL_TYPES.time:
        return this.dateValueResolver;

      case ALL_TYPES.double:
      case ALL_TYPES['double with precision']:
        return this.doubleValueResolver;

      case ALL_TYPES.integer:
      case ALL_TYPES.int64:
        return this.integerValueResolver;

      case ALL_TYPES.html:
        return this.htmlTextContentResolver;

      default:
        return this.defaultValueResolver;
    }
  }

  private htmlTextContentResolver(value) {
    const div = document.createElement('div');

    div.innerHTML = value;

    return div.textContent;
  }

  private dateValueResolver(value) {
    if (value)
      return value.timestamp;
    return NaN;
  }

  private defaultValueResolver(value) {
    return value;
  }

  private doubleValueResolver(value) {
    return parseFloat(value);
  }

  private integerValueResolver(value) {
    return parseInt(value);
  }
}
