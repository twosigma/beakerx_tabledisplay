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

import { DataModel } from '@lumino/datagrid';
import { MessageLoop } from '@lumino/messaging';
import { ResizeObserver } from 'resize-observer';
import { BeakerXDataGrid } from './BeakerXDataGrid';
import { DataGridColumn } from './column/DataGridColumn';
import { ALL_TYPES } from './dataTypes';
import { DataGridHelpers } from './Helpers';
import { DataGridStyle } from './style/DataGridStyle';

const DEFAULT_RESIZE_SECTION_SIZE_IN_PX = 6;
const DEFAULT_ROW_PADDING = 4;

export class DataGridResize {
  dataGrid: BeakerXDataGrid;
  resizeStartRect: { width: number; height: number; x: number; y: number };
  resizeMode: 'h' | 'v' | 'both' | null;
  resizing = false;
  resizedHorizontally = false;
  private maxWidth = 0;

  constructor(dataGrid: BeakerXDataGrid) {
    this.dataGrid = dataGrid;

    this.setSectionWidth = this.setSectionWidth.bind(this);
    this.updateColumnWidth = this.updateColumnWidth.bind(this);
    this.setInitialSectionWidth = this.setInitialSectionWidth.bind(this);
    this.resizeSectionWidth = this.resizeSectionWidth.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.fillEmptySpaceResizeFn = this.fillEmptySpaceResizeFn.bind(this);
    this.fitViewport = this.fitViewport.bind(this);

    this.installMessageHook();
  }

  destroy(): void {
    this.dataGrid = null;
  }

  setInitialSize(): void {
    this.setBaseColumnSize();
    this.setBaseRowSize();
    this.resizeHeader();
    this.updateWidgetHeight();
    this.setInitialSectionWidths();
    this.resizeSections();
    this.updateWidgetWidth();
  }

  resize(): void {
    this.updateWidgetHeight();
    this.resizeHeader();
    this.resizeSections();
    this.updateWidgetWidth();
    this.dataGrid.columnManager.updateColumnFilterNodes();
    this.dataGrid.columnManager.updateColumnMenuTriggers();
  }

  updateWidgetHeight(hasHScroll: boolean = this.dataGrid.getHScrollBar().isVisible): void {
    const bodyRowCount = this.dataGrid.dataModel.rowCount('body');
    const rowsToShow = this.dataGrid.rowManager.rowsToShow;
    const rowCount = rowsToShow < bodyRowCount && rowsToShow !== -1 ? rowsToShow : bodyRowCount;
    const scrollBarHeight = hasHScroll ? this.dataGrid['_hScrollBarMinHeight'] : 0;
    const spacing = 2 * DataGridStyle.DEFAULT_GRID_PADDING;
    let height = 0;

    for (let i = 0; i < rowCount; i += 1) {
      height += this.dataGrid.getRowSections().sizeOf(i);
    }

    height += this.dataGrid.headerHeight + spacing + scrollBarHeight;

    this.dataGrid.node.style.minHeight = `${height}px`;
    this.fitViewport();
  }

  updateWidgetWidth(hasVScroll: boolean = this.dataGrid.getVScrollBar().isVisible): void {
    if (this.maxWidth === 0) {
      return;
    }

    const bodyColumnCount = this.dataGrid.dataModel.columnCount('body');
    const scrollBarWidth = hasVScroll ? this.dataGrid['_vScrollBarMinWidth'] : 0;
    const spacing = 2 * DataGridStyle.DEFAULT_GRID_PADDING;
    let width = 0;

    for (let i = 0; i < bodyColumnCount; i += 1) {
      width += this.dataGrid.getColumnSections().sizeOf(i);
    }

    width += this.dataGrid.headerWidth + spacing + scrollBarWidth;

    if (this.maxWidth && width >= this.maxWidth) {
      this.dataGrid.node.style.width = `${this.maxWidth}px`;
      this.fitViewport();

      return;
    }

    this.dataGrid.node.style.width = `${width}px`;
    this.fitViewport();
  }

  setInitialSectionWidths(): void {
    for (let index = this.dataGrid.getColumnSections().count - 1; index >= 0; index--) {
      this.setInitialSectionWidth({ index }, 'body');
    }

    for (let index = this.dataGrid.getRowHeaderSections().count - 1; index >= 0; index--) {
      this.setInitialSectionWidth({ index }, 'row-header');
    }
  }

  setInitialSectionWidth(section, region: DataModel.ColumnRegion): void {
    const column = this.dataGrid.columnPosition.getColumnByPosition({ region, value: section.index });
    const area = region === 'row-header' ? 'row-header' : 'column';

    this.setSectionWidth(area, column, this.getSectionWidth(column));
  }

  fillEmptyDataGridSpace() {
    const space =
      this.dataGrid.node.clientWidth -
      this.dataGrid.totalWidth -
      2 * DataGridStyle.DEFAULT_GRID_PADDING -
      this.dataGrid.getVScrollBar().node.clientWidth;
    const value = Math.round(
      space / (this.dataGrid.getColumnSections().count + this.dataGrid.getRowHeaderSections().count),
    );

    this.dataGrid.getColumnSections()['_sections'].forEach(this.fillEmptySpaceResizeFn('body', value));
    this.dataGrid.getRowHeaderSections()['_sections'].forEach(this.fillEmptySpaceResizeFn('row-header', value));

    this.fitViewport();
  }

  updateColumnWidth(region: DataModel.ColumnRegion): ({ index, size }) => void {
    return ({ index, size }) => {
      const columnOnPosition = this.dataGrid.columnManager.getColumnByPosition({ region, value: index });

      columnOnPosition.setWidth(size);
    };
  }

  startResizing(event: MouseEvent) {
    if (!this.dataGrid.node.parentElement) {
      return;
    }

    const width = this.dataGrid.viewport.node.clientWidth + this.dataGrid.getVScrollBar().node.clientWidth + 3;
    const height = this.dataGrid.viewport.node.clientHeight + this.dataGrid.getHScrollBar().node.clientHeight + 3;

    this.resizeStartRect = { width, height, x: event.clientX, y: event.clientY };
    this.resizing = true;

    this.dataGrid.node.parentElement.addEventListener('mouseup', this.handleMouseUp, true);
    document.body.addEventListener('mousemove', this.handleMouseMove, true);
    document.body.addEventListener('mouseup', this.handleMouseUp, true);
  }

  stopResizing() {
    this.resizing = false;
    this.resizeMode = null;
    this.dataGrid.node.parentElement.removeEventListener('mouseup', this.handleMouseUp, true);
    document.body.removeEventListener('mousemove', this.handleMouseMove, true);
    document.body.removeEventListener('mouseup', this.handleMouseUp, true);

    this.setCursorStyle('auto');
  }

  isResizing() {
    return this.resizing;
  }

  shouldResizeDataGrid(event: MouseEvent): boolean {
    const { horizontal, vertical } = this.getDataGridResizeConfig(event);

    return vertical || horizontal;
  }

  setResizeMode(event: MouseEvent): void {
    const { horizontal, vertical } = this.getDataGridResizeConfig(event);

    if (!horizontal && !vertical) {
      this.setCursorStyle('auto');

      return;
    }

    if (vertical && horizontal) {
      this.resizeMode = 'both';
      this.setCursorStyle('nwse-resize');

      return;
    }

    this.resizeMode = vertical ? 'v' : 'h';
    this.setCursorStyle(vertical ? 'ns-resize' : 'ew-resize');
  }

  setCursorStyle(cursor: 'auto' | 'ew-resize' | 'ns-resize' | 'nwse-resize') {
    document.body.classList.remove('cursor-ns-resize');
    document.body.classList.remove('cursor-ew-resize');
    document.body.classList.remove('cursor-nwse-resize');

    if (cursor !== 'auto') {
      document.body.classList.add(`cursor-${cursor}`);
    }
  }

  setSectionWidth(area, column: DataGridColumn, value: number): void {
    this.dataGrid.resizeColumn(column.getPosition().region, column.getPosition().value, value);
    column.setWidth(value);
  }

  fitViewport() {
    this.dataGrid && this.dataGrid.fit();
  }

  private fillEmptySpaceResizeFn(region: DataModel.ColumnRegion, value: number) {
    return (section) => {
      const column = this.dataGrid.columnManager.getColumnByPosition({
        value: section.index,
        region,
      });
      const minValue = this.getSectionWidth(column);
      const curValue = this.dataGrid.store.selectColumnWidth(column);

      this.setSectionWidth('column', column, curValue + value < minValue ? minValue : curValue + value);
    };
  }

  private getDataGridResizeConfig(event: MouseEvent): { vertical: boolean; horizontal: boolean } {
    const viewportRect = this.dataGrid.viewport.node.getBoundingClientRect();
    const verticalOffset = event.clientY - viewportRect.bottom - this.dataGrid.getHScrollBar().node.clientHeight;
    const horizontalOffset = event.clientX - viewportRect.right - this.dataGrid.getVScrollBar().node.clientWidth;
    const vertical = verticalOffset >= 0 && verticalOffset <= DEFAULT_RESIZE_SECTION_SIZE_IN_PX;
    const horizontal = horizontalOffset >= 0 && horizontalOffset <= DEFAULT_RESIZE_SECTION_SIZE_IN_PX;

    return { vertical, horizontal };
  }

  private handleMouseMove(event: MouseEvent): void {
    if (event.buttons !== 1) {
      return;
    }

    this.captureEvent(event);

    if (this.resizeMode === 'both' || this.resizeMode === 'h') {
      const width = this.getResizedWidth(event);

      this.dataGrid.node.style.width = `${width}px`;
      this.resizedHorizontally = true;
      this.fillEmptyDataGridSpace();
    }

    if (this.resizeMode === 'both' || this.resizeMode === 'v') {
      const height = this.getResizedHeight(event);

      this.dataGrid.rowManager.setRowsToShow(Math.round(height / this.dataGrid.defaultRowHeight) || 1);
    }
  }

  private getResizedWidth(event: MouseEvent): number {
    const width =
      this.resizeStartRect.width + event.clientX - this.resizeStartRect.x + 2 * DataGridStyle.DEFAULT_GRID_PADDING;

    return width < 2 * this.dataGrid.defaultColumnWidth ? 2 * this.dataGrid.defaultColumnWidth : Math.min(width, this.maxWidth);
  }

  private getResizedHeight(event: MouseEvent): number {
    const height = this.resizeStartRect.height + event.clientY - this.resizeStartRect.y;

    return height < this.dataGrid.defaultRowHeight ? this.dataGrid.defaultRowHeight : height;
  }

  private handleMouseUp(event: MouseEvent) {
    if (!this.isResizing()) {
      return;
    }

    this.captureEvent(event);
    this.setCursorStyle('auto');

    this.stopResizing();
  }

  private captureEvent(event: MouseEvent) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }

  private resizeSections(): void {
    this.dataGrid.columnManager.bodyColumns.forEach(this.resizeSectionWidth);
    this.dataGrid.columnManager.indexColumns.forEach(this.resizeSectionWidth);
  }

  private resizeSectionWidth(column): void {
    const position = column.getPosition();
    const value = this.dataGrid.store.selectColumnWidth(column);
    const area = position.region === 'row-header' ? 'row-header' : 'body';

    if (value === 0) {
      return this.setSectionWidth(area, column, this.getSectionWidth(column));
    }

    this.dataGrid.resizeColumn(area, position.value, value);
  }

  private resizeHeader(): void {
    let bodyColumnNamesWidths: number[] = [];
    let indexColumnNamesWidths: number[] = [];
    const headerFontSize = this.dataGrid.store.selectHeaderFontSize();
    const headerRowSize = isFinite(headerFontSize)
      ? headerFontSize + 2 * DEFAULT_ROW_PADDING
      : this.dataGrid.defaultRowHeight;

    if (this.dataGrid.store.selectHeadersVertical()) {
      const mapNameToWidth = (name) =>
        DataGridHelpers.getStringSize(name, this.dataGrid.store.selectHeaderFontSize()).width;

      bodyColumnNamesWidths = this.dataGrid.columnManager.bodyColumnNames.map(mapNameToWidth);
      indexColumnNamesWidths = this.dataGrid.columnManager.indexColumnNames.map(mapNameToWidth);
    }

    this.dataGrid.defaultColumnHeaderHeight = Math.max.apply(null, [
      ...bodyColumnNamesWidths,
      ...indexColumnNamesWidths,
      headerRowSize,
      DataGridStyle.DEFAULT_ROW_HEIGHT,
    ]);
  }

  private setBaseColumnSize() {
    this.dataGrid.defaultColumnWidth = DataGridStyle.MIN_COLUMN_WIDTH;
    this.dataGrid.defaultRowHeaderWidth = DataGridStyle.MIN_COLUMN_WIDTH;
  }

  private setBaseRowSize() {
    const dataFontSize = this.dataGrid.store.selectDataFontSize();

    this.dataGrid.defaultRowHeight = Number.isFinite(dataFontSize)
      ? dataFontSize + 2 * DEFAULT_ROW_PADDING
      : DataGridStyle.DEFAULT_ROW_HEIGHT;
  }

  private getSectionWidth(column): number {
    const fixedWidth = this.dataGrid.store.selectColumnWidth(column);
    const displayType = column.getDisplayType();

    if (displayType === ALL_TYPES.image) {
      return fixedWidth || 1;
    }

    if (displayType === ALL_TYPES.html && fixedWidth) {
      return fixedWidth;
    }

    return this.calculateSectionWidth(column);
  }

  private calculateSectionWidth(column: DataGridColumn) {
    const position = column.getPosition();
    const value = String(
      column.formatFn(
        this.dataGrid.cellManager.createCellConfig({
          region: position.region,
          value: column.longestStringValue || column.maxValue,
          column: position.value,
          row: 0,
        }),
      ),
    );
    const nameSize = DataGridHelpers.getStringSize(column.name, this.dataGrid.store.selectHeaderFontSize());
    const valueSize = DataGridHelpers.getStringSize(value, this.dataGrid.store.selectDataFontSize());
    const nameSizeProp = this.dataGrid.store.selectHeadersVertical() ? 'height' : 'width';

    nameSize.width += 4; // Add space for the menu
    const result = nameSize[nameSizeProp] > valueSize.width - 7 ? nameSize[nameSizeProp] : valueSize.width;

    return result > DataGridStyle.MIN_COLUMN_WIDTH ? result : DataGridStyle.MIN_COLUMN_WIDTH;
  }

  private installMessageHook() {
    MessageLoop.installMessageHook(this.dataGrid.viewport, this.viewportResizeMessageHook.bind(this));

    MessageLoop.installMessageHook(this.dataGrid.getHScrollBar(), this.hScrollBarMessageHook.bind(this));
    MessageLoop.installMessageHook(this.dataGrid.getVScrollBar(), this.vScrollBarMessageHook.bind(this));
  }

  private viewportResizeMessageHook(handler, msg) {
    if (msg.type === 'before-attach') {
      this.maxWidth = this.dataGrid.tableDisplayView.$el.width();
      return true;
    }

    if (msg.type === 'after-attach') {
      const robs = new ResizeObserver((entries) => {
        this.maxWidth = this.calculateMaxWidth(entries[0].contentRect.width);
        this.updateWidgetWidth();
      });
      robs.observe(this.dataGrid.tableDisplayView.$el.parents('.jp-OutputArea-child, .output_area')[0]);
    }

    if (!this.dataGrid || handler !== this.dataGrid.viewport) {
      return true;
    }

    if (msg.type === 'resize') {
      setTimeout(() => {
        this.dataGrid && this.dataGrid['_syncViewport']();
      });
    }

    if (msg.type === 'column-resize-request') {
      this.dataGrid.getColumnSections()['_sections'].forEach(this.updateColumnWidth('body'));
      this.dataGrid.getRowHeaderSections()['_sections'].forEach(this.updateColumnWidth('row-header'));
      this.updateWidgetWidth();
      this.updateWidgetHeight();
    }

    return true;
  }

  private hScrollBarMessageHook(handler, msg) {
    if (msg.type === 'after-attach') {
      this.updateWidgetHeight();
      return true;
    }

    if (msg.type === 'after-show') {
      this.updateWidgetHeight(true);
      return true;
    }

    if (msg.type === 'after-hide') {
      this.updateWidgetHeight(false);
      return true;
    }

    return true;
  }

  private vScrollBarMessageHook(handler, msg) {
    if (msg.type === 'after-attach') {
      this.updateWidgetWidth();
      return true;
    }

    if (msg.type === 'after-show') {
      this.updateWidgetWidth(true);
      return true;
    }

    if (msg.type === 'after-hide') {
      this.updateWidgetWidth(false);
      return true;
    }

    return true;
  }

  private calculateMaxWidth(width: number): number {
    const outputEl = this.dataGrid.tableDisplayView.$el.parents('.jp-OutputArea-child, .output_area');
    const maxWidth = outputEl.width() - outputEl.find('.jp-OutputArea-prompt, .prompt').width();
    return Math.min(width, maxWidth);
  }
}
