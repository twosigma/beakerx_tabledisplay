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

import { DataGridColumn } from '../column/DataGridColumn';
import { ALL_TYPES, getAllowedTypesByType } from '../dataTypes';
import { IContextMenuItem } from '../../contextMenu';
import { scopeData, TIME_UNIT_FORMATS } from '../consts';

export function createFormatMenuItems(column: DataGridColumn): IContextMenuItem[] {
  const types = getAllowedTypesByType(column.getDataType());
  let items: IContextMenuItem[] = [];

  if (!column.dataGrid) {
    return [];
  }

  types.forEach((obj) => {
    if (obj.type === 8) {
      //datetime
      items = items.concat(createTimeSubmenuItems());

      return;
    }

    const item: IContextMenuItem = {
      title: obj.name,
      id: `format_${obj.name}`,
      isChecked: (column) => column && column.getDisplayType() === obj.type,
      selector: '',
    };

    if (obj.type === 4) {
      //double with precision
      item.items = createPrecisionSubmenuItems();
    } else {
      item.action = (event, column) => column?.setDisplayType(obj.type);
    }
    items.push(item);
  });

  return items;
}

export function createPrecisionSubmenuItems(): IContextMenuItem[] {
  const items: IContextMenuItem[] = [];

  scopeData.allPrecissions.forEach((precision) => {
    const item: IContextMenuItem = {
      title: `${precision}`,
      id: `precision_${precision}`,
      isChecked: (column) => `4.${precision}` === column.getDisplayType(),
      action: (event, column) => column?.setDisplayType(`4.${precision}`),
      selector: '',
    };

    items.push(item);
  });

  return items;
}

export function createTimeSubmenuItems(): IContextMenuItem[] {
  const items: IContextMenuItem[] = [];

  Object.keys(TIME_UNIT_FORMATS).forEach((key) => {
    const item: IContextMenuItem = {
      title: TIME_UNIT_FORMATS[key].title,
      id: `timeunit_${TIME_UNIT_FORMATS[key].title}`,
      isChecked: (column) => {
        const displayType = column && column.getDisplayType();

        return (
          (displayType === ALL_TYPES.datetime || displayType === ALL_TYPES.time) &&
          TIME_UNIT_FORMATS[key].format === column.getFormatForTimes().format &&
          TIME_UNIT_FORMATS[key].valueModifier === column.getFormatForTimes().valueModifier
        );
      },
      action: (event, column) => column?.setTimeDisplayType(TIME_UNIT_FORMATS[key]),
      selector: '',
    };

    items.push(item);
  });

  return items;
}
