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

import { RendererMap } from '@lumino/datagrid';
import { Widget } from '@lumino/widgets';
import { TableDisplayView } from '../TableDisplayView';
import { Theme } from '../utils/Theme';
import { BeakerXDataGrid } from './BeakerXDataGrid';
import { DataGridContextMenu } from './contextMenu/DataGridContextMenu';
import { IDataGridModelState } from './interface/IDataGridModelState';
import IDataGridScopeOptions from './interface/IDataGridScopeOptions';
import { ColumnLimitModal } from './modal/ColumnLimitModal';
import { BeakerXDataStore } from './store/BeakerXDataStore';

export class DataGridScope {
  contextMenu: DataGridContextMenu;

  private element: HTMLElement;
  private store: BeakerXDataStore;
  protected _dataGrid: BeakerXDataGrid;
  private tableDisplayModel: any;
  private tableDisplayView: TableDisplayView;

  public get dataGrid(): BeakerXDataGrid {
    return this._dataGrid;
  }

  constructor(options: IDataGridScopeOptions) {
    if (Object.keys(options.data).length === 0 && options.data.constructor === Object) {
      throw new Error('options.data can not be empty');
    }
    this.store = new BeakerXDataStore(options.data);
    this.element = options.element;
    this.tableDisplayModel = options.widgetModel;
    this.tableDisplayView = options.widgetView;
    Theme.updateStyle();
    this._dataGrid = new BeakerXDataGrid(
      {
        style: Theme.getStyle(),
        cellRenderers: new RendererMap({ /*priority: ['body|{dataType: html}', 'body|']*/ }),
      },
      this.store,
      this.tableDisplayView,
    );
    this.element.id = `wrap_${this.tableDisplayModel.model_id}`;

    this.dataGrid.setWrapperId(this.element.id);
    this.connectToCommSignal();
    this.createContextMenu();
    this.initColumnLimitModal();
  }

  get state() : IDataGridModelState {
    return this.store.selectModel();
  }

  render(): void {
    Widget.attach((this.dataGrid as unknown) as Widget, this.element); // todo investigate
  }

  doDestroy(): void {
    this.dataGrid.destroy();
    this.contextMenu.destroy();

    setTimeout(() => {
      this._dataGrid = null;
      this.store = null;
    });
  }

  updateModelData(newData) {
    this.dataGrid.updateModelData(newData);
  }

  updateModelValues(newData) {
    this.dataGrid.updateModelValues(newData);
  }

  doResetAll() {
    this.dataGrid.highlighterManager.removeHighlighters();
    this.dataGrid.cellSelectionManager.clear();
    this.dataGrid.rowManager.resetSorting();
    this.dataGrid.columnManager.resetFilters();
    this.dataGrid.columnManager.showAllColumns();
    this.dataGrid.columnManager.resetColumnsAlignment();
    this.dataGrid.columnManager.resetColumnPositions();
  }

  connectToCommSignal() {
    this.dataGrid.commSignal.connect((handler, args) => {
      this.tableDisplayModel.send(args.toObject(), this.tableDisplayView.callbacks());
    }, this);
  }

  createContextMenu() {
    this.contextMenu = new DataGridContextMenu(this);
  }

  initColumnLimitModal() {
    return new ColumnLimitModal(this.dataGrid, this.element);
  }

  setInitialSize() {
    this.dataGrid.setInitialSize();
  }

  computeCSSVariablesAndRedraw() {
    Theme.updateStyle();
    this.dataGrid.style = Theme.getStyle();
  }
}
