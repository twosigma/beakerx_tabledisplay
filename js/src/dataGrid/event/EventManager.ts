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

import { DataGrid } from '@lumino/datagrid';
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
class EventManager implements DataGrid.IMouseHandler, DataGrid.IKeyHandler {

  cellHoverControl = { timerId: undefined };

  get isDisposed(): boolean {
    return this._disposed;
  }

  dispose(): void {
    // Bail early if the handler is already disposed.
    if (this._disposed) {
      return;
    }

    this.clearReferences();

    // Mark the handler as disposed.
    this._disposed = true;
  }

  release(): void {
    //
  }

  // handleMouseMoveOutsideArea(event: MouseEvent) {
  //   if (this.isOutsideViewport(event)) {
  //     clearTimeout(this.cellHoverControl.timerId);
  //     this.dataGrid.cellTooltipManager.hideTooltips();
  //   }

  //   if (this.isOutsideGrid(event)) {
  //     this.dataGrid.cellHovered.emit({ data: null, event: event });
  //     this.dataGrid.dataGridResize.setCursorStyle('auto');
  //   }
  // }

  // private handleSelectStart(event) {
  //   const target = event.target as HTMLElement;

  //   if (target && target.classList.contains('filter-input')) {
  //     return true;
  //   }

  //   return false;
  // }

  // private handleScrollBarMouseUp(event: MouseEvent) {
  //   document.removeEventListener('mouseup', this.handleScrollBarMouseUp, true);

  //   if (!this.isNodeInsideGrid(event)) {
  //     this.dataGrid.setFocus(false);
  //   }
  // }

  // private handleWindowResize() {
  //   this.dataGrid.resize();
  // }

  onMouseUp(grid: BeakerXDataGrid, event: MouseEvent) {
    if (grid.dataGridResize.isResizing()) {
      return grid.dataGridResize.stopResizing();
    }

    grid.cellSelectionManager.handleMouseUp(event);
    this.handleHeaderClick(grid, event);
    this.handleBodyClick(grid, event);
    grid.columnPosition.dropColumn();
  }

  onMouseMove(grid: BeakerXDataGrid, event: MouseEvent): void {
    if (grid.dataGridResize.isResizing()) {
      return;
    }

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
    // Do we need this?
    // this.handleCellHover(grid, event);
  }

  // private isOutsideGrid(event) {
  //   return !EventHelpers.isInsideGrid(event);
  // }

  onMouseHover(grid: BeakerXDataGrid, event) {
    const data = grid.getCellData(event.clientX, event.clientY);

    if (data === null) {
      return;
    }

    grid.cellHovered.emit({ data, event });
    grid.cellSelectionManager.handleBodyCellHover(event);
  }

  onMouseDown(grid: BeakerXDataGrid, event: MouseEvent): void {
    if (event.buttons !== 1) {
      return;
    }

    !grid.focused && grid.setFocus(true);

    if (!this.isHeaderClicked(grid, event) && grid.dataGridResize.shouldResizeDataGrid(event)) {
      return grid.dataGridResize.startResizing(event);
    }

    if (this.isOutsideViewport(grid, event)) {
      return;
    }

    grid.cellSelectionManager.handleMouseDown(event);
    this.handleStartDragging(grid, event);
  }

  onMouseLeave(grid: BeakerXDataGrid, event: MouseEvent): void {
    if (this.isNodeInsideGrid(grid, event) || event.buttons !== 0) {
      return;
    }

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

  onContextMenu(grid: DataGrid, event: MouseEvent): void {}

  onWheel(grid: BeakerXDataGrid, event: WheelEvent) {
    if (!grid.focused) {
      return;
    }

    // Extract the delta X and Y movement.
    let dx = event.deltaX;
    let dy = event.deltaY;

    // Convert the delta values to pixel values.
    switch (event.deltaMode) {
    case 0:  // DOM_DELTA_PIXEL
      break;
    case 1:  // DOM_DELTA_LINE
      const ds = grid.defaultSizes;
      dx *= ds.columnWidth;
      dy *= ds.rowHeight;
      break;
    case 2:  // DOM_DELTA_PAGE
      dx *= grid.pageWidth;
      dy *= grid.pageHeight;
      break;
    default:
      throw 'unreachable';
    }

    // Scroll by the desired amount.
    grid.scrollBy(dx, dy);
  }

  onKeyDown(grid: BeakerXDataGrid, event: KeyboardEvent): void {
    const focusedCell = grid.cellFocusManager.focusedCellData;
    const column: DataGridColumn | null = focusedCell && grid.columnManager.takeColumnByCell(focusedCell);
    const code = DataGridHelpers.getEventKeyCode(event);

    if (!code) {
      return;
    }

    this.handleEnterKeyDown(grid, code, event.shiftKey, focusedCell);
    this.handleHighlighterKeyDown(code, column);
    this.handleNumKeyDown(grid, code, event.shiftKey, column);
    this.handleNavigationKeyDown(grid, code, event);
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
    return this.isOverHeader(grid, event) && event.button === 0 && event.target === grid['_canvas'];
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

  private isNodeInsideGrid(grid: BeakerXDataGrid, event: MouseEvent) {
    return EventHelpers.isInsideGridNode(event, grid.node);
  }

  private isOutsideViewport(grid: BeakerXDataGrid, event: MouseEvent) {
    return EventHelpers.isOutsideNode(event, grid.viewport.node);
  }

  private getRowIndex(grid: BeakerXDataGrid, renderedRowIndex: number): number {
    return grid.rowManager.rows[renderedRowIndex].index;
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

  private clearReferences() {
    setTimeout(() => {
      this.cellHoverControl = null;
    });
  }

  private isOverHeader(grid: BeakerXDataGrid, event: MouseEvent) {
    const rect = grid.viewport.node.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    return x < grid.bodyWidth + grid.getRowHeaderSections().length && y < grid.headerHeight;
  }

  private _disposed = false;
}
