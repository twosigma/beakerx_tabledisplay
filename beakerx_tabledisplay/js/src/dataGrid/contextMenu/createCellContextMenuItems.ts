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

import { IContextMenuItem } from '../../contextMenu';
import { BeakerXDataGrid } from '../BeakerXDataGrid';
import { ColumnManager } from '../column/ColumnManager';
import { DataGridContextMenu } from './DataGridContextMenu';
import { ContextMenuClickMessage } from '../message/ContextMenuClickMessage';
import { ActionDetailsMessage } from '../message/ActionDetailsMessage';

export function createCellContextMenuItems(
  dataGrid: BeakerXDataGrid,
  contextMenu: DataGridContextMenu,
): IContextMenuItem[] {
  const selector = `#${dataGrid.wrapperId} canvas`;
  const contextMenuItems = dataGrid.store.selectContextMenuItems();
  const contextMenuTags = dataGrid.store.selectContextMenuTags();
  const isVisible = () => {
    const data = dataGrid.getCellData(contextMenu.event.clientX, contextMenu.event.clientY);

    if (!data || data.offsetTop < dataGrid.headerHeight) {
      return false;
    }

    return true;
  };

  function createFromModelContextMenuItems(): IContextMenuItem[] {
    return contextMenuItems.map((item: string) => ({
      selector,
      isVisible,
      id: `${item}_${dataGrid.wrapperId}`,
      title: item,
      action: (event) => {
        const data = dataGrid.getCellData(event.clientX, event.clientY);

        if (!data) {
          return;
        }

        dataGrid.commSignal.emit(
          new ContextMenuClickMessage(
            dataGrid.rowManager.getRow(data.row).index,
            dataGrid.store.selectColumnIndexByPosition(ColumnManager.createPositionFromCell(data)),
            item,
          ),
        );
      },
    }));
  }

  function createFromModelContextMenuTags(): IContextMenuItem[] {
    const items: IContextMenuItem[] = [];

    Object.keys(contextMenuTags).forEach((name) => {
      const tag = contextMenuTags[name];

      items.push({
        selector,
        isVisible,
        id: `${tag}_${dataGrid.wrapperId}`,
        title: name,
        action: function (event) {
          const data = dataGrid.getCellData(event.clientX, event.clientY);

          if (!data) {
            return;
          }

          dataGrid.commSignal.emit(
            new ActionDetailsMessage(
              'CONTEXT_MENU_CLICK',
              dataGrid.rowManager.getRow(data.row).index,
              dataGrid.store.selectColumnIndexByPosition(ColumnManager.createPositionFromCell(data)),
              name,
            ),
          );
        },
      });
    });

    return items;
  }

  return [...createFromModelContextMenuItems(), ...createFromModelContextMenuTags()];
}
