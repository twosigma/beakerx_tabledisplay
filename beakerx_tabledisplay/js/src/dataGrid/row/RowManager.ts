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

import { filter, iter, MapIterator, toArray } from '@lumino/algorithm';
import { Theme } from '../../utils/Theme';
import { ColumnFilter } from '../column/ColumnFilter';
import { ColumnManager } from '../column/ColumnManager';
import { DataGridColumn } from '../column/DataGridColumn';
import { COLUMN_TYPES, SORT_ORDER } from '../column/enums';
// import { selectFontColor, selectValues } from '../model/selectors';
import { BeakerXDataStore } from '../store/BeakerXDataStore';
import { DataGridCellValue } from './DataGridCellValue';
import { DataGridRow } from './DataGridRow';

export class RowManager {
  rowsIterator: MapIterator<any[], DataGridRow>;
  rows: DataGridRow[];
  filterExpression: string;
  expressionVars: string;
  sortedBy: DataGridColumn;
  columnManager: ColumnManager;
  rowsToShow: number;

  constructor(store: BeakerXDataStore, hasIndex: boolean, columnManager: ColumnManager, rowsToShow: number) {
    this.columnManager = columnManager;
    this.rowsToShow = rowsToShow;
    this.createRows(store, hasIndex);
    this.evaluateFilterExpression = this.evaluateFilterExpression.bind(this);
  }

  destroy(): void {
    this.rows = [];
    this.sortedBy = null;
    this.columnManager = null;
    this.rowsIterator = null;
  }

  createRows(store: BeakerXDataStore, hasIndex) {
    const cellValues = this.createCellValue(store);
    hasIndex ? this.createRowsWithIndex(cellValues) : this.createRowsWithGeneratedIndex(cellValues);
  }

  private createCellValue(store: BeakerXDataStore) {
    let data = store.selectValues();
    const fontFun = this.defineFontFun(store, data);
    const newData = [];
    for (let i = 0; i < data.length; i++) {
      const newRows = [];
      for (let y = 0; y < data[i].length; y++) {
        const pair = new DataGridCellValue(data[i][y], fontFun(i, y));
        newRows.push(pair);
      }
      newData.push(newRows);
    }
    data = newData;
    return newData;
  }

  private defineFontFun(store: BeakerXDataStore, data) {
    const fontColors = store.selectFontColor();
    if (fontColors && fontColors.length == data.length) {
      return (row: number, col: number): string => fontColors[row][col];
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      return (row: number, col: number): string => Theme.DEFAULT_COLOR;
    }
  }

  createRowsWithGeneratedIndex(data) {
    this.rowsIterator = new MapIterator<any[], DataGridRow>(
      iter(data),
      (values, index) => new DataGridRow(index, values),
    );
    this.rows = toArray(this.rowsIterator.clone());
  }

  createRowsWithIndex(data) {
    this.rowsIterator = new MapIterator<any[], DataGridRow>(
      iter(data),
      (values) => new DataGridRow(values[0].value, values.slice(1)),
    );

    this.rows = toArray(this.rowsIterator.clone());
  }

  keepSorting() {
    if (this.sortedBy != undefined) {
      this.sortByColumn(this.sortedBy);
    }
  }

  getRow(index): DataGridRow {
    return this.rows[index];
  }

  sortByColumn(column: DataGridColumn) {
    const sortOrder = column.getSortOrder();

    this.sortedBy = column;

    if (column.type === COLUMN_TYPES.index || sortOrder === SORT_ORDER.NO_SORT) {
      return this.sortRows(column, sortOrder, this.indexValueResolver);
    }

    return this.sortRows(column, sortOrder);
  }

  sortRows(column: DataGridColumn, sortOrder: SORT_ORDER, valueResolver?: (row, columnIndex) => any): void {
    const shouldReverse = sortOrder === SORT_ORDER.DESC;
    const resolverFn = valueResolver ? valueResolver : this.defaultValueResolver;
    const columnValueResolver = column.getValueResolver();
    const columnIndex = column.index;

    this.rows = this.rows.sort((row1, row2) => {
      const value1 = columnValueResolver(resolverFn(row1, columnIndex));
      const value2 = columnValueResolver(resolverFn(row2, columnIndex));
      const result = this.compareSortedValues(value1, value2);

      return shouldReverse ? -result : result;
    });
  }

  private compareSortedValues(value1, value2) {
    if (typeof value1 === 'number' && typeof value2 === 'number' && !isFinite(value1 - value2)) {
      return !isFinite(value1) ? (!isFinite(value2) ? 0 : 1) : -1;
    }

    if (value1 > value2) {
      return 1;
    }

    if (value1 < value2) {
      return -1;
    }

    return 0;
  }

  resetSorting() {
    if (this.sortedBy) {
      this.sortedBy.sort(SORT_ORDER.NO_SORT);
    }
  }

  defaultValueResolver(row: DataGridRow, columnIndex: number) {
    return row.getValue(columnIndex);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  indexValueResolver(row, columnIndex: number) {
    return row.index;
  }

  createFilterExpressionVars() {
    this.expressionVars = '';

    const aggregationFn = (column: DataGridColumn) => {
      const prefix = ColumnFilter.getColumnNameVarPrefix(column.name);
      const name = ColumnFilter.escapeColumnName(column.name);

      if (column.type === COLUMN_TYPES.index) {
        this.expressionVars += `var ${prefix}${name} = row.index;`;
      } else {
        this.expressionVars += `var ${prefix}${name} = row.getValue(${column.index});`;
      }
    };

    this.columnManager.columns[COLUMN_TYPES.index].forEach(aggregationFn);
    this.columnManager.columns[COLUMN_TYPES.body].forEach(aggregationFn);
  }

  searchRows() {
    this.filterRows(this.evaluateFilterExpression);
  }

  filterRows(evalFn?: (row: any, formatFns: any) => any) {
    const columns = this.columnManager.columns;

    this.createFilterExpression();

    if (!this.filterExpression) {
      this.rows = toArray(this.rowsIterator.clone());
      this.columnManager.dataGrid.resize();

      return;
    }

    const formatFns = {};
    formatFns[COLUMN_TYPES.index] = columns[COLUMN_TYPES.index].map((column) => column.formatFn);
    formatFns[COLUMN_TYPES.body] = columns[COLUMN_TYPES.body].map((column) => column.formatFn);

    try {
      this.rows = toArray(
        filter(this.rowsIterator.clone(), (row) =>
          evalFn ? evalFn(row, formatFns) : this.evaluateFilterExpression(row, formatFns),
        ),
      );
      this.sortedBy && this.sortByColumn(this.sortedBy);
      this.columnManager.dataGrid.resize();
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }

  takeRows(start: number, end: number) {
    return this.rows.slice(start, end);
  }

  createFilterExpression(): void {
    const expressionParts: string[] = [];
    const agregationFn = (column: DataGridColumn) => {
      const filter = column.getFilter();

      if (filter) {
        expressionParts.push(filter);
      }
    };

    this.columnManager.columns[COLUMN_TYPES.index].forEach(agregationFn);
    this.columnManager.columns[COLUMN_TYPES.body].forEach(agregationFn);

    this.filterExpression = expressionParts.join(' && ').trim();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  evaluateFilterExpression(row, formatFns) {
    const evalInContext = function (expression: string) {
      'use strict';
      /* eslint-disable @typescript-eslint/no-unused-vars */
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const row = {
        ...this.row,
        getValue(index) {
          return this.cells[index].value;
        },
      };
      /* eslint-enable @typescript-eslint/no-unused-vars */
      const result = eval(expression);

      return result !== undefined ? result : true;
    }.bind({ row });

    return evalInContext(String(`${this.expressionVars} ${this.filterExpression}`));
  }

  getValueByColumn(row: number, columnIndex: number, columnType: COLUMN_TYPES) {
    return columnType === COLUMN_TYPES.body ? this.getRow(row).getValue(columnIndex) : this.getRow(row).index;
  }

  setRowsToShow(rows) {
    this.rowsToShow = rows;
    this.columnManager.dataGrid.dataGridResize.updateWidgetHeight();
    this.columnManager.dataGrid.dataGridResize.updateWidgetWidth();
  }
}
