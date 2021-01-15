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

import * as moment from 'moment-timezone/builds/moment-timezone-with-data';
import {COLUMN_TYPES, SORT_ORDER} from '../column/enums';
import {ALL_TYPES, getDisplayType, getTypeByName} from '../dataTypes';
import {IDataGridModelState} from '../interface/IDataGridModelState';
import {Datastore, Fields} from "@lumino/datastore";
import {IColumnPosition, IColumnState} from "../interface/IColumn";
import {BeakerXDataGridModel} from "../model/BeakerXDataGridModel";
import {DEFAULT_PAGE_LENGTH, TIME_UNIT_FORMATS} from "../consts";
import {getAlignmentByChar, getAlignmentByType} from "../column/ColumnAlignment";
import {DataGridAction, DataGridColumnAction, DataGridColumnsAction} from "./DataGridAction";
import {DataModel} from "@lumino/datagrid";
import {each, find} from "@lumino/algorithm";
import {
  ADD_COLUMN_HIGHLIGHTER,
  REMOVE_COLUMN_HIGHLIGHTER,
  RESET_COLUMNS_ORDER, UPDATE_COLUMN_FROZEN,
  UPDATE_COLUMN_ORDER,
  UPDATE_COLUMN_RENDERER, UPDATE_COLUMN_VISIBLE, UPDATE_COLUMNS_VISIBLE,
  UPDATE_MODEL_DATA,
  UPDATE_MODEL_FONT_COLOR,
  UPDATE_MODEL_VALUES
} from "../model/BeakerXDataGridModel";
import {IHighlighterState} from "../interface/IHighlighterState";


const DEFAULT_INDEX_COLUMN_NAME = '';

export const UPDATE_COLUMN_POSITIONS = 'UPDATE_COLUMN_POSITIONS';
export const UPDATE_COLUMNS_FILTERS = 'UPDATE_COLUMNS_FILTERS';
export const UPDATE_COLUMN_FILTER = 'UPDATE_COLUMN_FILTER';
export const UPDATE_COLUMN_HORIZONTAL_ALIGNMENT = 'UPDATE_COLUMN_HORIZONTAL_ALIGNMENT';
export const UPDATE_COLUMN_FORMAT_FOR_TIMES = 'UPDATE_COLUMN_FORMAT_FOR_TIMES';
export const UPDATE_COLUMN_DISPLAY_TYPE = 'UPDATE_COLUMN_DISPLAY_TYPE';
export const UPDATE_COLUMN_SORT_ORDER = 'UPDATE_COLUMN_SORT_ORDER';
export const UPDATE_COLUMN_WIDTH = 'UPDATE_COLUMN_WIDTH';


const defaultColumnState: IColumnState = {
  key: '',
  name: '',
  index: 0,
  columnType: COLUMN_TYPES.body,
  dataTypeName: '',
  dataType: ALL_TYPES.string,
  displayType: ALL_TYPES.string,
  keepTrigger: false,
  horizontalAlignment: 'left',
  formatForTimes: null,
  sortOrder: SORT_ORDER.NO_SORT,
  filter: null,
  position: { value: 0, region: 'body' },
};


let BEAKERX_SCHEMA = {
  id: 'beakerx',
  fields: {
    model: Fields.List<IDataGridModelState>(),
    columns: Fields.List<IColumnState>(),
  }
};

export interface IBeakerXDataGridState {
  model: IDataGridModelState;
  columns: IColumnState[];
}

let _storeId = 0;

export class BeakerXDataStore {
  store: Datastore;

  constructor(initialState: IDataGridModelState) {
    this.store = Datastore.create({id: _storeId, schemas: [BEAKERX_SCHEMA]})
    _storeId++;
    let schema = this.store.get(BEAKERX_SCHEMA);
    try {
      this.store.beginTransaction();
      schema.update({['init']: { model: { index: 0, remove: 1, values: [initialState] }}});
    } finally {
      this.store.endTransaction();
    }

    schema = this.store.get(BEAKERX_SCHEMA);
    let initialColumnsState = createInitialColumnsState(this);
    try {
      this.store.beginTransaction();
      schema.update({['init']: {columns: {index: 0, remove: 1, values: initialColumnsState}}})
    } finally {
      this.store.endTransaction();
    }
  }
  selectValues() {
    let schema = this.store.get(BEAKERX_SCHEMA);
    const filteredValues = schema.get('init')!.model[0].filteredValues;
    return filteredValues ? filteredValues : schema.get('init')!.model[0].values;
  }
  selectHasIndex() {
    let schema = this.store.get(BEAKERX_SCHEMA);
    return schema.get('init')!.model[0].hasIndex;
  }
  selectTooltips() {
    let schema = this.store.get(BEAKERX_SCHEMA);
    return schema.get('init')!.model[0].tooltips || [];
  }
  selectCellHighlighters() {
    let schema = this.store.get(BEAKERX_SCHEMA);
    return schema.get('init')!.model[0].cellHighlighters || [];
  }
  selectHeadersVertical() {
    let schema = this.store.get(BEAKERX_SCHEMA);
    return schema.get('init')!.model[0].headersVertical;
  }
  selectHeaderFontSize() {
    let schema = this.store.get(BEAKERX_SCHEMA);
    return schema.get('init')!.model[0].headerFontSize;
  }
  selectDataFontSize() {
    let schema = this.store.get(BEAKERX_SCHEMA);
    return schema.get('init')!.model[0].dataFontSize;
  }
  selectFontColor() {
    let schema = this.store.get(BEAKERX_SCHEMA);
    return schema.get('init')!.model[0].fontColor;
  }
  selectRawColumnNames() {
    let schema = this.store.get(BEAKERX_SCHEMA);
    return schema.get('init').model[0].columnNames || [];
  }
  selectAlignmentForColumn(dataType, columnName) {
    let schema = this.store.get(BEAKERX_SCHEMA);
    return (schema.get('init')!.model[0].alignmentForColumn || {})[columnName];
  }
  selectAlignmentForType(dataType) {
    let schema = this.store.get(BEAKERX_SCHEMA);
    return (schema.get('init')!.model[0].alignmentForType || {})[ALL_TYPES[dataType]];
  }
  selectAlignmentByType(dataType) {
    return getAlignmentByType(dataType);
  }
  selectHasDoubleClickAction() {
    let schema = this.store.get(BEAKERX_SCHEMA);
    return schema.get('init')!.model[0].hasDoubleClickAction;
  }
  selectDoubleClickTag() {
    let schema = this.store.get(BEAKERX_SCHEMA);
    return schema.get('init')!.model[0].doubleClickTag;
  }
  selectContextMenuItems() {
    let schema = this.store.get(BEAKERX_SCHEMA);
    return schema.get('init')!.model[0].contextMenuItems || [];
  }
  selectContextMenuTags() {
    let schema = this.store.get(BEAKERX_SCHEMA);
    return schema.get('init')!.model[0].contextMenuTags || {};
  }
  selectStringFormatForType() {
    let schema = this.store.get(BEAKERX_SCHEMA);
    return schema.get('init')!.model[0].stringFormatForType;
  }
  selectStringFormatForColumn() {
    let schema = this.store.get(BEAKERX_SCHEMA);
    return schema.get('init')!.model[0].stringFormatForColumn || {};
  }
  selectStringFormatForTimes() {
    return (this.selectStringFormatForType()['time'] || { unit: 'DATETIME' })['unit'];
  }
  selectFormatForTimes() {
    return TIME_UNIT_FORMATS[this.selectStringFormatForTimes()];
  }
  selectTimeStrings() {
    let schema = this.store.get(BEAKERX_SCHEMA);
    return schema.get('init')!.model[0].timeStrings;
  }
  selectRendererForColumn(column) {
    if (column === undefined)
      return undefined;
    let schema = this.store.get(BEAKERX_SCHEMA);
    return schema.get('init')!.model[0].rendererForColumn[column.name];
  }
  selectRendererForType(column) {
    if (column === undefined)
      return undefined;
    let schema = this.store.get(BEAKERX_SCHEMA);
    return schema.get('init')!.model[0].rendererForType[column.getDataTypeName() || ALL_TYPES[column.getDataType()]];
  }
  selectTimeZone() {
    let schema = this.store.get(BEAKERX_SCHEMA);
    return schema.get('init')!.model[0].timeZone;
  }
  selectColumnTypes() {
    let schema = this.store.get(BEAKERX_SCHEMA);
    return schema.get('init')!.model[0].types;
  }
  selectColumnOrder() {
    let schema = this.store.get(BEAKERX_SCHEMA);
    return schema.get('init')!.model[0].columnOrder;
  }
  selectColumnsVisible() {
    let schema = this.store.get(BEAKERX_SCHEMA);
    return schema.get('init')!.model[0].columnsVisible || {};
  }
  selectColumnsFrozen() {
    let schema = this.store.get(BEAKERX_SCHEMA);
    return schema.get('init')!.model[0].columnsFrozen || {};
  }
  selectRowsToShow() {
    let schema = this.store.get(BEAKERX_SCHEMA);
    return schema.get('init')!.model[0].rowsToShow || DEFAULT_PAGE_LENGTH;
  }
  selectAutoLinkTableLinks() {
    let schema = this.store.get(BEAKERX_SCHEMA);
    return schema.get('init')!.model[0].auto_link_table_links;
  }
  selectShowPublication() {
    let schema = this.store.get(BEAKERX_SCHEMA);
    return schema.get('init')!.model[0].show_publication;
  }
  selectModel() {
    let schema = this.store.get(BEAKERX_SCHEMA);
    return schema.get('init')!.model[0];
  }

  selectColumnNames() {
    const names = this.selectRawColumnNames();
    return names.map(processColumnName);
  }

  selectBodyColumnNames() {
    const columnNames = this.selectColumnNames();
    const hasIndex = this.selectHasIndex();
    return hasIndex ? columnNames.slice(1) : columnNames
  }

  selectColumnIndexByName(name) {
    const index = this.selectBodyColumnNames().indexOf(String(name));
    return index !== -1 ? index : 0;
  }

  selectIndexColumnNames() {
    const columnNames = this.selectColumnNames();
    const hasIndex = this.selectHasIndex();
    return hasIndex && columnNames[0] !== null ? [columnNames[0]] : [DEFAULT_INDEX_COLUMN_NAME];
  }

  selectColumnsFrozenNames() {
    const columnsFrozen = this.selectColumnsFrozen();
    const indexColumnNames = this.selectIndexColumnNames();
    return Object.keys(columnsFrozen).filter((name) => columnsFrozen[name] &&
      indexColumnNames.indexOf(name) === -1);
  }

  selectColumnsFrozenCount() {
    return this.selectColumnsFrozenNames().length;
  }

  selectIsColumnFrozen(column) {
    const columnsFrozen = this.selectColumnsFrozenNames();
    return columnsFrozen.indexOf(column.name) !== -1;
  }

  selectColumnVisible(column) {
    const columnsVisible = this.selectColumnsVisible();
    const columnsOrder = this.selectColumnOrder();
    return columnsVisible[column.name] !== false && (columnsOrder.length === 0 ||
      columnsOrder.indexOf(column.name) !== -1);
  }

  selectInitialColumnAlignment(dataType, columnName) {
    const alignmentForColumn = this.selectAlignmentForColumn(dataType, columnName);
    const alignmentForType = this.selectAlignmentForType(dataType);
    const alignmentByType =this.selectAlignmentByType(dataType);
    if (alignmentForColumn) {
      return getAlignmentByChar(alignmentForColumn);
    }
    if (alignmentForType) {
      return getAlignmentByChar(alignmentForType);
    }
    return alignmentByType;
  }

  selectVisibleColumnsFrozenCount() {
    const columnsFrozenNames = this.selectColumnsFrozenNames();
    const columnsVisible = this.selectColumnsVisible();
    return columnsFrozenNames.filter((name) => columnsVisible[name] !== false).length;
  }

  selectColumnDataTypeByName(name) {
    const types = this.selectColumnTypes();
    const names = this.selectRawColumnNames();
    return ALL_TYPES[types[names.indexOf(name)]];
  }

  // Returns the map columnIndex => position
  selectInitialColumnPositions() {
    const columnOrder = this.selectColumnOrder();
    const allColumnNames = this.selectColumnNames();
    const columnsVisible = this.selectColumnsVisible();
    const hasIndex = this.selectHasIndex();
    const columnsFrozenNames = this.selectColumnsFrozenNames();
    const hasInitialOrder = columnOrder && columnOrder.length > 0;
    const columnNames = hasIndex ? allColumnNames.slice(1) : allColumnNames;
    const order = [...columnNames];
    const reversedOrder = [...columnOrder].reverse();
    const frozenColumnsOrder = [];

    if (hasInitialOrder) {
      reversedOrder.forEach((name) => {
        const columnPosition = order.indexOf(name);
        const frozenColumnIndex = columnsFrozenNames.indexOf(name);

        if (frozenColumnIndex !== -1) {
          frozenColumnsOrder.unshift(name);
        }

        if (columnPosition === -1) {
          return true;
        }

        order.splice(columnPosition, 1);
        order.unshift(name);
      });
    }

    Object.keys(columnsVisible).forEach((name) => {
      if (columnsVisible[name] === false) {
        const indexToRemove = order.indexOf(name);
        const removed = order.splice(indexToRemove, 1)[0];

        order.push(removed);
      }
    });

    columnsFrozenNames.forEach((name) => {
      const frozenColumnIndex = order.indexOf(name);

      if (frozenColumnIndex !== -1) {
        order.splice(frozenColumnIndex, 1);
      }

      if (frozenColumnsOrder.indexOf(name) === -1) {
        frozenColumnsOrder.push(name);
      }
    });

    const result: IColumnPosition[] = [];

    columnNames.forEach((name: string, index: number) => {
      let value = order.indexOf(name);
      let region: DataModel.ColumnRegion = 'body';

      if (value === -1) {
        value = frozenColumnsOrder.indexOf(name) + 1;
        region = 'row-header';
      }

      result[index] = {value, region};
    });

    if (hasIndex) {
      result.unshift({value: 0, region: 'row-header'});
    }

    return result;
  }

  selectRenderer(column) {
    const columnRenderer = this.selectRendererForColumn(column);
    const typeRenderer = this.selectRendererForType(column);
    if (columnRenderer || columnRenderer === null) {
      return columnRenderer;
    }

    return typeRenderer;
  }

  selectColumnHighlighters(columnName, highlighterType) {
    const highlighters = this.selectCellHighlighters();
    return highlighters.filter((highlighter) => highlighter.colName === columnName && highlighter.type === highlighterType);
  }

  selectColumnFixedWidth(columnName, typeName)  {
    const formatForColumns = this.selectStringFormatForColumn();
    const formatForTypes = this.selectStringFormatForType();
    if (formatForColumns[columnName] && formatForColumns[columnName].width) {
      return formatForColumns[columnName].width;
    }

    if (formatForTypes[typeName] && formatForTypes[typeName].width) {
      return formatForTypes[typeName].width;
    }

    return null;
  }

  selectColumnStatesArray(): IColumnState[] {
    let schema = this.store.get(BEAKERX_SCHEMA);
    return Array.from(schema.get('init').columns);
  }

  selectBodyColumnStates() {
    return this.selectColumnStatesArray()
      .filter((columnState) => columnState.columnType === COLUMN_TYPES.body)
      .sort((state1, state2) => state1.index - state2.index);
  }

  selectVisibleBodyColumns(columnOrder) {
    const bodyColumnStates = this.selectBodyColumnStates();
    const columnsVisible = this.selectColumnsVisible();
    return bodyColumnStates.filter(
      (state) =>
        columnsVisible[state.name] !== false && (columnOrder.length === 0 || columnOrder.indexOf(state.name) !== -1),
    );
  }

  selectColumnStateByKey(key) {
    let schema = this.store.get(BEAKERX_SCHEMA);
    let columns = schema.get('init').columns;
    let iColumnStates = find(columns, (c) => c.key == key);
    return iColumnStates || defaultColumnState;
  }

  selectColumnState(column) {
    return this.selectColumnStateByKey(`${column.type}_${column.index}`);
  }

  selectColumnDataTypeName(column) {
    return this.selectColumnState(column).dataTypeName;
  }

  selectColumnHorizontalAlignment(column) {
    return this.selectColumnState(column).horizontalAlignment;
  }

  selectColumnDisplayType(column) {
    return this.selectColumnState(column).displayType;
  }

  selectColumnFilter(column) {
    return this.selectColumnState(column).filter || '';
  }

  selectColumnDataType(column) {
    return this.selectColumnState(column).dataType;
  }

  selectColumnSortOrder(column) {
    return this.selectColumnState(column).sortOrder;
  }

  selectColumnKeepTrigger(column) {
    return this.selectColumnState(column).keepTrigger;
  }

  selectColumnFormatForTimes(column) {
    return this.selectColumnState(column).formatForTimes || {};
  }

  selectColumnWidth(column) {
    return this.selectColumnState(column).width || 0;
  }

  selectColumnPosition(column) {
    return this.selectColumnState(column).position;
  }

  selectColumnIndexByPosition(position: IColumnPosition) {
    const states = this.selectColumnStatesArray();
    const columnState: IColumnState = find(
      states,
      (stateItem: IColumnState) =>
        stateItem.position.region === position.region && stateItem.position.value === position.value,
    );
    return columnState ? columnState.index : undefined;
  }

  selectOutputColumnLimit() {
    return window.beakerx && window.beakerx.prefs && window.beakerx.prefs.outputColumnLimit
      ? window.beakerx.prefs.outputColumnLimit
      : this.selectColumnNames().length;
  }

  dispatch(action: DataGridAction | DataGridColumnAction | DataGridColumnsAction) {
    let schema = this.store.get(BEAKERX_SCHEMA);
    switch (action.type) {
      case UPDATE_MODEL_DATA:
        try {
          this.store.beginTransaction();
          let state = schema.get('init').model[0];
          state = { ...state, ...action.payload }
          schema.update({['init']: { model: { index: 0, remove: 1, values: [state] }}});
        } finally {
          this.store.endTransaction();
        }
        break;

      case UPDATE_MODEL_VALUES:
        try {
          this.store.beginTransaction();
          let state = schema.get('init').model[0];
          state.values = action.payload.values;
          schema.update({['init']: { model: { index: 0, remove: 1, values: [state] }}});
        } finally {
          this.store.endTransaction();
        }
        break;

      case UPDATE_MODEL_FONT_COLOR:
        try {
          this.store.beginTransaction();
          let state = schema.get('init').model[0];
          state.fontColor = action.payload.fontColor;
          schema.update({['init']: { model: { index: 0, remove: 1, values: [state] }}});
        } finally {
          this.store.endTransaction();
        }
        break;

      case UPDATE_COLUMN_RENDERER:
        try {
          this.store.beginTransaction();
          let state = schema.get('init').model[0];
          state.rendererForColumn[action.payload.columnName] = action.payload.value;
          schema.update({['init']: { model: { index: 0, remove: 1, values: [state] }}});
        } finally {
          this.store.endTransaction();
        }
        break;

      case UPDATE_COLUMN_ORDER: {
        const {columnName, value: position} = action.payload;
        let columnOrder = this.selectColumnOrder();
        if (columnOrder.length == 0) {
          columnOrder = this.selectColumnNames();
        }
        const columnVisible = this.selectColumnsVisible();
        const columnsFrozenen = this.selectColumnsFrozen();
        const hasIndex = this.selectHasIndex();
        let destination = hasIndex ? position.value + 1 : position.value;
        Object.keys(columnVisible).forEach((name) => {
          if (columnVisible[name] !== false) {
            return true;
          }
          const position = columnOrder.indexOf(name);
          if (position !== -1) {
            columnOrder.splice(position, 1);
            columnOrder.push(name);
          }
        });

        const lastPosition = columnOrder.indexOf(columnName);
        if (lastPosition !== -1) {
          columnOrder.splice(lastPosition, 1);
        }

        if (destination > 0 && (position.region === 'row-header' || position.region === 'corner-header')) {
          let frozenCounter = 0;
          columnOrder.forEach((name, index) => {
            if (columnsFrozenen[name] !== true) {
              return true;
            }
            frozenCounter += 1;
            if (frozenCounter === destination) {
              destination = index;
            }
          });
        }
        columnOrder.splice(destination, 0, columnName);
        try {
          this.store.beginTransaction();
          let state = schema.get('init').model[0];
          state.columnOrder = columnOrder;
          schema.update({['init']: {model: {index: 0, remove: 1, values: [state]}}});
        } finally {
          this.store.endTransaction();
        }
      }
      break;

      case RESET_COLUMNS_ORDER: {
        let columnOrder = this.selectColumnOrder();

        if (action.payload.value) {
          columnOrder = [];
        }

        this.selectColumnNames().forEach((name, index) => {
          if (columnOrder.indexOf(name) === -1) {
            columnOrder.splice(index, 0, name);
          }
        });
        try {
          this.store.beginTransaction();
          let state = schema.get('init').model[0];
          state.columnOrder = columnOrder;
          schema.update({['init']: {model: {index: 0, remove: 1, values: [state]}}});
        } finally {
          this.store.endTransaction();
        }
      }
      break;

      case UPDATE_COLUMN_FROZEN: {
        const {columnName, value} = action.payload;
        const columnsFrozen = this.selectColumnsFrozen();
        columnsFrozen[columnName] = value;
        try {
          this.store.beginTransaction();
          let state = schema.get('init').model[0];
          state.columnsFrozen = columnsFrozen;
          schema.update({['init']: {model: {index: 0, remove: 1, values: [state]}}});
        } finally {
          this.store.endTransaction();
        }
      }
      break;

      case UPDATE_COLUMN_VISIBLE: {
        const { columnName, columnIndex, value } = action.payload;
        const columnsVisible = this.selectColumnsVisible();
        const columnOrder = [...this.selectColumnOrder()];

        if (value && columnOrder.length > 0 && columnOrder.indexOf(columnName) === -1) {
          const position = columnIndex <= columnOrder.length ? columnIndex : columnOrder.length - 1;

          columnOrder.splice(position, 0, columnName);
        }

        let newVisible = {
          ...columnsVisible,
          [columnName]: value,
        };

        try {
          this.store.beginTransaction();
          let state = schema.get('init').model[0];
          state.columnOrder = columnOrder;
          state.columnsVisible = newVisible;
          schema.update({['init']: {model: {index: 0, remove: 1, values: [state]}}});
        } finally {
          this.store.endTransaction();
        }
      }
      break;

      case UPDATE_COLUMNS_VISIBLE: {
        const columnOrder = [...this.selectColumnOrder()];

        if (columnOrder.length > 0) {
          Object.keys(action.payload.value).forEach((name, index) => {
            if (columnOrder.indexOf(name) !== -1 || !action.payload.value[name]) {
              return true;
            }

            index < columnOrder.length ? columnOrder.splice(index, 0, name) : columnOrder.push(name);
          });
        }

        try {
          this.store.beginTransaction();
          let state = schema.get('init').model[0];
          state.columnOrder = columnOrder;
          state.columnsVisible = action.payload.valueOf();
          schema.update({['init']: { model: { index: 0, remove: 1, values: [state] }}});
        } finally {
          this.store.endTransaction();
        }
      }
      break;

      case ADD_COLUMN_HIGHLIGHTER: {
        const cellHighlighters = this.selectCellHighlighters();
        const highlighterState: IHighlighterState = action.payload.value;
        const currentHighlighters = this.selectColumnHighlighters(
          highlighterState.colName,
          highlighterState.type,
        );

        if (currentHighlighters.length > 0) {
          each(currentHighlighters, (current) => {
            cellHighlighters.splice(cellHighlighters.indexOf(current), 1);
          });
        }
        cellHighlighters.push(action.payload.value);

        try {
          this.store.beginTransaction();
          let state = schema.get('init').model[0];
          state.cellHighlighters = cellHighlighters;
          schema.update({['init']: { model: { index: 0, remove: 1, values: [state] }}});
        } finally {
          this.store.endTransaction();
        }
      }
      break;

      case REMOVE_COLUMN_HIGHLIGHTER: {
        const cellHighlighters = this.selectCellHighlighters();
        const highlighterState: IHighlighterState = action.payload.value;
        const currentHighlighters = this.selectColumnHighlighters(
          highlighterState.colName,
          highlighterState.type,
        );

        if (currentHighlighters.length > 0) {
          each(currentHighlighters, (current) => {
            cellHighlighters.splice(cellHighlighters.indexOf(current), 1);
          });
        }
        try {
          this.store.beginTransaction();
          let state = schema.get('init').model[0];
          state.cellHighlighters = cellHighlighters;
          schema.update({['init']: { model: { index: 0, remove: 1, values: [state] }}});
        } finally {
          this.store.endTransaction();
        }
      }
      break;

    case UPDATE_COLUMN_POSITIONS: {
      let stateArray = schema.get('init').columns;
      const {value, hasIndex, columnsFrozenNames = [], columnsVisible = {}} = action.payload;
      const columnsFrozenCopy = [...columnsFrozenNames];
      const order = [...value];
      const indexColumnPosition = order.indexOf('index');
      if (-1 !== indexColumnPosition) {
        order.splice(indexColumnPosition, 1);
      }
      const hiddenStates: IColumnState[] = stateArray
        .filter((columnState) => columnsVisible[columnState.name] === false);

      // Remove frozen columns
      if (columnsFrozenCopy.length > 0) {
        columnsFrozenCopy.sort((name1, name2) => {
          const index1 = order.indexOf(name1);
          const index2 = order.indexOf(name2);

          return index1 - index2;
        });

        columnsFrozenCopy.forEach((name) => {
          order.splice(order.indexOf(name), 1)[0];
        });
      }
      // Move hidden columns outside the visible range
      hiddenStates.forEach((state) => {
        const position = order.indexOf(state.name);
        const frozenPosition = columnsFrozenCopy.indexOf(state.name);

        if (position !== -1) {
          order.splice(position, 1);
          order.push(state.name);
        }

        if (frozenPosition !== -1) {
          columnsFrozenCopy.splice(frozenPosition, 1);
          columnsFrozenCopy.push(state.name);
        }
      });

      const newState = [];
      stateArray.forEach(columnState => {
        if (columnState.columnType !== COLUMN_TYPES.body) {
          newState.push(columnState);
          return;
        }

        let positionInBody = order.indexOf(columnState.name);
        const positionInFrozen = columnsFrozenCopy.indexOf(columnState.name) + 1;

        if (positionInFrozen === 0 && positionInBody === -1) {
          positionInBody = order.push(columnState.name) - 1;
        }

        if (hasIndex) {
          positionInBody -= 1;
        }
        columnState.position =  {
            region: positionInFrozen === 0 ? 'body' : 'row-header',
            value: positionInFrozen === 0 ? positionInBody : positionInFrozen,
        };
        newState.push(columnState);
      });
      try {
        this.store.beginTransaction();
        let colState = Array.from(newState.values());
        schema.update({['init']: {columns: {index: 0, remove: stateArray.length, values: colState}}});
      } finally {
        this.store.endTransaction();
      }
    }
    break;

    case UPDATE_COLUMNS_FILTERS:
      if (action instanceof DataGridColumnsAction) {
        let stateArray = schema.get('init').columns;

        try {
          this.store.beginTransaction();
          const colState = updateColumnsState(Array.from(stateArray.values()), action, 'filter');
          schema.update({['init']: {columns: {index: 0, remove: stateArray.length, values: colState}}});
        } finally {
          this.store.endTransaction();
        }
      }
      break;

    case UPDATE_COLUMN_FILTER:
      if (action instanceof DataGridColumnAction) {
        const {columnType, columnIndex, value} = action.payload;
        const key = `${columnType}_${columnIndex}`;
        try {
          this.store.beginTransaction();
          let state = schema.get('init').columns;
          let colStateIdx = state.findIndex(item => item.key == key);
          let colState = state[colStateIdx];
          colState.filter = value;
          schema.update({['init']: {columns: {index: colStateIdx, remove: 1, values: [colState]}}});
        } finally {
          this.store.endTransaction();
        }
      }
      break;

    case UPDATE_COLUMN_HORIZONTAL_ALIGNMENT:
      if (action instanceof DataGridColumnAction) {
        const {columnType, columnIndex, value} = action.payload;
        const key = `${columnType}_${columnIndex}`;
        try {
          this.store.beginTransaction();
          let state = schema.get('init').columns;
          let colStateIdx = state.findIndex(item => item.key == key);
          let colState = state[colStateIdx];
          colState.horizontalAlignment = value;
          schema.update({['init']: {columns: {index: colStateIdx, remove: 1, values: [colState]}}});
        } finally {
          this.store.endTransaction();
        }
      }
      break;

    case UPDATE_COLUMN_FORMAT_FOR_TIMES:
      if (action instanceof DataGridColumnAction) {
        const {columnType, columnIndex, value} = action.payload;
        const key = `${columnType}_${columnIndex}`;
        try {
          this.store.beginTransaction();
          let state = schema.get('init').columns;
          let colStateIdx = state.findIndex(item => item.key == key);
          let colState = state[colStateIdx];
          colState.formatForTimes = value;
          schema.update({['init']: {columns: {index: colStateIdx, remove: 1, values: [colState]}}});
        } finally {
          this.store.endTransaction();
        }
      }
      break;

    case UPDATE_COLUMN_DISPLAY_TYPE:
      if (action instanceof DataGridColumnAction) {
        const {columnType, columnIndex, value} = action.payload;
        const key = `${columnType}_${columnIndex}`;
        try {
          this.store.beginTransaction();
          let state = schema.get('init').columns;
          let colStateIdx = state.findIndex(item => item.key == key);
          let colState = state[colStateIdx];
          colState.displayType = value;
          schema.update({['init']: {columns: {index: colStateIdx, remove: 1, values: [colState]}}});
        } finally {
          this.store.endTransaction();
        }
      }
      break;

    case UPDATE_COLUMN_SORT_ORDER:
      if (action instanceof DataGridColumnAction) {
        const {columnType, columnIndex, value} = action.payload;
        const key = `${columnType}_${columnIndex}`;
        try {
          this.store.beginTransaction();
          let state = schema.get('init').columns;
          let colStateIdx = state.findIndex(item => item.key == key);
          let colState = state[colStateIdx];
          colState.sortOrder = value;
          schema.update({['init']: {columns: {index: colStateIdx, remove: 1, values: [colState]}}});
        } finally {
          this.store.endTransaction();
        }
      }
      break;

    case UPDATE_COLUMN_WIDTH:
      if (action instanceof DataGridColumnAction) {
        const {columnType, columnIndex, value} = action.payload;
        const key = `${columnType}_${columnIndex}`;
        try {
          this.store.beginTransaction();
          let state = schema.get('init').columns;
          let colStateIdx = state.findIndex(item => item.key == key);
          let colState = state[colStateIdx];
          colState.width = value;
          schema.update({['init']: {columns: {index: colStateIdx, remove: 1, values: [colState]}}});
        } finally {
          this.store.endTransaction();
        }
      }
      break;
    default:
      console.log(`${action.type} not implemented`);
      break;
    }
  }
}


const processColumnName = (name) => {
  if (name === null) {
    return name;
  }

  if (!Array.isArray(name)) {
    return String(name);
  }

  const isDate = (value) => {
    return (
      value instanceof Object &&
      Object.prototype.hasOwnProperty.call(value, 'type') &&
      Object.prototype.hasOwnProperty.call(value, 'timestamp') &&
      value.type === 'Date'
    );
  };

  return name.reduce((prev, curr, index) => {
    const processed = isDate(curr) ? moment(curr.timestamp).format('YYYY-MM-DD') : String(curr);

    return index === 0 ? processed : `${prev}, ${processed}`;
  }, '');
};


export function createInitialColumnsState(store: BeakerXDataStore): IColumnState[] {
  const initialColumnsState: IColumnState[] = [];
  const names = addColumnNamesState(store);
  const types = addColumnTypesState(store);
  const positions = addColumnsPositions(store);

  const addColumnState = (columnType: COLUMN_TYPES) => (name, index) => {
    const key = `${columnType}_${index}`;
    const dataType = getTypeByName(types[columnType][index]);

    initialColumnsState.push({
      key,
      name,
      index,
      dataType,
      columnType,
      filter: null,
      formatForTimes: store.selectFormatForTimes(),
      sortOrder: SORT_ORDER.NO_SORT,
      horizontalAlignment: store.selectInitialColumnAlignment(dataType, name),
      keepTrigger: columnType === COLUMN_TYPES.index,
      position: positions[columnType][index],
      dataTypeName: types[columnType][index],
      width: store.selectColumnFixedWidth(name, types[columnType][index]),
      displayType: getDisplayType(dataType, store.selectStringFormatForType(), store.selectStringFormatForColumn()[name]),
    });
  };

  names[COLUMN_TYPES.index].forEach(addColumnState(COLUMN_TYPES.index));
  names[COLUMN_TYPES.body].forEach(addColumnState(COLUMN_TYPES.body));

  return initialColumnsState;
}

function addColumnsPositions(store: BeakerXDataStore) {
  return createColumnsState(
    {
      value: store.selectInitialColumnPositions(),
      defaultValue: [{ region: 'row-header', value: 0 }],
    },
    store,
  );
}

function addColumnNamesState(store: BeakerXDataStore) {
  const value = (store.selectColumnNames() || []).map(processColumnName);

  return createColumnsState(
    {
      value,
      defaultValue: [DEFAULT_INDEX_COLUMN_NAME],
    },
    store,
  );
}

function addColumnTypesState(store: BeakerXDataStore) {
  const value = store.selectColumnTypes();

  return createColumnsState(
    {
      value,
      defaultValue: [BeakerXDataGridModel.DEFAULT_INDEX_COLUMN_TYPE],
    },
    store,
  );
}

function createColumnsState({ value, defaultValue }, store: BeakerXDataStore) {
  const hasIndex = store.selectHasIndex();

  return {
    [COLUMN_TYPES.body]: hasIndex ? value.slice(1) : value,
    [COLUMN_TYPES.index]: hasIndex ? value.slice(0, 1) : defaultValue,
  };
}

function updateColumnsState(state: IColumnState[], action: DataGridColumnsAction, property: string) {
  const { value, hasIndex, defaultValue = [] } = action.payload;
  const bodyColumnValues = hasIndex ? value.slice(1) : value;
  const indexColumnValues = hasIndex ? value.slice(0, 1) : defaultValue;

  const newState: IColumnState[] = [];

  indexColumnValues.forEach((value, index) => {
    let column = state[index];
    column[property] = value
    newState.push(column);
  });

  bodyColumnValues.forEach((value, index) => {
    let column = state[indexColumnValues.length + index];
    column[property] = value
    newState.push(column);
  });

  return newState;
}
