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
import { BeakerXDataStore } from '../store/BeakerXDataStore';
import { KEYBOARD_KEYS } from './enums';
import { EventHelpers } from './EventHelpers';
import { DoubleClickMessage } from '../message/DoubleClickMessage';
import { ActionDetailsMessage } from '../message/ActionDetailsMessage';

const COLUMN_RESIZE_AREA_WIDTH = 4;


export
class EventManager implements DataGrid.IMouseHandler, DataGrid.IKeyHandler {

  // dataGrid: BeakerXDataGrid;
  store: BeakerXDataStore;
  cellHoverControl = { timerId: undefined };

  constructor(grid: BeakerXDataGrid) {
    this.store = grid.store;
    // this.dataGrid = dataGrid;

    // this.handleEvent = this.handleEvent.bind(this);
    // this.handleKeyDown = this.handleKeyDown.bind(this);
    // this.handleMouseOut = this.handleMouseOut.bind(this);
    // this.handleMouseDown = this.handleMouseDown.bind(this);
    // this.handleDoubleClick = this.handleDoubleClick.bind(this);
    // this.handleHeaderClick = this.handleHeaderClick.bind(this);
    // this.handleBodyClick = this.handleBodyClick.bind(this);
    // this.handleMouseUp = this.handleMouseUp.bind(this);
    // this.handleMouseMove = this.handleMouseMove.bind(this);
    // this.handleScrollBarMouseUp = this.handleScrollBarMouseUp.bind(this);
    // this.handleCellHover = DataGridHelpers.throttle<MouseEvent, void>(
    //   this.handleCellHover,
    //   100,
    //   this,
    //   this.cellHoverControl,
    // );
    // this.handleMouseMoveOutsideArea = DataGridHelpers.throttle<MouseEvent, void>(
    //   this.handleMouseMoveOutsideArea,
    //   100,
    //   this,
    // );
    // this.handleWindowResize = DataGridHelpers.throttle<Event, void>(this.handleWindowResize, 200, this);

    // this.dataGrid.node.addEventListener('selectstart', this.handleSelectStart);
    // this.dataGrid.node.addEventListener('mouseout', this.handleMouseOut);
    // this.dataGrid.node.addEventListener('dblclick', this.handleDoubleClick, true);
    // this.dataGrid.node.addEventListener('mouseup', this.handleMouseUp);
    // this.dataGrid.node.addEventListener('mousemove', this.handleMouseMove);

    // this.dataGrid['_vScrollBar'].node.addEventListener('mousedown', this.handleMouseDown);
    // this.dataGrid['_hScrollBar'].node.addEventListener('mousedown', this.handleMouseDown);
    // this.dataGrid['_scrollCorner'].node.addEventListener('mousedown', this.handleMouseDown);

    // document.addEventListener('mousemove', this.handleMouseMoveOutsideArea);
    // document.addEventListener('keydown', this.handleKeyDown, true);

    // window.addEventListener('resize', this.handleWindowResize);
  }

  // handleEvent(event: Event, parentHandler: (event: MouseEvent) => void): void {
  //   switch (event.type) {
  //     case 'mousedown':
  //       this.handleMouseDown(event as MouseEvent);
  //       break;
  //     case 'wheel':
  //       this.handleMouseWheel(event as MouseEvent, parentHandler);
  //       return;
  //   }

  //   parentHandler.call(this.dataGrid, event);
  // }

  private isOverHeader(grid: BeakerXDataGrid, event: MouseEvent) {
    const rect = grid.viewport.node.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    return x < grid.bodyWidth + grid.getRowHeaderSections().length && y < grid.headerHeight;
  }

  dispose(): void {
    // Bail early if the handler is already disposed.
    if (this._disposed) {
      return;
    }

    this.removeEventListeners();
    this.clearReferences();

    // Mark the handler as disposed.
    this._disposed = true;
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

  private handleSelectStart(event) {
    const target = event.target as HTMLElement;

    if (target && target.classList.contains('filter-input')) {
      return true;
    }

    return false;
  }

  private handleScrollBarMouseUp(event: MouseEvent) {
    document.removeEventListener('mouseup', this.handleScrollBarMouseUp, true);

    if (!this.isNodeInsideGrid(event)) {
      this.dataGrid.setFocus(false);
    }
  }

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
    this.dropColumn(grid);
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

    if (!this.store.selectAutoLinkTableLinks()) {
      return;
    }

    const url = DataGridHelpers.retrieveUrl(hoveredCellData.value);
    url && window.open(url);
  }

  private dropColumn(grid: BeakerXDataGrid) {
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

  private isOutsideViewport(grid: BeakerXDataGrid, event: MouseEvent) {
    return EventHelpers.isOutsideNode(event, grid.viewport.node);
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

  onMouseLeave(grid: BeakerXDataGrid, event: MouseEvent): void {
    if (this.isNodeInsideGrid(grid, event) || event.buttons !== 0) {
      return;
    }

    grid.columnPosition.stopDragging();
    grid.setFocus(false);
  }

  private isNodeInsideGrid(grid: BeakerXDataGrid, event: MouseEvent) {
    return EventHelpers.isInsideGridNode(event, grid.node);
  }

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

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.dataGrid.focused || event.target instanceof HTMLInputElement) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const focusedCell = this.dataGrid.cellFocusManager.focusedCellData;
    const column: DataGridColumn | null = focusedCell && this.dataGrid.columnManager.takeColumnByCell(focusedCell);
    const code = DataGridHelpers.getEventKeyCode(event);

    if (!code) {
      return;
    }

    this.handleEnterKeyDown(code, event.shiftKey, focusedCell);
    this.handleHighlighterKeyDown(code, column);
    this.handleNumKeyDown(code, event.shiftKey, column);
    this.handleNavigationKeyDown(code, event);
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

  private handleEnterKeyDown(code: number, shiftKey: boolean, cellData: ICellData) {
    if (code !== KEYBOARD_KEYS.Enter || !cellData) {
      return;
    }

    if (!shiftKey || !this.dataGrid.cellSelectionManager.startCellData) {
      this.dataGrid.cellSelectionManager.setStartCell(cellData);
    }

    this.dataGrid.cellSelectionManager.handleCellInteraction(cellData);
  }

  private handleNavigationKeyDown(code: number, event: KeyboardEvent) {
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

    if (this.dataGrid.cellFocusManager.focusedCellData) {
      this.dataGrid.cellFocusManager.setFocusedCellByNavigationKey(code);
    } else if (code === KEYBOARD_KEYS.PageDown || code === KEYBOARD_KEYS.PageUp) {
      this.dataGrid.scrollByPage(code === KEYBOARD_KEYS.PageUp ? 'up' : 'down');
    }

    if (event.shiftKey) {
      this.dataGrid.cellSelectionManager.setEndCell(this.dataGrid.cellFocusManager.focusedCellData);
    }
  }

  private handleNumKeyDown(code: number, shiftKey: boolean, column: DataGridColumn | null) {
    if (code < KEYBOARD_KEYS.Digit0 || code > KEYBOARD_KEYS.Digit9) {
      return;
    }

    const number = parseInt(String.fromCharCode(code));

    if (shiftKey && column) {
      return column.setDataTypePrecision(number);
    }

    this.dataGrid.columnManager.setColumnsDataTypePrecission(number);
  }

  private handleDoubleClick(event: MouseEvent) {
    event.stopImmediatePropagation();
    event.preventDefault();

    if (this.isOverHeader(event)) {
      return;
    }

    const data = this.dataGrid.getCellData(event.clientX, event.clientY);

    if (!data || data.type === COLUMN_TYPES.index) {
      return;
    }

    const row = this.getRowIndex(data.row);
    if (this.store.selectHasDoubleClickAction()) {
      this.dataGrid.commSignal.emit(new DoubleClickMessage(row, data.column));
    }

    if (this.store.selectDoubleClickTag()) {
      this.dataGrid.commSignal.emit(new ActionDetailsMessage('DOUBLE_CLICK', row, data.column));
    }
  }

  private removeEventListeners() {
    this.dataGrid.node.removeEventListener('selectstart', this.handleSelectStart);
    this.dataGrid.node.removeEventListener('mouseout', this.handleMouseOut);
    this.dataGrid.node.removeEventListener('dblclick', this.handleDoubleClick, true);
    this.dataGrid.node.removeEventListener('mouseup', this.handleMouseUp);
    this.dataGrid.node.removeEventListener('mousemove', this.handleMouseMove);

    this.dataGrid['_vScrollBar'].node.removeEventListener('mousedown', this.handleMouseDown);
    this.dataGrid['_hScrollBar'].node.removeEventListener('mousedown', this.handleMouseDown);
    this.dataGrid['_scrollCorner'].node.removeEventListener('mousedown', this.handleMouseDown);

    document.removeEventListener('mousemove', this.handleMouseMoveOutsideArea);
    document.removeEventListener('keydown', this.handleKeyDown, true);

    window.removeEventListener('resize', this.handleWindowResize);
  }

  private clearReferences() {
    setTimeout(() => {
      this.dataGrid = null;
      this.store = null;
      this.cellHoverControl = null;
    });
  }

  /**
   * Return row index of unsorted/unfiltered dataGrid
   * @param renderedRowIndex - row-index of rendered dataGrid, either with applied search/filters or without.
   */
  private getRowIndex(renderedRowIndex: number): number {
    return this.dataGrid.rowManager.rows[renderedRowIndex].index;
  }

  private _disposed = false;
}
