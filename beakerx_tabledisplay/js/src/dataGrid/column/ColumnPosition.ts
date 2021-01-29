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

import { BeakerXDataGrid } from '../BeakerXDataGrid';
import { ICellData } from '../interface/ICell';
import { IColumnPosition } from '../interface/IColumn';
import { UPDATE_COLUMN_ORDER } from '../model/BeakerXDataGridModel';
import { BeakerXDataStore } from '../store/BeakerXDataStore';
import { DataGridColumnAction, DataGridColumnsAction } from '../store/DataGridAction';
import { DataGridStyle } from '../style/DataGridStyle';
import { ColumnManager } from './ColumnManager';
import { DataGridColumn } from './DataGridColumn';
import { COLUMN_SIDE, COLUMN_TYPES } from './enums';
import { UPDATE_COLUMN_POSITIONS } from '../store/BeakerXDataStore';

const DATA_GRID_PADDING = 20;

export class ColumnPosition {
  dataGrid: BeakerXDataGrid;
  store: BeakerXDataStore;
  grabbedCellData: ICellData | null;
  dropCellData: ICellData | null;
  draggableHeaderCanvas: HTMLCanvasElement;
  draggableHeaderOffsetLeft: number | null;
  dragStartTimeoutId: NodeJS.Timeout;
  _isDragging: boolean = false;

  constructor(dataGrid: BeakerXDataGrid) {
    this.dataGrid = dataGrid;
    this.store = dataGrid.store;
    this.draggableHeaderCanvas = document.createElement('canvas');
    this.draggableHeaderCanvas.classList.add('bko-dragged-header');
    this.moveDraggedHeader = this.moveDraggedHeader.bind(this);
  }

  destroy() {
    this.draggableHeaderCanvas.remove();

    setTimeout(() => {
      this.dataGrid = null;
      this.store = null;
      this.grabbedCellData = null;
      this.dropCellData = null;
      this.draggableHeaderCanvas = null;
    });
  }

  startDragging(data: ICellData) {
    this._isDragging = true;
    this.handleDragStart(data);
  }

  stopDragging() {
    if (!this.isDragging()) {
      return clearTimeout(this.dragStartTimeoutId);
    }

    this.dataGrid.cellHovered.disconnect(this.handleCellHovered, this);
    this.grabbedCellData = null;
    this.dropCellData = null;
    this.toggleGrabbing(false);
    this.dataGrid.node.contains(this.draggableHeaderCanvas) &&
      this.dataGrid.node.removeChild(this.draggableHeaderCanvas);
    this.dataGrid.repaintBody();
    this.draggableHeaderOffsetLeft = null;
    this._isDragging = false;
  }

  isDragging() {
    return this._isDragging;
  }

  reset() {
    let order = this.store.selectColumnOrder();

    if (!order || !order.length) {
      order = this.store.selectColumnNames();
    }

    this.store.dispatch(
      new DataGridColumnsAction(UPDATE_COLUMN_POSITIONS, {
        value: order,
        hasIndex: this.store.selectHasIndex(),
        columnsFrozenNames: this.store.selectColumnsFrozenNames(),
        columnsVisible: this.store.selectColumnsVisible(),
      }),
    );

    this.dataGrid.resize();
    this.dataGrid.dataModel.reset();
  }

  getColumnByPosition(position: IColumnPosition) {
    const columnIndex = this.store.selectColumnIndexByPosition(position);
    const columnType =
      position.region === 'row-header' && position.value === 0 ? COLUMN_TYPES.index : COLUMN_TYPES.body;

    return this.dataGrid.columnManager.getColumnByIndex(columnType, columnIndex);
  }

  dropColumn() {
    if (!this.grabbedCellData || !this.dropCellData) {
      return this.stopDragging();
    }

    this.moveColumn();
    this.stopDragging();
  }

  setPosition(column: DataGridColumn, position: IColumnPosition) {
    this.store.dispatch(
      new DataGridColumnAction(UPDATE_COLUMN_ORDER, {
        value: position,
        columnType: column.type,
        columnName: column.name,
        columnIndex: column.index,
        hasIndex: this.store.selectHasIndex(),
      }),
    );

    this.updateAll();
  }

  updateAll() {
    let order = this.store.selectColumnOrder();

    if (!order || !order.length) {
      order = this.store.selectColumnNames();
    }

    this.store.dispatch(
      new DataGridColumnsAction(UPDATE_COLUMN_POSITIONS, {
        value: order,
        hasIndex: this.store.selectHasIndex(),
        columnsFrozenNames: this.store.selectColumnsFrozenNames(),
        columnsVisible: this.store.selectColumnsVisible(),
      }),
    );

    this.dataGrid.resize();
  }

  moveDraggedHeader(event: MouseEvent) {
    if (!this.isDragging()) {
      return true;
    }

    const rect = this.dataGrid.viewport.node.getBoundingClientRect();
    let newX = event.clientX - rect.left;
    const newY = event.clientY - rect.top;

    if (this.draggableHeaderOffsetLeft !== null) {
      newX -= this.draggableHeaderOffsetLeft;
    }

    this.draggableHeaderCanvas.style.left = `${newX}px`;
    this.draggableHeaderCanvas.style.top = `${newY}px`;
  }

  private handleDragStart(data) {
    this.dataGrid.cellHovered.connect(this.handleCellHovered, this);
    this.grabbedCellData = data;
    this.toggleGrabbing(true);
    this.attachDraggableHeader(data);
  }

  private moveColumn() {
    const frozenColumnscount = this.store.selectColumnsFrozenCount();
    const column = this.dataGrid.columnManager.getColumnByPosition(
      ColumnManager.createPositionFromCell(this.grabbedCellData),
    );
    let destination = this.dropCellData.column;

    if (this.dropCellData.region !== 'corner-header' && this.dropCellData.region !== 'row-header') {
      destination += frozenColumnscount;
    }

    this.setPosition(column, ColumnManager.createPositionFromCell({ ...this.dropCellData, column: destination }));
  }

  private toggleGrabbing(enable: boolean) {
    enable ? this.dataGrid.node.classList.add('grabbing') : this.dataGrid.node.classList.remove('grabbing');
  }

  private attachDraggableHeader(data) {
    const widthSection =
      data.region === 'corner-header' ? this.dataGrid.getRowHeaderSections() : this.dataGrid.getColumnSections();
    const sectionWidth = widthSection.sizeOf(data.column) - 1;
    const sectionHeight = this.dataGrid.getColumnHeaderSections().sizeOf(data.row) - 1;
    const dpiRatio = this.dataGrid['_dpiRatio'];

    this.draggableHeaderCanvas.width = sectionWidth * dpiRatio;
    this.draggableHeaderCanvas.height = sectionHeight * dpiRatio;
    this.draggableHeaderCanvas.style.width = `${sectionWidth}px`;
    this.draggableHeaderCanvas.style.height = `${sectionHeight}px`;
    this.draggableHeaderCanvas.style.border = `1px solid ${DataGridStyle.DEFAULT_BORDER_COLOR}`;
    this.draggableHeaderCanvas.style.left = `${data.offset + DATA_GRID_PADDING}px`;
    this.draggableHeaderCanvas.style.top = `${DATA_GRID_PADDING}px`;

    const ctx = this.draggableHeaderCanvas.getContext('2d');

    ctx.scale(dpiRatio, dpiRatio);
    ctx.drawImage(
      this.dataGrid['_canvas'],
      data.offset * dpiRatio,
      0,
      sectionWidth * dpiRatio,
      sectionHeight * dpiRatio,
      0,
      0,
      sectionWidth,
      sectionHeight,
    );

    this.draggableHeaderOffsetLeft = data.delta - DATA_GRID_PADDING;
    this.dataGrid.node.appendChild(this.draggableHeaderCanvas);
  }

  private handleCellHovered(sender: BeakerXDataGrid, { data, event }) {
    const pressData = this.grabbedCellData;
    let targetData = data;

    if (!data || !pressData || pressData.type !== data.type) {
      return true;
    }

    const direction = data.column >= this.grabbedCellData.column ? COLUMN_SIDE.right : COLUMN_SIDE.left;
    const side = data.delta < data.width / 2 ? COLUMN_SIDE.left : COLUMN_SIDE.right;

    if (side === COLUMN_SIDE.right && direction !== COLUMN_SIDE.right) {
      targetData = this.dataGrid.getCellData(event.clientX + data.width - data.delta + 1, event.clientY);
    } else if (side === COLUMN_SIDE.left && direction === COLUMN_SIDE.right) {
      targetData = this.dataGrid.getCellData(event.clientX - data.delta - 1, event.clientY);
    }

    this.dropCellData = targetData;
    this.dataGrid.repaintBody();
  }
}
