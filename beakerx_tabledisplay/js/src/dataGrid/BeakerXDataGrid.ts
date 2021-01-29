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

import { CellRenderer, DataGrid, DataModel } from '@lumino/datagrid';
import { SectionList } from '@lumino/datagrid/types/sectionlist';
import { Signal } from '@lumino/signaling';
import { Widget, ScrollBar } from '@lumino/widgets';
import { TableDisplayView } from '../TableDisplayView';
import { TableDisplayWidget } from '../TableDisplayWidget';
import { CommonUtils, Theme } from '../utils';
import { CellFocusManager } from './cell/CellFocusManager';
import { CellManager } from './cell/CellManager';
import { CellRendererFactory } from './cell/CellRendererFactory';
import { CellSelectionManager } from './cell/CellSelectionManager';
import { CellTooltipManager } from './cell/CellTooltipManager';
import { DataGridCell } from './cell/DataGridCell';
import { ColumnManager } from './column/ColumnManager';
import { ColumnPosition } from './column/ColumnPosition';
import { DataGridColumn } from './column/DataGridColumn';
import { DataGridResize } from './DataGridResize';
import { MouseEventManager, KeyEventManager } from './event/EventManager';
import { DataGridHelpers } from './Helpers';
import { HighlighterManager } from './highlighter/HighlighterManager';
import { ICellData } from './interface/ICell';
import { IDataGridModelState } from './interface/IDataGridModelState';
import { BeakerXDataGridModel } from './model/BeakerXDataGridModel';
import { RowManager } from './row/RowManager';
import { BeakerXDataStore } from './store/BeakerXDataStore';
import { ActionDetailsMessage } from './message/ActionDetailsMessage';
import { DoubleClickMessage } from './message/DoubleClickMessage';
import { ContextMenuClickMessage } from './message/ContextMenuClickMessage';
import { getTypeByName } from './dataTypes';

declare global {
  interface Window {
    beakerx: any;
  }
}

export class BeakerXDataGrid extends DataGrid {
  id: string;
  store: BeakerXDataStore;
  dataModel: BeakerXDataGridModel;
  highlighterManager: HighlighterManager;
  columnManager: ColumnManager;
  columnPosition: ColumnPosition;
  rowManager: RowManager;
  cellSelectionManager: CellSelectionManager;
  cellManager: CellManager;
  cellFocusManager: CellFocusManager;
  cellTooltipManager: CellTooltipManager;
  dataGridResize: DataGridResize;
  focused: boolean;
  wrapperId: string;
  tableDisplayView: TableDisplayWidget & TableDisplayView;

  cellHovered = new Signal<this, { data: ICellData | null; event: MouseEvent }>(this);
  commSignal = new Signal<this, ActionDetailsMessage | DoubleClickMessage | ContextMenuClickMessage>(this);

  static FOCUS_CSS_CLASS = 'bko-focused';

  constructor(
    options: DataGrid.IOptions,
    dataStore: BeakerXDataStore,
    tableDisplayView: TableDisplayWidget & TableDisplayView,
  ) {
    super(options);

    this.tableDisplayView = tableDisplayView;
    this.resize = DataGridHelpers.throttle(this.resize, 150, this);
    this.init(dataStore);
  }

  init(store: BeakerXDataStore) {
    this.id = 'grid_' + CommonUtils.generateId(6);
    this.store = store;
    this.columnManager = new ColumnManager(this);
    this.columnPosition = new ColumnPosition(this);
    this.rowManager = new RowManager(
      store,
      store.selectHasIndex(),
      this.columnManager,
      store.selectRowsToShow(),
    );
    this.cellSelectionManager = new CellSelectionManager(this);
    this.cellManager = new CellManager(this);
    this.mouseHandler = new MouseEventManager(this);
    this.keyHandler = new KeyEventManager();
    this.cellFocusManager = new CellFocusManager(this);
    this.cellTooltipManager = new CellTooltipManager(this);
    this.dataGridResize = new DataGridResize(this);
    this.dataModel = new BeakerXDataGridModel(store, this.columnManager, this.rowManager);
    this.focused = false;
    this.columnManager.addColumns();
    this.rowManager.createFilterExpressionVars();
    this.store.store.changed.connect(DataGridHelpers.throttle<void, void>(this.handleStateChanged, 100, this));

    this.dataGridResize.setInitialSize();
    this.addHighlighterManager();
    this.addCellRenderers();

    this.columnManager.createColumnMenus();
  }

  scrollTo(x: number, y: number): void {
    super.scrollTo(x, y);
    if (this.tableDisplayView.canLoadMore() && this.maxScrollY <= y) {
      this.tableDisplayView.loadMoreRows();
    }
  }

  getColumn(config: CellRenderer.CellConfig): DataGridColumn {
    return this.columnManager.getColumn(config);
  }

  getColumnByName(columnName: string): DataGridColumn | undefined {
    return this.columnManager.getColumnByName(columnName);
  }

  getCellData(clientX: number, clientY: number): ICellData | null {
    return DataGridCell.getCellData(this, clientX, clientY);
  }

  getColumnOffset(position: number, region: DataModel.ColumnRegion): number {
    if (region === 'row-header') {
      return this.rowHeaderSections.offsetOf(position);
    }

    return this.rowHeaderSections.length + this.columnSections.offsetOf(position);
  }

  getRowOffset(row: number) {
    return this.rowSections.offsetOf(row);
  }

  updateModelData(state: IDataGridModelState) {
    this.dataModel.updateData(state);
    this.columnManager.recalculateMinMaxValues();
    this.dataGridResize.setInitialSize();
    this.addHighlighterManager();
  }

  updateModelValues(state: IDataGridModelState) {
    this.dataModel.updateValues(state);
    this.columnManager.recalculateMinMaxValues();
    this.dataGridResize.setInitialSize();
  }

  setWrapperId(id: string) {
    this.wrapperId = id;
  }

  setInitialSize() {
    this.dataGridResize.setInitialSize();
  }

  resize(): void {
    this.dataGridResize && this.dataGridResize.resize();
  }

  setFocus(focus: boolean) {
    this.focused = focus;

    try {
      window.beakerx.tableFocused = this.focused;
      // eslint-disable-next-line no-empty
    } catch (e) {}

    if (focus) {
      this.node.focus();
      DataGridHelpers.disableKeyboardManager();
      this.node.classList.add(BeakerXDataGrid.FOCUS_CSS_CLASS);

      return;
    }

    this.cellHovered.emit({ data: null, event: null });
    this.cellTooltipManager.hideTooltips();
    this.columnManager.blurColumnFilterInputs();
    this.columnManager.closeAllMenus();
    this.node.classList.remove(BeakerXDataGrid.FOCUS_CSS_CLASS);
    DataGridHelpers.enableKeyboardManager();
  }

  destroy() {
    this.dataModel && this.dataModel.destroy();
    this.columnManager.destroy();
    this.columnPosition.destroy();
    this.cellFocusManager.destroy();
    this.cellManager.destroy();
    this.cellSelectionManager.destroy();
    this.cellTooltipManager.destroy();
    this.highlighterManager.destroy();
    this.dataGridResize.destroy();
    this.rowManager.destroy();

    Signal.disconnectAll(this);

    setTimeout(() => {
      this.cellSelectionManager = null;
      this.cellTooltipManager = null;
      this.highlighterManager = null;
      this.cellFocusManager = null;
      this.dataGridResize = null;
      this.columnPosition = null;
      this.columnManager = null;
      this.cellManager = null;
      this.rowManager = null;
      this.store = null;
    });
  }

  onAfterAttach(msg) {
    super.onAfterAttach(msg);

    this.columnManager.bodyColumns.forEach((column) => column.columnFilter.attach(this.viewport.node));
    this.columnManager.indexColumns.forEach((column) => column.columnFilter.attach(this.viewport.node));
  }

  messageHook(handler, msg) {
    super.messageHook(handler, msg);

    if (handler !== this.viewport) {
      return true;
    }

    if (msg.type === 'paint-request' && this.columnPosition.dropCellData) {
      this.colorizeColumnBorder(this.columnPosition.dropCellData, Theme.DEFAULT_HIGHLIGHT_COLOR);
    }

    return true;
  }

  colorizeColumnBorder(data: ICellData, color: string) {
    const { column, region } = data;
    const sectionList =
      region === 'corner-header' || region === 'row-header' ? this.rowHeaderSections : this.columnSections;
    const sectionSize = sectionList.sizeOf(column);
    const sectionOffset = sectionList.offsetOf(column);
    let x = sectionOffset;
    const height = this.totalHeight;

    if (data.delta > data.width / 2) {
      x += sectionSize;
    }

    if (region !== 'corner-header' && region !== 'row-header') {
      x = x + this.rowHeaderSections.length - this.scrollX;
    }

    this.canvasGC.beginPath();
    this.canvasGC.lineWidth = 3;

    this.canvasGC.moveTo(x - 0.5, 0);
    this.canvasGC.lineTo(x - 0.5, height);
    this.canvasGC.strokeStyle = color;
    this.canvasGC.stroke();
  }

  set defaultRowHeight (rowHeight: number) {
    const oldDefaultSizes = this.defaultSizes;
    const newDefaultSizes: DataGrid.DefaultSizes = {
      rowHeight,
      columnWidth: oldDefaultSizes.columnWidth,
      rowHeaderWidth: oldDefaultSizes.rowHeaderWidth,
      columnHeaderHeight: oldDefaultSizes.columnHeaderHeight
    }

    this.defaultSizes = newDefaultSizes;
  }

  get defaultRowHeight () : number {
    return this.defaultSizes.rowHeight;
  }

  set defaultColumnWidth (columnWidth: number) {
    const oldDefaultSizes = this.defaultSizes;
    const newDefaultSizes: DataGrid.DefaultSizes = {
      rowHeight: oldDefaultSizes.rowHeight,
      columnWidth,
      rowHeaderWidth: oldDefaultSizes.rowHeaderWidth,
      columnHeaderHeight: oldDefaultSizes.columnHeaderHeight
    }

    this.defaultSizes = newDefaultSizes;
  }

  get defaultColumnWidth () : number {
    return this.defaultSizes.columnWidth;
  }

  set defaultRowHeaderWidth (rowHeaderWidth: number) {
    const oldDefaultSizes = this.defaultSizes;
    const newDefaultSizes: DataGrid.DefaultSizes = {
      rowHeight: oldDefaultSizes.rowHeight,
      columnWidth: oldDefaultSizes.columnWidth,
      rowHeaderWidth,
      columnHeaderHeight: oldDefaultSizes.columnHeaderHeight
    }

    this.defaultSizes = newDefaultSizes;
  }

  get defaultRowHeaderWidth () : number {
    return this.defaultSizes.rowHeaderWidth;
  }

  set defaultColumnHeaderHeight (columnHeaderHeight: number) {
    const oldDefaultSizes = this.defaultSizes;
    const newDefaultSizes: DataGrid.DefaultSizes = {
      rowHeight: oldDefaultSizes.rowHeight,
      columnWidth: oldDefaultSizes.columnWidth,
      rowHeaderWidth: oldDefaultSizes.rowHeaderWidth,
      columnHeaderHeight
    }

    this.defaultSizes = newDefaultSizes;
  }

  get defaultColumnHeaderHeight () : number {
    return this.defaultSizes.columnHeaderHeight;
  }

  getHScrollBar() : ScrollBar {
    return this["_hScrollBar"];
  }

  getVScrollBar() : ScrollBar {
    return this["_vScrollBar"];
  }

  private addHighlighterManager() {
    this.highlighterManager = new HighlighterManager(this);
  }

  private addCellRenderers() {
    const defaultRenderer = CellRendererFactory.getRenderer(this);
    const headerCellRenderer = CellRendererFactory.getHeaderRenderer(this);

    this.cellRenderers.update({
      'body': config => CellRendererFactory.getRenderer(this, getTypeByName(config.metadata['dataType'])),
      'column-header': headerCellRenderer,
      'corner-header': headerCellRenderer,
      'row-header': defaultRenderer
    })
  }

  private handleStateChanged() {
    this.dataModel && this.dataModel.reset();
  }

  public getColumnSections(): SectionList {
    return super.columnSections;
  }

  public getColumnHeaderSections(): SectionList {
    return super.columnHeaderSections;
  }

  public getRowHeaderSections(): SectionList {
    return super.rowHeaderSections;
  }

  public getRowSections(): SectionList {
    return super.rowSections;
  }

  public getViewport(): Widget {
    return super.viewport;
  }

  public repaintBody() {
    this.repaintContent();
  }

  public repaintRegion(region: DataModel.CellRegion, r1: number, c1: number, r2: number, c2: number) {
    super.repaintRegion(region, r1, c1, r2, c2);
  }
}
