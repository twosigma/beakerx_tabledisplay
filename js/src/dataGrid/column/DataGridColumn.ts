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

import { each, filter, minmax } from '@lumino/algorithm';
import { CellRenderer, DataModel, TextRenderer } from '@lumino/datagrid';
import { BeakerXDataGrid } from '../BeakerXDataGrid';
import { DataGridCell } from '../cell/DataGridCell';
import { ALL_TYPES, getDisplayType, isDoubleWithPrecision } from '../dataTypes';
import { ColumnMenu } from '../headerMenu/ColumnMenu';
import { IndexMenu } from '../headerMenu/IndexMenu';
import { DataGridHelpers } from '../Helpers';
import { Highlighter } from '../highlighter/Highlighter';
import { IColumnOptions } from '../interface/IColumn';
import { HIGHLIGHTER_TYPE } from '../interface/IHighlighterState';
import { RENDERER_TYPE } from '../interface/IRenderer';
import { UPDATE_COLUMN_FROZEN, UPDATE_COLUMN_RENDERER, UPDATE_COLUMN_VISIBLE } from '../model/BeakerXDataGridModel';
import { BeakerXDataStore } from '../store/BeakerXDataStore';
import { DataGridColumnAction } from '../store/DataGridAction';
import { ColumnFilter } from './ColumnFilter';
import { COLUMN_CHANGED_TYPES, ColumnManager, IBkoColumnsChangedArgs } from './ColumnManager';
import { ColumnValuesIterator } from './ColumnValuesIterator';
import { COLUMN_TYPES, SORT_ORDER } from './enums';
import {
  UPDATE_COLUMN_DISPLAY_TYPE,
  UPDATE_COLUMN_FILTER,
  UPDATE_COLUMN_FORMAT_FOR_TIMES,
  UPDATE_COLUMN_HORIZONTAL_ALIGNMENT,
  UPDATE_COLUMN_SORT_ORDER,
  UPDATE_COLUMN_WIDTH,
} from '../store/BeakerXDataStore';

export class DataGridColumn {
  index: number;
  name: string;
  type: COLUMN_TYPES;
  menu: ColumnMenu | IndexMenu;
  dataGrid: BeakerXDataGrid;
  store: BeakerXDataStore;
  columnManager: ColumnManager;
  columnFilter: ColumnFilter;
  formatFn: CellRenderer.ConfigFunc<string>;
  minValue: any;
  maxValue: any;
  longestStringValue: string;

  constructor(options: IColumnOptions, dataGrid: BeakerXDataGrid, columnManager: ColumnManager) {
    this.index = options.index;
    this.name = options.name;
    this.type = options.type;
    this.dataGrid = dataGrid;
    this.store = dataGrid.store;
    this.columnManager = columnManager;

    this.assignFormatFn();
    this.addColumnFilter();
    this.connectToCellHovered();
    this.connectToColumnsChanged();
    this.addMinMaxValues();
  }

  static getColumnTypeByRegion(region: DataModel.CellRegion, position: number) {
    if ((region === 'row-header' || region === 'corner-header') && position === 0) {
      return COLUMN_TYPES.index;
    }

    return COLUMN_TYPES.body;
  }

  assignFormatFn() {
    this.formatFn = this.dataGrid.dataModel.dataFormatter.getFormatFnByDisplayType(this.getDisplayType(), this.getState());
  }

  createMenu(): void {
    if (this.type === COLUMN_TYPES.index) {
      this.menu = new IndexMenu(this);

      return;
    }

    this.menu = new ColumnMenu(this);
  }

  addColumnFilter() {
    const columnPosition = this.getPosition();

    this.columnFilter = new ColumnFilter(this.dataGrid, this, {
      x: this.dataGrid.getColumnOffset(columnPosition.value, columnPosition.region),
      y: this.dataGrid.defaultSizes.columnHeaderHeight - 1,
      width: this.dataGrid.getColumnSections().sizeOf(this.index),
      height: this.dataGrid.defaultSizes.rowHeight,
    });
  }

  setDisplayType(displayType: ALL_TYPES | string) {
    this.store.dispatch(
      new DataGridColumnAction(UPDATE_COLUMN_DISPLAY_TYPE, {
        value: displayType,
        columnIndex: this.index,
        columnType: this.type,
      }),
    );

    const position = this.getPosition();

    this.dataGrid.dataGridResize.setSectionWidth('column', this, 1);
    this.assignFormatFn();
    this.recalculateLongestStringValue(displayType);
    this.dataGrid.dataGridResize.setInitialSectionWidth({ index: position.value }, position.region);
  }

  setTimeDisplayType(timeUnit) {
    this.store.dispatch(
      new DataGridColumnAction(UPDATE_COLUMN_FORMAT_FOR_TIMES, {
        value: timeUnit,
        columnIndex: this.index,
        columnType: this.type,
      }),
    );
    this.setDisplayType(ALL_TYPES.datetime);
  }

  hide() {
    this.menu.hideTrigger();
    this.toggleVisibility(false);
  }

  show() {
    this.toggleVisibility(true);
  }

  search(filter: string) {
    this.filter(filter, true);
  }

  filter(filter: string, search?: boolean) {
    if (filter === this.getFilter()) {
      return;
    }

    this.updateColumnFilter(filter);
    search ? this.dataGrid.rowManager.searchRows() : this.dataGrid.rowManager.filterRows();
    this.dataGrid.dataModel.reset();
  }

  resetFilter() {
    this.updateColumnFilter('');
    this.dataGrid.rowManager.filterRows();
    this.dataGrid.dataModel.reset();
  }

  connectToColumnsChanged() {
    this.columnManager.columnsChanged.connect(this.onColumnsChanged, this);
  }

  connectToCellHovered() {
    this.dataGrid.cellHovered.connect(this.handleHeaderCellHovered, this);
  }

  handleHeaderCellHovered(sender: BeakerXDataGrid, { data }) {
    const column = data && this.columnManager.getColumnByPosition(ColumnManager.createPositionFromCell(data));

    if (!data || column !== this || !DataGridCell.isHeaderCell(data)) {
      this.menu.hideTrigger();

      return;
    }

    this.menu.showTrigger();
  }

  getAlignment() {
    return this.store.selectColumnHorizontalAlignment(this);
  }

  setAlignment(horizontalAlignment: TextRenderer.HorizontalAlignment) {
    this.store.dispatch(
      new DataGridColumnAction(UPDATE_COLUMN_HORIZONTAL_ALIGNMENT, {
        value: horizontalAlignment,
        columnIndex: this.index,
        columnType: this.type,
      }),
    );
  }

  resetAlignment() {
    this.setAlignment(this.store.selectInitialColumnAlignment(this.getDataType(), this.name));
  }

  setWidth(width: number) {
    this.store.dispatch(
      new DataGridColumnAction(UPDATE_COLUMN_WIDTH, { value: width, columnIndex: this.index, columnType: this.type }),
    );
    this.columnManager.updateColumnFilterNodes();
    this.columnManager.updateColumnMenuTriggers();
  }

  getState() {
    return this.store.selectColumnState(this);
  }

  getVisible() {
    return this.store.selectColumnVisible(this);
  }

  getDataType() {
    return this.store.selectColumnDataType(this);
  }

  getSortOrder() {
    return this.store.selectColumnSortOrder(this);
  }

  getFilter() {
    return this.store.selectColumnFilter(this);
  }

  getKeepTrigger() {
    return this.store.selectColumnKeepTrigger(this);
  }

  getDataTypeName(): string {
    return this.store.selectColumnDataTypeName(this);
  }

  getDisplayType() {
    return this.store.selectColumnDisplayType(this);
  }

  getFormatForTimes() {
    return this.store.selectColumnFormatForTimes(this);
  }

  getPosition() {
    return this.store.selectColumnPosition(this);
  }

  getRenderer() {
    return this.store.selectRenderer(this);
  }

  getHighlighter(highlighterType: HIGHLIGHTER_TYPE): Highlighter[] {
    return this.dataGrid.highlighterManager.getColumnHighlighters(this, highlighterType);
  }

  toggleHighlighter(highlighterType: HIGHLIGHTER_TYPE) {
    this.dataGrid.highlighterManager.toggleColumnHighlighter(this, highlighterType);
  }

  resetHighlighters() {
    this.dataGrid.highlighterManager.removeColumnHighlighter(this);
  }

  restoreHighlighters() {
    this.dataGrid.highlighterManager.restoreHighlighters(this);
  }

  sort(sortOrder: SORT_ORDER) {
    this.columnManager.sortByColumn(this, sortOrder);
  }

  toggleSort() {
    if (this.getSortOrder() !== SORT_ORDER.ASC) {
      return this.sort(SORT_ORDER.ASC);
    }

    this.sort(SORT_ORDER.DESC);
  }

  getValueResolver(): (value: any) => any {
    return this.dataGrid.dataModel.getColumnValueResolver(this.getDataType());
  }

  move(destination: number) {
    this.dataGrid.columnPosition.setPosition(this, { ...this.getPosition(), value: destination });
    this.menu.hideTrigger();
    this.dataGrid.resize();
  }

  setDataTypePrecision(precision: number) {
    if (isDoubleWithPrecision(this.getDisplayType())) {
      this.setDisplayType(`4.${precision}`);
    }
  }

  addMinMaxValues() {
    let stringMinMax;
    let minMax;
    const dataType = this.getDataType();
    const displayType = this.getDisplayType();
    const valuesIterator = () => {
      return this.dataGrid.dataModel.getColumnValuesIterator(this);
    };
    const valueResolver = this.dataGrid.dataModel.getColumnValueResolver(
      displayType === ALL_TYPES.html ? displayType : dataType,
    );

    if (dataType === ALL_TYPES.html || displayType === ALL_TYPES.html) {
      this.resizeHTMLRows(valuesIterator());
    } else if (dataType === ALL_TYPES['formatted integer']) {
      stringMinMax = minmax(valuesIterator(), ColumnValuesIterator.longestString(valueResolver));
    } else if (dataType === ALL_TYPES.string) {
      minMax = minmax(
        filter(valuesIterator(), (value) => this.canStringBeConvertedToNumber(value)),
        ColumnValuesIterator.minMax(this.dataGrid.dataModel.getColumnValueResolver(ALL_TYPES.double)),
      );
      stringMinMax = minmax(valuesIterator(), ColumnValuesIterator.longestString(valueResolver));
    } else {
      minMax = minmax(
        filter(valuesIterator(), (value) => !Number.isNaN(valueResolver(value))),
        ColumnValuesIterator.minMax(valueResolver),
      );
    }

    this.minValue = minMax ? minMax[0] : null;
    this.maxValue = minMax ? minMax[1] : null;

    if (stringMinMax) {
      this.longestStringValue = stringMinMax[1];
    }
  }

  private canStringBeConvertedToNumber(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  resetState() {
    this.setTimeDisplayType(this.store.selectFormatForTimes());
    this.setDisplayType(
      getDisplayType(
        this.getDataType(),
        this.store.selectStringFormatForType(),
        this.store.selectStringFormatForColumn()[this.name],
      ),
    );
    this.setAlignment(this.store.selectInitialColumnAlignment(this.getDataType(), this.name));
    this.toggleVisibility(this.store.selectColumnsVisible()[this.name] !== false);
    this.toggleDataBarsRenderer(false);
    this.resetHighlighters();
    this.resetFilter();
    this.move(this.index);
    this.assignFormatFn();

    const position = this.getPosition();
    this.dataGrid.dataGridResize.setInitialSectionWidth({ index: position.value }, position.region);
    this.dataGrid.dataGridResize.updateWidgetWidth();
  }

  restoreState() {
    this.addMinMaxValues();
    this.restoreHighlighters();
    this.dataGrid.repaintBody();
  }

  destroy() {
    this.menu.destroy();
    this.columnFilter.destroy();

    setTimeout(() => {
      this.menu = null;
      this.dataGrid = null;
      this.store = null;
      this.columnManager = null;
      this.columnFilter = null;
      this.formatFn = null;
    });
  }

  toggleDataBarsRenderer(enable?: boolean) {
    const renderer = this.getRenderer();
    const enabled = enable === false || (renderer && renderer.type === RENDERER_TYPE.DataBars);

    this.store.dispatch(
      new DataGridColumnAction(UPDATE_COLUMN_RENDERER, {
        columnType: this.type,
        columnName: this.name,
        value: enabled ? null : { type: RENDERER_TYPE.DataBars, includeText: true },
      }),
    );
  }

  isFrozen() {
    return this.store.selectIsColumnFrozen(this);
  }

  toggleColumnFrozen() {
    this.store.dispatch(
      new DataGridColumnAction(UPDATE_COLUMN_FROZEN, {
        columnType: this.type,
        columnName: this.name,
        value: !this.isFrozen(),
      }),
    );

    this.dataGrid.columnPosition.updateAll();
  }

  recalculateLongestStringValue(displayType: ALL_TYPES | string) {
    if (displayType !== ALL_TYPES.string && displayType !== ALL_TYPES.html) {
      return;
    }

    this.longestStringValue = null;
    this.addMinMaxValues();
  }

  private resizeHTMLRows(valuesIterator) {
    const fontSize = this.store.selectDataFontSize();
    let longest;

    each(valuesIterator, (value, index) => {
      const size = DataGridHelpers.getStringSize(value, fontSize);

      if (!longest || longest.width < size.width) {
        longest = { width: size.width, value };
      }

      if (size.height > this.dataGrid.getRowSections().sizeOf(index)) {
        this.dataGrid.resizeRow('body', index, size.height);
      }
    });

    this.longestStringValue = longest && longest.value;
  }

  private updateColumnFilter(filter: string) {
    this.store.dispatch(
      new DataGridColumnAction(UPDATE_COLUMN_FILTER, { value: filter, columnIndex: this.index, columnType: this.type }),
    );
  }

  private toggleVisibility(value) {
    this.store.dispatch(
      new DataGridColumnAction(UPDATE_COLUMN_VISIBLE, {
        value,
        columnIndex: this.index,
        columnType: this.type,
        columnName: this.name,
        hasIndex: this.store.selectHasIndex(),
      }),
    );
    this.dataGrid.columnPosition.updateAll();
  }

  private onColumnsChanged(sender: ColumnManager, args: IBkoColumnsChangedArgs) {
    if (args.type !== COLUMN_CHANGED_TYPES.columnSort) {
      return;
    }

    if (args.column === this && args.value !== SORT_ORDER.NO_SORT) {
      this.setColumnSortOrder(args.value);
      this.dataGrid.highlighterManager.addColumnHighlighter(this, HIGHLIGHTER_TYPE.sort);
      this.menu.showTrigger();
    } else {
      this.setColumnSortOrder(SORT_ORDER.NO_SORT);
      this.dataGrid.highlighterManager.removeColumnHighlighter(this, HIGHLIGHTER_TYPE.sort);
      this.menu.hideTrigger();
    }
  }

  private setColumnSortOrder(order: SORT_ORDER) {
    this.store.dispatch(
      new DataGridColumnAction(UPDATE_COLUMN_SORT_ORDER, {
        value: order,
        columnIndex: this.index,
        columnType: this.type,
      }),
    );
  }
}
