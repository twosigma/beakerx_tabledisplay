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

import { BasicMouseHandler, BasicKeyHandler } from '@lumino/datagrid';
import { BeakerXDataGrid } from '../BeakerXDataGrid';
import { CellManager } from '../cell/CellManager';
import { ColumnManager } from '../column/ColumnManager';
import { DataGridColumn } from '../column/DataGridColumn';
import { COLUMN_TYPES } from '../column/enums';
import { DataGridHelpers } from '../Helpers';
import { ICellData } from '../interface/ICell';
import { HIGHLIGHTER_TYPE } from '../interface/IHighlighterState';
import { KEYBOARD_KEYS } from './enums';
import { EventHelpers } from './EventHelpers';
import { DoubleClickMessage } from '../message/DoubleClickMessage';
import { ActionDetailsMessage } from '../message/ActionDetailsMessage';

const COLUMN_RESIZE_AREA_WIDTH = 4;


export
class MouseEventManager extends BasicMouseHandler {

  cellHoverControl = { timerId: undefined };

  constructor(grid: BeakerXDataGrid) {
    super();

    this.grid = grid;

    this.handleMouseMove = (event: MouseEvent) => {
      return this.onMouseMove(this.grid, event);
    };
    this.handleMouseLeave = (event: MouseEvent) => {
      return this.onMouseLeave(this.grid, event);
    };
    this.handleMouseDown = (event: MouseEvent) => {
      return this.onMouseDown(this.grid, event);
    };

    // We need a better approach for the following event listeners, maybe upstream the resizing?
    // This is needed for changing the cursor to a resize icon
    this.grid.node.addEventListener('mousemove', this.handleMouseMove);
    // This is needed for setting the cursor back to normal
    this.grid.node.addEventListener('mouseout', this.handleMouseLeave);
    // This is needed for starting the resize
    this.grid.tableDisplayView.el.addEventListener('mousedown', this.handleMouseDown);
  }

  get isResizingHeader () {
    return this.pressData !== null && (this.pressData.type == 'column-resize' || this.pressData.type == 'row-resize');
  }

  dispose(): void {
    // Bail early if the handler is already disposed.
    if (this.isDisposed) {
      return;
    }

    this.clearReferences();

    this.grid.node.removeEventListener('mousemove', this.handleMouseMove);
    this.grid.node.removeEventListener('mousemove', this.handleMouseLeave);
    this.grid.tableDisplayView.el.removeEventListener('mousedown', this.handleMouseDown);

    super.dispose();
  }

  onMouseUp(grid: BeakerXDataGrid, event: MouseEvent) {
    if (grid.dataGridResize.isResizing()) {
      return grid.dataGridResize.stopResizing();
    }

    if (!this.isResizingHeader) {
      grid.cellSelectionManager.handleMouseUp(event);
      this.handleHeaderClick(grid, event);
      this.handleBodyClick(grid, event);
      grid.columnPosition.dropColumn();
    }

    // Call super in the end, this will release and clean pressData
    super.onMouseUp(grid, event);
  }

  onMouseMove(grid: BeakerXDataGrid, event: MouseEvent): void {
    if (grid.dataGridResize.isResizing()) {
      return;
    }

    super.onMouseMove(grid, event);

    if (event.buttons !== 1) {
      grid.columnPosition.stopDragging();
    }

    if (!grid.dataGridResize.isResizing()) {
      grid.dataGridResize.setResizeMode(event);
    }

    if (grid.dataGridResize.isResizing() || this.isOutsideViewport(grid, event)) {
      return;
    }

    grid.columnPosition.moveDraggedHeader(event);
    this.onMouseHover(grid, event);
  }

  onMouseHover(grid: BeakerXDataGrid, event: MouseEvent) {
    super.onMouseHover(grid, event);

    const data = grid.getCellData(event.clientX, event.clientY);

    if (data === null) {
      return;
    }

    grid.cellHovered.emit({ data, event });

    if (!grid.columnPosition.isDragging()) {
      grid.cellSelectionManager.handleBodyCellHover(event);
    }
  }

  onMouseDown(grid: BeakerXDataGrid, event: MouseEvent): void {
    super.onMouseDown(grid, event);

    // Return now if it's a row/column resize handled by the superclass
    if (this.isResizingHeader) {
      return;
    }

    if (!this.isHeaderClicked(grid, event) &&  grid.dataGridResize.shouldResizeDataGrid(event)) {
      return grid.dataGridResize.startResizing(event);
    }

    this.handleStartDragging(grid, event);

    if (!grid.columnPosition.isDragging()) {
      grid.cellSelectionManager.handleMouseDown(event);
    }
  }

  onMouseLeave(grid: BeakerXDataGrid, event: MouseEvent): void {
    if (this.isNodeInsideGrid(grid, event) || event.buttons !== 0) {
      return;
    }

    clearTimeout(this.cellHoverControl.timerId);

    grid.cellTooltipManager.hideTooltips();
    grid.cellHovered.emit({ data: null, event: event });
    grid.dataGridResize.setCursorStyle('auto');

    grid.columnPosition.stopDragging();
    grid.setFocus(false);
  }

  onMouseDoubleClick(grid: BeakerXDataGrid, event: MouseEvent) {
    if (this.isOverHeader(grid, event)) {
      return;
    }

    const data = grid.getCellData(event.clientX, event.clientY);

    if (!data || data.type === COLUMN_TYPES.index) {
      return;
    }

    const row = this.getRowIndex(grid, data.row);
    if (grid.store.selectHasDoubleClickAction()) {
      grid.commSignal.emit(new DoubleClickMessage(row, data.column));
    }

    if (grid.store.selectDoubleClickTag()) {
      grid.commSignal.emit(new ActionDetailsMessage('DOUBLE_CLICK', row, data.column));
    }
  }

  isOverHeader(grid: BeakerXDataGrid, event: MouseEvent) {
    const rect = grid.viewport.node.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    return x < grid.bodyWidth + grid.getRowHeaderSections().length && y < grid.headerHeight;
  }

  private handleHeaderClick(grid: BeakerXDataGrid, event: MouseEvent): void {
    if (!this.isHeaderClicked(grid, event) || grid.columnPosition.dropCellData) {
      return;
    }

    const data = grid.getCellData(event.clientX, event.clientY);

    if (!data) {
      return;
    }

    const destColumn = grid.columnManager.getColumnByPosition(ColumnManager.createPositionFromCell(data));

    destColumn.toggleSort();
  }

  private isHeaderClicked(grid: BeakerXDataGrid, event) {
    return this.isOverHeader(grid, event) && event.button === 0;
  }

  private handleBodyClick(grid: BeakerXDataGrid, event: MouseEvent) {
    if (this.isOverHeader(grid, event) || grid.columnPosition.isDragging()) {
      return;
    }

    const cellData = grid.getCellData(event.clientX, event.clientY);
    const hoveredCellData = grid.cellManager.hoveredCellData;

    if (!cellData || !hoveredCellData || !CellManager.cellsEqual(cellData, hoveredCellData)) {
      return;
    }

    if (!grid.store.selectAutoLinkTableLinks()) {
      return;
    }

    const url = DataGridHelpers.retrieveUrl(hoveredCellData.value);
    url && window.open(url);
  }

  private handleStartDragging(grid: BeakerXDataGrid, event: MouseEvent) {
    const data = grid.getCellData(event.clientX, event.clientY);

    if (
      !data ||
      !this.isHeaderClicked(grid, event) ||
      (data.region === 'corner-header' && data.column === 0) ||
      data.width - data.delta < COLUMN_RESIZE_AREA_WIDTH
    ) {
      return;
    }

    grid.columnPosition.startDragging(data);
  }

  private isOutsideViewport(grid: BeakerXDataGrid, event: MouseEvent) {
    return EventHelpers.isOutsideNode(event, grid.viewport.node);
  }

  private isNodeInsideGrid(grid: BeakerXDataGrid, event: MouseEvent) {
    return EventHelpers.isInsideGridNode(event, grid.node);
  }

  private getRowIndex(grid: BeakerXDataGrid, renderedRowIndex: number): number {
    return grid.rowManager.rows[renderedRowIndex].index;
  }

  private clearReferences() {
    setTimeout(() => {
      this.cellHoverControl = null;
    });
  }

  private handleMouseMove: (event: MouseEvent) => void;
  private handleMouseLeave: (event: MouseEvent) => void;
  private handleMouseDown: (event: MouseEvent) => void;
  private grid: BeakerXDataGrid;
}

export
class KeyEventManager extends BasicKeyHandler {

  onKeyDown(grid: BeakerXDataGrid, event: KeyboardEvent): void {
    const focusedCell = grid.cellFocusManager.focusedCellData;
    const column: DataGridColumn | null = focusedCell && grid.columnManager.takeColumnByCell(focusedCell);
    const code = DataGridHelpers.getEventKeyCode(event);

    if (!code) {
      return;
    }

    // Prevent propagation
    event.stopPropagation();
    event.preventDefault();

    this.handleEnterKeyDown(grid, code, event.shiftKey, focusedCell);
    this.handleHighlighterKeyDown(code, column);
    this.handleNumKeyDown(grid, code, event.shiftKey, column);
    this.handleNavigationKeyDown(grid, code, event);
  }

  private handleHighlighterKeyDown(code: number, column: DataGridColumn | null) {
    switch (code) {
      case KEYBOARD_KEYS.KeyH:
        column && column.toggleHighlighter(HIGHLIGHTER_TYPE.heatmap);
        break;
      case KEYBOARD_KEYS.KeyU:
        column && column.toggleHighlighter(HIGHLIGHTER_TYPE.uniqueEntries);
        break;
      case KEYBOARD_KEYS.KeyB:
        column && column.toggleDataBarsRenderer();
        break;
    }
  }

  private handleEnterKeyDown(grid: BeakerXDataGrid, code: number, shiftKey: boolean, cellData: ICellData) {
    if (code !== KEYBOARD_KEYS.Enter || !cellData) {
      return;
    }

    if (!shiftKey || !grid.cellSelectionManager.startCellData) {
      grid.cellSelectionManager.setStartCell(cellData);
    }

    grid.cellSelectionManager.handleCellInteraction(cellData);
  }

  private handleNavigationKeyDown(grid: BeakerXDataGrid, code: number, event: KeyboardEvent) {
    const navigationKeyCodes = [
      KEYBOARD_KEYS.ArrowLeft,
      KEYBOARD_KEYS.ArrowRight,
      KEYBOARD_KEYS.ArrowDown,
      KEYBOARD_KEYS.ArrowUp,
      KEYBOARD_KEYS.PageUp,
      KEYBOARD_KEYS.PageDown,
    ];
    if (-1 === navigationKeyCodes.indexOf(code)) {
      return;
    }

    if (grid.cellFocusManager.focusedCellData) {
      grid.cellFocusManager.setFocusedCellByNavigationKey(code);
    } else if (code === KEYBOARD_KEYS.PageDown || code === KEYBOARD_KEYS.PageUp) {
      grid.scrollByPage(code === KEYBOARD_KEYS.PageUp ? 'up' : 'down');
    }

    if (event.shiftKey) {
      grid.cellSelectionManager.setEndCell(grid.cellFocusManager.focusedCellData);
    }
  }

  private handleNumKeyDown(grid: BeakerXDataGrid, code: number, shiftKey: boolean, column: DataGridColumn | null) {
    if (code < KEYBOARD_KEYS.Digit0 || code > KEYBOARD_KEYS.Digit9) {
      return;
    }

    const number = parseInt(String.fromCharCode(code));

    if (shiftKey && column) {
      return column.setDataTypePrecision(number);
    }

    grid.columnManager.setColumnsDataTypePrecission(number);
  }

}
